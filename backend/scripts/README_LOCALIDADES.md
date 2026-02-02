# 🇵🇪 Scripts de Gestión de Localidades

## 📋 Descripción
Scripts para gestionar la base de datos de localidades con datos reales del Perú basados en el UBIGEO oficial del INEI.

## 🗂️ Archivos Disponibles

### 1. `limpiar_localidades.py`
**Función**: Elimina todas las localidades de la base de datos
```bash
cd backend
python scripts/limpiar_localidades.py
```

### 2. `importar_localidades_reales.py`
**Función**: Importa localidades reales del Perú (sin eliminar existentes)
```bash
cd backend
python scripts/importar_localidades_reales.py
```

### 3. `resetear_localidades.py` ⭐ **RECOMENDADO**
**Función**: Reseteo completo (elimina todo e importa datos reales)
```bash
cd backend
python scripts/resetear_localidades.py
```

## 📊 Datos Incluidos

### **Total: 40 Localidades Reales**

#### **Capitales Departamentales (24):**
- Lima, Arequipa, Trujillo, Chiclayo, Piura
- Iquitos, Cusco, Huancayo, Tacna, Ica
- Callao, Cajamarca, Ayacucho, Huánuco, Pucallpa
- Tumbes, Moquegua, Abancay, Puerto Maldonado
- Moyobamba, Chachapoyas, Cerro de Pasco, Huancavelica

#### **Departamento de Puno (10):**
- **Puno** - Capital departamental
- **Juliaca** - Centro comercial y aeroportuario
- **Ilave** - Capital de El Collao
- **Yunguyo** - Frontera con Bolivia (lacustre)
- **Desaguadero** - Principal paso fronterizo terrestre
- **Azángaro** - Capital de provincia
- **Ayaviri** - Capital de Melgar
- **Macusani** - Capital de Carabaya
- **Juli** - Pequeña Roma de América
- **Lampa** - Ciudad Rosada

#### **Ciudades Importantes (6):**
- **Chimbote** - Principal puerto pesquero
- **Huaraz** - Puerta a la Cordillera Blanca
- Y otras ciudades estratégicas

## 🏷️ Estructura de Datos

Cada localidad incluye:
```json
{
  "nombre": "PUNO",
  "tipo": "CIUDAD",
  "ubigeo": "210101",
  "departamento": "PUNO",
  "provincia": "PUNO", 
  "distrito": "PUNO",
  "descripcion": "Capital del departamento de Puno...",
  "coordenadas": {
    "latitud": -15.8402,
    "longitud": -70.0219
  },
  "estaActiva": true,
  "fechaCreacion": "2024-01-30T...",
  "fechaActualizacion": "2024-01-30T..."
}
```

## 🎯 Tipos de Localidad

- **CIUDAD**: Capitales departamentales y ciudades importantes
- **DISTRITO**: Capitales distritales y localidades menores

## 📍 Coordenadas Geográficas

Todas las localidades incluyen coordenadas GPS reales para:
- Cálculo de distancias
- Integración con mapas
- Análisis geoespacial

## 🔧 Requisitos

### Dependencias:
- Python 3.8+
- Motor (MongoDB async driver)
- Configuración de MongoDB en `app/core/config.py`

### Variables de Entorno:
```bash
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=transport_db
```

## 🚀 Uso Recomendado

### Para Desarrollo:
```bash
# Reseteo completo con datos reales
cd backend
python scripts/resetear_localidades.py
```

### Para Producción:
1. Hacer backup de datos existentes
2. Ejecutar reseteo en horario de mantenimiento
3. Verificar integridad de datos

## 📊 Verificación Post-Importación

### Verificar en MongoDB:
```javascript
// Contar localidades
db.localidades.countDocuments()

// Ver por departamento
db.localidades.aggregate([
  {$group: {_id: "$departamento", count: {$sum: 1}}},
  {$sort: {count: -1}}
])

// Ver localidades de Puno
db.localidades.find({"departamento": "PUNO"})
```

### Verificar en API:
```bash
# Obtener todas las localidades
GET /api/v1/localidades

# Verificar inicialización
POST /api/v1/localidades/inicializar

# Buscar localidades de Puno
GET /api/v1/localidades?departamento=PUNO
```

## 🔍 Fuentes de Datos

- **UBIGEO**: Códigos oficiales del INEI (Instituto Nacional de Estadística e Informática)
- **Coordenadas**: Datos geográficos oficiales
- **Nombres**: Denominaciones oficiales de localidades
- **Jerarquía**: Estructura territorial oficial del Perú

## ⚠️ Consideraciones

### Seguridad:
- Los scripts requieren acceso a la base de datos
- Hacer backup antes de ejecutar en producción
- Verificar conexión a MongoDB antes de ejecutar

### Rendimiento:
- La importación es rápida (~40 localidades)
- No afecta significativamente el rendimiento
- Se puede ejecutar con la aplicación en funcionamiento

### Integridad:
- Cada localidad tiene UBIGEO único
- Coordenadas validadas
- Estructura consistente con el modelo de datos

## 🎉 Resultado Final

Después de ejecutar el reseteo tendrás:
- ✅ **40 localidades reales** del Perú
- ✅ **Datos oficiales** basados en UBIGEO del INEI
- ✅ **Coordenadas GPS** para todas las localidades
- ✅ **Cobertura nacional** con énfasis en Puno
- ✅ **Base de datos limpia** sin datos de ejemplo
- ✅ **Lista para producción** con datos reales

¡Perfecto para empezar a crear rutas reales de transporte en el Perú! 🚌🇵🇪