# Sincronización de Rutas con Búsqueda por Alias

## Problema Identificado

Algunas localidades en las rutas tienen nombres con prefijos como "C.P. LA RINCONADA" que no coinciden exactamente con los nombres en la base de datos de localidades, pero sí existen como **alias** en la tabla `localidades_alias`.

## Solución Implementada

Se actualizó la lógica de sincronización para incluir búsqueda por alias cuando no se encuentra la localidad por ID o nombre directo.

### Orden de Búsqueda

1. **Por ID** (ObjectId o string)
2. **Por NOMBRE** (con normalización de prefijos C.P., CP, etc.)
   - Prioridad: CENTRO_POBLADO > DISTRITO > PROVINCIA
3. **Por ALIAS** ✅ NUEVO
   - Busca en la tabla `localidades_alias`
   - Obtiene la localidad oficial vinculada al alias

### Ejemplo de Caso de Uso

**Ruta con localidad:**
```json
{
  "destino": {
    "id": "69804e2fb1273ca3a8276662",
    "nombre": "C.P. LA RINCONADA"
  }
}
```

**Proceso de sincronización:**
1. Busca por ID `69804e2fb1273ca3a8276662` → No encontrado
2. Busca por nombre "C.P. LA RINCONADA" → No encontrado
3. Busca por nombre normalizado "LA RINCONADA" → No encontrado
4. ✅ **Busca en alias** "C.P. LA RINCONADA" → Encontrado
5. Obtiene localidad oficial vinculada: "LA RINCONADA" (CENTRO_POBLADO)
6. Actualiza la ruta con información completa

### Script de Sincronización

Se creó un script específico que incluye búsqueda por alias:

```bash
python backend/scripts/sincronizar_con_alias.py
```

### Actualización del Endpoint

El endpoint `/rutas/sincronizar-localidades` debe actualizarse para incluir la búsqueda por alias.

**Cambios necesarios en `backend/app/routers/rutas_router.py`:**

```python
async def obtener_localidad_completa(localidad_id: str, nombre: str):
    # ... código existente ...
    
    # ✅ AGREGAR: Búsqueda en alias
    if not localidad:
        alias_collection = db["localidades_alias"]
        
        # Buscar alias
        alias_doc = await alias_collection.find_one({
            "alias": {"$regex": f"^{nombre}$", "$options": "i"},
            "estaActivo": True
        })
        
        # Si se encontró alias, obtener localidad oficial
        if alias_doc:
            localidad_id_alias = alias_doc.get("localidad_id")
            if localidad_id_alias:
                localidad = await localidades_collection.find_one({
                    "_id": ObjectId(localidad_id_alias)
                })
                if localidad:
                    print(f"  ✅ Encontrada por ALIAS: '{nombre}' → '{localidad.get('nombre')}'")
```

### Tabla de Alias

La tabla `localidades_alias` tiene la siguiente estructura:

```json
{
  "_id": ObjectId,
  "localidad_id": "69acc65e0b99f29f61f34b38",  // ID de la localidad oficial
  "alias": "C.P. LA RINCONADA",                 // Nombre alternativo
  "tipo": "ABREVIATURA",                        // Tipo de alias
  "estaActivo": true,
  "fechaCreacion": ISODate,
  "fechaActualizacion": ISODate
}
```

### Casos de Uso Comunes

1. **Prefijos de Centro Poblado:**
   - "C.P. LA RINCONADA" → "LA RINCONADA"
   - "CP HILATA" → "HILATA"
   - "C.P. PAMPA GRANDE" → "PAMPA GRANDE"

2. **Nombres Alternativos:**
   - "SAN MIGUEL DE PAMPA GRANDE" → "PAMPA GRANDE"
   - "PUTINA PUNCO" → "SAN PEDRO DE PUTINA PUNCO"

3. **Abreviaturas:**
   - "JUL" → "JULIACA"
   - "PNO" → "PUNO"

### Beneficios

1. **Mayor tasa de sincronización:** Encuentra localidades que antes no se encontraban
2. **Flexibilidad:** Permite múltiples nombres para la misma localidad
3. **Mantenibilidad:** Los alias se gestionan en una tabla separada
4. **Trazabilidad:** Los logs muestran cuando se encuentra por alias

### Logs de Ejemplo

```
[2/457] Procesando ruta: 02
  ⚠️  ID no encontrado: 69804e2fb1273ca3a8276662, buscando por nombre: C.P. LA RINCONADA
  🔍 Buscando en ALIAS: C.P. LA RINCONADA
  ✅ Encontrada por ALIAS: 'C.P. LA RINCONADA' → 'LA RINCONADA' (CENTRO_POBLADO)
  ✅ Actualizada: destino actualizado
```

### Próximos Pasos

1. ✅ Actualizar el endpoint `/rutas/sincronizar-localidades` con búsqueda por alias
2. ⏳ Crear interfaz para gestionar alias desde el frontend
3. ⏳ Implementar sincronización automática al crear/editar rutas
4. ⏳ Agregar validación de alias duplicados

### Referencias

- Script: `backend/scripts/sincronizar_con_alias.py`
- Endpoint: `POST /api/v1/rutas/sincronizar-localidades`
- Tabla: `localidades_alias`
- Modelo: `backend/app/models/localidad_alias.py`
