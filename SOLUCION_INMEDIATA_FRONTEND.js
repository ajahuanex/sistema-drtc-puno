// SOLUCIÓN INMEDIATA PARA EL ERROR 401 EN MODAL DE RUTAS ESPECÍFICAS
// Ejecutar este código en la consola del navegador (F12)

console.log('🔧 SOLUCIÓN INMEDIATA - ERROR 401 MODAL RUTAS ESPECÍFICAS');
console.log('=' .repeat(60));

// Función para limpiar completamente los datos de autenticación
function limpiarDatosAuth() {
    console.log('🧹 Limpiando datos de autenticación...');
    
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    // Limpiar sessionStorage
    sessionStorage.clear();
    
    // Limpiar cookies relacionadas con auth
    document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('✅ Datos limpiados completamente');
}

// Función para hacer login manual y obtener token fresco
async function loginManual() {
    console.log('🔐 Haciendo login manual...');
    
    try {
        const formData = new FormData();
        formData.append('username', '12345678');
        formData.append('password', 'admin123');
        formData.append('grant_type', 'password');
        
        const response = await fetch('http://localhost:8000/api/v1/auth/login', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            const token = data.access_token;
            
            console.log('✅ Login exitoso');
            console.log('🔑 Token obtenido:', token.substring(0, 30) + '...');
            
            // Guardar token
            localStorage.setItem('token', token);
            
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
            console.log('✅ Usuario guardado');
            
            return token;
        } else {
            console.error('❌ Error en login:', await response.text());
            return null;
        }
    } catch (error) {
        console.error('❌ Error en login:', error);
        return null;
    }
}

// Función para probar el endpoint problemático
async function probarEndpointRutasEspecificas(token, vehiculoId = '694da81') {
    console.log(`🧪 Probando endpoint de rutas específicas para vehículo: ${vehiculoId}`);
    
    try {
        const response = await fetch(`http://localhost:8000/api/v1/rutas-especificas/vehiculo/${vehiculoId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Status de respuesta:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Endpoint funciona correctamente');
            console.log('📋 Rutas específicas obtenidas:', data.length);
            return true;
        } else if (response.status === 401) {
            console.error('❌ Error 401 - Token inválido o expirado');
            console.log('📋 Respuesta:', await response.text());
            return false;
        } else {
            console.log('⚠️ Respuesta inesperada:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Error en petición:', error);
        return false;
    }
}

// Función para verificar el estado actual del frontend
function verificarEstadoFrontend() {
    console.log('🔍 Verificando estado actual del frontend...');
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('📋 Token en localStorage:', token ? token.substring(0, 30) + '...' : 'null');
    console.log('📋 Usuario en localStorage:', user ? 'presente' : 'null');
    
    // Verificar si hay servicios Angular disponibles
    if (typeof ng !== 'undefined') {
        console.log('✅ Angular detectado');
        
        // Intentar acceder al AuthService si está disponible
        try {
            const authService = ng.getInjector().get('AuthService');
            if (authService) {
                console.log('✅ AuthService encontrado');
                console.log('📋 isAuthenticated():', authService.isAuthenticated());
                console.log('📋 getToken():', authService.getToken() ? authService.getToken().substring(0, 30) + '...' : 'null');
            }
        } catch (e) {
            console.log('⚠️ No se pudo acceder al AuthService');
        }
    } else {
        console.log('⚠️ Angular no detectado o no disponible');
    }
}

// Función principal de solución
async function solucionarProblema() {
    console.log('\n🚀 EJECUTANDO SOLUCIÓN COMPLETA...');
    
    // Paso 1: Verificar estado actual
    verificarEstadoFrontend();
    
    // Paso 2: Limpiar datos corruptos
    limpiarDatosAuth();
    
    // Paso 3: Hacer login fresco
    const token = await loginManual();
    
    if (!token) {
        console.error('❌ No se pudo obtener token válido');
        return false;
    }
    
    // Paso 4: Probar endpoint
    const success = await probarEndpointRutasEspecificas(token);
    
    if (success) {
        console.log('\n✅ PROBLEMA SOLUCIONADO');
        console.log('🔧 Ahora recarga la página (F5) y prueba el modal');
        return true;
    } else {
        console.log('\n❌ El problema persiste');
        return false;
    }
}

// Función para forzar recarga del AuthService (si está disponible)
function forzarRecargaAuthService() {
    console.log('🔄 Intentando forzar recarga del AuthService...');
    
    try {
        // Disparar evento personalizado para que el AuthService se recargue
        window.dispatchEvent(new CustomEvent('auth-reload'));
        
        // Intentar recargar la página después de un breve delay
        setTimeout(() => {
            console.log('🔄 Recargando página...');
            window.location.reload();
        }, 1000);
        
    } catch (e) {
        console.log('⚠️ No se pudo forzar recarga, recarga manualmente la página (F5)');
    }
}

// Ejecutar solución automáticamente
console.log('🎯 Ejecutando solución automática en 2 segundos...');
console.log('⏸️ Presiona Ctrl+C si quieres cancelar');

setTimeout(async () => {
    const exito = await solucionarProblema();
    
    if (exito) {
        console.log('\n🎉 ¡SOLUCIÓN APLICADA EXITOSAMENTE!');
        console.log('📋 Pasos siguientes:');
        console.log('1. La página se recargará automáticamente');
        console.log('2. Haz login con DNI: 12345678, Password: admin123');
        console.log('3. Ve a Vehículos y prueba "Gestionar Rutas Específicas"');
        
        forzarRecargaAuthService();
    } else {
        console.log('\n🔧 SOLUCIÓN MANUAL REQUERIDA:');
        console.log('1. Cierra completamente el navegador');
        console.log('2. Abre el navegador nuevamente');
        console.log('3. Ve a http://localhost:4200');
        console.log('4. Haz login con DNI: 12345678, Password: admin123');
        console.log('5. Prueba el modal de rutas específicas');
    }
}, 2000);

// Exponer funciones para uso manual
window.limpiarAuth = limpiarDatosAuth;
window.loginManual = loginManual;
window.probarRutas = probarEndpointRutasEspecificas;
window.solucionarAuth = solucionarProblema;

console.log('\n🛠️ FUNCIONES DISPONIBLES:');
console.log('- limpiarAuth(): Limpiar datos de autenticación');
console.log('- loginManual(): Hacer login manual');
console.log('- probarRutas(token, vehiculoId): Probar endpoint específico');
console.log('- solucionarAuth(): Ejecutar solución completa');

console.log('\n⏳ Esperando 2 segundos para ejecutar solución automática...');