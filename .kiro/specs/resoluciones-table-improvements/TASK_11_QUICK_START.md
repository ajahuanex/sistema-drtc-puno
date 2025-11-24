# Quick Start - Task 11: Testing Responsive y Accesibilidad

## 🚀 Inicio Rápido (5 minutos)

### 1. Verificación Automática

```bash
cd frontend
node verify-responsive-accessibility.js
```

**Resultado esperado:** Todos los checks en verde ✅

---

### 2. Testing Visual Rápido

#### A. Responsive (2 minutos)

1. Abrir la aplicación en el navegador
2. Presionar `F12` para abrir DevTools
3. Presionar `Ctrl+Shift+M` (o `Cmd+Shift+M` en Mac) para modo responsive
4. Probar estos tamaños:

```
📱 Mobile:  375px  → Ver cards y toolbar de filtros
📱 Tablet:  768px  → Ver tabla con scroll horizontal
💻 Desktop: 1280px → Ver tabla completa
```

#### B. Filtros Móviles (1 minuto)

En vista móvil (375px):
1. Click en botón "Filtros" → Modal se abre ✅
2. Click en "Rápidos" → Menú se despliega ✅
3. Seleccionar "Solo Vigentes" → Filtro se aplica ✅
4. Ver chip de filtro activo → Aparece debajo ✅

#### C. Accesibilidad (2 minutos)

1. Presionar `Tab` varias veces → Foco visible ✅
2. Navegar con teclado → Todo accesible ✅
3. Presionar `Enter` en botón → Acción se ejecuta ✅

---

## 📋 Checklist Rápido

### Responsive
- [ ] Vista móvil muestra cards
- [ ] Vista tablet tiene scroll horizontal
- [ ] Vista desktop muestra tabla completa
- [ ] Toolbar de filtros visible en móvil

### Filtros Móviles
- [ ] Modal de filtros se abre
- [ ] Filtros rápidos funcionan
- [ ] Chips de filtros visibles
- [ ] Limpiar filtros funciona

### Accesibilidad
- [ ] Navegación por teclado funciona
- [ ] Indicadores de foco visibles
- [ ] Lectores de pantalla anuncian correctamente
- [ ] Contraste adecuado

---

## 🔧 Testing Detallado

Para testing más exhaustivo, consultar:
- [TASK_11_TESTING_GUIDE.md](./TASK_11_TESTING_GUIDE.md) - Guía completa
- [ACCESSIBILITY_GUIDE.md](./ACCESSIBILITY_GUIDE.md) - Guía de accesibilidad

---

## 🐛 Problemas Comunes

### Modal no se abre en móvil
**Solución:** Verificar que el ancho de pantalla sea < 768px

### Tabla no muestra scroll en tablet
**Solución:** Verificar que el ancho esté entre 768px y 1024px

### Foco no visible
**Solución:** Verificar estilos `:focus-visible` en styles.scss

---

## ✅ Verificación Exitosa

Si todos los checks están en verde:
- ✅ Task 11.1: Filtros Móviles - Completo
- ✅ Task 11.2: Tabla Móvil - Completo
- ✅ Task 11.3: Accesibilidad - Completo

**¡Implementación exitosa! 🎉**

---

**Tiempo estimado:** 5-10 minutos
**Última actualización:** 9 de noviembre de 2025
