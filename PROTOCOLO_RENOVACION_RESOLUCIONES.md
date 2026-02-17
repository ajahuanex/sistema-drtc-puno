# 🔄 Protocolo de Renovación de Resoluciones Padre

## 📋 Descripción del Protocolo

Cuando una resolución padre es renovada, se activa un protocolo automático que gestiona la transferencia de datos de la resolución anterior a la nueva.

## 🎯 Flujo del Protocolo

### 1. Resolución Anterior (Renovada)

**Cambios automáticos:**
```json
{
  "nroResolucion": "R-0551-2021",
  "estado": "RENOVADA",  // ← Cambia automáticamente
  "renovadaPor": "R-0692-2025",  // ← Referencia a la nueva
  "observaciones": "Resolución renovada por R-0692-2025 el 20/10/2025"  // ← Tipificación
}
```

### 2. Resoluciones Hijas

**Estado:** Se van al olvido (quedan inactivas)

```json
{
  "nroResolucion": "R-0551-2021-H001",
  "resolucionPadreId": "R-0551-2021",
  "estaActivo": false,  // ← Se desactivan
  "observaciones": "Resolución padre renovada por R-0692-2025"
}
```

**Razón:** Las resoluciones hijas son específicas de la resolución padre y no se transfieren.

### 3. Vehículos Asociados

**Estado:** Se transfieren a la nueva resolución en estado PENDIENTE

```json
// Resolución anterior
{
  "nroResolucion": "R-0551-2021",
  "vehiculosHabilitadosIds": ["vehiculo1", "vehiculo2", "vehiculo3"]
}

// Resolución nueva (después del protocolo)
{
  "nroResolucion": "R-0692-2025",
  "vehiculosHabilitadosIds": [],  // Inicialmente vacío
  "vehiculosPendientesIds": ["vehiculo1", "vehiculo2", "vehiculo3"]  // ← Transferidos como pendientes
}

// Cada vehículo
{
  "id": "vehiculo1",
  "resolucionId": "R-0692-2025",  // ← Actualizado a la nueva
  "estadoEnResolucion": "PENDIENTE",  // ← Estado pendiente
  "observaciones": "Transferido desde R-0551-2021. Pendiente de confirmación en nueva resolución"
}
```

**Razón:** Los vehículos deben ser revisados y confirmados en la nueva resolución.

### 4. Rutas Autorizadas

**Estado:** Se transfieren a la nueva resolución en estado PENDIENTE

```json
// Resolución anterior
{
  "nroResolucion": "R-0551-2021",
  "rutasAutorizadasIds": ["ruta1", "ruta2", "ruta3"]
}

// Resolución nueva (después del protocolo)
{
  "nroResolucion": "R-0692-2025",
  "rutasAutorizadasIds": [],  // Inicialmente vacío
  "rutasPendientesIds": ["ruta1", "ruta2", "ruta3"]  // ← Transferidas como pendientes
}

// Cada ruta
{
  "id": "ruta1",
  "resolucionId": "R-0692-2025",  // ← Actualizado a la nueva
  "estadoEnResolucion": "PENDIENTE",  // ← Estado pendiente
  "observaciones": "Transferida desde R-0551-2021. Pendiente de actualización"
}
```

**Razón:** Las rutas quedan pendientes hasta que se actualice cualquiera de sus datos, momento en el cual se decide si permanecen o se actualizan.

## 📊 Diagrama del Protocolo

```
┌─────────────────────────────────────────────────────────────────┐
│ RESOLUCIÓN ANTERIOR (R-0551-2021)                               │
├─────────────────────────────────────────────────────────────────┤
│ Estado: VIGENTE                                                 │
│ Vehículos: [V1, V2, V3]                                        │
│ Rutas: [R1, R2, R3]                                            │
│ Resoluciones Hijas: [H1, H2]                                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ RENOVACIÓN
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ PROTOCOLO DE RENOVACIÓN ACTIVADO                               │
├─────────────────────────────────────────────────────────────────┤
│ 1. Cambiar estado anterior a RENOVADA                          │
│ 2. Agregar observaciones con tipificación                      │
│ 3. Desactivar resoluciones hijas                               │
│ 4. Transferir vehículos como PENDIENTES                        │
│ 5. Transferir rutas como PENDIENTES                            │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ RESOLUCIÓN NUEVA (R-0692-2025)                                 │
├─────────────────────────────────────────────────────────────────┤
│ Estado: VIGENTE                                                 │
│ Vehículos Pendientes: [V1, V2, V3] ← Requieren confirmación   │
│ Rutas Pendientes: [R1, R2, R3] ← Requieren actualización      │
│ Resoluciones Hijas: [] ← Vacío, se crearán nuevas si necesario│
└─────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ RESOLUCIÓN ANTERIOR (R-0551-2021) - ESTADO FINAL              │
├─────────────────────────────────────────────────────────────────┤
│ Estado: RENOVADA                                                │
│ RenovadaPor: R-0692-2025                                       │
│ Observaciones: "Renovada por R-0692-2025 el 20/10/2025"       │
│ Vehículos: [] ← Transferidos                                   │
│ Rutas: [] ← Transferidas                                       │
│ Resoluciones Hijas: [H1, H2] ← Inactivas                      │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Implementación Técnica

### Nuevos Campos en el Modelo

```typescript
interface Resolucion {
  // ... campos existentes
  
  // Campos para protocolo de renovación
  vehiculosPendientesIds?: string[];  // Vehículos transferidos pendientes
  rutasPendientesIds?: string[];      // Rutas transferidas pendientes
  protocoloRenovacionEjecutado?: boolean;  // Indica si se ejecutó el protocolo
  fechaProtocoloRenovacion?: Date;    // Fecha de ejecución del protocolo
}

interface Vehiculo {
  // ... campos existentes
  
  estadoEnResolucion?: 'ACTIVO' | 'PENDIENTE' | 'RECHAZADO';
  resolucionAnteriorId?: string;  // ID de la resolución anterior
  fechaTransferencia?: Date;      // Fecha de transferencia
}

interface Ruta {
  // ... campos existentes
  
  estadoEnResolucion?: 'ACTIVA' | 'PENDIENTE' | 'RECHAZADA';
  resolucionAnteriorId?: string;  // ID de la resolución anterior
  fechaTransferencia?: Date;      // Fecha de transferencia
  requiereActualizacion?: boolean; // Indica si requiere actualización
}
```

### Función del Protocolo

```python
async def ejecutar_protocolo_renovacion(
    resolucion_anterior_id: str,
    resolucion_nueva_id: str,
    fecha_renovacion: datetime
) -> Dict[str, Any]:
    """
    Ejecuta el protocolo de renovación de resoluciones padre
    
    Args:
        resolucion_anterior_id: ID de la resolución que se renovó
        resolucion_nueva_id: ID de la nueva resolución
        fecha_renovacion: Fecha de la renovación
    
    Returns:
        Resultado del protocolo con estadísticas
    """
    
    # 1. Obtener resolución anterior
    resolucion_anterior = await resoluciones_collection.find_one({
        "_id": ObjectId(resolucion_anterior_id)
    })
    
    # 2. Actualizar estado de resolución anterior
    await resoluciones_collection.update_one(
        {"_id": ObjectId(resolucion_anterior_id)},
        {
            "$set": {
                "estado": "RENOVADA",
                "renovadaPor": resolucion_nueva_id,
                "observaciones": f"Resolución renovada por {resolucion_nueva_id} el {fecha_renovacion.strftime('%d/%m/%Y')}",
                "fechaActualizacion": datetime.now()
            }
        }
    )
    
    # 3. Desactivar resoluciones hijas
    resoluciones_hijas = resolucion_anterior.get("resolucionesHijasIds", [])
    if resoluciones_hijas:
        await resoluciones_collection.update_many(
            {"_id": {"$in": [ObjectId(id) for id in resoluciones_hijas]}},
            {
                "$set": {
                    "estaActivo": False,
                    "observaciones": f"Resolución padre renovada por {resolucion_nueva_id}",
                    "fechaActualizacion": datetime.now()
                }
            }
        )
    
    # 4. Transferir vehículos como pendientes
    vehiculos_ids = resolucion_anterior.get("vehiculosHabilitadosIds", [])
    if vehiculos_ids:
        # Actualizar vehículos
        await vehiculos_collection.update_many(
            {"_id": {"$in": [ObjectId(id) for id in vehiculos_ids]}},
            {
                "$set": {
                    "resolucionId": resolucion_nueva_id,
                    "estadoEnResolucion": "PENDIENTE",
                    "resolucionAnteriorId": resolucion_anterior_id,
                    "fechaTransferencia": fecha_renovacion,
                    "observaciones": f"Transferido desde {resolucion_anterior['nroResolucion']}. Pendiente de confirmación"
                }
            }
        )
        
        # Agregar a resolución nueva como pendientes
        await resoluciones_collection.update_one(
            {"_id": ObjectId(resolucion_nueva_id)},
            {
                "$set": {
                    "vehiculosPendientesIds": vehiculos_ids
                }
            }
        )
        
        # Limpiar de resolución anterior
        await resoluciones_collection.update_one(
            {"_id": ObjectId(resolucion_anterior_id)},
            {
                "$set": {
                    "vehiculosHabilitadosIds": []
                }
            }
        )
    
    # 5. Transferir rutas como pendientes
    rutas_ids = resolucion_anterior.get("rutasAutorizadasIds", [])
    if rutas_ids:
        # Actualizar rutas
        await rutas_collection.update_many(
            {"_id": {"$in": [ObjectId(id) for id in rutas_ids]}},
            {
                "$set": {
                    "resolucionId": resolucion_nueva_id,
                    "estadoEnResolucion": "PENDIENTE",
                    "resolucionAnteriorId": resolucion_anterior_id,
                    "fechaTransferencia": fecha_renovacion,
                    "requiereActualizacion": True,
                    "observaciones": f"Transferida desde {resolucion_anterior['nroResolucion']}. Pendiente de actualización"
                }
            }
        )
        
        # Agregar a resolución nueva como pendientes
        await resoluciones_collection.update_one(
            {"_id": ObjectId(resolucion_nueva_id)},
            {
                "$set": {
                    "rutasPendientesIds": rutas_ids
                }
            }
        )
        
        # Limpiar de resolución anterior
        await resoluciones_collection.update_one(
            {"_id": ObjectId(resolucion_anterior_id)},
            {
                "$set": {
                    "rutasAutorizadasIds": []
                }
            }
        )
    
    # 6. Marcar protocolo como ejecutado
    await resoluciones_collection.update_one(
        {"_id": ObjectId(resolucion_nueva_id)},
        {
            "$set": {
                "protocoloRenovacionEjecutado": True,
                "fechaProtocoloRenovacion": fecha_renovacion
            }
        }
    )
    
    return {
        "exito": True,
        "mensaje": "Protocolo de renovación ejecutado exitosamente",
        "estadisticas": {
            "resoluciones_hijas_desactivadas": len(resoluciones_hijas),
            "vehiculos_transferidos": len(vehiculos_ids),
            "rutas_transferidas": len(rutas_ids)
        }
    }
```

## 📝 Proceso de Confirmación

### Para Vehículos:

1. Usuario revisa vehículos pendientes en la nueva resolución
2. Para cada vehículo decide:
   - **Confirmar**: Cambia estado a ACTIVO
   - **Rechazar**: Cambia estado a RECHAZADO (queda sin resolución)
3. Una vez confirmado, se mueve de `vehiculosPendientesIds` a `vehiculosHabilitadosIds`

### Para Rutas:

1. Usuario revisa rutas pendientes en la nueva resolución
2. Para cada ruta debe actualizar al menos un dato (origen, destino, etc.)
3. Al actualizar, el sistema pregunta:
   - **Mantener**: Cambia estado a ACTIVA
   - **Rechazar**: Cambia estado a RECHAZADA (queda sin resolución)
4. Una vez confirmada, se mueve de `rutasPendientesIds` a `rutasAutorizadasIds`

## 🎯 Beneficios del Protocolo

1. **Trazabilidad**: Se mantiene el historial completo
2. **Seguridad**: Requiere confirmación explícita
3. **Flexibilidad**: Permite rechazar elementos no deseados
4. **Auditoría**: Registra todas las transferencias
5. **Integridad**: Mantiene la coherencia de datos

## ⚠️ Consideraciones Importantes

1. El protocolo se ejecuta **automáticamente** al crear una renovación con `resolucionAsociada`
2. Las resoluciones hijas **no se transfieren** (se crearán nuevas si es necesario)
3. Los vehículos y rutas quedan **pendientes** hasta confirmación
4. El usuario debe revisar y confirmar los elementos transferidos
5. Se mantiene referencia a la resolución anterior para auditoría

## 📊 Interfaz de Usuario

### Vista de Resolución Nueva

```
┌─────────────────────────────────────────────────────────────┐
│ Resolución R-0692-2025                                      │
├─────────────────────────────────────────────────────────────┤
│ Estado: VIGENTE                                             │
│ Renovó a: R-0551-2021                                       │
│                                                             │
│ ⚠️ ELEMENTOS PENDIENTES DE CONFIRMACIÓN                     │
│                                                             │
│ 📦 Vehículos Pendientes (3)                                │
│   • ABC-123 [Confirmar] [Rechazar]                         │
│   • DEF-456 [Confirmar] [Rechazar]                         │
│   • GHI-789 [Confirmar] [Rechazar]                         │
│                                                             │
│ 🛣️ Rutas Pendientes (5)                                    │
│   • Puno - Juliaca [Actualizar] [Rechazar]                │
│   • Juliaca - Arequipa [Actualizar] [Rechazar]            │
│   • ...                                                     │
└─────────────────────────────────────────────────────────────┘
```

## ✅ Conclusión

El protocolo de renovación es un proceso automático pero controlado que:
- Actualiza el estado de la resolución anterior
- Desactiva resoluciones hijas
- Transfiere vehículos y rutas como pendientes
- Requiere confirmación del usuario
- Mantiene trazabilidad completa
