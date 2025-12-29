// 🔧 SOLUCIÓN FINAL: Corregir token undefined
// Ejecutar en consola del navegador (F12)

console.log('🔧 Corrigiendo token undefined...');

// 1. Verificar estado actual
console.log('Estado actual del token:', localStorage.getItem('token'));

// 2. Obtener token válido del backend
async function obtenerTokenFresco() {
    try {
        const formData = new FormData();
        formData.append('username', '12345678');
        formData.append('password', 'admin123');
        
        const response = await fetch('http://localhost:8000/api/v1/auth/login', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            const token = data.accessToken || data.access_token;
            
            if (token) {
                console.log('✅ Token fresco obtenido:', token.substring(0, 30) + '...');
                
                // Limpiar y establecer token correcto
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify({
                    id: data.user?.id || '69482ea487726bf90a26d83',
                    username: '12345678',
                    email: 'admin@drtcpuno.gob.pe',
                    rol: 'ADMIN'
                }));
                
                console.log('✅ Token actualizado correctamente');
                console.log('✅ Verificación:', localStorage.getItem('token').substring(0, 30) + '...');
                
                // Probar el token
                const testResponse = await fetch('http://localhost:8000/api/v1/rutas-especificas/vehiculo/694da819e46133e7b09e981c', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('🧪 Prueba del token:', testResponse.status);
                
                if (testResponse.status === 200 || testResponse.status === 404) {
                    console.log('✅ Token funcionando correctamente');
                } else {
                    console.log('⚠️ Token puede tener problemas:', testResponse.status);
                }
                
                // Recargar página
                console.log('🔄 Recargando página en 2 segundos...');
                setTimeout(() => window.location.reload(), 2000);
                
            } else {
                console.log('❌ No se recibió token en la respuesta');
            }
        } else {
            console.log('❌ Error en login:', response.status, await response.text());
        }
    } catch (error) {
        console.log('❌ Error obteniendo token:', error);
    }
}

// 3. Ejecutar
obtenerTokenFresco();