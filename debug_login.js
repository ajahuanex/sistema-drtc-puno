// 🔍 DEBUG: Problema de login
// Ejecutar en la consola del navegador en la página de login

console.log('🔍 Debuggeando problema de login...');

// 1. Verificar estado actual
console.log('URL actual:', window.location.href);
console.log('Token en localStorage:', localStorage.getItem('token'));

// 2. Intentar login directo por API
async function probarLoginDirecto() {
    console.log('🔐 Probando login directo por API...');
    
    try {
        const formData = new FormData();
        formData.append('username', '12345678');
        formData.append('password', 'admin123');
        
        const response = await fetch('http://localhost:8000/api/v1/auth/login', {
            method: 'POST',
            body: formData
        });
        
        console.log('Respuesta del login:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Login exitoso:', data);
            
            const token = data.accessToken || data.access_token;
            if (token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(data.user || { username: '12345678' }));
                
                console.log('✅ Token guardado, redirigiendo...');
                window.location.href = '/dashboard';
            }
        } else {
            const errorText = await response.text();
            console.log('❌ Error en login:', errorText);
        }
    } catch (error) {
        console.log('❌ Error de red:', error);
    }
}

// 3. Verificar si hay formulario de login en la página
const loginForm = document.querySelector('form');
if (loginForm) {
    console.log('✅ Formulario de login encontrado');
    
    // Llenar automáticamente el formulario
    const dniInput = document.querySelector('input[formControlName="dni"]');
    const passwordInput = document.querySelector('input[formControlName="password"]');
    
    if (dniInput && passwordInput) {
        console.log('✅ Campos de login encontrados, llenando automáticamente...');
        
        // Simular entrada de usuario
        dniInput.value = '12345678';
        dniInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        passwordInput.value = 'admin123';
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        console.log('✅ Formulario llenado. Puedes hacer clic en "Iniciar Sesión" o ejecutar probarLoginDirecto()');
    } else {
        console.log('❌ No se encontraron los campos de login');
    }
} else {
    console.log('❌ No se encontró formulario de login');
}

// 4. Función para probar login directo
window.probarLoginDirecto = probarLoginDirecto;

console.log('💡 Opciones:');
console.log('1. Usar el formulario (ya llenado automáticamente)');
console.log('2. Ejecutar: probarLoginDirecto() para login directo por API');