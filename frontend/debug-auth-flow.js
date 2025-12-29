// Script de debug para probar el flujo de autenticación
console.log('🔍 Iniciando debug del flujo de autenticación...');

// Simular el proceso de login
async function testAuthFlow() {
  try {
    // 1. Limpiar localStorage
    console.log('1. Limpiando localStorage...');
    localStorage.clear();
    
    // 2. Verificar estado inicial
    console.log('2. Estado inicial:', {
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user')
    });
    
    // 3. Simular login
    console.log('3. Simulando login...');
    const formData = new FormData();
    formData.append('username', '12345678');
    formData.append('password', 'admin123');
    
    const response = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('4. Login exitoso:', data);
      
      // Guardar token y usuario
      const token = data.accessToken || data.access_token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: data.user?.id || 'user-id',
        username: '12345678',
        rol: 'ADMIN'
      }));
      
      console.log('5. Estado después del login:', {
        token: localStorage.getItem('token')?.substring(0, 20) + '...',
        user: localStorage.getItem('user')
      });
      
      // 6. Probar una petición autenticada
      console.log('6. Probando petición autenticada...');
      const testResponse = await fetch('http://localhost:8000/api/v1/empresas/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('7. Resultado petición autenticada:', {
        status: testResponse.status,
        ok: testResponse.ok
      });
      
      if (testResponse.ok) {
        console.log('✅ Flujo de autenticación funcionando correctamente');
      } else {
        console.log('❌ Error en petición autenticada:', testResponse.status);
      }
      
    } else {
      console.log('❌ Error en login:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Error en test:', error);
  }
}

// Ejecutar test
testAuthFlow();