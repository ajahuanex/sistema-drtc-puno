# EmpresaSelectorComponent - Guía de Uso

## Descripción
El `EmpresaSelectorComponent` es un componente reutilizable que permite seleccionar empresas mediante un campo de búsqueda con autocompletado. Está diseñado para ser usado en formularios de diferentes módulos del sistema.

## Características
- **Búsqueda por RUC**: Permite buscar empresas por su número de RUC
- **Búsqueda por Razón Social**: Permite buscar por razón social principal o mínima
- **Autocompletado**: Muestra sugerencias mientras se escribe
- **Campo opcional**: Puede configurarse como requerido o opcional
- **Validación**: Incluye validación de formularios
- **Responsive**: Se adapta al ancho del contenedor padre

## Uso Básico

### 1. Importar el componente
```typescript
import { EmpresaSelectorComponent } from '../../shared/empresa-selector.component';

@Component({
  // ... otras configuraciones
  imports: [
    // ... otros imports
    EmpresaSelectorComponent
  ]
})
```

### 2. Usar en el template
```html
<app-empresa-selector
  label="Empresa"
  placeholder="Buscar empresa por RUC o razón social"
  hint="Selecciona una empresa del sistema"
  (empresaIdChange)="onEmpresaIdChange($event)"
  (empresaSeleccionada)="onEmpresaSeleccionada($event)">
</app-empresa-selector>
```

## Propiedades de Entrada (Inputs)

| Propiedad | Tipo | Por Defecto | Descripción |
|-----------|------|-------------|-------------|
| `label` | string | 'Empresa' | Etiqueta del campo |
| `placeholder` | string | 'Buscar empresa por RUC o razón social' | Texto de placeholder |
| `hint` | string | 'Selecciona una empresa' | Texto de ayuda |
| `required` | boolean | false | Si el campo es obligatorio |
| `empresaId` | string | '' | ID de la empresa pre-seleccionada |
| `disabled` | boolean | false | Si el campo está deshabilitado |

## Eventos de Salida (Outputs)

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `empresaIdChange` | string | Emite el ID de la empresa seleccionada |
| `empresaSeleccionada` | Empresa \| null | Emite el objeto empresa completo o null |

## Ejemplos de Uso

### Ejemplo 1: Campo opcional en formulario
```html
<app-empresa-selector
  label="Empresa Asociada (Opcional)"
  placeholder="Selecciona una empresa si aplica"
  hint="Esta empresa se vinculará al registro"
  (empresaIdChange)="form.get('empresaId').setValue($event)">
</app-empresa-selector>
```

### Ejemplo 2: Campo requerido
```html
<app-empresa-selector
  label="Empresa *"
  placeholder="Debes seleccionar una empresa"
  hint="La empresa es obligatoria para continuar"
  [required]="true"
  (empresaIdChange)="onEmpresaRequired($event)">
</app-empresa-selector>
```

### Ejemplo 3: Con valor pre-seleccionado
```html
<app-empresa-selector
  label="Empresa Actual"
  [empresaId]="empresaActualId"
  [disabled]="true"
  hint="Empresa actualmente seleccionada">
</app-empresa-selector>
```

## Manejo de Eventos en el Componente Padre

```typescript
export class MiComponente {
  
  onEmpresaIdChange(empresaId: string): void {
    // Actualizar el formulario
    this.miFormulario.get('empresaId')?.setValue(empresaId);
    
    // O realizar otras acciones
    if (empresaId) {
      this.cargarDatosEmpresa(empresaId);
    }
  }
  
  onEmpresaSeleccionada(empresa: Empresa | null): void {
    if (empresa) {
      console.log('Empresa seleccionada:', empresa.razonSocial.principal);
      // Mostrar información adicional de la empresa
      this.mostrarDetallesEmpresa(empresa);
    } else {
      // Empresa deseleccionada
      this.limpiarDatosEmpresa();
    }
  }
}
```

## Integración con Formularios Reactivos

```typescript
export class MiFormularioComponent {
  miFormulario = this.fb.group({
    // ... otros campos
    empresaId: ['', Validators.required]
  });
  
  onEmpresaIdChange(empresaId: string): void {
    this.miFormulario.get('empresaId')?.setValue(empresaId);
  }
}
```

## Estilos Personalizados

El componente incluye estilos CSS que se pueden personalizar:

```scss
// Personalizar el campo
app-empresa-selector {
  .form-field {
    // Estilos personalizados
  }
}

// Personalizar las opciones del autocompletado
.empresa-option {
  strong {
    color: #your-color;
  }
  
  span {
    color: #your-secondary-color;
  }
}
```

## Consideraciones de Rendimiento

- El componente carga las empresas una sola vez al inicializarse
- El filtrado se realiza localmente para mejor rendimiento
- Usa `ChangeDetectionStrategy.OnPush` para optimizar la detección de cambios
- Los eventos se emiten solo cuando es necesario

## Dependencias

El componente requiere:
- `EmpresaService` para obtener la lista de empresas
- `Empresa` model para el tipado
- Angular Material para los componentes de UI
- ReactiveFormsModule para la funcionalidad de formularios

## Solución de Problemas

### Error: "No se encontraron empresas"
- Verificar que el `EmpresaService` esté funcionando correctamente
- Verificar la conexión a la API
- Revisar los logs del navegador

### Error: "Property 'filteredEmpresas' has no initializer"
- Asegurarse de que `filteredEmpresas` esté inicializado en el constructor
- Verificar que se esté usando la versión más reciente del componente

### El autocompletado no funciona
- Verificar que `MatAutocompleteModule` esté importado
- Verificar que el componente esté correctamente declarado en los imports
