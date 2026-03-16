# Metadata en Localidades de Rutas

## Objetivo

Agregar trazabilidad y flexibilidad a las localidades embebidas en rutas mediante un campo `metadata` que permite almacenar información adicional sin modificar la estructura principal del modelo.

## Implementación

### Backend - Modelo

**Archivo:** `backend/app/models/ruta.py`

```python
class LocalidadEmbebida(BaseModel):
    id: str
    nombre: str
    tipo: Optional[str] = None
    ubigeo: Optional[str] = None
    departamento: Optional[str] = None
    provincia: Optional[str] = None
    distrito: Optional[str] = None
    coordenadas: Optional[dict] = None
    # ✅ NUEVO
    metadata: Optional[dict] = None
```

### Frontend - Modelo

**Archivo:** `frontend/src/app/models/ruta.model.ts`

```typescript
export interface LocalidadEmbebida {
  id: string;
  nombre: string;
  tipo?: string;
  ubigeo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  coordenadas?: { latitud: number; longitud: number };
  // ✅ NUEVO
  metadata?: {
    es_alias?: boolean;
    nombre_oficial?: string;
    alias_id?: string;
    fecha_sincronizacion?: string;
    [key: string]: any; // Extensible
  };
}
```

## Uso Actual: Trazabilidad de Alias

Cuando una localidad se encuentra por alias durante la sincronización, se agrega metadata:

```json
{
  "destino": {
    "id": "69acc65e0b99f29f61f34b38",
    "nombre": "C.P. LA RINCONADA",
    "tipo": "CENTRO_POBLADO",
    "ubigeo": "211002",
    "departamento": "PUNO",
    "provincia": "SAN ANTONIO DE PUTINA",
    "distrito": "ANANEA",
    "coordenadas": {
      "latitud": -14.678,
      "longitud": -69.535
    },
    "metadata": {
      "es_alias": true,
      "nombre_oficial": "LA RINCONADA",
      "alias_id": "69abc123...",
      "fecha_sincronizacion": "2026-03-08T20:30:00.000Z"
    }
  }
}
```

## Ventajas

### 1. Trazabilidad
- Sabes exactamente qué localidades se encontraron por alias
- Puedes auditar cuándo se sincronizó cada localidad
- Tienes referencia al alias específico usado

### 2. Preservación de Nombres
- El nombre en la ruta se mantiene: "C.P. LA RINCONADA"
- El nombre oficial se guarda en metadata: "LA RINCONADA"
- No se pierde información

### 3. Extensibilidad
El campo `metadata` es un diccionario flexible que permite agregar cualquier información futura sin cambiar el modelo:

```json
{
  "metadata": {
    // Alias
    "es_alias": true,
    "nombre_oficial": "LA RINCONADA",
    
    // Validación manual
    "validado_manualmente": true,
    "validado_por": "admin@drtc.gob.pe",
    "fecha_validacion": "2026-03-10",
    
    // Importación
    "fuente": "importacion_masiva",
    "lote": "2024-03",
    "archivo_origen": "rutas_marzo_2024.xlsx",
    
    // Correcciones
    "corregido": true,
    "nombre_anterior": "C.P. RINCONADA",
    "motivo_correccion": "Faltaba 'LA'",
    
    // Cualquier otro dato futuro...
  }
}
```

## Casos de Uso

### 1. Reportes de Alias
Generar reporte de todas las rutas que usan alias:

```python
rutas_con_alias = [
    ruta for ruta in rutas 
    if ruta.origen.metadata and ruta.origen.metadata.get('es_alias')
    or ruta.destino.metadata and ruta.destino.metadata.get('es_alias')
]
```

### 2. Validación de Alias
Verificar si los alias siguen siendo válidos:

```python
for ruta in rutas:
    if ruta.origen.metadata and ruta.origen.metadata.get('es_alias'):
        alias_id = ruta.origen.metadata.get('alias_id')
        # Verificar si el alias aún existe y está activo
        alias = await alias_collection.find_one({"_id": ObjectId(alias_id)})
        if not alias or not alias.get('estaActivo'):
            print(f"⚠️ Alias inválido en ruta {ruta.codigoRuta}")
```

### 3. Auditoría
Ver cuándo se sincronizó cada localidad:

```typescript
const ultimaSincronizacion = ruta.origen.metadata?.fecha_sincronizacion;
if (ultimaSincronizacion) {
  console.log(`Última sincronización: ${new Date(ultimaSincronizacion).toLocaleDateString()}`);
}
```

### 4. Interfaz de Usuario
Mostrar información adicional al usuario:

```typescript
if (localidad.metadata?.es_alias) {
  tooltip = `"${localidad.nombre}" es un alias de "${localidad.metadata.nombre_oficial}"`;
}
```

## Lógica de Sincronización

**Archivo:** `backend/app/routers/rutas_router.py`

```python
# Si se encontró por alias, agregar metadata
if alias_doc:
    metadata = {
        "es_alias": True,
        "nombre_oficial": localidad.get("nombre"),
        "alias_id": str(alias_doc.get("_id")),
        "fecha_sincronizacion": datetime.utcnow().isoformat()
    }

# Agregar metadata al resultado
resultado = {
    "id": str(localidad.get("_id")),
    "nombre": nombre_original,  # Preserva el nombre de la ruta
    "tipo": tipo,
    "ubigeo": localidad.get("ubigeo"),
    # ... otros campos ...
}
if metadata:
    resultado["metadata"] = metadata
```

## Principios de Diseño

### 1. No Invasivo
- No cambia la estructura principal del modelo
- Campos existentes no se modifican
- Retrocompatible con rutas sin metadata

### 2. Opcional
- El campo `metadata` es opcional
- Rutas sin metadata funcionan normalmente
- No requiere migración de datos existentes

### 3. Flexible
- Puede contener cualquier información
- No requiere cambios en el modelo para agregar nuevos campos
- Cada caso de uso puede agregar sus propios campos

### 4. Autodocumentado
- Los campos en metadata son descriptivos
- Fácil de entender qué significa cada campo
- No requiere documentación externa

## Ejemplos de Uso Futuro

### Validación Manual
```json
{
  "metadata": {
    "validado_manualmente": true,
    "validado_por": "admin@drtc.gob.pe",
    "fecha_validacion": "2026-03-10",
    "observaciones": "Coordenadas verificadas en campo"
  }
}
```

### Importación Masiva
```json
{
  "metadata": {
    "fuente": "importacion_masiva",
    "lote": "2024-03",
    "archivo_origen": "rutas_marzo_2024.xlsx",
    "fila_excel": 42
  }
}
```

### Correcciones
```json
{
  "metadata": {
    "corregido": true,
    "nombre_anterior": "C.P. RINCONADA",
    "fecha_correccion": "2026-03-08",
    "motivo": "Faltaba 'LA' en el nombre"
  }
}
```

### Geolocalización
```json
{
  "metadata": {
    "coordenadas_verificadas": true,
    "metodo_verificacion": "GPS",
    "precision_metros": 10,
    "fecha_verificacion": "2026-03-08"
  }
}
```

## Migración

No se requiere migración. Las rutas existentes funcionan sin metadata. La metadata se agrega automáticamente durante la sincronización cuando se encuentra una localidad por alias.

## Conclusión

El campo `metadata` proporciona una solución elegante y flexible para agregar información adicional a las localidades en rutas sin modificar la estructura principal del modelo. Es especialmente útil para trazabilidad de alias, pero puede extenderse a cualquier caso de uso futuro.

---

**Fecha de implementación:** 8 de marzo de 2026  
**Versión:** 1.0.0  
**Estado:** ✅ Implementado y documentado
