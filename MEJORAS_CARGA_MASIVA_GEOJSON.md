# 🔧 Mejoras para Carga Masiva GeoJSON

## Cambios Realizados

### 1. Archivos Disponibles Actualizados ✅
```typescript
// ANTES (incorrecto - sin coordenadas)
archivosDisponibles = [
  'puno-provincias.geojson',
  'puno-distritos.geojson',
  'puno-provincias-point.geojson',
  'puno-distritos-point.geojson'
];

// DESPUÉS (correcto - con coordenadas)
archivosDisponibles = [
  'puno-provincias-point.geojson',    // ✅ Con coordenadas
  'puno-distritos-point.geojson',     // ✅ Con coordenadas
  'puno-centrospoblados.geojson'      // ✅ Con coordenadas
];
```

## Mejoras Necesarias en el Componente

### 1. Mapeo de UBIGEO Correcto

El componente debe mapear los UBIGEO según el tipo de localidad:

```typescript
// Función para generar UBIGEO correcto
private generarUBIGEO(feature: any, tipo: string): string {
  switch(tipo) {
    case 'PROVINCIA':
      // PROVINCIA: DDPP0000 (8 dígitos)
      // Ejemplo: 21010000 (Departamento 21, Provincia 01)
      const idprov = feature.properties.IDPROV;
      return idprov.toString().padStart(4, '0') + '0000';
    
    case 'DISTRITO':
      // DISTRITO: DDPPDD00 (8 dígitos)
      // Ejemplo: 21050200 (Departamento 21, Provincia 05, Distrito 02)
      const ubigeo = feature.properties.UBIGEO;
      return ubigeo.toString().padStart(6, '0') + '00';
    
    case 'CENTRO_POBLADO':
      // CENTRO_POBLADO: DDPPDDCCCC (10 dígitos)
      // Ejemplo: 2110020048 (Departamento 21, Provincia 10, Distrito 02, CCPP 0048)
      const idccpp = feature.properties.IDCCPP;
      return idccpp.toString().padStart(10, '0');
    
    default:
      return '';
  }
}
```

### 2. Extracción de Coordenadas

Todas las coordenadas deben venir del campo `geometry.coordinates`:

```typescript
private extraerCoordenadas(feature: any): { longitud: number; latitud: number } | null {
  const coords = feature.geometry?.coordinates;
  
  if (!coords || coords.length < 2) {
    return null;
  }
  
  // GeoJSON usa [Longitud, Latitud]
  return {
    longitud: coords[0],
    latitud: coords[1]
  };
}
```

### 3. Mapeo de Propiedades por Tipo

```typescript
private mapearLocalidad(feature: any, tipo: string): any {
  const coords = this.extraerCoordenadas(feature);
  const props = feature.properties;
  
  const localidad = {
    nombre: this.extraerNombre(props, tipo),
    tipo: tipo,
    ubigeo: this.generarUBIGEO(feature, tipo),
    departamento: props.NOMB_DEPAR || 'PUNO',
    provincia: props.NOMB_PROVI || props.NOMBPROV || '',
    distrito: props.NOMB_DISTR || props.NOMBDIST || '',
    longitud: coords?.longitud || null,
    latitud: coords?.latitud || null,
    poblacion: props.POBTOTAL || 0,
    fuente: props.FUENTE || 'INEI - CPV2017'
  };
  
  return localidad;
}

private extraerNombre(props: any, tipo: string): string {
  switch(tipo) {
    case 'PROVINCIA':
      return props.NOMBPROV || '';
    case 'DISTRITO':
      return props.NOMBDIST || '';
    case 'CENTRO_POBLADO':
      return props.NOMB_CCPP || '';
    default:
      return '';
  }
}
```

### 4. Validación de Datos

```typescript
private validarLocalidad(localidad: any): { valido: boolean; errores: string[] } {
  const errores: string[] = [];
  
  // Validar nombre
  if (!localidad.nombre || localidad.nombre.trim() === '') {
    errores.push('Nombre vacío');
  }
  
  // Validar UBIGEO
  if (!localidad.ubigeo || localidad.ubigeo.length === 0) {
    errores.push('UBIGEO vacío');
  }
  
  // Validar coordenadas
  if (localidad.longitud === null || localidad.latitud === null) {
    errores.push('Coordenadas faltantes');
  }
  
  // Validar rango de coordenadas (Puno)
  if (localidad.longitud && localidad.latitud) {
    if (localidad.longitud < -72 || localidad.longitud > -68) {
      errores.push('Longitud fuera de rango para Puno');
    }
    if (localidad.latitud < -18 || localidad.latitud > -13) {
      errores.push('Latitud fuera de rango para Puno');
    }
  }
  
  return {
    valido: errores.length === 0,
    errores
  };
}
```

### 5. Procesamiento de Validación Mejorado

```typescript
private procesarValidacion(features: any[], tipo: string) {
  let conCoordenadas = 0;
  let sinCoordenadas = 0;
  let conUbigeo = 0;
  let sinUbigeo = 0;
  const ejemplos: any[] = [];
  const errores: string[] = [];
  
  features.forEach((feature, index) => {
    try {
      const localidad = this.mapearLocalidad(feature, tipo);
      const validacion = this.validarLocalidad(localidad);
      
      if (!validacion.valido) {
        errores.push(`Feature ${index}: ${validacion.errores.join(', ')}`);
      }
      
      // Contar coordenadas
      if (localidad.longitud !== null && localidad.latitud !== null) {
        conCoordenadas++;
      } else {
        sinCoordenadas++;
      }
      
      // Contar UBIGEO
      if (localidad.ubigeo && localidad.ubigeo.length > 0) {
        conUbigeo++;
      } else {
        sinUbigeo++;
      }
      
      // Agregar a ejemplos (primeros 5)
      if (ejemplos.length < 5) {
        ejemplos.push(localidad);
      }
    } catch (error) {
      errores.push(`Feature ${index}: Error procesando - ${error}`);
    }
  });
  
  this.validacion.set({
    totalFeatures: features.length,
    conCoordenadas,
    sinCoordenadas,
    conUbigeo,
    sinUbigeo,
    porProvincia: {},
    porDistrito: {},
    ejemplos,
    errores: errores.slice(0, 10) // Mostrar primeros 10 errores
  });
}
```

## Checklist de Implementación

- [x] Actualizar lista de archivos disponibles (usar -point)
- [ ] Implementar `generarUBIGEO()` con mapeo correcto
- [ ] Implementar `extraerCoordenadas()` desde geometry
- [ ] Implementar `mapearLocalidad()` por tipo
- [ ] Implementar `validarLocalidad()` con validaciones
- [ ] Actualizar `procesarValidacion()` para usar nuevos métodos
- [ ] Agregar manejo de errores detallado
- [ ] Probar con cada tipo de archivo

## Resultado Esperado

Después de estas mejoras:
- ✅ Todos los archivos tendrán coordenadas reales
- ✅ UBIGEO será coherente (8 dígitos para provincias/distritos, 10 para CCPP)
- ✅ Validación detectará datos faltantes o inválidos
- ✅ Preview mostrará datos reales y correctos
- ✅ Importación será más confiable
