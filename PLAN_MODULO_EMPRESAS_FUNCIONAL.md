# Plan: Hacer Funcional el Módulo de Empresas

## Estado Actual

El módulo de empresas tiene la estructura pero muchas funcionalidades no están implementadas o no funcionan correctamente.

## Problemas Identificados

### 1. ❌ Relaciones No Se Actualizan
- Al crear resoluciones, vehículos, conductores o rutas, no se agregan a los arrays de la empresa
- Los contadores muestran "0" aunque existan elementos

### 2. ❌ Backend No Mantiene Relaciones
- Al crear un elemento, el backend no actualiza el array de la empresa
- Necesita implementarse en cada servicio (resoluciones, vehículos, conductores, rutas)

### 3. ⚠️ Funcionalidades Pendientes
- Gestionar vehículos por resolución
- Gestionar rutas por resolución
- Ver historial de transferencias
- Ver bajas vehiculares

## Solución Propuesta

### Fase 1: Corregir Relaciones Existentes ✅

**Script creado**: `CORREGIR_EMPRESA.bat`
- Busca todos los elementos relacionados en MongoDB
- Actualiza los arrays de la empresa
- Solución inmediata para datos existentes

### Fase 2: Implementar Actualización Automática en Backend

#### 2.1 Servicio de Resoluciones
```python
# backend/app/services/resolucion_service.py

async def create_resolucion(resolucion_data):
    # Crear resolución
    result = await resoluciones_collection.insert_one(resolucion_data)
    resolucion_id = str(result.inserted_id)
    
    # Actualizar empresa
    if resolucion_data.get('empresaId'):
        await empresas_collection.update_one(
            {"_id": ObjectId(resolucion_data['empresaId'])},
            {"$addToSet": {"resolucionesPrimigeniasIds": resolucion_id}}
        )
    
    return resolucion_id
```

#### 2.2 Servicio de Vehículos
```python
# backend/app/services/vehiculo_service.py

async def create_vehiculo(vehiculo_data):
    # Crear vehículo
    result = await vehiculos_collection.insert_one(vehiculo_data)
    vehiculo_id = str(result.inserted_id)
    
    # Actualizar empresa
    if vehiculo_data.get('empresaActualId'):
        await empresas_collection.update_one(
            {"_id": ObjectId(vehiculo_data['empresaActualId'])},
            {"$addToSet": {"vehiculosHabilitadosIds": vehiculo_id}}
        )
    
    return vehiculo_id
```

#### 2.3 Servicio de Conductores
```python
# backend/app/services/conductor_service.py

async def create_conductor(conductor_data):
    # Crear conductor
    result = await conductores_collection.insert_one(conductor_data)
    conductor_id = str(result.inserted_id)
    
    # Actualizar empresa
    if conductor_data.get('empresaId'):
        await empresas_collection.update_one(
            {"_id": ObjectId(conductor_data['empresaId'])},
            {"$addToSet": {"conductoresHabilitadosIds": conductor_id}}
        )
    
    return conductor_id
```

#### 2.4 Servicio de Rutas
```python
# backend/app/services/ruta_service.py

async def create_ruta(ruta_data):
    # Crear ruta
    result = await rutas_collection.insert_one(ruta_data)
    ruta_id = str(result.inserted_id)
    
    # Actualizar empresa
    if ruta_data.get('empresaId'):
        await empresas_collection.update_one(
            {"_id": ObjectId(ruta_data['empresaId'])},
            {"$addToSet": {"rutasAutorizadasIds": ruta_id}}
        )
    
    return ruta_id
```

### Fase 3: Implementar Funcionalidades Pendientes

#### 3.1 Tab de Resoluciones ✅
- Ya carga las resoluciones
- Muestra estructura jerárquica (padre-hijas)
- Permite crear nuevas resoluciones

#### 3.2 Tab de Vehículos
- Cargar vehículos de la empresa
- Mostrar lista con detalles
- Permitir agregar/editar/eliminar

#### 3.3 Tab de Conductores
- Cargar conductores de la empresa
- Mostrar lista con detalles
- Permitir agregar/editar/eliminar

#### 3.4 Tab de Rutas
- Cargar rutas de la empresa
- Mostrar lista con detalles
- Permitir agregar/editar/eliminar

#### 3.5 Historial de Transferencias
- Mostrar transferencias de vehículos entre empresas
- Filtrar por fecha
- Exportar historial

#### 3.6 Bajas Vehiculares
- Mostrar vehículos dados de baja
- Filtrar por fecha
- Ver motivos de baja

## Prioridades

### 🔴 Alta Prioridad (Hacer Ahora)
1. ✅ Script de corrección de relaciones (HECHO)
2. ⏳ Implementar actualización automática en backend
3. ⏳ Cargar y mostrar vehículos en el tab correspondiente
4. ⏳ Cargar y mostrar conductores en el tab correspondiente
5. ⏳ Cargar y mostrar rutas en el tab correspondiente

### 🟡 Media Prioridad
6. Gestionar vehículos por resolución
7. Gestionar rutas por resolución
8. Historial de transferencias

### 🟢 Baja Prioridad
9. Bajas vehiculares
10. Exportar datos
11. Estadísticas avanzadas

## Archivos a Modificar

### Backend
```
backend/app/services/
├── resolucion_service.py    ← Agregar actualización de empresa
├── vehiculo_service.py       ← Agregar actualización de empresa
├── conductor_service.py      ← Crear si no existe
└── ruta_service.py           ← Crear si no existe
```

### Frontend
```
frontend/src/app/components/empresas/
├── empresa-detail.component.ts    ← Agregar carga de vehículos/conductores/rutas
└── empresa-detail.component.html  ← Ya tiene la estructura (en template inline)
```

## Pasos Inmediatos

### 1. Corregir Datos Existentes
```bash
CORREGIR_EMPRESA.bat
# Ingresar ID de la empresa
```

### 2. Verificar Backend
Revisar si los servicios existen y tienen los métodos necesarios:
```bash
# Buscar archivos de servicios
ls backend/app/services/
```

### 3. Implementar Actualización Automática
Modificar cada servicio para que actualice la empresa al crear elementos.

### 4. Implementar Carga de Datos en Frontend
Agregar métodos en `empresa-detail.component.ts` para cargar:
- Vehículos
- Conductores  
- Rutas

## Estimación de Tiempo

- **Fase 1** (Corrección): ✅ Completado
- **Fase 2** (Backend): ~2-3 horas
- **Fase 3** (Frontend): ~3-4 horas
- **Total**: ~5-7 horas

## Próximos Pasos

1. ✅ Ejecutar `CORREGIR_EMPRESA.bat` para datos existentes
2. ⏳ Revisar servicios del backend
3. ⏳ Implementar actualización automática
4. ⏳ Implementar carga de datos en frontend
5. ⏳ Probar todas las funcionalidades

---

**Fecha**: 4 de diciembre de 2024
**Estado**: Plan creado, Fase 1 completada
