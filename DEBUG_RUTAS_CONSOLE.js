// 🔍 Script de Depuración para Rutas
// Copia y pega esto en la consola del navegador (F12) en /rutas/estadisticas

console.log('🔍 INICIANDO DIAGNÓSTICO DE RUTAS...\n');

// 1. Verificar que estamos en la página correcta
console.log('📍 Ubicación:', window.location.pathname);
if (!window.location.pathname.includes('estadisticas')) {
  console.warn('⚠️ No estás en /rutas/estadisticas');
}

// 2. Verificar que Leaflet está cargado
console.log('\n📚 Verificando Leaflet...');
if (window.L) {
  console.log('✅ Leaflet cargado:', window.L.version);
} else {
  console.error('❌ Leaflet NO está cargado');
}

// 3. Verificar que el contenedor del mapa existe
console.log('\n🗺️ Verificando contenedor del mapa...');
const mapaContainer = document.getElementById('mapa-rutas');
if (mapaContainer) {
  console.log('✅ Contenedor encontrado');
  console.log('   - Altura:', mapaContainer.offsetHeight, 'px');
  console.log('   - Ancho:', mapaContainer.offsetWidth, 'px');
  console.log('   - Clase:', mapaContainer.className);
} else {
  console.error('❌ Contenedor NO encontrado');
}

// 4. Verificar que el componente de mapa existe
console.log('\n🧩 Verificando componente de mapa...');
const mapaComponent = document.querySelector('app-mapa-rutas');
if (mapaComponent) {
  console.log('✅ Componente encontrado');
  console.log('   - Tag:', mapaComponent.tagName);
  console.log('   - Atributos:', Array.from(mapaComponent.attributes).map(a => `${a.name}="${a.value}"`).join(', '));
} else {
  console.error('❌ Componente NO encontrado');
}

// 5. Verificar que el componente de estadísticas existe
console.log('\n📊 Verificando componente de estadísticas...');
const statsComponent = document.querySelector('app-rutas-estadisticas');
if (statsComponent) {
  console.log('✅ Componente encontrado');
} else {
  console.error('❌ Componente NO encontrado');
}

// 6. Verificar que hay marcadores en el mapa
console.log('\n📍 Verificando marcadores...');
const markers = document.querySelectorAll('.leaflet-marker-pane circle');
console.log(`   - Total marcadores: ${markers.length}`);
if (markers.length > 0) {
  console.log('✅ Hay marcadores en el mapa');
  console.log('   - Primero:', markers[0]);
} else {
  console.warn('⚠️ No hay marcadores en el mapa');
}

// 7. Verificar que hay líneas de rutas
console.log('\n📈 Verificando líneas de rutas...');
const polylines = document.querySelectorAll('.leaflet-pane path[stroke="#667eea"]');
console.log(`   - Total líneas: ${polylines.length}`);
if (polylines.length > 0) {
  console.log('✅ Hay líneas de rutas en el mapa');
} else {
  console.warn('⚠️ No hay líneas de rutas en el mapa');
}

// 8. Verificar que Leaflet tiene un mapa activo
console.log('\n🗺️ Verificando instancia de Leaflet...');
if (window.L && window.L.map) {
  const maps = Object.values(window.L.map._leafletInstances || {});
  console.log(`   - Instancias de mapa: ${maps.length}`);
  if (maps.length > 0) {
    console.log('✅ Hay una instancia de mapa activa');
  } else {
    console.warn('⚠️ No hay instancias de mapa activas');
  }
}

// 9. Verificar estilos CSS
console.log('\n🎨 Verificando estilos CSS...');
const mapaStyle = window.getComputedStyle(mapaContainer);
console.log('   - Display:', mapaStyle.display);
console.log('   - Altura:', mapaStyle.height);
console.log('   - Ancho:', mapaStyle.width);
console.log('   - Posición:', mapaStyle.position);

// 10. Verificar que hay datos en el servicio
console.log('\n💾 Verificando datos en el servicio...');
console.log('   - Para verificar rutas, ejecuta:');
console.log('     fetch("/api/v1/rutas/", {headers: {"Authorization": "Bearer YOUR_TOKEN"}})');
console.log('       .then(r => r.json())');
console.log('       .then(rutas => console.log("Rutas:", rutas))');

// 11. Resumen
console.log('\n📋 RESUMEN:');
console.log('✅ = Verificación pasada');
console.log('⚠️ = Advertencia');
console.log('❌ = Error crítico');

console.log('\n🔧 PRÓXIMOS PASOS:');
console.log('1. Si hay ❌, revisa el documento DIAGNOSTICO_CONSISTENCIA_RUTAS.md');
console.log('2. Si hay ⚠️, verifica que hay datos en el backend');
console.log('3. Si todo está ✅, el mapa debería estar funcionando');

console.log('\n✨ Diagnóstico completado');
