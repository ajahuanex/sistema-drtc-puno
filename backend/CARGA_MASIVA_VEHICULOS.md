# Carga Masiva de Vehículos

## Descripción

La funcionalidad de carga masiva permite importar múltiples vehículos desde un archivo Excel, incluyendo validaciones automáticas de datos y relaciones con empresas, resoluciones y rutas existentes.

## Características

### ✅ Funcionalidades Implementadas

- **Plantilla Excel**: Generación automática de plantilla con formato correcto
- **Validación Previa**: Validación de datos antes del procesamiento
- **Carga Masiva**: Procesamiento de múltiples vehículos en lote
- **Validaciones Integrales**: Verificación de datos técnicos, empresas, resoluciones y rutas
- **Manejo de Errores**: Reporte detallado de errores por fila
- **Interfaz de Usuario**: Componente Angular con proceso paso a paso

### 📊 Datos Soportados

#### Información Básica del Vehículo
- Placa (formato peruano: ABC-123 o AB-1234)
- Empresa (por RUC)
- Categoría (M1, M2, M3, N1, N2, N3)
- Marca y modelo
- Año de fabricación
- Color y número de serie
- Estado (ACTIVO, INACTIVO, EN_MANTENIMIENTO, etc.)

#### Datos Técnicos
- Motor y chasis
- Número de ejes y asientos
- Peso neto y bruto
- Dimensiones (largo, ancho, alto)
- Tipo de combustible
- Cilindrada y potencia

#### Relaciones
- Resolución padre (opcional)
- Resolución primigenia (opcional)
- Rutas asignadas (códigos separados por comas)

## Estructura de Archivos

### Backend

```
backend/
├── app/
│   ├── models/
│   │   └── vehiculo.py                    # Modelos actualizados con carga masiva
│   ├── services/
│   │   └── vehiculo_excel_service.py      # Servicio de procesamiento Excel
│   └── routers/
│       └── vehiculos_router.py            # Endpoints de carga masiva
├── requirements.txt                       # Dependencias actualizadas
├── test_carga_masiva_vehiculos.py        # Pruebas del sistema
└── CARGA_MASIVA_VEHICULOS.md             # Esta documentación
```

### Frontend

```
frontend/src/app/
├── components/vehiculos/
│   ├── carga-masiva-vehiculos.component.ts    # Componente principal
│   └── carga-masiva-vehiculos.component.scss  # Estilos
└── services/
    └── vehiculo.service.ts                     # Métodos de carga masiva
```

## API Endpoints

### 1. Descargar Plantilla Excel
```http
GET /api/v1/vehiculos/plantilla-excel
```
**Respuesta**: Archivo Excel con plantilla y datos de ejemplo

### 2. Validar Archivo Excel
```http
POST /api/v1/vehiculos/validar-excel
Content-Type: multipart/form-data

archivo: [archivo.xlsx]
```
**Respuesta**:
```json
[
  {
    "fila": 2,
    "placa": "ABC-123",
    "valido": true,
    "errores": [],
    "advertencias": []
  }
]
```

### 3. Procesar Carga Masiva
```http
POST /api/v1/vehiculos/carga-masiva
Content-Type: multipart/form-data

archivo: [archivo.xlsx]
```
**Respuesta**:
```json
{
  "total_procesados": 10,
  "exitosos": 8,
  "errores": 2,
  "vehiculos_creados": ["11", "12", "13"],
  "errores_detalle": [
    {
      "fila": 3,
      "placa": "XYZ-456",
      "errores": ["Ya existe un vehículo con esta placa"]
    }
  ]
}
```

### 4. Estadísticas de Carga Masiva
```http
GET /api/v1/vehiculos/carga-masiva/estadisticas
```

## Formato de Plantilla Excel

### Columnas Requeridas

| Columna | Tipo | Requerido | Descripción |
|---------|------|-----------|-------------|
| Placa | Texto | ✅ | Formato ABC-123 o AB-1234 |
| RUC Empresa | Texto | ✅ | RUC de 11 dígitos |
| Resolución Padre | Texto | ❌ | Número de resolución existente |
| Resolución Primigenia | Texto | ❌ | Número de resolución existente |
| Rutas Asignadas | Texto | ❌ | Códigos separados por comas |
| Categoría | Texto | ✅ | M1, M2, M3, N1, N2, N3 |
| Marca | Texto | ✅ | Marca del vehículo |
| Modelo | Texto | ✅ | Modelo del vehículo |
| Año Fabricación | Número | ✅ | Entre 1900 y 2030 |
| Color | Texto | ❌ | Color del vehículo |
| Número Serie | Texto | ❌ | Número de serie |
| Motor | Texto | ✅ | Especificación del motor |
| Chasis | Texto | ✅ | Número de chasis |
| Ejes | Número | ✅ | Entre 1 y 10 |
| Asientos | Número | ✅ | Entre 1 y 100 |
| Peso Neto (kg) | Número | ✅ | Entre 100 y 50000 |
| Peso Bruto (kg) | Número | ✅ | Entre 100 y 100000 |
| Largo (m) | Número | ✅ | Entre 1 y 30 |
| Ancho (m) | Número | ✅ | Entre 0.5 y 5 |
| Alto (m) | Número | ✅ | Entre 0.5 y 5 |
| Tipo Combustible | Texto | ✅ | GASOLINA, DIESEL, GAS_NATURAL, ELECTRICO, HIBRIDO |
| Cilindrada | Número | ❌ | Cilindrada del motor |
| Potencia (HP) | Número | ❌ | Potencia en HP |
| Estado | Texto | ❌ | Por defecto: ACTIVO |
| Observaciones | Texto | ❌ | Comentarios adicionales |

### Ejemplo de Datos

```excel
Placa     | RUC Empresa   | Categoría | Marca         | Modelo | Año | Motor      | Chasis    | Ejes | Asientos | ...
ABC-123   | 20123456789   | M3        | MERCEDES BENZ | O500   | 2020| OM 457 LA  | WDB123456 | 2    | 50       | ...
XYZ-456   | 20234567890   | N3        | VOLVO         | FH16   | 2019| D16G750    | VOL789012 | 3    | 2        | ...
```

## Validaciones Implementadas

### 1. Validaciones de Formato
- **Placa**: Formato peruano (ABC-123 o AB-1234)
- **RUC**: 11 dígitos numéricos
- **Campos numéricos**: Rangos válidos según tipo de dato

### 2. Validaciones de Existencia
- **Empresa**: Debe existir en el sistema por RUC
- **Resoluciones**: Verificación opcional si se proporcionan
- **Rutas**: Verificación opcional si se proporcionan
- **Placa única**: No debe existir otro vehículo con la misma placa

### 3. Validaciones de Negocio
- **Categoría**: Debe ser una categoría válida del sistema
- **Tipo de combustible**: Debe ser un tipo válido
- **Año de fabricación**: Rango razonable (1900-2030)
- **Dimensiones**: Rangos lógicos según tipo de vehículo

## Proceso de Carga

### 1. Preparación
1. Descargar plantilla Excel
2. Completar datos de vehículos
3. Verificar que empresas, resoluciones y rutas existan

### 2. Validación
1. Subir archivo Excel
2. Ejecutar validación previa
3. Revisar errores y advertencias
4. Corregir datos si es necesario

### 3. Procesamiento
1. Confirmar carga masiva
2. Procesar vehículos válidos
3. Revisar resultados
4. Verificar vehículos creados

## Manejo de Errores

### Tipos de Errores

1. **Errores de Estructura**
   - Columnas faltantes
   - Archivo vacío
   - Formato de archivo incorrecto

2. **Errores de Datos**
   - Formato de placa inválido
   - RUC de empresa no encontrado
   - Categoría inválida
   - Valores fuera de rango

3. **Errores de Negocio**
   - Placa duplicada
   - Empresa inactiva
   - Resolución no vigente

### Advertencias

- Resolución no encontrada (opcional)
- Ruta no encontrada (opcional)
- Datos técnicos inusuales

## Pruebas

### Ejecutar Pruebas
```bash
cd backend
python test_carga_masiva_vehiculos.py
```

### Casos de Prueba
- ✅ Validación de formatos
- ✅ Búsqueda de entidades relacionadas
- ✅ Procesamiento de datos válidos
- ✅ Manejo de errores
- ✅ Generación de plantilla

## Dependencias

### Backend
```txt
pandas>=2.0.0
openpyxl>=3.1.0
xlrd>=2.0.0
```

### Frontend
- Angular File Upload
- HTTP Client para multipart/form-data

## Consideraciones de Rendimiento

- **Límite de filas**: Recomendado máximo 1000 vehículos por archivo
- **Validación en lotes**: Procesamiento optimizado para archivos grandes
- **Memoria**: Uso eficiente con pandas para archivos Excel
- **Timeout**: Configurar timeout adecuado para archivos grandes

## Seguridad

- **Validación de archivos**: Solo archivos Excel permitidos
- **Sanitización**: Limpieza de datos de entrada
- **Autorización**: Verificación de permisos de usuario
- **Logs**: Registro de operaciones de carga masiva

## Futuras Mejoras

- [ ] Soporte para archivos CSV
- [ ] Carga asíncrona con notificaciones
- [ ] Historial de cargas masivas
- [ ] Plantillas personalizadas por empresa
- [ ] Validación de imágenes de vehículos
- [ ] Integración con APIs externas de validación