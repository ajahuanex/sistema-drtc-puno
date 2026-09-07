# 🎯 ORDEN PRINCIPAL - ANGULAR 20+

## PRIORIDAD ABSOLUTA EN TODOS LOS COMPONENTES

### ✅ OBLIGATORIO - Angular 20+

1. **Standalone Components**
   - ✅ `standalone: true` en todos los componentes
   - ✅ Imports en el decorador
   - ❌ NO módulos

2. **Reactive Forms (Typed)**
   - ✅ `FormBuilder`, `FormGroup`, `FormArray`
   - ✅ `ReactiveFormsModule` en imports
   - ✅ Typed Forms (FormControl<T>)
   - ❌ NO `ngModel`
   - ❌ NO `FormsModule`
   - ❌ NO two-way binding `[(ngModel)]`

3. **Control Flow Moderno**
   - ✅ `@if (condition) { ... } @else { ... }`
   - ✅ `@for (item of items; track item.id) { ... }`
   - ✅ `@switch (value) { @case (x) { ... } }`
   - ❌ NO `*ngIf`
   - ❌ NO `*ngFor`
   - ❌ NO `*ngSwitch`

4. **Signals (OBLIGATORIO en Angular 20+)**
   - ✅ `signal()`, `computed()`, `effect()`
   - ✅ Para estado reactivo
   - ✅ `input()` para props
   - ✅ `output()` para eventos
   - ❌ NO BehaviorSubject
   - ❌ NO @Input/@Output decorators

5. **Imports Correctos**
   - ✅ `CommonModule` (solo si necesitas pipes)
   - ✅ `ReactiveFormsModule` (para formularios)
   - ✅ Material modules específicos
   - ❌ NO `FormsModule`

---

## ❌ PROHIBIDO - Código Antiguo

| Antiguo | Moderno | Razón |
|---------|---------|-------|
| `[(ngModel)]` | `formControl` | Reactive Forms |
| `*ngIf` | `@if` | Control Flow |
| `*ngFor` | `@for` | Control Flow |
| `*ngSwitch` | `@switch` | Control Flow |
| `FormsModule` | `ReactiveFormsModule` | Mejor rendimiento |
| `BehaviorSubject` | `signal()` | Más simple |
| `async` pipe | `signal()` | Más directo |

---

## 📋 CHECKLIST PARA CADA COMPONENTE

- [ ] `standalone: true`
- [ ] Imports en decorador
- [ ] `ReactiveFormsModule` si hay formularios
- [ ] `@if` en lugar de `*ngIf`
- [ ] `@for` en lugar de `*ngFor`
- [ ] `formControl` en lugar de `ngModel`
- [ ] NO `FormsModule`
- [ ] NO two-way binding

---

## 🔍 BÚSQUEDA Y REEMPLAZO

### Buscar código antiguo:
```bash
grep -r "ngModel" frontend/src/app/components/
grep -r "\*ngIf" frontend/src/app/components/
grep -r "\*ngFor" frontend/src/app/components/
grep -r "FormsModule" frontend/src/app/components/
```

### Reemplazar:
- `[(ngModel)]="var"` → `formControl="control"`
- `*ngIf="condition"` → `@if (condition) {`
- `*ngFor="let item of items"` → `@for (item of items; track item.id) {`

---

## 📝 EJEMPLO CORRECTO - Angular 21+

```typescript
import { Component, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Material modules
  ],
  template: `
    <form [formGroup]="form">
      <input formControlName="name">
    </form>

    @if (isLoading()) {
      <p>Cargando...</p>
    } @else {
      @for (item of items(); track item.id) {
        <div (click)="selectItem(item)">{{ item.name }}</div>
      }
    }
  `
})
export class ExampleComponent {
  // Signals para estado
  isLoading = signal(false);
  items = signal<Item[]>([]);
  selectedItem = signal<Item | null>(null);

  // Computed para valores derivados
  itemCount = computed(() => this.items().length);

  // Input/Output para comunicación
  title = input<string>('Título');
  onSelect = output<Item>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required]
    });
  }

  selectItem(item: Item): void {
    this.selectedItem.set(item);
    this.onSelect.emit(item);
  }
}

interface Item {
  id: string;
  name: string;
}
```

---

## 🚀 APLICAR A PARTIR DE AHORA

**Todos los componentes nuevos DEBEN seguir esta orden.**

**Componentes existentes se actualizarán progresivamente a Angular 20+.**

---

**Fecha**: 22/04/2026
**Versión**: 2.0 (Angular 20+)
**Estado**: ACTIVA
**Prioridad**: MÁXIMA
**Proyecto**: SIRRET Frontend (Angular 20.1.6)
