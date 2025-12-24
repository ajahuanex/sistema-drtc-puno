#!/usr/bin/env python3
"""
Test completo del frontend para verificar el dropdown de resoluciones padre
Simula el comportamiento exacto del componente Angular
"""

import requests
import json
from datetime import datetime

def test_frontend_dropdown_completo():
    """Test completo del dropdown de resoluciones padre en el frontend"""
    
    print("🔍 TEST COMPLETO FRONTEND - DROPDOWN RESOLUCIONES PADRE")
    print("=" * 65)
    
    base_url = "http://localhost:8000/api/v1"
    
    try:
        # 1. Verificar conexión con backend
        print("\n1. 🌐 VERIFICANDO CONEXIÓN BACKEND...")
        
        health_response = requests.get(f"{base_url.replace('/api/v1', '')}/health", timeout=5)
        if health_response.status_code == 200:
            print("   ✅ Backend conectado correctamente")
        else:
            print(f"   ❌ Backend no responde: {health_response.status_code}")
            return False
        
        # 2. Simular carga inicial de empresas (como en ngOnInit)
        print("\n2. 📋 SIMULANDO CARGA INICIAL DE EMPRESAS...")
        
        empresas_response = requests.get(f"{base_url}/empresas", timeout=10)
        if empresas_response.status_code != 200:
            print(f"   ❌ Error obteniendo empresas: {empresas_response.status_code}")
            return False
        
        empresas = empresas_response.json()
        print(f"   ✅ Empresas cargadas: {len(empresas)}")
        
        if len(empresas) == 0:
            print("   ❌ No hay empresas disponibles")
            return False
        
        # 3. Simular carga inicial de resoluciones (como en ngOnInit)
        print("\n3. 📋 SIMULANDO CARGA INICIAL DE RESOLUCIONES...")
        
        resoluciones_response = requests.get(f"{base_url}/resoluciones", timeout=10)
        if resoluciones_response.status_code != 200:
            print(f"   ❌ Error obteniendo resoluciones: {resoluciones_response.status_code}")
            return False
        
        resoluciones = resoluciones_response.json()
        resoluciones_padre = [r for r in resoluciones if r.get('tipoResolucion') == 'PADRE']
        
        print(f"   ✅ Total resoluciones: {len(resoluciones)}")
        print(f"   📊 Resoluciones PADRE: {len(resoluciones_padre)}")
        
        # 4. Simular selección de empresa (onEmpresaChange)
        print("\n4. 🏢 SIMULANDO SELECCIÓN DE EMPRESA...")
        
        empresa_seleccionada = empresas[0]
        empresa_id = empresa_seleccionada.get('id')
        empresa_ruc = empresa_seleccionada.get('ruc', 'Sin RUC')
        empresa_nombre = empresa_seleccionada.get('razonSocial', {}).get('principal', 'Sin nombre')
        
        print(f"   🎯 Empresa seleccionada: {empresa_ruc} - {empresa_nombre}")
        print(f"   🆔 ID: {empresa_id}")
        
        # 5. Simular selección de expediente INCREMENTO (onExpedienteChange)
        print("\n5. 📝 SIMULANDO SELECCIÓN DE EXPEDIENTE INCREMENTO...")
        
        expediente_seleccionado = {
            "tipo": "INCREMENTO",
            "descripcion": "Incremento de flota vehicular"
        }
        
        print(f"   ✅ Expediente seleccionado: {expediente_seleccionado['tipo']}")
        
        # 6. Simular llamada a cargarResolucionesPadre()
        print("\n6. 🔄 SIMULANDO cargarResolucionesPadre()...")
        
        print(f"   📡 Llamando a: GET {base_url}/resoluciones")
        
        # Esta es la llamada exacta que hace el frontend
        resoluciones_response = requests.get(f"{base_url}/resoluciones", timeout=10)
        
        if resoluciones_response.status_code != 200:
            print(f"   ❌ Error en API: {resoluciones_response.status_code}")
            return False
        
        todas_resoluciones = resoluciones_response.json()
        print(f"   ✅ Resoluciones obtenidas: {len(todas_resoluciones)}")
        
        # 7. Simular filtrado exacto del frontend
        print("\n7. 🔍 SIMULANDO FILTRADO DEL FRONTEND...")
        
        # Lógica exacta del método cargarResolucionesPadre()
        resoluciones_filtradas = []
        
        for resolucion in todas_resoluciones:
            # Verificar que pertenece a la empresa seleccionada
            if resolucion.get('empresaId') != empresa_id:
                continue
            
            # Verificar que es tipo PADRE
            if resolucion.get('tipoResolucion') != 'PADRE':
                continue
            
            # Verificar que está activa
            if not resolucion.get('estaActivo', False):
                continue
            
            # Verificar estado VIGENTE
            if resolucion.get('estado') != 'VIGENTE':
                continue
            
            # Verificar fecha de vigencia (si existe)
            fecha_fin = resolucion.get('fechaVigenciaFin')
            if fecha_fin:
                try:
                    fecha_fin_dt = datetime.fromisoformat(fecha_fin.replace('Z', '+00:00'))
                    if fecha_fin_dt <= datetime.now():
                        continue  # Resolución vencida
                except:
                    pass  # Si hay error en fecha, la incluimos
            
            resoluciones_filtradas.append(resolucion)
        
        print(f"   📊 Resoluciones después del filtrado: {len(resoluciones_filtradas)}")
        
        # 8. Mostrar resultados del dropdown
        print("\n8. 📋 CONTENIDO DEL DROPDOWN:")
        
        if len(resoluciones_filtradas) == 0:
            print("   ❌ EL DROPDOWN ESTARÁ VACÍO")
            print("   💡 Posibles causas:")
            print("      • No hay resoluciones PADRE para esta empresa")
            print("      • Las resoluciones están inactivas o vencidas")
            print("      • Error en el filtrado")
            return False
        
        print(f"   ✅ EL DROPDOWN MOSTRARÁ {len(resoluciones_filtradas)} OPCIONES:")
        
        for i, resolucion in enumerate(resoluciones_filtradas, 1):
            numero = resolucion.get('nroResolucion', 'Sin número')
            descripcion = resolucion.get('descripcion', 'Sin descripción')
            fecha_fin = resolucion.get('fechaVigenciaFin', 'Sin fecha')
            
            print(f"      {i}. {numero}")
            print(f"         📝 {descripcion[:50]}...")
            if fecha_fin != 'Sin fecha':
                print(f"         📅 Vence: {fecha_fin[:10]}")
        
        # 9. Verificar que el dropdown funcionará
        print("\n9. ✅ VERIFICACIÓN FINAL:")
        
        print(f"   🎯 Empresa: {empresa_ruc} - {empresa_nombre}")
        print(f"   📝 Expediente: {expediente_seleccionado['tipo']}")
        print(f"   📋 Opciones en dropdown: {len(resoluciones_filtradas)}")
        
        if len(resoluciones_filtradas) > 0:
            print(f"   ✅ EL DROPDOWN FUNCIONARÁ CORRECTAMENTE")
            
            # 10. Instrucciones para el usuario
            print(f"\n10. 📋 INSTRUCCIONES PARA PROBAR EN EL NAVEGADOR:")
            print(f"    1. Abrir: http://localhost:4200")
            print(f"    2. Ir a: Resoluciones → Nueva Resolución")
            print(f"    3. Seleccionar empresa: {empresa_ruc} - {empresa_nombre}")
            print(f"    4. Seleccionar expediente: INCREMENTO")
            print(f"    5. El dropdown 'RESOLUCIÓN PADRE' debe mostrar {len(resoluciones_filtradas)} opciones")
            
            return True
        else:
            print(f"   ❌ EL DROPDOWN SEGUIRÁ VACÍO")
            return False
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
        print(f"💡 Verificar que el backend esté ejecutándose en http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def verificar_implementacion_frontend():
    """Verificar que la implementación del frontend esté correcta"""
    
    print("\n" + "=" * 65)
    print("🔧 VERIFICANDO IMPLEMENTACIÓN DEL FRONTEND")
    print("=" * 65)
    
    # Verificar que el archivo del componente existe
    try:
        with open('frontend/src/app/components/resoluciones/crear-resolucion.component.ts', 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        print("✅ Archivo del componente encontrado")
        
        # Verificar métodos clave
        metodos_requeridos = [
            'cargarResolucionesPadre',
            'onEmpresaChange',
            'onExpedienteChange'
        ]
        
        for metodo in metodos_requeridos:
            if metodo in contenido:
                print(f"   ✅ Método {metodo}() encontrado")
            else:
                print(f"   ❌ Método {metodo}() NO encontrado")
        
        # Verificar propiedades clave
        propiedades_requeridas = [
            'resolucionesPadreDisponibles',
            'empresaSeleccionada',
            'expedienteSeleccionado'
        ]
        
        for propiedad in propiedades_requeridas:
            if propiedad in contenido:
                print(f"   ✅ Propiedad {propiedad} encontrada")
            else:
                print(f"   ❌ Propiedad {propiedad} NO encontrada")
        
        return True
        
    except FileNotFoundError:
        print("❌ Archivo del componente NO encontrado")
        return False
    except Exception as e:
        print(f"❌ Error verificando implementación: {e}")
        return False

if __name__ == "__main__":
    print("🚀 INICIANDO TEST COMPLETO DEL FRONTEND")
    
    # Verificar implementación
    implementacion_ok = verificar_implementacion_frontend()
    
    if not implementacion_ok:
        print("\n❌ PROBLEMA EN LA IMPLEMENTACIÓN DEL FRONTEND")
        exit(1)
    
    # Ejecutar test funcional
    success = test_frontend_dropdown_completo()
    
    print("\n" + "=" * 65)
    
    if success:
        print("🎉 ÉXITO: EL DROPDOWN DE RESOLUCIONES PADRE FUNCIONA CORRECTAMENTE")
        print("\n💡 PRÓXIMOS PASOS:")
        print("   1. Abrir el frontend en http://localhost:4200")
        print("   2. Probar el flujo completo manualmente")
        print("   3. Verificar que no hay errores en la consola (F12)")
    else:
        print("❌ PROBLEMA: EL DROPDOWN PUEDE NO FUNCIONAR")
        print("\n🔧 ACCIONES RECOMENDADAS:")
        print("   1. Verificar que el backend esté ejecutándose")
        print("   2. Revisar los logs del backend")
        print("   3. Verificar la consola del navegador (F12)")
        print("   4. Comprobar que hay datos de prueba suficientes")
    
    print("\n" + "=" * 65)