"""
Script para probar la creación de resoluciones con formato correcto R-0123-2025
"""
import requests
import json

def test_crear_resolucion_formato():
    print("=" * 80)
    print("🧪 PRUEBA DE CREACIÓN DE RESOLUCIÓN CON FORMATO CORRECTO")
    print("=" * 80)
    
    # 1. Obtener empresas
    print("\n1️⃣ Obteniendo empresas...")
    response = requests.get("http://localhost:8000/api/v1/empresas")
    if response.status_code == 200:
        empresas = response.json()
        if empresas:
            empresa = empresas[0]
            print(f"✅ Empresa: {empresa['razonSocial']['principal']} (ID: {empresa['id']})")
        else:
            print("❌ No hay empresas")
            return
    else:
        print(f"❌ Error: {response.status_code}")
        return
    
    # 2. Crear resolución con formato correcto
    print(f"\n2️⃣ Creando resolución con formato R-0123-2025...")
    
    # Probar diferentes números
    numeros_prueba = ["0123", "0001", "0999", "0042"]
    
    for numero in numeros_prueba:
        print(f"\n📝 Probando número: {numero}")
        
        resolucion_data = {
            "nroResolucion": f"R-{numero}-2025",
            "fechaEmision": "2025-01-15T10:00:00",
            "tipoResolucion": "PADRE",
            "tipoTramite": "AUTORIZACION_NUEVA",
            "empresaId": empresa['id'],
            "expedienteId": f"EXP-{numero}",
            "usuarioEmisionId": "admin",
            "descripcion": f"Resolución de prueba número {numero}",
            "observaciones": f"Creada para probar formato R-{numero}-2025"
        }
        
        print(f"   📋 Datos:")
        print(f"      • Número: {resolucion_data['nroResolucion']}")
        print(f"      • Empresa: {empresa['razonSocial']['principal']}")
        print(f"      • Tipo: {resolucion_data['tipoTramite']}")
        
        # Hacer petición POST
        headers = {"Content-Type": "application/json"}
        response = requests.post(
            "http://localhost:8000/api/v1/resoluciones/",
            json=resolucion_data,
            headers=headers
        )
        
        print(f"   📡 Respuesta: Status {response.status_code}")
        
        if response.status_code == 201:
            resolucion = response.json()
            print(f"   ✅ RESOLUCIÓN CREADA!")
            print(f"      • ID: {resolucion['id']}")
            print(f"      • Número: {resolucion['nroResolucion']}")
            print(f"      • Estado: {resolucion['estado']}")
        else:
            print(f"   ❌ ERROR:")
            try:
                error = response.json()
                print(f"      • Detalle: {error}")
            except:
                print(f"      • Respuesta: {response.text}")
        
        print(f"   {'-' * 50}")
    
    # 3. Verificar que las resoluciones aparecen en la lista
    print(f"\n3️⃣ Verificando lista de resoluciones...")
    response = requests.get("http://localhost:8000/api/v1/resoluciones")
    
    if response.status_code == 200:
        resoluciones = response.json()
        print(f"✅ Total resoluciones: {len(resoluciones)}")
        
        print(f"\n📋 RESOLUCIONES EN SISTEMA:")
        for i, res in enumerate(resoluciones, 1):
            print(f"   {i}. {res['nroResolucion']} - {res['estado']} - Empresa: {res['empresaId']}")
        
        # Verificar formato
        formatos_correctos = 0
        for res in resoluciones:
            numero = res['nroResolucion']
            if numero.startswith('R-') and len(numero.split('-')) == 3:
                partes = numero.split('-')
                if len(partes[1]) == 4 and partes[1].isdigit():
                    formatos_correctos += 1
                    print(f"   ✅ Formato correcto: {numero}")
                else:
                    print(f"   ⚠️  Formato incorrecto: {numero}")
        
        print(f"\n📊 RESUMEN:")
        print(f"   • Total resoluciones: {len(resoluciones)}")
        print(f"   • Formato correcto: {formatos_correctos}")
        print(f"   • Formato incorrecto: {len(resoluciones) - formatos_correctos}")
        
    else:
        print(f"❌ Error obteniendo resoluciones: {response.status_code}")
    
    print("=" * 80)

if __name__ == "__main__":
    test_crear_resolucion_formato()