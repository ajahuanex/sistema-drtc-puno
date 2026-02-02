#!/usr/bin/env python3
"""
Script para crear las 13 provincias de Puno correctamente
"""

import requests
import json

def crear_provincias():
    """Crear las 13 provincias de Puno"""
    
    print("🏛️ CREANDO PROVINCIAS DE PUNO")
    print("=" * 50)
    
    # Las 13 provincias oficiales de Puno
    provincias_puno = [
        {
            "nombre": "PUNO",
            "tipo": "PROVINCIA", 
            "departamento": "PUNO",
            "provincia": "PUNO",
            "distrito": "PUNO",
            "ubigeo": "210100",
            "nivel_territorial": "PROVINCIA",
            "coordenadas": {"latitud": -15.8402, "longitud": -70.0219}
        },
        {
            "nombre": "AZANGARO",
            "tipo": "PROVINCIA",
            "departamento": "PUNO", 
            "provincia": "AZANGARO",
            "distrito": "AZANGARO",
            "ubigeo": "210200",
            "nivel_territorial": "PROVINCIA",
            "coordenadas": {"latitud": -14.9167, "longitud": -70.1833}
        },
        {
            "nombre": "CARABAYA", 
            "tipo": "PROVINCIA",
            "departamento": "PUNO",
            "provincia": "CARABAYA", 
            "distrito": "MACUSANI",
            "ubigeo": "210400",
            "nivel_territorial": "PROVINCIA",
            "coordenadas": {"latitud": -14.0667, "longitud": -70.4333}
        },
        {
            "nombre": "CHUCUITO",
            "tipo": "PROVINCIA",
            "departamento": "PUNO",
            "provincia": "CHUCUITO",
            "distrito": "JULI", 
            "ubigeo": "210500",
            "nivel_territorial": "PROVINCIA",
            "coordenadas": {"latitud": -16.2167, "longitud": -69.4667}
        },
        {
            "nombre": "EL COLLAO",
            "tipo": "PROVINCIA",
            "departamento": "PUNO",
            "provincia": "EL COLLAO",
            "distrito": "ILAVE",
            "ubigeo": "210600", 
            "nivel_territorial": "PROVINCIA",
            "coordenadas": {"latitud": -16.0833, "longitud": -69.6333}
        },
        {
            "nombre": "HUANCANE",
            "tipo": "PROVINCIA",
            "departamento": "PUNO",
            "provincia": "HUANCANE",
            "distrito": "HUANCANE",
            "ubigeo": "210700",
            "nivel_territorial": "PROVINCIA", 
            "coordenadas": {"latitud": -15.2000, "longitud": -69.7667}
        },
        {
            "nombre": "LAMPA",
            "tipo": "PROVINCIA",
            "departamento": "PUNO",
            "provincia": "LAMPA",
            "distrito": "LAMPA",
            "ubigeo": "210800",
            "nivel_territorial": "PROVINCIA",
            "coordenadas": {"latitud": -15.3667, "longitud": -70.3667}
        },
        {
            "nombre": "MELGAR",
            "tipo": "PROVINCIA", 
            "departamento": "PUNO",
            "provincia": "MELGAR",
            "distrito": "AYAVIRI",
            "ubigeo": "210900",
            "nivel_territorial": "PROVINCIA",
            "coordenadas": {"latitud": -14.8833, "longitud": -70.5833}
        },
        {
            "nombre": "MOHO",
            "tipo": "PROVINCIA",
            "departamento": "PUNO",
            "provincia": "MOHO", 
            "distrito": "MOHO",
            "ubigeo": "211000",
            "nivel_territorial": "PROVINCIA",
            "coordenadas": {"latitud": -15.3833, "longitud": -69.4833}
        },
        {
            "nombre": "SAN ANTONIO DE PUTINA",
            "tipo": "PROVINCIA",
            "departamento": "PUNO",
            "provincia": "SAN ANTONIO DE PUTINA",
            "distrito": "PUTINA",
            "ubigeo": "211200",
            "nivel_territorial": "PROVINCIA",
            "coordenadas": {"latitud": -14.9167, "longitud": -69.8667}
        },
        {
            "nombre": "SAN ROMAN", 
            "tipo": "PROVINCIA",
            "departamento": "PUNO",
            "provincia": "SAN ROMAN",
            "distrito": "JULIACA",
            "ubigeo": "211300",
            "nivel_territorial": "PROVINCIA",
            "coordenadas": {"latitud": -15.5000, "longitud": -70.1333}
        },
        {
            "nombre": "SANDIA",
            "tipo": "PROVINCIA",
            "departamento": "PUNO", 
            "provincia": "SANDIA",
            "distrito": "SANDIA",
            "ubigeo": "211400",
            "nivel_territorial": "PROVINCIA",
            "coordenadas": {"latitud": -14.2833, "longitud": -69.4167}
        },
        {
            "nombre": "YUNGUYO",
            "tipo": "PROVINCIA",
            "departamento": "PUNO",
            "provincia": "YUNGUYO",
            "distrito": "YUNGUYO", 
            "ubigeo": "211500",
            "nivel_territorial": "PROVINCIA",
            "coordenadas": {"latitud": -16.2500, "longitud": -69.0833}
        }
    ]
    
    print(f"📋 Provincias a crear: {len(provincias_puno)}")
    
    # Crear provincias en el backend
    base_url = "http://localhost:8000/api/v1"
    creadas = 0
    errores = 0
    
    for provincia in provincias_puno:
        try:
            response = requests.post(f"{base_url}/localidades", json=provincia, timeout=10)
            if response.status_code == 201:
                creadas += 1
                print(f"   ✅ {provincia['nombre']}")
            else:
                errores += 1
                print(f"   ❌ {provincia['nombre']}: {response.status_code}")
                if response.status_code == 422:
                    try:
                        error_detail = response.json()
                        print(f"      Error: {error_detail}")
                    except:
                        print(f"      Error: {response.text}")
        except Exception as e:
            errores += 1
            print(f"   ❌ {provincia['nombre']}: {e}")
    
    print(f"\n📊 RESULTADO:")
    print(f"   ✅ Provincias creadas: {creadas}")
    print(f"   ❌ Errores: {errores}")
    
    if creadas > 0:
        print(f"\n🎉 PROVINCIAS CREADAS EXITOSAMENTE")
        print(f"   • {creadas} de 13 provincias")
        print(f"   • Con coordenadas de capitales")
        print(f"   • Códigos UBIGEO oficiales")
    
    # Verificar resultado final
    try:
        response = requests.get(f"{base_url}/localidades", timeout=10)
        if response.status_code == 200:
            localidades = response.json()
            
            provincias_count = len([l for l in localidades if l.get('tipo') == 'PROVINCIA'])
            distritos_count = len([l for l in localidades if l.get('tipo') == 'DISTRITO'])
            
            print(f"\n📊 ESTADO FINAL:")
            print(f"   • Provincias: {provincias_count}")
            print(f"   • Distritos: {distritos_count}")
            print(f"   • Total: {len(localidades)}")
    except:
        print("⚠️ No se pudo verificar el estado final")
    
    return creadas > 0

if __name__ == "__main__":
    crear_provincias()