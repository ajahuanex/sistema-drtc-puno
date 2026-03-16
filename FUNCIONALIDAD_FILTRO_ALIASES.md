# 🔧 Funcionalidad - Filtro de Aliases

## ✨ Nueva Funcionalidad

Se agregó la capacidad de filtrar y listar solo aliases cuando se hace click en la tarjeta de estadísticas de "Aliases".

---

## 🎯 Comportamiento

### Antes
- Click en "Aliases" → No hacía nada

### Después
- Click en "Aliases" → Carga y muestra solo los aliases
- Muestra mensaje: "Mostrando X aliases"
- Tabla se actualiza con solo aliases

---

## 📝 Implementación

### Cambio 1: Template (localidades.component.html)

```html
<!-- Antes -->
<mat-card class="stat-card clickeable" 
          matTooltip="Aliases de localidades">

<!-- Después -->
<mat-card class="stat-card clickeable" 
          (click)="filtrarPorAliases()"
          matTooltip="Click para filtrar por aliases">
```

### Cambio 2: Componente (localidades.component.ts)

```typescript
async filtrarPorAliases() {
  // Cargar todas las localidades (incluyendo aliases)
  this.cargando.set(true);
  try {
    const todasLasLocalidades = await this.localidadService.obtenerLocalidades();
    // Filtrar solo aliases
    const aliases = todasLasLocalidades.filter(l => l.metadata?.es_alias);
    this.localidades.set(aliases);
    this.dataSource.data = aliases;
    this.mostrarMensaje(`Mostrando ${aliases.length} aliases`, 'info');
  } catch (error) {
    console.error('Error cargando aliases:', error);
    this.mostrarMensaje('Error cargando aliases', 'error');
  } finally {
    this.cargando.set(false);
  }
}
```

---

## 🔄 Flujo

```
1. Usuario hace click en tarjeta "Aliases"
   ↓
2. Se llama filtrarPorAliases()
   ↓
3. Se cargan todas las localidades
   ↓
4. Se filtran solo los aliases (metadata.es_alias = true)
   ↓
5. Se actualiza la tabla con los aliases
   ↓
6. Se muestra mensaje: "Mostrando X aliases"
```

---

## 💡 Ventajas

✅ **Fácil acceso**: Click directo en la tarjeta
✅ **Información clara**: Muestra cuántos aliases hay
✅ **Filtrado rápido**: Carga solo lo necesario
✅ **Feedback visual**: Muestra mensaje de confirmación

---

## 🧪 Verificación

- [ ] Click en "Aliases" carga los aliases
- [ ] Tabla muestra solo aliases
- [ ] Mensaje de confirmación aparece
- [ ] Número de aliases es correcto (9369)
- [ ] Puedo limpiar el filtro

---

## 📊 Resultado

Cuando haces click en la tarjeta de "Aliases":
- Se cargan 9,369 aliases
- Se muestran en la tabla
- Se puede ver cada alias con su localidad original
- Se puede limpiar el filtro para volver a la vista normal

**Estado**: ✅ Implementado
