# 🚀 Empezar Pruebas - Guía Rápida

## ⚡ Inicio Rápido (2 minutos)

### Opción 1: Script Automatizado (Recomendado)
```bash
# Windows
test_rapido.bat

# Linux/Mac
python test_sistema_vehiculos.py
```

### Opción 2: Manual
Sigue el archivo `CHECKLIST_PRUEBAS.md`

---

## 📁 Archivos de Prueba Disponibles

| Archivo | Descripción | Tiempo | Uso |
|---------|-------------|--------|-----|
| `test_rapido.bat` | Script automatizado Windows | 2 min | Ejecutar y ver resultados |
| `test_sistema_vehiculos.py` | Script Python completo | 5 min | Pruebas detalladas |
| `CHECKLIST_PRUEBAS.md` | Checklist interactivo | 30 min | Pruebas manuales completas |
| `PLAN_PRUEBAS_EJECUTABLE.md` | Plan detallado | 40 min | Guía paso a paso |
| `GUIA_PRUEBA_RAPIDA.md` | Guía visual | 15 min | Pruebas básicas |

---

## 🎯 ¿Qué Archivo Usar?

### Si tienes 2 minutos
→ `test_rapido.bat` (Windows) o `python test_sistema_vehiculos.py`

### Si tienes 15 minutos
→ `GUIA_PRUEBA_RAPIDA.md` + `test_sistema_vehiculos.py`

### Si tienes 30 minutos
→ `CHECKLIST_PRUEBAS.md` (completo)

### Si tienes 1 hora
→ `PLAN_PRUEBAS_EJECUTABLE.md` (exhaustivo)

---

## ✅ Pre-requisitos

Antes de empezar, verifica que tengas:

- [ ] MongoDB corriendo
- [ ] Backend corriendo (`http://localhost:8000`)
- [ ] Frontend corriendo (`http://localhost:4200`)
- [ ] Al menos 1 empresa creada
- [ ] Python instalado (para scripts automatizados)

### Verificación Rápida
```bash
# Backend
curl http://localhost:8000/docs

# Frontend
curl http://localhost:4200

# MongoDB
# Abrir MongoDB Compass y conectar
```

---

## 🚀 Comandos Útiles

### Iniciar Servicios

#### Backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm start
# o
ng serve
```

#### MongoDB
```bash
# Ya debería estar corriendo
# Si no, iniciar MongoDB Compass
```

---

## 🧪 Ejecutar Pruebas

### Pruebas Automatizadas

#### Windows
```cmd
test_rapido.bat
```

#### Linux/Mac
```bash
python test_sistema_vehiculos.py
```

#### Con más detalle
```bash
python test_sistema_vehiculos.py --verbose
```

### Pruebas Manuales

1. Abrir `CHECKLIST_PRUEBAS.md`
2. Seguir las instrucciones
3. Marcar cada casilla completada
4. Anotar problemas encontrados

---

## 📊 Interpretar Resultados

### Script Automatizado

#### ✅ Todas las pruebas pasaron
```
✅ Backend corriendo
✅ VehiculoData creado
✅ Vehículo creado
✅ JOIN con datos técnicos funciona

🎉 ¡TODAS LAS PRUEBAS PASARON!
Porcentaje de éxito: 100%
```

**Acción:** Continuar con pruebas manuales de UI

#### ⚠️ Algunas pruebas fallaron
```
✅ Backend corriendo
❌ Error al crear VehiculoData
⚠️ No hay empresas disponibles

⚠️ Algunas pruebas fallaron
Porcentaje de éxito: 60%
```

**Acción:** Revisar errores específicos y corregir

---

## 🐛 Solución de Problemas Comunes

### Backend no responde
```bash
# Verificar que está corriendo
curl http://localhost:8000/docs

# Si no responde, iniciar
cd backend
uvicorn app.main:app --reload --port 8000
```

### Frontend no carga
```bash
# Verificar que está corriendo
curl http://localhost:4200

# Si no responde, iniciar
cd frontend
npm start
```

### No hay empresas
```bash
# Crear una empresa desde el frontend
# O usar MongoDB Compass para insertar una
```

### MongoDB no conecta
```bash
# Abrir MongoDB Compass
# Conectar a: mongodb://localhost:27017
# Verificar que la base de datos existe
```

---

## 📈 Flujo Recomendado

```
1. Verificar pre-requisitos (2 min)
   ↓
2. Ejecutar test_rapido.bat (2 min)
   ↓
3. Si pasa → Pruebas manuales de UI (15 min)
   ↓
4. Si falla → Revisar errores y corregir
   ↓
5. Completar CHECKLIST_PRUEBAS.md (30 min)
   ↓
6. ✅ Sistema validado
```

---

## 🎯 Criterios de Éxito Mínimos

Para considerar el sistema funcional, debe cumplir:

- [ ] ✅ Script automatizado pasa al menos 80% de pruebas
- [ ] ✅ Crear VehiculoData funciona
- [ ] ✅ Crear Vehículo con vehiculoDataId funciona
- [ ] ✅ Búsqueda automática por placa funciona
- [ ] ✅ Ver detalle muestra datos completos

---

## 📞 Ayuda

### Logs del Backend
```bash
cd backend
tail -f logs/app.log
```

### Logs del Frontend
```
Abrir navegador → F12 → Console
```

### Verificar MongoDB
```
MongoDB Compass → Conectar → Ver colecciones:
- vehiculos
- vehiculo_solo
```

---

## 🎉 Siguiente Paso

Una vez que las pruebas pasen:

1. ✅ Marcar como completado en `ESTADO_FINAL.md`
2. 📝 Documentar cualquier problema encontrado
3. 🚀 Continuar con migración de datos (si aplica)
4. 👥 Capacitar usuarios
5. 📊 Monitorear en producción

---

## 📚 Documentación Adicional

- `INICIO_RAPIDO.md` - Solución en 5 minutos
- `ESTADO_FINAL.md` - Resumen completo del proyecto
- `EJECUTAR_MIGRACION.md` - Guía de migración de datos
- `README_REFACTORIZACION.md` - Resumen ejecutivo

---

**¿Listo para empezar?**

```bash
# Ejecuta esto ahora:
test_rapido.bat
```

**¡Buena suerte! 🚀**
