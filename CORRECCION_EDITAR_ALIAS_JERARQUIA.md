# 🔧 Corrección - Editar Alias sin Distorsionar Jerarquía

## 🐛 Problema Identificado

**Síntoma**: Al editar un alias, se mostraba información del alias en el formulario

**Causa**: Se guardaba información del alias en metadata temporal, lo que podría distorsionar la jerarquía

**Impacto**: Confusión sobre qué se estaba editando realmente

---

## ✅ Solución Implementada

### Cambio 1: Componente Base (base-localidades.component.ts)

**Antes**:
```typescript
editarLocalidad(localidad: Localidad) {
  if (localidad.metadata?.es_alias && localidad.metadata?.['localidad_id']) {
    const localidadOriginal = this.localidades().find(l => l.id === localidad.metadata?.['localidad_id']);
    if (localidadOriginal) {
      // Guardar información del alias en metadata temporal
      const localidadConAlias = {
        ...localidadOriginal,
        metadata: {
          ...localidadOriginal.metadata,
          aliasEditando: localidad.nombre,
          aliasOriginal: localidad.metadata?.['localidad_nombre']
        }
      };
      this.localidadSeleccionada.set(localidadConAlias);
      // ...
    }
  }
}
```

**Después**:
```typescript
editarLocalidad(localidad: Localidad) {
  // Si es un alias, abrir la localidad original SIN mostrar información del alias
  if (localidad.metadata?.es_alias && localidad.metadata?.['localidad_id']) {
    const localidadOriginal = this.localidades().find(l => l.id === localidad.metadata?.['localidad_id']);
    if (localidadOriginal) {
      // Abrir la localidad original directamente, sin información del alias
      this.localidadSeleccionada.set(localidadOriginal);
      this.esEdicion.set(true);
      this.mostrarModal.set(true);
      return;
    }
  }
  
  this.localidadSeleccionada.set(localidad);
  this.esEdicion.set(true);
  this.mostrarModal.set(true);
}
```

### Cambio 2: Template del Modal (localidad-modal.component.html)

**Eliminado**: Sección de información del alias

```html
<!-- Información del Alias (si se está editando un alias) -->
@if (esEdicion && localidad?.metadata?.['aliasEditando']) {
  <div class="seccion-alias-info">
    <!-- ... -->
  </div>
}
```

---

## 🔄 Flujo Correcto

```
1. Usuario hace click en "Editar" en un alias
   ↓
2. Se detecta que es un alias (metadata.es_alias = true)
   ↓
3. Se obtiene la localidad original
   ↓
4. Se abre el modal con la localidad original
   ↓
5. Se muestra el formulario de la localidad original
   ↓
6. NO se muestra información del alias
   ↓
7. Se edita la localidad original normalmente
   ↓
8. La jerarquía se mantiene intacta
```

---

## 💡 Ventajas

✅ **Jerarquía preservada**: No se distorsiona la estructura
✅ **Claridad**: Se edita la localidad original directamente
✅ **Simplicidad**: Formulario limpio sin información adicional
✅ **Consistencia**: Mismo formulario para localidades y aliases

---

## 🧪 Verificación

- [ ] Click en "Editar" en un alias abre el modal
- [ ] Se muestra el formulario de la localidad original
- [ ] NO se muestra información del alias
- [ ] Se puede editar la localidad original normalmente
- [ ] Los cambios se guardan correctamente
- [ ] La jerarquía se mantiene intacta

---

## 📊 Resultado

Cuando editas un alias:
- Se abre el formulario de la localidad original
- No hay información adicional del alias
- Se edita como si fuera la localidad original
- La jerarquía territorial se mantiene intacta

**Estado**: ✅ Corregido
