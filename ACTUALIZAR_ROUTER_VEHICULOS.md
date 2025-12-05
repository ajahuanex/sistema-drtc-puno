# Actualización del Router de Vehículos

## Problema

El router `vehiculos_router.py` tiene 16 ocurrencias de `MockVehiculoService` que no existe.

## Solución

Reemplazar `MockVehiculoService()` con `VehiculoService(db)` y agregar `db = Depends(get_database)` a cada endpoint.

## Endpoints a Actualizar

### ✅ Completados

1. **POST /** - Crear vehículo
   - Ya actualizado con `VehiculoService(db)`

### ⏳ Pendientes (Críticos)

2. **GET /** - Listar vehículos (línea 63)
3. **GET /{vehiculo_id}** - Obtener vehículo (línea 496)
4. **PUT /{vehiculo_id}** - Actualizar vehículo (línea 585)
5. **DELETE /{vehiculo_id}** - Eliminar vehículo (línea 623)
6. **GET /validar-placa/{placa}** - Validar placa (línea 564)

### ⏳ Pendientes (Secundarios)

7. GET /filtros - Filtros avanzados (línea 134)
8. GET /estadisticas - Estadísticas (línea 185)
9. POST /{vehiculo_id}/rutas/{ruta_id} - Agregar ruta (línea 636)
10. DELETE /{vehiculo_id}/rutas/{ruta_id} - Remover ruta (línea 671)
11. POST /{vehiculo_id}/tuc - Asignar TUC (línea 707)
12. DELETE /{vehiculo_id}/tuc - Remover TUC (línea 741)
13. PUT /{vehiculo_id}/cambiar-empresa - Cambiar empresa (línea 777)
14. GET /exportar/{formato} - Exportar (línea 816)

## Patrón de Actualización

### ANTES
```python
@router.get("/{vehiculo_id}")
async def get_vehiculo(vehiculo_id: str):
    vehiculo_service = MockVehiculoService()
    vehiculo = await vehiculo_service.get_vehiculo_by_id(vehiculo_id)
    return vehiculo
```

### DESPUÉS
```python
@router.get("/{vehiculo_id}")
async def get_vehiculo(
    vehiculo_id: str,
    db = Depends(get_database)
):
    vehiculo_service = VehiculoService(db)
    vehiculo = await vehiculo_service.get_vehiculo(vehiculo_id)
    if not vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    return VehiculoResponse(**vehiculo.model_dump())
```

## Prioridad de Actualización

### 🔴 Alta (Hacer Ahora)
- ✅ POST / (crear) - HECHO
- ⏳ GET / (listar)
- ⏳ GET /{id} (obtener)
- ⏳ PUT /{id} (actualizar)
- ⏳ DELETE /{id} (eliminar)

### 🟡 Media
- GET /validar-placa
- GET /filtros
- PUT /{id}/cambiar-empresa

### 🟢 Baja
- GET /estadisticas
- Endpoints de rutas
- Endpoints de TUC
- Exportar

## Recomendación

Por ahora, actualizar solo los 5 endpoints críticos para que el CRUD básico funcione. Los demás pueden actualizarse después.

---

**Estado**: 1/16 endpoints actualizados (6%)
**Próximo**: Actualizar GET / para listar vehículos
