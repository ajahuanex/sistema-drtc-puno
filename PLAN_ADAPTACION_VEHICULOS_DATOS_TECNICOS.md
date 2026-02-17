# PLAN DE ADAPTACIÓN: MÓDULO DE VEHÍCULOS CON DATOS TÉCNICOS SEPARADOS

**Fecha:** 16 de febrero de 2026  
**Objetivo:** Adaptar el módulo de vehículos para trabajar con datos técnicos en módulo independiente

---

## 📋 ARQUITECTURA ACTUAL

### **Separación de Responsabilidades**

```
┌─────────────────────────────────────────────────────────────┐
│                    MÓDULO DE VEHÍCULOS                       │
│  (Datos Administrativos - Collection: vehiculos)             │
├─────────────────────────────────────────────────────────────┤
│ - placa                                                      │
│ - empresaActualId                                            │
│ - resolucionId                                               │
│ - tipoServicio                                               │
│ - rutasAsignadasIds                                          │
│ - estado (ACTIVO, INACTIVO, etc.)                           │
│ - sedeRegistro                                               │
│ - vehiculoDataId ← REFERENCIA A DATOS TÉCNICOS              │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    (Relación 1:1)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              MÓDULO DE DATOS TÉCNICOS                        │
│  (VehiculoSolo - Collection: vehiculos_solo)                 │
├─────────────────────────────────────────────────────────────┤
│ - placa_actual                                               │
│ - vin (VIN único)                                            │
│ - marca, modelo, version                                     │
│ - anio_fabricacion, anio_modelo                             │
│ - categoria (M1, M2, M3, N1, N2, N3)                        │
│ - carroceria, color                                          │
│ - combustible                                                │
│ - numero_asientos, numero_pasajeros                         │
│ - numero_ejes, numero_ruedas                                │
│ - peso_seco, peso_bruto, carga_util                         │
│ - dimensiones (longitud, ancho, altura)                     │
│ - motor (cilindrada, potencia, transmision)                 │
│ - numero_serie, numero_motor                                │
│ - estado_fisico                                              │
│ - historial_placas (relación)                               │
│ - propietarios (relación)                                    │
│ - inspecciones (relación)                                    │
│ - seguros (relación)                                         │
│ - documentos (relación)                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 CAMBIOS NECESARIOS

### **1. Backend - Servicios**


#### **A. Servicio de Vehículos (vehiculo_service.py)**

**Cambios requeridos:**

```python
# ANTES (datos técnicos embebidos)
async def create_vehiculo(self, vehiculo_data: VehiculoCreate) -> VehiculoInDB:
    vehiculo_dict = vehiculo_data.model_dump()
    vehiculo_dict["datosTecnicos"] = {
        "motor": vehiculo_data.numeroMotor,
        "chasis": vehiculo_data.numeroChasis,
        # ... más campos
    }
    
# DESPUÉS (referencia a VehiculoData)
async def create_vehiculo(self, vehiculo_data: VehiculoCreate) -> VehiculoInDB:
    # 1. Validar que vehiculoDataId existe
    if not vehiculo_data.vehiculoDataId:
        raise ValidationError("vehiculoDataId es requerido")
    
    vehiculo_solo = await self.vehiculos_solo_collection.find_one(
        {"_id": ObjectId(vehiculo_data.vehiculoDataId)}
    )
    if not vehiculo_solo:
        raise ValidationError("VehiculoData no encontrado")
    
    # 2. Crear vehículo solo con datos administrativos
    vehiculo_dict = {
        "placa": vehiculo_data.placa,
        "vehiculoDataId": vehiculo_data.vehiculoDataId,
        "empresaActualId": vehiculo_data.empresaActualId,
        "tipoServicio": vehiculo_data.tipoServicio,
        # ... solo campos administrativos
    }
    
    # 3. Insertar
    result = await self.collection.insert_one(vehiculo_dict)
    return await self.get_vehiculo(str(result.inserted_id))
```

#### **B. Método para Obtener Vehículo Completo**

```python
async def get_vehiculo_completo(self, vehiculo_id: str) -> VehiculoResponse:
    """
    Obtiene vehículo con datos técnicos completos
    """
    # 1. Obtener datos administrativos
    vehiculo = await self.collection.find_one({"_id": ObjectId(vehiculo_id)})
    if not vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    # 2. Obtener datos técnicos
    datos_tecnicos = None
    if vehiculo.get("vehiculoDataId"):
        vehiculo_solo = await self.vehiculos_solo_collection.find_one(
            {"_id": ObjectId(vehiculo["vehiculoDataId"])}
        )
        if vehiculo_solo:
            datos_tecnicos = {
                "marca": vehiculo_solo.get("marca"),
                "modelo": vehiculo_solo.get("modelo"),
                "anioFabricacion": vehiculo_solo.get("anio_fabricacion"),
                "categoria": vehiculo_solo.get("categoria"),
                "motor": vehiculo_solo.get("numero_motor"),
                "chasis": vehiculo_solo.get("numero_serie"),
                "asientos": vehiculo_solo.get("numero_asientos"),
                # ... más campos
            }
    
    # 3. Combinar datos
    vehiculo["id"] = str(vehiculo.pop("_id"))
    vehiculo["datosTecnicos"] = datos_tecnicos
    
    return VehiculoResponse(**vehiculo)
```

---

### **2. Backend - Routers**

#### **A. Endpoint de Creación**

```python
@router.post("/", response_model=VehiculoResponse, status_code=201)
async def create_vehiculo(
    vehiculo_data: VehiculoCreate,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
):
    """
    Crear vehículo - Requiere vehiculoDataId existente
    """
    # Validar que vehiculoDataId existe
    if not vehiculo_data.vehiculoDataId:
        raise HTTPException(
            status_code=400,
            detail="vehiculoDataId es requerido. Primero cree el VehiculoData."
        )
    
    vehiculo = await vehiculo_service.create_vehiculo(vehiculo_data)
    return vehiculo
```

#### **B. Endpoint de Listado con Datos Técnicos**

```python
@router.get("/", response_model=List[VehiculoResponse])
async def get_vehiculos(
    skip: int = 0,
    limit: int = 100,
    incluir_datos_tecnicos: bool = True,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
):
    """
    Listar vehículos con opción de incluir datos técnicos
    """
    if incluir_datos_tecnicos:
        vehiculos = await vehiculo_service.get_vehiculos_completos(skip, limit)
    else:
        vehiculos = await vehiculo_service.get_vehiculos(skip, limit)
    
    return vehiculos
```

---

### **3. Frontend - Modelos**

#### **A. Modelo de Vehículo (vehiculo.model.ts)**

```typescript
// ANTES
export interface Vehiculo {
  id: string;
  placa: string;
  marca?: string;
  modelo?: string;
  anioFabricacion?: number;
  datosTecnicos?: DatosTecnicos;
  // ...
}

// DESPUÉS
export interface Vehiculo {
  id: string;
  placa: string;
  vehiculoDataId: string;  // ← NUEVO: Referencia a datos técnicos
  empresaActualId: string;
  tipoServicio: string;
  resolucionId?: string;
  rutasAsignadasIds: string[];
  estado: EstadoVehiculo;
  sedeRegistro: string;
  // ... solo campos administrativos
  
  // Datos técnicos (cargados bajo demanda)
  datosTecnicos?: VehiculoData;
}

export interface VehiculoData {
  id: string;
  placaActual: string;
  vin: string;
  marca: string;
  modelo: string;
  version?: string;
  anioFabricacion: number;
  anioModelo: number;
  categoria: CategoriaVehiculo;
  carroceria: TipoCarroceria;
  color: string;
  combustible: TipoCombustible;
  numeroAsientos: number;
  numeroPasajeros: number;
  numeroEjes: number;
  numeroRuedas: number;
  pesoSeco: number;
  pesoBruto: number;
  cargaUtil: number;
  dimensiones: {
    longitud?: number;
    ancho?: number;
    altura?: number;
  };
  motor: {
    cilindrada: number;
    potencia?: number;
    transmision?: string;
    traccion?: string;
  };
  numeroSerie: string;
  numeroMotor: string;
  estadoFisico: EstadoFisicoVehiculo;
  // ... más campos
}
```

---

### **4. Frontend - Servicios**

#### **A. Servicio de Vehículos (vehiculo.service.ts)**

```typescript
@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private apiUrl = `${environment.apiUrl}/vehiculos`;
  
  constructor(private http: HttpClient) {}
  
  // Obtener vehículos con datos técnicos
  getVehiculos(incluirDatosTecnicos: boolean = true): Observable<Vehiculo[]> {
    const params = new HttpParams()
      .set('incluir_datos_tecnicos', incluirDatosTecnicos.toString());
    
    return this.http.get<Vehiculo[]>(this.apiUrl, { params });
  }
  
  // Obtener vehículo completo
  getVehiculoCompleto(id: string): Observable<Vehiculo> {
    return this.http.get<Vehiculo>(`${this.apiUrl}/${id}`);
  }
  
  // Crear vehículo (requiere vehiculoDataId)
  createVehiculo(vehiculo: VehiculoCreate): Observable<Vehiculo> {
    if (!vehiculo.vehiculoDataId) {
      return throwError(() => new Error('vehiculoDataId es requerido'));
    }
    return this.http.post<Vehiculo>(this.apiUrl, vehiculo);
  }
}
```

#### **B. Servicio de Datos Técnicos (vehiculo-data.service.ts)**

```typescript
@Injectable({
  providedIn: 'root'
})
export class VehiculoDataService {
  private apiUrl = `${environment.apiUrl}/vehiculos-data`;
  
  constructor(private http: HttpClient) {}
  
  // Buscar por placa
  buscarPorPlaca(placa: string): Observable<VehiculoData | null> {
    return this.http.get<VehiculoData>(`${this.apiUrl}/buscar/${placa}`);
  }
  
  // Crear datos técnicos
  createVehiculoData(data: VehiculoDataCreate): Observable<VehiculoData> {
    return this.http.post<VehiculoData>(this.apiUrl, data);
  }
  
  // Actualizar datos técnicos
  updateVehiculoData(id: string, data: VehiculoDataUpdate): Observable<VehiculoData> {
    return this.http.put<VehiculoData>(`${this.apiUrl}/${id}`, data);
  }
}
```

---

### **5. Frontend - Componentes**

#### **A. Modal de Creación (vehiculo-modal.component.ts)**

```typescript
export class VehiculoModalComponent implements OnInit {
  // Paso 1: Buscar o crear datos técnicos
  paso1Form = this.fb.group({
    placa: ['', Validators.required],
    buscarExistente: [true]
  });
  
  // Paso 2: Datos administrativos
  paso2Form = this.fb.group({
    empresaActualId: ['', Validators.required],
    tipoServicio: ['', Validators.required],
    resolucionId: [''],
    sedeRegistro: ['PUNO', Validators.required]
  });
  
  vehiculoDataId = signal<string>('');
  pasoActual = signal<1 | 2>(1);
  
  async onBuscarPlaca() {
    const placa = this.paso1Form.get('placa')?.value;
    
    // Buscar si ya existe en VehiculoData
    this.vehiculoDataService.buscarPorPlaca(placa).subscribe({
      next: (vehiculoData) => {
        if (vehiculoData) {
          // Ya existe, usar ese ID
          this.vehiculoDataId.set(vehiculoData.id);
          this.pasoActual.set(2);
        } else {
          // No existe, abrir modal para crear datos técnicos
          this.abrirModalDatosTecnicos(placa);
        }
      }
    });
  }
  
  abrirModalDatosTecnicos(placa: string) {
    const dialogRef = this.dialog.open(VehiculoDataModalComponent, {
      data: { placa }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result?.vehiculoDataId) {
        this.vehiculoDataId.set(result.vehiculoDataId);
        this.pasoActual.set(2);
      }
    });
  }
  
  onSubmit() {
    const vehiculoData: VehiculoCreate = {
      placa: this.paso1Form.get('placa')?.value!,
      vehiculoDataId: this.vehiculoDataId(),
      empresaActualId: this.paso2Form.get('empresaActualId')?.value!,
      tipoServicio: this.paso2Form.get('tipoServicio')?.value!,
      resolucionId: this.paso2Form.get('resolucionId')?.value,
      sedeRegistro: this.paso2Form.get('sedeRegistro')?.value!,
      rutasAsignadasIds: [],
      estado: 'ACTIVO'
    };
    
    this.vehiculoService.createVehiculo(vehiculoData).subscribe({
      next: () => {
        this.snackBar.open('Vehículo creado exitosamente', 'Cerrar');
        this.dialogRef.close(true);
      }
    });
  }
}
```

---

## 🔄 FLUJO DE TRABAJO ACTUALIZADO

### **Crear Vehículo Nuevo**

```
1. Usuario: Ingresa placa
2. Sistema: Busca placa en VehiculoData
3a. Si existe:
    - Mostrar datos técnicos
    - Continuar con datos administrativos
3b. Si NO existe:
    - Abrir modal de datos técnicos
    - Crear VehiculoData
    - Obtener vehiculoDataId
    - Continuar con datos administrativos
4. Usuario: Completa datos administrativos
5. Sistema: Crea Vehiculo con vehiculoDataId
6. Sistema: Actualiza empresa y resolución
7. Sistema: Muestra éxito
```

### **Editar Vehículo**

```
1. Usuario: Click en editar
2. Sistema: Carga datos administrativos
3. Sistema: Carga datos técnicos (solo lectura)
4. Usuario: Modifica datos administrativos
5. Sistema: Actualiza solo datos administrativos
6. Nota: Para editar datos técnicos, ir al módulo VehiculoData
```

### **Ver Detalle de Vehículo**

```
1. Usuario: Click en ver detalle
2. Sistema: Carga datos administrativos
3. Sistema: Carga datos técnicos completos
4. Sistema: Muestra vista unificada
5. Usuario: Puede navegar a módulo de datos técnicos
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **Backend**

- [ ] Actualizar `vehiculo_service.py`
  - [ ] Método `create_vehiculo` con validación de vehiculoDataId
  - [ ] Método `get_vehiculo_completo` con join
  - [ ] Método `get_vehiculos_completos` con join masivo
  - [ ] Método `update_vehiculo` (solo administrativos)

- [ ] Actualizar `vehiculos_router.py`
  - [ ] Endpoint POST con validación vehiculoDataId
  - [ ] Endpoint GET con parámetro incluir_datos_tecnicos
  - [ ] Endpoint GET /{id} con datos completos
  - [ ] Documentación actualizada

- [ ] Crear `vehiculo_data_service.py`
  - [ ] CRUD completo de VehiculoData
  - [ ] Búsqueda por placa
  - [ ] Validación de VIN único

- [ ] Crear `vehiculo_data_router.py`
  - [ ] Endpoints CRUD
  - [ ] Endpoint de búsqueda
  - [ ] Endpoint de validación

### **Frontend**

- [ ] Actualizar modelos
  - [ ] `vehiculo.model.ts` con vehiculoDataId
  - [ ] Crear `vehiculo-data.model.ts`
  - [ ] Actualizar interfaces

- [ ] Actualizar servicios
  - [ ] `vehiculo.service.ts` con nuevos métodos
  - [ ] Crear `vehiculo-data.service.ts`

- [ ] Actualizar componentes
  - [ ] `vehiculo-modal.component.ts` con flujo de 2 pasos
  - [ ] Crear `vehiculo-data-modal.component.ts`
  - [ ] `vehiculo-detalle.component.ts` con datos técnicos
  - [ ] `vehiculos.component.ts` con carga de datos técnicos

- [ ] Actualizar templates
  - [ ] Modal de creación con pasos
  - [ ] Vista de detalle con tabs
  - [ ] Tabla con datos técnicos básicos

### **Migración de Datos**

- [ ] Script de migración
  - [ ] Extraer datos técnicos de vehículos existentes
  - [ ] Crear registros en VehiculoData
  - [ ] Actualizar vehículos con vehiculoDataId
  - [ ] Validar integridad referencial

---

## 📝 NOTAS IMPORTANTES

1. **Compatibilidad Legacy**: Los campos deprecated se mantienen temporalmente
2. **Validación**: vehiculoDataId es REQUERIDO para nuevos vehículos
3. **Performance**: Usar joins eficientes para listados
4. **Cache**: Implementar cache para datos técnicos frecuentes
5. **UI/UX**: Flujo de 2 pasos debe ser intuitivo

---

**Estado:** 📋 PLAN DEFINIDO - Listo para implementación
