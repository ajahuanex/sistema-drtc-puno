# 🏢 Carga Masiva de Empresas desde Excel

## 📋 Descripción General

El sistema de carga masiva de empresas permite importar múltiples empresas desde un archivo Excel de forma eficiente y segura, con validaciones robustas y manejo de errores detallado.

## 🎯 Características Principales

- ✅ **Plantilla Excel estandarizada** con formato predefinido
- ✅ **Validaciones exhaustivas** de datos y formatos
- ✅ **Modo validación** para revisar datos sin crear empresas
- ✅ **Modo procesamiento** para crear empresas automáticamente
- ✅ **Detección de duplicados** por código de empresa y RUC
- ✅ **Manejo de errores detallado** con ubicación específica
- ✅ **Soporte para datos opcionales** y campos anidados

## 📊 Estructura del Archivo Excel

### Columnas Requeridas

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| Código Empresa | Texto | ✅ | Código único de empresa (formato: 4 dígitos + 3 letras, ej: 0123TRP) |
| RUC | Texto | ✅ | RUC de la empresa (11 dígitos) |
| Razón Social Principal | Texto | ✅ | Razón social principal de la empresa |
| Dirección Fiscal | Texto | ✅ | Dirección fiscal completa |
| DNI Representante | Texto | ✅ | DNI del representante legal (8 dígitos) |
| Nombres Representante | Texto | ✅ | Nombres del representante legal |
| Apellidos Representante | Texto | ✅ | Apellidos del representante legal |

### Columnas Opcionales

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| Razón Social SUNAT | Texto | ❌ | Razón social según SUNAT |
| Razón Social Mínimo | Texto | ❌ | Razón social abreviada |
| Estado | Texto | ❌ | Estado de la empresa (HABILITADA, EN_TRAMITE, SUSPENDIDA, CANCELADA, DADA_DE_BAJA) |
| Email Representante | Texto | ❌ | Email del representante legal |
| Teléfono Representante | Texto | ❌ | Teléfono del representante legal |
| Dirección Representante | Texto | ❌ | Dirección del representante legal |
| Email Contacto | Texto | ❌ | Email de contacto de la empresa |
| Teléfono Contacto | Texto | ❌ | Teléfono de contacto de la empresa |
| Sitio Web | Texto | ❌ | Sitio web de la empresa |
| Observaciones | Texto | ❌ | Observaciones adicionales |

## 🔍 Validaciones Implementadas

### Validaciones de Formato

1. **Código de Empresa**: Formato `XXXXYYY` (4 dígitos + 3 letras)
   - Ejemplo válido: `0123TRP`, `0001PRT`
   - Ejemplo inválido: `123ABC`, `ABCD123`

2. **RUC**: Exactamente 11 dígitos numéricos
   - Ejemplo válido: `20123456789`
   - Ejemplo inválido: `123456789`, `2012345678A`

3. **DNI**: Exactamente 8 dígitos numéricos
   - Ejemplo válido: `12345678`
   - Ejemplo inválido: `1234567`, `12345678A`

4. **Email**: Formato de email válido
   - Ejemplo válido: `usuario@dominio.com`
   - Ejemplo inválido: `usuario@dominio`, `email-invalido`

5. **Teléfono**: Números, espacios, guiones y paréntesis (7-15 caracteres)
   - Ejemplo válido: `951234567`, `051-123456`, `+51 951 234 567`
   - Ejemplo inválido: `12345`, `abc123`

### Validaciones de Negocio

1. **Unicidad de Código**: No puede existir otra empresa con el mismo código
2. **Unicidad de RUC**: No puede existir otra empresa con el mismo RUC
3. **Estado válido**: Debe ser uno de los estados permitidos
4. **Longitud mínima**: Campos de texto deben tener longitud mínima
5. **Campos requeridos**: Todos los campos obligatorios deben estar presentes

## 🚀 Endpoints Disponibles

### 1. Descargar Plantilla Excel

```http
GET /api/v1/empresas/carga-masiva/plantilla
```

**Respuesta**: Archivo Excel con la plantilla y datos de ejemplo.

### 2. Validar Archivo Excel

```http
POST /api/v1/empresas/carga-masiva/validar
Content-Type: multipart/form-data

archivo: [archivo.xlsx]
```

**Respuesta**:
```json
{
  "archivo": "empresas.xlsx",
  "validacion": {
    "total_filas": 10,
    "validos": 8,
    "invalidos": 2,
    "con_advertencias": 1,
    "errores": [
      {
        "fila": 3,
        "codigo_empresa": "INVALID",
        "errores": [
          "Formato de código de empresa inválido: INVALID (debe ser 4 dígitos + 3 letras, ej: 0123TRP)",
          "RUC debe tener 11 dígitos: 123456789"
        ]
      }
    ],
    "advertencias": []
  },
  "mensaje": "Archivo validado: 8 válidos, 2 inválidos"
}
```

### 3. Procesar Carga Masiva

```http
POST /api/v1/empresas/carga-masiva/procesar?solo_validar=false
Content-Type: multipart/form-data

archivo: [archivo.xlsx]
```

**Parámetros**:
- `solo_validar`: `true` para solo validar, `false` para crear empresas

**Respuesta**:
```json
{
  "archivo": "empresas.xlsx",
  "solo_validacion": false,
  "resultado": {
    "total_filas": 10,
    "validos": 8,
    "invalidos": 2,
    "con_advertencias": 1,
    "empresas_creadas": [
      {
        "codigo_empresa": "0001TRP",
        "ruc": "20123456789",
        "razon_social": "TRANSPORTES PUNO S.A.",
        "estado": "CREADA"
      }
    ],
    "errores_creacion": [],
    "total_creadas": 8
  },
  "mensaje": "Procesamiento completado: 8 empresas creadas"
}
```

## 📝 Ejemplo de Archivo Excel

```csv
Código Empresa,RUC,Razón Social Principal,Razón Social SUNAT,Razón Social Mínimo,Dirección Fiscal,Estado,DNI Representante,Nombres Representante,Apellidos Representante,Email Representante,Teléfono Representante,Dirección Representante,Email Contacto,Teléfono Contacto,Sitio Web,Observaciones
0001TRP,20123456789,TRANSPORTES PUNO S.A.,TRANSPORTES PUNO SOCIEDAD ANONIMA,TRANSPORTES PUNO,AV. EJERCITO 123 PUNO,HABILITADA,12345678,JUAN CARLOS,MAMANI QUISPE,juan.mamani@transportespuno.com,951234567,AV. SIMON BOLIVAR 789 PUNO,contacto@transportespuno.com,051-123456,www.transportespuno.com,Empresa con 15 años de experiencia
0002LOG,20987654321,LOGÍSTICA AREQUIPA E.I.R.L.,LOGISTICA AREQUIPA EMPRESA INDIVIDUAL DE RESPONSABILIDAD LIMITADA,LOGISTICA AREQUIPA,JR. MERCADERES 456 AREQUIPA,HABILITADA,87654321,MARIA ELENA,RODRIGUEZ VARGAS,maria.rodriguez@logisticaarequipa.com,987654321,CALLE SANTA CATALINA 321 AREQUIPA,info@logisticaarequipa.com,054-987654,www.logisticaarequipa.com,Especializada en carga pesada
```

## 🔧 Configuración y Uso

### Requisitos

- Python 3.8+
- pandas
- openpyxl
- FastAPI
- Archivo Excel con formato correcto

### Instalación de Dependencias

```bash
pip install pandas openpyxl fastapi python-multipart
```

### Uso desde el Frontend

```typescript
// Descargar plantilla
await this.empresaService.descargarPlantillaEmpresas();

// Validar archivo
const resultado = await this.empresaService.validarArchivoEmpresas(archivo);

// Procesar archivo
const resultado = await this.empresaService.procesarCargaMasivaEmpresas(archivo, false);
```

### Uso desde Python

```python
from app.services.empresa_excel_service import EmpresaExcelService

service = EmpresaExcelService()

# Generar plantilla
plantilla = service.generar_plantilla_excel()

# Validar archivo
with open('empresas.xlsx', 'rb') as f:
    resultado = service.validar_archivo_excel(f)

# Procesar archivo
with open('empresas.xlsx', 'rb') as f:
    resultado = service.procesar_carga_masiva(f)
```

## 🧪 Pruebas

### Ejecutar Pruebas Unitarias

```bash
# Pruebas del servicio
python test_carga_masiva_empresas.py

# Pruebas de endpoints
python test_endpoints_carga_masiva_empresas.py
```

### Casos de Prueba Incluidos

1. **Validaciones de formato**: Códigos, RUCs, DNIs, emails, teléfonos
2. **Detección de duplicados**: Por código de empresa y RUC
3. **Manejo de errores**: Archivos corruptos, formatos incorrectos
4. **Procesamiento completo**: Validación + creación de empresas
5. **Casos límite**: Campos vacíos, caracteres especiales

## 📊 Métricas y Estadísticas

El sistema proporciona métricas detalladas:

- **Total de filas procesadas**
- **Empresas válidas vs inválidas**
- **Empresas con advertencias**
- **Empresas creadas exitosamente**
- **Errores de creación**
- **Tiempo de procesamiento**

## 🚨 Manejo de Errores

### Tipos de Errores

1. **Errores de Formato**: Archivo no es Excel, columnas faltantes
2. **Errores de Validación**: Datos inválidos, formatos incorrectos
3. **Errores de Duplicación**: Códigos o RUCs ya existentes
4. **Errores de Creación**: Problemas al guardar en base de datos

### Respuestas de Error

```json
{
  "error": "Error al procesar archivo Excel: Formato de archivo inválido",
  "total_filas": 0,
  "validos": 0,
  "invalidos": 0,
  "con_advertencias": 0,
  "errores": [],
  "advertencias": [],
  "empresas_validas": []
}
```

## 🔒 Seguridad

- **Validación de tipos de archivo**: Solo Excel (.xlsx, .xls)
- **Límites de tamaño**: Archivos hasta 10MB
- **Sanitización de datos**: Limpieza de caracteres especiales
- **Validación de permisos**: Solo usuarios autorizados
- **Logs de auditoría**: Registro de todas las operaciones

## 📈 Rendimiento

- **Procesamiento en lotes**: Manejo eficiente de archivos grandes
- **Validación temprana**: Detección rápida de errores
- **Memoria optimizada**: Procesamiento streaming para archivos grandes
- **Cache de validaciones**: Reutilización de validaciones comunes

## 🔄 Flujo de Trabajo Recomendado

1. **Descargar plantilla** Excel desde el sistema
2. **Completar datos** siguiendo el formato establecido
3. **Validar archivo** antes del procesamiento final
4. **Revisar errores** y corregir datos si es necesario
5. **Procesar archivo** para crear las empresas
6. **Verificar resultados** y empresas creadas

## 📞 Soporte

Para problemas o consultas sobre la carga masiva de empresas:

- Revisar logs de validación detallados
- Verificar formato de plantilla Excel
- Consultar documentación de validaciones
- Contactar al equipo de desarrollo

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024  
**Autor**: Sistema DRTC Puno