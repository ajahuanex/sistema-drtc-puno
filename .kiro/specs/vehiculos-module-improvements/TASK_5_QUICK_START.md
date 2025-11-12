# Task 5: Búsqueda Global Inteligente - Guía Rápida

## 🚀 Inicio Rápido

### 1. Verificar Archivos Creados

```bash
# Verificar que los archivos existen
ls frontend/src/app/services/vehiculo-busqueda.service.ts
ls frontend/src/app/components/vehiculos/vehiculo-busqueda-global.component.ts
```

### 2. Compilar el Proyecto

```bash
cd frontend
npm install  # Si es necesario
ng build
```

### 3. Iniciar el Servidor de Desarrollo

```bash
ng serve
# O
npm start
```

### 4. Abrir en el Navegador

```
http://localhost:4200/vehiculos
```

---

## 🧪 Pruebas Rápidas (5 minutos)

### Prueba 1: Búsqueda Básica (30 segundos)
1. Escribir "PUN" en el campo de búsqueda
2. ✅ Deben aparecer sugerencias de vehículos
3. ✅ "PUN" debe estar resaltado en amarillo

### Prueba 2: Selección de Vehículo (30 segundos)
1. Seleccionar un vehículo de las sugerencias
2. ✅ Debe navegar a la página de detalle del vehículo

### Prueba 3: Búsqueda de Empresa (1 minuto)
1. Escribir un RUC o nombre de empresa
2. ✅ Deben aparecer sugerencias de empresas
3. Seleccionar una empresa
4. ✅ La tabla debe filtrarse por esa empresa
5. ✅ Debe aparecer un chip de "Empresa: [nombre]"

### Prueba 4: Sin Resultados (30 segundos)
1. Escribir "ZZZZZ"
2. ✅ Debe aparecer "No se encontraron resultados"
3. ✅ Debe aparecer un mensaje con sugerencias

### Prueba 5: Historial (1 minuto)
1. Realizar 2-3 búsquedas diferentes
2. Limpiar el campo de búsqueda
3. Hacer clic en el campo vacío
4. ✅ Deben aparecer chips de búsquedas recientes
5. Hacer clic en un chip
6. ✅ Debe repetir la búsqueda

### Prueba 6: Limpiar Filtros (30 segundos)
1. Realizar una búsqueda
2. Hacer clic en "Limpiar Todo"
3. ✅ La búsqueda debe limpiarse
4. ✅ La tabla debe mostrar todos los vehículos

---

## 📝 Casos de Uso Comunes

### Caso 1: Buscar Vehículo por Placa
```
Usuario: "Necesito encontrar el vehículo PUN-123"
Acción: Escribir "PUN-123" en búsqueda global
Resultado: Vehículo aparece en sugerencias, seleccionar para ver detalle
```

### Caso 2: Ver Todos los Vehículos de una Empresa
```
Usuario: "Quiero ver todos los vehículos de la empresa X"
Acción: Escribir nombre o RUC de empresa
Resultado: Seleccionar empresa, tabla se filtra automáticamente
```

### Caso 3: Buscar Vehículos por Resolución
```
Usuario: "Necesito ver qué vehículos tienen la resolución 001-2024"
Acción: Escribir "001-2024"
Resultado: Seleccionar resolución, tabla muestra vehículos relacionados
```

### Caso 4: Búsqueda Rápida por Marca
```
Usuario: "Quiero ver todos los Mercedes Benz"
Acción: Escribir "Mercedes"
Resultado: Sugerencias muestran vehículos Mercedes, tabla se filtra
```

---

## 🎨 Características Visuales

### Resaltado de Términos
- Los términos buscados aparecen en **amarillo** (#fff59d)
- Ejemplo: Buscar "PUN" → **PUN**-001 aparece resaltado

### Iconos por Tipo
- 🚗 Vehículos: `directions_car` (azul)
- 🏢 Empresas: `business` (verde)
- 📄 Resoluciones: `description` (naranja)

### Estados Visuales
- 🔄 Buscando: Spinner animado
- ✅ Resultados: Lista de sugerencias
- ❌ Sin resultados: Icono de búsqueda vacía
- 📝 Historial: Chips clicables

---

## 🐛 Solución de Problemas

### Problema: No aparecen sugerencias
**Solución:**
1. Verificar que hay datos en el sistema
2. Verificar consola del navegador por errores
3. Verificar que el servicio está inyectado correctamente

### Problema: Búsqueda es muy lenta
**Solución:**
1. Verificar que el debounce está funcionando (300ms)
2. Verificar cantidad de datos en el sistema
3. Considerar implementar paginación de sugerencias

### Problema: Historial no se guarda
**Solución:**
1. Verificar que localStorage está habilitado
2. Verificar consola por errores de localStorage
3. Limpiar localStorage y probar de nuevo

### Problema: Términos no se resaltan
**Solución:**
1. Verificar que el método `resaltarTermino()` está funcionando
2. Verificar que el HTML permite innerHTML
3. Verificar estilos CSS para `<mark>`

---

## 📊 Métricas de Rendimiento

### Tiempos Esperados
- Tiempo de respuesta de búsqueda: < 300ms
- Tiempo de renderizado de sugerencias: < 100ms
- Tiempo de aplicación de filtros: < 200ms

### Optimizaciones Implementadas
- ✅ Debounce de 300ms
- ✅ DistinctUntilChanged
- ✅ Normalización eficiente de términos
- ✅ Scoring optimizado

---

## 🔗 Enlaces Útiles

### Documentación
- [Resumen de Implementación](./TASK_5_COMPLETION_SUMMARY.md)
- [Checklist de Verificación](./TASK_5_VERIFICATION_CHECKLIST.md)
- [Test Manual Interactivo](../../frontend/test-busqueda-global-vehiculos.html)

### Archivos de Código
- [VehiculoBusquedaService](../../frontend/src/app/services/vehiculo-busqueda.service.ts)
- [VehiculoBusquedaGlobalComponent](../../frontend/src/app/components/vehiculos/vehiculo-busqueda-global.component.ts)
- [VehiculosComponent](../../frontend/src/app/components/vehiculos/vehiculos.component.ts)

---

## ✅ Checklist de Verificación Rápida

Antes de considerar la tarea completa, verificar:

- [ ] Búsqueda funciona en todos los campos
- [ ] Sugerencias aparecen en tiempo real
- [ ] Términos están resaltados
- [ ] Selección aplica filtros correctamente
- [ ] Sin resultados muestra mensaje
- [ ] Historial funciona
- [ ] Limpiar filtros funciona
- [ ] No hay errores en consola
- [ ] Rendimiento es aceptable
- [ ] UX es intuitiva

---

## 🎯 Próximos Pasos

Una vez verificada la implementación:

1. ✅ Marcar Task 5 como completada
2. 📝 Documentar cualquier issue encontrado
3. 🚀 Continuar con Task 6: Mejorar tabla de vehículos
4. 🔄 Considerar mejoras futuras (ver TASK_5_COMPLETION_SUMMARY.md)

---

**¿Listo para probar?** 🚀

Abre el navegador en `http://localhost:4200/vehiculos` y comienza a buscar!

---

**Última actualización:** 11/11/2025  
**Versión:** 1.0.0
