# VehiculosDashboardComponent

Componente de dashboard de estadísticas para el módulo de vehículos.

## Descripción

Este componente muestra estadísticas visuales de la flota de vehículos en tiempo real, incluyendo:
- Total de vehículos
- Vehículos activos
- Vehículos suspendidos
- Vehículos inactivos
- Vehículos en revisión
- Número de empresas operando

## Características

### 📊 Estadísticas en Tiempo Real
- Cálculo automático usando computed signals
- Actualización reactiva cuando cambian los datos
- Porcentajes calculados dinámicamente

### 🎨 Diseño Visual
- Cards con gradientes de color por tipo
- Iconos inteligentes con fallbacks
- Animaciones suaves de transición
- Hover effects para mejor UX

### 🖱️ Interactividad
- Click en estadística para filtrar tabla
- Tooltips informativos
- Soporte para teclado (tabindex)
- Accesibilidad ARIA

### 📱 Responsive
- Grid adaptativo
- Optimizado para móviles y tablets
- Soporte para prefers-reduced-motion

## Uso

### Básico

```typescript
import { VehiculosDashboardComponent } from './vehiculos-dashboard.component';

@Component({
  imports: [VehiculosDashboardComponent],
  template: `
    <app-vehiculos-dashboard
      [vehiculos]="vehiculos()"
      [totalEmpresas]="empresas().length"
      (estadisticaClick)="filtrarPorEstadistica($event)">
    </app-vehiculos-dashboard>
  `
})
export class MiComponente {
  vehiculos = signal<Vehiculo[]>([]);
  empresas = signal<Empresa[]>([]);

  filtrarPorEstadistica(stat: VehiculoEstadistica) {
    console.log('Filtrar por:', stat.label);
    // Implementar lógica de filtrado
  }
}
```

### Con Filtrado Automático

```typescript
filtrarPorEstadistica(stat: VehiculoEstadistica) {
  switch (stat.label) {
    case 'VEHÍCULOS ACTIVOS':
      this.estadoControl.setValue('ACTIVO');
      break;
    case 'SUSPENDIDOS':
      this.estadoControl.setValue('SUSPENDIDO');
      break;
    case 'INACTIVOS':
      this.estadoControl.setValue('INACTIVO');
      break;
    case 'EN REVISIÓN':
      this.estadoControl.setValue('EN_REVISION');
      break;
    case 'TOTAL VEHÍCULOS':
      this.limpiarFiltros();
      break;
  }
  this.aplicarFiltros();
}
```

## Inputs

### vehiculos (required)
- **Tipo:** `InputSignal<Vehiculo[]>`
- **Descripción:** Array de vehículos para calcular estadísticas
- **Ejemplo:** `[vehiculos]="vehiculos()"`

### totalEmpresas
- **Tipo:** `InputSignal<number>`
- **Descripción:** Número total de empresas operando
- **Default:** `0`
- **Ejemplo:** `[totalEmpresas]="empresas().length"`

## Outputs

### estadisticaClick
- **Tipo:** `OutputEmitterRef<VehiculoEstadistica>`
- **Descripción:** Emite cuando se hace click en una estadística
- **Payload:** Objeto `VehiculoEstadistica` con información de la estadística clickeada
- **Ejemplo:** `(estadisticaClick)="filtrarPorEstadistica($event)"`

## Interfaces

### VehiculoEstadistica

```typescript
interface VehiculoEstadistica {
  label: string;              // Etiqueta de la estadística
  value: number;              // Valor numérico
  icon: string;               // Nombre del icono
  color: 'total' | 'activos' | 'suspendidos' | 'empresas' | 'inactivos' | 'revision';
  percentage?: number;        // Porcentaje del total (opcional)
  trend?: {                   // Tendencia (opcional)
    direction: 'up' | 'down' | 'neutral';
    value: string;
    icon: string;
  };
}
```

## Estilos

### Colores por Tipo

- **Total:** Azul (#2196F3) - Información general
- **Activos:** Verde (#4CAF50) - Estado positivo
- **Suspendidos:** Naranja (#FF9800) - Advertencia
- **Inactivos:** Rojo (#F44336) - Estado negativo
- **En Revisión:** Púrpura (#9C27B0) - Estado pendiente
- **Empresas:** Gris (#607D8B) - Información contextual

### Animaciones

- **countUp:** Animación de entrada para valores
- **hover:** Elevación de card al pasar el mouse
- **transition:** Transiciones suaves de 0.3s

### Responsive Breakpoints

- **Desktop:** Grid de 4 columnas (auto-fit, min 250px)
- **Tablet:** Grid adaptativo
- **Mobile (<768px):** 1 columna, iconos más pequeños

## Accesibilidad

### ARIA
- `role="button"` en cards clickeables
- `tabindex="0"` para navegación por teclado
- `aria-label` con descripción completa de estadística

### Keyboard Navigation
- Enter/Space para activar estadística
- Tab para navegar entre cards

### Screen Readers
- Etiquetas descriptivas
- Valores anunciados correctamente
- Tendencias incluidas en descripción

## Performance

### Optimizaciones
- `ChangeDetectionStrategy.OnPush` para mejor performance
- Computed signals para cálculos reactivos
- TrackBy en loops para evitar re-renders innecesarios

### Cálculos
- Estadísticas calculadas solo cuando cambian los inputs
- Sin subscripciones manuales
- Garbage collection automático

## Testing

### Unit Tests

```typescript
describe('VehiculosDashboardComponent', () => {
  it('should calculate statistics correctly', () => {
    const component = new VehiculosDashboardComponent();
    component.vehiculos = signal([
      { estado: 'ACTIVO' } as Vehiculo,
      { estado: 'SUSPENDIDO' } as Vehiculo
    ]);
    
    const stats = component.estadisticas();
    expect(stats[1].value).toBe(1); // Activos
    expect(stats[2].value).toBe(1); // Suspendidos
  });

  it('should emit event on click', () => {
    const component = new VehiculosDashboardComponent();
    let emitted: VehiculoEstadistica | undefined;
    
    component.estadisticaClick.subscribe(stat => emitted = stat);
    component.onEstadisticaClick({ label: 'TEST' } as VehiculoEstadistica);
    
    expect(emitted).toBeDefined();
    expect(emitted?.label).toBe('TEST');
  });
});
```

### Integration Tests

```typescript
it('should filter table when clicking statistic', () => {
  const fixture = TestBed.createComponent(VehiculosComponent);
  const dashboard = fixture.debugElement.query(By.directive(VehiculosDashboardComponent));
  
  dashboard.componentInstance.estadisticaClick.emit({
    label: 'VEHÍCULOS ACTIVOS',
    value: 10,
    icon: 'check_circle',
    color: 'activos'
  });
  
  fixture.detectChanges();
  
  expect(fixture.componentInstance.estadoControl.value).toBe('ACTIVO');
});
```

## Ejemplos Avanzados

### Con Animaciones Personalizadas

```typescript
@Component({
  template: `
    <app-vehiculos-dashboard
      [vehiculos]="vehiculos()"
      [totalEmpresas]="empresas().length"
      (estadisticaClick)="filtrarConAnimacion($event)"
      [@fadeIn]="'visible'">
    </app-vehiculos-dashboard>
  `,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 }))
      ])
    ])
  ]
})
```

### Con Loading State

```typescript
@if (cargando()) {
  <mat-spinner></mat-spinner>
} @else {
  <app-vehiculos-dashboard
    [vehiculos]="vehiculos()"
    [totalEmpresas]="empresas().length"
    (estadisticaClick)="filtrarPorEstadistica($event)">
  </app-vehiculos-dashboard>
}
```

### Con Actualización Periódica

```typescript
ngOnInit() {
  // Actualizar estadísticas cada 30 segundos
  interval(30000).pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(() => {
    this.cargarVehiculos();
  });
}
```

## Troubleshooting

### Las estadísticas no se actualizan
- Verificar que `vehiculos` es un signal
- Asegurarse de usar `vehiculos()` en el template
- Revisar que los datos tienen la propiedad `estado`

### Los clicks no funcionan
- Verificar que el output está conectado: `(estadisticaClick)="..."`
- Revisar que el método receptor existe en el componente padre
- Comprobar que no hay errores en consola

### Los estilos no se aplican
- Verificar que el componente es standalone
- Asegurarse de importar MatCardModule y MatTooltipModule
- Revisar que no hay conflictos de CSS

## Changelog

### v1.0.0 (2024-11-10)
- ✨ Versión inicial del componente
- 📊 Estadísticas calculadas con computed signals
- 🎨 Diseño visual con gradientes y animaciones
- 🖱️ Interactividad con clicks y tooltips
- 📱 Diseño responsive
- ♿ Soporte de accesibilidad ARIA

## Roadmap

### Próximas Mejoras
- [ ] Gráficos interactivos con Chart.js
- [ ] Exportar estadísticas a PDF/Excel
- [ ] Comparación con período anterior
- [ ] Alertas configurables
- [ ] Temas personalizables
- [ ] Modo oscuro

## Contribuir

Para contribuir al componente:
1. Mantener compatibilidad con signals
2. Seguir guías de estilo de Angular
3. Agregar tests para nuevas funcionalidades
4. Actualizar documentación
5. Respetar principios de accesibilidad

## Licencia

Este componente es parte del sistema DRTC Puno.
