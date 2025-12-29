
// 🔍 DEBUG: Verificar estado del frontend
// Ejecutar en consola del navegador

console.log('🔍 Verificando estado del frontend...');

// 1. Verificar token
const token = localStorage.getItem('token');
console.log('Token presente:', !!token);
console.log('Token válido:', token && token !== 'undefined' && token !== 'null');
if (token) {
    console.log('Token (30 chars):', token.substring(0, 30) + '...');
}

// 2. Verificar usuario
const user = localStorage.getItem('user');
console.log('Usuario presente:', !!user);
if (user) {
    try {
        const userData = JSON.parse(user);
        console.log('Usuario:', userData);
    } catch (e) {
        console.log('Error parseando usuario:', e);
    }
}

// 3. Verificar datos en memoria (si están disponibles)
if (window.angular && window.angular.getComponent) {
    console.log('Angular detectado, verificando componentes...');
}

// 4. Verificar localStorage completo
console.log('LocalStorage completo:');
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`  ${key}:`, value?.substring(0, 50) + (value?.length > 50 ? '...' : ''));
}

// 5. Verificar si hay errores de red
console.log('Verificar Network tab para errores 403/401');
