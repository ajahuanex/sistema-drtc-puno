// 🔧 SOLUCIÓN AUTOMÁTICA: Token corrupto detectado
// Este script se ejecutará automáticamente cuando se detecte el problema

console.log('🔧 SOLUCIONANDO TOKEN CORRUPTO AUTOMÁTICAMENTE...');

async function solucionarTokenCorrupto() {
    try {
        // 1. Verificar el problema
        const tokenActual = localStorage.getItem('token');
        console.log('Token actual:', tokenActual);
        
        if (tokenActual === 'undefined' || tokenActual === 'null' || !tokenActual) {
            console.log('✅ Token corrupto confirmado, procediendo con la solución...');
            
            // 2. Limpiar completamente
            localStorage.clear();
            sessionStorage.clear();
            
            // 3. Obtener token fresco
            const formData = new FormData();
            formData.append('username', '12345678');
            formData.append('password', 'admin123');
            
            const response = await fetch('http://localhost:8000/api/v1/auth/login', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                const freshToken = data.accessToken || data.access_token;
                
                if (freshToken && typeof freshToken === 'string' && freshToken !== 'undefined') {
                    // 4. Guardar token correctamente
                    localStorage.setItem('token', freshToken);
                    localStorage.setItem('user', JSON.stringify({
                        id: data.user?.id || 'user-id',
                        username: '12345678',
                        rol: 'ADMIN'
                    }));
                    
                    console.log('✅ Token fresco guardado:', freshToken.substring(0, 30) + '...');
                    
                    // 5. Verificar que se guardó correctamente
                    const tokenVerificacion = localStorage.getItem('token');
                    console.log('Verificación - Token guardado:', tokenVerificacion ? tokenVerificacion.substring(0, 30) + '...' : 'ERROR');
                    
                    if (tokenVerificacion && tokenVerificacion !== 'undefined') {
                        console.log('✅ ¡PROBLEMA RESUELTO! Recargando página...');
                        setTimeout(() => window.location.reload(), 1000);
                    } else {
                        console.log('❌ El token se sigue guardando mal');
                    }
                } else {
                    console.log('❌ Token recibido del backend es inválido:', freshToken);
                }
            } else {
                console.log('❌ Error en login:', response.status);
            }
        } else {
            console.log('ℹ️ Token parece estar bien, el problema puede ser otro');
        }
    } catch (error) {
        console.log('❌ Error en solución automática:', error);
    }
}

// Ejecutar la solución
solucionarTokenCorrupto();