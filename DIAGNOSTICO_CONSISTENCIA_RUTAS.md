# 🔍 Diagnóstico: Consistencia de Datos de Rutas

## 📊 Análisis de Flujo de Datos

### 1. Backend → Frontend (getRutas)
```
Backend API (/rutas/)
    ↓
RutaService.getRutas()
    ↓
transformRutaData()
    ↓
extractLocalidad() - Extrae origen/destino con coordenadas
extractItinerario() - Extrae paradas con coordenadas
extractEmpresa() - Extrae empresa
extractResolucion() - Extrae resolución
    ↓
Ruta[] (con coordenadas)
    ↓
MapaRutasComponent recibe [rutas]
```

---

## 🔧 Puntos de Verificación

### 1. **Backend - Estructura de Datos**

**Verificar que el backend retorna:**
```json
{
  "id": "...",
  "codigoRuta": "...",
  "origen": {
    "id": "...",
    "nombre": "...",
    "coordenadas": {
      "latitud": -15.5,
      "longitud": -70.1
    }
  },
  "destino": {
    "id": "...",
    "nombre": "...",
    "coordenadas": {
      "latitud": -15.8,
      "longitud": -70.3
    }
  },
  "itinerario": [
    {
      "id": "...",
      "nombre": "...",
      "orden": 1,
      "coordenadas": {
        "latitud": -15.6,
        "longitud": -70.2
      }
    }
  ]
}
```

### 2. **Frontend - Transformación de Datos**

**En `ruta.service.ts`:**
- ✅ `extractLocalidad()` incluye `coordenadas`
- ✅ `extractItinerario()` incluye `coordenadas`
- ✅ `transformRutaData()` llama a ambos métodos

**Verificar en Console:**
```javascript
// En el navegador, abrir DevTools
// Ir a /rutas/estadisticas
// En Console:
fetch('/api/v1/rutas/', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
.then(r => r.json())
.then(rutas => {
  console.log('Rutas:', rutas);
  console.log('Primera ruta:', rutas[0]);
  console.log('Origen:', rutas[0].origen);
  console.log('Coordenadas origen:', rutas[0].origen?.coordenadas);
});
```

### 3. **Frontend - Componente de Estadísticas**

**Verificar que recibe rutas:**
```javascript
// En Console, después de cargar /rutas/estadisticas
const component = document.querySelector('app-rutas-estadisticas');
console.log('Componente:', component);

// Verificar que el mapa recibe rutas
const mapa = document.querySelector('app-mapa-rutas');
console.log('Mapa:', mapa);
console.log('Rutas en mapa:', mapa.getAttribute('ng-reflect-rutas'));
```

### 4. **Frontend - Componente de Mapa**

**Verificar que renderiza rutas:**
```javascript
// En Console
const mapaContainer = document.getElementById('mapa-rutas');
console.log('Contenedor mapa:', mapaContainer);
console.log('Altura:', mapaContainer?.offsetHeight);
console.log('Ancho:', mapaContainer?.offsetWidth);

// Verificar que Leaflet está cargado
console.log('Leaflet:', window.L);

// Verificar marcadores
const markers = document.querySelectorAll('.leaflet-marker-pane circle');
console.log('Marcadores:', markers.length);
```

---

## 🐛 Problemas Comunes

### Problema 1: Rutas sin coordenadas en el backend
**Síntoma**: El mapa no muestra rutas
**Causa**: Backend no retorna `coordenadas` en origen/destino
**Solución**: Verificar que las localidades en el backend tienen coordenadas

### Problema 2: Coordenadas no se extraen correctamente
**Síntoma**: Rutas se cargan pero sin coordenadas
**Causa**: Nombres de campos diferentes en backend
**Solución**: Revisar `extractLocalidad()` y agregar variaciones de nombres

### Problema 3: Mapa no se renderiza
**Síntoma**: Tab del mapa está vacío
**Causa**: Contenedor sin altura o Leaflet no cargado
**Solución**: Verificar estilos CSS y que Leaflet está en `styles.scss`

### Problema 4: Popups no funcionan
**Síntoma**: Click en rutas no muestra información
**Causa**: Datos no se pasan correctamente al popup
**Solución**: Verificar que `ruta.codigoRuta` y nombres existen

---

## 📋 Checklist de Verificación

### Backend
- [ ] Endpoint `/api/v1/rutas/` retorna rutas
- [ ] Cada ruta tiene `origen` con `coordenadas`
- [ ] Cada ruta tiene `destino` con `coordenadas`
- [ ] Itinerario tiene `coordenadas` en paradas
- [ ] Coordenadas tienen `latitud` y `longitud`

### Frontend - Servicio
- [ ] `getRutas()` se ejecuta sin errores
- [ ] `transformRutaData()` transforma correctamente
- [ ] `extractLocalidad()` extrae coordenadas
- [ ] `extractItinerario()` extrae coordenadas

### Frontend - Componente
- [ ] `rutas-estadisticas.component.ts` carga rutas
- [ ] `mapa-rutas.component.ts` recibe rutas
- [ ] Mapa se renderiza en el tab
- [ ] Marcadores aparecen en el mapa

### Datos
- [ ] Total de rutas > 0
- [ ] Rutas con coordenadas > 0
- [ ] Marcadores verdes (origen) visibles
- [ ] Marcadores rojos (destino) visibles
- [ ] Líneas de rutas visibles

---

## 🔧 Soluciones Rápidas

### Si no hay rutas:
1. Verificar que hay rutas en la base de datos
2. Verificar que el token de autenticación es válido
3. Verificar que el endpoint es correcto

### Si hay rutas pero sin coordenadas:
1. Verificar que las localidades tienen coordenadas
2. Revisar nombres de campos en backend
3. Actualizar `extractLocalidad()` si es necesario

### Si el mapa no se ve:
1. Verificar que el contenedor tiene altura
2. Verificar que Leaflet está cargado
3. Abrir DevTools y buscar errores

### Si los popups no funcionan:
1. Verificar que `ruta.codigoRuta` existe
2. Verificar que `ruta.origen.nombre` existe
3. Verificar que `ruta.destino.nombre` existe

---

## 📝 Comandos Útiles

### Verificar rutas en backend:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/rutas/ | jq '.[0]'
```

### Verificar estructura de ruta:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/rutas/ | jq '.[0] | {id, codigoRuta, origen, destino}'
```

### Verificar coordenadas:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/rutas/ | jq '.[0] | {origen: .origen.coordenadas, destino: .destino.coordenadas}'
```

---

## 🎯 Próximos Pasos

1. Ejecutar verificaciones en Console
2. Revisar respuesta del backend
3. Validar que coordenadas se extraen correctamente
4. Confirmar que mapa se renderiza
5. Probar interactividad del mapa
