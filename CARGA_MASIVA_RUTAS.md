# Carga Masiva de Rutas

Sistema completo para la importación masiva de rutas desde archivos Excel.

## 🚀 Características

### Backend
- **Plantilla Excel**: Generación automática con instrucciones y ejemplos
- **Validación completa**: Verificación de datos, empresas, resoluciones y códigos únicos
- **Procesamiento seguro**: Creación de rutas con validaciones de negocio
- **API RESTful**: Endpoints documentados con OpenAPI/Swagger

### Frontend
- **Interfaz intuitiva**: Stepper guiado paso a paso
- **Drag & Drop**: Subida de archivos por arrastre
- **Validación en tiempo real**: Feedback inmediato de errores
- **Resultados detallados**: Visualización clara de éxitos y errores

## 📋 Campos Soportados

### Obligatorios
- **Código Ruta**: 2-3 dígitos únicos dentro de la resolución
- **Nombre**: Descripción de la ruta (mínimo 5 caracteres)
- **Empresa ID**: ID de la empresa propietaria (debe existir)
- **Resolución ID**: ID de resolución PADRE y VIGENTE (debe existir)
- **Origen ID**: ID del lugar de origen
- **Destino ID**: ID del lugar de destino
- **Frecuencias**: Descripción de las frecuencias

### Opcionales
- **Tipo Ruta**: URBANA, INTERURBANA, INTERPROVINCIAL, INTERREGIONAL
- **Tipo Servicio**: PASAJEROS, CARGA, MIXTO
- **Estado**: ACTIVA, INACTIVA, EN_MANTENIMIENTO, SUSPENDIDA
- **Distancia (km)**: Distancia en kilómetros
- **Tiempo Estimado**: Formato HH:MM
- **Tarifa Base**: Precio base en soles
- **Capacidad Máxima**: Número de pasajeros/toneladas
- **Observaciones**: Comentarios adicionales

## 🛠️ Instalación y Configuración

### Backend

1. **Instalar dependencias**:
```bash
pip install pandas openpyxl motor
```

2. **Verificar servicios**:
- `RutaExcelService`: Procesamiento de archivos Excel
- `RutaService`: Lógica de negocio de rutas
- Endpoints en `rutas_router.py`

### Frontend

1. **Componente principal**:
```typescript
// frontend/src/app/components/rutas/carga-masiva-rutas.component.ts
```

2. **Servicios requeridos**:
- `RutaService`: Comunicación con API
- `SmartIconComponent`: Iconos inteligentes

3. **Ruta configurada**:
```typescript
{ path: 'rutas/carga-masiva', loadComponent: ... }
```

## 🔗 Endpoints API

### Plantilla
```http
GET /api/v1/rutas/carga-masiva/plantilla
```
Descarga plantilla Excel con instrucciones y ejemplos.

### Ayuda
```http
GET /api/v1/rutas/carga-masiva/ayuda
```
Información detallada sobre campos y validaciones.

### Validación
```http
POST /api/v1/rutas/carga-masiva/validar-completo
Content-Type: multipart/form-data

archivo: [archivo.xlsx]
```
Valida archivo sin crear rutas.

### Procesamiento
```http
POST /api/v1/rutas/carga-masiva/procesar-completo
Content-Type: multipart/form-data

archivo: [archivo.xlsx]
solo_validar: [true|false]
```
Procesa archivo y crea rutas.

## 📊 Validaciones Implementadas

### Datos Básicos
- ✅ Código de ruta: formato 2-3 dígitos
- ✅ Nombre: mínimo 5 caracteres
- ✅ Origen ≠ Destino
- ✅ Frecuencias no vacías

### Relaciones
- ✅ Empresa existe en BD
- ✅ Resolución existe y es PADRE + VIGENTE
- ✅ Resolución pertenece a la empresa
- ✅ Código único dentro de la resolución

### Tipos y Estados
- ✅ Tipo de ruta válido (enum)
- ✅ Tipo de servicio válido (enum)
- ✅ Estado válido (enum)

### Campos Numéricos
- ✅ Distancia > 0
- ✅ Tarifa base > 0
- ✅ Capacidad máxima > 0
- ✅ Tiempo estimado formato HH:MM

## 🧪 Pruebas

### Scripts de Prueba

1. **Backend completo**:
```bash
python test_carga_masiva_rutas.py
```

2. **Datos de prueba**:
```bash
python crear_datos_prueba_rutas.py
```

3. **Frontend completo**:
```bash
python test_frontend_carga_masiva_rutas.py
```

### Casos de Prueba

#### ✅ Casos Exitosos
- Archivo con datos válidos
- Empresas y resoluciones existentes
- Códigos únicos por resolución
- Todos los tipos de ruta/servicio

#### ❌ Casos de Error
- Archivo Excel corrupto
- Empresa inexistente
- Resolución no PADRE o no VIGENTE
- Códigos duplicados
- Campos obligatorios vacíos
- Formatos inválidos

## 📁 Estructura de Archivos

```
backend/
├── app/
│   ├── services/
│   │   └── ruta_excel_service.py      # Procesamiento Excel
│   ├── routers/
│   │   └── rutas_router.py            # Endpoints API
│   └── models/
│       └── ruta.py                    # Modelos de datos

frontend/
├── src/app/
│   ├── components/rutas/
│   │   ├── carga-masiva-rutas.component.ts    # Componente principal
│   │   └── carga-masiva-rutas.component.scss  # Estilos
│   └── services/
│       └── ruta.service.ts            # Servicio API

# Scripts de prueba
├── test_carga_masiva_rutas.py         # Test backend
├── crear_datos_prueba_rutas.py        # Generador datos
└── test_frontend_carga_masiva_rutas.py # Test frontend
```

## 🎯 Flujo de Usuario

### 1. Preparación
1. Usuario accede a `/rutas/carga-masiva`
2. Descarga plantilla Excel oficial
3. Completa datos en hoja "DATOS"

### 2. Validación
1. Sube archivo Excel
2. Sistema valida estructura y datos
3. Muestra errores y advertencias
4. Usuario corrige errores si es necesario

### 3. Procesamiento
1. Usuario confirma procesamiento
2. Sistema crea rutas válidas
3. Muestra resumen de resultados
4. Usuario puede ver rutas creadas

## 🔧 Configuración Avanzada

### Variables de Entorno
```bash
# Backend
DATABASE_URL=mongodb://localhost:27017/drtc_puno
API_URL=http://localhost:8000/api/v1

# Frontend
API_URL=http://localhost:8000/api/v1
```

### Límites Configurables
```python
# ruta_excel_service.py
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_ROWS = 1000                   # 1000 rutas por archivo
TIMEOUT_SECONDS = 300             # 5 minutos
```

## 🐛 Troubleshooting

### Errores Comunes

#### "Empresa no existe"
- Verificar que el ID de empresa sea correcto
- Confirmar que la empresa esté activa en el sistema

#### "Resolución no válida"
- Verificar que sea resolución PADRE
- Confirmar que esté en estado VIGENTE
- Verificar que pertenezca a la empresa

#### "Código de ruta duplicado"
- Verificar unicidad dentro de la resolución
- Revisar rutas existentes en el sistema

#### "Archivo Excel corrupto"
- Verificar formato .xlsx o .xls
- Confirmar que tenga hoja "DATOS"
- Revisar que las columnas coincidan

### Logs de Debug
```python
# Habilitar logs detallados
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📈 Métricas y Monitoreo

### Estadísticas Disponibles
- Rutas procesadas por día
- Tasa de éxito/error
- Empresas más activas
- Tipos de ruta más comunes

### Endpoints de Métricas
```http
GET /api/v1/rutas/estadisticas
GET /api/v1/rutas/carga-masiva/metricas
```

## 🔄 Actualizaciones Futuras

### Funcionalidades Planeadas
- [ ] Actualización masiva de rutas existentes
- [ ] Importación desde CSV
- [ ] Validación de coordenadas GPS
- [ ] Integración con mapas
- [ ] Notificaciones por email
- [ ] Programación de cargas

### Mejoras Técnicas
- [ ] Procesamiento asíncrono
- [ ] Cache de validaciones
- [ ] Compresión de archivos
- [ ] API rate limiting
- [ ] Audit trail completo

## 📞 Soporte

Para reportar bugs o solicitar funcionalidades:
1. Crear issue en el repositorio
2. Incluir logs de error
3. Adjuntar archivo de prueba
4. Especificar pasos para reproducir

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2025  
**Compatibilidad**: Python 3.8+, Angular 17+