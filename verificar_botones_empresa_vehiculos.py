#!/usr/bin/env python3
"""
Verificar que los botones de vehículos en el módulo de empresas funcionen correctamente
- Botón de rutas debe mostrar solo el icono
- Botón de acciones debe mostrar solo el icono y abrir el menú
"""

import requests
import json
import time

def verificar_cambios_empresa_detail():
    """Verificar que los cambios se aplicaron en empresa-detail.component.ts"""
    print("🔍 VERIFICANDO CAMBIOS EN EMPRESA-DETAIL...")
    
    cambios_encontrados = []
    
    try:
        with open('frontend/src/app/components/empresas/empresa-detail.component.ts', 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Verificar cambios en HTML
        if 'route-button-empresa' in content:
            cambios_encontrados.append("✅ HTML: Clase 'route-button-empresa' encontrada")
        else:
            cambios_encontrados.append("❌ HTML: Clase 'route-button-empresa' NO encontrada")
            
        if 'actions-button-empresa' in content:
            cambios_encontrados.append("✅ HTML: Clase 'actions-button-empresa' encontrada")
        else:
            cambios_encontrados.append("❌ HTML: Clase 'actions-button-empresa' NO encontrada")
            
        if 'route-button-disabled' in content:
            cambios_encontrados.append("✅ HTML: Clase 'route-button-disabled' encontrada")
        else:
            cambios_encontrados.append("❌ HTML: Clase 'route-button-disabled' NO encontrada")
            
        if 'associate-button-empresa' in content:
            cambios_encontrados.append("✅ HTML: Clase 'associate-button-empresa' encontrada")
        else:
            cambios_encontrados.append("❌ HTML: Clase 'associate-button-empresa' NO encontrada")
            
        # Verificar que se quitó el texto "Gestionar Rutas"
        if 'mat-raised-button color="primary"' not in content or 'Gestionar Rutas' not in content:
            cambios_encontrados.append("✅ HTML: Texto 'Gestionar Rutas' removido correctamente")
        else:
            cambios_encontrados.append("❌ HTML: Texto 'Gestionar Rutas' AÚN PRESENTE")
            
        # Verificar estilos CSS
        if '.route-button-empresa' in content:
            cambios_encontrados.append("✅ CSS: Estilos '.route-button-empresa' encontrados")
        else:
            cambios_encontrados.append("❌ CSS: Estilos '.route-button-empresa' NO encontrados")
            
        if '.actions-button-empresa' in content:
            cambios_encontrados.append("✅ CSS: Estilos '.actions-button-empresa' encontrados")
        else:
            cambios_encontrados.append("❌ CSS: Estilos '.actions-button-empresa' NO encontrados")
            
        if '.vehicle-actions-menu-empresa' in content:
            cambios_encontrados.append("✅ CSS: Estilos '.vehicle-actions-menu-empresa' encontrados")
        else:
            cambios_encontrados.append("❌ CSS: Estilos '.vehicle-actions-menu-empresa' NO encontrados")
            
    except Exception as e:
        cambios_encontrados.append(f"❌ Error leyendo archivo: {e}")
    
    # Mostrar resultados
    for cambio in cambios_encontrados:
        print(f"   {cambio}")
    
    errores = [c for c in cambios_encontrados if c.startswith("❌")]
    return len(errores) == 0

def test_backend_empresas():
    """Verificar que el backend tenga empresas"""
    try:
        print("\n🔍 VERIFICANDO BACKEND DE EMPRESAS...")
        
        # Verificar endpoint de empresas
        response = requests.get('http://localhost:8000/api/empresas', timeout=10)
        
        if response.status_code == 200:
            empresas = response.json()
            print(f"✅ Backend responde correctamente")
            print(f"📊 Total de empresas: {len(empresas)}")
            
            if len(empresas) > 0:
                print("✅ Hay empresas disponibles para probar")
                
                # Mostrar algunas empresas de ejemplo
                for i, empresa in enumerate(empresas[:3]):
                    razon_social = empresa.get('razonSocial', {})
                    if isinstance(razon_social, dict):
                        nombre = razon_social.get('principal', 'N/A')
                    else:
                        nombre = str(razon_social) if razon_social else 'N/A'
                    print(f"   {i+1}. {empresa.get('ruc', 'N/A')} - {nombre}")
                
                return True
            else:
                print("⚠️ No hay empresas en la base de datos")
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

def test_frontend():
    """Verificar que el frontend esté funcionando"""
    try:
        print("\n🔍 VERIFICANDO FRONTEND...")
        
        # Verificar que el frontend esté corriendo
        response = requests.get('http://localhost:4200', timeout=5)
        if response.status_code == 200:
            print("✅ Frontend está corriendo en http://localhost:4200")
            return True
        else:
            print(f"❌ Frontend no responde correctamente: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Frontend no está corriendo en http://localhost:4200")
        return False
    except Exception as e:
        print(f"❌ Error verificando frontend: {e}")
        return False

def main():
    """Función principal de verificación"""
    print("=" * 70)
    print("🔧 VERIFICACIÓN BOTONES VEHÍCULOS EN MÓDULO EMPRESAS")
    print("=" * 70)
    
    # Verificar cambios en archivos
    archivos_ok = verificar_cambios_empresa_detail()
    
    # Verificar backend
    backend_ok = test_backend_empresas()
    
    # Verificar frontend
    frontend_ok = test_frontend()
    
    print("\n" + "=" * 70)
    print("📋 RESUMEN DE VERIFICACIÓN")
    print("=" * 70)
    
    print(f"📁 Archivos modificados: {'✅ OK' if archivos_ok else '❌ ERROR'}")
    print(f"🔧 Backend funcionando: {'✅ OK' if backend_ok else '❌ ERROR'}")
    print(f"🌐 Frontend funcionando: {'✅ OK' if frontend_ok else '❌ ERROR'}")
    
    if archivos_ok and backend_ok and frontend_ok:
        print("\n🎉 TODOS LOS COMPONENTES ESTÁN LISTOS")
        print("\n📋 INSTRUCCIONES PARA PROBAR:")
        print("1. Abrir http://localhost:4200 en el navegador")
        print("2. Ir al módulo de EMPRESAS")
        print("3. Seleccionar una empresa (ej: VVVVV)")
        print("4. Ir al tab 'VEHÍCULOS'")
        print("5. Verificar que:")
        print("   - El botón de rutas muestre SOLO el icono 🛣️")
        print("   - El botón de acciones muestre SOLO el icono ⋮")
        print("   - Al hacer clic en el botón de rutas se abra el modal")
        print("   - Al hacer clic en el botón de acciones se abra el menú")
        print("\n🔄 Si los botones aún no funcionan:")
        print("   - Limpiar caché del navegador (Ctrl+F5)")
        print("   - Verificar que no hay errores en la consola del navegador")
        
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