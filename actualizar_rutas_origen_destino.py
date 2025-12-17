#!/usr/bin/env python3
"""
Script para actualizar las rutas existentes con origen y destino reales
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

def obtener_rutas_actuales():
    """Obtener todas las rutas actuales"""
    try:
        response = requests.get(f"{BASE_URL}/rutas")
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Error al obtener rutas: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return []

def generar_datos_origen_destino():
    """Generar datos de origen y destino basados en Puno"""
    return [
        {"origen": "Puno", "destino": "Juliaca"},
        {"origen": "Puno", "destino": "Arequipa"},
        {"origen": "Puno", "destino": "Cusco"},
        {"origen": "Juliaca", "destino": "Arequipa"},
        {"origen": "Juliaca", "destino": "Cusco"},
        {"origen": "Cusco", "destino": "Arequipa"},
        {"origen": "Arequipa", "destino": "Tacna"},
        {"origen": "Puno", "destino": "La Paz"},
        {"origen": "Juliaca", "destino": "Puno"}
    ]

def actualizar_rutas_con_origen_destino():
    """Actualizar las rutas existentes con origen y destino"""
    print("🔄 ACTUALIZANDO RUTAS CON ORIGEN Y DESTINO")
    print("=" * 60)
    
    # Obtener rutas actuales
    rutas = obtener_rutas_actuales()
    if not rutas:
        print("❌ No se pudieron obtener las rutas")
        return False
    
    print(f"📊 Rutas encontradas: {len(rutas)}")
    
    # Generar datos de origen y destino
    datos_origen_destino = generar_datos_origen_destino()
    
    rutas_actualizadas = 0
    
    for i, ruta in enumerate(rutas):
        # Asignar origen y destino cíclicamente
        datos = datos_origen_destino[i % len(datos_origen_destino)]
        
        ruta_id = ruta.get('id')
        if not ruta_id:
            print(f"⚠️ Ruta {i+1} sin ID, saltando...")
            continue
        
        # Preparar datos de actualización
        datos_actualizacion = {
            "origen": datos["origen"],
            "destino": datos["destino"]
        }
        
        print(f"🔄 Actualizando ruta {i+1}: [{ruta.get('codigoRuta', 'N/A')}] {datos['origen']} → {datos['destino']}")
        
        try:
            # Actualizar ruta (simulado - el endpoint PUT puede no estar implementado)
            # Por ahora solo mostramos lo que se haría
            print(f"   ✅ Datos preparados: {datos_actualizacion}")
            rutas_actualizadas += 1
            
        except Exception as e:
            print(f"   ❌ Error al actualizar: {e}")
    
    print(f"\n📊 RESUMEN:")
    print(f"   • Rutas procesadas: {len(rutas)}")
    print(f"   • Rutas actualizadas: {rutas_actualizadas}")
    
    return rutas_actualizadas > 0

def crear_rutas_con_datos_completos():
    """Crear nuevas rutas con datos completos de origen y destino"""
    print("\n🔄 CREANDO RUTAS CON DATOS COMPLETOS")
    print("=" * 60)
    
    rutas_nuevas = [
        {
            "codigoRuta": "PJ-001",
            "nombre": "Puno - Juliaca",
            "origen": "Puno",
            "destino": "Juliaca",
            "origenId": "PUNO_001",
            "destinoId": "JULIACA_001",
            "frecuencias": "Diaria, cada 30 minutos",
            "estado": "ACTIVA",
            "tipoRuta": "INTERPROVINCIAL",
            "tipoServicio": "PASAJEROS",
            "distancia": 45.0,
            "empresaId": "694186fec6302fb8566ba09e",  # ID de empresa existente
            "resolucionId": "694187b1c6302fb8566ba0a0"  # ID de resolución existente
        },
        {
            "codigoRuta": "PA-002",
            "nombre": "Puno - Arequipa",
            "origen": "Puno",
            "destino": "Arequipa",
            "origenId": "PUNO_001",
            "destinoId": "AREQUIPA_001",
            "frecuencias": "Diaria, 2 veces al día",
            "estado": "ACTIVA",
            "tipoRuta": "INTERPROVINCIAL",
            "tipoServicio": "PASAJEROS",
            "distancia": 280.0,
            "empresaId": "694186fec6302fb8566ba09e",
            "resolucionId": "694187b1c6302fb8566ba0a0"
        },
        {
            "codigoRuta": "JA-003",
            "nombre": "Juliaca - Arequipa",
            "origen": "Juliaca",
            "destino": "Arequipa",
            "origenId": "JULIACA_001",
            "destinoId": "AREQUIPA_001",
            "frecuencias": "Diaria, 3 veces al día",
            "estado": "ACTIVA",
            "tipoRuta": "INTERPROVINCIAL",
            "tipoServicio": "PASAJEROS",
            "distancia": 235.0,
            "empresaId": "694186fec6302fb8566ba09e",
            "resolucionId": "694187b1c6302fb8566ba0a0"
        },
        {
            "codigoRuta": "PC-004",
            "nombre": "Puno - Cusco",
            "origen": "Puno",
            "destino": "Cusco",
            "origenId": "PUNO_001",
            "destinoId": "CUSCO_001",
            "frecuencias": "Diaria, 1 vez al día",
            "estado": "ACTIVA",
            "tipoRuta": "INTERPROVINCIAL",
            "tipoServicio": "PASAJEROS",
            "distancia": 350.0,
            "empresaId": "694186fec6302fb8566ba09e",
            "resolucionId": "6941bb5d5e0d9aefe5627d84"  # Otra resolución
        }
    ]
    
    rutas_creadas = 0
    
    for ruta in rutas_nuevas:
        print(f"🔄 Creando ruta: [{ruta['codigoRuta']}] {ruta['origen']} → {ruta['destino']}")
        
        try:
            response = requests.post(f"{BASE_URL}/rutas", json=ruta)
            if response.status_code == 201:
                print(f"   ✅ Ruta creada exitosamente")
                rutas_creadas += 1
            else:
                print(f"   ❌ Error al crear ruta: {response.status_code}")
                if response.text:
                    print(f"      Detalle: {response.text[:100]}")
                
        except Exception as e:
            print(f"   ❌ Error de conexión: {e}")
    
    print(f"\n📊 RESUMEN CREACIÓN:")
    print(f"   • Rutas intentadas: {len(rutas_nuevas)}")
    print(f"   • Rutas creadas: {rutas_creadas}")
    
    return rutas_creadas

def verificar_resultado_final():
    """Verificar el resultado final después de las actualizaciones"""
    print(f"\n🔍 VERIFICACIÓN FINAL")
    print("=" * 60)
    
    rutas = obtener_rutas_actuales()
    if not rutas:
        print("❌ No se pudieron obtener las rutas")
        return
    
    print(f"📊 Total rutas después de actualización: {len(rutas)}")
    
    rutas_con_origen_destino = 0
    combinaciones = set()
    
    print(f"\n📋 RUTAS CON ORIGEN Y DESTINO:")
    for i, ruta in enumerate(rutas):
        origen = ruta.get('origen')
        destino = ruta.get('destino')
        codigo = ruta.get('codigoRuta', 'N/A')
        
        if origen and destino and origen != 'None' and destino != 'None':
            print(f"   {i+1}. [{codigo}] {origen} → {destino}")
            combinaciones.add(f"{origen} → {destino}")
            rutas_con_origen_destino += 1
    
    print(f"\n📊 RESULTADO FINAL:")
    print(f"   • Rutas válidas: {rutas_con_origen_destino}/{len(rutas)}")
    print(f"   • Combinaciones únicas: {len(combinaciones)}")
    
    if len(combinaciones) > 0:
        print(f"\n🎯 COMBINACIONES DISPONIBLES PARA EL BUSCADOR:")
        for i, comb in enumerate(sorted(combinaciones), 1):
            print(f"   {i}. {comb}")
        
        print(f"\n✅ EL BUSCADOR INTELIGENTE AHORA TENDRÁ DATOS REALES")
    else:
        print(f"\n⚠️ AÚN NO HAY DATOS VÁLIDOS PARA EL BUSCADOR")

if __name__ == "__main__":
    print("🚀 ACTUALIZACIÓN DE RUTAS CON ORIGEN Y DESTINO")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Crear rutas nuevas con datos completos
    rutas_creadas = crear_rutas_con_datos_completos()
    
    # Verificar resultado final
    verificar_resultado_final()
    
    print(f"\n" + "=" * 60)
    print("📋 PRÓXIMOS PASOS")
    print("=" * 60)
    
    if rutas_creadas > 0:
        print(f"\n✅ RUTAS CREADAS EXITOSAMENTE")
        print(f"   Ahora el buscador inteligente tendrá datos reales")
        print(f"\n🎯 PROBAR EN EL FRONTEND:")
        print(f"   1. Ir a http://localhost:4200/rutas")
        print(f"   2. Expandir 'Filtros Avanzados'")
        print(f"   3. Escribir 'PUNO' en el buscador")
        print(f"   4. Deberían aparecer múltiples opciones")
    else:
        print(f"\n⚠️ NO SE PUDIERON CREAR RUTAS NUEVAS")
        print(f"   El buscador usará datos de fallback")
        print(f"   Verificar que el backend esté funcionando")
    
    print(f"\n🔧 ALTERNATIVA:")
    print(f"   Si no se pueden crear rutas, el frontend tiene")
    print(f"   un sistema de fallback con datos de ejemplo")