#!/usr/bin/env python3
"""
Script para mostrar los primeros 3 registros de rutas con todos los detalles
"""

import requests
import json

def debug_primeras_3_rutas():
    print("🔍 DEBUG - PRIMERAS 3 RUTAS DEL API")
    print("=" * 60)
    
    try:
        # Hacer request al endpoint de rutas
        response = requests.get('http://localhost:8000/api/v1/rutas/')
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"✅ Total rutas recibidas: {len(rutas)}")
            
            # Mostrar solo las primeras 3 rutas
            for i, ruta in enumerate(rutas[:3], 1):
                print(f"\n📋 RUTA {i}:")
                print("=" * 40)
                print(f"ID: {ruta.get('id', 'N/A')}")
                print(f"Código: {ruta.get('codigoRuta', 'N/A')}")
                print(f"Nombre: {ruta.get('nombre', 'N/A')}")
                print(f"Descripción: {ruta.get('descripcion', 'N/A')}")
                
                # EMPRESA
                empresa = ruta.get('empresa', {})
                print(f"\n🏢 EMPRESA:")
                print(f"   ID: {empresa.get('id', 'N/A')}")
                print(f"   RUC: {empresa.get('ruc', 'N/A')}")
                print(f"   Razón Social: {empresa.get('razonSocial', 'N/A')}")
                
                # FRECUENCIA (SINGULAR) - LO QUE DEBERÍA USAR EL FRONTEND
                frecuencia = ruta.get('frecuencia', {})
                print(f"\n🕐 FRECUENCIA (singular):")
                print(f"   Tipo: {frecuencia.get('tipo', 'N/A')}")
                print(f"   Cantidad: {frecuencia.get('cantidad', 'N/A')}")
                print(f"   Días: {frecuencia.get('dias', 'N/A')}")
                print(f"   ⭐ DESCRIPCIÓN: '{frecuencia.get('descripcion', 'N/A')}'")
                
                # FRECUENCIAS (PLURAL) - PARA COMPATIBILIDAD
                frecuencias = ruta.get('frecuencias', 'N/A')
                print(f"\n🕐 FRECUENCIAS (plural): '{frecuencias}'")
                
                # ORIGEN Y DESTINO
                origen = ruta.get('origen', {})
                destino = ruta.get('destino', {})
                print(f"\n📍 UBICACIONES:")
                print(f"   Origen: {origen.get('nombre', 'N/A')}")
                print(f"   Destino: {destino.get('nombre', 'N/A')}")
                
                # RESOLUCIÓN
                resolucion = ruta.get('resolucion', {})
                print(f"\n📄 RESOLUCIÓN:")
                print(f"   ID: {resolucion.get('id', 'N/A')}")
                print(f"   Número: {resolucion.get('nroResolucion', 'N/A')}")
                
                # OTROS CAMPOS IMPORTANTES
                print(f"\n📊 OTROS CAMPOS:")
                print(f"   Tipo Ruta: {ruta.get('tipoRuta', 'N/A')}")
                print(f"   Tipo Servicio: {ruta.get('tipoServicio', 'N/A')}")
                print(f"   Estado: {ruta.get('estado', 'N/A')}")
                
                print("\n" + "="*40)
                
            # RESUMEN PARA EL FRONTEND
            print(f"\n🎯 RESUMEN PARA EL FRONTEND:")
            print("=" * 40)
            print("El frontend debería usar:")
            print("- ruta.frecuencia?.descripcion (PRINCIPAL)")
            print("- ruta.frecuencias (FALLBACK)")
            print("- ruta.descripcion (para itinerario)")
            print("- ruta.empresa?.razonSocial (para empresa)")
            
            # Verificar si las frecuencias están llegando
            primera_ruta = rutas[0] if rutas else {}
            freq_singular = primera_ruta.get('frecuencia', {}).get('descripcion')
            freq_plural = primera_ruta.get('frecuencias')
            
            print(f"\n🔍 VERIFICACIÓN PRIMERA RUTA:")
            print(f"   ruta.frecuencia?.descripcion = '{freq_singular}'")
            print(f"   ruta.frecuencias = '{freq_plural}'")
            
            if freq_singular:
                print("✅ El frontend DEBERÍA mostrar las frecuencias")
            else:
                print("❌ El frontend NO puede mostrar las frecuencias")
                
        else:
            print(f"❌ Error HTTP: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_primeras_3_rutas()