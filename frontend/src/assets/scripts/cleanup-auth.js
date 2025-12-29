/**
 * Script de limpieza de autenticación corrupta
 * Ejecutar en la consola del navegador si hay problemas de autenticación
 */

function cleanupAuthData() {
    console.log('🔧 Iniciando limpieza de datos de autenticación...');
    
    // Obtener datos actuales
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('📊 Datos actuales:', { token, user });
    
    // Lista de valores corruptos
    const corruptedValues = ['undefined', 'null', '', 'false', 'true', '0'];
    
    let cleaned = false;
    
    // Verificar token
    if (token && corruptedValues.includes(token.toLowerCase().trim())) {
        console.log('🚨 Token corrupto detectado:', token);
        localStorage.removeItem('token');
        cleaned = true;
    }
    
    // Verificar usuario
    if (user && corruptedValues.includes(user.toLowerCase().trim())) {
        console.log('🚨 Usuario corrupto detectado:', user);
        localStorage.removeItem('user');
        cleaned = true;
    }
    
    // Verificar longitud del token
    if (token && token.length < 10) {
        console.log('🚨 Token demasiado corto:', token);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        cleaned = true;
    }
    
    if (cleaned) {
        console.log('✅ Limpieza completada. Recarga la página.');
        alert('Datos de autenticación limpiados. La página se recargará automáticamente.');
        window.location.reload();
    } else {
        console.log('ℹ️ No se encontraron datos corruptos.');
    }
}

// Función para verificar el estado actual
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('📊 Estado de autenticación:');
    console.log('Token:', token);
    console.log('Usuario:', user);
    console.log('Token válido:', token && token !== 'undefined' && token !== 'null' && token.length > 10);
    
    if (user) {
        try {
            const parsedUser = JSON.parse(user);
            console.log('Usuario parseado:', parsedUser);
        } catch (error) {
            console.log('❌ Error parseando usuario:', error);
        }
    }
}

// Función para limpiar completamente
function forceCleanAuth() {
    console.log('🔥 Limpieza forzada de todos los datos de autenticación...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    console.log('✅ Limpieza forzada completada. Recarga la página.');
    alert('Todos los datos de autenticación han sido eliminados. La página se recargará.');
    window.location.reload();
}

// Exponer funciones globalmente para uso en consola
window.cleanupAuthData = cleanupAuthData;
window.checkAuthStatus = checkAuthStatus;
window.forceCleanAuth = forceCleanAuth;

console.log('🛠️ Scripts de limpieza de autenticación cargados.');
console.log('Funciones disponibles:');
console.log('- cleanupAuthData(): Limpiar datos corruptos');
console.log('- checkAuthStatus(): Verificar estado actual');
console.log('- forceCleanAuth(): Limpieza forzada completa');