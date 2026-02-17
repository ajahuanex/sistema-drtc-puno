# Fix: Búsqueda de Itinerario y Crear Localidad

## 🐛 Problemas Identificados

1. **Autocomplete no funciona** - Al escribir en "Buscar Localidad" del itinerario, no aparecen resultados
2. **No hay opción para crear localidad** - Si la localidad no existe, no se puede crear desde el formulario de rutas
3. **Falta sincronización** - Los datos de localidades deberían estar sincronizados entre módulos

## ✅ Soluciones Implementadas

### 1. Autocomplete Corregido

**Problema:** El autocomplete usaba `of(this.busquedaLocalidad)` que no escuchaba cambios del input.

**Solución:** Usar `FormControl` reactivo con `valueChanges`:

```typescript
// ANTES (❌ No funcionaba)
this.localidadesItinerarioFiltradas = of(this.busquedaLocalidad).pipe(...)

// DESPUÉS (✅ Funciona)
busquedaLocalidadControl = new FormControl('');

this.localidadesItinerarioFiltradas = this.busquedaLocalidadControl.valueChanges.pipe(
  startWith(''),
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(value => {
    if (value && value.length >= 2) {
      return this.localidadService.buscarLocalidades(value, 10);
    }
    return of([]);
  })
);
```

### 2. Opción para Crear Localidad

Se agregó una opción en el autocomplete que aparece cuando:
- Has escrito al menos 2 caracteres
- No hay resultados de búsqueda

```html
@if (busquedaLocalidadControl.value && 
     busquedaLocalidadControl.value.length >= 2 && 
     (localidadesItinerarioFiltradas | async)?.length === 0) {
  <mat-option (click)="crearNuevaLocalidad()">
    <div class="crear-localidad-option">
      <mat-icon>add_circle</mat-icon>
      <span>Crear "{{ busquedaLocalidadControl.value }}" como nueva localidad</span>
    </div>
  </mat-option>
}
```

### 3. Método para Crear Localidad

```typescript
crearNuevaLocalidad() {
  const nombreLocalidad = this.busquedaLocalidadControl.value?.trim();
  
  const nuevaLocalidad = {
    nombre: nombreLocalidad.toUpperCase(),
    tipo: 'CIUDAD',
    departamento: 'PUNO',
    provincia: 'Por definir',
    distrito: 'Por definir',
    estaActiva: true
  };

  this.localidadService.createLocalidad(nuevaLocalidad).subscribe({
    next: (localidadCreada) => {
      // Agregar automáticamente al itinerario
      this.itinerario.push({
        id: localidadCreada.id,
        nombre: localidadCreada.nombre,
        orden: this.itinerario.length + 1
      });
      
      this.snackBar.open(`Localidad "${localidadCreada.nombre}" creada`, 'Cerrar');
    }
  });
}
```

## 📝 Cambios Realizados

### Archivo: `frontend/src/app/shared/ruta-form.component.ts`

1. **Imports agregados:**
   - `FormControl` de `@angular/forms`
   - `Subject` de `rxjs`

2. **Nuevas propiedades:**
   - `busquedaLocalidadControl = new FormControl('')`
   - `busquedaSubject = new Subject<string>()`

3. **Métodos actualizados:**
   - `agregarLocalidadItinerario()` - Usa FormControl reactivo
   - `cancelarAgregarLocalidad()` - Limpia el FormControl
   - `crearNuevaLocalidad()` - Nuevo método para crear localidades

4. **Template actualizado:**
   - Input usa `[formControl]` en lugar de `[(ngModel)]`
   - Opción "Crear localidad" en el autocomplete
   - Estilos para `.crear-localidad-option`

## 🎯 Flujo de Uso

### Escenario 1: Localidad Existe

1. Click en "Agregar Localidad"
2. Escribe "PUNO" (mínimo 2 caracteres)
3. Aparecen resultados: "PUNO - Puno, Puno"
4. Selecciona de la lista
5. ✅ Se agrega al itinerario

### Escenario 2: Localidad No Existe

1. Click en "Agregar Localidad"
2. Escribe "PUTINA2" (mínimo 2 caracteres)
3. No hay resultados
4. Aparece opción: "Crear 'PUTINA2' como nueva localidad"
5. Click en la opción
6. ✅ Se crea la localidad en la BD
7. ✅ Se agrega automáticamente al itinerario
8. ✅ Mensaje de confirmación

## 🔄 Sincronización con Módulo de Localidades

La localidad creada desde el módulo de rutas:
- ✅ Se guarda en la base de datos
- ✅ Está disponible inmediatamente en el módulo de Localidades
- ✅ Puede ser editada/completada desde Localidades
- ✅ Se crea con valores por defecto (Departamento: PUNO, Provincia: Por definir)

## 🎨 Mejoras Visuales

- Icono verde `add_circle` para crear localidad
- Texto en azul para destacar la opción
- Muestra el nombre que se va a crear entre comillas
- Feedback visual con snackbar al crear

## ⚠️ Consideraciones

1. **Datos por defecto:** La localidad se crea con:
   - Departamento: PUNO
   - Provincia: Por definir
   - Distrito: Por definir
   - Tipo: CIUDAD

2. **Completar datos:** Se recomienda ir al módulo de Localidades para completar:
   - Provincia correcta
   - Distrito correcto
   - Coordenadas (si es necesario)
   - Tipo correcto (CIUDAD, PUEBLO, DISTRITO, etc.)

3. **Validación:** El nombre se convierte automáticamente a mayúsculas

## 🧪 Pruebas

1. **Buscar localidad existente:**
   - Escribe "PUNO" → Debe aparecer en la lista
   - Selecciona → Se agrega al itinerario

2. **Crear localidad nueva:**
   - Escribe "NUEVA_LOCALIDAD" → No hay resultados
   - Click en "Crear..." → Se crea y agrega
   - Verifica en módulo de Localidades → Debe aparecer

3. **Validación:**
   - Intenta crear sin nombre → Muestra error
   - Intenta agregar localidad duplicada → Muestra advertencia

---

**Fecha:** 9 de febrero de 2026  
**Estado:** ✅ Implementado y listo para pruebas
