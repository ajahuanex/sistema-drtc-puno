# 🔍 Cómo Ver los Datos Duplicados

Se han agregado dos nuevos endpoints para diagnosticar y ver exactamente qué datos están duplicados.

## 1️⃣ Endpoint: Diagnóstico de Duplicados

**URL**: `GET http://localhost:8000/api/v1/diagnostico-duplicados`

**Descripción**: Muestra todos los duplicados en la base de datos, agrupados por tipo.

**Respuesta**:
```json
{
  "total_localidades": 9123,
  "duplicados_por_tipo": {
    "PROVINCIA": 0,
    "DISTRITO": 12,
    "CENTRO_POBLADO": 5
  },
  "duplicados_detalle": [
    {
      "nombre": "NOMBRE_DEL_DISTRITO",
      "tipo": "DISTRITO",
      "cantidad": 2,
      "ubigeos": ["210502"],
      "provincias": ["EL COLLAO"],
      "distritos": ["CAPAZO"],
      "ids": ["id1", "id2"]
    }
  ]
}
```

**Cómo usarlo**:
```bash
# Desde terminal
curl http://localhost:8000/api/v1/diagnostico-duplicados

# O desde el navegador
http://localhost:8000/api/v1/diagnostico-duplicados
```

## 2️⃣ Endpoint: Análisis de Distritos Faltantes

**URL**: `GET http://localhost:8000/api/v1/distritos-faltantes`

**Descripción**: Compara los distritos en el archivo GeoJSON con los en la BD y muestra cuáles faltan.

**Respuesta**:
```json
{
  "total_en_archivo": 110,
  "total_en_bd": 98,
  "faltantes": [
    {
      "nombre": "NOMBRE_DEL_DISTRITO",
      "ubigeo": "210502",
      "provincia": "EL COLLAO"
    }
  ],
  "duplicados_en_bd": [
    {
      "nombre": "NOMBRE_DEL_DISTRITO",
      "ubigeo": "210502",
      "cantidad": 2,
      "ids": ["id1", "id2"]
    }
  ]
}
```

**Cómo usarlo**:
```bash
# Desde terminal
curl http://localhost:8000/api/v1/distritos-faltantes

# O desde el navegador
http://localhost:8000/api/v1/distritos-faltantes
```

## 📊 Ejemplo de Salida en Terminal

Cuando se ejecutan estos endpoints, también se imprime un reporte en la terminal del backend:

```
================================================================================
📊 DIAGNÓSTICO DE DUPLICADOS
================================================================================
Total de localidades: 9123
Total de duplicados encontrados: 17

PROVINCIA: 0 duplicados
DISTRITO: 12 duplicados
CENTRO_POBLADO: 5 duplicados

📋 DETALLE DE DUPLICADOS:

  • CAPAZO (DISTRITO)
    Cantidad: 2
    UBIGEO: 210502
    Provincias: EL COLLAO
    Distritos: CAPAZO

  • PUNO (DISTRITO)
    Cantidad: 2
    UBIGEO: 210101
    Provincias: PUNO
    Distritos: PUNO

  ... y 10 duplicados más
================================================================================
```

## 🔧 Pasos para Revisar los Duplicados

### Paso 1: Iniciar el backend
```bash
cd backend
python -m uvicorn app.main:app --reload
```

### Paso 2: Abrir el navegador
```
http://localhost:8000/api/v1/diagnostico-duplicados
```

### Paso 3: Revisar la respuesta JSON
Verás exactamente:
- Cuántos duplicados hay por tipo
- Qué nombres están duplicados
- Cuántas copias hay de cada uno
- Los IDs de cada copia

### Paso 4: Ver distritos faltantes
```
http://localhost:8000/api/v1/distritos-faltantes
```

Verás:
- Cuántos distritos hay en el archivo (110)
- Cuántos hay en la BD (98)
- Cuáles faltan (12)
- Cuáles están duplicados

## 📋 Interpretación de Resultados

### Duplicados por Nombre
Si ves un duplicado como:
```
"nombre": "CAPAZO",
"cantidad": 2,
"ubigeos": ["210502"]
```

Significa que hay 2 registros con el mismo nombre "CAPAZO" y UBIGEO "210502".

### Distritos Faltantes
Si ves:
```
"faltantes": [
  {
    "nombre": "CAPAZO",
    "ubigeo": "210502",
    "provincia": "EL COLLAO"
  }
]
```

Significa que el distrito "CAPAZO" está en el archivo GeoJSON pero NO está en la BD.

## 🧹 Limpiar Duplicados

Si quieres eliminar los duplicados, usa el endpoint:

```bash
curl -X POST http://localhost:8000/api/v1/limpiar-duplicados
```

Este endpoint:
- Encuentra todos los duplicados
- Mantiene el primero
- Elimina el resto

## 📝 Notas

- Los endpoints son de solo lectura (GET), no modifican la BD
- El endpoint `/limpiar-duplicados` es POST y SÍ modifica la BD
- Los reportes también se imprimen en la terminal del backend
- Puedes revisar los logs del backend para ver el reporte completo

