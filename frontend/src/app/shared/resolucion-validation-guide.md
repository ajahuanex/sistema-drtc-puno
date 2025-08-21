# Validación de Unicidad de Resoluciones - Guía Completa

## 🎯 **Objetivo**
Garantizar que **las resoluciones sean únicas por año** en todo el sistema, evitando duplicados y conflictos en la numeración.

## 🔍 **Regla de Negocio**
- **Formato**: R-XXXX-YYYY (Ej: R-0001-2025, R-0002-2025)
- **Unicidad**: No puede haber dos resoluciones con el mismo número en el mismo año
- **Alcance**: Aplica a todas las empresas del sistema
- **Validación**: Se realiza en tiempo real durante la creación/edición

## 🏗️ **Arquitectura de la Solución**

### 1. **Servicio de Validación** (`ResolucionValidationService`)
```typescript
// Valida la unicidad de una resolución
validarUnicidadResolucion(validacion: ValidacionResolucion): Observable<ResultadoValidacion>

// Obtiene sugerencias de números disponibles
obtenerSugerenciasNumeros(año: number, cantidad: number): Observable<string[]>

// Valida la secuencia para una empresa específica
validarSecuenciaEmpresa(empresaId: string, año: number): Observable<ResultadoValidacion>
```

### 2. **Componente Validador** (`ResolucionNumberValidatorComponent`)
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
const resolucionesConflictivas = resoluciones.filter(resolucion => {
  const match = resolucion.nroResolucion.match(/^R-(\d+)-(\d+)$/);
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
- Mensaje: "El sistema generará R-0001-2025"

#### **Validando**
- Icono: `hourglass_empty` (animado)
- Mensaje: "Validando..."
- Estado: Loading

#### **Válido**
- Icono: `check_circle`
- Color: Verde (#4caf50)
- Mensaje: "El número de resolución 0001 está disponible para el año 2025"

#### **Inválido**
- Icono: `error`
- Color: Rojo (#f44336)
- Mensaje: "Ya existe una resolución con el número 0001 en el año 2025"

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
• Resolución R-0001-2025 ya existe
• Empresa ID: 1
• Estado: VIGENTE
• Fecha de emisión: 15/01/2025
```

## 🔧 **Implementación en Formularios**

### **1. Importar Componentes**
```typescript
import { ResolucionNumberValidatorComponent } from '../../shared/resolucion-number-validator.component';
import { ResolucionValidationService } from '../../services/resolucion-validation.service';
```

### **2. Agregar al Template**
```html
<app-resolucion-number-validator
  label="Número de Resolución *"
  placeholder="Ej: 0001"
  hint="El sistema generará R-0001-2025"
  [required]="true"
  [empresaId]="form.get('empresaId')?.value"
  (numeroValido)="onNumeroValido($event)"
  (numeroInvalido)="onNumeroInvalido($event)"
  (validacionCompleta)="onValidacionCompleta($event)">
</app-resolucion-number-validator>
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

### **Caso 1: Creación de Primera Resolución del Año**
```
Usuario ingresa: "0001"
Validación: ✅ Válido
Resultado: R-0001-2025 disponible
Sugerencias: [2, 3, 4, 5, 6]
```

### **Caso 2: Resolución Duplicada**
```
Usuario ingresa: "0001"
Validación: ❌ Inválido
Conflicto: R-0001-2025 ya existe
Sugerencias: [2, 3, 4, 5, 6]
```

### **Caso 3: Edición de Resolución Existente**
```
Usuario edita: R-0001-2025
Validación: ✅ Válido (excluye la resolución actual)
Resultado: No hay conflictos
```

### **Caso 4: Secuencia de Empresa**
```
Empresa tiene: R-0001-2025, R-0002-2025
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
- **Contextual**: Considera resoluciones existentes
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
describe('ResolucionValidationService', () => {
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
const mockResoluciones = [
  { id: '1', nroResolucion: 'R-0001-2025', empresaId: '1' },
  { id: '2', nroResolucion: 'R-0002-2025', empresaId: '1' }
];
```

## 🔮 **Futuras Mejoras**

### **1. Validación Predictiva**
- Sugerir números basados en patrones históricos
- Predecir conflictos antes de que ocurran

### **2. Integración con Calendario**
- Validar fechas de vigencia
- Sugerir fechas óptimas de emisión

### **3. Análisis de Tendencias**
- Reportes de numeración por año
- Estadísticas de conflictos
- Recomendaciones de optimización

## 📚 **Referencias**

- **Modelo de Resolución**: `resolucion.model.ts`
- **Servicio de Validación**: `resolucion-validation.service.ts`
- **Componente Validador**: `resolucion-number-validator.component.ts`
- **Servicio de Resoluciones**: `resolucion.service.ts`

---

**Nota**: Esta validación es crítica para mantener la integridad del sistema. Siempre debe ejecutarse tanto en el cliente como en el servidor para garantizar la consistencia de los datos.
