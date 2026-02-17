# ⚡ INICIO RÁPIDO - 5 Minutos

## 🎯 Objetivo
Hacer que las tablas funcionen en 5 minutos.

---

## 📋 PASOS

### 1️⃣ Abrir MongoDB Compass (1 min)

```
1. Abrir MongoDB Compass
2. Conectar a: mongodb://localhost:27017
3. Seleccionar base de datos: sirret_db
4. Click en colección: vehiculos
5. Click en pestaña: >_MONGOSH (abajo)
```

### 2️⃣ Ejecutar Migración (2 min)

Copiar y pegar en la consola MONGOSH:

```javascript
db.vehiculos.updateMany({ tipoServicio: { $exists: false } }, { $set: { tipoServicio: "NO_ESPECIFICADO" } })
```

Presionar `Enter`. Esperar resultado.

Luego ejecutar:

```javascript
db.vehiculos.updateMany({ vehiculoSoloId: { $exists: true }, vehiculoDataId: { $exists: false } }, [{ $set: { vehiculoDataId: "$vehiculoSoloId" } }])
```

Presionar `Enter`. Esperar resultado.

### 3️⃣ Reiniciar Backend (1 min)

```bash
# En terminal del backend
Ctrl + C

# Luego
cd backend
uvicorn app.main:app --reload
```

### 4️⃣ Refrescar Navegador (30 seg)

```
En el navegador:
Ctrl + Shift + R
```

### 5️⃣ Verificar (30 seg)

```
1. Ir a: http://localhost:4200/vehiculos
2. ✅ Tabla debe cargar
3. ✅ Vehículos deben aparecer
```

---

## ✅ LISTO

Si ves la tabla con vehículos: **¡ÉXITO!** 🎉

Si no funciona: Abrir `SOLUCION_FINAL_TABLAS.md` para diagnóstico completo.

---

## 🆘 AYUDA RÁPIDA

### Tabla vacía pero sin errores
→ No hay vehículos en la BD. Crear uno en `/vehiculos-solo/nuevo`

### Error en consola (F12)
→ Copiar el error y revisar `DIAGNOSTICO_COMPLETO.md`

### Backend no responde
→ Verificar que esté corriendo en puerto 8000

---

**Tiempo total:** ~5 minutos  
**Dificultad:** Fácil  
**Requisitos:** MongoDB Compass instalado  
