# Análisis del Módulo de Rutas - Código Duplicado y Métodos No Usados

## Fecha: 2026-02-22

## 1. COMPONENTES DUPLICADOS

### 1.1 Componentes para Crear/Agregar Rutas (3 componentes similares)

#### ❌ DUPLICADO: `crear-ruta-modal.component.ts` (en /rutas)
- **Ubicación**: `frontend/src/app/components/rutas/crear-ruta-modal.component.ts`
- **Clase**: `CrearRutaModalComponent`
- **Uso**: No se usa en el módulo de rutas principal
- **Recomendación**: ELIMINAR - Reemplazado por CrearRutaMejoradoComponent

#### ✅ ACTIVO: `crear-ruta-mejorado.component.ts`
- **Ubicación**: `frontend/src/app/components/rutas/crear-ruta-mejorado.component.ts`
- **Clase**: `CrearRutaMejoradoComponent`
- **Uso**: Exportado en index.ts, es la versión mejorada
- **Recomendación**: MANTENER - Es la versión actual

#### ⚠️ REVISAR: `agregar-ruta-modal.component.ts`
- **Ubicación**: `frontend/src/app/components/rutas/agregar-ruta-modal.component.ts`
- **Clase**: `AgregarRutaModalComponent`
- **Uso**: Posiblemente usado para agregar rutas a resoluciones existentes
- **Recomendación**: REVISAR si se usa, si no ELIMINAR

#### ⚠️ DUPLICADO EN OTRO MÓDULO: `crear-ruta-modal.component.ts` (en /empresas)
- **Ubicación**: `frontend/src/app/components/empresas/crear-ruta-modal.component.ts`
- **Clase**: `CrearRutaModalComponent` (mismo nombre, diferente módulo)
- **Uso**: Usado en empresa-detail.component.ts
- **Recomendación**: CONSOLIDAR - Debería usar el componente del módulo de rutas

### 1.2 Componentes de Filtros (2 componentes similares)

#### ✅ ACTIVO: `filtros-avanzados-modal.component.ts`
- **Ubicación**: `frontend/src/app/components/rutas/filtros-avanzados-modal.component.ts`
- **Clase**: `FiltrosAvanzadosModalComponent`
- **Uso**: Usado en rutas.component.ts (línea 316)
- **Recomendación**: MANTENER

#### ⚠️ REVISAR: `filtros-avanzados-rutas.component.ts`
- **Ubicación**: `frontend/src/app/components/rutas/filtros-avanzados-rutas.component.ts`
- **Clase**: `FiltrosAvanzadosRutasComponent`
- **Uso**: No encontrado en búsqueda
- **Recomendación**: ELIMINAR si no se usa

## 2. MÉTODOS EN rutas.component.ts

### 2.1 Métodos Utilizados ✅

- `ngOnInit()` - Inicialización del componente
- `ngOnDestroy()` - Limpieza de recursos
- `getNombreRuta()` - Obtener nombre de ruta
- `getEmpresaNombre()` - Obtener nombre de empresa
- `getItinerarioFormateado()` - Formatear itinerario
- `onBusquedaChange()` - Manejar cambio de búsqueda
- `buscarRutas()` - Ejecutar búsqueda
- `limpiarBusqueda()` - Limpiar búsqueda
- `abrirFiltrosAvanzados()` - Abrir modal de filtros
- `limpiarFiltrosAvanzados()` - Limpiar filtros
- `limpiarTodo()` - Limpiar búsqueda y filtros
- `aplicarFiltrosBidireccionales()` - Aplicar filtros de origen/destino
- `getFiltrosActivosTexto()` - Obtener texto de filtros activos
- `getFiltrosActivosChips()` - Obtener chips de filtros
- `removerFiltro()` - Remover un filtro específico
- `onPageChange()` - Manejar cambio de página
- `recargarRutas()` - Recargar datos
- `nuevaRuta()` - Crear nueva ruta
- `verDetalleRuta()` - Ver detalle de ruta
- `editarRuta()` - Editar ruta
- `eliminarRuta()` - Eliminar ruta
- `toggleRutaSeleccionada()` - Seleccionar/deseleccionar ruta
- `toggleTodasSeleccionadas()` - Seleccionar/deseleccionar todas
- `limpiarSeleccion()` - Limpiar selección
- `eliminarSeleccionadas()` - Eliminar rutas seleccionadas
- `exportarSeleccionadas()` - Exportar rutas seleccionadas
- `toggleColumna()` - Mostrar/ocultar columna
- `resetearColumnas()` - Resetear columnas

### 2.2 Métodos Potencialmente No Usados ⚠️

Todos los métodos parecen estar en uso. Se recomienda verificar en el template HTML.

## 3. ARCHIVOS A REVISAR/ELIMINAR

### Archivos para ELIMINAR (si no se usan):

1. ❌ `frontend/src/app/components/rutas/crear-ruta-modal.component.ts`
2. ❌ `frontend/src/app/components/rutas/crear-ruta-modal.component.scss`
3. ❌ `frontend/src/app/components/rutas/agregar-ruta-modal.component.ts` (si no se usa)
4. ❌ `frontend/src/app/components/rutas/agregar-ruta-modal.component.scss` (si no se usa)
5. ❌ `frontend/src/app/components/rutas/filtros-avanzados-rutas.component.ts` (si no se usa)

### Archivos para CONSOLIDAR:

1. ⚠️ `frontend/src/app/components/empresas/crear-ruta-modal.component.ts`
   - Debería usar el componente del módulo de rutas en lugar de tener su propia versión

## 4. RECOMENDACIONES

### Prioridad Alta:
1. ✅ Verificar si `agregar-ruta-modal.component.ts` se usa
2. ✅ Verificar si `filtros-avanzados-rutas.component.ts` se usa
3. ✅ Eliminar `crear-ruta-modal.component.ts` del módulo de rutas (obsoleto)

### Prioridad Media:
4. ⚠️ Consolidar el componente de crear ruta en empresas para usar el del módulo de rutas
5. ⚠️ Revisar si hay lógica duplicada entre componentes similares

### Prioridad Baja:
6. 📝 Documentar cuándo usar cada componente (si se mantienen múltiples)
7. 📝 Agregar comentarios explicando la diferencia entre componentes similares

## 5. PRÓXIMOS PASOS

1. Buscar referencias a los componentes sospechosos
2. Eliminar componentes no utilizados
3. Consolidar componentes duplicados
4. Actualizar imports y referencias
5. Probar que todo funcione correctamente
