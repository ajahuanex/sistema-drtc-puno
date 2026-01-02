# ✅ Actualización de Empresas para usar MongoDB

## Estado Actual

El servicio de empresas (`EmpresaService`) ya está implementado para MongoDB, pero el router (`empresas_router.py`) todavía usa `MockEmpresaService`.

## Cambios Realizados

### 1. Repositorio Creado ✅

**Archivo**: `backend/app/repositories/empresa_repository.py`

Repositorio completo con operaciones CRUD:
- `create()` - Crear empresa
- `get_by_id()` - Obtener por ID
- `get_by_ruc()` - Obtener por RUC
- `get_by_codigo()` - Obtener por código
- `list()` - Listar con filtros
- `count()` - Contar registros
- `update()` - Actualizar empresa
- `delete()` - Soft delete
- `search()` - Búsqueda por texto
- `get_by_estado()` - Filtrar por estado
- `exists_ruc()` - Verificar existencia
- `get_estadisticas()` - Estadísticas

### 2. Router Actualizado (Parcial) ⏳

**Archivo**: `backend/app/routers/empresas_router.py`

**Cambios necesarios**:
- ✅ Import de `EmpresaService` en lugar de `MockEmpresaService`
- ✅ Agregada función `get_empresa_service()` como dependency
- ⏳ Actualizar todos los endpoints para usar Depends

**Endpoints que necesitan actualización** (20 endpoints):
1. `POST /` - create_empresa
2. `GET /` - get_empresas
3. `GET /filtros` - get_empresas_filtradas
4. `GET /estadisticas` - get_estadisticas_empresas
5. `GET /{empresa_id}` - get_empresa
6. `GET /ruc/{ruc}` - get_empresa_by_ruc
7. `GET /validar-ruc/{ruc}` - validar_ruc
8. `PUT /{empresa_id}` - update_empresa
9. `DELETE /{empresa_id}` - delete_empresa
10. `POST /{empresa_id}/vehiculos/{vehiculo_id}` - agregar_vehiculo
11. `DELETE /{empresa_id}/vehiculos/{vehiculo_id}` - remover_vehiculo
12. `POST /{empresa_id}/conductores/{conductor_id}` - agregar_conductor
13. `DELETE /{empresa_id}/conductores/{conductor_id}` - remover_conductor
14. `POST /{empresa_id}/rutas/{ruta_id}` - agregar_ruta
15. `DELETE /{empresa_id}/rutas/{ruta_id}` - remover_ruta
16. `POST /{empresa_id}/resoluciones/{resolucion_id}` - agregar_resolucion
17. `DELETE /{empresa_id}/resoluciones/{resolucion_id}` - remover_resolucion
18. `GET /{empresa_id}/resoluciones` - get_resoluciones_empresa
19. `GET /exportar` - exportar_empresas
20. `GET /siguiente-codigo` - obtener_siguiente_codigo_empresa

## Patrón de Actualización

### Antes:
```python
@router.get("/{empresa_id}")
async def get_empresa(empresa_id: str):
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.get_empresa_by_id(empresa_id)
    return empresa
```

### Después:
```python
@router.get("/{empresa_id}")
async def get_empresa(
    empresa_id: str,
    empresa_service: EmpresaService = Depends(get_empresa_service)
):
    empresa = await empresa_service.get_empresa_by_id(empresa_id)
    return empresa
```

## Próximos Pasos

1. ✅ Crear repositorio de empresas
2. ⏳ Actualizar todos los endpoints del router
3. ⏳ Probar endpoints con MongoDB
4. ⏳ Verificar que los datos se persistan
5. ⏳ Actualizar otros servicios (Vehículos, Resoluciones, etc.)

## Verificación

### Probar Creación de Empresa

```bash
curl -X POST http://localhost:8000/api/v1/empresas \
  -H "Content-Type: application/json" \
  -d '{
    "ruc": "20123456789",
    "razonSocial": "Transportes Test S.A.",
    "direccionFiscal": "Av. Test 123",
    "estado": "activo"
  }'
```

### Verificar en MongoDB

```bash
docker exec -it sirret-mongodb mongosh -u admin -p password
use sirret_db
db.empresas.find().pretty()
```

### Verificar Persistencia

```bash
# 1. Crear empresa
# 2. Reiniciar backend
docker-compose restart backend
# 3. Listar empresas - debe seguir ahí
curl http://localhost:8000/api/v1/empresas
```

## Beneficios

- ✅ Datos persistentes en MongoDB
- ✅ Operaciones CRUD completas
- ✅ Búsquedas y filtros avanzados
- ✅ Estadísticas en tiempo real
- ✅ Soft delete para auditoría
- ✅ Timestamps automáticos
- ✅ Validación de duplicados

## Estado

**Progreso**: 30% completado
- ✅ Repositorio creado
- ✅ Imports actualizados
- ✅ Dependency function creada
- ⏳ Endpoints pendientes de actualizar

**Tiempo estimado**: 30-45 minutos para completar todos los endpoints
