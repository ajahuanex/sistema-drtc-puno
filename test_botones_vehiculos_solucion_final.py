#!/usr/bin/env python3
"""
Test para verificar que los botones de vehículos funcionen correctamente
- Botón de rutas debe mostrar solo el icono
- Botón de acciones debe mostrar solo el icono y abrir el menú
"""

import requests
import json
import time

def test_frontend_vehiculos():
    """Verificar que el frontend esté funcionando"""
    try:
        print("🔍 VERIFICANDO FRONTEND DE VEHÍCULOS...")
        
        # Verificar que el frontend esté corriendo
        response = requests.get('http://localhost:4200', timeout=5)
        if response.status_code == 200:
            print("✅ Frontend está corriendo en http://localhost:4200")
        else:
            print(f"❌ Frontend no responde correctamente: {response.status_code}")
            return False
            
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Frontend no está corriendo en http://localhost:4200")
        return False
    except Exception as e:
        print(f"❌ Error verificando frontend: {e}")
        return False

def test_backend_vehiculos():
    """Verificar que el backend tenga vehículos"""
    try:
        print("\n🔍 VERIFICANDO BACKEND DE VEHÍCULOS...")
        
        # Verificar endpoint de vehículos
        response = requests.get('http://localhost:8000/api/vehiculos', timeout=10)
        
        if response.status_code == 200:
            vehiculos = response.json()
            print(f"✅ Backend responde correctamente")
            print(f"📊 Total de vehículos: {len(vehiculos)}")
            
            if len(vehiculos) > 0:
                print("✅ Hay vehículos disponibles para probar los botones")
                
                # Mostrar algunos vehículos de ejemplo
                for i, vehiculo in enumerate(vehiculos[:3]):
                    print(f"   {i+1}. {vehiculo.get('placa', 'N/A')} - {vehiculo.get('marca', 'N/A')}")
                
                return True
            else:
                print("⚠️ No hay vehículos en la base de datos")
                return False
        else:
            print(f"❌ Backend no responde correctamente: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Backend no está corriendo en http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error verificando backend: {e}")
        return False

def verificar_archivos_modificados():
    """Verificar que los archivos fueron modificados correctamente"""
    print("\n🔍 VERIFICANDO ARCHIVOS MODIFICADOS...")
    
    archivos_verificar = [
        'frontend/src/app/components/vehiculos/vehiculos.component.html',
        'frontend/src/app/components/vehiculos/vehiculos.component.ts',
        'frontend/src/app/components/vehiculos/vehiculos.component.scss'
    ]
    
    cambios_encontrados = []
    
    # Verificar HTML
    try:
        with open('frontend/src/app/components/vehiculos/vehiculos.component.html', 'r', encoding='utf-8') as f:
            html_content = f.read()
            
        if 'route-button-fixed' in html_content:
            cambios_encontrados.append("✅ HTML: Clase 'route-button-fixed' encontrada")
        else:
            cambios_encontrados.append("❌ HTML: Clase 'route-button-fixed' NO encontrada")
            
        if 'actions-button-fixed' in html_content:
            cambios_encontrados.append("✅ HTML: Clase 'actions-button-fixed' encontrada")
        else:
            cambios_encontrados.append("❌ HTML: Clase 'actions-button-fixed' NO encontrada")
            
        if 'actionsMenu' in html_content:
            cambios_encontrados.append("✅ HTML: Referencia 'actionsMenu' encontrada")
        else:
            cambios_encontrados.append("❌ HTML: Referencia 'actionsMenu' NO encontrada")
            
    except Exception as e:
        cambios_encontrados.append(f"❌ Error leyendo HTML: {e}")
    
    # Verificar SCSS
    try:
        with open('frontend/src/app/components/vehiculos/vehiculos.component.scss', 'r', encoding='utf-8') as f:
            scss_content = f.read()
            
        if '.route-button-fixed' in scss_content:
            cambios_encontrados.append("✅ SCSS: Estilos '.route-button-fixed' encontrados")
        else:
            cambios_encontrados.append("❌ SCSS: Estilos '.route-button-fixed' NO encontrados")
            
        if '.actions-button-fixed' in scss_content:
            cambios_encontrados.append("✅ SCSS: Estilos '.actions-button-fixed' encontrados")
        else:
            cambios_encontrados.append("❌ SCSS: Estilos '.actions-button-fixed' NO encontrados")
            
        if '.vehicle-actions-menu' in scss_content:
            cambios_encontrados.append("✅ SCSS: Estilos '.vehicle-actions-menu' encontrados")
        else:
            cambios_encontrados.append("❌ SCSS: Estilos '.vehicle-actions-menu' NO encontrados")
            
    except Exception as e:
        cambios_encontrados.append(f"❌ Error leyendo SCSS: {e}")
    
    # Verificar TypeScript
    try:
        with open('frontend/src/app/components/vehiculos/vehiculos.component.ts', 'r', encoding='utf-8') as f:
            ts_content = f.read()
            
        if 'GestionarRutasEspecificasModalComponent' in ts_content:
            cambios_encontrados.append("✅ TS: Import 'GestionarRutasEspecificasModalComponent' encontrado")
        else:
            cambios_encontrados.append("❌ TS: Import 'GestionarRutasEspecificasModalComponent' NO encontrado")
            
        if 'gestionarRutasEspecificas(' in ts_content:
            cambios_encontrados.append("✅ TS: Método 'gestionarRutasEspecificas' encontrado")
        else:
            cambios_encontrados.append("❌ TS: Método 'gestionarRutasEspecificas' NO encontrado")
            
    except Exception as e:
        cambios_encontrados.append(f"❌ Error leyendo TS: {e}")
    
    # Mostrar resultados
    for cambio in cambios_encontrados:
        print(f"   {cambio}")
    
    errores = [c for c in cambios_encontrados if c.startswith("❌")]
    return len(errores) == 0

def main():
    """Función principal de verificación"""
    print("=" * 60)
    print("🔧 VERIFICACIÓN FINAL DE BOTONES DE VEHÍCULOS")
    print("=" * 60)
    
    # Verificar archivos modificados
    archivos_ok = verificar_archivos_modificados()
    
    # Verificar backend
    backend_ok = test_backend_vehiculos()
    
    # Verificar frontend
    frontend_ok = test_frontend_vehiculos()
    
    print("\n" + "=" * 60)
    print("📋 RESUMEN DE VERIFICACIÓN")
    print("=" * 60)
    
    print(f"📁 Archivos modificados: {'✅ OK' if archivos_ok else '❌ ERROR'}")
    print(f"🔧 Backend funcionando: {'✅ OK' if backend_ok else '❌ ERROR'}")
    print(f"🌐 Frontend funcionando: {'✅ OK' if frontend_ok else '❌ ERROR'}")
    
    if archivos_ok and backend_ok and frontend_ok:
        print("\n🎉 TODOS LOS COMPONENTES ESTÁN LISTOS")
        print("\n📋 INSTRUCCIONES PARA PROBAR:")
        print("1. Abrir http://localhost:4200 en el navegador")
        print("2. Ir al módulo de Vehículos")
        print("3. Verificar que:")
        print("   - El botón de rutas muestre SOLO el icono 🛣️")
        print("   - El botón de acciones muestre SOLO el icono ⋮")
        print("   - Al hacer clic en el botón de rutas se abra el modal")
        print("   - Al hacer clic en el botón de acciones se abra el menú")
        print("\n🔄 Si los botones aún no funcionan, puede ser necesario:")
        print("   - Limpiar caché del navegador (Ctrl+F5)")
        print("   - Reiniciar el servidor frontend")
        
        return True
    else:
        print("\n❌ HAY PROBLEMAS QUE RESOLVER")
        
        if not archivos_ok:
            print("   - Los archivos no fueron modificados correctamente")
        if not backend_ok:
            print("   - El backend no está funcionando o no tiene datos")
        if not frontend_ok:
            print("   - El frontend no está corriendo")
            
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)