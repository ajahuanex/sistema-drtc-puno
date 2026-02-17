# ✅ Solución: Itinerario no se guardaba al editar rutas

**Fecha:** 15/02/2026  
**Problema:** Al editar una ruta, el itinerario no se guardaba en el backend

## Problema Identificado

El método `actualizarRuta()` en `ruta-form.component.ts` no estaba incluyendo el campo `itinerario` en el objeto `RutaUpdate` que se envía al backend.

### Código Anterior (Incorrecto)

```typescript
private async actualizarRuta() {
  const rutaUpdate: RutaUpdate = {
    tipoRuta: formValue.tipoRuta,
    frecuencia: { ... },
    descripcion: formValue.descripcion,
    observaciones: formValue.observaciones
    // ❌ Faltaba: itinerario
  };
  
  await this.rutaService.updateRuta(this.config.ruta!.id, rutaUpdate).toPromise();
}
```

## Solución Implementada

### 1. Actualización en `ruta-form.component.ts`

Se agregó el campo `itinerario` al objeto `RutaUpdate`:

```typescript
private async actualizarRuta() {
  const rutaUpdate: RutaUpdate = {
    tipoRuta: formValue.tipoRuta,
    frecuencia: { ... },
    descripcion: formValue.descripcion,
    observaciones: formValue.observaciones,
    // ✅ AGREGADO: Incluir itinerario
    itinerario: this.itinerario
  };
  
  console.log('📋 [RUTA-FORM] Itinerario a actualizar:', this.itinerario);
  
  await this.rutaService.updateRuta(this.config.ruta!.id, rutaUpdate).toPromise();
}
```

### 2. Actualización en `editar-ruta-modal.component.ts`

También se actualizó el modal de edición simple para mantener el itinerario existente:

```typescript
guardar() {
  const update: RutaUpdate = {
    origen: { ... },
    destino: { ... },
    frecuencia: { ... },
    // ... otros campos
    // ✅ AGREGADO: Mantener itinerario existente
    itinerario: this.data.ruta.itinerario || []
  };
  
  this.rutaService.updateRuta(this.data.ruta.id, update).subscribe({ ... });
}
```

## Archivos Modificados

1. **frontend/src/app/shared/ruta-form.component.ts**
   - Línea ~1258: Agregado `itinerario: this.itinerario` al objeto `RutaUpdate`
   - Línea ~1262: Agregado log para verificar el itinerario

2. **frontend/src/app/components/rutas/editar-ruta-modal.component.ts**
   - Línea ~360: Agregado `itinerario: this.data.ruta.itinerario || []` al objeto `RutaUpdate`

## Cómo Funciona el Itinerario

### Estructura del Itinerario

```typescript
itinerario: Array<{
  id: string;      // ID de la localidad
  nombre: string;  // Nombre de la localidad
  orden: number;   // Orden en el recorrido (1, 2, 3, ...)
}>
```

### Ejemplo de Itinerario

```json
[
  { "id": "loc1", "nombre": "PUNO", "orden": 1 },
  { "id": "loc2", "nombre": "JULIACA", "orden": 2 },
  { "id": "loc3", "nombre": "AZÁNGARO", "orden": 3 }
]
```

### Operaciones Disponibles

1. **Agregar Localidad**: Botón "Agregar Localidad" abre un diálogo de búsqueda
2. **Mover Arriba/Abajo**: Botones de flecha para reordenar
3. **Eliminar**: Botón de eliminar para quitar una localidad del itinerario
4. **Reordenamiento Automático**: Al mover o eliminar, los números de orden se actualizan automáticamente

## Flujo de Actualización

```
1. Usuario edita ruta
   ↓
2. Modifica itinerario (agregar/eliminar/reordenar localidades)
   ↓
3. Hace clic en "Guardar" o "Actualizar"
   ↓
4. Se ejecuta actualizarRuta()
   ↓
5. Se incluye this.itinerario en RutaUpdate
   ↓
6. Se envía al backend vía updateRuta()
   ↓
7. Backend actualiza la ruta con el nuevo itinerario
   ↓
8. Se muestra mensaje de éxito
```

## Verificación

Para verificar que el itinerario se guarda correctamente:

1. Editar una ruta existente
2. Agregar/modificar localidades en el itinerario
3. Guardar los cambios
4. Revisar la consola del navegador:
   ```
   📋 [RUTA-FORM] Itinerario a actualizar: [{...}, {...}]
   📤 [RUTA-FORM] Objeto de actualización: { "itinerario": [...] }
   ✅ [RUTA-FORM] Ruta actualizada exitosamente
   ```
5. Recargar la página y verificar que el itinerario se mantiene

## Modelo Backend

El backend acepta el itinerario en el modelo `RutaUpdate`:

```python
class RutaUpdate(BaseModel):
    # ... otros campos
    itinerario: Optional[List[LocalidadItinerario]] = Field(None, description="Localidades del itinerario")
```

Donde `LocalidadItinerario` es:

```python
class LocalidadItinerario(LocalidadEmbebida):
    orden: int = Field(..., description="Orden en el itinerario", ge=1)
```

## Notas Importantes

1. **Itinerario Vacío**: Si el itinerario está vacío, el recorrido es directo de origen a destino
2. **Orden Automático**: El sistema reordena automáticamente al mover o eliminar localidades
3. **Validación**: No se permite agregar la misma localidad dos veces
4. **Persistencia**: El itinerario se guarda en MongoDB junto con la ruta

## Conclusión

El problema estaba en que el campo `itinerario` no se incluía en el objeto `RutaUpdate` al actualizar una ruta. La solución fue simple: agregar `itinerario: this.itinerario` al objeto que se envía al backend.

Ahora el itinerario se guarda correctamente tanto al crear como al editar rutas.
