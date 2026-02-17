# Fix: Edición de Origen y Destino en Rutas

## 🐛 Problema Identificado

Al editar una ruta y cambiar el origen o destino, los cambios no se reflejaban en la base de datos ni en la tabla.

### Causa Raíz

El modal de edición (`editar-ruta-modal.component.ts`) solo enviaba el **nombre** de la ruta concatenado, pero **NO enviaba los objetos completos de origen y destino** al backend.

```typescript
// ❌ ANTES (Incorrecto)
const rutaActualizada: RutaUpdate = {
  frecuencias: formValue.frecuencias,
  tipoRuta: formValue.tipoRuta,
  estado: formValue.estado,
  observaciones: formValue.observaciones,
  nombre: `${formValue.origen} - ${formValue.destino}` // Solo texto
};
```

## ✅ Solución Implementada

### 1. Agregado Autocomplete para Localidades

Se implementó autocomplete para origen y destino, permitiendo seleccionar localidades de la base de datos.

### 2. Envío de Objetos Completos

Ahora se envían los objetos `LocalidadEmbebida` completos con `id` y `nombre`:

```typescript
// ✅ DESPUÉS (Correcto)
const origenEmbebido: LocalidadEmbebida = {
  id: this.origenSeleccionado.id,
  nombre: this.origenSeleccionado.nombre
};

const destinoEmbebido: LocalidadEmbebida = {
  id: this.destinoSeleccionado.id,
  nombre: this.destinoSeleccionado.nombre
};

const rutaActualizada: RutaUpdate = {
  origen: origenEmbebido,
  destino: destinoEmbebido,
  frecuencias: formValue.frecuencias,
  tipoRuta: formValue.tipoRuta,
  estado: formValue.estado,
  distancia: formValue.distancia,
  observaciones: formValue.observaciones,
  nombre: `${origenEmbebido.nombre} - ${destinoEmbebido.nombre}`
};
```

## 📝 Cambios Realizados

### Archivo: `editar-ruta-modal.component.ts`

1. **Imports agregados:**
   - `MatAutocompleteModule`
   - `LocalidadService`
   - `Localidad` model
   - RxJS operators (`map`, `startWith`)

2. **Nuevas propiedades:**
   - `origenSeleccionado: Localidad | null`
   - `destinoSeleccionado: Localidad | null`
   - `localidadesOrigenFiltradas: Observable<Localidad[]>`
   - `localidadesDestinoFiltradas: Observable<Localidad[]>`
   - `todasLocalidades: Localidad[]`

3. **Nuevos métodos:**
   - `displayLocalidad()` - Muestra el nombre de la localidad en el input
   - `onOrigenSelected()` - Guarda la localidad de origen seleccionada
   - `onDestinoSelected()` - Guarda la localidad de destino seleccionada
   - `_filtrarLocalidades()` - Filtra localidades por nombre

4. **Template actualizado:**
   - Inputs con `[matAutocomplete]`
   - Autocomplete panels con lista de localidades
   - Display de nombre y ubicación de cada localidad

### Archivo: `crear-ruta-modal.component.scss`

Agregados estilos para las opciones de autocomplete:
- `.localidad-option` - Estilo para cada opción
- `.mat-mdc-autocomplete-panel` - Estilo del panel

## 🎯 Resultado

Ahora al editar una ruta:

1. ✅ Se muestra autocomplete al escribir en origen/destino
2. ✅ Se pueden buscar localidades por nombre
3. ✅ Al seleccionar, se guarda el objeto completo
4. ✅ Al guardar, se envían los IDs y nombres correctos
5. ✅ Los cambios se reflejan inmediatamente en la tabla
6. ✅ La base de datos se actualiza correctamente

## 🧪 Prueba

1. Abre el modal de edición de una ruta
2. Haz clic en el campo "Origen"
3. Escribe el nombre de una localidad (ej: "JULIACA")
4. Selecciona de la lista
5. Repite para "Destino"
6. Guarda los cambios
7. Verifica que la tabla se actualice con los nuevos valores

---

**Fecha:** 9 de febrero de 2026  
**Estado:** ✅ Implementado y probado
