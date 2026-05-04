# RECOMENDACIONES DE REFACTORIZACIÓN - MÓDULO DE EMPRESAS

## 🎯 Objetivos de Refactorización

1. **Reducir tamaño de componentes** (>1000 líneas)
2. **Eliminar duplicación de código**
3. **Mejorar mantenibilidad**
4. **Optimizar rendimiento**
5. **Facilitar testing**

---

## 📋 FASE 1: CONSOLIDACIÓN DE COMPONENTES

### Problema Actual
- `empresas.component.ts` (1341 líneas) - Muy grande
- `empresas-consolidado.component.ts` - Duplicado
- `dashboard-empresas.component.ts` - Separado

### Solución Propuesta

#### Opción A: Consolidar en un único componente (Recomendado)
```
empresas/
├── empresas.component.ts (componente principal)
├── empresas-tabla.component.ts (tabla con paginación)
├── empresas-filtros.component.ts (filtros avanzados)
├── empresas-acciones.component.ts (acciones en bloque)
├── empresas-dashboard.component.ts (dashboard)
└── empresas.service.ts (lógica de negocio)
```

#### Opción B: Mantener separados pero sin duplicación
```
empresas/
├── empresas.component.ts (listado principal)
├── empresas-consolidado.component.ts (vista consolidada)
├── dashboard-empresas.component.ts (dashboard)
└── shared/
    ├── empresa-tabla.component.ts
    └── empresa-filtros.component.ts
```

**Recomendación**: Opción A (Consolidar)

---

## 📊 FASE 2: DIVISIÓN DE COMPONENTES GRANDES

### empresas.component.ts (1341 líneas)

#### Componentes a Extraer

**1. empresas-tabla.component.ts** (~400 líneas)
```typescript
// Responsabilidades:
- Mostrar tabla de empresas
- Paginación
- Ordenamiento
- Selección múltiple
- Exportación

// Inputs:
@Input() empresas: Empresa[];
@Input() isLoading: boolean;
@Input() displayedColumns: string[];

// Outputs:
@Output() empresaSeleccionada = new EventEmitter<Empresa>();
@Output() empresasSeleccionadas = new EventEmitter<Empresa[]>();
@Output() exportar = new EventEmitter<void>();
```

**2. empresas-filtros.component.ts** (~300 líneas)
```typescript
// Responsabilidades:
- Búsqueda por término
- Filtros avanzados
- Filtros por tipo de servicio
- Limpiar filtros

// Inputs:
@Input() tiposServicio: TipoServicio[];

// Outputs:
@Output() filtrosAplicados = new EventEmitter<FiltrosAvanzados>();
@Output() busquedaRealizada = new EventEmitter<string>();
@Output() filtrosLimpiados = new EventEmitter<void>();
```

**3. empresas-acciones.component.ts** (~200 líneas)
```typescript
// Responsabilidades:
- Cambiar estado en bloque
- Cambiar tipo de servicio en bloque
- Crear resolución
- Crear ruta

// Inputs:
@Input() empresasSeleccionadas: Empresa[];

// Outputs:
@Output() accionRealizada = new EventEmitter<string>();
```

**4. empresas-dashboard.component.ts** (Ya existe)
```typescript
// Responsabilidades:
- Mostrar estadísticas
- Gráficos
- Análisis de riesgo
```

#### Componente Principal Refactorizado
```typescript
// empresas.component.ts (~300 líneas)
export class EmpresasComponent {
  // Signals
  empresas = signal<Empresa[]>([]);
  isLoading = signal(false);
  selectedEmpresas = signal<Set<string>>(new Set());
  
  // Inyecciones
  private empresaService = inject(EmpresaService);
  
  // Métodos principales
  ngOnInit() { this.loadEmpresas(); }
  
  onFiltrosAplicados(filtros: FiltrosAvanzados) { ... }
  onBusquedaRealizada(termino: string) { ... }
  onEmpresasSeleccionadas(empresas: Empresa[]) { ... }
  onAccionRealizada(accion: string) { ... }
}
```

---

## 🔧 FASE 3: EXTRACCIÓN DE LÓGICA A SERVICIOS

### Crear: empresa-filtro.service.ts
```typescript
export class EmpresaFiltroService {
  filtrarPorTermino(empresas: Empresa[], termino: string): Empresa[] { ... }
  filtrarPorEstado(empresas: Empresa[], estados: EstadoEmpresa[]): Empresa[] { ... }
  filtrarPorTipoServicio(empresas: Empresa[], tipos: TipoServicio[]): Empresa[] { ... }
  filtrarAvanzado(empresas: Empresa[], filtros: FiltrosAvanzados): Empresa[] { ... }
}
```

### Crear: empresa-exportacion.service.ts
```typescript
export class EmpresaExportacionService {
  exportarExcel(empresas: Empresa[], columnas: string[]): Observable<Blob> { ... }
  exportarCSV(empresas: Empresa[], columnas: string[]): Observable<Blob> { ... }
  exportarPDF(empresas: Empresa[], columnas: string[]): Observable<Blob> { ... }
}
```

### Crear: empresa-acciones-bloque.service.ts
```typescript
export class EmpresaAccionesBloqueService {
  cambiarEstadoEnBloque(empresas: Empresa[], nuevoEstado: EstadoEmpresa): Observable<void> { ... }
  cambiarTipoServicioEnBloque(empresas: Empresa[], nuevoTipo: TipoServicio): Observable<void> { ... }
}
```

---

## 🎨 FASE 4: OPTIMIZACIÓN DE RENDIMIENTO

### 1. Implementar Virtual Scrolling
```typescript
// Antes
<mat-table [dataSource]="dataSource">
  <!-- 1000+ filas renderizadas -->
</mat-table>

// Después
<cdk-virtual-scroll-viewport itemSize="50" class="table-viewport">
  <mat-table [dataSource]="dataSource">
    <!-- Solo filas visibles renderizadas -->
  </mat-table>
</cdk-virtual-scroll-viewport>
```

### 2. Lazy Loading de Componentes
```typescript
// Antes
import { EmpresasDashboardComponent } from './dashboard-empresas.component';

// Después
const routes = [
  {
    path: 'empresas',
    component: EmpresasComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard-empresas.component')
          .then(m => m.DashboardEmpresasComponent)
      }
    ]
  }
];
```

### 3. OnPush Change Detection
```typescript
@Component({
  selector: 'app-empresas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class EmpresasComponent {
  // Usar signals en lugar de propiedades mutables
  empresas = signal<Empresa[]>([]);
}
```

### 4. Memoización de Computed Properties
```typescript
// Antes
empresasFiltradas = computed(() => {
  // Cálculo costoso cada vez que cambia cualquier signal
  return this.filtrarEmpresas();
});

// Después
empresasFiltradas = computed(() => {
  // Usar memoización para evitar recálculos innecesarios
  return this.memoizedFilter(
    this.empresas(),
    this.filtros()
  );
});
```

---

## 🧪 FASE 5: TESTING

### Tests Unitarios
```typescript
// empresa-filtro.service.spec.ts
describe('EmpresaFiltroService', () => {
  it('debe filtrar empresas por término', () => { ... });
  it('debe filtrar empresas por estado', () => { ... });
  it('debe aplicar múltiples filtros', () => { ... });
});

// empresas-tabla.component.spec.ts
describe('EmpresasTablaComponent', () => {
  it('debe mostrar tabla de empresas', () => { ... });
  it('debe emitir evento al seleccionar empresa', () => { ... });
  it('debe paginar correctamente', () => { ... });
});
```

### Tests de Integración
```typescript
// empresas.component.integration.spec.ts
describe('EmpresasComponent Integration', () => {
  it('debe cargar empresas y mostrar en tabla', () => { ... });
  it('debe filtrar empresas al buscar', () => { ... });
  it('debe exportar empresas seleccionadas', () => { ... });
});
```

---

## 📈 BENEFICIOS ESPERADOS

### Antes de Refactorización
- ❌ Componentes muy grandes (>1000 líneas)
- ❌ Código duplicado
- ❌ Difícil de mantener
- ❌ Difícil de testear
- ❌ Rendimiento subóptimo

### Después de Refactorización
- ✅ Componentes pequeños y enfocados (<300 líneas)
- ✅ Código reutilizable
- ✅ Fácil de mantener
- ✅ Fácil de testear
- ✅ Mejor rendimiento
- ✅ Mejor escalabilidad

---

## 📊 Estimación de Esfuerzo

| Fase | Tarea | Horas | Prioridad |
|------|-------|-------|-----------|
| 1 | Consolidar componentes | 4 | Alta |
| 2 | Dividir empresas.component | 6 | Alta |
| 3 | Extraer servicios | 4 | Media |
| 4 | Optimizar rendimiento | 3 | Media |
| 5 | Agregar tests | 5 | Media |
| **Total** | | **22** | |

---

## 🚀 Plan de Implementación

### Sprint 1 (Semana 1)
- [ ] Consolidar empresas-consolidado.component
- [ ] Dividir empresas.component en 3 componentes
- [ ] Crear empresa-filtro.service

### Sprint 2 (Semana 2)
- [ ] Crear empresa-exportacion.service
- [ ] Implementar virtual scrolling
- [ ] Agregar tests unitarios

### Sprint 3 (Semana 3)
- [ ] Implementar lazy loading
- [ ] Optimizar change detection
- [ ] Agregar tests de integración

---

## ✅ Checklist de Refactorización

- [ ] Componentes divididos
- [ ] Servicios extraídos
- [ ] Lógica duplicada eliminada
- [ ] Virtual scrolling implementado
- [ ] Lazy loading implementado
- [ ] OnPush change detection
- [ ] Tests unitarios agregados
- [ ] Tests de integración agregados
- [ ] Documentación actualizada
- [ ] Code review completado
- [ ] Testing en producción completado

---

**Nota**: Esta es una propuesta de refactorización. Se recomienda discutir con el equipo antes de implementar.
