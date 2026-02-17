# 🔄 Propuesta: Modo UPSERT para Carga Masiva de Rutas

## 🎯 Objetivo

Implementar un modo de actualización inteligente que use la clave única **RUC + Resolución + Código de Ruta** para:
- **Crear** rutas nuevas que no existen
- **Actualizar** rutas existentes con nuevos datos
- **Reportar** qué rutas fueron creadas vs actualizadas

## 🔑 Clave Única

La combinación de estos 3 campos forma una clave única:

```
RUC + Resolución + Código de Ruta = Identificador Único
```

**Ejemplo:**
```
20448048242 + R-0921-2023 + 01 = Ruta única
20448048242 + R-0921-2023 + 02 = Otra ruta única
20448048242 + R-0922-2023 + 01 = Otra ruta única (diferente resolución)
```

## 📋 Modos de Procesamiento

### Modo 1: CREAR (Actual)
- Solo crea rutas nuevas
- Error si la ruta ya existe
- Comportamiento actual del sistema

### Modo 2: ACTUALIZAR (Nuevo)
- Solo actualiza rutas existentes
- Error si la ruta no existe
- Útil para actualizar datos masivamente

### Modo 3: UPSERT (Nuevo - Recomendado)
- Crea si no existe
- Actualiza si existe
- Más flexible y útil

## 🔧 Implementación Técnica

### Backend: Método de Búsqueda

```python
async def _buscar_ruta_existente(
    self, 
    ruc: str, 
    numero_resolucion: str, 
    codigo_ruta: str
) -> Optional[Dict]:
    """
    Buscar ruta existente por la clave única:
    RUC + Resolución + Código de Ruta
    """
    # Buscar empresa por RUC
    empresa = await self.empresas_collection.find_one({
        "ruc": ruc,
        "estaActivo": True
    })
    
    if not empresa:
        return None
    
    # Buscar resolución por número
    resolucion = await self.resoluciones_collection.find_one({
        "nroResolucion": numero_resolucion,
        "tipoResolucion": "PADRE",
        "estado": "VIGENTE"
    })
    
    if not resolucion:
        return None
    
    # Buscar ruta por código, empresa y resolución
    ruta = await self.rutas_collection.find_one({
        "codigoRuta": codigo_ruta,
        "empresa.id": str(empresa["_id"]),
        "resolucion.id": str(resolucion["_id"])
    })
    
    return ruta
```

### Backend: Método UPSERT

```python
async def _upsert_ruta_desde_datos(
    self, 
    ruta_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Crear o actualizar ruta según exista o no
    
    Returns:
        {
            'accion': 'creada' | 'actualizada',
            'ruta': Ruta,
            'cambios': List[str]  # Lista de campos actualizados
        }
    """
    # Buscar ruta existente
    ruta_existente = await self._buscar_ruta_existente(
        ruc=ruta_data['ruc'],
        numero_resolucion=ruta_data['resolucionNormalizada'],
        codigo_ruta=ruta_data['codigoRuta']
    )
    
    if ruta_existente:
        # ACTUALIZAR ruta existente
        print(f"🔄 Actualizando ruta existente: {ruta_data['codigoRuta']}")
        
        # Preparar datos de actualización
        ruta_update = await self._preparar_datos_actualizacion(
            ruta_data, 
            ruta_existente
        )
        
        # Actualizar en la base de datos
        from app.services.ruta_service import RutaService
        ruta_service = RutaService(self.db)
        
        ruta_actualizada = await ruta_service.update_ruta(
            str(ruta_existente["_id"]),
            ruta_update
        )
        
        # Detectar qué campos cambiaron
        cambios = self._detectar_cambios(ruta_existente, ruta_update)
        
        return {
            'accion': 'actualizada',
            'ruta': ruta_actualizada,
            'cambios': cambios
        }
    else:
        # CREAR ruta nueva
        print(f"✨ Creando ruta nueva: {ruta_data['codigoRuta']}")
        
        ruta_creada = await self._crear_ruta_desde_datos(ruta_data)
        
        return {
            'accion': 'creada',
            'ruta': ruta_creada,
            'cambios': []
        }
```

### Backend: Preparar Datos de Actualización

```python
async def _preparar_datos_actualizacion(
    self,
    ruta_data: Dict[str, Any],
    ruta_existente: Dict[str, Any]
) -> RutaUpdate:
    """
    Preparar objeto RutaUpdate con los nuevos datos
    """
    from app.models.ruta import RutaUpdate
    
    # Buscar o crear localidades
    origen_localidad = await self._buscar_o_crear_localidad(ruta_data['origen'])
    destino_localidad = await self._buscar_o_crear_localidad(ruta_data['destino'])
    
    # Crear objetos embebidos
    origen_embebido = LocalidadEmbebida(
        id=str(origen_localidad["_id"]),
        nombre=origen_localidad["nombre"]
    )
    
    destino_embebido = LocalidadEmbebida(
        id=str(destino_localidad["_id"]),
        nombre=destino_localidad["nombre"]
    )
    
    # Crear frecuencia
    frecuencia = FrecuenciaServicio(
        tipo=TipoFrecuencia.DIARIO,
        cantidad=1,
        dias=[],
        descripcion=ruta_data['frecuencia']
    )
    
    # Crear objeto de actualización
    ruta_update = RutaUpdate(
        nombre=f"{ruta_data['origen']} - {ruta_data['destino']}",
        origen=origen_embebido,
        destino=destino_embebido,
        frecuencia=frecuencia,
        tipoRuta=TipoRuta(ruta_data.get('tipoRuta', 'INTERREGIONAL')),
        tipoServicio=TipoServicio(ruta_data.get('tipoServicio', 'PASAJEROS')),
        distancia=ruta_data.get('distancia'),
        tiempoEstimado=ruta_data.get('tiempoEstimado'),
        tarifaBase=ruta_data.get('tarifaBase'),
        observaciones=ruta_data.get('observaciones'),
        descripcion=ruta_data['itinerario']
    )
    
    return ruta_update
```

### Backend: Detectar Cambios

```python
def _detectar_cambios(
    self,
    ruta_anterior: Dict[str, Any],
    ruta_nueva: RutaUpdate
) -> List[str]:
    """
    Detectar qué campos cambiaron
    """
    cambios = []
    
    # Comparar origen
    if ruta_nueva.origen and ruta_nueva.origen.nombre != ruta_anterior.get('origen', {}).get('nombre'):
        cambios.append(f"Origen: {ruta_anterior.get('origen', {}).get('nombre')} → {ruta_nueva.origen.nombre}")
    
    # Comparar destino
    if ruta_nueva.destino and ruta_nueva.destino.nombre != ruta_anterior.get('destino', {}).get('nombre'):
        cambios.append(f"Destino: {ruta_anterior.get('destino', {}).get('nombre')} → {ruta_nueva.destino.nombre}")
    
    # Comparar frecuencia
    if ruta_nueva.frecuencia and ruta_nueva.frecuencia.descripcion != ruta_anterior.get('frecuencia', {}).get('descripcion'):
        cambios.append(f"Frecuencia: {ruta_anterior.get('frecuencia', {}).get('descripcion')} → {ruta_nueva.frecuencia.descripcion}")
    
    # Comparar tipo de ruta
    if ruta_nueva.tipoRuta and str(ruta_nueva.tipoRuta) != ruta_anterior.get('tipoRuta'):
        cambios.append(f"Tipo: {ruta_anterior.get('tipoRuta')} → {ruta_nueva.tipoRuta}")
    
    # Comparar observaciones
    if ruta_nueva.observaciones != ruta_anterior.get('observaciones'):
        cambios.append("Observaciones actualizadas")
    
    return cambios
```

## 🎨 Frontend: Selector de Modo

### Componente de Carga Masiva

```typescript
// En carga-masiva-rutas.component.ts

// Agregar propiedad
modoProcesamiento: 'crear' | 'actualizar' | 'upsert' = 'upsert';

// En el template
<div class="processing-options">
  <h4>Modo de Procesamiento</h4>
  
  <mat-radio-group [(ngModel)]="modoProcesamiento" class="radio-group">
    <mat-radio-button value="crear">
      <strong>Solo Crear</strong>
      <p>Crear solo rutas nuevas (error si existe)</p>
    </mat-radio-button>
    
    <mat-radio-button value="actualizar">
      <strong>Solo Actualizar</strong>
      <p>Actualizar solo rutas existentes (error si no existe)</p>
    </mat-radio-button>
    
    <mat-radio-button value="upsert">
      <strong>Crear o Actualizar (Recomendado)</strong>
      <p>Crear si no existe, actualizar si existe</p>
    </mat-radio-button>
  </mat-radio-group>
  
  <!-- Información sobre la clave única -->
  <div class="info-box">
    <mat-icon>info</mat-icon>
    <div>
      <h5>Identificación de Rutas</h5>
      <p>Las rutas se identifican por: <strong>RUC + Resolución + Código</strong></p>
      <p>Ejemplo: 20448048242 + R-0921-2023 + 01</p>
    </div>
  </div>
</div>
```

### Servicio: Enviar Modo

```typescript
// En ruta.service.ts

async procesarCargaMasiva(
  archivo: File, 
  opciones: {
    soloValidar?: boolean;
    modo?: 'crear' | 'actualizar' | 'upsert';
    procesarEnLotes?: boolean;
    tamanoLote?: number;
  } = {}
): Promise<any> {
  const { 
    soloValidar = false, 
    modo = 'upsert',  // Por defecto upsert
    procesarEnLotes = false,
    tamanoLote = 50
  } = opciones;
  
  if (soloValidar) {
    return await this.validarCargaMasiva(archivo);
  }

  const formData = new FormData();
  formData.append('archivo', archivo);
  formData.append('modo', modo);  // ✅ Enviar modo
  
  const url = `${this.apiUrl}/rutas/carga-masiva/procesar`;
  const resultado = await this.http.post(url, formData, { 
    headers: this.getHeaders() 
  }).toPromise();
  
  return resultado;
}
```

## 📊 Respuesta del Backend

### Estructura de Respuesta

```json
{
  "total_procesadas": 10,
  "exitosas": 10,
  "fallidas": 0,
  "creadas": 3,
  "actualizadas": 7,
  "rutas_creadas": [
    {
      "codigo": "04",
      "nombre": "PUNO - ILAVE",
      "id": "6991c125ec61906bc86378cc"
    }
  ],
  "rutas_actualizadas": [
    {
      "codigo": "01",
      "nombre": "PUNO - JULIACA",
      "id": "6991c125ec61906bc86378aa",
      "cambios": [
        "Frecuencia: 01 DIARIA → 03 DIARIAS",
        "Observaciones actualizadas"
      ]
    }
  ],
  "errores_procesamiento": []
}
```

## 🎯 Casos de Uso

### Caso 1: Primera Importación

```
Modo: CREAR
Archivo: 50 rutas nuevas
Resultado: 50 creadas, 0 actualizadas
```

### Caso 2: Actualización de Frecuencias

```
Modo: ACTUALIZAR
Archivo: 50 rutas existentes con nuevas frecuencias
Resultado: 0 creadas, 50 actualizadas
```

### Caso 3: Importación Mixta (Recomendado)

```
Modo: UPSERT
Archivo: 30 rutas existentes + 20 rutas nuevas
Resultado: 20 creadas, 30 actualizadas
```

## ✅ Ventajas del Modo UPSERT

1. **Flexibilidad**: No necesitas saber qué rutas existen
2. **Simplicidad**: Un solo archivo para todo
3. **Seguridad**: No pierdes datos existentes
4. **Trazabilidad**: Sabes qué se creó y qué se actualizó
5. **Eficiencia**: Procesas todo en una sola operación

## 📝 Ejemplo Práctico

### Archivo Excel

```
RUC         | Resolución  | Código | Origen | Destino  | Frecuencia
20448048242 | R-0921-2023 | 01     | PUNO   | JULIACA  | 03 DIARIAS  ← Actualizar
20448048242 | R-0921-2023 | 02     | JULIACA| AZÁNGARO | 02 DIARIAS  ← Sin cambios
20448048242 | R-0921-2023 | 04     | PUNO   | ILAVE    | 01 DIARIA   ← Crear nueva
```

### Resultado con Modo UPSERT

```
✅ Total procesadas: 3
✅ Creadas: 1
✅ Actualizadas: 2

Rutas creadas:
- 04 - PUNO → ILAVE

Rutas actualizadas:
- 01 - PUNO → JULIACA
  Cambios: Frecuencia: 01 DIARIA → 03 DIARIAS
  
- 02 - JULIACA → AZÁNGARO
  Sin cambios detectados
```

## 🚀 Plan de Implementación

### Fase 1: Backend (2-3 horas)
1. ✅ Crear método `_buscar_ruta_existente()`
2. ✅ Crear método `_upsert_ruta_desde_datos()`
3. ✅ Crear método `_preparar_datos_actualizacion()`
4. ✅ Crear método `_detectar_cambios()`
5. ✅ Modificar `procesar_carga_masiva()` para aceptar modo
6. ✅ Actualizar endpoint para recibir parámetro `modo`

### Fase 2: Frontend (1-2 horas)
1. ✅ Agregar selector de modo en el componente
2. ✅ Actualizar servicio para enviar modo
3. ✅ Actualizar interfaz de resultados para mostrar creadas/actualizadas
4. ✅ Agregar información sobre la clave única

### Fase 3: Pruebas (1 hora)
1. ✅ Probar modo CREAR
2. ✅ Probar modo ACTUALIZAR
3. ✅ Probar modo UPSERT
4. ✅ Verificar detección de cambios
5. ✅ Verificar reportes

## 📋 Checklist de Implementación

- [ ] Backend: Método de búsqueda por clave única
- [ ] Backend: Método upsert
- [ ] Backend: Método de actualización
- [ ] Backend: Detección de cambios
- [ ] Backend: Endpoint con parámetro modo
- [ ] Frontend: Selector de modo
- [ ] Frontend: Envío de modo al backend
- [ ] Frontend: Visualización de resultados
- [ ] Pruebas: Modo crear
- [ ] Pruebas: Modo actualizar
- [ ] Pruebas: Modo upsert
- [ ] Documentación actualizada

## 🎯 Conclusión

La implementación del modo UPSERT usando la clave única **RUC + Resolución + Código** permitirá:

✅ Actualizar rutas existentes masivamente  
✅ Crear rutas nuevas en el mismo proceso  
✅ Mantener trazabilidad de cambios  
✅ Simplificar el flujo de trabajo  
✅ Evitar duplicados  

**Recomendación:** Implementar el modo UPSERT como opción por defecto, manteniendo los otros modos disponibles para casos específicos.
