# Correcciones necesarias para crear-resolucion-modal.component.ts

## ERROR 1: Property 'onEmpresaSeleccionadaModal' does not exist
Ubicación: Línea 103

## ERROR 2: Property 'crearExpedienteManual' does not exist  
Ubicación: Línea 173

## ERROR 3: empresaSeleccionada es computed pero necesita ser writable signal

---

## SOLUCIÓN:

### PASO 1: Cambiar empresaSeleccionada de computed a writable signal (líneas 696-699)

BUSCAR:
```typescript
  // Detectar si se está abriendo desde detalles de empresa
  empresaSeleccionada = computed(() => {
    return this.data?.empresa || null;
  });
```

REEMPLAZAR CON:
```typescript
  // Detectar si se está abriendo desde detalles de empresa  
  empresaSeleccionada = signal<Empresa | null>(this.data?.empresa || null);
```

### PASO 2: Agregar método onEmpresaSeleccionadaModal (antes de ngOnDestroy, línea ~1733)

AGREGAR ANTES DE `ngOnDestroy()`:
```typescript
  onEmpresaSeleccionadaModal(empresa: Empresa | null): void {
    if (empresa) {
      console.log('🏢 Empresa seleccionada desde modal:', empresa);
      this.empresaSeleccionada.set(empresa);
      this.resolucionForm.patchValue({ empresaId: empresa.id });
      
      // Cargar expedientes de la nueva empresa
      this.cargarExpedientesEmpresa(empresa.id);
    } else {
      this.empresaSeleccionada.set(null);
      this.expedientes.set([]);
      this.expedientesFiltrados.set([]);
    }
  }

  crearExpedienteManual(): void {
    // TODO: Implementar modal de creación de expediente manual
    console.log('TODO: Implementar creación manual de expediente');
   this.snackBar.open('FUNCIONALIDAD EN DESARROLLO', 'CERRAR', {
      duration: 3000
    });
  }

```

---

## DESPUÉS DE HACER ESTOS CAMBIOS:

1. Guardar el archivo
2. Reconstruir el contenedor Docker:
   ```
   docker-compose -f docker-compose.local.yml down
   docker-compose -f docker-compose.local.yml build --no-cache frontend
   docker-compose -f docker-compose.local.yml up -d
   ```
