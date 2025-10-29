# 🗄️ SISTEMA DE DATOS PERSISTENTES - DATAMANAGER

## 📋 Descripción General

El **DataManagerService** es un sistema de gestión de datos persistentes en memoria que mantiene las relaciones entre todos los módulos del sistema DRTC Puno mientras la aplicación esté ejecutándose.

## 🎯 Características Principales

### ✅ Persistencia en Memoria
- Los datos se mantienen en memoria durante toda la sesión de la aplicación
- Implementa el patrón **Singleton** para garantizar una única instancia
- Los datos persisten entre diferentes importaciones y usos del servicio

### 🔗 Relaciones Automáticas
- Mantiene automáticamente las relaciones entre módulos:
  - **Empresas** ↔ Vehículos, Conductores, Rutas
  - **Vehículos** ↔ Conductores, Expedientes, Historial de Validaciones
  - **Expedientes** ↔ Resoluciones
  - **Conductores** ↔ Vehículos

### 📊 Estadísticas en Tiempo Real
- Estadísticas globales actualizadas automáticamente
- Contadores por estado y tipo de entidad
- Métricas de relaciones activas
- Log de operaciones con timestamps

### 🔍 Búsquedas y Consultas
- Búsquedas por criterios múltiples
- Consultas de entidades completas con relaciones
- Flujo completo de procesos (empresa → vehículo → expediente → resolución)

## 🏗️ Arquitectura

### Módulos Gestionados
```
📦 DataManager
├── 🏢 Empresas
├── 🚗 Vehículos  
├── 👨‍💼 Conductores
├── 🛣️ Rutas
├── 📄 Expedientes
├── 📋 Resoluciones
└── ✅ Validaciones (Historial)
```

### Sistema de Relaciones
```
🏢 Empresa
├── 🚗 Vehículos[]
├── 👨‍💼 Conductores[]
└── 🛣️ Rutas[]

🚗 Vehículo
├── 🏢 Empresa
├── 👨‍💼 Conductores[]
├── 📄 Expedientes[]
├── ✅ Historial[]
└── 🛣️ Rutas[]

📄 Expediente
├── 🚗 Vehículo
└── 📋 Resoluciones[]
```

## 🚀 Uso del Sistema

### Obtener Instancia
```python
from app.services.data_manager_service import get_data_manager

# Obtener la instancia única
data_manager = get_data_manager()
```

### Agregar Datos
```python
# Agregar empresa
empresa_id = data_manager.agregar_empresa({
    "razonSocial": "Mi Empresa S.A.C.",
    "ruc": "20123456789",
    # ... más datos
})

# Agregar vehículo (se relaciona automáticamente)
vehiculo_id = data_manager.agregar_vehiculo({
    "empresaId": empresa_id,
    "placa": "ABC-123",
    # ... más datos
})

# Las relaciones se crean automáticamente
```

### Consultar Datos
```python
# Empresa completa con todas sus relaciones
empresa_completa = data_manager.obtener_empresa_completa(empresa_id)

# Vehículo con flujo completo
flujo_vehiculo = data_manager.obtener_flujo_completo_vehiculo(vehiculo_id)

# Estadísticas globales
estadisticas = data_manager.obtener_estadisticas_globales()
```

### Búsquedas
```python
# Buscar vehículos de una empresa específica
vehiculos = data_manager.buscar_por_criterios("vehiculos", {
    "empresaId": "1",
    "estado": "ACTIVO"
})

# Buscar conductores activos
conductores = data_manager.buscar_por_criterios("conductores", {
    "estado": "ACTIVO"
})
```

## 🌐 API REST Endpoints

### Estadísticas y Consultas
- `GET /api/data-manager/estadisticas` - Estadísticas globales
- `GET /api/data-manager/relaciones` - Mapa de relaciones
- `GET /api/data-manager/dashboard` - Dashboard ejecutivo
- `GET /api/data-manager/health` - Estado del sistema

### Consultas Específicas
- `GET /api/data-manager/empresa/{id}/completa` - Empresa completa
- `GET /api/data-manager/vehiculo/{id}/completo` - Vehículo completo
- `GET /api/data-manager/vehiculo/{id}/flujo-completo` - Flujo completo

### Datos por Módulo
- `GET /api/data-manager/datos/{modulo}` - Todos los datos de un módulo
- `GET /api/data-manager/buscar/{modulo}` - Búsqueda con filtros

### Operaciones
- `POST /api/data-manager/agregar/{modulo}` - Agregar elemento
- `POST /api/data-manager/reset` - Resetear sistema

## 📊 Datos Iniciales

El sistema se inicializa automáticamente con datos de prueba:

### 🏢 Empresas (3)
1. **Transportes Titicaca S.A.C.** - RUC: 20123456789
2. **Empresa de Transportes Altiplano E.I.R.L.** - RUC: 20987654321  
3. **Transportes Lago Sagrado S.R.L.** - RUC: 20555666777

### 🚗 Vehículos (5)
- **ABC-123** - Mercedes Benz OH-1628 (Titicaca)
- **DEF-456** - Volvo B7R (Titicaca)
- **GHI-789** - Scania K360IB (Altiplano)
- **JKL-012** - Mercedes Benz OH-1721 (Altiplano)
- **MNO-345** - Iveco Magelys Pro (Lago Sagrado)

### 👨‍💼 Conductores (4)
- **Juan Carlos García López** - COND001 (Titicaca)
- **Ana María Quispe Mamani** - COND002 (Titicaca)
- **Carlos Alberto Mamani Choque** - COND003 (Altiplano)
- **Luis Fernando Condori Apaza** - COND004 (Lago Sagrado)

### 🛣️ Rutas (3)
- **Puno - Juliaca** (Titicaca)
- **Juliaca - Arequipa** (Altiplano)
- **Puno - Cusco Turístico** (Lago Sagrado)

### 📄 Expedientes y 📋 Resoluciones
- Expedientes de alta para vehículos principales
- Resoluciones de aprobación correspondientes
- Historial de validaciones con números secuenciales

## 🔧 Funcionalidades Avanzadas

### Timeline de Eventos
Cada vehículo tiene un timeline completo de eventos:
- Creación del vehículo
- Expedientes tramitados
- Resoluciones emitidas
- Validaciones realizadas

### Números Secuenciales Automáticos
- Las validaciones tienen números secuenciales automáticos por vehículo
- Los IDs se generan automáticamente con contadores únicos
- Las relaciones se mantienen consistentes

### Log de Operaciones
- Todas las operaciones se registran con timestamp
- Útil para auditoría y debugging
- Se mantienen las últimas 100 operaciones

### Alertas del Sistema
- Vehículos sin conductor asignado
- Conductores sin vehículo asignado  
- Expedientes pendientes
- Licencias próximas a vencer

## 🧪 Pruebas

### Prueba de Persistencia
```bash
cd backend
python test_persistencia_simple.py
```

### Prueba Completa del Sistema
```bash
cd backend  
python test_data_manager_completo.py
```

### Prueba de Endpoints
```bash
cd backend
# Iniciar servidor primero
uvicorn app.main:app --reload

# En otra terminal
python test_data_manager_endpoints.py
```

## 💡 Ventajas del Sistema

### ✅ Para Desarrollo
- **Datos consistentes** durante toda la sesión
- **Relaciones automáticas** sin configuración manual
- **Estadísticas en tiempo real** para debugging
- **API REST completa** para pruebas

### ✅ Para Pruebas
- **Datos de prueba realistas** con relaciones completas
- **Flujo completo** de procesos empresariales
- **Reseteo fácil** para pruebas limpias
- **Múltiples escenarios** preconfigurados

### ✅ Para Demostración
- **Dashboard ejecutivo** con métricas
- **Visualización de relaciones** entre módulos
- **Timeline de eventos** por entidad
- **Búsquedas avanzadas** con filtros

## ⚠️ Consideraciones

### Limitaciones
- **Solo en memoria**: Los datos se pierden al reiniciar la aplicación
- **Monousuario**: No hay concurrencia entre múltiples usuarios
- **Sin validaciones complejas**: Validaciones básicas solamente

### Uso Recomendado
- ✅ **Desarrollo y pruebas**
- ✅ **Demostraciones**
- ✅ **Prototipado rápido**
- ❌ **Producción** (usar base de datos real)

## 🔮 Futuras Mejoras

### Posibles Extensiones
- **Persistencia en archivo** (JSON/SQLite)
- **Sincronización con base de datos** real
- **Eventos en tiempo real** (WebSockets)
- **Validaciones avanzadas** de negocio
- **Backup/restore** de datos
- **Métricas de rendimiento**

---

## 📞 Soporte

Para dudas o problemas con el DataManager:
1. Revisar los logs de la aplicación
2. Ejecutar `GET /api/data-manager/health` para verificar estado
3. Usar `POST /api/data-manager/reset` para reinicializar datos
4. Consultar este documento para referencia

---

**🎉 ¡El sistema de datos persistentes está listo para usar!**