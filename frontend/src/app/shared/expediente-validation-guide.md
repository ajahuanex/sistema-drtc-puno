# Validación de Unicidad de Expedientes - Guía Completa

## 🎯 **Objetivo**
Garantizar que **los expedientes sean únicos por año** en todo el sistema, evitando duplicados y conflictos en la numeración.

## 🔍 **Regla de Negocio**
- **Formato**: E-XXXX-YYYY (Ej: E-0001-2025, E-0002-2025)
- **Unicidad**: No puede haber dos expedientes con el mismo número en el mismo año
- **Alcance**: Aplica a todas las empresas del sistema
- **Validación**: Se realiza en tiempo real durante la creación/edición

## 🏗️ **Arquitectura de la Solución**

### 1. **Servicio de Validación** (`ExpedienteValidationService`)
```typescript
// Valida la unicidad de un expediente
validarUnicidadExpediente(validacion: ValidacionExpediente): Observable<ResultadoValidacionExpediente>

// Obtiene sugerencias de números disponibles
obtenerSugerenciasNumeros(año: number, cantidad: number): Observable<string[]>

// Valida la secuencia para una empresa específica
validarSecuenciaEmpresa(empresaId: string, año: number): Observable<ResultadoValidacionExpediente>
```

### 2. **Componente Validador** (`ExpedienteNumberValidatorComponent`)
- **Validación en tiempo real** con debounce de 500ms
- **Indicadores visuales** de estado (válido/inválido)
- **Sugerencias automáticas** de números disponibles
- **Manejo de conflictos** con información detallada

### 3. **Integración en Formularios**
- Se integra como campo de formulario reactivo
- Emite eventos de validación al componente padre
- Mantiene sincronización con el estado del formulario

## 📋 **Flujo de Validación**

### **Paso 1: Ingreso del Número**
```
Usuario escribe "0001" → Debounce 500ms → Inicia validación
```

### **Paso 2: Validación Local**
```typescript
// Verifica formato
if (!validarFormatoNumero(numero)) {
  return { valido: false, mensaje: 'Formato inválido' };
}

// Verifica año
if (!validarAño(año)) {
  return { valido: false, mensaje: 'Año inválido' };
}
```

### **Paso 3: Verificación de Unicidad**
```typescript
// Busca conflictos en el mismo año
const expedientesConflictivos = expedientes.filter(expediente => {
  const match = expediente.nroExpediente.match(/^E-(\d+)-(\d+)$/);
  return numeroExistente === numero && añoExistente === año;
});
```

### **Paso 4: Generación de Sugerencias**
```typescript
// Encuentra números disponibles
const numerosUsados = new Set<string>();
// Genera sugerencias secuenciales
let numero = 1;
while (sugerencias.length < cantidad) {
  if (!numerosUsados.has(numero.toString())) {
    sugerencias.push(numero.toString());
  }
  numero++;
}
```

## 🎨 **Interfaz de Usuario**

### **Estados Visuales**

#### **Campo Vacío**
- Icono: `help_outline`
- Color: Gris neutro
- Mensaje: "El sistema generará E-0001-2025"

#### **Validando**
- Icono: `hourglass_empty` (animado)
- Mensaje: "Validando..."
- Estado: Loading

#### **Válido**
- Icono: `check_circle`
- Color: Verde (#4caf50)
- Mensaje: "El número de expediente 0001 está disponible para el año 2025"

#### **Inválido**
- Icono: `error`
- Color: Rojo (#f44336)
- Mensaje: "Ya existe un expediente con el número 0001 en el año 2025"

### **Información Adicional**

#### **Sugerencias**
```
Números disponibles:
[1] [2] [3] [4] [5]
```
- Chips clickeables para selección rápida
- Colores azules para indicar disponibilidad

#### **Conflictos**
```
Conflictos detectados:
• Expediente E-0001-2025 ya existe
• Empresa ID: 1
• Estado: EN_TRAMITE
• Tipo de Trámite: PRIMIGENIA
• Fecha de emisión: 15/01/2025
```

## 🔧 **Implementación en Formularios**

### **1. Importar Componentes**
```typescript
import { ExpedienteNumberValidatorComponent } from '../../shared/expediente-number-validator.component';
import { ExpedienteValidationService } from '../../services/expediente-validation.service';
```

### **2. Agregar al Template**
```html
<app-expediente-number-validator
  label="Número de Expediente *"
  placeholder="Ej: 0001"
  hint="El sistema generará E-0001-2025"
  [required]="true"
  [empresaId]="form.get('empresaId')?.value"
  (numeroValido)="onNumeroValido($event)"
  (numeroInvalido)="onNumeroInvalido($event)"
  (validacionCompleta)="onValidacionCompleta($event)">
</app-expediente-number-validator>
```

### **3. Manejar Eventos**
```typescript
onNumeroValido(data: { numero: string; año: number; nroCompleto: string }): void {
  this.form.get('numero')?.setValue(data.numero);
  this.snackBar.open(`Número válido: ${data.nroCompleto}`, 'Cerrar');
}

onNumeroInvalido(mensaje: string): void {
  this.form.get('numero')?.setErrors({ duplicado: true });
  this.snackBar.open(mensaje, 'Cerrar', { panelClass: ['error-snackbar'] });
}
```

## 📊 **Casos de Uso**

### **Caso 1: Creación de Primer Expediente del Año**
```
Usuario ingresa: "0001"
Validación: ✅ Válido
Resultado: E-0001-2025 disponible
Sugerencias: [2, 3, 4, 5, 6]
```

### **Caso 2: Expediente Duplicado**
```
Usuario ingresa: "0001"
Validación: ❌ Inválido
Conflicto: E-0001-2025 ya existe
Sugerencias: [2, 3, 4, 5, 6]
```

### **Caso 3: Edición de Expediente Existente**
```
Usuario edita: E-0001-2025
Validación: ✅ Válido (excluye el expediente actual)
Resultado: No hay conflictos
```

### **Caso 4: Secuencia de Empresa**
```
Empresa tiene: E-0001-2025, E-0002-2025
Siguiente sugerido: 3
Mensaje: "Siguiente número sugerido: 3"
```

## 🚀 **Características Avanzadas**

### **1. Validación Inteligente**
- **Debounce**: Evita validaciones excesivas
- **Cache local**: Optimiza rendimiento
- **Validación asíncrona**: No bloquea la UI

### **2. Sugerencias Inteligentes**
- **Secuencial**: Sigue la numeración lógica
- **Contextual**: Considera expedientes existentes
- **Adaptativa**: Se ajusta al año seleccionado

### **3. Manejo de Errores**
- **Graceful degradation**: Funciona offline
- **Mensajes claros**: Explica exactamente qué está mal
- **Recuperación**: Sugiere alternativas válidas

## 🔒 **Seguridad y Validación**

### **Validaciones del Lado Cliente**
- Formato de número (debe ser > 0)
- Rango de años (2000 - año actual + 1)
- Unicidad por año
- Conflictos de empresa

### **Validaciones del Lado Servidor**
- Verificación de permisos
- Validación de integridad
- Prevención de race conditions
- Auditoría de cambios

## 📈 **Métricas y Monitoreo**

### **Logs de Validación**
```typescript
console.log('Validación completada:', {
  numero: '0001',
  año: 2025,
  resultado: 'VÁLIDO',
  timestamp: new Date(),
  usuario: 'user123'
});
```

### **Métricas de Rendimiento**
- Tiempo de validación promedio
- Tasa de éxito/fallo
- Número de conflictos detectados
- Sugerencias utilizadas

## 🧪 **Testing**

### **Casos de Prueba**
```typescript
describe('ExpedienteValidationService', () => {
  it('debe validar unicidad por año', () => {
    // Test de unicidad
  });

  it('debe generar sugerencias correctas', () => {
    // Test de sugerencias
  });

  it('debe manejar conflictos de empresa', () => {
    // Test de conflictos
  });
});
```

### **Mocks y Datos de Prueba**
```typescript
const mockExpedientes = [
  { id: '1', nroExpediente: 'E-0001-2025', empresaId: '1' },
  { id: '2', nroExpediente: 'E-0002-2025', empresaId: '1' }
];
```

## 🔮 **Futuras Mejoras**

### **1. Validación Predictiva**
- Sugerir números basados en patrones históricos
- Predecir conflictos antes de que ocurran

### **2. Integración con Calendario**
- Validar fechas de emisión
- Sugerir fechas óptimas de creación

### **3. Análisis de Tendencias**
- Reportes de numeración por año
- Estadísticas de conflictos
- Recomendaciones de optimización

## 📚 **Referencias**

- **Modelo de Expediente**: `expediente.model.ts`
- **Servicio de Validación**: `expediente-validation.service.ts`
- **Componente Validador**: `expediente-number-validator.component.ts`
- **Servicio de Expedientes**: `expediente.service.ts`

---

**Nota**: Esta validación es crítica para mantener la integridad del sistema. Siempre debe ejecutarse tanto en el cliente como en el servidor para garantizar la consistencia de los datos.
