# 🏷️ Sistema de Alias - Funcionamiento Correcto

## 📌 ¿Qué es un Alias?

Un **alias** es un nombre alternativo para una localidad. Se crea **manualmente** cuando:

1. **La localidad es más conocida por otro nombre**
   - Ejemplo: "PUNO" es conocido como "CIUDAD DE PUNO"

2. **Otra fuente de datos la llama diferente**
   - Ejemplo: Un documento oficial puede referirse a "JULIACA" como "JULIACA CIUDAD"

3. **Hay variantes locales del nombre**
   - Ejemplo: "CHAQUIMINAS" podría tener alias "CHAQUIMINA" (sin la S)

## 🎯 Lógica de Alias

```
LOCALIDAD OFICIAL: PUNO
├─ ALIAS 1: CIUDAD DE PUNO
├─ ALIAS 2: PUNO CIUDAD
└─ ALIAS 3: PUNO CAPITAL
```

Cuando alguien busca "CIUDAD DE PUNO", el sistema resuelve a "PUNO".

## 📊 Estructura en BD

```json
{
  "_id": "ObjectId",
  "alias": "CIUDAD DE PUNO",
  "localidad_id": "69e5b15d215632a140d6b2ff",
  "localidad_nombre": "PUNO",
  "verificado": true,
  "notas": "Nombre alternativo común",
  "estaActivo": true,
  "fechaCreacion": "2026-04-20T...",
  "fechaActualizacion": "2026-04-20T...",
  "usos_como_origen": 0,
  "usos_como_destino": 0,
  "usos_en_itinerario": 0
}
```

## 🔧 Cómo Crear Alias

### Opción 1: Desde el Frontend (RECOMENDADO)
1. Ir a **Localidades → Gestionar Alias**
2. Tab: "Crear Alias"
3. Seleccionar localidad: "PUNO"
4. Escribir alias: "CIUDAD DE PUNO"
5. Marcar como verificado (opcional)
6. Hacer clic en "Crear Alias"

### Opción 2: Desde la API
```bash
curl -X POST "http://localhost:8000/api/v1/localidades-alias/" \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "CIUDAD DE PUNO",
    "localidad_id": "69e5b15d215632a140d6b2ff",
    "localidad_nombre": "PUNO",
    "verificado": true,
    "notas": "Nombre alternativo común"
  }'
```

## 🔍 Cómo Buscar Usando Alias

### Desde la API
```bash
# Buscar por alias
curl "http://localhost:8000/api/v1/localidades-alias/buscar/CIUDAD%20DE%20PUNO"

# Respuesta
{
  "localidad_id": "69e5b15d215632a140d6b2ff",
  "localidad_nombre": "PUNO",
  "es_alias": true,
  "alias_usado": "CIUDAD DE PUNO",
  "coordenadas": {...}
}
```

### Desde el Frontend
1. Ir a **Localidades → Búsqueda**
2. Escribir: "CIUDAD DE PUNO"
3. Se resuelve a: "PUNO" (DISTRITO)

## 📋 Endpoints de Alias

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/localidades-alias/` | Crear nuevo alias |
| GET | `/localidades-alias/` | Listar todos los alias |
| GET | `/localidades-alias/buscar/{nombre}` | Buscar por nombre o alias |
| GET | `/localidades-alias/{id}` | Obtener alias por ID |
| PUT | `/localidades-alias/{id}` | Actualizar alias |
| DELETE | `/localidades-alias/{id}` | Eliminar alias |
| GET | `/localidades-alias/estadisticas/mas-usados` | Alias más usados |
| GET | `/localidades-alias/estadisticas/sin-usar` | Alias sin usar |

## ✨ Características

1. **Creación Manual**: Solo se crean cuando es necesario
2. **Búsqueda Flexible**: Buscar por nombre oficial o alias
3. **Rastreo de Uso**: Registra cuántas veces se usa cada alias
4. **Verificación**: Marcar alias como verificados
5. **Gestión**: Crear, editar, eliminar alias

## 📊 Estadísticas de Alias

### Alias Más Usados
```bash
curl "http://localhost:8000/api/v1/localidades-alias/estadisticas/mas-usados?limit=5"
```

Muestra los alias que más se han usado en rutas.

### Alias Sin Usar
```bash
curl "http://localhost:8000/api/v1/localidades-alias/estadisticas/sin-usar"
```

Muestra los alias que se crearon pero nunca se han usado.

## 🚀 Flujo de Uso

```
1. Usuario crea alias manualmente
   ↓
2. Alias se guarda en BD
   ↓
3. Usuario busca por alias
   ↓
4. Sistema resuelve a localidad oficial
   ↓
5. Se registra el uso del alias
   ↓
6. Estadísticas se actualizan
```

## 💡 Ejemplos de Alias Útiles

### Capitales de Provincia
```
PUNO → "CIUDAD DE PUNO", "PUNO CAPITAL"
JULIACA → "JULIACA CIUDAD", "CIUDAD DE JULIACA"
AYAVIRI → "AYAVIRI CIUDAD", "CIUDAD DE AYAVIRI"
```

### Variantes de Nombres
```
CHAQUIMINAS → "CHAQUIMINA"
PEÑA AZUL → "PEÑA AZUL CENTRO"
BELEN → "BELÉN"
```

### Nombres Locales
```
PUNO → "PUNO VIEJO", "PUNO CENTRO"
JULIACA → "JULIACA CENTRO", "JULIACA NUEVA"
```

## ⚠️ Notas Importantes

1. **Los alias NO se generan automáticamente**
   - Se crean manualmente cuando es necesario

2. **Un alias apunta a UNA localidad**
   - No puede haber alias ambiguo

3. **Los alias se pueden desactivar**
   - Sin necesidad de eliminarlos

4. **Se rastrea el uso**
   - Para saber qué alias son más útiles

---

**Resumen**: Los alias son nombres alternativos que se crean **manualmente** para localidades. Se usan cuando la localidad es más conocida por otro nombre o cuando otra fuente de datos la llama diferente.

