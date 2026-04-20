# 🧪 Instrucciones para Probar los Alias Consolidados

## 📋 Requisitos Previos

1. **Backend corriendo**: `python -m uvicorn app.main:app --reload`
2. **MongoDB corriendo**: `mongod` o Docker
3. **Localidades importadas**: 110 distritos, 13 provincias, 9372 centros poblados
4. **Alias generados**: 15,742 alias en la BD

## 🚀 Pasos de Prueba

### Paso 1: Verificar que los Alias Existen

```bash
python backend/prueba_alias.py
```

Este script ejecutará 5 pruebas:

1. **Búsqueda de Alias**: Verifica que se pueden buscar alias
2. **Obtener Alias**: Obtiene los primeros 10 alias
3. **Alias Más Usados**: Obtiene los alias con más uso
4. **Alias Sin Usar**: Obtiene los alias que no se han usado
5. **Crear Alias**: Crea y elimina un alias de prueba

### Paso 2: Pruebas Manuales con cURL

#### Buscar por Alias de Capital

```bash
curl "http://localhost:8000/api/v1/localidades-alias/buscar/PUNO%20CIUDAD"
```

**Respuesta esperada:**
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

#### Buscar por Alias de Centro Poblado

```bash
curl "http://localhost:8000/api/v1/localidades-alias/buscar/C.P.%20CHAQUIMINAS"
```

#### Obtener Todos los Alias

```bash
curl "http://localhost:8000/api/v1/localidades-alias/?skip=0&limit=10"
```

#### Obtener Alias Más Usados

```bash
curl "http://localhost:8000/api/v1/localidades-alias/estadisticas/mas-usados?limit=5"
```

#### Obtener Alias Sin Usar

```bash
curl "http://localhost:8000/api/v1/localidades-alias/estadisticas/sin-usar"
```

### Paso 3: Pruebas en el Frontend

#### 3.1 Crear una Ruta Usando Alias

1. Ir a **Rutas → Nueva Ruta**
2. En el campo "Origen", escribir: `PUNO CIUDAD`
3. En el campo "Destino", escribir: `C.P. CHAQUIMINAS`
4. Verificar que se resuelven correctamente a:
   - Origen: PUNO (DISTRITO)
   - Destino: CHAQUIMINAS (CENTRO_POBLADO)

#### 3.2 Buscar Localidad por Alias

1. Ir a **Localidades → Búsqueda**
2. Buscar: `CIUDAD DE JULIACA`
3. Verificar que encuentra: JULIACA (DISTRITO)

#### 3.3 Verificar Alias en Listado

1. Ir a **Administración → Alias de Localidades**
2. Verificar que se muestran los 15,742 alias
3. Filtrar por "PUNO" para ver los alias de PUNO

### Paso 4: Verificación en Base de Datos

```bash
python << 'EOF'
from pymongo import MongoClient

client = MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['drtc_db']
alias_collection = db['localidades_alias']

# Contar total de alias
total = alias_collection.count_documents({})
print(f"Total de alias: {total}")

# Contar alias activos
activos = alias_collection.count_documents({'estaActivo': True})
print(f"Alias activos: {activos}")

# Contar alias verificados
verificados = alias_collection.count_documents({'verificado': True})
print(f"Alias verificados: {verificados}")

# Mostrar ejemplos
print("\nEjemplos de alias:")
for alias in alias_collection.find().limit(5):
    print(f"  - {alias['alias']} → {alias['localidad_nombre']}")

client.close()
EOF
```

**Resultado esperado:**
```
Total de alias: 15742
Alias activos: 15742
Alias verificados: 24
Ejemplos de alias:
  - PUNO CIUDAD → PUNO
  - CIUDAD DE PUNO → PUNO
  - JULIACA CIUDAD → JULIACA
  - CIUDAD DE JULIACA → JULIACA
  - AYAVIRI CIUDAD → AYAVIRI
```

## ✅ Checklist de Validación

- [ ] Script `prueba_alias.py` ejecuta sin errores
- [ ] Búsqueda de alias funciona correctamente
- [ ] Se pueden crear nuevos alias
- [ ] Se pueden eliminar alias
- [ ] Los alias se resuelven a localidades correctas
- [ ] El frontend muestra los alias en búsquedas
- [ ] Las rutas se pueden crear usando alias
- [ ] La BD tiene 15,742 alias

## 🐛 Solución de Problemas

### Error: "No se puede conectar al backend"

```bash
# Verificar que el backend está corriendo
curl http://localhost:8000/api/v1/localidades?skip=0&limit=1

# Si no funciona, reiniciar el backend
cd backend
python -m uvicorn app.main:app --reload
```

### Error: "Alias no encontrado"

```bash
# Verificar que los alias existen en la BD
python backend/generar_alias_consolidados.py
```

### Error: "Localidad no encontrada"

```bash
# Verificar que las localidades están importadas
python << 'EOF'
from pymongo import MongoClient
client = MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['drtc_db']
print(f"Localidades: {db.localidades.count_documents({})}")
print(f"Alias: {db.localidades_alias.count_documents({})}")
client.close()
EOF
```

## 📝 Notas

- Los alias para capitales de provincia están marcados como `verificado: true`
- Los alias para centros poblados están marcados como `verificado: false`
- Todos los alias están activos por defecto
- Los alias se pueden desactivar sin eliminarlos

## 🎉 Resultado Esperado

Después de completar todas las pruebas:

1. ✅ 15,742 alias en la BD
2. ✅ Búsqueda de alias funciona
3. ✅ Creación/actualización/eliminación de alias funciona
4. ✅ Frontend resuelve alias correctamente
5. ✅ Rutas se pueden crear usando alias

---

**Cuando todo funcione correctamente, hacer commit a GitHub:**

```bash
git add -A
git commit -m "feat: Agregar sistema de alias consolidados para localidades"
git push origin master
```

