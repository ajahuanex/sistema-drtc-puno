# 🚗 MÓDULO VEHICULO SOLO - DISEÑO ARQUITECTÓNICO

## 🎯 OBJETIVO
Crear un módulo independiente para gestionar datos vehiculares puros (técnicos y registrales), separado de la lógica administrativa.

---

## 📊 ARQUITECTURA DEL SISTEMA

### Separación de Responsabilidades

```
┌─────────────────────────────────────────────────────────────┐
│                    VEHICULO SOLO                            │
│              (Datos Vehiculares Puros)                      │
│                                                             │
│  - Datos técnicos                                           │
│  - Historial de placas                                      │
│  - Datos SUNARP                                             │
│  - Inspecciones técnicas                                    │
│  - Seguros                                                  │
│  - Propietarios registrales                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓ (consultado por)
┌─────────────────────────────────────────────────────────────┐
│                    VEHICULO (Actual)                        │
│              (Datos Administrativos)                        │
│                                                             │
│  - Empresa asignada                                         │
│  - Resolución administrativa                                │
│  - Rutas asignadas                                          │
│  - Estado administrativo                                    │
│  - TUC                                                      │
│  - Referencia a VehiculoSolo                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ MODELO DE DATOS

### 1. VehiculoSolo (Entidad Principal)


```typescript
interface VehiculoSolo {
  // Identificación
  id: string;
  placaActual: string;
  vin: string; // Vehicle Identification Number
  numeroSerie: string;
  numeroMotor: string;
  
  // Datos Técnicos
  marca: string;
  modelo: string;
  anioFabricacion: number;
  anioModelo: number;
  categoria: CategoriaVehiculo;
  clase: string;
  carroceria: TipoCarroceria;
  color: string;
  colorSecundario?: string;
  combustible: TipoCombustible;
  
  // Dimensiones y Capacidades
  numeroAsientos: number;
  numeroPasajeros: number;
  numeroEjes: number;
  numeroRuedas: number;
  pesoSeco: number; // kg
  pesoBruto: number; // kg
  cargaUtil: number; // kg
  longitud: number; // metros
  ancho: number; // metros
  altura: number; // metros
  
  // Motor
  cilindrada: number; // cc
  potencia: number; // HP
  numeroSerieLlantas?: string;
  
  // Origen
  paisOrigen: string;
  paisProcedencia: string;
  fechaImportacion?: Date;
  
  // Estado del Vehículo
  estadoFisico: EstadoFisicoVehiculo;
  kilometraje?: number;
  
  // Metadatos
  fechaCreacion: Date;
  fechaActualizacion: Date;
  creadoPor: string;
  actualizadoPor: string;
  fuenteDatos: FuenteDatos; // MANUAL, SUNARP, SUTRAN, etc.
  ultimaActualizacionExterna?: Date;
}
```


---

## 🔗 INTEGRACIÓN CON MÓDULO VEHICULO ACTUAL

### Modificación del Modelo Vehiculo Existente

```typescript
// En vehiculo.model.ts - AGREGAR CAMPO
export interface Vehiculo {
  // ... campos existentes ...
  
  // NUEVO: Referencia a VehiculoSolo
  vehiculoSoloId?: string;
  
  // Estos campos ahora se consultan desde VehiculoSolo:
  // - marca, modelo, año, motor, chasis, etc.
}
```

### Servicio de Integración

```typescript
// vehiculo-integration.service.ts
@Injectable({
  providedIn: 'root'
})
export class VehiculoIntegrationService {
  
  /**
   * Obtener vehículo administrativo con datos técnicos
   */
  obtenerVehiculoCompleto(vehiculoId: string): Observable<VehiculoCompleto> {
    return forkJoin({
      vehiculoAdmin: this.vehiculoService.obtenerVehiculo(vehiculoId),
      vehiculoSolo: this.vehiculoSoloService.obtenerVehiculoPorId(vehiculoAdmin.vehiculoSoloId)
    }).pipe(
      map(({ vehiculoAdmin, vehiculoSolo }) => ({
        ...vehiculoAdmin,
        datosTecnicos: vehiculoSolo,
        historialPlacas: vehiculoSolo.historialPlacas,
        propietarioRegistral: vehiculoSolo.propietarios.find(p => p.esPropietarioActual),
        inspeccionVigente: vehiculoSolo.inspecciones.find(i => 
          new Date(i.fechaVencimiento) > new Date()
        ),
        soatVigente: vehiculoSolo.seguros.find(s => 
          s.tipoSeguro === 'SOAT' && s.estado === 'VIGENTE'
        )
      }))
    );
  }
  
  /**
   * Crear vehículo con datos técnicos
   */
  crearVehiculoCompleto(
    datosAdmin: VehiculoCreate,
    datosTecnicos: VehiculoSoloCreate
  ): Observable<{ vehiculoAdmin: Vehiculo; vehiculoSolo: VehiculoSolo }> {
    // 1. Crear VehiculoSolo primero
    return this.vehiculoSoloService.crearVehiculo(datosTecnicos).pipe(
      switchMap(vehiculoSolo => {
        // 2. Crear Vehiculo administrativo con referencia
        const vehiculoConReferencia = {
          ...datosAdmin,
          vehiculoSoloId: vehiculoSolo.id
        };
        
        return this.vehiculoService.crearVehiculo(vehiculoConReferencia).pipe(
          map(vehiculoAdmin => ({
            vehiculoAdmin,
            vehiculoSolo
          }))
        );
      })
    );
  }
}
```

---

## 📡 APIs EXTERNAS - INTEGRACIÓN

### 1. SUNARP (Superintendencia Nacional de Registros Públicos)

```typescript
// Endpoints a implementar en backend
POST /api/vehiculos-solo/consultar/sunarp
{
  "placa": "ABC-123",
  "vin": "1HGBH41JXMN109186"
}

// Respuesta
{
  "exito": true,
  "datos": {
    "vehiculo": {
      "marca": "TOYOTA",
      "modelo": "COROLLA",
      "anioFabricacion": 2020,
      "color": "BLANCO",
      "numeroMotor": "2ZR1234567",
      "numeroSerie": "JTDKB20U403123456"
    },
    "propietario": {
      "tipoDocumento": "DNI",
      "numeroDocumento": "12345678",
      "nombreCompleto": "JUAN PEREZ GARCIA",
      "partidaRegistral": "11001234",
      "fechaInscripcion": "2020-05-15"
    },
    "gravamenes": []
  },
  "fechaConsulta": "2026-02-06T10:30:00Z"
}
```

### 2. SUTRAN (Superintendencia de Transporte Terrestre)

```typescript
POST /api/vehiculos-solo/consultar/sutran
{
  "placa": "ABC-123"
}

// Respuesta
{
  "exito": true,
  "datos": {
    "vehiculo": {
      "placa": "ABC-123",
      "categoria": "M1",
      "clase": "AUTOMOVIL"
    },
    "infracciones": [],
    "papeletasDetencion": []
  },
  "fechaConsulta": "2026-02-06T10:30:00Z"
}
```

---

## 🎨 COMPONENTES A CREAR

### 1. Listado de Vehículos Solo
- `vehiculos-solo.component.ts`
- Tabla con filtros avanzados
- Búsqueda por placa, VIN, propietario
- Exportación a Excel

### 2. Detalle de Vehículo Solo
- `vehiculo-solo-detalle.component.ts`
- Vista completa con tabs:
  - Datos técnicos
  - Historial de placas
  - Propietarios
  - Inspecciones
  - Seguros
  - Documentos

### 3. Formulario de Vehículo Solo
- `vehiculo-solo-form.component.ts`
- Creación y edición
- Validaciones completas
- Integración con APIs externas

### 4. Consulta SUNARP/SUTRAN
- `consulta-externa-modal.component.ts`
- Modal para consultar APIs
- Mostrar resultados
- Opción de actualizar datos

### 5. Historial de Placas
- `historial-placas.component.ts`
- Timeline de cambios de placa
- Registro de nuevos cambios

---

## 🗂️ ESTRUCTURA DE CARPETAS

```
frontend/src/app/
├── models/
│   └── vehiculo-solo.model.ts ✅ (creado)
├── services/
│   ├── vehiculo-solo.service.ts ✅ (creado)
│   └── vehiculo-integration.service.ts (por crear)
├── components/
│   └── vehiculos-solo/
│       ├── vehiculos-solo.component.ts
│       ├── vehiculo-solo-detalle.component.ts
│       ├── vehiculo-solo-form.component.ts
│       ├── consulta-externa-modal.component.ts
│       ├── historial-placas.component.ts
│       ├── propietarios-list.component.ts
│       ├── inspecciones-list.component.ts
│       ├── seguros-list.component.ts
│       └── documentos-list.component.ts
```

---

## 📋 PRÓXIMOS PASOS

### Fase 1: Backend (Python/FastAPI)
1. Crear modelos de base de datos
2. Crear endpoints CRUD
3. Implementar integración con SUNARP
4. Implementar integración con SUTRAN
5. Crear sistema de caché para consultas externas

### Fase 2: Frontend (Angular)
1. ✅ Crear modelos TypeScript
2. ✅ Crear servicio principal
3. Crear componentes de UI
4. Implementar formularios
5. Crear modales de consulta

### Fase 3: Integración
1. Modificar modelo Vehiculo actual
2. Crear servicio de integración
3. Actualizar componentes existentes
4. Migración de datos existentes

### Fase 4: Testing y Documentación
1. Pruebas unitarias
2. Pruebas de integración
3. Documentación de APIs
4. Manual de usuario

---

## ✅ ARCHIVOS CREADOS

1. ✅ `frontend/src/app/models/vehiculo-solo.model.ts`
2. ✅ `frontend/src/app/services/vehiculo-solo.service.ts`
3. ✅ `DISEÑO_MODULO_VEHICULO_SOLO.md`

---

## 🎯 ¿CONTINUAMOS?

Opciones:
1. **Crear componentes de UI** (listado, detalle, formulario)
2. **Crear backend** (modelos, endpoints, integración APIs)
3. **Crear servicio de integración** con módulo actual
4. **Crear documentación de APIs externas**

¿Qué prefieres que haga primero?
