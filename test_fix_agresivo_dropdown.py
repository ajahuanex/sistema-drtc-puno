#!/usr/bin/env python3
"""
Script para verificar el fix agresivo del dropdown
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

def verificar_fix_agresivo():
    """Verificar que el fix agresivo funcione"""
    print("🔧 VERIFICANDO FIX AGRESIVO DEL DROPDOWN")
    print("=" * 70)
    
    empresa_id = "694186fec6302fb8566ba09e"  # Paputec
    
    print(f"🏢 EMPRESA: Paputec")
    print(f"   ID: {empresa_id}")
    
    print(f"\n✅ CAMBIOS IMPLEMENTADOS EN EL FIX AGRESIVO:")
    print(f"   • Agregado ChangeDetectorRef para forzar detección de cambios")
    print(f"   • Llamada a cdr.detectChanges() después de actualizar el signal")
    print(f"   • Método forzarRecargaResoluciones() mejorado con múltiples verificaciones")
    print(f"   • Método resetearDropdownCompleto() para reset total")
    print(f"   • Botón 'Reset Completo' agregado al template")
    
    print(f"\n📋 RESOLUCIONES QUE DEBERÍAN APARECER:")
    
    try:
        # Obtener rutas de la empresa
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/rutas")
        if response.status_code == 200:
            rutas = response.json()
            resoluciones_correctas = set()
            
            for ruta in rutas:
                if ruta.get('resolucionId'):
                    resoluciones_correctas.add(ruta['resolucionId'])
            
            print(f"   Total resoluciones correctas: {len(resoluciones_correctas)}")
            
            for res_id in resoluciones_correctas:
                # Obtener info de la resolución
                res_response = requests.get(f"{BASE_URL}/resoluciones/{res_id}")
                if res_response.status_code == 200:
                    resolucion = res_response.json()
                    numero = resolucion.get('nroResolucion')
                    tipo = resolucion.get('tipoTramite')
                    
                    # Contar rutas
                    rutas_count = len([r for r in rutas if r.get('resolucionId') == res_id])
                    
                    print(f"   ✅ {numero} (ID: {res_id})")
                    print(f"      Tipo: {tipo}")
                    print(f"      Rutas: {rutas_count}")
                    
                    # Verificar endpoint de filtrado
                    filtro_response = requests.get(f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{res_id}")
                    if filtro_response.status_code == 200:
                        rutas_filtradas = filtro_response.json()
                        print(f"      Filtrado: ✅ {len(rutas_filtradas)} rutas")
                    else:
                        print(f"      Filtrado: ❌ Error {filtro_response.status_code}")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print(f"\n❌ RESOLUCIONES QUE NO DEBERÍAN APARECER:")
    resoluciones_incorrectas = [
        'ed6b078b-e4aa-4966-8b35-ca9798e4914c',
        '824108dd-39b3-4fb7-829a-0bec681131f8'
    ]
    
    for res_id in resoluciones_incorrectas:
        try:
            res_response = requests.get(f"{BASE_URL}/resoluciones/{res_id}")
            if res_response.status_code == 200:
                resolucion = res_response.json()
                numero = resolucion.get('nroResolucion')
                
                # Verificar rutas
                filtro_response = requests.get(f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{res_id}")
                if filtro_response.status_code == 200:
                    rutas_incorrectas = filtro_response.json()
                    print(f"   ❌ {numero} (ID: {res_id[:8]}...) - {len(rutas_incorrectas)} rutas")
                    print(f"      ESTA NO DEBERÍA APARECER EN EL DROPDOWN")
        except Exception as e:
            print(f"   ❌ Error con {res_id[:8]}...: {e}")

def generar_instrucciones_fix_agresivo():
    """Generar instrucciones para el fix agresivo"""
    print(f"\n" + "=" * 70)
    print("📋 INSTRUCCIONES PARA PROBAR EL FIX AGRESIVO")
    print("=" * 70)
    
    print(f"\n🔧 PASOS PARA PROBAR:")
    print(f"   1. Abrir el frontend en el navegador")
    print(f"   2. Ir al módulo de Rutas")
    print(f"   3. Si hay problemas, hacer clic en 'Reset Completo' primero")
    print(f"   4. Seleccionar la empresa 'Paputec'")
    print(f"   5. Observar que el dropdown muestre SOLO 2 resoluciones:")
    print(f"      • R-0003-2025 (RENOVACION)")
    print(f"      • R-0005-2025 (PRIMIGENIA)")
    
    print(f"\n🔍 SI SIGUE MOSTRANDO RESOLUCIONES INCORRECTAS:")
    print(f"   1. Hacer clic en 'Reset Completo'")
    print(f"   2. Seleccionar empresa nuevamente")
    print(f"   3. Si no funciona, hacer clic en 'Recargar Resoluciones'")
    print(f"   4. Usar 'Debug' para ver el estado en la consola")
    
    print(f"\n✅ LOGS ESPERADOS EN LA CONSOLA:")
    print(f"   • '🔄 FORZANDO DETECCIÓN DE CAMBIOS...'")
    print(f"   • '✅ RESOLUCIONES CON RUTAS CARGADAS: total: 2'")
    print(f"   • '✅ VERIFICACIÓN 1, 2, 3, 4: SIGNAL CORRECTO'")
    
    print(f"\n🎯 SEÑALES DE ÉXITO:")
    print(f"   • Dropdown muestra exactamente 2 resoluciones")
    print(f"   • Al seleccionar R-0003-2025 → 4 rutas")
    print(f"   • Al seleccionar R-0005-2025 → 1 ruta")
    print(f"   • NO aparecen mensajes de 'Esta resolución no tiene rutas'")
    
    print(f"\n🚨 SI NADA FUNCIONA:")
    print(f"   • Hay un problema más profundo en Angular")
    print(f"   • Posible conflicto con change detection strategy")
    print(f"   • Revisar si hay OnPush strategy en el componente")
    print(f"   • Considerar usar computed() en lugar de signal()")

if __name__ == "__main__":
    print("🚀 INICIANDO VERIFICACIÓN DEL FIX AGRESIVO")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Verificar el fix
    verificar_fix_agresivo()
    
    # Generar instrucciones
    generar_instrucciones_fix_agresivo()
    
    print(f"\n" + "=" * 70)
    print("🏁 CONCLUSIÓN")
    print("=" * 70)
    
    print("✅ FIX AGRESIVO IMPLEMENTADO CON:")
    print("   • Detección forzada de cambios")
    print("   • Múltiples verificaciones del signal")
    print("   • Botón de reset completo")
    print("   • Debugging mejorado")
    
    print(f"\n🎯 PRÓXIMO PASO:")
    print(f"   Probar en el navegador con las instrucciones de arriba")
    print(f"   Si sigue fallando, el problema es más profundo en Angular")