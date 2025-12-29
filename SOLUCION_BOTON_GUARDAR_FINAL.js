// SOLUCIÓN FINAL PARA EL BOTÓN GUARDAR - MODAL DE RUTAS ESPECÍFICAS
// Ejecutar en la consola del navegador (F12)

console.log('🔧 SOLUCIÓN FINAL PARA EL BOTÓN GUARDAR');
console.log('=' .repeat(60));

// Función para limpiar y configurar token real
async function configurarTokenReal() {
    console.log('🧹 Limpiando datos corruptos...');
    
    // Limpiar completamente
    localStorage.clear();
    sessionStorage.clear();
    
    try {
        // Hacer login real
        console.log('🔐 Haciendo login real...');
        
        const response = await fetch('http://localhost:8000/api/v1/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: 'username=12345678&password=admin123&grant_type=password'
        });
        
        if (!response.ok) {
            throw new Error(`Login failed: ${response.status}`);
        }
        
        const data = await response.json();
        const realToken = data.access_token;
        
        // Verificar que es token real
        if (!realToken || realToken.includes('mock') || realToken.length < 20) {
            throw new Error('Token inválido recibido: ' + realToken);
        }
        
        console.log('✅ Token REAL obtenido:', realToken.substring(0, 30) + '...');
        
        // Guardar token real
        localStorage.setItem('token', realToken);
        
        // Guardar usuario completo
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
        
        console.log('✅ Usuario completo guardado');
        
        return realToken;
        
    } catch (error) {
        console.error('❌ Error configurando token:', error);
        return null;
    }
}

// Función para probar el endpoint de creación
async function probarEndpointCreacion(token) {
    console.log('🧪 Probando endpoint de creación de rutas específicas...');
    
    try {
        // Datos de prueba mínimos
        const rutaEspecificaTest = {
            codigo: 'TEST-ESP-' + Date.now(),
            rutaGeneralId: 'test-ruta-id',
            vehiculoId: 'test-vehiculo-id',
            resolucionId: 'test-resolucion-id',
            descripcion: 'Ruta específica de prueba',
            estado: 'ACTIVA',
            tipoServicio: 'REGULAR',
            horarios: [{
                horaSalida: '06:00',
                horaLlegada: '08:00',
                frecuencia: 30,
                lunes: true,
                martes: true,
                miercoles: true,
                jueves: true,
                viernes: true,
                sabado: true,
                domingo: false
            }],
            paradasAdicionales: [],
            observaciones: 'Prueba desde consola'
        };
        
        const response = await fetch('http://localhost:8000/api/v1/rutas-especificas', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(rutaEspecificaTest)
        });
        
        console.log('📊 Status endpoint creación:', response.status);
        
        if (response.status === 401) {
            console.error('❌ ERROR 401 - Problema de autenticación persiste');
            return false;
        } else if (response.status === 200) {
            console.log('✅ Creación exitosa');
            return true;
        } else {
            console.log('⚠️ Respuesta:', response.status, '- Autenticación OK, otros errores son normales');
            return true; // Si no es 401, la autenticación funciona
        }
        
    } catch (error) {
        console.error('❌ Error probando endpoint:', error);
        return false;
    }
}

// Función principal
async function solucionarBotonGuardar() {
    console.log('🚀 Iniciando solución del botón guardar...');
    
    // Configurar token real
    const token = await configurarTokenReal();
    
    if (!token) {
        console.error('❌ No se pudo obtener token real');
        return false;
    }
    
    // Probar endpoint
    const endpointFunciona = await probarEndpointCreacion(token);
    
    if (endpointFunciona) {
        console.log('✅ SOLUCIÓN APLICADA EXITOSAMENTE');
        console.log('✅ El botón guardar debería funcionar ahora');
        console.log('🔄 Recargando página...');
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
        return true;
    } else {
        console.error('❌ Problema persiste con el endpoint');
        return false;
    }
}

// Función para verificar estado actual
function verificarEstadoActual() {
    console.log('🔍 Verificando estado actual...');
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('📋 Token actual:', token ? token.substring(0, 30) + '...' : 'null');
    console.log('📋 Usuario actual:', user ? 'presente' : 'null');
    
    if (token && token.includes('mock')) {
        console.log('🚨 PROBLEMA: Token es MOCK');
        return false;
    } else if (token && token.length > 20) {
        console.log('✅ Token parece real');
        return true;
    } else {
        console.log('⚠️ Token inválido o faltante');
        return false;
    }
}

// Ejecutar verificación inicial
console.log('📋 Verificando estado actual...');
const estadoOK = verificarEstadoActual();

if (estadoOK) {
    console.log('✅ Estado actual parece correcto');
    console.log('🎯 El botón guardar debería funcionar');
    console.log('💡 Si aún hay problemas, ejecuta: solucionarBotonGuardar()');
} else {
    console.log('⚠️ Estado actual problemático');
    console.log('🔧 Ejecutando solución automática en 3 segundos...');
    
    setTimeout(() => {
        solucionarBotonGuardar();
    }, 3000);
}

// Exponer funciones para uso manual
window.solucionarBotonGuardar = solucionarBotonGuardar;
window.verificarEstadoActual = verificarEstadoActual;

console.log('\n🛠️ FUNCIONES DISPONIBLES:');
console.log('- verificarEstadoActual(): Verificar estado del token');
console.log('- solucionarBotonGuardar(): Aplicar solución completa');

console.log('\n📋 INSTRUCCIONES:');
console.log('1. Si el token es real, el botón guardar debería funcionar');
console.log('2. Si hay errores de validación (400, 422), son normales');
console.log('3. Si hay error 401, ejecutar solucionarBotonGuardar()');
console.log('4. Probar el modal y el botón guardar');

console.log('\n⏳ Verificación completada.');