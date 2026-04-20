# ✅ Checklist de Pruebas - Sistema de Alias

## 🧪 Pruebas Automatizadas

### Paso 1: Ejecutar Script de Pruebas

```bash
python backend/prueba_alias.py
```

**Resultado esperado:**
```
✓ Backend disponible
✓ PRUEBA 1: BÚSQUEDA DE ALIAS
  ✓ 'PUNO CIUDAD' → PUNO
  ✓ 'CIUDAD DE JULIACA' → JULIACA
  ✓ 'C.P. CHAQUIMINAS' → CHAQUIMINAS
  ✓ 'CP PEÑA AZUL' → PEÑA AZUL
  ✓ 'PUNO' → PUNO

✓ PRUEBA 2: OBTENER ALIAS
  ✓ Se obtuvieron 10 alias

✓ PRUEBA 3: ALIAS MÁS USADOS
  ✓ Se obtuvieron 0 alias más usados (normal, sin uso aún)

✓ PRUEBA 4: ALIAS SIN USAR
  ✓ Se obtuvieron 15742 alias sin usar

✓ PRUEBA 5: CREAR ALIAS
  ✓ Alias creado exitosamente
  ✓ Alias de prueba eliminado

✅ PRUEBAS COMPLETADAS
```

**Checklist:**
- [ ] Script ejecuta sin errores
- [ ] Todas las 5 pruebas pasan
- [ ] No hay excepciones
- [ ] Se obtienen resultados esperados

---

## 🌐 Pruebas Manuales con cURL

### Prueba 1: Buscar Alias de Capital

```bash
curl "http://localhost:8000/api/v1/localidades-alias/buscar/PUNO%20CIUDAD"
```

**Resultado esperado:**
```json
{
  "localidad_id": "...",
  "localidad_nombre": "PUNO",
  "es_alias": true,
  "alias_usado": "PUNO CIUDAD",
  "coordenadas": {...}
}
```

- [ ] Respuesta 200 OK
- [ ] `es_alias` es `true`
- [ ] `localidad_nombre` es "PUNO"
- [ ] `alias_usado` es "PUNO CIUDAD"

### Prueba 2: Buscar Alias de Centro Poblado

```bash
curl "http://localhost:8000/api/v1/localidades-alias/buscar/C.P.%20CHAQUIMINAS"
```

**Resultado esperado:**
```json
{
  "localidad_id": "...",
  "localidad_nombre": "CHAQUIMINAS",
  "es_alias": true,
  "alias_usado": "C.P. CHAQUIMINAS",
  "coordenadas": {...}
}
```

- [ ] Respuesta 200 OK
- [ ] `es_alias` es `true`
- [ ] `localidad_nombre` es "CHAQUIMINAS"

### Prueba 3: Buscar Localidad Directa

```bash
curl "http://localhost:8000/api/v1/localidades-alias/buscar/PUNO"
```

**Resultado esperado:**
```json
{
  "localidad_id": "...",
  "localidad_nombre": "PUNO",
  "es_alias": false,
  "alias_usado": null,
  "coordenadas": {...}
}
```

- [ ] Respuesta 200 OK
- [ ] `es_alias` es `false`
- [ ] `alias_usado` es `null`

### Prueba 4: Obtener Todos los Alias

```bash
curl "http://localhost:8000/api/v1/localidades-alias/?skip=0&limit=5"
```

**Resultado esperado:**
```json
[
  {
    "id": "...",
    "alias": "PUNO CIUDAD",
    "localidad_nombre": "PUNO",
    "verificado": true,
    "estaActivo": true,
    ...
  },
  ...
]
```

- [ ] Respuesta 200 OK
- [ ] Array con 5 elementos
- [ ] Cada elemento tiene estructura correcta

### Prueba 5: Obtener Alias Más Usados

```bash
curl "http://localhost:8000/api/v1/localidades-alias/estadisticas/mas-usados?limit=5"
```

**Resultado esperado:**
```json
[
  {
    "id": "...",
    "alias": "...",
    "localidad_nombre": "...",
    "total_usos": 0,
    ...
  }
]
```

- [ ] Respuesta 200 OK
- [ ] Array vacío o con elementos (normal si no hay uso)

### Prueba 6: Obtener Alias Sin Usar

```bash
curl "http://localhost:8000/api/v1/localidades-alias/estadisticas/sin-usar"
```

**Resultado esperado:**
```json
[
  {
    "id": "...",
    "alias": "PUNO CIUDAD",
    "localidad_nombre": "PUNO",
    ...
  },
  ...
]
```

- [ ] Respuesta 200 OK
- [ ] Array con muchos elementos (15,742)

---

## 🖥️ Pruebas en Frontend

### Prueba 1: Búsqueda de Localidad por Alias

1. Ir a **Localidades → Búsqueda**
2. Escribir: `PUNO CIUDAD`
3. Presionar Enter o buscar

**Resultado esperado:**
- [ ] Se encuentra la localidad PUNO
- [ ] Se muestra como DISTRITO
- [ ] Se muestran las coordenadas

### Prueba 2: Búsqueda de Centro Poblado por Alias

1. Ir a **Localidades → Búsqueda**
2. Escribir: `C.P. CHAQUIMINAS`
3. Presionar Enter o buscar

**Resultado esperado:**
- [ ] Se encuentra CHAQUIMINAS
- [ ] Se muestra como CENTRO_POBLADO
- [ ] Se muestran las coordenadas

### Prueba 3: Crear Ruta con Alias

1. Ir a **Rutas → Nueva Ruta**
2. Origen: `PUNO CIUDAD`
3. Destino: `C.P. CHAQUIMINAS`
4. Guardar ruta

**Resultado esperado:**
- [ ] Se resuelven los alias correctamente
- [ ] Origen: PUNO (DISTRITO)
- [ ] Destino: CHAQUIMINAS (CENTRO_POBLADO)
- [ ] Se calcula distancia y duración
- [ ] Se guarda la ruta

### Prueba 4: Listar Alias en Administración

1. Ir a **Administración → Alias de Localidades**
2. Verificar listado

**Resultado esperado:**
- [ ] Se muestran los alias
- [ ] Total: 15,742
- [ ] Se pueden filtrar
- [ ] Se pueden editar
- [ ] Se pueden eliminar

---

## 🗄️ Pruebas en Base de Datos

### Verificar Colección de Alias

```bash
python << 'EOF'
from pymongo import MongoClient

client = MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['drtc_db']

# Contar alias
total = db.localidades_alias.count_documents({})
print(f"Total de alias: {total}")

# Contar por estado
activos = db.localidades_alias.count_documents({'estaActivo': True})
verificados = db.localidades_alias.count_documents({'verificado': True})

print(f"Alias activos: {activos}")
print(f"Alias verificados: {verificados}")

# Mostrar ejemplos
print("\nEjemplos:")
for alias in db.localidades_alias.find().limit(3):
    print(f"  - {alias['alias']} → {alias['localidad_nombre']}")

client.close()
EOF
```

**Resultado esperado:**
```
Total de alias: 15742
Alias activos: 15742
Alias verificados: 24
Ejemplos:
  - PUNO CIUDAD → PUNO
  - CIUDAD DE PUNO → PUNO
  - JULIACA CIUDAD → JULIACA
```

**Checklist:**
- [ ] Total: 15,742
- [ ] Activos: 15,742
- [ ] Verificados: 24
- [ ] Ejemplos correctos

---

## 📊 Resumen de Pruebas

| Prueba | Estado | Notas |
|--------|--------|-------|
| Script automatizado | ⏳ | Pendiente |
| Búsqueda de alias | ⏳ | Pendiente |
| Búsqueda de localidad | ⏳ | Pendiente |
| Búsqueda de centro poblado | ⏳ | Pendiente |
| Obtener todos los alias | ⏳ | Pendiente |
| Alias más usados | ⏳ | Pendiente |
| Alias sin usar | ⏳ | Pendiente |
| Frontend - Búsqueda | ⏳ | Pendiente |
| Frontend - Crear ruta | ⏳ | Pendiente |
| Frontend - Listar alias | ⏳ | Pendiente |
| BD - Verificar colección | ⏳ | Pendiente |

---

## ✅ Criterios de Aceptación

Todas las siguientes condiciones deben cumplirse:

- [ ] Script `prueba_alias.py` ejecuta sin errores
- [ ] Todas las 5 pruebas del script pasan
- [ ] Búsqueda de alias funciona en cURL
- [ ] Búsqueda de localidad funciona en frontend
- [ ] Se pueden crear rutas usando alias
- [ ] BD tiene 15,742 alias
- [ ] Todos los alias están activos
- [ ] 24 alias están verificados (capitales)
- [ ] 15,718 alias sin verificar (centros poblados)

## 🎉 Cuando Todo Funcione

```bash
# Hacer commit
git add -A
git commit -m "feat: Agregar sistema de alias consolidados para localidades"

# Hacer push
git push origin master
```

---

**Instrucciones**: Marcar cada prueba con ✅ cuando se complete exitosamente.

