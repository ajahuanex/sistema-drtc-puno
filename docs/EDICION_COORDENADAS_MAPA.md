# Sistema de Edición de Coordenadas con Respaldo Original

## Funcionalidad Implementada

Se ha implementado un sistema completo para editar las coordenadas de las localidades directamente desde el mapa, manteniendo siempre las coordenadas originales del INEI como respaldo.

## Características Principales

### 1. Edición Visual en el Mapa
- ✅ Botón "Editar Ubicación" en el footer del mapa
- ✅ Modo de edición: arrastrar el marcador azul a la nueva posición
- ✅ Animación visual del marcador en modo edición (pulso)
- ✅ Guardar o cancelar cambios

### 2. Respaldo de Coordenadas Originales
- ✅ Las coordenadas del INEI se guardan automáticamente como `coordenadasOriginales`
- ✅ Nunca se pierden, siempre disponibles para restaurar
- ✅ Indicador visual cuando se usan coordenadas personalizadas

### 3. Restauración de Originales
- ✅ Botón "Restaurar Original" (solo visible si hay coordenadas personalizadas)
- ✅ Confirmación antes de restaurar
- ✅ Actualización automática del marcador en el mapa

## Modelo de Datos

### Estructura Extendida de Coordenadas

```typescript
interface CoordenadasExtendidas {
  // Coordenadas actuales (las que se muestran)
  latitud: number;
  longitud: number;
  
  // Coordenadas originales del INEI (inmutables)
  latitudOriginal?: number;
  longitudOriginal?: number;
  
  // Flag para saber si son personalizadas
  esPersonalizada?: boolean;
  
  // Metadatos
  fechaModificacion?: string;
  modificadoPor?: string;
  fuenteOriginal?: string; // 'INEI', 'MANUAL', 'GPS'
}
```

### Ejemplo en Base de Datos

**Antes de Editar:**
```json
{
  "nombre": "YUNGUYO",
  "coordenadas": {
    "latitud": -16.226702,
    "longitud": -69.095512
  }
}
```

**Después de Editar:**
```json
{
  "nombre": "YUNGUYO",
  "coordenadas": {
    "latitud": -16.250000,
    "longitud": -69.100000,
    "latitudOriginal": -16.226702,
    "longitudOriginal": -69.095512,
    "esPersonalizada": true,
    "fechaModificacion": "2026-03-07T18:30:00Z",
    "fuenteOriginal": "INEI"
  }
}
```

**Después de Restaurar:**
```json
{
  "nombre": "YUNGUYO",
  "coordenadas": {
    "latitud": -16.226702,
    "longitud": -69.095512,
    "latitudOriginal": -16.226702,
    "longitudOriginal": -69.095512,
    "esPersonalizada": false,
    "fuenteOriginal": "INEI"
  }
}
```

## Flujo de Uso

### 1. Editar Ubicación

1. Abrir el mapa de una localidad
2. Hacer clic en "Editar Ubicación"
3. Arrastrar el marcador azul a la nueva posición
4. Hacer clic en "Guardar"
5. Las coordenadas se actualizan en la base de datos

**Logs de Consola:**
```
🎯 Modo edición activado
📍 Nueva posición: { latitud: -16.250000, longitud: -69.100000 }
💾 Guardando nuevas coordenadas: { latitud: -16.250000, longitud: -69.100000 }
💾 Actualizando coordenadas en BD: { latitud: -16.250000, longitud: -69.100000 }
✅ Coordenadas guardadas
✅ Coordenadas actualizadas en BD
```

### 2. Cancelar Edición

1. En modo edición, hacer clic en "Cancelar"
2. El marcador vuelve a su posición original
3. No se guardan cambios

**Logs de Consola:**
```
❌ Edición cancelada
```

### 3. Restaurar Original

1. Si hay coordenadas personalizadas, aparece el botón "Restaurar Original"
2. Hacer clic en el botón
3. Confirmar la acción
4. Las coordenadas del INEI se restauran

**Logs de Consola:**
```
🔄 Restaurando coordenadas originales
✅ Coordenadas originales restauradas
```

## Interfaz de Usuario

### Footer del Mapa

**Estado Normal:**
```
[📍 Lat: -16.226702, Lng: -69.095512]  [Editar Ubicación]  [Cerrar]
```

**Con Coordenadas Personalizadas:**
```
[📍 Lat: -16.250000, Lng: -69.100000 🟠]  [Editar Ubicación]  [Restaurar Original]  [Cerrar]
```

**En Modo Edición:**
```
[📍 Lat: -16.250000, Lng: -69.100000]  [Guardar]  [Cancelar]  [Cerrar]
```

### Indicadores Visuales

1. **Icono naranja** (🟠) - Indica que las coordenadas son personalizadas
2. **Animación de pulso** - El marcador pulsa en modo edición
3. **Cursor de movimiento** - El marcador muestra cursor "move" cuando es draggable

## Casos de Uso

### Caso 1: Coordenadas Incorrectas del INEI

**Problema:** Las coordenadas del INEI están en un lugar incorrecto

**Solución:**
1. Editar ubicación
2. Mover marcador al lugar correcto
3. Guardar
4. Las coordenadas del INEI se mantienen como respaldo

### Caso 2: Ubicación Específica del Municipio

**Problema:** Las coordenadas del INEI son del centroide del distrito, pero se necesita la ubicación exacta del municipio

**Solución:**
1. Editar ubicación
2. Mover marcador al edificio del municipio
3. Guardar
4. Se puede restaurar el centroide cuando sea necesario

### Caso 3: Corrección de Datos

**Problema:** Se editó por error y se quiere volver al original

**Solución:**
1. Hacer clic en "Restaurar Original"
2. Confirmar
3. Las coordenadas del INEI se restauran automáticamente

## Ventajas del Sistema

### 1. No Destructivo
- ✅ Las coordenadas originales NUNCA se pierden
- ✅ Siempre se pueden restaurar
- ✅ Historial de cambios (fecha de modificación)

### 2. Flexible
- ✅ Permite ajustes precisos
- ✅ Edición visual e intuitiva
- ✅ Reversible en cualquier momento

### 3. Trazable
- ✅ Se sabe si las coordenadas son originales o personalizadas
- ✅ Se guarda la fecha de modificación
- ✅ Se puede agregar quién modificó (futuro)

### 4. Seguro
- ✅ Confirmación antes de restaurar
- ✅ Validación de datos
- ✅ Manejo de errores

## Archivos Modificados

### Frontend

**Modelo:**
- `frontend/src/app/models/localidad.model.ts`
  - Nueva interfaz `CoordenadasExtendidas`
  - Campos adicionales para respaldo

**Componente del Mapa:**
- `frontend/src/app/components/localidades/mapa-localidad-modal.component.ts`
  - Propiedad `modoEdicion`
  - Propiedad `marcadorEditable`
  - Propiedad `coordenadasTemporales`
  - Output `coordenadasActualizadas`
  - Método `iniciarEdicion()`
  - Método `cancelarEdicion()`
  - Método `guardarEdicion()`
  - Método `restaurarOriginal()`
  - Estilos CSS para animación

**Componente Padre:**
- `frontend/src/app/components/localidades/localidades.component.ts`
  - Método `actualizarCoordenadas()`
- `frontend/src/app/components/localidades/localidades.component.html`
  - Binding del evento `coordenadasActualizadas`

### Backend

No requiere cambios. El endpoint de actualización ya soporta el campo `coordenadas` con cualquier estructura.

## Mejoras Futuras

### 1. Historial de Cambios
```typescript
interface HistorialCoordenadas {
  fecha: string;
  usuario: string;
  coordenadasAnteriores: Coordenadas;
  coordenadasNuevas: Coordenadas;
  motivo?: string;
}
```

### 2. Múltiples Fuentes
```typescript
interface CoordenadasMultiFuente {
  inei: Coordenadas;
  gps: Coordenadas;
  manual: Coordenadas;
  fuenteActiva: 'inei' | 'gps' | 'manual';
}
```

### 3. Validación Geográfica
- Verificar que las coordenadas estén dentro del distrito
- Alertar si están muy lejos del centroide
- Sugerir coordenadas cercanas

### 4. Importación Masiva
- Importar coordenadas desde GPS
- Importar desde archivo CSV
- Sincronizar con otras fuentes

## Testing

### Prueba 1: Editar y Guardar
1. Buscar "YUNGUYO" en la tabla
2. Abrir el mapa
3. Hacer clic en "Editar Ubicación"
4. Arrastrar el marcador
5. Hacer clic en "Guardar"
6. Verificar que aparece el icono naranja
7. Verificar que las coordenadas cambiaron

### Prueba 2: Cancelar Edición
1. Hacer clic en "Editar Ubicación"
2. Arrastrar el marcador
3. Hacer clic en "Cancelar"
4. Verificar que el marcador vuelve a su posición
5. Verificar que no se guardaron cambios

### Prueba 3: Restaurar Original
1. Con coordenadas personalizadas
2. Hacer clic en "Restaurar Original"
3. Confirmar
4. Verificar que desaparece el icono naranja
5. Verificar que las coordenadas son las originales

## Fecha de Implementación

7 de marzo de 2026
