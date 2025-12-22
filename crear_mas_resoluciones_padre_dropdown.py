#!/usr/bin/env python3
"""
Script para crear más resoluciones padre para el dropdown
"""

import requests
import json
from datetime import datetime, timedelta

def crear_mas_resoluciones_padre():
    """Crear más resoluciones padre para que el dropdown tenga más opciones"""
    
    print("🔧 CREANDO MÁS RESOLUCIONES PADRE PARA EL DROPDOWN")
    print("=" * 55)
    
    base_url = "http://localhost:8000/api/v1"
    
    try:
        # 1. Obtener empresa existente
        print("\n1. 🏢 OBTENIENDO EMPRESA EXISTENTE...")
        
        empresas_response = requests.get(f"{base_url}/empresas", timeout=10)
        if empresas_response.status_code != 200:
            print(f"   ❌ Error obteniendo empresas: {empresas_response.status_code}")
            return False
        
        empresas = empresas_response.json()
        if len(empresas) == 0:
            print("   ❌ No hay empresas disponibles")
            return False
        
        empresa = empresas[0]  # Usar la primera empresa
        empresa_id = empresa.get('id')
        ruc = empresa.get('ruc', 'Sin RUC')
        razon_social = empresa.get('razonSocial', {}).get('principal', 'Sin razón social')
        
        print(f"   ✅ Empresa seleccionada: {ruc} - {razon_social}")
        print(f"   📋 ID: {empresa_id}")
        
        # 2. Crear múltiples resoluciones padre
        print(f"\n2. 📝 CREANDO RESOLUCIONES PADRE...")
        
        resoluciones_a_crear = [
            {
                "numero": "0002",
                "tipo": "RENOVACION",
                "descripcion": "Resolución padre de renovación - Opción 1 para dropdown",
                "vigencia_anos": 4
            },
            {
                "numero": "0003", 
                "tipo": "AUTORIZACION_NUEVA",
                "descripcion": "Resolución padre primigenia - Opción 2 para dropdown",
                "vigencia_anos": 5
            },
            {
                "numero": "0004",
                "tipo": "RENOVACION", 
                "descripcion": "Resolución padre de renovación - Opción 3 para dropdown",
                "vigencia_anos": 3
            },
            {
                "numero": "0005",
                "tipo": "AUTORIZACION_NUEVA",
                "descripcion": "Resolución padre primigenia - Opción 4 para dropdown", 
                "vigencia_anos": 5
            }
        ]
        
        creadas_exitosamente = 0
        
        for i, resolucion_info in enumerate(resoluciones_a_crear, 1):
            numero_completo = f"R-{resolucion_info['numero']}-2025"
            print(f"   📝 Creando {i}/4: {numero_completo}")
            
            # Calcular fechas
            fecha_inicio = datetime.now()
            fecha_fin = fecha_inicio + timedelta(days=365 * resolucion_info['vigencia_anos'])
            
            resolucion_data = {
                "nroResolucion": numero_completo,
                "tipoTramite": resolucion_info["tipo"],
                "tipoResolucion": "PADRE",
                "empresaId": empresa_id,
                "expedienteId": f"exp-dropdown-{resolucion_info['numero']}",
                "fechaEmision": fecha_inicio.isoformat(),
                "fechaVigenciaInicio": fecha_inicio.isoformat(),
                "fechaVigenciaFin": fecha_fin.isoformat(),
                "descripcion": resolucion_info["descripcion"],
                "estado": "VIGENTE",
                "estaActivo": True,
                "usuarioEmisionId": "admin",  # Campo requerido
                "resolucionesHijasIds": [],
                "vehiculosHabilitadosIds": [],
                "rutasAutorizadasIds": []
            }
            
            try:
                response = requests.post(
                    f"{base_url}/resoluciones",
                    json=resolucion_data,
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code in [200, 201]:
                    print(f"      ✅ Creada exitosamente")
                    creadas_exitosamente += 1
                else:
                    print(f"      ❌ Error: {response.status_code}")
                    if response.text:
                        print(f"      📄 Detalle: {response.text[:100]}")
                        
            except requests.exceptions.RequestException as e:
                print(f"      ❌ Error de conexión: {e}")
            except Exception as e:
                print(f"      ❌ Error inesperado: {e}")
        
        print(f"\n   📊 RESULTADO: {creadas_exitosamente}/{len(resoluciones_a_crear)} resoluciones creadas")
        
        # 3. Verificar el resultado final
        print(f"\n3. 🔍 VERIFICANDO RESULTADO FINAL...")
        
        resoluciones_response = requests.get(f"{base_url}/resoluciones", timeout=10)
        if resoluciones_response.status_code == 200:
            resoluciones = resoluciones_response.json()
            resoluciones_padre = [r for r in resoluciones if 
                                r.get('tipoResolucion') == 'PADRE' and 
                                r.get('empresaId') == empresa_id]
            
            print(f"   ✅ Total resoluciones PADRE para la empresa: {len(resoluciones_padre)}")
            
            print(f"\n   📋 RESOLUCIONES DISPONIBLES PARA EL DROPDOWN:")
            for i, resolucion in enumerate(resoluciones_padre, 1):
                numero = resolucion.get('nroResolucion', 'Sin número')
                tipo = resolucion.get('tipoTramite', 'Sin tipo')
                estado = resolucion.get('estado', 'Sin estado')
                fecha_fin = resolucion.get('fechaVigenciaFin', 'Sin fecha')
                
                print(f"      {i}. {numero} ({tipo}) - {estado}")
                if fecha_fin != 'Sin fecha':
                    print(f"         Vence: {fecha_fin[:10]}")
            
            if len(resoluciones_padre) >= 3:
                print(f"\n   ✅ ÉXITO: El dropdown ahora tiene {len(resoluciones_padre)} opciones")
                
                # 4. Instrucciones para el usuario
                print(f"\n4. 📋 INSTRUCCIONES PARA PROBAR EL DROPDOWN:")
                print(f"   1. Abrir frontend: http://localhost:4200")
                print(f"   2. Ir a Resoluciones → Nueva Resolución")
                print(f"   3. Seleccionar empresa: {ruc} - {razon_social}")
                print(f"   4. Seleccionar expediente tipo INCREMENTO")
                print(f"   5. Verificar que el dropdown 'RESOLUCIÓN PADRE' muestre {len(resoluciones_padre)} opciones:")
                
                for resolucion in resoluciones_padre:
                    numero = resolucion.get('nroResolucion', 'Sin número')
                    fecha_fin = resolucion.get('fechaVigenciaFin', 'Sin fecha')
                    print(f"      • {numero} - Vence: {fecha_fin[:10] if fecha_fin != 'Sin fecha' else 'Sin fecha'}")
                
                print(f"\n5. 🔧 SI EL DROPDOWN SIGUE VACÍO:")
                print(f"   • Abrir consola del navegador (F12)")
                print(f"   • Verificar errores en la pestaña Console")
                print(f"   • Verificar que el método cargarResolucionesPadre() se ejecute")
                print(f"   • Verificar que la URL del backend sea correcta")
                
                return True
            else:
                print(f"   ⚠️  Solo hay {len(resoluciones_padre)} resoluciones padre")
                return False
        else:
            print(f"   ❌ Error verificando resultado: {resoluciones_response.status_code}")
            return False
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

if __name__ == "__main__":
    success = crear_mas_resoluciones_padre()
    
    print(f"\n" + "=" * 55)
    
    if success:
        print("🎉 RESOLUCIONES PADRE CREADAS EXITOSAMENTE")
        print("💡 El dropdown debería mostrar múltiples opciones ahora")
    else:
        print("❌ HUBO PROBLEMAS CREANDO LAS RESOLUCIONES")
        print("💡 Verificar el estado del backend y la base de datos")
    
    print(f"\n🔍 PRÓXIMO PASO: Probar el dropdown en el frontend")
    print(f"   URL: http://localhost:4200/resoluciones/nueva")