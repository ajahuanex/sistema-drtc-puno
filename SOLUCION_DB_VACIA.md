# 🔧 Solución: Base de Datos Vacía

**Fecha:** 1 de Diciembre de 2025  
**Problema:** No se encuentran empresas, expedientes ni otros datos  
**Causa:** Base de datos MongoDB está vacía (sin datos mock)

---

## ✅ Esto es NORMAL y CORRECTO

El sistema ahora está configurado para trabajar **100% con base de datos real**. Todos los servicios mock han sido eliminados.

**Ventajas:**
- ✅ Datos reales en tiempo real
- ✅ Sin confusión entre mock y real
- ✅ Pruebas con datos reales
- ✅ Sistema listo para producción

---

## 🚀 Cómo Usar el Sistema

### Paso 1: Iniciar Docker y MongoDB

```bash
# Ejecutar este script
INICIAR_SISTEMA_COMPLETO.bat
```

Este script:
1. Verifica Docker Desktop
2. Inicia MongoDB en Docker
3. Verifica requisitos (Python, Node.js)

### Paso 2: Iniciar Backend

**En una terminal nueva:**
```bash
start-backend.bat
```

Espera a ver:
```
✅ Conectado a MongoDB exitosamente
INFO: Application startup complete
```

### Paso 3: Iniciar Frontend

**En otra terminal nueva:**
```bash
start-frontend.bat
```

Espera a ver:
```
✓ Compiled successfully
** Angular Live Development Server is listening on localhost:4200
```

### Paso 4: Verificar Base de Datos

```bash
# Opción 1: Script batch
verificar-db.bat

# Opción 2: Script Python (más detallado)
python verificar_db.py
```

---

## 📝 Crear Datos en el Sistema

### Opción 1: Desde el Frontend (Recomendado)

1. Abre el navegador: http://localhost:4200
2. Navega a cada módulo y crea datos:
   - **Empresas:** Crear nueva empresa
   - **Vehículos:** Agregar vehículos
   - **Conductores:** Registrar conductores
   - **Rutas:** Definir rutas
   - **Expedientes:** Crear expedientes
   - **Resoluciones:** Emitir resoluciones

### Opción 2: Desde la API (Para desarrolladores)

1. Abre: http://localhost:8000/docs
2. Usa los endpoints POST para crear datos:
   - `POST /api/v1/empresas` - Crear empresa
   - `POST /api/v1/vehiculos` - Crear vehículo
   - `POST /api/v1/resoluciones` - Crear resolución
   - etc.

### Opción 3: Script de Datos de Prueba (Rápido)

Si necesitas datos de prueba rápidamente, puedes crear un script:

```python
# crear_datos_prueba.py
from pymongo import MongoClient
from datetime import datetime

client = MongoClient("mongodb://admin:admin123@localhost:27017/")
db = client["drtc_puno_db"]

# Crear empresa de prueba
empresa = {
    "codigoEmpresa": "0001TST",
    "ruc": "20123456789",
    "razonSocial": {
        "principal": "TRANSPORTES TEST S.A.C.",
        "sunat": "TRANSPORTES TEST S.A.C.",
        "minimo": "TRANSP. TEST"
    },
    "direccionFiscal": "Av. Test 123, Puno",
    "estado": "HABILITADA",
    "estaActivo": True,
    "fechaRegistro": datetime.utcnow(),
    # ... más campos
}

db.empresas.insert_one(empresa)
print("✅ Empresa de prueba creada")
```

---

## 🔍 Verificar que Todo Funciona

### 1. Verificar MongoDB
```bash
docker ps
# Debe mostrar: drtc-mongodb-local (healthy)
```

### 2. Verificar Backend
```bash
curl http://localhost:8000/health
# Debe retornar: {"status":"healthy","database_status":"connected"}
```

### 3. Verificar Frontend
Abre: http://localhost:4200
- Debe cargar la aplicación Angular

### 4. Verificar Base de Datos
```bash
python verificar_db.py
# Muestra colecciones y documentos
```

---

## 🛠️ Herramientas Útiles

### MongoDB Compass (Recomendado)
- **Descarga:** https://www.mongodb.com/try/download/compass
- **Conexión:** `mongodb://admin:admin123@localhost:27017`
- **Ventajas:** Interfaz visual para explorar datos

### Línea de Comandos
```bash
# Conectar a MongoDB
docker exec -it drtc-mongodb-local mongosh -u admin -p admin123

# Dentro de mongosh:
use drtc_puno_db
show collections
db.empresas.find()
db.resoluciones.countDocuments()
```

---

## 📊 Estructura de Colecciones

Cuando crees datos, se crearán estas colecciones:

```
drtc_puno_db/
├── empresas          # Empresas de transporte
├── vehiculos         # Vehículos habilitados
├── conductores       # Conductores registrados
├── rutas             # Rutas autorizadas
├── expedientes       # Expedientes administrativos
├── resoluciones      # Resoluciones emitidas
├── tucs              # Tarjetas Únicas de Circulación
├── infracciones      # Infracciones registradas
├── usuarios          # Usuarios del sistema
└── oficinas          # Oficinas DRTC
```

---

## ⚠️ Problemas Comunes

### "No se encuentra ninguna empresa"
**Causa:** Base de datos vacía  
**Solución:** Crea empresas desde el frontend o API

### "Error de conexión a MongoDB"
**Causa:** MongoDB no está corriendo  
**Solución:** Ejecuta `INICIAR_SISTEMA_COMPLETO.bat`

### "Backend no inicia"
**Causa:** Dependencias faltantes o MongoDB no disponible  
**Solución:** 
1. Verifica MongoDB: `docker ps`
2. Reinstala dependencias: `cd backend && pip install -r requirements.txt`

### "Frontend no carga datos"
**Causa:** Backend no está corriendo o base de datos vacía  
**Solución:**
1. Verifica backend: http://localhost:8000/health
2. Crea datos desde el frontend

---

## 📚 Documentación Adicional

- **Guía de Despliegue:** `GUIA_DESPLIEGUE_LOCAL.md`
- **Análisis del Módulo:** `ANALISIS_MODULO_RESOLUCION.md`
- **Limpieza de Mock:** `LIMPIEZA_MOCK_RESUMEN.md`

---

## ✅ Checklist de Verificación

- [ ] Docker Desktop está corriendo
- [ ] MongoDB está corriendo en Docker (puerto 27017)
- [ ] Backend está corriendo (puerto 8000)
- [ ] Frontend está corriendo (puerto 4200)
- [ ] Puedo acceder a http://localhost:4200
- [ ] Puedo acceder a http://localhost:8000/docs
- [ ] He creado al menos una empresa de prueba
- [ ] Los datos se guardan correctamente en MongoDB

---

## 🎯 Resumen

**El sistema está funcionando correctamente.** La base de datos está vacía porque:
1. Se eliminaron todos los datos mock
2. El sistema ahora usa 100% base de datos real
3. Los datos se crean desde el frontend o API

**Próximo paso:** Crea tus primeros datos desde http://localhost:4200

---

**¿Necesitas ayuda?** Revisa los logs del backend y frontend para más detalles.
