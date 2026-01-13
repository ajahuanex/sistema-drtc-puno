# 🚀 EJECUTAR LIMPIEZA DE MONGODB AHORA

## Comando Simple para Ejecutar:

### Opción 1: Comando Directo
```javascript
// Conectar a tu base de datos MongoDB
mongo tu_base_datos

// Ejecutar limpieza completa
db.rutas.deleteMany({})

// Verificar que se eliminaron
db.rutas.countDocuments() // Debe ser 0
```

### Opción 2: Script Completo
```bash
# Ejecutar el script completo de limpieza
mongo tu_base_datos ejecutar_limpieza_mongodb.js
```

### Opción 3: Paso a Paso
```javascript
// 1. Conectar a MongoDB
mongo

// 2. Ver estadísticas antes
print("Rutas antes: " + db.rutas.countDocuments())
print("Localidades: " + db.localidades.countDocuments())

// 3. Eliminar todas las rutas
const resultado = db.rutas.deleteMany({})
print("Rutas eliminadas: " + resultado.deletedCount)

// 4. Verificar eliminación
print("Rutas después: " + db.rutas.countDocuments())

// 5. Crear índices para optimización
db.localidades.createIndex({ nombre: 1, departamento: 1 })
db.localidades.createIndex({ nombre: "text", departamento: "text" })

print("✅ LIMPIEZA COMPLETADA - Sistema listo para carga masiva")
```

## ✅ Después de la Limpieza:

1. **Verificar que no hay rutas**: `db.rutas.countDocuments()` debe ser 0
2. **Sistema listo** para carga masiva de rutas
3. **Localidades únicas** se procesarán automáticamente
4. **Sin duplicados** garantizado

## 🎯 Próximo Paso:

Una vez ejecutada la limpieza, usar la interfaz web para cargar rutas masivamente. El sistema automáticamente:

- ✅ Verificará si PUNO, JULIACA, PUCARA, TARACO ya existen
- ✅ Reutilizará localidades existentes
- ✅ Creará nuevas solo cuando sea necesario
- ✅ Asegurará unicidad sin duplicados

---

**¿Cuál opción prefieres ejecutar?**