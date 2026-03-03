# 🗺️ Carga Masiva de Centros Poblados desde GeoJSON - Frontend

## ✅ Implementación Completada

Se ha agregado la funcionalidad de carga masiva de centros poblados desde archivos GeoJSON directamente en el módulo de localidades del frontend.

## 📦 Archivos Creados/Modificados

### 1. Nuevo Componente: `carga-masiva-geojson.component.ts`
**Ubicación**: `frontend/src/app/components/localidades/carga-masiva-geojson.component.ts`

**Características**:
- ✅ Modal interactivo con 3 pasos
- ✅ Selección de modo de importación (crear/actualizar/ambos)
- ✅ Barra de progreso en tiempo real
- ✅ Estadísticas durante el proceso
- ✅ Resumen final con resultados detallados
- ✅ Manejo de errores robusto
- ✅ Procesamiento por lotes (batch) para mejor rendimiento

### 2. Componente Actualizado: `localidades.component.ts`
**Cambios**:
- ✅ Importación del componente de carga masiva
- ✅ Método `abrirCargaMasiva()` para abrir el modal
- ✅ Integración con MatDialog
- ✅ Recarga automática después de importación exitosa

### 3. Template Actualizado: `localidades.component.html`
**Cambios**:
- ✅ Botón "Carga Masiva GeoJSON" en el header
- ✅ Icono `cloud_upload` distintivo
- ✅ Tooltip explicativo
- ✅ Color accent para destacar

## 🎯 Funcionalidades

### Paso 1: Configuración
El usuario puede seleccionar entre 3 modos de importación:

1. **Crear solo nuevos**
   - Importa únicamente centros poblados que NO existen
   - No modifica registros existentes
   - Ideal para agregar nuevos datos

2. **Actualizar solo existentes**
   - Actualiza únicamente centros poblados que YA existen
   - No crea nuevos registros
   - Ideal para actualizar información

3. **Crear y actualizar (ambos)** ⭐ Recomendado
   - Crea nuevos registros y actualiza existentes
   - Modo más completo
   - Sincronización total

### Paso 2: Proceso de Importación
- 📊 Barra de progreso visual
- 🔢 Contador de registros procesados
- 📈 Estadísticas en tiempo real:
  - ✅ Importados (nuevos)
  - 🔄 Actualizados
  - ⏭️ Omitidos
  - ❌ Errores

### Paso 3: Resultados
- ✅ Resumen completo de la importación
- 📊 Estadísticas finales en tarjetas visuales
- ⚠️ Lista de errores (si los hay)
- 🔄 Recarga automática de la tabla

## 📋 Datos Importados

Cada centro poblado incluye:

### Información Básica
- ✅ Nombre del centro poblado
- ✅ UBIGEO (código único)
- ✅ Departamento (PUNO)
- ✅ Provincia
- ✅ Distrito
- ✅ Tipo: CENTRO_POBLADO

### Coordenadas GPS
- ✅ Latitud
- ✅ Longitud
- 📍 Formato: Point geometry del GeoJSON

### Metadatos Demográficos
- 👥 Población total
- 👨 Población hombres
- 👩 Población mujeres
- 🏠 Viviendas particulares
- ⚠️ Población vulnerable
- 🌆 Tipo de área (Rural/Urbano)

### Datos Adicionales
- 📝 Código CCPP
- 🆔 ID CCPP
- 🔑 Llave IDMA
- 📞 Contacto (si está disponible)
- 📱 WhatsApp (si está disponible)

## 🚀 Cómo Usar

### Desde el Frontend

1. **Acceder al módulo de Localidades**
   ```
   http://localhost:4200/localidades
   ```

2. **Hacer clic en "Carga Masiva GeoJSON"**
   - Botón color accent (naranja/amarillo)
   - Ubicado en el header junto a "Nueva Localidad"

3. **Seleccionar modo de importación**
   - Elegir entre crear, actualizar o ambos
   - Leer la descripción de cada modo

4. **Iniciar importación**
   - Clic en "Iniciar Importación"
   - Esperar a que termine el proceso
   - Ver progreso en tiempo real

5. **Revisar resultados**
   - Ver estadísticas finales
   - Revisar errores (si los hay)
   - Clic en "Aceptar" para cerrar y recargar

## 🔍 Verificación de Duplicados

El componente verifica duplicados de dos formas:

1. **Por UBIGEO**: Si el centro poblado tiene UBIGEO, verifica que no exista otro con el mismo código
2. **Por nombre**: Si no tiene UBIGEO, verifica por nombre exacto en el departamento de PUNO

## ⚡ Rendimiento

### Optimizaciones Implementadas
- ✅ Procesamiento por lotes (10 registros a la vez)
- ✅ Pausas entre lotes para no saturar
- ✅ Actualización de UI cada lote
- ✅ Manejo asíncrono con Promises
- ✅ Carga lazy del archivo GeoJSON

### Tiempos Estimados
- **100 centros poblados**: ~10-15 segundos
- **500 centros poblados**: ~45-60 segundos
- **1000+ centros poblados**: ~2-3 minutos

## 🎨 Interfaz de Usuario

### Diseño
- ✅ Modal responsive (600px de ancho)
- ✅ Adaptable a móviles (90vw max)
- ✅ Colores semánticos:
  - 🟢 Verde: Éxito/Importados
  - 🔵 Azul: Info/Actualizados
  - 🟡 Amarillo: Advertencia/Omitidos
  - 🔴 Rojo: Error

### Animaciones
- ✅ Spinner rotatorio durante carga
- ✅ Transiciones suaves
- ✅ Barra de progreso animada

## 🛠️ Estructura del Código

### Signals (Angular 17+)
```typescript
iniciado = signal(false);
cargando = signal(false);
completado = signal(false);
total = signal(0);
procesados = signal(0);
importados = signal(0);
actualizados = signal(0);
omitidos = signal(0);
errores = signal(0);
```

### Métodos Principales
```typescript
iniciarImportacion()      // Inicia el proceso
cargarGeoJSON()           // Carga el archivo
procesarFeatures()        // Procesa por lotes
procesarFeature()         // Procesa un feature
verificarExistente()      // Verifica duplicados
cerrarYRecargar()         // Cierra y recarga tabla
```

## 📊 Estructura del GeoJSON

El componente espera un GeoJSON con esta estructura:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": 1,
      "geometry": {
        "type": "Point",
        "coordinates": [-69.558805, -14.669027]
      },
      "properties": {
        "NOMB_CCPP": "CHAQUIMINAS",
        "UBIGEO": "211002",
        "NOMB_DEPAR": "PUNO",
        "NOMB_PROVI": "SAN ANTONIO DE PUTINA",
        "NOMB_DISTR": "ANANEA",
        "POBTOTAL": 10,
        "TOTHOMBRES": 6,
        "TOTMUJERES": 4,
        "VIV_PARTIC": 8,
        "TIPO": "Rural"
      }
    }
  ]
}
```

## 🔧 Configuración

### Archivo GeoJSON
**Ubicación esperada**: `frontend/src/assets/geojson/puno-centrospoblados.geojson`

Si el archivo está en otra ubicación, actualizar en:
```typescript
private async cargarGeoJSON(): Promise<GeoJSONData> {
  return this.http.get<GeoJSONData>('assets/geojson/puno-centrospoblados.geojson')
    .toPromise() as Promise<GeoJSONData>;
}
```

### Tamaño de Lote
Para ajustar el rendimiento, modificar:
```typescript
const batchSize = 10; // Cambiar según necesidad
```

## 🐛 Manejo de Errores

### Errores Capturados
- ✅ Archivo GeoJSON no encontrado
- ✅ Formato GeoJSON inválido
- ✅ Error al crear/actualizar localidad
- ✅ Error de conexión con el backend
- ✅ Datos faltantes o inválidos

### Visualización de Errores
- ⚠️ Contador de errores en tiempo real
- 📋 Lista de primeros 5 errores en resultados
- 🔍 Detalles completos en consola del navegador

## 📱 Responsive

El modal se adapta a diferentes tamaños de pantalla:

- **Desktop**: 600px de ancho
- **Tablet**: 90vw (máximo)
- **Móvil**: 90vw con scroll vertical

## 🎯 Próximas Mejoras

Posibles mejoras futuras:

1. **Selección de archivo**
   - Permitir subir archivo GeoJSON personalizado
   - Drag & drop de archivos

2. **Validación previa**
   - Vista previa de datos antes de importar
   - Validación de estructura GeoJSON

3. **Filtros de importación**
   - Importar solo ciertas provincias
   - Importar solo ciertos distritos
   - Filtrar por población mínima

4. **Exportación**
   - Exportar localidades a GeoJSON
   - Exportar a CSV/Excel

5. **Historial**
   - Registro de importaciones anteriores
   - Posibilidad de revertir importación

## 📚 Dependencias

### Angular Material
- MatDialogModule
- MatButtonModule
- MatIconModule
- MatProgressBarModule
- MatCardModule
- MatChipsModule
- MatRadioModule

### Angular Core
- HttpClient (para cargar GeoJSON)
- CommonModule
- FormsModule

## ✅ Testing

Para probar la funcionalidad:

1. **Preparar datos de prueba**
   ```bash
   # Asegurarse de que existe el archivo GeoJSON
   ls frontend/src/assets/geojson/puno-centrospoblados.geojson
   ```

2. **Iniciar aplicación**
   ```bash
   cd frontend
   npm start
   ```

3. **Navegar a localidades**
   ```
   http://localhost:4200/localidades
   ```

4. **Probar cada modo**
   - Modo "Crear solo nuevos"
   - Modo "Actualizar solo existentes"
   - Modo "Crear y actualizar"

5. **Verificar resultados**
   - Revisar tabla de localidades
   - Verificar estadísticas
   - Comprobar coordenadas en mapa

## 🎉 Resultado Final

Después de la implementación, el módulo de localidades tiene:

✅ Botón de carga masiva visible y accesible  
✅ Modal interactivo con 3 pasos claros  
✅ Progreso en tiempo real  
✅ Estadísticas detalladas  
✅ Manejo robusto de errores  
✅ Recarga automática de datos  
✅ Interfaz responsive y moderna  
✅ Integración completa con el sistema existente  

---

**¡La funcionalidad de carga masiva está lista para usar!** 🚀
