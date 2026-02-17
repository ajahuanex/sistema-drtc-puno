# 🚀 EJECUTAR MIGRACIÓN - Guía Visual

## ⚡ OPCIÓN 1: MongoDB Compass (RECOMENDADO)

### Paso 1: Abrir MongoDB Compass
1. Abrir MongoDB Compass
2. Conectar a `mongodb://localhost:27017`
3. Seleccionar base de datos: `sirret_db`
4. Click en colección: `vehiculos`

### Paso 2: Abrir Shell
1. En la parte inferior, click en `>_MONGOSH` (o `_MONGOSH` tab)
2. Se abrirá una consola

### Paso 3: Ejecutar Comandos

Copiar y pegar estos comandos UNO POR UNO:

```javascript
// 1. Agregar tipoServicio
db.vehiculos.updateMany(
  { tipoServicio: { $exists: false } },
  { $set: { tipoServicio: "NO_ESPECIFICADO" } }
)
```

Presionar `Enter`. Debe mostrar algo como:
```
{ acknowledged: true, matchedCount: 5, modifiedCount: 5 }
```

```javascript
// 2. Copiar vehiculoSoloId a vehiculoDataId
db.vehiculos.updateMany(
  { 
    vehiculoSoloId: { $exists: true },
    vehiculoDataId: { $exists: false }
  },
  [{ $set: { vehiculoDataId: "$vehiculoSoloId" } }]
)
```

Presionar `Enter`. Debe mostrar algo como:
```
{ acknowledged: true, matchedCount: 3, modifiedCount: 3 }
```

```javascript
// 3. Verificar
db.vehiculos.find({ tipoServicio: { $exists: false } }).count()
```

Debe retornar: `0`

```javascript
// 4. Ver ejemplo
db.vehiculos.findOne({}, { placa: 1, tipoServicio: 1, vehiculoDataId: 1 })
```

Debe mostrar un vehículo con los campos nuevos.

### Paso 4: Listo ✅

Cerrar MongoDB Compass y continuar con el Paso 5 abajo.

---

## ⚡ OPCIÓN 2: Ejecutar Script Completo

### En MongoDB Compass:

1. Abrir MongoDB Compass
2. Conectar a la base de datos
3. Ir a `sirret_db`
4. Abrir `>_MONGOSH`
5. Ejecutar:

```javascript
load('D:/2025/KIRO08/sistema-drtc-puno/migracion_vehiculos.js')
```

(Ajustar la ruta según tu sistema)

---

## ⚡ OPCIÓN 3: Desde Línea de Comandos

```bash
# Si tienes mongo shell instalado
mongo sirret_db migracion_vehiculos.js

# O con mongosh
mongosh sirret_db migracion_vehiculos.js
```

---

## 📋 PASO 5: Reiniciar y Verificar

### 1. Reiniciar Backend

```bash
# En la terminal del backend
# Presionar Ctrl+C para detener
# Luego ejecutar:
cd backend
uvicorn app.main:app --reload --port 8000
```

### 2. Refrescar Frontend

```
En el navegador:
Ctrl + Shift + R
```

### 3. Verificar Tablas

1. Ir a `http://localhost:4200/vehiculos`
2. ✅ La tabla debe cargar
3. ✅ Los vehículos deben mostrarse
4. ✅ No debe haber errores en consola (F12)

---

## ✅ RESULTADO ESPERADO

Después de la migración, cada vehículo debe tener:

```javascript
{
  "_id": ObjectId("..."),
  "placa": "ABC-123",
  "tipoServicio": "NO_ESPECIFICADO",  // ✅ NUEVO
  "vehiculoDataId": "...",             // ✅ NUEVO
  "vehiculoSoloId": "...",             // Existente
  "marca": "TOYOTA",
  "modelo": "HIACE",
  "empresaActualId": "...",
  "estado": "ACTIVO",
  // ... otros campos
}
```

---

## 🐛 PROBLEMAS COMUNES

### "Command requires authentication"

**Solución:** Usar MongoDB Compass con interfaz gráfica en lugar de línea de comandos.

### "Cannot find file"

**Solución:** Usar OPCIÓN 1 (copiar y pegar comandos directamente).

### "No se modificó ningún documento"

**Posibles causas:**
1. ✅ Ya están migrados (verificar con `db.vehiculos.findOne({})`)
2. ⚠️ No hay vehículos en la base de datos
3. ⚠️ Los campos ya existen

**Verificar:**
```javascript
db.vehiculos.count()  // Debe ser > 0
```

---

## 📞 AYUDA

Si después de ejecutar la migración las tablas aún no funcionan:

1. **Verificar en MongoDB Compass:**
   - Abrir un vehículo
   - Verificar que tenga `tipoServicio` y `vehiculoDataId`

2. **Verificar en Navegador:**
   - F12 → Console
   - Buscar errores rojos
   - Copiar el primer error

3. **Verificar Backend:**
   - Ver terminal del backend
   - Buscar errores al cargar vehículos

---

## 🎯 SIGUIENTE PASO

Una vez completada la migración:

1. ✅ Tablas deben funcionar
2. ✅ Probar crear un vehículo nuevo
3. ✅ Probar editar un vehículo
4. ✅ Verificar otros módulos

---

**¿Listo?** Abre MongoDB Compass y ejecuta los comandos del Paso 3. 🚀
