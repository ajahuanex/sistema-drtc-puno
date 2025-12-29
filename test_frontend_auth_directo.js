// Script para ejecutar en la consola del navegador para diagnosticar el problema de autenticación
// Abrir DevTools (F12) y pegar este código en la consola

console.log('🔍 DIAGNÓSTICO DE AUTENTICACIÓN DEL FRONTEND');
console.log('=' .repeat(60));

// Paso 1: Verificar localStorage
console.log('\n📋 Paso 1: Verificar localStorage');
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

console.log('Token en localStorage:', token);
console.log('Usuario en localStorage:', user);

if (!token || token === 'undefined' || token === 'null') {
    console.log('❌ Token inválido o faltante');
    console.log('🔧 Ejecutando login manual...');
    
    // Hacer login manual
    const loginData = new FormData();
    loginData.append('username', '12345678');
    loginData.append('password', 'admin123');
    loginData.append('grant_type', 'password');
    
    fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        body: loginData
    })
    .then(response => response.json())
    .then(data => {
        console.log('✅ Login exitoso:', data);
        
        if (data.access_token) {
            localStorage.setItem('token', data.access_token);
            console.log('✅ Token guardado:', data.access_token.substring(0, 30) + '...');
            
            // Crear usuario mock
            const mockUser = {
                id: '1',
                dni: '12345678',
                nombres: 'Admin',
                apellidos: 'Test',
                username: 'admin',
                email: 'admin@test.com',
                is_active: true
            };
            
            localStorage.setItem('user', JSON.stringify(mockUser));
            console.log('✅ Usuario mock guardado');
            
            // Probar endpoint de rutas específicas
            testRutasEspecificas(data.access_token);
        }
    })
    .catch(error => {
        console.error('❌ Error en login:', error);
    });
} else {
    console.log('✅ Token encontrado:', token.substring(0, 30) + '...');
    testRutasEspecificas(token);
}

function testRutasEspecificas(token) {
    console.log('\n📋 Paso 2: Probar endpoint de rutas específicas');
    
    const testVehiculoId = 'test-vehiculo-123';
    const url = `http://localhost:8000/api/v1/rutas-especificas/vehiculo/${testVehiculoId}`;
    
    console.log('🌐 URL a probar:', url);
    console.log('🔑 Token a usar:', token.substring(0, 30) + '...');
    
    fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('📊 Status de respuesta:', response.status);
        console.log('📊 Headers de respuesta:', [...response.headers.entries()]);
        
        if (response.status === 200) {
            return response.json().then(data => {
                console.log('✅ Endpoint funciona correctamente');
                console.log('📋 Datos recibidos:', data);
                console.log('\n🎯 CONCLUSIÓN: El backend funciona, el problema está en el frontend');
                console.log('🔧 Soluciones:');
                console.log('1. Recargar la página (F5)');
                console.log('2. Hacer logout y login nuevamente');
                console.log('3. Limpiar caché del navegador');
            });
        } else if (response.status === 401) {
            console.log('❌ Error de autenticación');
            return response.text().then(text => {
                console.log('📋 Respuesta del servidor:', text);
                console.log('\n🔧 El token no es válido o está expirado');
                console.log('Limpiando localStorage...');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            });
        } else if (response.status === 404) {
            console.log('✅ Endpoint funciona (404 esperado para ID de prueba)');
            console.log('\n🎯 CONCLUSIÓN: El backend funciona correctamente');
        } else {
            return response.text().then(text => {
                console.log('⚠️ Respuesta inesperada:', text);
            });
        }
    })
    .catch(error => {
        console.error('❌ Error en petición:', error);
        console.log('\n🔧 Posibles causas:');
        console.log('1. Backend no está ejecutándose');
        console.log('2. Problema de CORS');
        console.log('3. URL incorrecta');
    });
}

// Paso 3: Verificar configuración del Angular
console.log('\n📋 Paso 3: Verificar configuración Angular');
console.log('🌐 URL actual:', window.location.href);
console.log('🔧 Para probar el modal de rutas específicas:');
console.log('1. Ve a la página de vehículos');
console.log('2. Haz clic en "Gestionar Rutas Específicas" de cualquier vehículo');
console.log('3. Observa la consola para errores');

// Función auxiliar para limpiar todo
window.limpiarAuth = function() {
    console.log('🧹 Limpiando datos de autenticación...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    console.log('✅ Datos limpiados. Recarga la página (F5)');
};

console.log('\n🛠️ FUNCIONES DISPONIBLES:');
console.log('- limpiarAuth(): Limpia todos los datos de autenticación');

console.log('\n✅ Diagnóstico completado. Revisa los resultados arriba.');