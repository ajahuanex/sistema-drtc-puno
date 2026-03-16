# 🔧 Funcionalidad - Editar Alias con Información de Localidad Original

## ✨ Nueva Funcionalidad

Se agregó información clara sobre la localidad original cuando se edita un alias.

---

## 🎯 Comportamiento

### Antes
- Al hacer click en "Editar" en un alias, se abría la localidad original
- No había indicación de que se estaba editando un alias
- Confusión sobre cuál era el alias que se estaba editando

### Después
- Al hacer click en "Editar" en un alias, se abre la localidad original
- Se muestra una sección informativa con:
  - Localidad original
  - Alias que se está editando
- Claridad total sobre qué se está editando

---

## 📝 Implementación

### Cambio 1: Componente Base (base-localidades.component.ts)

```typescript
editarLocalidad(localidad: Localidad) {
  // Si es un alias, guardar información del alias
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

```html
<!-- Información del Alias (si se está editando un alias) -->
@if (esEdicion && localidad?.metadata?.['aliasEditando']) {
  <div class="seccion-alias-info">
    <div class="alias-info-box">
      <mat-icon>info</mat-icon>
      <div class="alias-info-content">
        <p class="alias-info-label">Estás editando un alias de:</p>
        <p class="alias-info-original">{{ localidad.metadata?.['aliasOriginal'] || localidad.nombre }}</p>
        <p class="alias-info-alias">Alias: <strong>{{ localidad.metadata?.['aliasEditando'] }}</strong></p>
      </div>
    </div>
  </div>
}
```

### Cambio 3: Estilos (localidad-modal.component.scss)

```scss
.seccion-alias-info {
  margin-bottom: 24px;

  .alias-info-box {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background-color: #e3f2fd;
    border: 1px solid #90caf9;
    border-radius: 8px;
    border-left: 4px solid #1976d2;

    mat-icon {
      color: #1976d2;
      font-size: 24px;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .alias-info-content {
      flex: 1;

      p {
        margin: 0 0 4px 0;
        font-size: 14px;
      }

      .alias-info-label {
        color: #666;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }

      .alias-info-original {
        color: #1976d2;
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 8px;
      }

      .alias-info-alias {
        color: #666;
        font-size: 13px;

        strong {
          color: #333;
          font-weight: 600;
        }
      }
    }
  }
}
```

---

## 🔄 Flujo

```
1. Usuario hace click en "Editar" en un alias
   ↓
2. Se detecta que es un alias (metadata.es_alias = true)
   ↓
3. Se obtiene la localidad original
   ↓
4. Se guarda información del alias en metadata temporal
   ↓
5. Se abre el modal con la localidad original
   ↓
6. Se muestra sección informativa con:
   - Localidad original
   - Alias que se está editando
```

---

## 💡 Ventajas

✅ **Claridad**: Sabe exactamente qué está editando
✅ **Información**: Ve la localidad original y el alias
✅ **Prevención de errores**: No confunde alias con localidades
✅ **Mejor UX**: Interfaz clara e intuitiva

---

## 🧪 Verificación

- [ ] Click en "Editar" en un alias abre el modal
- [ ] Se muestra sección informativa del alias
- [ ] Muestra la localidad original correctamente
- [ ] Muestra el alias que se está editando
- [ ] Los estilos se ven correctamente
- [ ] Funciona en dispositivos móviles

---

## 📊 Resultado

Cuando editas un alias, ves claramente:
- **Localidad original**: La localidad a la que pertenece el alias
- **Alias**: El nombre del alias que estás editando
- **Contexto**: Sabes exactamente qué estás modificando

**Estado**: ✅ Implementado
