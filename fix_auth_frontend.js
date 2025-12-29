
// 🔧 SOLUCIÓN: Actualizar token de autenticación
// Ejecutar en la consola del navegador (F12)

console.log('🔧 Corrigiendo problema de autenticación...');

// 1. Limpiar datos anteriores
localStorage.removeItem('token');
localStorage.removeItem('user');
sessionStorage.clear();

// 2. Establecer token válido
localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTQ4MmVhNDg3NzI2MWJmOTBhMjZkODMiLCJleHAiOjE3NjY5Mjc0NjB9.iwXtMQG5JP5P9cCHBEVSUtMcxcnIspjtM-z_l7C-YBk');

// 3. Establecer datos de usuario (opcional)
const userData = {
    username: '12345678',
    email: 'admin@drtcpuno.gob.pe',
    rol: 'ADMIN'
};
localStorage.setItem('user', JSON.stringify(userData));

// 4. Verificar
console.log('✅ Token actualizado:', localStorage.getItem('token')?.substring(0, 30) + '...');
console.log('✅ Usuario:', JSON.parse(localStorage.getItem('user') || '{}'));

// 5. Recargar página
console.log('🔄 Recargando página...');
setTimeout(() => window.location.reload(), 1000);
