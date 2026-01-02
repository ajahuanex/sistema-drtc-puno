// SOLUCIÓN PARA EL BUCLE INFINITO EN LA CONSOLA
// Ejecutar en la consola del navegador (F12)

console.log('🔧 SOLUCIONANDO BUCLE INFINITO EN MODAL DE RUTAS ESPECÍFICAS');
console.log('=' .repeat(70));

// Función para limpiar y reiniciar
function limpiarYReiniciar() {
    console.log('🧹 Limpiando datos y reiniciando...');
    
    // Limpiar localStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Limpiar cualquier interval o timeout que pueda estar ejecutándose
    for (let i = 1; i < 99999; i++) {
        window.clearInterval(i);
        window.clearTimeout(i);
    }
    
    console.log('✅ Intervals y timeouts limpiados');
    
    // Configurar token fresco
    fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: 'username=12345678&password=admin123&grant_type=password'
    })
    .then(response => response.json())
    .then(data => {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify({
            id: data.user?.id || '1',
            dni: '12345678',
            nombres: data.user?.nombres || 'Administrador',
            apellidos: data.user?.apellidos || 'del Sistema',
            email: data.user?.email || 'admin@sirret.gob.pe',
            rolId: data.user?.rolId || 'administrador',
            estaActivo: true,
            fechaCreacion: data.user?.fechaCreacion || new Date().toISOString()
        }));
        
        console.log('✅ Token configurado');
        console.log('🔄 Recargando página para aplicar correcciones...');
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    })
    .catch(error => {
        console.error('❌ Error configurando token:', error);
        console.log('🔄 Recargando página de todas formas...');
        setTimeout(() => window.location.reload(), 2000);
    });
}

// Función para monitorear la consola
function monitorearConsola() {
    console.log('👁️ Monitoreando actividad de la consola...');
    
    let contadorLogs = 0;
    let ultimoLog = Date.now();
    
    // Interceptar console.log para detectar bucles
    const originalLog = console.log;
    console.log = function(...args) {
        contadorLogs++;
        ultimoLog = Date.now();
        
        // Si hay más de 100 logs en 5 segundos, puede ser un bucle
        if (contadorLogs > 100) {
            console.warn('🚨 POSIBLE BUCLE DETECTADO - Muchos logs en poco tiempo');
            console.warn('🔧 Considera recargar la página si el rendimiento es lento');
            contadorLogs = 0; // Reset contador
        }
        
        return originalLog.apply(console, args);
    };
    
    // Reset contador cada 5 segundos
    setInterval(() => {
        contadorLogs = 0;
    }, 5000);
    
    console.log('✅ Monitor de consola activado');
}

// Función para verificar el estado actual
function verificarEstado() {
    console.log('🔍 Verificando estado actual...');
    
    // Verificar si hay modales abiertos
    const modales = document.querySelectorAll('[role="dialog"], .cdk-overlay-container');
    console.log('📋 Modales detectados:', modales.length);
    
    // Verificar token
    const token = localStorage.getItem('token');
    console.log('🔑 Token:', token ? 'presente' : 'ausente');
    
    // Verificar si hay subscripciones activas (aproximado)
    const scripts = document.querySelectorAll('script');
    console.log('📋 Scripts cargados:', scripts.length);
    
    // Verificar memoria aproximada
    if (performance.memory) {
        const memoria = performance.memory;
        console.log('💾 Memoria aproximada:');
        console.log(`  - Usada: ${(memoria.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  - Total: ${(memoria.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  - Límite: ${(memoria.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
    }
}

// Función principal
function solucionarBucle() {
    console.log('🚀 Iniciando solución del bucle infinito...');
    
    // Verificar estado actual
    verificarEstado();
    
    // Activar monitor
    monitorearConsola();
    
    // Limpiar y reiniciar
    setTimeout(() => {
        limpiarYReiniciar();
    }, 3000);
}

// Verificar si hay un bucle activo ahora mismo
const startTime = Date.now();
let logCount = 0;

const originalConsoleLog = console.log;
console.log = function(...args) {
    logCount++;
    if (Date.now() - startTime < 2000 && logCount > 50) {
        console.warn('🚨 BUCLE INFINITO DETECTADO AHORA MISMO');
        console.warn('🔧 Ejecutando solución inmediata...');
        
        // Restaurar console.log
        console.log = originalConsoleLog;
        
        // Ejecutar solución inmediata
        solucionarBucle();
        return;
    }
    
    return originalConsoleLog.apply(console, args);
};

// Si no se detecta bucle inmediato, ejecutar verificación normal
setTimeout(() => {
    console.log = originalConsoleLog; // Restaurar console.log
    
    if (logCount > 50) {
        console.log('⚠️ Actividad alta de logs detectada');
        solucionarBucle();
    } else {
        console.log('✅ No se detectó bucle inmediato');
        console.log('💡 Si experimentas lentitud, ejecuta: solucionarBucle()');
        
        // Solo activar monitor
        monitorearConsola();
    }
}, 2000);

// Exponer funciones
window.solucionarBucle = solucionarBucle;
window.limpiarYReiniciar = limpiarYReiniciar;
window.verificarEstado = verificarEstado;

console.log('\n🛠️ FUNCIONES DISPONIBLES:');
console.log('- solucionarBucle(): Solución completa del bucle');
console.log('- limpiarYReiniciar(): Limpiar y recargar página');
console.log('- verificarEstado(): Verificar estado actual');

console.log('\n📋 INSTRUCCIONES:');
console.log('1. Si ves muchos logs repetitivos, ejecuta: solucionarBucle()');
console.log('2. Si el navegador está lento, ejecuta: limpiarYReiniciar()');
console.log('3. El monitor detectará automáticamente bucles futuros');

console.log('\n⏳ Monitoreando por 2 segundos...');