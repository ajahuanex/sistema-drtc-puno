# 🧪 Guía de Prueba: Mapeo Correcto de UBIGEO

## Objetivo
Verificar que el componente mapea correctamente el UBIGEO según el tipo de localidad y que las coordenadas se extraen correctamente.

## Pasos de Prueba

### 1. Abrir el Componente
- Navegar a la sección de Localidades
- Hacer clic en "Carga Masiva desde GeoJSON"

### 2. Validar Archivos Disponibles
Verificar que aparezcan los archivos correctos:
- ✅ `puno-provincias-point.geojson` (con coordenadas)
- ✅ `puno-distritos-point.geojson` (con coordenadas)
- ✅ `puno-centrospoblados.geojson` (con coordenadas)

### 3. Seleccionar Archivos por Defecto
- Seleccionar la pestaña "Archivos por Defecto"
- Marcar los tres tipos de localidades:
  - ✅ Provincias
  - ✅ Distritos
  - ✅ Centros Poblados

### 4. Validar Archivo
- Hacer clic en "Validar Archivo"
- Esperar a que se procese la validación

### 5. Verificar Preview - Provincias
En la pestaña "Provincias" del preview, verificar:

**Ejemplo esperado:**
| Nombre | UBIGEO | Coordenadas |
|--------|--------|-------------|
| PUNO | 21010000 | ✓ GPS |
| AZANGARO | 21020000 | ✓ GPS |
| CHUCUITO | 21040000 | ✓ GPS |

**Validaciones:**
- ✅ UBIGEO tiene 8 dígitos
- ✅ Formato: `21` + código provincia (2 dígitos) + `0000`
- ✅ Todas tienen coordenadas GPS

### 6. Verificar Preview - Distritos
En la pestaña "Distritos" del preview, verificar:

**Ejemplo esperado:**
| Nombre | Provincia | UBIGEO | Coordenadas |
|--------|-----------|--------|-------------|
| PUNO | PUNO | 21010100 | ✓ GPS |
| ACORA | PUNO | 21010200 | ✓ GPS |
| CAPAZO | EL COLLAO | 21050200 | ✓ GPS |

**Validaciones:**
- ✅ UBIGEO tiene 8 dígitos
- ✅ Formato: `DDPPDD00` (6 primeros dígitos del UBIGEO + `00`)
- ✅ Todas tienen coordenadas GPS
- ✅ Provincia correcta

### 7. Verificar Preview - Centros Poblados
En la pestaña "Centros Poblados" del preview, verificar:

**Ejemplo esperado:**
| Nombre | Distrito | Provincia | UBIGEO | Coordenadas |
|--------|----------|-----------|--------|-------------|
| CHAQUIMINAS | ANANEA | SAN ANTONIO DE PUTINA | 2110020048 | ✓ GPS |
| ANANEA | ANANEA | SAN ANTONIO DE PUTINA | 2110020001 | ✓ GPS |

**Validaciones:**
- ✅ UBIGEO tiene 10 dígitos
- ✅ Formato: `DDPPDDCCCC` (código CCPP de 10 dígitos)
- ✅ Todas tienen coordenadas GPS
- ✅ Distrito y provincia correctos

### 8. Verificar Estadísticas
Después de validar, verificar que aparezcan:
- Total de registros: > 0
- Con coordenadas GPS: > 0 (idealmente igual al total)
- Con UBIGEO: > 0 (idealmente igual al total)

### 9. Realizar Importación TEST
- Hacer clic en "TEST (2 de cada tipo)"
- Esperar a que se complete
- Verificar en la consola del navegador (F12):
  - Resultado TEST debe mostrar 2 provincias, 2 distritos, 2 centros poblados

### 10. Verificar Logs en Consola
Abrir la consola del navegador (F12) y buscar:

```
✅ Preview procesado: puno-provincias-point.geojson
✅ Preview procesado: puno-distritos-point.geojson
✅ Preview procesado: puno-centrospoblados.geojson
📊 Resultado TEST: {...}
```

## Validaciones de UBIGEO

### Provincias
```
IDPROV: "2101" → UBIGEO: "21010000"
IDPROV: "2102" → UBIGEO: "21020000"
IDPROV: "2113" → UBIGEO: "21130000"
```

### Distritos
```
UBIGEO: "210101" → UBIGEO: "21010100"
UBIGEO: "210102" → UBIGEO: "21010200"
UBIGEO: "210502" → UBIGEO: "21050200"
```

### Centros Poblados
```
IDCCPP: "2110020048" → UBIGEO: "2110020048"
IDCCPP: "2110020001" → UBIGEO: "2110020001"
```

## Checklist de Validación

- [ ] Archivos con "-point" se cargan correctamente
- [ ] Provincias tienen UBIGEO de 8 dígitos (formato DDPP0000)
- [ ] Distritos tienen UBIGEO de 8 dígitos (formato DDPPDD00)
- [ ] Centros Poblados tienen UBIGEO de 10 dígitos (formato DDPPDDCCCC)
- [ ] Todas las localidades tienen coordenadas GPS
- [ ] Las coordenadas están dentro del rango de Puno (-72 a -68 longitud, -18 a -13 latitud)
- [ ] El preview muestra datos correctos por tipo
- [ ] La importación TEST funciona sin errores
- [ ] Los logs en consola muestran el procesamiento correcto

## Posibles Errores y Soluciones

### Error: "No se pudieron cargar los archivos GeoJSON"
- Verificar que los archivos existan en `frontend/src/assets/geojson/`
- Verificar que los nombres sean exactos (con "-point" para provincias y distritos)

### Error: "UBIGEO vacío"
- Verificar que el archivo tenga las propiedades correctas:
  - Provincias: `IDPROV` o `CODPROV`
  - Distritos: `UBIGEO`
  - Centros Poblados: `IDCCPP` o `COD_CCPP`

### Error: "Coordenadas faltantes"
- Verificar que el archivo tenga `geometry.coordinates`
- Verificar que sea un archivo "-point" (Point geometry)

### UBIGEO incorrecto
- Verificar que el formato sea correcto según el tipo
- Revisar los logs en consola para ver qué valores se están usando

## Resultado Esperado Final

Después de todas las pruebas:
- ✅ Todos los archivos se cargan correctamente
- ✅ UBIGEO se genera correctamente según el tipo
- ✅ Coordenadas se extraen correctamente
- ✅ Preview muestra datos reales y correctos
- ✅ Importación funciona sin errores
- ✅ Datos se guardan en la base de datos correctamente

