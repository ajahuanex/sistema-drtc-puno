# 🏷️ ¿Dónde Están los Alias?

## 📍 Ubicación de los Alias

### 1. En la Base de Datos
Los 15,742 alias están almacenados en la colección `localidades_alias` de MongoDB:

```bash
# Verificar alias en BD
python << 'EOF'
from pymongo import MongoClient

client = MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['drtc_db']

total = db.localidades_alias.count_documents({})
print(f"Total de alias en BD: {total}")

# Mostrar ejemplos
for alias in db.localidades_alias.find().limit(3):
    print(f"  - {alias['alias']} → {alias['localidad_nombre']}")

client.close()
EOF
```

### 2. En el Backend (API)
Los alias se acceden a través de los endpoints REST:

```bash
# Obtener todos los alias
curl "http://localhost:8000/api/v1/localidades-alias/?skip=0&limit=10"

# Buscar un alias específico
curl "http://localhost:8000/api/v1/localidades-alias/buscar/PUNO%20CIUDAD"

# Obtener alias más usados
curl "http://localhost:8000/api/v1/localidades-alias/estadisticas/mas-usados?limit=5"
```

### 3. En el Frontend
Hay dos formas de acceder a los alias:

#### Opción A: Componente de Gestión de Alias (NUEVO)
Se creó un nuevo componente `GestionarAliasComponent` que permite:
- ✅ Ver todos los alias
- ✅ Crear nuevos alias
- ✅ Editar alias existentes
- ✅ Eliminar alias
- ✅ Ver estadísticas

**Archivo**: `frontend/src/app/components/localidades/gestionar-alias.component.ts`

#### Opción B: Búsqueda en Localidades
Los alias se pueden buscar desde el componente de Localidades:
- Ir a **Localidades → Búsqueda**
- Escribir el alias (ej: "PUNO CIUDAD")
- Se resuelve automáticamente a la localidad

## 🔍 Cómo Buscar Alias

### Desde la API
```bash
# Buscar por nombre de alias
curl "http://localhost:8000/api/v1/localidades-alias/buscar/PUNO%20CIUDAD"

# Respuesta
{
  "localidad_id": "69e5b15d215632a140d6b2ff",
  "localidad_nombre": "PUNO",
  "es_alias": true,
  "alias_usado": "PUNO CIUDAD",
  "coordenadas": {...}
}
```

### Desde el Frontend
1. Ir a **Localidades → Búsqueda**
2. Escribir: `PUNO CIUDAD`
3. Se muestra: PUNO (DISTRITO)

## 📊 Tipos de Alias Generados

### 1. Capitales de Provincia (24 alias)
Cada capital tiene 2 variantes:

```
PUNO:
  - PUNO CIUDAD
  - CIUDAD DE PUNO

JULIACA:
  - JULIACA CIUDAD
  - CIUDAD DE JULIACA

... (12 capitales en total)
```

### 2. Centros Poblados (15,718 alias)
Cada centro poblado tiene 2 variantes:

```
CHAQUIMINAS:
  - C.P. CHAQUIMINAS
  - CP CHAQUIMINAS

PEÑA AZUL:
  - C.P. PEÑA AZUL
  - CP PEÑA AZUL

... (9,372 centros poblados)
```

## 🎯 Cómo Crear Nuevos Alias

### Opción 1: Desde el Frontend (RECOMENDADO)
1. Ir a **Localidades → Gestionar Alias** (nuevo)
2. Tab: "Crear Alias"
3. Seleccionar localidad
4. Escribir alias
5. Hacer clic en "Crear Alias"

### Opción 2: Desde la API
```bash
curl -X POST "http://localhost:8000/api/v1/localidades-alias/" \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "PUNO CIUDAD",
    "localidad_id": "69e5b15d215632a140d6b2ff",
    "localidad_nombre": "PUNO",
    "verificado": true,
    "notas": "Alias para capital de provincia"
  }'
```

### Opción 3: Script Python
```python
import requests

alias_data = {
    "alias": "PUNO CIUDAD",
    "localidad_id": "69e5b15d215632a140d6b2ff",
    "localidad_nombre": "PUNO",
    "verificado": True,
    "notas": "Alias para capital"
}

response = requests.post(
    "http://localhost:8000/api/v1/localidades-alias/",
    json=alias_data
)

print(response.json())
```

## 📋 Endpoints de Alias

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/localidades-alias/` | Obtener todos los alias |
| GET | `/localidades-alias/buscar/{nombre}` | Buscar por nombre o alias |
| GET | `/localidades-alias/estadisticas/mas-usados` | Alias más usados |
| GET | `/localidades-alias/estadisticas/sin-usar` | Alias sin usar |
| GET | `/localidades-alias/{id}` | Obtener alias por ID |
| POST | `/localidades-alias/` | Crear nuevo alias |
| PUT | `/localidades-alias/{id}` | Actualizar alias |
| DELETE | `/localidades-alias/{id}` | Eliminar alias |

## 🔧 Estructura de un Alias

```json
{
  "id": "507f1f77bcf86cd799439011",
  "alias": "PUNO CIUDAD",
  "localidad_id": "69e5b15d215632a140d6b2ff",
  "localidad_nombre": "PUNO",
  "verificado": true,
  "notas": "Alias para capital de provincia",
  "estaActivo": true,
  "fechaCreacion": "2026-04-20T10:30:00",
  "fechaActualizacion": "2026-04-20T10:30:00",
  "usos_como_origen": 0,
  "usos_como_destino": 0,
  "usos_en_itinerario": 0
}
```

## 📊 Estadísticas de Alias

### Total de Alias
```bash
curl "http://localhost:8000/api/v1/localidades-alias/?skip=0&limit=1"
# Respuesta: Array con 1 elemento (para contar total)
```

### Alias Más Usados
```bash
curl "http://localhost:8000/api/v1/localidades-alias/estadisticas/mas-usados?limit=5"
# Respuesta: Array con los 5 alias más usados
```

### Alias Sin Usar
```bash
curl "http://localhost:8000/api/v1/localidades-alias/estadisticas/sin-usar"
# Respuesta: Array con todos los alias sin usar
```

## ✨ Características

1. **Búsqueda Flexible**: Buscar por nombre oficial o alias
2. **Rastreo de Uso**: Registra cuántas veces se usa cada alias
3. **Verificación**: Marcar alias como verificados
4. **Gestión**: Crear, editar, eliminar alias
5. **Estadísticas**: Ver alias más usados y sin usar

## 🚀 Próximos Pasos

1. **Integrar componente en menú**
   - Agregar "Gestionar Alias" al menú de Localidades

2. **Usar alias en rutas**
   - Permitir crear rutas usando alias

3. **Sincronizar uso**
   - Actualizar estadísticas cuando se usan alias

---

**Resumen**: Los 15,742 alias están en la BD y listos para usar. Se puede acceder desde:
- ✅ API REST
- ✅ Frontend (búsqueda)
- ✅ Nuevo componente de gestión (próximamente)

