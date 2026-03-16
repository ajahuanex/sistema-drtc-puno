# 🔍 Diagnóstico: Rutas sin Coordenadas

## 📊 Situación Actual

- ✅ Total de rutas: 442
- ❌ Rutas con coordenadas: 0
- ❌ Rutas sin coordenadas: 442

**Conclusión**: Las rutas en la base de datos NO tienen coordenadas en los campos `origen` y `destino`.

---

## 🔧 Verificación en Backend

### 1. Verificar estructura de una ruta en el backend

```bash
# Ejecutar en terminal
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/rutas/ | jq '.[0]'
```

**Buscar en la respuesta:**
- ¿Existe `origen`?
- ¿Existe `destino`?
- ¿Tienen `coordenadas`?
- ¿Qué estructura tienen?

### 2. Verificar si las localidades tienen coordenadas

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/localidades/ | jq '.[0]'
```

**Buscar:**
- ¿Existe `coordenadas`?
- ¿Tiene `latitud` y `longitud`?

---

## 🐛 Posibles Problemas

### Problema 1: Rutas no tienen origen/destino embebido
**Síntoma**: Las rutas solo tienen IDs, no objetos completos
**Solución**: Backend debe retornar origen/destino como objetos con coordenadas

### Problema 2: Origen/destino existen pero sin coordenadas
**Síntoma**: Las rutas tienen origen/destino pero sin el campo `coordenadas`
**Solución**: Las localidades deben tener coordenadas

### Problema 3: Nombres de campos diferentes
**Síntoma**: Las coordenadas existen pero con otro nombre
**Solución**: Actualizar `extractLocalidad()` en `ruta.service.ts`

---

## 🔧 Soluciones

### Solución 1: Verificar respuesta del backend

En la consola del navegador, ejecuta:

```javascript
fetch('/api/v1/rutas/', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
.then(r => r.json())
.then(rutas => {
  console.log('Primera ruta:', rutas[0]);
  console.log('Origen:', rutas[0].origen);
  console.log('Destino:', rutas[0].destino);
  console.log('¿Tiene coordenadas origen?', !!rutas[0].origen?.coordenadas);
  console.log('¿Tiene coordenadas destino?', !!rutas[0].destino?.coordenadas);
});
```

### Solución 2: Si las coordenadas tienen otro nombre

Actualizar `extractLocalidad()` en `ruta.service.ts`:

```typescript
private extractLocalidad(ruta: any, tipo: 'origen' | 'destino'): any {
  const localidad = ruta[tipo];
  if (localidad && typeof localidad === 'object') {
    return {
      id: localidad.id || localidad._id || '',
      nombre: localidad.nombre || `Sin ${tipo}`,
      tipo: localidad.tipo || undefined,
      ubigeo: localidad.ubigeo || undefined,
      departamento: localidad.departamento || undefined,
      provincia: localidad.provincia || undefined,
      distrito: localidad.distrito || undefined,
      // Buscar coordenadas con diferentes nombres
      coordenadas: localidad.coordenadas || 
                   localidad.coords || 
                   localidad.location ||
                   (localidad.latitud && localidad.longitud ? {
                     latitud: localidad.latitud,
                     longitud: localidad.longitud
                   } : undefined)
    };
  }
  
  return {
    id: ruta[`${tipo}Id`] || '',
    nombre: ruta[`${tipo}Nombre`] || ruta[tipo] || `Sin ${tipo}`,
    tipo: ruta[`${tipo}Tipo`] || ruta[`${tipo}_tipo`] || undefined,
    ubigeo: ruta[`${tipo}Ubigeo`] || ruta[`${tipo}_ubigeo`] || undefined,
    departamento: ruta[`${tipo}Departamento`] || ruta[`${tipo}_departamento`] || undefined,
    provincia: ruta[`${tipo}Provincia`] || ruta[`${tipo}_provincia`] || undefined,
    distrito: ruta[`${tipo}Distrito`] || ruta[`${tipo}_distrito`] || undefined,
    coordenadas: ruta[`${tipo}Coordenadas`] || 
                 ruta[`${tipo}_coordenadas`] ||
                 ruta[`${tipo}Coords`] ||
                 ruta[`${tipo}_coords`] ||
                 undefined
  };
}
```

### Solución 3: Si las localidades no tienen coordenadas

Necesitas:
1. Agregar coordenadas a las localidades en la base de datos
2. O crear un endpoint que sincronice coordenadas desde el módulo de localidades

---

## 📋 Checklist

- [ ] Verificar estructura de rutas en backend
- [ ] Verificar que origen/destino tienen coordenadas
- [ ] Verificar nombres de campos de coordenadas
- [ ] Actualizar `extractLocalidad()` si es necesario
- [ ] Recargar página y verificar que el mapa muestra rutas

---

## 🎯 Próximos Pasos

1. **Ejecuta el script de verificación** en la consola del navegador
2. **Comparte la respuesta** para identificar la estructura exacta
3. **Actualiza `extractLocalidad()`** si es necesario
4. **Recarga la página** y verifica que el mapa funciona

---

## 📝 Notas

- Las rutas necesitan tener `origen.coordenadas` y `destino.coordenadas`
- Las coordenadas deben tener `latitud` y `longitud`
- Si no existen, el mapa no puede renderizar las rutas
- El componente muestra correctamente el mensaje "No hay rutas con coordenadas"
