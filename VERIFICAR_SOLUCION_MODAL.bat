@echo off
echo ========================================
echo VERIFICACION DE SOLUCION MODAL RUTAS
echo ========================================
echo.

echo 🔍 Verificando que el backend este ejecutandose...
curl -s http://localhost:8000/health > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend funcionando correctamente
) else (
    echo ❌ Backend no esta ejecutandose
    echo 🔧 Ejecuta: start-backend.bat
    pause
    exit /b 1
)

echo.
echo 🔐 Probando autenticacion...
python -c "
import requests
try:
    form_data = {'username': '12345678', 'password': 'admin123', 'grant_type': 'password'}
    response = requests.post('http://localhost:8000/api/v1/auth/login', data=form_data, timeout=5)
    if response.status_code == 200:
        print('✅ Autenticacion funciona correctamente')
        token = response.json().get('access_token')
        
        # Probar endpoint de rutas especificas
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get('http://localhost:8000/api/v1/rutas-especificas/vehiculo/test-123', headers=headers, timeout=5)
        if response.status_code in [200, 404]:
            print('✅ Endpoint de rutas especificas funciona')
        else:
            print('❌ Problema con endpoint de rutas especificas')
    else:
        print('❌ Error en autenticacion')
except Exception as e:
    print(f'❌ Error: {e}')
"

echo.
echo 🌐 Verificando frontend...
curl -s http://localhost:4200 > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend funcionando correctamente
) else (
    echo ❌ Frontend no esta ejecutandose
    echo 🔧 Ejecuta: start-frontend.bat
)

echo.
echo ========================================
echo INSTRUCCIONES PARA PROBAR LA SOLUCION
echo ========================================
echo.
echo 1. Abrir navegador en: http://localhost:4200
echo 2. Hacer login con:
echo    - DNI: 12345678
echo    - Contraseña: admin123
echo.
echo 3. Ir a la pagina de Vehiculos
echo 4. Hacer clic en "Gestionar Rutas Especificas"
echo 5. El modal deberia abrir sin errores
echo.
echo 🛠️ SI HAY PROBLEMAS:
echo - Abrir DevTools (F12)
echo - Ir a Application ^> Local Storage
echo - Limpiar todo el localStorage
echo - Recargar pagina y hacer login nuevamente
echo.

pause