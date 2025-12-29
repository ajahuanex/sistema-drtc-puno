// SOLUCIÓN FINAL MEJORADA - MODAL DE RUTAS ESPECÍFICAS
// Ejecutar en la consola del navegador (F12)

console.log('🚀 SOLUCIÓN FINAL MEJORADA - MODAL DE RUTAS ESPECÍFICAS');
console.log('=' .repeat(70));

// Función principal de solución
async function solucionarModalCompleto() {
    console.log('🔧 Iniciando solución completa...');
    
    try {
        // 1. Limpiar datos corruptos
        console.log('🧹 Limpiando datos corruptos...');
        localStorage.clear();
        sessionStorage.clear();
        
        // 2. Obtener token fresco
        console.log('🔐 Obteniendo token fresco...');
        
        const loginResponse = await fetch('http://localhost:8000/api/v1/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: 'username=12345678&password=admin123&grant_type=password'
        });
        
        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }
        
        const loginData = await loginResponse.json();
        const realToken = loginData.access_token;
        
        // Verificar que es token real
        if (!realToken || realToken.includes('mock') || realToken.length < 20) {
            throw new Error('Token inválido recibido: ' + realToken);
        }
        
        console.log('✅ Token JWT real obtenido:', realToken.substring(0, 30) + '...');
        
        // 3. Guardar token y usuario
        localStorage.setItem('token', realToken);
        
        const userData = {
            id: loginData.user?.id || '1',
            dni: loginData.user?.dni || '12345678',
            nombres: loginData.user?.nombres || 'Administrador',
            apellidos: loginData.user?.apellidos || 'del Sistema',
            email: loginData.user?.email || 'admin@drtc.gob.pe',
            rolId: loginData.user?.rolId || 'administrador',
            estaActivo: loginData.user?.estaActivo !== false,
            fechaCreacion: loginData.user?.fechaCreacion || new Date().toISOString()
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('✅ Usuario completo guardado');
        
        // 4. Probar endpoints para verificar velocidad
        console.log('🧪 Probando velocidad de endpoints...');
        
        const headers = {'Authorization': 'Bearer ' + realToken};
        
        const testEndpoints = [
            {url: '/resoluciones', name: 'Resoluciones'},
            {url: '/rutas', name: 'Rutas'},
            {url: '/rutas-especificas/vehiculo/694da819e46133e7b09e981c', name: 'Rutas específicas'}
        ];
        
        let allFast = true;
        
        for (const endpoint of testEndpoints) {
            const startTime = Date.now();
            
            try {
                const response = await fetch(`http://localhost:8000/api/v1${endpoint.url}`, {
                    headers,
                    signal: AbortSignal.timeout(10000) // 10 segundos timeout
                });
                
                const elapsed = Date.now() - startTime;
                
                if (response.ok) {
                    if (elapsed > 5000) {
                        console.log(`⚠️ ${endpoint.name}: ${elapsed}ms (LENTO)`);
                        allFast = false;
                    } else {
                        console.log(`✅ ${endpoint.name}: ${elapsed}ms (OK)`);
                    }
                } else {
                    console.log(`❌ ${endpoint.name}: Status ${response.status}`);
                }
                
            } catch (error) {
                console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
                allFast = false;
            }
        }
        
        // 5. Mostrar instrucciones basadas en la velocidad
        console.log('\n' + '=' .repeat(70));
        console.log('📊 DIAGNÓSTICO COMPLETADO');
        console.log('=' .repeat(70));
        
        if (allFast) {
            console.log('✅ Todos los endpoints responden rápido');
            console.log('🎯 El modal debería cargar en menos de 10 segundos');
        } else {
            console.log('⚠️ Algunos endpoints son lentos');
            console.log('⏳ El modal puede tardar 15-30 segundos en cargar');
        }
        
        console.log('\n🔄 Recargando página en 3 segundos...');
        
        setTimeout(() => {
            window.location.reload();
        }, 3000);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error en la solución:', error);
        return false;
    }
}

// Función para monitorear el modal
function monitorearModal() {
    console.log('👁️ Monitoreando modal...');
    
    // Buscar el modal en el DOM
    const checkModal = () => {
        const modal = document.querySelector('app-gestionar-rutas-especificas-modal');
        const loadingText = document.querySelector('.loading-container');
        
        if (modal) {
            console.log('📋 Modal detectado en el DOM');
            
            if (loadingText) {
                console.log('⏳ Modal está cargando... Ten paciencia (puede tardar hasta 30 segundos)');
            } else {
                console.log('✅ Modal cargado completamente');
            }
        }
    };
    
    // Verificar cada 2 segundos
    const interval = setInterval(checkModal, 2000);
    
    // Detener después de 1 minuto
    setTimeout(() => {
        clearInterval(interval);
        console.log('⏰ Monitoreo del modal finalizado');
    }, 60000);
}

// Función para ayudar con el botón guardar
function ayudarConGuardar() {
    console.log('💾 Consejos para el botón guardar:');
    console.log('1. Selecciona al menos una ruta');
    console.log('2. Haz clic en "Guardar"');
    console.log('3. Ten paciencia - puede tardar hasta 30 segundos');
    console.log('4. NO cierres el modal mientras guarda');
    console.log('5. Si hay timeout, las rutas pueden haberse creado parcialmente');
}

// Verificar estado actual
const currentToken = localStorage.getItem('token');
const currentUser = localStorage.getItem('user');

console.log('🔍 Estado actual:');
console.log('Token:', currentToken ? currentToken.substring(0, 30) + '...' : 'null');
console.log('Usuario:', currentUser ? 'presente' : 'null');

if (!currentToken || currentToken.includes('mock')) {
    console.log('🚨 Token problemático detectado');
    console.log('🔧 Ejecutando solución automática en 2 segundos...');
    
    setTimeout(() => {
        solucionarModalCompleto();
    }, 2000);
} else {
    console.log('✅ Token parece correcto');
    console.log('💡 El modal debería funcionar, pero puede ser lento');
    console.log('⏳ Ten paciencia al abrir el modal y al guardar');
    
    // Iniciar monitoreo
    monitorearModal();
}

// Exponer funciones útiles
window.solucionarModalCompleto = solucionarModalCompleto;
window.monitorearModal = monitorearModal;
window.ayudarConGuardar = ayudarConGuardar;

console.log('\n🛠️ FUNCIONES DISPONIBLES:');
console.log('- solucionarModalCompleto(): Aplicar solución completa');
console.log('- monitorearModal(): Monitorear estado del modal');
console.log('- ayudarConGuardar(): Consejos para el botón guardar');

console.log('\n📋 INSTRUCCIONES FINALES:');
console.log('1. Espera a que se recargue la página');
console.log('2. Ve a Vehículos → Gestionar Rutas Específicas');
console.log('3. Ten paciencia - puede tardar hasta 30 segundos');
console.log('4. Selecciona rutas y guarda con paciencia');
console.log('5. Si hay problemas, ejecuta las funciones disponibles');

console.log('\n⏳ Iniciando en 2 segundos...');