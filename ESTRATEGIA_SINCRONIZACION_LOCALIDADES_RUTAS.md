# Estrategia de Sincronización de Localidades en Rutas

## Objetivo

Sincronizar todas las localidades en rutas con los datos más precisos y completos del módulo de localidades, priorizando la información más específica para obtener coordenadas exactas en mapas.

---

## Prioridad de Localidades

### 🎯 Orden de Prioridad (de mayor a menor especificidad):

1. **CENTRO_POBLADO** ⭐⭐⭐
   - Más específico
   - Tiene coordenadas exactas
   - Ideal para mapas precisos
   - Ejemplo: "Yunguyo" (centro poblado)

2. **DISTRITO** ⭐⭐
   - Nivel intermedio
   - Tiene coordenadas del centroide del distrito
   - Útil cuando no hay centro poblado
   - Ejemplo: "Yunguyo" (distrito)

3. **PROVINCIA** ⭐
   - Menos específico
   - Coordenadas del centroide de la provincia
   - Solo si no hay distrito ni centro poblado
   - Ejemplo: "Yunguyo" (provincia)

---

## Lógica de Sincronización

### Caso 1: Localidad es CENTRO_POBLADO
```
✅ Usar directamente
- Ya tiene la máxima especificidad
- Coordenadas exactas disponibles
```

### Caso 2: Localidad es DISTRITO
```
1. Buscar si existe CENTRO_POBLADO con el mismo nombre
   - Mismo departamento
   - Misma provincia
   - Mismo distrito
   
2. Si existe CENTRO_POBLADO:
   ✅ Usar el CENTRO_POBLADO (más específico)
   
3. Si NO existe CENTRO_POBLADO:
   ✅ Usar el DISTRITO
```

### Caso 3: Localidad es PROVINCIA
```
1. Buscar si existe CENTRO_POBLADO con el mismo nombre
   - Mismo departamento
   - Misma provincia
   
2. Si existe CENTRO_POBLADO:
   ✅ Usar el CENTRO_POBLADO (más específico)
   
3. Si NO existe CENTRO_POBLADO, buscar DISTRITO
   - Mismo departamento
   - Misma provincia
   
4. Si existe DISTRITO:
   ✅ Usar el DISTRITO (más específico que provincia)
   
5. Si NO existe ni CENTRO_POBLADO ni DISTRITO:
   ✅ Usar la PROVINCIA
```

---

## Ejemplo Práctico: Yunguyo

### Escenario:
Una ruta tiene como origen "Yunguyo" que está registrado como PROVINCIA.

### Proceso de Sincronización:

```
1. Detectar que "Yunguyo" es PROVINCIA
   
2. Buscar CENTRO_POBLADO "Yunguyo":
   - departamento: "PUNO"
   - provincia: "YUNGUYO"
   ✅ ENCONTRADO: Yunguyo (CENTRO_POBLADO)
   
3. Resultado:
   - Actualizar ruta con Yunguyo (CENTRO_POBLADO)
   - Incluir coordenadas exactas del centro poblado
   - Mejor precisión en mapas
```

### Datos Actualizados:
```json
{
  "origen": {
    "id": "67890...",
    "nombre": "Yunguyo",
    "tipo": "CENTRO_POBLADO",
    "ubigeo": "211301",
    "departamento": "PUNO",
    "provincia": "YUNGUYO",
    "distrito": "YUNGUYO",
    "coordenadas": {
      "latitud": -16.2467,
      "longitud": -69.0833
    }
  }
}
```

---

## Beneficios

### 1. Coordenadas Precisas
- ✅ Mapas más exactos
- ✅ Mejor visualización de rutas
- ✅ Cálculo de distancias más preciso

### 2. Información Completa
- ✅ Tipo de localidad
- ✅ Ubigeo completo
- ✅ Jerarquía territorial (departamento, provincia, distrito)
- ✅ Coordenadas geográficas

### 3. Consistencia de Datos
- ✅ Todas las rutas con información actualizada
- ✅ Sincronización con módulo de localidades
- ✅ Datos territoriales completos

---

## Estructura de Datos

### LocalidadEmbebida (Actualizada)

```typescript
interface LocalidadEmbebida {
  id: string;                    // ID de la localidad
  nombre: string;                // Nombre de la localidad
  tipo?: string;                 // CENTRO_POBLADO, DISTRITO, PROVINCIA
  ubigeo?: string;               // Código UBIGEO
  departamento?: string;         // Departamento
  provincia?: string;            // Provincia
  distrito?: string;             // Distrito
  coordenadas?: {                // ✅ NUEVO: Coordenadas para mapas
    latitud: number;
    longitud: number;
  };
}
```

### Ejemplo de Ruta Sincronizada

```json
{
  "id": "ruta123",
  "codigoRuta": "01",
  "nombre": "Juliaca - Yunguyo",
  "origen": {
    "id": "loc1",
    "nombre": "Juliaca",
    "tipo": "CENTRO_POBLADO",
    "ubigeo": "210801",
    "departamento": "PUNO",
    "provincia": "SAN ROMAN",
    "distrito": "JULIACA",
    "coordenadas": {
      "latitud": -15.5,
      "longitud": -70.13
    }
  },
  "destino": {
    "id": "loc2",
    "nombre": "Yunguyo",
    "tipo": "CENTRO_POBLADO",
    "ubigeo": "211301",
    "departamento": "PUNO",
    "provincia": "YUNGUYO",
    "distrito": "YUNGUYO",
    "coordenadas": {
      "latitud": -16.2467,
      "longitud": -69.0833
    }
  },
  "itinerario": [
    {
      "id": "loc3",
      "nombre": "Puno",
      "tipo": "CENTRO_POBLADO",
      "ubigeo": "210101",
      "departamento": "PUNO",
      "provincia": "PUNO",
      "distrito": "PUNO",
      "coordenadas": {
        "latitud": -15.8402,
        "longitud": -70.0219
      },
      "orden": 1
    }
  ]
}
```

---

## Endpoints de Sincronización

### 1. Verificar Estado
```http
GET /rutas/verificar-sincronizacion
```

**Respuesta:**
```json
{
  "total_rutas": 150,
  "rutas_con_info_completa": 45,
  "porcentaje_completo": 30.0,
  "rutas_sin_tipo": 105,
  "rutas_sin_ubigeo": 80,
  "rutas_sin_departamento": 60,
  "necesita_sincronizacion": true
}
```

### 2. Ejecutar Sincronización
```http
POST /rutas/sincronizar-localidades
```

**Respuesta:**
```json
{
  "mensaje": "Sincronización completada",
  "total_rutas": 150,
  "rutas_actualizadas": 105,
  "rutas_con_errores": 0,
  "errores": []
}
```

---

## Uso en Mapas

### Antes de la Sincronización:
```javascript
// ❌ Sin coordenadas
{
  "origen": {
    "id": "loc1",
    "nombre": "Yunguyo"
  }
}
// No se puede mostrar en el mapa
```

### Después de la Sincronización:
```javascript
// ✅ Con coordenadas
{
  "origen": {
    "id": "loc1",
    "nombre": "Yunguyo",
    "tipo": "CENTRO_POBLADO",
    "coordenadas": {
      "latitud": -16.2467,
      "longitud": -69.0833
    }
  }
}
// Se puede mostrar en el mapa con precisión
```

### Ejemplo de Uso en Leaflet:
```typescript
// Mostrar origen en el mapa
if (ruta.origen.coordenadas) {
  L.marker([
    ruta.origen.coordenadas.latitud,
    ruta.origen.coordenadas.longitud
  ]).addTo(map)
    .bindPopup(`Origen: ${ruta.origen.nombre}`);
}

// Dibujar línea de ruta
if (ruta.origen.coordenadas && ruta.destino.coordenadas) {
  L.polyline([
    [ruta.origen.coordenadas.latitud, ruta.origen.coordenadas.longitud],
    [ruta.destino.coordenadas.latitud, ruta.destino.coordenadas.longitud]
  ], {color: 'blue'}).addTo(map);
}
```

---

## Pasos para Ejecutar

### 1. Verificar Estado Actual
```bash
curl http://localhost:8000/rutas/verificar-sincronizacion
```

### 2. Ejecutar Sincronización
```bash
curl -X POST http://localhost:8000/rutas/sincronizar-localidades
```

### 3. Verificar Resultado
```bash
curl http://localhost:8000/rutas/verificar-sincronizacion
```

### 4. Verificar en Frontend
- Abrir módulo de rutas
- Inspeccionar datos de una ruta
- Verificar que tenga información territorial completa
- Verificar que tenga coordenadas

---

## Notas Importantes

### ⚠️ Consideraciones:

1. **Backup**: Hacer backup de la base de datos antes de sincronizar
2. **Tiempo**: La sincronización puede tomar varios minutos dependiendo del número de rutas
3. **Logs**: Revisar logs del backend para ver el progreso
4. **Validación**: Verificar algunas rutas manualmente después de la sincronización

### ✅ Ventajas:

1. **Automático**: No requiere intervención manual
2. **Inteligente**: Busca la localidad más específica disponible
3. **Completo**: Actualiza origen, destino e itinerario
4. **Seguro**: No elimina datos, solo los enriquece

---

**Fecha de Creación:** 2026-03-08
**Estado:** ✅ Implementado y listo para ejecutar
