#!/usr/bin/env python3
"""
Test del flujo completo de creación de rutas con el nuevo sistema
"""

import requests
import json

def test_flujo_resolucion_directa():
    """Test del flujo: Selección directa de resolución"""
    print("🧪 FLUJO 1: Selección Directa de Resolución")
    print("="*50)
    
    # Paso 1: Obtener resoluciones primigenias
    print("📋 Paso 1: Obteniendo resoluciones primigenias...")
    try:
        response = requests.get("http://localhost:8000/api/v1/rutas/resoluciones-primigenias", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            resoluciones = data.get('resoluciones', [])
            print(f"   ✅ {len(resoluciones)} resoluciones disponibles")
            
            if resoluciones:
                # Seleccionar la primera resolución
                resolucion_seleccionada = resoluciones[0]
                print(f"   🎯 Seleccionada: {resolucion_seleccionada.get('nroResolucion')}")
                
                empresa = resolucion_seleccionada.get('empresa')
                if empresa:
                    print(f"   🏢 Empresa automática: {empresa.get('ruc')} - {empresa.get('razonSocial')}")
                
                # Paso 2: Generar código automático
                print("\n📋 Paso 2: Generando código automático...")
                resolucion_id = resolucion_seleccionada.get('id')
                
                codigo_response = requests.get(
                    f"http://localhost:8000/api/v1/rutas/resolucion/{resolucion_id}/siguiente-codigo",
                    timeout=10
                )
                
                if codigo_response.status_code == 200:
                    codigo_data = codigo_response.json()
                    codigo_generado = codigo_data.get('siguienteCodigo')
                    print(f"   ✅ Código generado: {codigo_generado}")
                    
                    # Paso 3: Crear ruta con datos completos
                    print("\n📋 Paso 3: Creando ruta...")
                    
                    nueva_ruta = {
                        "codigoRuta": codigo_generado,
                        "nombre": "Puno - Cusco (Flujo Directo)",
                        "origenId": "PUNO_001",
                        "destinoId": "CUSCO_001",
                        "origen": "Puno",
                        "destino": "Cusco",
                        "frecuencias": "Diaria, 2 veces al día",
                        "tipoRuta": "INTERPROVINCIAL",
                        "tipoServicio": "PASAJEROS",
                        "empresaId": empresa.get('id') if empresa else '',
                        "resolucionId": resolucion_id,
                        "observaciones": "Ruta creada con flujo de selección directa"
                    }
                    
                    create_response = requests.post(
                        "http://localhost:8000/api/v1/rutas/",
                        json=nueva_ruta,
                        timeout=10
                    )
                    
                    print(f"   📊 Status creación: {create_response.status_code}")
                    
                    if create_response.status_code == 201:
                        ruta_creada = create_response.json()
                        print(f"   ✅ Ruta creada exitosamente!")
                        print(f"      ID: {ruta_creada.get('id')}")
                        print(f"      Código: {ruta_creada.get('codigoRuta')}")
                        print(f"      Nombre: {ruta_creada.get('nombre')}")
                        return True
                    else:
                        error_detail = create_response.json() if create_response.status_code != 500 else {"detail": "Error interno"}
                        print(f"   ❌ Error creando ruta: {error_detail.get('detail', 'Error desconocido')}")
                        return False
                else:
                    print(f"   ❌ Error generando código: {codigo_response.status_code}")
                    return False
            else:
                print("   ❌ No hay resoluciones disponibles")
                return False
        else:
            print(f"   ❌ Error obteniendo resoluciones: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error en flujo directo: {e}")
        return False

def test_flujo_empresa_resolucion():
    """Test del flujo: Empresa → Resolución"""
    print("\n🧪 FLUJO 2: Selección Empresa → Resolución")
    print("="*50)
    
    # Paso 1: Obtener empresas
    print("📋 Paso 1: Obteniendo empresas...")
    try:
        response = requests.get("http://localhost:8000/api/v1/empresas/", timeout=10)
        
        if response.status_code == 200:
            empresas = response.json()
            print(f"   ✅ {len(empresas)} empresas disponibles")
            
            if empresas:
                # Seleccionar la primera empresa
                empresa_seleccionada = empresas[0]
                empresa_id = empresa_seleccionada.get('id')
                print(f"   🎯 Seleccionada: {empresa_seleccionada.get('ruc')} - {empresa_seleccionada.get('razonSocial', {}).get('principal', 'Sin razón social')}")
                
                # Paso 2: Obtener resoluciones de la empresa
                print("\n📋 Paso 2: Obteniendo resoluciones de la empresa...")
                
                resoluciones_response = requests.get(
                    f"http://localhost:8000/api/v1/rutas/empresa/{empresa_id}/resoluciones-primigenias",
                    timeout=10
                )
                
                if resoluciones_response.status_code == 200:
                    resoluciones_data = resoluciones_response.json()
                    resoluciones = resoluciones_data.get('resoluciones', [])
                    print(f"   ✅ {len(resoluciones)} resoluciones de la empresa")
                    
                    if resoluciones:
                        # Seleccionar la primera resolución
                        resolucion_seleccionada = resoluciones[0]
                        resolucion_id = resolucion_seleccionada.get('id')
                        print(f"   🎯 Seleccionada: {resolucion_seleccionada.get('nroResolucion')}")
                        
                        # Paso 3: Generar código automático
                        print("\n📋 Paso 3: Generando código automático...")
                        
                        codigo_response = requests.get(
                            f"http://localhost:8000/api/v1/rutas/resolucion/{resolucion_id}/siguiente-codigo",
                            timeout=10
                        )
                        
                        if codigo_response.status_code == 200:
                            codigo_data = codigo_response.json()
                            codigo_generado = codigo_data.get('siguienteCodigo')
                            print(f"   ✅ Código generado: {codigo_generado}")
                            
                            # Paso 4: Crear ruta
                            print("\n📋 Paso 4: Creando ruta...")
                            
                            nueva_ruta = {
                                "codigoRuta": codigo_generado,
                                "nombre": "Juliaca - Arequipa (Flujo Empresa)",
                                "origenId": "JULIACA_001",
                                "destinoId": "AREQUIPA_001",
                                "origen": "Juliaca",
                                "destino": "Arequipa",
                                "frecuencias": "Diaria, 3 veces al día",
                                "tipoRuta": "INTERPROVINCIAL",
                                "tipoServicio": "PASAJEROS",
                                "empresaId": empresa_id,
                                "resolucionId": resolucion_id,
                                "observaciones": "Ruta creada con flujo empresa → resolución"
                            }
                            
                            create_response = requests.post(
                                "http://localhost:8000/api/v1/rutas/",
                                json=nueva_ruta,
                                timeout=10
                            )
                            
                            print(f"   📊 Status creación: {create_response.status_code}")
                            
                            if create_response.status_code == 201:
                                ruta_creada = create_response.json()
                                print(f"   ✅ Ruta creada exitosamente!")
                                print(f"      ID: {ruta_creada.get('id')}")
                                print(f"      Código: {ruta_creada.get('codigoRuta')}")
                                print(f"      Nombre: {ruta_creada.get('nombre')}")
                                return True
                            else:
                                error_detail = create_response.json() if create_response.status_code != 500 else {"detail": "Error interno"}
                                print(f"   ❌ Error creando ruta: {error_detail.get('detail', 'Error desconocido')}")
                                return False
                        else:
                            print(f"   ❌ Error generando código: {codigo_response.status_code}")
                            return False
                    else:
                        print("   ❌ La empresa no tiene resoluciones primigenias")
                        return False
                else:
                    print(f"   ❌ Error obteniendo resoluciones de empresa: {resoluciones_response.status_code}")
                    return False
            else:
                print("   ❌ No hay empresas disponibles")
                return False
        else:
            print(f"   ❌ Error obteniendo empresas: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error en flujo empresa → resolución: {e}")
        return False

def verificar_rutas_creadas():
    """Verificar las rutas creadas en las pruebas"""
    print("\n🔍 Verificando rutas creadas...")
    
    try:
        response = requests.get("http://localhost:8000/api/v1/rutas/", timeout=10)
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"✅ Total de rutas en el sistema: {len(rutas)}")
            
            # Mostrar las últimas rutas (probablemente las que acabamos de crear)
            rutas_recientes = rutas[-3:] if len(rutas) >= 3 else rutas
            
            print("\n📋 Rutas recientes:")
            for i, ruta in enumerate(rutas_recientes, 1):
                print(f"   {i}. {ruta.get('codigoRuta', 'Sin código')} - {ruta.get('nombre', 'Sin nombre')}")
                print(f"      Estado: {ruta.get('estado', 'N/A')}")
                print(f"      Tipo: {ruta.get('tipoRuta', 'N/A')} - {ruta.get('tipoServicio', 'N/A')}")
                print(f"      Observaciones: {ruta.get('observaciones', 'Sin observaciones')}")
                print()
        else:
            print(f"❌ Error obteniendo rutas: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error verificando rutas: {e}")

def main():
    """Función principal"""
    print("🚀 TEST DE FLUJOS COMPLETOS DE CREACIÓN DE RUTAS")
    print("="*60)
    
    # Probar ambos flujos
    flujo1_exitoso = test_flujo_resolucion_directa()
    flujo2_exitoso = test_flujo_empresa_resolucion()
    
    # Verificar resultados
    verificar_rutas_creadas()
    
    # Resumen final
    print("\n" + "="*60)
    print("📊 RESUMEN DE PRUEBAS")
    print("="*60)
    print(f"Flujo 1 (Resolución Directa): {'✅ EXITOSO' if flujo1_exitoso else '❌ FALLÓ'}")
    print(f"Flujo 2 (Empresa → Resolución): {'✅ EXITOSO' if flujo2_exitoso else '❌ FALLÓ'}")
    
    if flujo1_exitoso and flujo2_exitoso:
        print("\n🎉 AMBOS FLUJOS FUNCIONAN CORRECTAMENTE")
        print("El formulario mejorado está listo para usar!")
    else:
        print("\n⚠️  ALGUNOS FLUJOS PRESENTAN PROBLEMAS")
        print("Revisar logs para identificar issues específicos")

if __name__ == "__main__":
    main()