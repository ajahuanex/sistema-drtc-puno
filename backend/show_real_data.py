#!/usr/bin/env python3
"""
Script para mostrar los datos reales de empresas en la base de datos
"""
from pymongo import MongoClient
import json
from datetime import datetime

def show_real_data():
    """Mostrar empresas reales de la base de datos"""
    
    # Conectar a MongoDB
    client = MongoClient("mongodb://admin:admin123@localhost:27017/")
    db = client["drtc_db"]
    collection = db["empresas"]
    
    # Obtener todas las empresas
    empresas = list(collection.find({}))
    
    print(f"\n{'='*80}")
    print(f"DATOS REALES EN LA BASE DE DATOS - Total: {len(empresas)} empresas")
    print(f"{'='*80}\n")
    
    for i, empresa in enumerate(empresas, 1):
        print(f"\n{i}. RUC: {empresa.get('ruc', 'N/A')}")
        print(f"   Razón Social: {empresa.get('razonSocial', {}).get('principal', 'N/A')}")
        print(f"   Estado: {empresa.get('estado', 'N/A')}")
        print(f"   Servicios: {', '.join(empresa.get('tiposServicio', []))}")
        print(f"   Email: {empresa.get('emailContacto', 'N/A')}")
        print(f"   Teléfono: {empresa.get('telefonoContacto', 'N/A')}")
        print(f"   Activo: {empresa.get('estaActivo', False)}")
        print(f"   ID MongoDB: {empresa.get('_id', 'N/A')}")
        print(f"   ID Custom: {empresa.get('id', 'N/A')}")
        
        # Mostrar socios
        socios = empresa.get('socios', [])
        if socios:
            print(f"   Socios:")
            for socio in socios:
                print(f"     - {socio.get('nombres', '')} {socio.get('apellidos', '')} (DNI: {socio.get('dni', 'N/A')})")
        
        print(f"   Fecha Registro: {empresa.get('fechaRegistro', 'N/A')}")
    
    print(f"\n{'='*80}\n")
    
    # Mostrar resumen por estado
    print("RESUMEN POR ESTADO:")
    estados = {}
    for empresa in empresas:
        estado = empresa.get('estado', 'DESCONOCIDO')
        estados[estado] = estados.get(estado, 0) + 1
    
    for estado, cantidad in sorted(estados.items()):
        print(f"  {estado}: {cantidad}")
    
    # Mostrar resumen por servicio
    print("\nRESUMEN POR SERVICIO:")
    servicios = {}
    for empresa in empresas:
        for servicio in empresa.get('tiposServicio', []):
            servicios[servicio] = servicios.get(servicio, 0) + 1
    
    for servicio, cantidad in sorted(servicios.items()):
        print(f"  {servicio}: {cantidad}")
    
    client.close()

if __name__ == "__main__":
    show_real_data()
