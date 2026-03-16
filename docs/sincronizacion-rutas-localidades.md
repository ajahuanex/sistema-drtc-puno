# Sincronización de Rutas con Localidades

## Resumen

Se implementó un sistema completo de sincronización entre rutas y localidades para asegurar que todas las rutas tengan información territorial completa (tipo, ubigeo, departamento, provincia, distrito, coordenadas).

## Problema Identificado

Las rutas en el sistema tenían IDs de localidades que no correspondían con los IDs actuales en la base de datos de localidades, o carecían de información territorial completa.

## Solución Implementada

### 1. Backend - Endpoints de Sincronización

Se implementaron 3 endpoints en `backend/app/routers/rutas_router.py`:

#### `/rutas/verificar-sincronizacion` (GET)
Verifica el estado de sincronización de todas las rutas.

**Respuesta:**
```json
{
  "total_rutas": 457,
  "rutas_con_info_completa": 455,
  "porcentaje_completo": 99.56,
  "rutas_sin_tipo": 2,
  "rutas_sin_ubigeo": 2,
  "rutas_sin_departamento": 2,
  "necesita_sincronizacion": true
}
```

#### `/rutas/verificar-ids-localidades` (GET)
Verifica la correspondencia de IDs entre rutas y localidades (primeras 10 rutas).

**Respuesta:**
```json
{
  "total_verificadas": 20,
  "ids_coinciden": 18,
  "localidades_encontradas": 20,
  "con_tipo_en_ruta": 18,
  "con_ubigeo_en_ruta": 18,
  "con_coords_en_ruta": 16,
  "porcentaje_ids_ok": 90.0,
  "porcentaje_encontradas": 100.0,
  "porcentaje_con_info": 90.0,
  "necesita_sincronizacion": true,
  "detalles": [...]
}
```

#### `/rutas/sincronizar-localidades` (POST)
Sincroniza todas las rutas con información completa de localidades.

**Lógica de sincronización:**
1. Busca la localidad por ID en la base de datos
2. Si no se encuentra por ID, busca por nombre
3. Aplica lógica de prioridad: CENTRO_POBLADO > DISTRITO > PROVINCIA
4. Actualiza origen, destino e itinerario con información completa

**Respuesta:**
```json
{
  "mensaje": "Sincronización completada",
  "total_rutas": 457,
  "rutas_actualizadas": 455,
  "rutas_con_errores": 2,
  "errores": [...]
}
```

### 2. Frontend - Servicio de Rutas

Se agregaron 3 métodos en `frontend/src/app/services/ruta.service.ts`:

```typescript
verificarSincronizacionLocalidades(): Observable<any>
verificarIdsLocalidades(): Observable<any>
sincronizarLocalidades(): Observable<any>
```

### 3. Frontend - Componente de Rutas

Se agregaron 3 métodos en `frontend/src/app/components/rutas/rutas.component.ts`:

```typescript
verificarEstadoSincronizacion(): Promise<void>
sincronizarLocalidades(): Promise<void>
verificarCoordenadasRutas(): Promise<void>
```

### 4. Frontend - Interfaz de Usuario

Se agregó un botón "Sincronizar Localidades" en la barra de acciones del componente de rutas:

```html
<button mat-stroked-button 
        color="primary" 
        (click)="verificarEstadoSincronizacion()"
        [disabled]="isLoading()"
        matTooltip="Verificar y sincronizar información de localidades en rutas">
  <mat-icon>sync</mat-icon>
  Sincronizar Localidades
</button>
```

### 5. Scripts de Utilidad

Se crearon 2 scripts Python para ejecutar desde línea de comandos:

#### `backend/scripts/verificar_estado_rutas.py`
Verifica el estado de sincronización de todas las rutas.

**Uso:**
```bash
python backend/scripts/verificar_estado_rutas.py
```

#### `backend/scripts/sincronizar_rutas_localidades.py`
Sincroniza todas las rutas con información completa de localidades.

**Uso:**
```bash
python backend/scripts/sincronizar_rutas_localidades.py
```

## Modelo de Datos

### LocalidadEmbebida (Extendida)

```python
class LocalidadEmbebida(BaseModel):
    id: str
    nombre: str
    tipo: Optional[str]              # NUEVO
    ubigeo: Optional[str]            # NUEVO
    departamento: Optional[str]      # NUEVO
    provincia: Optional[str]         # NUEVO
    distrito: Optional[str]          # NUEVO
    coordenadas: Optional[dict]      # NUEVO
```

## Lógica de Prioridad

Cuando se encuentra una localidad de tipo PROVINCIA, el sistema busca si existe como DISTRITO o CENTRO_POBLADO con el mismo nombre:

1. **CENTRO_POBLADO** (mayor prioridad)
2. **DISTRITO** (prioridad media)
3. **PROVINCIA** (menor prioridad)

Esto asegura que se use la localidad más específica disponible.

## Resultados

### Sincronización Inicial
- **Total de rutas:** 457
- **Rutas actualizadas:** 455 (99.6%)
- **Rutas con errores:** 2 (0.4%)

### Información Sincronizada
- Tipo de localidad (CENTRO_POBLADO, DISTRITO, PROVINCIA, etc.)
- Código UBIGEO
- Departamento
- Provincia
- Distrito
- Coordenadas geográficas (latitud, longitud)

## Flujo de Uso

### Desde la Interfaz Web

1. Ir al módulo de Rutas
2. Hacer clic en el botón "Sincronizar Localidades"
3. El sistema verifica el estado actual
4. Si hay rutas que necesitan sincronización, muestra un diálogo de confirmación
5. Al confirmar, ejecuta la sincronización
6. Muestra el resultado con estadísticas
7. Recarga automáticamente las rutas para mostrar los cambios

### Desde Línea de Comandos

```bash
# 1. Verificar estado
python backend/scripts/verificar_estado_rutas.py

# 2. Sincronizar si es necesario
python backend/scripts/sincronizar_rutas_localidades.py
```

## Casos de Uso

### 1. Rutas con IDs Antiguos
Rutas que tienen IDs de localidades que ya no existen en la base de datos. El sistema busca por nombre y actualiza con el ID correcto.

### 2. Rutas sin Información Territorial
Rutas que solo tienen ID y nombre de localidad, pero no tienen tipo, ubigeo, departamento, etc. El sistema completa toda la información.

### 3. Rutas con Localidades Genéricas
Rutas que tienen localidades de tipo PROVINCIA cuando existe una más específica (DISTRITO o CENTRO_POBLADO). El sistema actualiza a la más específica.

## Mantenimiento

### Cuándo Ejecutar la Sincronización

- Después de importar rutas desde Excel
- Después de actualizar la base de datos de localidades
- Cuando se detecten inconsistencias en los datos
- Periódicamente como mantenimiento preventivo

### Monitoreo

El sistema proporciona logs detallados en consola:
- ✅ Rutas actualizadas correctamente
- ⚠️ Advertencias sobre localidades no encontradas
- ❌ Errores durante la sincronización

## Notas Técnicas

### Búsqueda de Localidades

El sistema implementa búsqueda inteligente:
1. Por ID exacto (ObjectId o string)
2. Por nombre exacto (case-insensitive)
3. Por nombre normalizado (sin prefijos como "C.P.")
4. Por similitud (contiene)

### Actualización Atómica

La sincronización actualiza:
- `origen` (objeto completo)
- `destino` (objeto completo)
- `itinerario` (array de objetos completos)

Solo se actualizan las rutas que tienen cambios, evitando escrituras innecesarias.

### Manejo de Errores

Los errores se registran pero no detienen el proceso completo. Cada ruta se procesa independientemente.

## Próximos Pasos

1. ✅ Implementar modal de resultados detallados
2. ✅ Agregar exportación de rutas con problemas
3. ✅ Implementar sincronización automática en carga masiva
4. ⏳ Agregar validación de coordenadas geográficas
5. ⏳ Implementar sincronización incremental (solo rutas modificadas)

## Referencias

- Modelo de Ruta: `backend/app/models/ruta.py`
- Router de Rutas: `backend/app/routers/rutas_router.py`
- Servicio de Rutas (Frontend): `frontend/src/app/services/ruta.service.ts`
- Componente de Rutas: `frontend/src/app/components/rutas/rutas.component.ts`
