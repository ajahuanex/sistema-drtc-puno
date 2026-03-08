# Limpieza de Código - Módulo de Localidades

## Métodos Duplicados o Redundantes Encontrados

### En `localidad.service.ts`:

#### 1. Métodos de Obtención Duplicados:
- `obtenerLocalidades()` - ✅ MANTENER (método principal con cache)
- `getLocalidades()` - ❌ ELIMINAR (duplicado, retorna Observable)
- `getLocalidadesActivas()` - ❌ ELIMINAR (se puede hacer con filtros)

#### 2. Métodos de Importación Antiguos:
- `importarCentrosPobladosINEI()` - ⚠️ REVISAR (¿se usa?)
- `importarCentrosPobladosRENIEC()` - ⚠️ REVISAR (¿se usa?)
- `sincronizarConBaseDatosOficial()` - ⚠️ REVISAR (¿se usa?)
- `importarCentrosPobladosArchivo()` - ⚠️ REVISAR (¿se usa?)

#### 3. Métodos de Exportación:
- `exportarExcel()` - ❌ ELIMINAR (método antiguo sin parámetros)
- `exportarAExcel()` - ⚠️ COMENTADO (nuevo método con filtros)

#### 4. Métodos de Estadísticas:
- `obtenerEstadisticasCentrosPoblados()` - ⚠️ REVISAR (¿se usa?)
- `validarYLimpiarCentrosPoblados()` - ⚠️ REVISAR (¿se usa?)

#### 5. Métodos de Inicialización:
- `inicializarLocalidadesDefault()` - ⚠️ REVISAR (¿se usa?)

### Recomendaciones de Limpieza:

#### ELIMINAR INMEDIATAMENTE:
```typescript
// Métodos duplicados que no se usan
getLocalidades(): Observable<Localidad[]>
getLocalidadesActivas(): Observable<Localidad[]>
exportarExcel(): Promise<void>  // Sin parámetros, antiguo
```

#### REVISAR USO EN COMPONENTES:
Buscar referencias a estos métodos en:
- `importar-centros-poblados-modal.component.ts`
- Otros componentes de localidades

Si no se usan, eliminar:
```typescript
importarCentrosPobladosINEI()
importarCentrosPobladosRENIEC()
sincronizarConBaseDatosOficial()
importarCentrosPobladosArchivo()
obtenerEstadisticasCentrosPoblados()
validarYLimpiarCentrosPoblados()
inicializarLocalidadesDefault()
```

#### MANTENER:
```typescript
// Métodos principales del CRUD
obtenerLocalidades()
buscarLocalidades()
crearLocalidad()
actualizarLocalidad()
eliminarLocalidad()
toggleEstadoLocalidad()
obtenerLocalidadPorId()

// Métodos de validación
validarUbigeoUnico()
existeLocalidad()
verificarUsoLocalidad()

// Métodos de operaciones masivas
operacionesMasivas()
importarExcel()

// Métodos de cache
refrescarCache()
getLocalidadesObservable()
getEstadisticasCache()

// Métodos de utilidad
calcularDistancia()
obtenerLocalidadesPaginadas()
obtenerCentrosPobladosPorDistrito()
```

---

## Archivos GeoJSON Estáticos

### Archivos que YA NO SE USAN (datos en BD):
Los siguientes archivos están en `frontend/src/assets/geojson/` pero ya no se usan porque los datos están en la base de datos:

- ❌ `puno-provincias.geojson` - Datos en colección `geometrias`
- ❌ `puno-distritos.geojson` - Datos en colección `geometrias`
- ❌ `puno-provincias-point.geojson` - Datos en colección `geometrias`
- ❌ `puno-distritos-point.geojson` - Datos en colección `geometrias`
- ❌ `puno-centrospoblados.geojson` - Datos en colección `geometrias`

**Acción**: Estos archivos se pueden eliminar del frontend, pero mantener en el backend para la importación inicial.

---

## Componentes a Revisar

### `importar-centros-poblados-modal.component.ts`
Este componente tiene múltiples métodos de importación que probablemente ya no se usan:
- `importarDesdeINEI()`
- `importarDesdeRENIEC()`
- `importarDesdeMunicipalidad()`

**Acción**: Verificar si este componente se usa. Si no, eliminarlo.

---

## Resumen de Acciones

### Prioridad Alta:
1. ✅ Eliminar métodos duplicados: `getLocalidades()`, `getLocalidadesActivas()`, `exportarExcel()`
2. ✅ Verificar uso de `importar-centros-poblados-modal.component.ts`
3. ✅ Eliminar métodos de importación antiguos si no se usan

### Prioridad Media:
4. Considerar eliminar archivos GeoJSON del frontend (mantener en backend)
5. Documentar métodos que se mantienen

### Prioridad Baja:
6. Refactorizar nombres de métodos para consistencia
7. Agregar JSDoc a métodos principales
