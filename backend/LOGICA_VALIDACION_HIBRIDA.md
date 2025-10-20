# 🔄 Lógica de Validación Híbrida para Carga Masiva

## 🎯 **Estrategia Implementada**

### **Enfoque Híbrido Inteligente**
Implementamos una estrategia diferenciada según el tipo de entidad, balanceando **flexibilidad** y **control de calidad**.

## 📊 **Configuración por Tipo de Entidad**

### 1️⃣ **EMPRESAS** - Auto-creación Habilitada ✅
```python
auto_crear_empresas = True
```

**Razón**: Las empresas pueden ser verificadas externamente (SUNAT, registros públicos)

**Comportamiento**:
- ✅ **Si existe**: Usa la empresa existente
- ✅ **Si no existe**: Crea automáticamente con datos básicos
- ✅ **Validación**: RUC debe tener 11 dígitos
- ⚠️ **Advertencia**: Notifica que será creada automáticamente

**Datos de empresa auto-creada**:
```python
{
    "ruc": "20999888777",
    "razonSocial": "EMPRESA VOLVO FH16",  # Basado en marca/modelo
    "codigoEmpresa": "0005AUT",  # Código automático
    "estado": "HABILITADA",
    "direccionFiscal": "DIRECCIÓN POR COMPLETAR",
    "representanteLegal": {
        "nombres": "POR COMPLETAR",
        "email": "pendiente@empresa.com"
    }
}
```

### 2️⃣ **RESOLUCIONES** - Solo Validación ❌
```python
auto_crear_resoluciones = False
```

**Razón**: Las resoluciones son documentos oficiales que requieren proceso administrativo formal

**Comportamiento**:
- ✅ **Si existe**: Usa la resolución existente
- ❌ **Si no existe**: Error - debe existir previamente
- ✅ **Validación**: Formato R-1234-2025
- ✅ **Validación**: Tipo (PADRE/HIJA) correcto

**Nuevo formato de resoluciones**:
```
Formato anterior: 001-2024-DRTC-PUNO
Formato nuevo:    R-1001-2024
Patrón regex:     ^R-\d{4}-\d{4}$
```

### 3️⃣ **RUTAS** - Solo Validación ❌
```python
auto_crear_rutas = False
```

**Razón**: Las rutas requieren autorización y estudios técnicos previos

**Comportamiento**:
- ✅ **Si existe**: Asigna la ruta al vehículo
- ❌ **Si no existe**: Advertencia - ruta no será asignada
- ✅ **Validación**: Código de ruta debe existir

## 🔍 **Proceso de Validación Detallado**

### **Fase 1: Validación de Formato**
```python
# RUC Empresa
if not re.match(r'^\d{11}$', ruc):
    errores.append("RUC debe tener 11 dígitos")

# Resolución
if not re.match(r'^R-\d{4}-\d{4}$', resolucion):
    errores.append("Formato inválido (debe ser R-1234-2025)")
```

### **Fase 2: Validación de Existencia**
```python
# Empresas - Con auto-creación
empresa = self._buscar_empresa_por_ruc(ruc)
if not empresa:
    if self.auto_crear_empresas:
        advertencias.append("Empresa será creada automáticamente")
    else:
        errores.append("Empresa no encontrada")

# Resoluciones - Solo validación
resolucion = self._buscar_resolucion_por_numero(numero)
if not resolucion:
    errores.append("Resolución no encontrada")
```

### **Fase 3: Procesamiento**
```python
# Auto-crear empresa si es necesario
empresa = self._obtener_o_crear_empresa(ruc, nombre_sugerido)

# Usar resolución existente (no auto-crear)
resolucion = self._buscar_resolucion_por_numero(numero)
```

## 📋 **Tipos de Mensajes**

### ✅ **Éxito**
- Empresa encontrada y válida
- Resolución encontrada y válida
- Ruta encontrada y asignada

### ⚠️ **Advertencias** (No bloquean el procesamiento)
- "Empresa con RUC 20999888777 será creada automáticamente"
- "No se encontró ruta con código: 05 (no será asignada)"
- "Resolución R-1005-2024 no es tipo PADRE"

### ❌ **Errores** (Bloquean el procesamiento)
- "RUC debe tener 11 dígitos: 12345"
- "Formato de resolución inválido: 001-2024 (debe ser R-1234-2025)"
- "No se encontró resolución primigenia: R-9999-2024"

## 🎯 **Ventajas del Enfoque Híbrido**

### **Para Empresas (Auto-creación)**
- ✅ **Flexibilidad**: Permite carga de vehículos de empresas nuevas
- ✅ **Eficiencia**: Reduce pasos manuales de pre-registro
- ✅ **Trazabilidad**: Marca empresas como "auto-creadas"
- ✅ **Completitud**: Permite completar datos posteriormente

### **Para Resoluciones (Solo validación)**
- ✅ **Control**: Mantiene integridad de documentos oficiales
- ✅ **Proceso formal**: Respeta flujo administrativo
- ✅ **Auditoría**: Evita resoluciones "fantasma"
- ✅ **Calidad**: Garantiza datos correctos

### **Para Rutas (Solo validación)**
- ✅ **Autorización**: Respeta proceso de autorización de rutas
- ✅ **Seguridad**: Evita asignaciones no autorizadas
- ✅ **Flexibilidad**: Permite vehículos sin rutas inicialmente

## 🔧 **Configuración Avanzada**

### **Habilitar/Deshabilitar Auto-creación**
```python
class VehiculoExcelService:
    def __init__(self):
        # Configuración flexible
        self.auto_crear_empresas = True      # Cambiar a False para solo validar
        self.auto_crear_resoluciones = False # Cambiar a True para auto-crear
        self.auto_crear_rutas = False       # Cambiar a True para auto-crear
```

### **Personalizar Validaciones**
```python
# Validación personalizada de RUC
def _validar_ruc_sunat(self, ruc: str) -> bool:
    # Integración con API SUNAT (futuro)
    return self._validar_ruc_basico(ruc)

# Validación personalizada de resoluciones
def _validar_resolucion_vigente(self, numero: str) -> bool:
    resolucion = self._buscar_resolucion_por_numero(numero)
    return resolucion and resolucion.estado == "VIGENTE"
```

## 📊 **Estadísticas de Procesamiento**

### **Reporte Detallado**
```json
{
  "total_procesados": 100,
  "exitosos": 85,
  "errores": 10,
  "advertencias": 25,
  "entidades_creadas": {
    "empresas": 5,
    "resoluciones": 0,
    "rutas": 0
  },
  "validaciones": {
    "empresas_existentes": 80,
    "empresas_creadas": 5,
    "resoluciones_validas": 70,
    "resoluciones_invalidas": 15,
    "rutas_asignadas": 150,
    "rutas_no_encontradas": 10
  }
}
```

## 🚀 **Casos de Uso Comunes**

### **Caso 1: Empresa Nueva, Resolución Existente**
```excel
RUC: 20999888777 (no existe)
Resolución: R-1001-2024 (existe)
```
**Resultado**: ✅ Empresa creada automáticamente, resolución asignada

### **Caso 2: Empresa Existente, Resolución Nueva**
```excel
RUC: 20123456789 (existe)
Resolución: R-9999-2024 (no existe)
```
**Resultado**: ❌ Error - resolución debe existir previamente

### **Caso 3: Todo Existente**
```excel
RUC: 20123456789 (existe)
Resolución: R-1001-2024 (existe)
```
**Resultado**: ✅ Procesamiento normal sin auto-creación

### **Caso 4: Datos Inválidos**
```excel
RUC: 12345 (formato inválido)
Resolución: 001-2024 (formato inválido)
```
**Resultado**: ❌ Errores de formato, no se procesa

## 🎯 **Recomendaciones de Uso**

### **Para Administradores**
1. **Pre-registrar resoluciones** antes de carga masiva
2. **Revisar empresas auto-creadas** y completar datos
3. **Configurar auto-creación** según políticas organizacionales

### **Para Usuarios**
1. **Usar plantilla actualizada** con formato R-1234-2025
2. **Verificar RUCs** antes de cargar (11 dígitos)
3. **Revisar advertencias** en el reporte de validación

### **Para Desarrolladores**
1. **Monitorear estadísticas** de auto-creación
2. **Implementar notificaciones** para empresas auto-creadas
3. **Considerar integración SUNAT** para validación de RUCs

---

## 🎯 **Resumen Ejecutivo**

La **lógica híbrida** implementada ofrece el **mejor balance** entre:

- **Flexibilidad operativa** (auto-creación de empresas)
- **Control de calidad** (validación estricta de resoluciones)
- **Eficiencia de proceso** (menos pasos manuales)
- **Integridad de datos** (validaciones robustas)

Esta estrategia permite **carga masiva eficiente** manteniendo **estándares de calidad** y **trazabilidad completa** de todas las operaciones.