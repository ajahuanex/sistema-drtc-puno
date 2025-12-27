#!/usr/bin/env python3
"""
Test para verificar que la funcionalidad de los botones en empresa-detail funcione
"""

import requests
import json
import time

def test_backend_running():
    """Verificar que el backend esté corriendo"""
    try:
        print("🔍 VERIFICANDO BACKEND...")
        response = requests.get('http://localhost:8000/health', timeout=5)
        if response.status_code == 200:
            print("✅ Backend está corriendo")
            return True
        else:
            print(f"❌ Backend responde con código: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend no está corriendo en http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error verificando backend: {e}")
        return False

def test_empresas_endpoint():
    """Verificar que el endpoint de empresas funcione"""
    try:
        print("\n🔍 VERIFICANDO ENDPOINT DE EMPRESAS...")
        response = requests.get('http://localhost:8000/api/empresas', timeout=10)
        
        if response.status_code == 200:
            empresas = response.json()
            print(f"✅ Endpoint de empresas funciona - {len(empresas)} empresas encontradas")
            
            if len(empresas) > 0:
                # Mostrar primera empresa
                empresa = empresas[0]
                print(f"📋 Empresa de prueba: {empresa.get('ruc', 'N/A')} - {empresa.get('razonSocial', {}).get('principal', 'N/A')}")
                return True, empresa.get('id')
            else:
                print("⚠️ No hay empresas en la base de datos")
                return False, None
        else:
            print(f"❌ Endpoint de empresas falla: {response.status_code}")
            return False, None
            
    except Exception as e:
        print(f"❌ Error verificando endpoint de empresas: {e}")
        return False, None

def test_vehiculos_endpoint():
    """Verificar que el endpoint de vehículos funcione"""
    try:
        print("\n🔍 VERIFICANDO ENDPOINT DE VEHÍCULOS...")
        response = requests.get('http://localhost:8000/api/vehiculos', timeout=10)
        
        if response.status_code == 200:
            vehiculos = response.json()
            print(f"✅ Endpoint de vehículos funciona - {len(vehiculos)} vehículos encontrados")
            
            if len(vehiculos) > 0:
                # Mostrar primer vehículo
                vehiculo = vehiculos[0]
                print(f"🚗 Vehículo de prueba: {vehiculo.get('placa', 'N/A')} - {vehiculo.get('marca', 'N/A')}")
                return True, vehiculo.get('id')
            else:
                print("⚠️ No hay vehículos en la base de datos")
                return False, None
        else:
            print(f"❌ Endpoint de vehículos falla: {response.status_code}")
            return False, None
            
    except Exception as e:
        print(f"❌ Error verificando endpoint de vehículos: {e}")
        return False, None

def test_resoluciones_endpoint():
    """Verificar que el endpoint de resoluciones funcione"""
    try:
        print("\n🔍 VERIFICANDO ENDPOINT DE RESOLUCIONES...")
        response = requests.get('http://localhost:8000/api/resoluciones', timeout=10)
        
        if response.status_code == 200:
            resoluciones = response.json()
            print(f"✅ Endpoint de resoluciones funciona - {len(resoluciones)} resoluciones encontradas")
            
            if len(resoluciones) > 0:
                # Mostrar primera resolución
                resolucion = resoluciones[0]
                print(f"📄 Resolución de prueba: {resolucion.get('nroResolucion', 'N/A')}")
                return True
            else:
                print("⚠️ No hay resoluciones en la base de datos")
                return False
        else:
            print(f"❌ Endpoint de resoluciones falla: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error verificando endpoint de resoluciones: {e}")
        return False

def verificar_metodos_implementados():
    """Verificar que los métodos estén implementados en el componente"""
    print("\n🔍 VERIFICANDO MÉTODOS IMPLEMENTADOS...")
    
    try:
        with open('frontend/src/app/components/empresas/empresa-detail.component.ts', 'r', encoding='utf-8') as f:
            content = f.read()
        
        metodos_requeridos = [
            'gestionarRutasVehiculo',
            'verDetalleVehiculo', 
            'editarVehiculo',
            'cambiarEstadoVehiculo',
            'transferirVehiculo',
            'asociarVehiculoAResolucion'
        ]
        
        metodos_encontrados = []
        metodos_faltantes = []
        
        for metodo in metodos_requeridos:
            if f'{metodo}(' in content:
                metodos_encontrados.append(metodo)
            else:
                metodos_faltantes.append(metodo)
        
        print(f"✅ Métodos implementados: {len(metodos_encontrados)}/{len(metodos_requeridos)}")
        for metodo in metodos_encontrados:
            print(f"   ✅ {metodo}")
        
        if metodos_faltantes:
            print(f"❌ Métodos faltantes:")
            for metodo in metodos_faltantes:
                print(f"   ❌ {metodo}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error verificando métodos: {e}")
        return False

def verificar_servicios_importados():
    """Verificar que los servicios necesarios estén importados"""
    print("\n🔍 VERIFICANDO SERVICIOS IMPORTADOS...")
    
    try:
        with open('frontend/src/app/components/empresas/empresa-detail.component.ts', 'r', encoding='utf-8') as f:
            content = f.read()
        
        servicios_requeridos = [
            'VehiculoService',
            'Router',
            'MatSnackBar',
            'MatDialog'
        ]
        
        servicios_encontrados = []
        servicios_faltantes = []
        
        for servicio in servicios_requeridos:
            if servicio in content:
                servicios_encontrados.append(servicio)
            else:
                servicios_faltantes.append(servicio)
        
        print(f"✅ Servicios importados: {len(servicios_encontrados)}/{len(servicios_requeridos)}")
        for servicio in servicios_encontrados:
            print(f"   ✅ {servicio}")
        
        if servicios_faltantes:
            print(f"❌ Servicios faltantes:")
            for servicio in servicios_faltantes:
                print(f"   ❌ {servicio}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error verificando servicios: {e}")
        return False

def main():
    """Función principal"""
    print("=" * 70)
    print("🔧 TEST DE FUNCIONALIDAD - BOTONES EMPRESA VEHÍCULOS")
    print("=" * 70)
    
    # Verificar backend
    backend_ok = test_backend_running()
    
    # Verificar endpoints
    empresas_ok, empresa_id = test_empresas_endpoint() if backend_ok else (False, None)
    vehiculos_ok, vehiculo_id = test_vehiculos_endpoint() if backend_ok else (False, None)
    resoluciones_ok = test_resoluciones_endpoint() if backend_ok else False
    
    # Verificar código frontend
    metodos_ok = verificar_metodos_implementados()
    servicios_ok = verificar_servicios_importados()
    
    print("\n" + "=" * 70)
    print("📋 RESUMEN DE VERIFICACIÓN")
    print("=" * 70)
    
    print(f"🔧 Backend funcionando: {'✅ OK' if backend_ok else '❌ ERROR'}")
    print(f"🏢 Endpoint empresas: {'✅ OK' if empresas_ok else '❌ ERROR'}")
    print(f"🚗 Endpoint vehículos: {'✅ OK' if vehiculos_ok else '❌ ERROR'}")
    print(f"📄 Endpoint resoluciones: {'✅ OK' if resoluciones_ok else '❌ ERROR'}")
    print(f"⚙️ Métodos implementados: {'✅ OK' if metodos_ok else '❌ ERROR'}")
    print(f"🔌 Servicios importados: {'✅ OK' if servicios_ok else '❌ ERROR'}")
    
    todo_ok = all([backend_ok, empresas_ok, vehiculos_ok, resoluciones_ok, metodos_ok, servicios_ok])
    
    if todo_ok:
        print("\n🎉 TODOS LOS COMPONENTES ESTÁN FUNCIONANDO")
        print("\n📋 INSTRUCCIONES PARA PROBAR:")
        print("1. Abrir http://localhost:4200")
        print("2. Ir a EMPRESAS → Seleccionar empresa → Tab VEHÍCULOS")
        print("3. Hacer clic en el botón de rutas 🛣️")
        print("4. Hacer clic en el botón de acciones ⋮")
        print("5. Verificar que se ejecuten las acciones correctamente")
        
        if empresa_id:
            print(f"\n🔗 URL directa para probar:")
            print(f"   http://localhost:4200/empresas/{empresa_id}")
        
        print("\n🔍 SI LOS BOTONES NO FUNCIONAN:")
        print("   - Abrir DevTools (F12)")
        print("   - Ir a la pestaña Console")
        print("   - Hacer clic en los botones")
        print("   - Verificar si aparecen mensajes de error o logs")
        
        return True
    else:
        print("\n❌ HAY PROBLEMAS QUE RESOLVER")
        
        if not backend_ok:
            print("   - Iniciar el backend: python -m uvicorn backend.app.main:app --reload")
        if not (empresas_ok and vehiculos_ok and resoluciones_ok):
            print("   - Verificar que la base de datos tenga datos de prueba")
        if not metodos_ok:
            print("   - Implementar los métodos faltantes en empresa-detail.component.ts")
        if not servicios_ok:
            print("   - Agregar los imports faltantes en empresa-detail.component.ts")
            
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)