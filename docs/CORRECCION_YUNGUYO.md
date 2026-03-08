# Corrección: Problema de Ubicación de YUNGUYO

## Problema Identificado

En la imagen se observa que:
1. ❌ El marcador de YUNGUYO está fuera del polígono del distrito
2. ❌ No se ven los centros poblados

## Causa Raíz

### 1. Distrito Incorrecto en Localidades

La tabla `localidades` tenía datos incorrectos para varias capitales de provincia:

```
Localidad: YUNGUYO
  Distrito: PUNO      ← INCORRECTO
  Provincia: YUNGUYO  ← Correcto
```

Esto causaba que:
- El mapa cargara el polígono del distrito de PUNO
- El marcador se mostrara en las coordenadas de YUNGUYO
- Los centros poblados se buscaran en el distrito de PUNO (que no tiene relación)

### 2. Coordenadas de la Localidad

Las coordenadas almacenadas en la tabla `localidades` pueden ser:
- Coordenadas manuales (ingresadas por usuario)
- Coordenadas aproximadas
- Coordenadas de referencia

Mientras que las geometrías tienen:
- Polígonos oficiales del INEI
- Centroides calculados precisos

## Solución Implementada

### 1. Corrección de Distritos

Se ejecutó el script `corregir_distritos_localidades.py` que corrigió **7 localidades**:

| Localidad | Distrito Anterior | Distrito Correcto | Provincia |
|-----------|-------------------|-------------------|-----------|
| YUNGUYO | PUNO | YUNGUYO | YUNGUYO |
| CHUCUITO | PUNO | CHUCUITO | PUNO |
| LAMPA | PUNO | LAMPA | LAMPA |
| MOHO | PUNO | MOHO | MOHO |
| HUANCANE | PUNO | HUANCANE | HUANCANE |
| AZANGARO | PUNO | AZANGARO | AZANGARO |
| SANDIA | PUNO | SANDIA | SANDIA |

### 2. Verificación de Datos

**Distrito YUNGUYO en geometrías:**
- Nombre: YUNGUYO
- Provincia: YUNGUYO
- Centroide: Lat=-16.278878, Lng=-69.076481
- ✅ Polígono correcto

**Centros Poblados de YUNGUYO:**
- Total: 124 centros poblados
- Ejemplos:
  - KALAPALLALLA (-69.033448, -16.343293)
  - HUAYCHANI (-69.028200, -16.345617)
  - HUANCARANI (-69.026960, -16.347368)
  - CHICANIHUMA ALTO (-69.089930, -16.340936)
  - PINAZO (-69.078561, -16.326994)

## Cómo Usar el Mapa Correctamente

### 1. Abrir el Mapa

Al abrir el mapa de YUNGUYO ahora verás:
- 🟣 Provincia de YUNGUYO (morado)
- 🟢 Distrito de YUNGUYO (verde) - CORRECTO
- 📍 Marcador de la localidad

### 2. Activar Centros Poblados

Para ver los 124 centros poblados:

1. Hacer clic en el botón de **Pantalla Completa** (esquina superior derecha)
2. En el panel de "Capas" que aparece, activar:
   - ☑ **Centros Poblados**
3. Verás 124 puntos naranjas 🟠 en el distrito

### 3. Activar Nombres

Para ver los nombres de los lugares:

1. En el panel de "Capas", activar:
   - ☑ **Mostrar Nombres**
2. Aparecerán etiquetas en todos los elementos

### 4. Explorar el Mapa

- **Clic en cualquier punto naranja** → Ver nombre del centro poblado
- **Zoom in/out** → Explorar el territorio
- **Desactivar capas** → Simplificar la vista

## Comparación Antes/Después

### ANTES (Incorrecto)
```
Localidad YUNGUYO:
  Distrito: PUNO
  Mapa muestra: Polígono de PUNO
  Marcador: Coordenadas de YUNGUYO
  Resultado: Marcador fuera del polígono ❌
  Centros poblados: 0 (buscaba en PUNO)
```

### DESPUÉS (Correcto)
```
Localidad YUNGUYO:
  Distrito: YUNGUYO
  Mapa muestra: Polígono de YUNGUYO
  Marcador: Coordenadas de YUNGUYO
  Resultado: Marcador dentro del polígono ✅
  Centros poblados: 124 (del distrito YUNGUYO)
```

## Recomendación: Actualizar Coordenadas

Para que el marcador esté exactamente en el centro del distrito, se puede:

### Opción 1: Usar Centroide del Polígono

Actualizar las coordenadas de la localidad con el centroide del distrito:

```sql
UPDATE localidades 
SET coordenadas = {
  latitud: -16.278878,
  longitud: -69.076481
}
WHERE nombre = 'YUNGUYO'
```

### Opción 2: Usar Coordenadas del GeoJSON Point

Si tienes archivos `puno-distritos-point.geojson`, usar esas coordenadas que son las oficiales del INEI.

### Opción 3: Mantener Coordenadas Actuales

Si las coordenadas actuales son correctas (por ejemplo, ubicación del municipio o plaza principal), mantenerlas. El polígono del distrito es más grande que el punto urbano.

## Scripts Creados

1. **`backend/corregir_distritos_localidades.py`**
   - Corrige distritos de localidades que coinciden con nombres de distritos
   - Ejecutar cuando se agreguen nuevas localidades

2. **`backend/check_yunguyo.py`**
   - Verifica datos de YUNGUYO específicamente
   - Útil para debugging

3. **`backend/test_centros_poblados_api.py`**
   - Prueba el endpoint de centros poblados
   - Verifica que el API funcione correctamente

## Archivos Afectados

### Base de Datos
- Tabla `localidades`: 7 registros actualizados
- Colección `geometrias`: Sin cambios (ya estaba correcta)

### Frontend
- Sin cambios necesarios (el código ya funciona correctamente)

## Verificación Final

Para verificar que todo funciona:

1. Abrir el mapa de YUNGUYO
2. Verificar que el marcador esté dentro del polígono verde
3. Activar "Centros Poblados" en pantalla completa
4. Verificar que aparezcan ~124 puntos naranjas
5. Activar "Mostrar Nombres" para ver etiquetas

## Fecha de Corrección

7 de marzo de 2026
