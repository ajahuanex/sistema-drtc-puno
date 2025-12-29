# 📝 Historial Vehicular - DRTC Puno

Este documento describe la implementación del sistema de historial vehicular para el proyecto DRTC Puno.

## 🎯 Descripción

El historial vehicular registra automáticamente todos los eventos importantes que ocurren con los vehículos del sistema, proporcionando una trazabilidad completa de los cambios y operaciones realizadas.

## 📊 Tipos de Eventos Registrados

| Tipo de Evento | Descripción |
|----------------|-------------|
| `CREACION` | Vehículo registrado en el sistema |
| `MODIFICACION` | Datos del vehículo actualizados |
| `TRANSFERENCIA_EMPRESA` | Vehículo transferido a nueva empresa |
| `CAMBIO_RESOLUCION` | Resolución del vehículo actualizada |
| `CAMBIO_ESTADO` | Estado del vehículo modificado |
| `ASIGNACION_RUTA` | Ruta asignada al vehículo |
| `DESASIGNACION_RUTA` | Ruta desasignada del vehículo |
| `ACTUALIZACION_TUC` | Información del TUC actualizada |
| `RENOVACION_TUC` | TUC renovado |
| `SUSPENSION` | Vehículo suspendido temporalmente |
| `REACTIVACION` | Vehículo reactivado |
| `BAJA_DEFINITIVA` | Vehículo dado de baja definitivamente |
| `MANTENIMIENTO` | Mantenimiento realizado al vehículo |
| `INSPECCION` | Inspección técnica realizada |
| `ACCIDENTE` | Registro de accidente |
| `MULTA` | Multa registrada |
| `REVISION_TECNICA` | Revisión técnica realizada |
| `CAMBIO_PROPIETARIO` | Cambio de propietario registrado |
| `ACTUALIZACION_DATOS_TECNICOS` | Datos técnicos actualizados |
| `OTROS` | Otro tipo de evento |

## 🗄️ Estructura de la Base de Datos

### Colección: `historial_vehicular`

```javascript
{
  "_id": ObjectId,
  "vehiculoId": String,           // ID del vehículo (requerido)
  "placa": String,                // Placa en formato XXX-123 (requerido)
  "tipoEvento": String,           // Tipo de evento (requerido)
  "fechaEvento": Date,            // Fecha y hora del evento (requerido)
  "descripcion": String,          // Descripción del evento (requerido)
  "empresaId": String,            // ID de la empresa relacionada (opcional)
  "resolucionId": String,         // ID de la resolución relacionada (opcional)
  "usuarioId": String,            // ID del usuario que realizó la acción (opcional)
  "usuarioNombre": String,        // Nombre del usuario (opcional)
  "observaciones": String,        // Observaciones adicionales (opcional)
  "datosAnteriores": Object,      // Datos anteriores del vehículo (opcional)
  "datosNuevos": Object,          // Datos nuevos del vehículo (opcional)
  "documentosSoporte": [String],  // IDs de documentos de soporte (opcional)
  "metadatos": Object             // Metadatos adicionales (opcional)
}
```

### Índices Optimizados

- `vehiculoId_1` - Consultas por vehículo específico
- `placa_1` - Búsquedas por placa
- `fechaEvento_-1` - Consultas por fecha (descendente)
- `tipoEvento_1` - Filtros por tipo de evento
- `empresaId_1` - Consultas por empresa
- `vehiculoId_1_fechaEvento_-1` - Historial de vehículo ordenado por fecha
- `placa_1_fechaEvento_-1` - Historial de placa ordenado por fecha
- Índice de texto para búsquedas en descripción y observaciones

## 🚀 Scripts de Despliegue

### 1. Configuración Automática (Recomendado)

```bash
# Windows
scripts/setup-historial-vehicular.bat

# Linux/Mac
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Configuración Manual

#### Paso 1: Agregar Colección a BD Existente
```bash
mongo drtc_puno < scripts/add-historial-vehicular.js
```

#### Paso 2: Generar Datos de Ejemplo
```bash
python scripts/generar_historial_vehicular.py
```

#### Paso 3: Verificar Configuración
```bash
python scripts/verificar_historial_vehicular.py
```

### 3. Inicialización Completa de BD (Solo para BD Nueva)
```bash
mongo < scripts/init-mongo-historial.js
```

## 🔍 Verificación del Sistema

Para verificar que el historial vehicular esté funcionando correctamente:

```bash
python scripts/verificar_historial_vehicular.py
```

Este script verifica:
- ✅ Existencia de la colección
- ✅ Índices correctamente creados
- ✅ Validación de esquema configurada
- ✅ Presencia de datos
- ✅ Relaciones con vehículos existentes
- ✅ Rendimiento de consultas

## 📋 Requisitos

### Base de Datos
- MongoDB 4.4+
- Base de datos `drtc_puno` existente
- Colecciones `vehiculos` y `usuarios` con datos

### Scripts Python
- Python 3.7+
- Biblioteca `pymongo`

```bash
pip install pymongo
```

### Scripts MongoDB
- Cliente `mongo` instalado y accesible
- Conexión a MongoDB en `localhost:27017`

## 🎛️ Configuración del Backend

Una vez creada la colección, asegúrate de que el backend tenga:

### 1. Modelo de Historial Vehicular
```python
# models/historial_vehicular.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

class TipoEventoHistorial(str, Enum):
    CREACION = "CREACION"
    MODIFICACION = "MODIFICACION"
    TRANSFERENCIA_EMPRESA = "TRANSFERENCIA_EMPRESA"
    # ... otros tipos
```

### 2. Servicio de Historial
```python
# services/historial_vehicular_service.py
class HistorialVehicularService:
    async def registrar_evento(self, evento: HistorialVehicularCreate):
        # Lógica para registrar eventos
        pass
    
    async def obtener_historial_vehiculo(self, vehiculo_id: str):
        # Lógica para obtener historial
        pass
```

### 3. Router de API
```python
# routers/historial_vehicular.py
@router.get("/vehiculos/{vehiculo_id}/historial")
async def get_historial_vehiculo(vehiculo_id: str):
    # Endpoint para obtener historial
    pass
```

## 🖥️ Integración con Frontend

El frontend ya incluye:

- ✅ Componente `HistorialVehicularComponent`
- ✅ Servicio `HistorialVehicularService`
- ✅ Modelos TypeScript
- ✅ Interfaz de usuario completa

### Uso en el Frontend
```typescript
// Obtener historial de un vehículo
this.historialService.getHistorialVehicular({
  vehiculoId: 'id_del_vehiculo',
  page: 1,
  limit: 25
}).subscribe(response => {
  this.historial = response.historial;
});
```

## 📈 Consultas Útiles

### Historial de un Vehículo Específico
```javascript
db.historial_vehicular.find({
  "vehiculoId": "id_del_vehiculo"
}).sort({"fechaEvento": -1});
```

### Eventos Recientes (Últimos 30 días)
```javascript
db.historial_vehicular.find({
  "fechaEvento": {
    $gte: new Date(Date.now() - 30*24*60*60*1000)
  }
}).sort({"fechaEvento": -1});
```

### Estadísticas por Tipo de Evento
```javascript
db.historial_vehicular.aggregate([
  {$group: {_id: "$tipoEvento", count: {$sum: 1}}},
  {$sort: {count: -1}}
]);
```

### Historial de una Empresa
```javascript
db.historial_vehicular.find({
  "empresaId": "id_de_la_empresa"
}).sort({"fechaEvento": -1});
```

## 🔧 Mantenimiento

### Limpieza de Datos Antiguos
```javascript
// Eliminar eventos de más de 2 años
db.historial_vehicular.deleteMany({
  "fechaEvento": {
    $lt: new Date(Date.now() - 2*365*24*60*60*1000)
  }
});
```

### Reindexación
```javascript
db.historial_vehicular.reIndex();
```

### Estadísticas de Rendimiento
```javascript
db.historial_vehicular.stats();
```

## 🚨 Solución de Problemas

### Error: Colección no existe
```bash
mongo drtc_puno < scripts/add-historial-vehicular.js
```

### Error: Sin datos
```bash
python scripts/generar_historial_vehicular.py
```

### Error: Índices faltantes
```bash
mongo drtc_puno < scripts/add-historial-vehicular.js
```

### Error: Validación de esquema
Verificar que los documentos cumplan con el esquema definido en `add-historial-vehicular.js`.

## 📞 Soporte

Para problemas o dudas sobre el historial vehicular:

1. Ejecutar script de verificación: `python scripts/verificar_historial_vehicular.py`
2. Revisar logs del backend
3. Verificar conexión a MongoDB
4. Consultar este README

---

**Nota**: Este sistema de historial vehicular proporciona trazabilidad completa y es esencial para auditorías y seguimiento de cambios en el sistema DRTC Puno.