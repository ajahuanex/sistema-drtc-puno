# 📋 Alias Consolidados para Localidades

## 🎯 Objetivo

Crear un sistema de alias que se acomode a los nuevos datos consolidados de localidades (110 distritos, 13 provincias, 9372 centros poblados).

## 📊 Datos Consolidados

| Tipo | Cantidad |
|------|----------|
| Provincias | 13 |
| Distritos | 110 |
| Centros Poblados | 9,372 |
| **Total** | **9,495** |

## ✅ Alias Generados

### 1. Capitales de Provincia (24 alias)

Se crearon 2 alias para cada una de las 12 capitales de provincia:

```
PUNO:
  - PUNO CIUDAD
  - CIUDAD DE PUNO

JULIACA:
  - JULIACA CIUDAD
  - CIUDAD DE JULIACA

AYAVIRI:
  - AYAVIRI CIUDAD
  - CIUDAD DE AYAVIRI

AZANGARO:
  - AZANGARO CIUDAD
  - CIUDAD DE AZANGARO

ILAVE:
  - ILAVE CIUDAD
  - CIUDAD DE ILAVE

JULI:
  - JULI CIUDAD
  - CIUDAD DE JULI

DESAGUADERO:
  - DESAGUADERO CIUDAD
  - CIUDAD DE DESAGUADERO

HUANCANE:
  - HUANCANE CIUDAD
  - CIUDAD DE HUANCANE

LAMPA:
  - LAMPA CIUDAD
  - CIUDAD DE LAMPA

MOHO:
  - MOHO CIUDAD
  - CIUDAD DE MOHO

SANDIA:
  - SANDIA CIUDAD
  - CIUDAD DE SANDIA

YUNGUYO:
  - YUNGUYO CIUDAD
  - CIUDAD DE YUNGUYO
```

### 2. Centros Poblados (15,718 alias)

Se crearon 2 alias para cada centro poblado con prefijo C.P.:

```
Ejemplo:
  - C.P. CHAQUIMINAS
  - CP CHAQUIMINAS

  - C.P. PEÑA AZUL
  - CP PEÑA AZUL

  - C.P. BELEN
  - CP BELEN
```

## 📈 Estadísticas

```
✅ Alias creados: 15,742
❌ Errores: 2
✓ Total de alias en BD: 15,742
```

## 🔧 Estructura de Alias

Cada alias tiene la siguiente estructura:

```json
{
  "_id": "ObjectId",
  "alias": "PUNO CIUDAD",
  "localidad_id": "69e5b15d215632a140d6b2ff",
  "localidad_nombre": "PUNO",
  "verificado": true,
  "notas": "Alias automático para capital de provincia",
  "estaActivo": true,
  "fechaCreacion": "2026-04-20T...",
  "fechaActualizacion": "2026-04-20T...",
  "usos_como_origen": 0,
  "usos_como_destino": 0,
  "usos_en_itinerario": 0
}
```

## 🔍 Búsqueda de Alias

### Endpoint: GET /api/v1/localidades-alias/buscar/{nombre}

Busca una localidad por nombre o alias:

```bash
# Buscar por nombre oficial
curl http://localhost:8000/api/v1/localidades-alias/buscar/PUNO

# Buscar por alias
curl http://localhost:8000/api/v1/localidades-alias/buscar/PUNO%20CIUDAD

# Buscar centro poblado
curl http://localhost:8000/api/v1/localidades-alias/buscar/C.P.%20CHAQUIMINAS
```

**Respuesta:**
```json
{
  "localidad_id": "69e5b15d215632a140d6b2ff",
  "localidad_nombre": "PUNO",
  "es_alias": true,
  "alias_usado": "PUNO CIUDAD",
  "coordenadas": {
    "longitud": -70.1234,
    "latitud": -15.5678
  }
}
```

## 📝 Endpoints Disponibles

### Crear Alias
```bash
POST /api/v1/localidades-alias/
```

### Obtener Todos los Alias
```bash
GET /api/v1/localidades-alias/?skip=0&limit=100&solo_activos=true
```

### Buscar por Alias
```bash
GET /api/v1/localidades-alias/buscar/{nombre}
```

### Obtener Alias Más Usados
```bash
GET /api/v1/localidades-alias/estadisticas/mas-usados?limit=10
```

### Obtener Alias Sin Usar
```bash
GET /api/v1/localidades-alias/estadisticas/sin-usar
```

### Actualizar Alias
```bash
PUT /api/v1/localidades-alias/{alias_id}
```

### Eliminar Alias
```bash
DELETE /api/v1/localidades-alias/{alias_id}
```

## 🚀 Uso en Rutas

Los alias se pueden usar en cualquier lugar donde se especifique una localidad:

```json
{
  "origen": "PUNO CIUDAD",
  "destino": "C.P. CHAQUIMINAS",
  "distancia": 150,
  "duracion": 180
}
```

El sistema automáticamente resolverá:
- "PUNO CIUDAD" → PUNO (DISTRITO)
- "C.P. CHAQUIMINAS" → CHAQUIMINAS (CENTRO_POBLADO)

## 📊 Estadísticas de Uso

Los alias rastrean su uso en:
- `usos_como_origen`: Veces usado como punto de partida
- `usos_como_destino`: Veces usado como destino
- `usos_en_itinerario`: Veces usado en itinerarios

## 🔄 Actualización de Alias

Si necesitas agregar más alias o modificar los existentes:

1. **Crear nuevo alias:**
   ```bash
   POST /api/v1/localidades-alias/
   {
     "alias": "NUEVO ALIAS",
     "localidad_id": "ID_DE_LOCALIDAD",
     "localidad_nombre": "NOMBRE_LOCALIDAD",
     "verificado": false,
     "notas": "Descripción del alias"
   }
   ```

2. **Actualizar alias:**
   ```bash
   PUT /api/v1/localidades-alias/{alias_id}
   {
     "alias": "ALIAS ACTUALIZADO",
     "verificado": true
   }
   ```

3. **Eliminar alias:**
   ```bash
   DELETE /api/v1/localidades-alias/{alias_id}
   ```

## ✨ Beneficios

1. **Flexibilidad**: Los usuarios pueden usar nombres alternativos
2. **Compatibilidad**: Soporta variantes comunes (C.P., CP, etc.)
3. **Rastreo**: Registra el uso de cada alias
4. **Mantenimiento**: Fácil de actualizar y gestionar

## 📝 Notas

- Los alias para capitales de provincia están marcados como `verificado: true`
- Los alias para centros poblados están marcados como `verificado: false` (requieren verificación manual)
- Todos los alias están activos por defecto (`estaActivo: true`)
- Los alias se pueden desactivar sin eliminarlos

---

**Estado**: ✅ COMPLETADO - 15,742 alias generados y almacenados en BD

