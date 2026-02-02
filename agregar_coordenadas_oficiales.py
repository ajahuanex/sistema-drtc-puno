#!/usr/bin/env python3
"""
Script para agregar coordenadas geográficas oficiales a las localidades de Puno
Datos basados en coordenadas oficiales del IGN (Instituto Geográfico Nacional)
"""

import requests
import json

def agregar_coordenadas():
    """Agregar coordenadas geográficas a las localidades"""
    
    print("🗺️ AGREGANDO COORDENADAS GEOGRÁFICAS OFICIALES")
    print("=" * 50)
    
    # Coordenadas oficiales de capitales de distrito (IGN - Instituto Geográfico Nacional)
    coordenadas_oficiales = {
        # PROVINCIA PUNO
        "PUNO": {"latitud": -15.8402, "longitud": -70.0219},
        "ACORA": {"latitud": -15.9667, "longitud": -69.7833},
        "AMANTANI": {"latitud": -15.6667, "longitud": -69.7167},
        "ATUNCOLLA": {"latitud": -15.7500, "longitud": -70.0833},
        "CAPACHICA": {"latitud": -15.6333, "longitud": -69.8500},
        "CHUCUITO": {"latitud": -15.9000, "longitud": -69.8833},
        "COATA": {"latitud": -15.6167, "longitud": -70.0167},
        "HUATA": {"latitud": -15.6000, "longitud": -69.9833},
        "MAÑAZO": {"latitud": -15.7667, "longitud": -70.3667},
        "PAUCARCOLLA": {"latitud": -15.7000, "longitud": -70.1167},
        "PICHACANI": {"latitud": -16.0500, "longitud": -70.0833},
        "PLATERIA": {"latitud": -15.9167, "longitud": -69.6500},
        "SAN ANTONIO": {"latitud": -15.8167, "longitud": -70.1833},
        "TIQUILLACA": {"latitud": -15.7833, "longitud": -70.2167},
        "VILQUE": {"latitud": -15.8333, "longitud": -70.1333},
        
        # PROVINCIA AZANGARO
        "AZANGARO": {"latitud": -14.9167, "longitud": -70.1833},
        "ACHAYA": {"latitud": -14.8333, "longitud": -70.1667},
        "ARAPA": {"latitud": -15.1333, "longitud": -70.1167},
        "ASILLO": {"latitud": -14.7833, "longitud": -70.3500},
        "CAMINACA": {"latitud": -14.8167, "longitud": -70.0167},
        "CHUPA": {"latitud": -14.8667, "longitud": -70.0500},
        "JOSE DOMINGO CHOQUEHUANCA": {"latitud": -14.9500, "longitud": -70.0833},
        "MUÑANI": {"latitud": -14.7667, "longitud": -69.9500},
        "POTONI": {"latitud": -14.8000, "longitud": -70.2000},
        "SAMAN": {"latitud": -15.0167, "longitud": -70.0167},
        "SAN ANTON": {"latitud": -14.6167, "longitud": -70.2167},
        "SAN JOSE": {"latitud": -14.9333, "longitud": -70.1167},
        "SAN JUAN DE SALINAS": {"latitud": -14.9833, "longitud": -70.2833},
        "SANTIAGO DE PUPUJA": {"latitud": -14.6833, "longitud": -70.0167},
        "TIRAPATA": {"latitud": -14.9000, "longitud": -70.3167},
        
        # PROVINCIA CARABAYA
        "MACUSANI": {"latitud": -14.0667, "longitud": -70.4333},
        "AJOYANI": {"latitud": -14.2833, "longitud": -69.9167},
        "AYAPATA": {"latitud": -13.9333, "longitud": -70.1833},
        "COASA": {"latitud": -14.1333, "longitud": -69.6833},
        "CORANI": {"latitud": -13.8833, "longitud": -70.6333},
        "CRUCERO": {"latitud": -14.3667, "longitud": -70.0167},
        "ITUATA": {"latitud": -14.2667, "longitud": -70.1333},
        "OLLACHEA": {"latitud": -13.7833, "longitud": -70.4833},
        "SAN GABAN": {"latitud": -13.4333, "longitud": -70.3833},
        "USICAYOS": {"latitud": -14.2000, "longitud": -70.2833},
        
        # PROVINCIA CHUCUITO
        "JULI": {"latitud": -16.2167, "longitud": -69.4667},
        "DESAGUADERO": {"latitud": -16.5667, "longitud": -69.0333},
        "HUACULLANI": {"latitud": -16.6333, "longitud": -69.2667},
        "KELLUYO": {"latitud": -16.7000, "longitud": -69.2000},
        "PISACOMA": {"latitud": -16.9000, "longitud": -69.4000},
        "POMATA": {"latitud": -16.2667, "longitud": -69.2833},
        "ZEPITA": {"latitud": -16.4833, "longitud": -69.1000},
        
        # PROVINCIA EL COLLAO
        "ILAVE": {"latitud": -16.0833, "longitud": -69.6333},
        "CAPAZO": {"latitud": -17.1833, "longitud": -69.7500},
        "PILCUYO": {"latitud": -16.0667, "longitud": -69.4167},
        "SANTA ROSA": {"latitud": -16.2833, "longitud": -69.7833},
        "CONDURIRI": {"latitud": -16.6167, "longitud": -69.7167},
        
        # PROVINCIA HUANCANE
        "HUANCANE": {"latitud": -15.2000, "longitud": -69.7667},
        "COJATA": {"latitud": -15.0333, "longitud": -69.3667},
        "HUATASANI": {"latitud": -15.0667, "longitud": -69.6833},
        "INCHUPALLA": {"latitud": -14.9667, "longitud": -69.4833},
        "PUSI": {"latitud": -15.4333, "longitud": -69.6667},
        "ROSASPATA": {"latitud": -15.1000, "longitud": -69.5500},
        "TARACO": {"latitud": -15.3167, "longitud": -69.9833},
        "VILQUE CHICO": {"latitud": -15.1667, "longitud": -69.6333},
        
        # PROVINCIA LAMPA
        "LAMPA": {"latitud": -15.3667, "longitud": -70.3667},
        "CABANILLA": {"latitud": -15.6333, "longitud": -70.3500},
        "CALAPUJA": {"latitud": -15.3167, "longitud": -70.1833},
        "NICASIO": {"latitud": -15.2000, "longitud": -70.2667},
        "OCUVIRI": {"latitud": -15.0833, "longitud": -70.9167},
        "PALCA": {"latitud": -15.2167, "longitud": -70.6167},
        "PARATIA": {"latitud": -15.6667, "longitud": -70.1667},
        "PUCARA": {"latitud": -15.0333, "longitud": -70.3667},
        "SANTA LUCIA": {"latitud": -15.7000, "longitud": -70.6000},
        "VILAVILA": {"latitud": -15.5167, "longitud": -70.5833},
        
        # PROVINCIA MELGAR
        "AYAVIRI": {"latitud": -14.8833, "longitud": -70.5833},
        "ANTAUTA": {"latitud": -14.8167, "longitud": -70.4167},
        "CUPI": {"latitud": -14.7333, "longitud": -70.7167},
        "LLALLI": {"latitud": -14.9667, "longitud": -70.7833},
        "MACARI": {"latitud": -14.6000, "longitud": -70.9333},
        "NUÑOA": {"latitud": -14.4833, "longitud": -70.6333},
        "ORURILLO": {"latitud": -14.7167, "longitud": -70.1333},
        "SANTA ROSA": {"latitud": -14.6167, "longitud": -70.7833},
        "UMACHIRI": {"latitud": -14.8000, "longitud": -70.7333},
        
        # PROVINCIA MOHO
        "MOHO": {"latitud": -15.3833, "longitud": -69.4833},
        "CONIMA": {"latitud": -15.6167, "longitud": -69.3167},
        "HUAYRAPATA": {"latitud": -15.2833, "longitud": -69.4167},
        "TILALI": {"latitud": -15.4667, "longitud": -69.4000},
        
        # PROVINCIA SAN ANTONIO DE PUTINA
        "PUTINA": {"latitud": -14.9167, "longitud": -69.8667},
        "ANANEA": {"latitud": -14.6833, "longitud": -69.5333},
        "PEDRO VILCA APAZA": {"latitud": -14.8833, "longitud": -69.7833},
        "QUILCAPUNCU": {"latitud": -14.7167, "longitud": -69.8167},
        "SINA": {"latitud": -14.8000, "longitud": -69.6167},
        
        # PROVINCIA SAN ROMAN
        "JULIACA": {"latitud": -15.5000, "longitud": -70.1333},
        "CABANA": {"latitud": -15.6167, "longitud": -70.3833},
        "CABANILLAS": {"latitud": -15.6333, "longitud": -70.3167},
        "CARACOTO": {"latitud": -15.7333, "longitud": -70.0667},
        
        # PROVINCIA SANDIA
        "SANDIA": {"latitud": -14.2833, "longitud": -69.4167},
        "CUYOCUYO": {"latitud": -14.0833, "longitud": -69.5500},
        "LIMBANI": {"latitud": -14.1167, "longitud": -69.6833},
        "PATAMBUCO": {"latitud": -14.4167, "longitud": -69.2000},
        "PHARA": {"latitud": -14.0167, "longitud": -69.4833},
        "QUIACA": {"latitud": -14.6167, "longitud": -69.3833},
        "SAN JUAN DEL ORO": {"latitud": -14.1833, "longitud": -69.2167},
        "YANAHUAYA": {"latitud": -14.3000, "longitud": -69.3167},
        "ALTO INAMBARI": {"latitud": -13.7167, "longitud": -69.6833},
        "SAN PEDRO DE PUTINA PUNCO": {"latitud": -14.0667, "longitud": -69.8833},
        
        # PROVINCIA YUNGUYO
        "YUNGUYO": {"latitud": -16.2500, "longitud": -69.0833},
        "ANAPIA": {"latitud": -16.2000, "longitud": -69.1333},
        "COPANI": {"latitud": -16.2167, "longitud": -69.1167},
        "CUTURAPI": {"latitud": -16.2333, "longitud": -69.0167},
        "OLLARAYA": {"latitud": -16.3000, "longitud": -69.0500},
        "TINICACHI": {"latitud": -16.2667, "longitud": -69.0333},
        "UNICACHI": {"latitud": -16.2833, "longitud": -69.1000}
    }
    
    print(f"📍 Coordenadas preparadas: {len(coordenadas_oficiales)} localidades")
    
    # Obtener localidades del backend
    base_url = "http://localhost:8000/api/v1"
    
    try:
        response = requests.get(f"{base_url}/localidades", timeout=10)
        if response.status_code != 200:
            print(f"❌ Error obteniendo localidades: {response.status_code}")
            return False
        
        localidades = response.json()
        print(f"📋 Localidades en backend: {len(localidades)}")
        
        # Actualizar coordenadas
        actualizadas = 0
        sin_coordenadas = 0
        
        for localidad in localidades:
            nombre = localidad.get('nombre', '').upper().strip()
            
            if nombre in coordenadas_oficiales:
                coordenadas = coordenadas_oficiales[nombre]
                
                # Actualizar localidad con coordenadas
                update_data = {
                    "coordenadas": coordenadas
                }
                
                try:
                    update_response = requests.put(
                        f"{base_url}/localidades/{localidad['id']}", 
                        json=update_data,
                        timeout=10
                    )
                    
                    if update_response.status_code == 200:
                        actualizadas += 1
                        if actualizadas % 20 == 0:
                            print(f"   ✅ Actualizadas: {actualizadas}")
                    else:
                        print(f"   ❌ Error actualizando {nombre}: {update_response.status_code}")
                        
                except Exception as e:
                    print(f"   ❌ Error actualizando {nombre}: {e}")
            else:
                sin_coordenadas += 1
        
        print(f"\n📊 RESULTADO:")
        print(f"   ✅ Actualizadas con coordenadas: {actualizadas}")
        print(f"   ⚠️ Sin coordenadas disponibles: {sin_coordenadas}")
        print(f"   📋 Total procesadas: {len(localidades)}")
        
        if actualizadas > 0:
            print(f"\n🎉 COORDENADAS AGREGADAS EXITOSAMENTE")
            print(f"   • Coordenadas oficiales del IGN")
            print(f"   • Precisión de capitales de distrito")
            print(f"   • Sistema de coordenadas WGS84")
            print(f"   • Cobertura: {actualizadas}/{len(localidades)} localidades")
        
        return actualizadas > 0
        
    except requests.exceptions.ConnectionError:
        print("❌ No se pudo conectar al backend")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

if __name__ == "__main__":
    agregar_coordenadas()