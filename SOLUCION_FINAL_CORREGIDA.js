// SOLUCIÓN FINAL CORREGIDA - MODAL DE RUTAS ESPECÍFICAS
// Ejecutar en la consola del navegador (F12)

console.log('🔧 SOLUCIÓN FINAL - Arreglando problema de token mock...');
console.log('=' .repeat(60));

// 1. Limpiar datos corruptos completamente
localStorage.clear();
sessionStorage.clear();
console.log('✅ Datos limpiados');

// 2. Hacer login real con formato correcto
fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: 'username=12345678&password=admin123&grant_type=password'
})
.then(response => {
    console.log('📊 Status login:', response.status);
    return response.json();
})
.then(data => {
    console.log('📥 Respuesta del servidor:', data);
    
    // 3. Verificar que recibimos un token real
    const realToken = data.access_token;
    if (!realToken || realToken.includes('mock') || realToken.length < 20) {
        throw new Error('Token inválido recibido: ' + realToken);
    }
    
    console.log('✅ Token REAL recibido:', realToken.substring(0, 30) + '...');
    
    // 4. Guardar token real
    localStorage.setItem('token', realToken);
    
    // 5. Crear objeto usuario completo con todas las propiedades requeridas
    const userData = {
        id: data.user?.id || '1',
        dni: data.user?.dni || '12345678',
        nombres: data.user?.nombres || 'Administrador',
        apellidos: data.user?.apellidos || 'del Sistema',
        email: data.user?.email || 'admin@drtc.gob.pe',
        rolId: data.user?.rolId || 'administrador',
        estaActivo: data.user?.estaActivo !== false,
        fechaCreacion: data.user?.fechaCreacion || new Date().toISOString()
    };
    
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('✅ Usuario completo guardado:', userData);
    
    // 6. Verificar que el token funciona con el endpoint problemático
    const vehiculoId = '694da819e46133e7b09e981c';
    return fetch(`http://localhost:8000/api/v1/rutas-especificas/vehiculo/${vehiculoId}`, {
        headers: {'Authorization': 'Bearer ' + realToken}
    });
})
.then(response => {
    console.log('🧪 Test endpoint rutas específicas - Status:', response.status);
    
    if (response.status === 200) {
        console.log('✅ TOKEN FUNCIONA CORRECTAMENTE CON RUTAS ESPECÍFICAS');
        console.log('🎉 PROBLEMA SOLUCIONADO');
        console.log('🔄 Recargando página en 2 segundos...');
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } else if (response.status === 401) {
        console.error('❌ Token aún no funciona - Status 401');
        throw new Error('Token rechazado por el servidor');
    } else {
        console.log('⚠️ Respuesta inesperada:', response.status);
        console.log('🔄 Recargando página de todas formas...');
        setTimeout(() => window.location.reload(), 2000);
    }
})
.catch(error => {
    console.error('❌ Error en el proceso:', error);
    console.log('🔧 Solución manual:');
    console.log('1. Recarga la página (F5)');
    console.log('2. Haz logout y login nuevamente');
    console.log('3. Usa DNI: 12345678, Password: admin123');
});

console.log('⏳ Procesando solución...');