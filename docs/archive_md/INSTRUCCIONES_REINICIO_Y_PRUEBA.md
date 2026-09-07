# 🚀 Instrucciones: Reinicio y Prueba Final

## 1️⃣ Reiniciar el Servidor Angular

Después de los cambios en `angular.json`, es necesario reiniciar el servidor:

```bash
# Detener el servidor actual (Ctrl+C)

# Ir a la carpeta frontend
cd frontend

# Instalar dependencias (si es necesario)
npm install

# Iniciar el servidor
npm start
```

El servidor debe estar disponible en: `http://localhost:4200`

## 2️⃣ Verificar que el Archivo se Sirve

Abrir la consola del navegador (F12) y verificar:

```
GET http://localhost:4200/assets/geojson/puno-centrospoblados.geojson 200 OK
```

**No debe haber error 404**.

## 3️⃣ Probar la Importación

### Paso 1: Abrir Carga Masiva
1. Navegar a `http://localhost:4200`
2. Ir a **Localidades** → **Carga Masiva desde GeoJSON**

### Paso 2: Seleccionar Archivos
1. Seleccionar **Archivos por Defecto**
2. Marcar:
   - ✅ Provincias
   - ✅ Distritos
   - ✅ Centros Poblados

### Paso 3: Validar Archivo
1. Hacer clic en **Validar Archivo**
2. Esperar a que se procese
3. Verificar que aparezca el preview con datos correctos

**Resultado esperado**:
- Total de registros: 20 (10 provincias + 10 distritos + 10 CCPP para preview)
- Con coordenadas GPS: 20
- Con UBIGEO: 20

### Paso 4: Verificar Preview

En las pestañas del preview, verificar:

**Provincias**:
- UBIGEO: 10 dígitos (ej: 2101000000)
- Coordenadas: ✓ GPS

**Distritos**:
- UBIGEO: 10 dígitos (ej: 2105020000)
- Coordenadas: ✓ GPS

**Centros Poblados**:
- UBIGEO: 10 dígitos (ej: 2110020048)
- Coordenadas: ✓ GPS

### Paso 5: Importar TEST
1. Hacer clic en **TEST (2 de cada tipo)**
2. Esperar a que se complete
3. Verificar resultado:
   - Importados: 6 (2 provincias + 2 distritos + 2 CCPP)

### Paso 6: Importar Completo
1. Limpiar BD (opcional)
2. Hacer clic en **Confirmar e Importar**
3. Esperar a que se complete
4. Verificar resultado:
   - Importados: ~18,989 registros

## 4️⃣ Verificar en Base de Datos

Ejecutar en MongoDB:

```javascript
// Contar provincias
db.localidades.countDocuments({tipo: "PROVINCIA"})
// Resultado esperado: 13

// Contar distritos
db.localidades.countDocuments({tipo: "DISTRITO"})
// Resultado esperado: ~110

// Contar centros poblados
db.localidades.countDocuments({tipo: "CENTRO_POBLADO"})
// Resultado esperado: ~9000

// Verificar UBIGEO de provincias (10 dígitos)
db.localidades.findOne({tipo: "PROVINCIA"})
// ubigeo debe ser: "2101000000" (10 dígitos)

// Verificar UBIGEO de distritos (10 dígitos)
db.localidades.findOne({tipo: "DISTRITO"})
// ubigeo debe ser: "2105020000" (10 dígitos)

// Verificar UBIGEO de centros poblados (10 dígitos)
db.localidades.findOne({tipo: "CENTRO_POBLADO"})
// ubigeo debe ser: "2110020048" (10 dígitos)
```

## 5️⃣ Verificar Logs

### Frontend (Consola del navegador - F12)
```
✅ Preview procesado: puno-provincias-point.geojson
✅ Preview procesado: puno-distritos-point.geojson
✅ Preview procesado: puno-centrospoblados.geojson
📊 Resultado importación: {...}
```

### Backend (Terminal)
```
📦 Procesando 9000 centros poblados en 18 lotes...
  Lote 1/18 (1-500 de 9000)
  Lote 2/18 (501-1000 de 9000)
  ...
  ✅ Lotes completados

📊 REPORTE DE IMPORTACIÓN
================================================================================
✅ Importados: 18989
🔄 Actualizados: 0
⏭️  Omitidos: 0
❌ Errores: 0
================================================================================
```

## ✅ Checklist de Verificación

- [ ] Servidor Angular reiniciado
- [ ] Archivo puno-centrospoblados.geojson se sirve (200 OK)
- [ ] Preview muestra datos correctos
- [ ] UBIGEO tiene 10 dígitos en todos los tipos
- [ ] Coordenadas se extraen correctamente
- [ ] Importación TEST funciona (6 registros)
- [ ] Importación completa funciona (~18,989 registros)
- [ ] BD tiene los registros correctos
- [ ] Logs muestran procesamiento por lotes
- [ ] No hay errores en consola

## 🎉 Resultado Final

Si todos los pasos se completan correctamente:

✅ **SISTEMA 100% FUNCIONAL**

El sistema está listo para producción y puede importar localidades correctamente con:
- UBIGEO consistente (10 dígitos)
- Coordenadas reales
- Procesamiento optimizado
- Sin errores

