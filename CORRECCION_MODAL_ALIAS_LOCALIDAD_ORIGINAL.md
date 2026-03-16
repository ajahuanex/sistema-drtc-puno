# 🔧 Corrección - Modal Carga Localidad Original para Alias

## 🐛 Problema Identificado

**Síntoma**: Al editar un alias (ej: "CP LA RINCONADA"), el formulario mostraba los datos del alias

**Causa**: El método `cargarDatos()` usaba directamente `this.localidad` sin verificar si era un alias

**Impacto**: Se mostraban datos del alias en lugar de la localidad original

---

## ✅ Solución Implementada

### Cambio: Modal Component (localidad-modal.component.ts)

**Antes**:
```typescript
private async cargarDatos() {
  if (this.esEdicion && this.localidad) {
    // Usar directamente this.localidad
    const tipoLocalidad = this.localidad.tipo || TipoLocalidad.PUEBLO;
    // ... cargar datos del alias
  }
}
```

**Después**:
```typescript
private async cargarDatos() {
  if (this.esEdicion && this.localidad) {
    // Si es un alias, obtener la localidad original
    let localidadACargar = this.localidad;
    
    if (this.localidad.metadata?.es_alias && this.localidad.metadata?.['localidad_id']) {
      // Buscar la localidad original en el servicio
      try {
        localidadACargar = await this.localidadService.obtenerLocalidadPorId(this.localidad.metadata['localidad_id']);
        console.log('📋 Cargando localidad original (alias detectado):', localidadACargar);
      } catch (error) {
        console.error('Error obteniendo localidad original:', error);
        localidadACargar = this.localidad;
      }
    }
    
    // Usar localidadACargar en lugar de this.localidad
    const tipoLocalidad = localidadACargar.tipo || TipoLocalidad.PUEBLO;
    // ... cargar datos de la localidad original
  }
}
```

---

## 🔄 Flujo Correcto

```
1. Usuario hace click en "Editar" en un alias
   ↓
2. Se abre el modal con el alias
   ↓
3. cargarDatos() detecta que es un alias
   ↓
4. Obtiene la localidad original del servicio
   ↓
5. Carga los datos de la localidad original en el formulario
   ↓
6. Se muestra el formulario de la localidad original
   ↓
7. Se edita la localidad original
```

---

## 💡 Ventajas

✅ **Datos correctos**: Muestra la localidad original, no el alias
✅ **Jerarquía preservada**: No se distorsiona la estructura
✅ **Transparencia**: El usuario edita la localidad original sin confusión
✅ **Consistencia**: Mismo comportamiento en todos los casos

---

## 🧪 Verificación

- [ ] Click en "Editar" en un alias abre el modal
- [ ] El formulario muestra los datos de la localidad original
- [ ] El nombre mostrado es el de la localidad original, no el alias
- [ ] Se puede editar la localidad original normalmente
- [ ] Los cambios se guardan en la localidad original
- [ ] La jerarquía se mantiene intacta

---

## 📊 Ejemplo

**Antes**:
- Alias: "CP LA RINCONADA"
- Localidad Original: "LA RINCONADA"
- Al editar: Mostraba "CP LA RINCONADA" en el formulario ❌

**Después**:
- Alias: "CP LA RINCONADA"
- Localidad Original: "LA RINCONADA"
- Al editar: Muestra "LA RINCONADA" en el formulario ✅

**Estado**: ✅ Corregido
