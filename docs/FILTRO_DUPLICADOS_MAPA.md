# Filtro de Duplicados en el Mapa

## Problema Identificado

Al activar la capa "Centros Poblados" en el mapa, aparecían **dos marcadores** en la misma ubicación:

1. **Marcador azul grande** (📍) - Localidad principal seleccionada
2. **Punto naranja pequeño** (🟠) - Centro poblado de la capa

**Ejemplo:** Al ver el mapa de YUNGUYO, aparecían dos marcadores superpuestos.

## Causa

El sistema muestra:
- **Marcador azul:** La localidad que el usuario seleccionó de la tabla
- **Puntos naranjas:** TODOS los centros poblados del distrito (incluyendo el que coincide con la localidad)

Cuando la localidad seleccionada es un centro poblado Y se activa la capa "Centros Poblados", aparecen ambos marcadores.

## Solución Implementada

Se modificó el método `cargarCentrosPoblados()` para **filtrar automáticamente** el centro poblado que coincide con la localidad principal.

### Código Anterior
```typescript
this.centrosPobladosLayer = L.geoJSON(centrosData as any, {
  pointToLayer: (feature, latlng) => {
    return L.circleMarker(latlng, { ... });
  }
});
```

### Código Nuevo
```typescript
// Filtrar el centro poblado que coincide con la localidad actual
const centrosFiltrados = centrosData.features.filter((f: any) => {
  const nombreCP = f.properties.nombre?.toLowerCase();
  const nombreLocalidad = this.localidad?.nombre?.toLowerCase();
  
  // Si el nombre coincide, no mostrarlo (ya hay marcador azul)
  return nombreCP !== nombreLocalidad;
});

console.log('📊 Centros poblados filtrados:', {
  original: centrosData.features.length,
  filtrados: centrosFiltrados.length,
  excluido: this.localidad?.nombre
});

this.centrosPobladosLayer = L.geoJSON({ 
  type: 'FeatureCollection', 
  features: centrosFiltrados 
} as any, {
  pointToLayer: (feature, latlng) => {
    return L.circleMarker(latlng, { ... });
  }
});
```

## Comportamiento

### Caso 1: Localidad es un Centro Poblado

**Ejemplo:** YUNGUYO (Centro Poblado)

**Antes:**
- Marcador azul: YUNGUYO ✓
- Puntos naranjas: 124 centros poblados (incluyendo YUNGUYO) ✗
- **Resultado:** 2 marcadores superpuestos

**Después:**
- Marcador azul: YUNGUYO ✓
- Puntos naranjas: 123 centros poblados (excluyendo YUNGUYO) ✓
- **Resultado:** 1 marcador azul + 123 puntos naranjas

### Caso 2: Localidad NO es un Centro Poblado

**Ejemplo:** PUNO (Distrito/Provincia)

**Antes y Después:**
- Marcador azul: PUNO ✓
- Puntos naranjas: Todos los centros poblados del distrito ✓
- **Resultado:** Sin cambios (no hay duplicados)

## Logs de Consola

Al activar la capa "Centros Poblados" ahora verás:

```
🔄 Toggle capa centros poblados: { mostrar: true, capaExiste: false }
⏳ Iniciando carga de centros poblados...
🔍 Cargando centros poblados de: YUNGUYO
📦 Centros poblados recibidos: {
  total: 124,
  primeros: ["KALAPALLALLA", "HUAYCHANI", "HUANCARANI"]
}
📊 Centros poblados filtrados: {
  original: 124,
  filtrados: 123,
  excluido: "YUNGUYO"
}
🗺️ Capa de centros poblados agregada al mapa
```

## Ventajas

### 1. Claridad Visual
- ✅ No hay marcadores superpuestos
- ✅ El marcador azul destaca la localidad principal
- ✅ Los puntos naranjas muestran otros centros poblados

### 2. Mejor UX
- ✅ Menos confusión para el usuario
- ✅ Más fácil identificar la localidad principal
- ✅ Mapa más limpio y profesional

### 3. Rendimiento
- ✅ Un marcador menos que renderizar
- ✅ Menos eventos de clic que manejar
- ✅ Filtrado eficiente en el cliente

## Casos Especiales

### Nombres Similares pero No Idénticos

Si hay centros poblados con nombres similares pero no idénticos, se mostrarán ambos:

**Ejemplo:**
- Localidad: "YUNGUYO"
- Centros poblados: "YUNGUYO CUCHO", "SUMO YUNGUYO"
- **Resultado:** Se muestran todos (nombres diferentes)

### Comparación Case-Insensitive

El filtro usa `.toLowerCase()` para comparar, por lo que:
- "YUNGUYO" = "yunguyo" = "Yunguyo" → Se filtra ✓
- "YUNGUYO" ≠ "YUNGUYO CUCHO" → No se filtra ✓

## Alternativas Consideradas

### Opción 1: Cambiar Color del Marcador
- Cambiar el punto naranja a otro color cuando coincide
- **Descartada:** Aún habría dos marcadores superpuestos

### Opción 2: Ocultar Marcador Azul
- Ocultar el marcador azul cuando se activa la capa
- **Descartada:** El marcador azul es importante para identificar la localidad

### Opción 3: Filtrar en el Backend
- Agregar parámetro para excluir un centro poblado específico
- **Descartada:** Más complejo, el filtrado en cliente es suficiente

### Opción 4: Filtrar en el Cliente (SELECCIONADA)
- Filtrar después de recibir los datos
- **Ventajas:** Simple, eficiente, no requiere cambios en backend

## Archivos Modificados

### Frontend
- `frontend/src/app/components/localidades/mapa-localidad-modal.component.ts`
  - Método `cargarCentrosPoblados()` actualizado
  - Agregado filtro de duplicados
  - Agregado log de centros filtrados

## Testing

Para verificar que funciona:

1. Buscar "YUNGUYO" en la tabla de localidades
2. Abrir el mapa del centro poblado YUNGUYO
3. Activar pantalla completa
4. Activar la capa "Centros Poblados"
5. Verificar que:
   - ✅ Solo hay UN marcador en la ubicación de YUNGUYO (azul)
   - ✅ Los demás centros poblados aparecen como puntos naranjas
   - ✅ En la consola dice "filtrados: 123" (uno menos que el total)

## Fecha de Implementación

7 de marzo de 2026
