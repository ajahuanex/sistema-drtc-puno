# Task 8.5 - Quick Reference Card
## Paginación y Estados de Carga

---

## 🚀 Quick Start

### Usar el Componente
```html
<app-resoluciones-table
  [resoluciones]="resoluciones"
  [configuracion]="config"
  [cargando]="isLoading"
  (configuracionChange)="onConfigChange($event)"
  (accionEjecutada)="onAction($event)">
</app-resoluciones-table>
```

### Configuración de Paginación
```typescript
config: ResolucionTableConfig = {
  paginacion: {
    tamanoPagina: 25,      // 10, 25, 50, o 100
    paginaActual: 0        // Índice base 0
  },
  // ... otras configuraciones
};
```

---

## 📋 Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `resoluciones` | `ResolucionConEmpresa[]` | Datos a mostrar |
| `configuracion` | `ResolucionTableConfig` | Config de tabla |
| `cargando` | `boolean` | Estado de carga |
| `seleccionMultiple` | `boolean` | Habilita selección |

---

## 🎯 Eventos

### configuracionChange
```typescript
onConfigChange(config: Partial<ResolucionTableConfig>) {
  // Actualizar paginación
  if (config.paginacion) {
    this.currentPage = config.paginacion.paginaActual;
    this.pageSize = config.paginacion.tamanoPagina;
  }
}
```

---

## 🔧 Métodos Útiles

### getPaginacionInfo()
```typescript
// Retorna: "Mostrando 1-25 de 127 resoluciones"
const info = component.getPaginacionInfo();
```

### scrollToTop()
```typescript
// Scroll suave al inicio (llamado automáticamente)
component.scrollToTop();
```

---

## 🎨 Estados Visuales

### Loading
```typescript
// Mostrar loading
this.cargando = true;

// Ocultar loading
this.cargando = false;
```

### Sin Resultados
```typescript
// Se muestra automáticamente cuando:
!cargando && resoluciones.length === 0
```

---

## ♿ Accesibilidad

### Atributos Clave
- `role="status"` - Loading y sin resultados
- `aria-live="polite"` - Anuncios
- `aria-busy="true"` - Durante carga
- `aria-label` - Descripciones

---

## 🧪 Testing

### Verificación Rápida
```bash
node frontend/verify-pagination-loading.js
```

### Test Visual
Abrir: `frontend/test-pagination-loading.html`

---

## 📊 Opciones de Paginación

| Tamaño | Uso Recomendado |
|--------|-----------------|
| 10 | Móviles, conexiones lentas |
| 25 | **Default**, uso general |
| 50 | Desktop, muchos datos |
| 100 | Power users, análisis |

---

## 🐛 Troubleshooting

### Paginador no aparece
```typescript
// Verificar ViewChild
@ViewChild(MatPaginator) paginator!: MatPaginator;

// Verificar conexión
ngAfterViewInit() {
  this.dataSource.paginator = this.paginator;
}
```

### Loading no desaparece
```typescript
// Asegurar que se actualiza
this.cargando = false;

// Verificar en template
[cargando]="isLoading"
```

### Contador incorrecto
```typescript
// Actualizar signal
this.totalResultados.set(data.length);
```

---

## 💡 Tips

1. **Performance:** Usa `trackBy` en ngFor
2. **UX:** El scroll automático mejora la experiencia
3. **Accesibilidad:** Siempre incluye aria-labels
4. **Testing:** Prueba con 0, 1, 10, 100, 1000+ registros

---

## 📚 Documentación Completa

- `TASK_8.5_COMPLETION_SUMMARY.md` - Detalles técnicos
- `TASK_8.5_VISUAL_TEST_GUIDE.md` - Guía de testing
- `TASK_8.5_FINAL_REPORT.md` - Reporte completo

---

## ✅ Checklist Rápido

- [ ] Paginador visible y funcional
- [ ] Contador de resultados correcto
- [ ] Loading overlay durante cargas
- [ ] Mensaje sin resultados claro
- [ ] Accesibilidad completa
- [ ] Sin errores en consola

---

**Última actualización:** 9 de noviembre de 2025
