# 📸 Ejemplo Visual: Columna de Itinerario

## Vista de Tabla con Itinerarios

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ☑ │ RUC        │ Resolución │ Código │ Origen  │ Destino  │ Itinerario                      │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ ☐ │ 20123456789│ R-001-2024 │ 01     │ Puno    │ Arequipa │ Puno - Juliaca - Arequipa       │
│ ☐ │ 20987654321│ R-002-2024 │ 02     │ Juliaca │ Cusco    │ Juliaca - Ayaviri - Cusco       │
│ ☐ │ 20456789123│ R-003-2024 │ 03     │ Puno    │ Lima     │ Puno - Juliaca - Arequipa - Lima│
│ ☐ │ 20789123456│ R-004-2024 │ 04     │ Ilave   │ Puno     │ Ilave - Juli - Puno             │
│ ☐ │ 20321654987│ R-005-2024 │ 05     │ Puno    │ Cusco    │ Puno - Juliaca - Ayaviri - Cusco│
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Ejemplo 1: Ruta Corta (2-3 localidades)

### Datos en Base de Datos
```json
{
  "codigoRuta": "01",
  "origen": { "nombre": "Puno" },
  "destino": { "nombre": "Juliaca" },
  "itinerario": [
    { "id": "loc1", "nombre": "Puno", "orden": 1 },
    { "id": "loc2", "nombre": "Juliaca", "orden": 2 }
  ]
}
```

### Visualización en Frontend
```
┌─────────────────────────────┐
│ Itinerario                  │
├─────────────────────────────┤
│ Puno - Juliaca              │
└─────────────────────────────┘
```

## Ejemplo 2: Ruta Media (4-5 localidades)

### Datos en Base de Datos
```json
{
  "codigoRuta": "02",
  "origen": { "nombre": "Puno" },
  "destino": { "nombre": "Cusco" },
  "itinerario": [
    { "id": "loc1", "nombre": "Puno", "orden": 1 },
    { "id": "loc2", "nombre": "Juliaca", "orden": 2 },
    { "id": "loc3", "nombre": "Ayaviri", "orden": 3 },
    { "id": "loc4", "nombre": "Sicuani", "orden": 4 },
    { "id": "loc5", "nombre": "Cusco", "orden": 5 }
  ]
}
```

### Visualización en Frontend
```
┌──────────────────────────────────────────────┐
│ Itinerario                                   │
├──────────────────────────────────────────────┤
│ Puno - Juliaca - Ayaviri - Sicuani - Cusco  │
└──────────────────────────────────────────────┘
```

## Ejemplo 3: Ruta Larga (6+ localidades)

### Datos en Base de Datos
```json
{
  "codigoRuta": "03",
  "origen": { "nombre": "Puno" },
  "destino": { "nombre": "Lima" },
  "itinerario": [
    { "id": "loc1", "nombre": "Puno", "orden": 1 },
    { "id": "loc2", "nombre": "Juliaca", "orden": 2 },
    { "id": "loc3", "nombre": "Arequipa", "orden": 3 },
    { "id": "loc4", "nombre": "Nazca", "orden": 4 },
    { "id": "loc5", "nombre": "Ica", "orden": 5 },
    { "id": "loc6", "nombre": "Lima", "orden": 6 }
  ]
}
```

### Visualización en Frontend (con tooltip)
```
┌──────────────────────────────────────────────┐
│ Itinerario                                   │
├──────────────────────────────────────────────┤
│ Puno - Juliaca - Arequipa - Nazca - Ica...  │ 🖱️ Hover para ver completo
│                                              │
│ Tooltip:                                     │
│ ┌────────────────────────────────────────┐  │
│ │ Puno - Juliaca - Arequipa - Nazca -   │  │
│ │ Ica - Lima                             │  │
│ └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

## Ejemplo 4: Ruta sin Itinerario

### Datos en Base de Datos
```json
{
  "codigoRuta": "04",
  "origen": { "nombre": "Puno" },
  "destino": { "nombre": "Juliaca" },
  "itinerario": []
}
```

### Visualización en Frontend
```
┌─────────────────────────────┐
│ Itinerario                  │
├─────────────────────────────┤
│ Sin itinerario              │
└─────────────────────────────┘
```

## Búsqueda por Itinerario

### Escenario: Usuario busca "Juliaca"

```
Búsqueda: "Juliaca"

Resultados encontrados:
┌──────────────────────────────────────────────────────────────────────────────┐
│ ☐ │ 20123456789│ R-001-2024 │ 01 │ Puno - Juliaca - Arequipa              │ ✓
│ ☐ │ 20987654321│ R-002-2024 │ 02 │ Juliaca - Ayaviri - Cusco              │ ✓
│ ☐ │ 20321654987│ R-005-2024 │ 05 │ Puno - Juliaca - Ayaviri - Cusco       │ ✓
└──────────────────────────────────────────────────────────────────────────────┘

3 rutas encontradas que pasan por "Juliaca"
```

## Configuración de Columnas

### Menú de Configuración
```
┌─────────────────────────────┐
│ Configurar Columnas         │
├─────────────────────────────┤
│ ☑ Seleccionar               │ (fijo)
│ ☑ RUC                       │
│ ☑ Resolución                │
│ ☑ Código Ruta               │
│ ☑ Origen                    │
│ ☑ Destino                   │
│ ☑ Itinerario                │ ← Nueva columna
│ ☑ Frecuencias               │
│ ☐ Tipo Ruta                 │
│ ☐ Tipo Servicio             │
│ ☑ Estado                    │
│ ☑ Acciones                  │ (fijo)
├─────────────────────────────┤
│ 🔄 Resetear por defecto     │
└─────────────────────────────┘
```

## Exportación a Excel

### Columna en Excel
```
| RUC         | Resolución | Código | Origen | Destino  | Itinerario                           |
|-------------|------------|--------|--------|----------|--------------------------------------|
| 20123456789 | R-001-2024 | 01     | Puno   | Arequipa | Puno - Juliaca - Arequipa           |
| 20987654321 | R-002-2024 | 02     | Juliaca| Cusco    | Juliaca - Ayaviri - Cusco           |
| 20456789123 | R-003-2024 | 03     | Puno   | Lima     | Puno - Juliaca - Arequipa - Lima    |
```

## Responsive Design

### Desktop (> 1200px)
```
┌────────────────────────────────────────────────┐
│ Itinerario (max-width: 200px)                 │
├────────────────────────────────────────────────┤
│ Puno - Juliaca - Arequipa - Nazca - Ica - Lima│
└────────────────────────────────────────────────┘
```

### Tablet (768px - 1200px)
```
┌──────────────────────────────────┐
│ Itinerario (max-width: 150px)   │
├──────────────────────────────────┤
│ Puno - Juliaca - Arequipa - N...│
└──────────────────────────────────┘
```

### Mobile (< 768px)
```
┌────────────────────────┐
│ Itinerario (100px)     │
├────────────────────────┤
│ Puno - Juliaca - A...  │
└────────────────────────┘
```

## Estilos CSS Aplicados

```scss
.itinerario-text {
  font-size: 12px;        // Tamaño legible
  color: #666;            // Gris suave
  line-height: 1.3;       // Espaciado cómodo
  max-width: 200px;       // Ancho máximo
  word-wrap: break-word;  // Rompe palabras largas
}
```

## Interacción del Usuario

### 1. Ver Itinerario Completo
```
Usuario pasa el mouse sobre el itinerario
↓
Aparece tooltip con el itinerario completo
↓
Usuario puede leer todas las localidades
```

### 2. Buscar por Localidad
```
Usuario escribe "Juliaca" en el buscador
↓
Sistema busca en todos los campos incluyendo itinerario
↓
Muestra todas las rutas que pasan por Juliaca
```

### 3. Exportar Datos
```
Usuario selecciona rutas
↓
Click en "Exportar a Excel"
↓
Excel incluye columna "Itinerario" con formato legible
```

## Ventajas de la Implementación

✅ **Claridad Visual**
- Fácil de leer y entender
- Separador " - " intuitivo
- Orden correcto de localidades

✅ **Funcionalidad Completa**
- Búsqueda por cualquier localidad
- Exportación incluida
- Tooltip para itinerarios largos

✅ **Responsive**
- Se adapta a diferentes tamaños de pantalla
- Mantiene legibilidad en móviles
- Trunca texto largo con tooltip

✅ **Configurable**
- Usuario puede mostrar/ocultar
- Preferencias guardadas
- Reseteable a valores por defecto

---

**Resultado:** Una columna de itinerario clara, funcional y fácil de usar que mejora significativamente la experiencia del usuario al gestionar rutas.
