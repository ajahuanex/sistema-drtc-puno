# Sistema de Códigos de Empresa

## Descripción General

El sistema de códigos de empresa implementa un identificador único para cada empresa registrada en el sistema DRTC Puno. Cada código sigue un formato específico que proporciona información sobre la empresa y garantiza su unicidad.

## Formato del Código

### Estructura
```
XXXXPRT
│││││││
││││││└─ T: Turismo
│││││└── R: Regional  
││││└─── P: Personas
│││└──── Número secuencial (4 dígitos)
││└───── Número secuencial (4 dígitos)
│└────── Número secuencial (4 dígitos)
└─────── Número secuencial (4 dígitos)
```

### Componentes

1. **Número Secuencial (4 dígitos)**: 
   - Rango: 0001 - 9999
   - Se asigna automáticamente de forma secuencial
   - Es único para cada empresa

2. **Tipos de Empresa (3 letras)**:
   - **P**: Personas - Transporte de pasajeros
   - **R**: Regional - Servicios interprovinciales
   - **T**: Turismo - Servicios turísticos especializados

### Ejemplos

- `0001PRT`: Primera empresa registrada (Personas + Regional + Turismo)
- `0123PRT`: Empresa #123 (Personas + Regional + Turismo)
- `0456PRT`: Empresa #456 (Personas + Regional + Turismo)

## Implementación Técnica

### Backend (Python/FastAPI)

#### Modelos
```python
class TipoEmpresa(str, Enum):
    PERSONAS = "P"
    REGIONAL = "R"
    TURISMO = "T"

class Empresa(BaseModel):
    codigoEmpresa: str = Field(..., description="Código único de empresa: 4 dígitos + 3 letras")
    # ... otros campos
```

#### Utilidades
- **`CodigoEmpresaUtils`**: Clase estática con métodos para:
  - Validar formato de códigos
  - Generar códigos automáticamente
  - Extraer información de códigos existentes
  - Obtener siguiente código disponible

#### Servicios
- **Generación automática**: Si no se proporciona código, se genera automáticamente
- **Validación**: Verifica formato y unicidad antes de crear empresa
- **Búsqueda**: Permite buscar empresas por código

#### Endpoints API
```
GET /api/v1/empresas/siguiente-codigo
GET /api/v1/empresas/validar-codigo/{codigo}
```

### Frontend (Angular)

#### Modelos
```typescript
export enum TipoEmpresa {
  PERSONAS = 'P',
  REGIONAL = 'R',
  TURISMO = 'T'
}

export interface Empresa {
  codigoEmpresa: string;
  // ... otros campos
}
```

#### Servicios
- **`generarSiguienteCodigoEmpresa()`**: Obtiene siguiente código disponible
- **`validarCodigoEmpresa(codigo)`**: Valida formato de código

#### Componentes
- **`CodigoEmpresaInfoComponent`**: Muestra información visual del código
- **Formularios**: Incluyen campo para código de empresa

## Flujo de Trabajo

### 1. Creación de Empresa
```
Usuario crea empresa → 
Sistema verifica si se proporciona código → 
Si no hay código: Genera automáticamente → 
Valida formato y unicidad → 
Crea empresa con código asignado
```

### 2. Generación Automática
```
Sistema obtiene códigos existentes → 
Encuentra número más alto → 
Incrementa en 1 → 
Aplica formato estándar PRT → 
Retorna nuevo código
```

### 3. Validación
```
Usuario ingresa código → 
Sistema valida formato (4 dígitos + 3 letras) → 
Verifica unicidad en base de datos → 
Retorna resultado de validación
```

## Ventajas del Sistema

### 1. **Unicidad Garantizada**
- Cada empresa tiene un código único
- Evita duplicados y conflictos

### 2. **Información Semántica**
- El código indica los tipos de servicio
- Facilita identificación rápida

### 3. **Escalabilidad**
- Soporta hasta 9,999 empresas
- Sistema secuencial predecible

### 4. **Flexibilidad**
- Código personalizable o automático
- Validación en tiempo real

### 5. **Trazabilidad**
- Auditoría completa de cambios
- Historial de modificaciones

## Casos de Uso

### 1. **Registro de Nueva Empresa**
- Usuario puede ingresar código personalizado
- Sistema genera código automáticamente si no se especifica
- Validación inmediata de formato y unicidad

### 2. **Búsqueda y Filtrado**
- Búsqueda por código de empresa
- Filtrado por tipos de servicio
- Listado ordenado por número secuencial

### 3. **Reportes y Estadísticas**
- Conteo de empresas por tipo
- Análisis de distribución de códigos
- Auditoría de asignaciones

### 4. **Integración con Otros Sistemas**
- Código como identificador único
- Referencias cruzadas en resoluciones, expedientes, etc.
- Sincronización con sistemas externos

## Consideraciones de Seguridad

### 1. **Validación de Entrada**
- Sanitización de caracteres especiales
- Verificación de longitud y formato
- Prevención de inyección de código

### 2. **Control de Acceso**
- Solo usuarios autorizados pueden modificar códigos
- Auditoría de cambios de código
- Logs de todas las operaciones

### 3. **Integridad de Datos**
- Verificación de unicidad en base de datos
- Transacciones atómicas para operaciones críticas
- Backup y recuperación de códigos

## Mantenimiento y Evolución

### 1. **Monitoreo**
- Alertas por códigos duplicados
- Estadísticas de uso del sistema
- Performance de generación automática

### 2. **Escalabilidad**
- Evaluación de límite de 9,999 empresas
- Planificación para expansión futura
- Migración de códigos si es necesario

### 3. **Mejoras Futuras**
- Códigos personalizados por región
- Integración con sistemas externos
- API para terceros

## Ejemplos de Implementación

### Generar Código Automáticamente
```python
# Backend
codigo = await empresa_service.generar_siguiente_codigo_empresa()
# Retorna: "0003PRT"

# Frontend
this.empresaService.generarSiguienteCodigoEmpresa().subscribe(
  response => {
    this.codigoEmpresa = response.siguienteCodigo;
  }
);
```

### Validar Código Existente
```python
# Backend
es_valido = CodigoEmpresaUtils.validar_formato_codigo("0123PRT")
# Retorna: True

# Frontend
this.empresaService.validarCodigoEmpresa("0123PRT").subscribe(
  response => {
    if (response.esValido) {
      console.log("Código válido:", response.descripcionTipos);
    }
  }
);
```

### Buscar por Código
```python
# Backend
empresa = await empresa_service.get_empresa_by_codigo("0123PRT")

# Frontend
this.empresaService.getEmpresaByCodigo("0123PRT").subscribe(
  empresa => {
    console.log("Empresa encontrada:", empresa.razonSocial.principal);
  }
);
```

## Conclusión

El sistema de códigos de empresa proporciona una base sólida para la identificación única y gestión eficiente de empresas en el sistema DRTC Puno. Su diseño balancea simplicidad, funcionalidad y escalabilidad, facilitando tanto la operación diaria como el crecimiento futuro del sistema.
