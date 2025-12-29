// 🔧 SOLUCIÓN COMPLETA: Problema de rutas específicas
// Ejecutar en la consola del navegador (F12)

console.log('🔧 Aplicando solución completa para rutas específicas...');

// 1. Limpiar estado anterior
localStorage.removeItem('token');
localStorage.removeItem('user');
sessionStorage.clear();

// 2. Establecer token válido (obtenido del backend)
const tokenValido = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTQ4MmVhNDg3NzI2MWJmOTBhMjZkODMiLCJleHAiOjE3NjY5Mjc0NjB9.iwXtMQG5JP5P9cCHBEVSUtMcxcnIspjtM-z_l7C-YBk';
localStorage.setItem('token', tokenValido);

// 3. Establecer datos de usuario
const userData = {
    id: '69482ea487726bf90a26d83',
    username: '12345678',
    email: 'admin@drtcpuno.gob.pe',
    rol: 'ADMIN',
    nombres: 'Administrador',
    apellidos: 'Sistema'
};
localStorage.setItem('user', JSON.stringify(userData));

// 4. Verificar que todo esté correcto
console.log('✅ Token establecido:', localStorage.getItem('token')?.substring(0, 30) + '...');
console.log('✅ Usuario establecido:', JSON.parse(localStorage.getItem('user') || '{}'));

// 5. Verificar conectividad con el backend
async function verificarBackend() {
    try {
        const response = await fetch('http://localhost:8000/api/v1/empresas');
        if (response.ok) {
            const empresas = await response.json();
            console.log('✅ Backend conectado - Empresas:', empresas.length);
        } else {
            console.log('⚠️ Backend responde pero con error:', response.status);
        }
    } catch (error) {
        console.log('❌ Error conectando al backend:', error.message);
    }
}

// 6. Verificar endpoint de rutas específicas con autenticación
async function verificarRutasEspecificas() {
    const vehiculoId = '694da819e46133e7b09e981c';
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`http://localhost:8000/api/v1/rutas-especificas/vehiculo/${vehiculoId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('🚗 Rutas específicas endpoint:', response.status);
        
        if (response.ok) {
            const rutas = await response.json();
            console.log('✅ Rutas específicas obtenidas:', rutas.length);
        } else if (response.status === 404) {
            console.log('ℹ️ Vehículo sin rutas específicas (normal)');
        } else {
            console.log('❌ Error:', response.status, await response.text());
        }
    } catch (error) {
        console.log('❌ Error verificando rutas específicas:', error.message);
    }
}

// 7. Ejecutar verificaciones
console.log('🔍 Verificando conectividad...');
verificarBackend();
verificarRutasEspecificas();

// 8. Recargar página para aplicar cambios
console.log('🔄 Recargando página en 3 segundos...');
setTimeout(() => {
    console.log('🔄 Recargando ahora...');
    window.location.reload();
}, 3000);

console.log('✅ Solución aplicada. La página se recargará automáticamente.');
console.log('💡 Después de la recarga, prueba abrir el modal de rutas específicas.');