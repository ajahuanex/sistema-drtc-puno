# Solución: Problema de visualización de localidades

## Problema identificado
Las localidades no se mostraban en el frontend porque:
1. El campo `esta_activa` en la base de datos era `None` en lugar de `True`/`False`
2. El modelo Pydantic no estaba mapeando correctamente entre `esta_activa` (snake_case) y `estaActiva` (camelCase)

## Solución aplicada

### 1. Corrección de datos en MongoDB
✅ Ejecutado: `backend/fix_localidades.py`
- Actualizó 108 localidades con `esta_activa = None` a `esta_activa = True`
- Agregó el campo `estaActiva = True` (camelCase) para compatibilidad
- Resultado: 182 localidades activas en total

### 2. Corrección del servicio de localidades
✅ Modificado: `backend/app/services/localidad_service.py`
- Método `_document_to_localidad` ahora:
  - Asegura que `estaActiva` esté definido
  - Elimina `esta_activa` para evitar conflictos con Pydantic
  - Mapea correctamente entre snake_case y camelCase

### 3. Corrección del modelo Pydantic
✅ Modificado: `backend/app/models/localidad.py`
- Agregado alias `esta_activa` al campo `estaActiva`
- Configurado `populate_by_name = True` para permitir ambos nombres
- Ahora acepta tanto `estaActiva` como `esta_activa`

## Verificación

### Estado de la base de datos
```bash
cd backend
python check_localidades.py
```

Resultado esperado:
- ✅ Total localidades en BD: 182
- ✅ Todas con `esta_activa = True`

### Estado del endpoint
```bash
cd backend
python test_localidades_endpoint.py
```

Resultado esperado:
- ✅ Status Code: 200
- ✅ Total localidades recibidas: 182
- ✅ Campo `esta_activa: True` presente en cada localidad

## Pasos para aplicar la solución

### 1. Reiniciar el backend
```bash
# Detener el backend actual (Ctrl+C en la terminal donde está corriendo)
# O matar el proceso:
# Windows:
taskkill /F /IM uvicorn.exe

# Luego reiniciar:
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Verificar en el frontend
1. Abrir el navegador en `http://localhost:4200/localidades`
2. Deberías ver las 182 localidades
3. Las estadísticas deberían mostrar:
   - Provincias: ~13
   - Distritos: ~108
   - Centros Poblados: ~61

### 3. Si aún no se ven los datos
1. Abrir la consola del navegador (F12)
2. Ir a la pestaña "Network"
3. Recargar la página
4. Buscar la petición a `/api/v1/localidades`
5. Verificar que:
   - Status: 200
   - Response contiene un array con 182 elementos
   - Cada elemento tiene `esta_activa: true` o `estaActiva: true`

## Scripts de utilidad creados

1. **check_localidades.py** - Verifica el estado de las localidades en MongoDB
2. **fix_localidades.py** - Corrige el campo `esta_activa` en todas las localidades
3. **test_localidades_endpoint.py** - Prueba el endpoint de localidades

## Archivos modificados

1. `backend/app/services/localidad_service.py` - Líneas 500-510
2. `backend/app/models/localidad.py` - Líneas 95-105

## Notas importantes

- ✅ Los datos en MongoDB están corregidos permanentemente
- ✅ El código ahora maneja correctamente ambos formatos (snake_case y camelCase)
- ✅ No se requieren migraciones adicionales
- ⚠️ Es necesario reiniciar el backend para aplicar los cambios del modelo

## Próximos pasos

Si después de reiniciar el backend aún no se ven las localidades:
1. Verificar que el servicio `LocalidadesFactoryService` esté usando el endpoint correcto
2. Revisar la consola del navegador para errores de CORS
3. Verificar que el filtro de localidades no esté ocultando los resultados
