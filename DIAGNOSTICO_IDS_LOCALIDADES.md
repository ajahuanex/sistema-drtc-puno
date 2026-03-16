# 🔍 Diagnóstico: IDs de Localidades en Rutas

## 📋 Script para Verificar en Consola

Copia y pega esto en la consola del navegador (F12) en `/rutas/estadisticas`:

```javascript
console.log('🔍 DIAGNÓSTICO DE IDS DE LOCALIDADES\n');

// 1. Obtener rutas
fetch('/api/v1/rutas/', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
.then(r => r.json())
.then(rutas => {
  console.log('📊 Total rutas:', rutas.length);
  
  if (rutas.length === 0) {
    console.log('❌ No hay rutas');
    return;
  }

  const primeraRuta = rutas[0];
  console.log('\n📍 Primera ruta:');
  console.log('   - ID:', primeraRuta.id);
  console.log('   - Código:', primeraRuta.codigoRuta);
  console.log('   - Nombre:', primeraRuta.nombre);
  
  console.log('\n🔗 Origen:');
  console.log('   - ID:', primeraRuta.origen?.id);
  console.log('   - Nombre:', primeraRuta.origen?.nombre);
  console.log('   - Coordenadas:', primeraRuta.origen?.coordenadas);
  
  console.log('\n🔗 Destino:');
  console.log('   - ID:', primeraRuta.destino?.id);
  console.log('   - Nombre:', primeraRuta.destino?.nombre);
  console.log('   - Coordenadas:', primeraRuta.destino?.coordenadas);
  
  // 2. Obtener localidades
  return fetch('/api/v1/localidades/', {
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
  })
  .then(r => r.json())
  .then(localidades => {
    console.log('\n📊 Total localidades:', localidades.length);
    
    if (localidades.length === 0) {
      console.log('❌ No hay localidades');
      return;
    }

    const primeraLocalidad = localidades[0];
    console.log('\n📍 Primera localidad:');
    console.log('   - ID:', primeraLocalidad.id);
    console.log('   - Nombre:', primeraLocalidad.nombre);
    console.log('   - Coordenadas:', primeraLocalidad.coordenadas);
    
    // 3. Verificar si los IDs de la ruta existen en localidades
    console.log('\n🔍 Verificación de IDs:');
    
    const origenExiste = localidades.some(l => l.id === primeraRuta.origen?.id);
    const destinoExiste = localidades.some(l => l.id === primeraRuta.destino?.id);
    
    console.log('   - Origen ID existe:', origenExiste ? '✅' : '❌');
    console.log('   - Destino ID existe:', destinoExiste ? '✅' : '❌');
    
    // 4. Contar rutas con IDs válidos
    let rutasConIdsValidos = 0;
    let rutasConCoordenadas = 0;
    
    rutas.forEach(ruta => {
      const origenValido = localidades.some(l => l.id === ruta.origen?.id);
      const destinoValido = localidades.some(l => l.id === ruta.destino?.id);
      
      if (origenValido && destinoValido) {
        rutasConIdsValidos++;
      }
      
      if (ruta.origen?.coordenadas && ruta.destino?.coordenadas) {
        rutasConCoordenadas++;
      }
    });
    
    console.log('\n📊 Resumen:');
    console.log('   - Rutas con IDs válidos:', rutasConIdsValidos);
    console.log('   - Rutas con coordenadas:', rutasConCoordenadas);
    console.log('   - Rutas sin IDs válidos:', rutas.length - rutasConIdsValidos);
  });
})
.catch(error => console.error('❌ Error:', error));
```

## 🎯 Qué Buscar

### Si ves:
- ✅ **Origen ID existe: ✅** → Los IDs son válidos
- ❌ **Origen ID existe: ❌** → Los IDs son antiguos/inválidos

### Posibles Problemas:

1. **IDs Antiguos**
   - Las rutas tienen IDs de localidades que ya no existen
   - Solución: Ejecutar sincronización

2. **IDs Válidos pero sin Coordenadas**
   - Los IDs existen pero las localidades no tienen coordenadas
   - Solución: Agregar coordenadas a las localidades

3. **Estructura Diferente**
   - Los datos vienen en formato diferente
   - Solución: Actualizar `extractLocalidad()` en `ruta.service.ts`

## 📝 Pasos

1. Abre la consola (F12)
2. Reemplaza `YOUR_TOKEN` con tu token real
3. Copia y pega el script
4. Comparte los resultados
