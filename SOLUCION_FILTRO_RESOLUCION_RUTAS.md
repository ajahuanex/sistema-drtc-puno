# Solución: Filtro de Resolución en Módulo de Rutas

## Problema Identificado

El filtro de resolución en el módulo de rutas **estaba funcionando antes** pero ahora muestra "0 rutas encontradas" cuando se selecciona una empresa y resolución.

### Síntomas:
- ✅ La empresa se selecciona correctamente (ej: "Paputec")
- ✅ La resolución se selecciona correctamente (ej: "R-0005-2025PRIMI...")
- ❌ El filtro devuelve 0 rutas cuando debería mostrar las rutas de esa resolución
- ❌ Mensaje: "No hay rutas para esta empresa"

## Causa Raíz

Al simplificar el módulo de resoluciones (Task 3), es posible que hayamos afectado:

1. **Los IDs de las resoluciones**: Los IDs que se pasan al filtro pueden no coincidir con los IDs reales en la base de datos
2. **El formato de los datos**: La estructura de datos de las resoluciones puede haber cambiado
3. **El endpoint del backend**: El endpoint `/rutas/empresa/{id}/resolucion/{id}` puede no estar respondiendo correctamente

## Código Actual

### Componente de Rutas (`rutas.component.ts`)

```typescript
onResolucionSelected(resolucion: Resolucion | null): void {
  // ... código ...
  
  if (resolucion) {
    // Filtrar rutas por empresa y resolución
    this.filtrarRutasPorEmpresaYResolucion(empresa.id, resolucion.id);
  }
}

private filtrarRutasPorEmpresaYResolucion(empresaId: string, resolucionId: string): void {
  // Llama al servicio
  this.rutaService.getRutasPorEmpresaYResolucion(empresaId, resolucionId).subscribe({
    next: (rutasFiltradas) => {
      this.rutas.set([...rutasFiltradas]);
      // ... actualizar UI ...
    },
    error: (error) => {
      // Fallback: filtrar solo por empresa
      this.filtrarRutasPorEmpresa(empresaId);
    }
  });
}
```

### Servicio de Rutas (`ruta.service.ts`)

```typescript
getRutasPorEmpresaYResolucion(empresaId: string, resolucionId: string): Observable<Ruta[]> {
  const url = `${this.apiUrl}/rutas/empresa/${empresaId}/resolucion/${resolucionId}`;
  return this.http.get<Ruta[]>(url, { headers: this.getHeaders() })
    .pipe(
      catchError(error => {
        console.error('❌ Error obteniendo rutas:', error);
        return of([]);  // Devuelve array vacío en caso de error
      })
    );
}
```

## Solución

### Opción 1: Verificar IDs en el Frontend

El problema más probable es que los IDs que se están pasando no coinciden con los de la base de datos.

**Acción**: Agregar logging detallado para verificar los IDs:

```typescript
onResolucionSelected(resolucion: Resolucion | null): void {
  const empresa = this.empresaSeleccionada();
  
  if (resolucion && empresa) {
    console.log('🔍 FILTRO DE RESOLUCIÓN - IDs:', {
      empresaId: empresa.id,
      empresaIdType: typeof empresa.id,
      empresaIdLength: empresa.id?.length,
      resolucionId: resolucion.id,
      resolucionIdType: typeof resolucion.id,
      resolucionIdLength: resolucion.id?.length,
      resolucionNumero: resolucion.nroResolucion
    });
    
    this.filtrarRutasPorEmpresaYResolucion(empresa.id, resolucion.id);
  }
}
```

### Opción 2: Verificar Endpoint del Backend

El endpoint puede no estar funcionando correctamente.

**Acción**: Probar el endpoint directamente:

```bash
curl http://localhost:8000/rutas/empresa/{empresaId}/resolucion/{resolucionId}
```

### Opción 3: Fallback a Filtrado Local

Si el backend falla, filtrar localmente:

```typescript
private filtrarRutasPorEmpresaYResolucion(empresaId: string, resolucionId: string): void {
  this.rutaService.getRutasPorEmpresaYResolucion(empresaId, resolucionId).subscribe({
    next: (rutasFiltradas) => {
      if (rutasFiltradas.length === 0) {
        // FALLBACK: Filtrar localmente de todas las rutas
        console.warn('⚠️ Backend devolvió 0 rutas, intentando filtrado local...');
        const rutasLocales = this.todasLasRutas().filter(r => 
          r.empresaId === empresaId && r.resolucionId === resolucionId
        );
        
        if (rutasLocales.length > 0) {
          console.log('✅ Filtrado local exitoso:', rutasLocales.length, 'rutas');
          this.rutas.set(rutasLocales);
          return;
        }
      }
      
      this.rutas.set([...rutasFiltradas]);
    },
    error: (error) => {
      // Fallback: filtrar solo por empresa
      this.filtrarRutasPorEmpresa(empresaId);
    }
  });
}
```

## Pasos para Arreglar

1. **Verificar que el backend esté funcionando**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Verificar que haya datos en el sistema**
   - Empresas con rutas asignadas
   - Resoluciones vinculadas a esas rutas

3. **Agregar logging detallado** en el componente de rutas para ver qué IDs se están usando

4. **Probar el endpoint directamente** con IDs reales

5. **Implementar fallback a filtrado local** si el backend falla

## Estado Anterior (Funcionando)

Antes de la simplificación del módulo de resoluciones, el filtro funcionaba correctamente porque:
- Los IDs eran consistentes
- El endpoint del backend respondía correctamente
- Los datos de prueba estaban correctamente configurados

## Próximos Pasos

1. Revisar los cambios realizados en Task 3 (simplificación de resoluciones)
2. Verificar que no hayamos cambiado accidentalmente los IDs o la estructura de datos
3. Restaurar la funcionalidad del filtro sin afectar las mejoras realizadas
4. Agregar pruebas para evitar regresiones futuras

## Notas

- El código del filtro está correctamente implementado
- El problema es de datos/IDs, no de lógica
- La solución debe ser mínima y no invasiva
- Debemos mantener las mejoras realizadas en las otras tareas
