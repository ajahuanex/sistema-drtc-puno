#!/usr/bin/env python3
"""
Script de prueba para todos los sistemas de carga masiva
"""

import pandas as pd
import os
from datetime import datetime
from app.services.resolucion_excel_service import ResolucionExcelService
from app.services.ruta_excel_service import RutaExcelService
from app.services.expediente_excel_service import ExpedienteExcelService

def test_resoluciones():
    print("🏛️ PROBANDO CARGA MASIVA DE RESOLUCIONES")
    print("=" * 50)
    
    excel_service = ResolucionExcelService()
    
    # 1. Generar plantilla
    print("1️⃣ Generando plantilla de resoluciones...")
    try:
        plantilla_buffer = excel_service.generar_plantilla_excel()
        with open('plantilla_resoluciones.xlsx', 'wb') as f:
            f.write(plantilla_buffer.read())
        print("✅ Plantilla generada: plantilla_resoluciones.xlsx")
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # 2. Crear archivo de prueba
    print("2️⃣ Creando archivo de prueba...")
    datos_prueba = {
        'Número Resolución': ['R-1007-2024', 'R-INVALID', 'R-1008-2024'],
        'RUC Empresa': ['20123456789', '123456789', '20234567890'],
        'Fecha Emisión': ['2024-01-15', 'invalid-date', '2024-01-20'],
        'Fecha Vigencia Inicio': ['2024-01-15', '2024-01-15', '2024-01-20'],
        'Fecha Vigencia Fin': ['2029-01-15', '2029-01-15', '2029-01-20'],
        'Tipo Resolución': ['PADRE', 'INVALID', 'PADRE'],
        'Tipo Trámite': ['PRIMIGENIA', 'INVALID', 'RENOVACION'],
        'Descripción': ['Autorización para operar rutas', 'X', 'Renovación de autorización'],
        'ID Expediente': ['EXP007', 'EXP008', 'EXP009'],
        'Usuario Emisión': ['USR001', 'USR001', 'USR001'],
        'Estado': ['VIGENTE', 'INVALID', 'VIGENTE'],
        'Observaciones': ['Resolución válida', '', 'Renovación por 5 años']
    }
    
    df_prueba = pd.DataFrame(datos_prueba)
    df_prueba.to_excel('resoluciones_prueba.xlsx', index=False)
    print("✅ Archivo de prueba creado: resoluciones_prueba.xlsx")
    
    # 3. Validar archivo
    print("3️⃣ Validando archivo...")
    try:
        with open('resoluciones_prueba.xlsx', 'rb') as f:
            from io import BytesIO
            archivo_buffer = BytesIO(f.read())
            
        resultado = excel_service.validar_archivo_excel(archivo_buffer)
        print(f"📊 Total: {resultado['total_filas']}, Válidos: {resultado['validos']}, Inválidos: {resultado['invalidos']}")
        
        if resultado['errores']:
            print("❌ Errores encontrados:")
            for error in resultado['errores'][:2]:  # Solo mostrar primeros 2
                print(f"   Fila {error['fila']}: {error['errores'][:2]}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def test_rutas():
    print("\n🛣️ PROBANDO CARGA MASIVA DE RUTAS")
    print("=" * 40)
    
    excel_service = RutaExcelService()
    
    # 1. Generar plantilla
    print("1️⃣ Generando plantilla de rutas...")
    try:
        plantilla_buffer = excel_service.generar_plantilla_excel()
        with open('plantilla_rutas.xlsx', 'wb') as f:
            f.write(plantilla_buffer.read())
        print("✅ Plantilla generada: plantilla_rutas.xlsx")
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # 2. Crear archivo de prueba
    print("2️⃣ Creando archivo de prueba...")
    datos_prueba = {
        'Código Ruta': ['06', 'INVALID', '07'],
        'Nombre': ['PUNO - LIMA', 'X', 'JULIACA - AREQUIPA'],
        'Origen ID': ['1', '', '2'],
        'Destino ID': ['5', '1', '3'],
        'Tipo Ruta': ['INTERPROVINCIAL', 'INVALID', 'INTERPROVINCIAL'],
        'Tipo Servicio': ['PASAJEROS', 'INVALID', 'PASAJEROS'],
        'Frecuencias': ['Diaria, cada 4 horas', '', 'Diaria, 3 veces'],
        'Distancia (km)': [850.5, 'invalid', 250.0],
        'Tiempo Estimado': ['12:00', 'invalid', '03:30'],
        'Tarifa Base': [120.00, -10, 30.00],
        'Capacidad Máxima': [50, 'invalid', 45],
        'Estado': ['ACTIVA', 'INVALID', 'ACTIVA'],
        'Observaciones': ['Ruta larga interprovincial', '', 'Ruta regional']
    }
    
    df_prueba = pd.DataFrame(datos_prueba)
    df_prueba.to_excel('rutas_prueba.xlsx', index=False)
    print("✅ Archivo de prueba creado: rutas_prueba.xlsx")
    
    # 3. Validar archivo
    print("3️⃣ Validando archivo...")
    try:
        with open('rutas_prueba.xlsx', 'rb') as f:
            from io import BytesIO
            archivo_buffer = BytesIO(f.read())
            
        resultado = excel_service.validar_archivo_excel(archivo_buffer)
        print(f"📊 Total: {resultado['total_filas']}, Válidos: {resultado['validos']}, Inválidos: {resultado['invalidos']}")
        
        if resultado['errores']:
            print("❌ Errores encontrados:")
            for error in resultado['errores'][:2]:
                print(f"   Fila {error['fila']}: {error['errores'][:2]}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def test_expedientes():
    print("\n📋 PROBANDO CARGA MASIVA DE EXPEDIENTES")
    print("=" * 45)
    
    excel_service = ExpedienteExcelService()
    
    # 1. Generar plantilla
    print("1️⃣ Generando plantilla de expedientes...")
    try:
        plantilla_buffer = excel_service.generar_plantilla_excel()
        with open('plantilla_expedientes.xlsx', 'wb') as f:
            f.write(plantilla_buffer.read())
        print("✅ Plantilla generada: plantilla_expedientes.xlsx")
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # 2. Crear archivo de prueba
    print("2️⃣ Creando archivo de prueba...")
    datos_prueba = {
        'Número Expediente': ['EXP010', 'INVALID', 'EXP011'],
        'RUC Empresa': ['20123456789', '123456789', '20234567890'],
        'Tipo Trámite': ['AUTORIZACION_NUEVA', 'INVALID', 'RENOVACION'],
        'Descripción': ['Solicitud de nueva autorización', 'X', 'Renovación de autorización'],
        'Prioridad': ['ALTA', 'INVALID', 'MEDIA'],
        'Estado': ['EN_PROCESO', 'INVALID', 'EN_REVISION'],
        'Fecha Ingreso': ['2024-01-15', 'invalid-date', '2024-01-20'],
        'Fecha Límite': ['2024-02-15', '2024-02-20', '2024-02-25'],
        'Solicitante Nombre': ['CARLOS MAMANI TORRES', 'X', 'ANA RODRIGUEZ VARGAS'],
        'Solicitante DNI': ['11223344', '1234567', '55667788'],
        'Solicitante Email': ['carlos@empresa.com', 'invalid-email', 'ana@empresa.com'],
        'Solicitante Teléfono': ['952111222', '12345', '953444555'],
        'Observaciones': ['Expediente completo', '', 'Requiere revisión adicional']
    }
    
    df_prueba = pd.DataFrame(datos_prueba)
    df_prueba.to_excel('expedientes_prueba.xlsx', index=False)
    print("✅ Archivo de prueba creado: expedientes_prueba.xlsx")
    
    # 3. Validar archivo
    print("3️⃣ Validando archivo...")
    try:
        with open('expedientes_prueba.xlsx', 'rb') as f:
            from io import BytesIO
            archivo_buffer = BytesIO(f.read())
            
        resultado = excel_service.validar_archivo_excel(archivo_buffer)
        print(f"📊 Total: {resultado['total_filas']}, Válidos: {resultado['validos']}, Inválidos: {resultado['invalidos']}")
        
        if resultado['errores']:
            print("❌ Errores encontrados:")
            for error in resultado['errores'][:2]:
                print(f"   Fila {error['fila']}: {error['errores'][:2]}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    print("🚀 INICIANDO PRUEBAS DE CARGA MASIVA COMPLETA")
    print("=" * 60)
    
    test_resoluciones()
    test_rutas()
    test_expedientes()
    
    print("\n" + "=" * 60)
    print("✅ TODAS LAS PRUEBAS COMPLETADAS")
    print("\n📁 Archivos generados:")
    archivos = [
        'plantilla_resoluciones.xlsx',
        'plantilla_rutas.xlsx', 
        'plantilla_expedientes.xlsx',
        'resoluciones_prueba.xlsx',
        'rutas_prueba.xlsx',
        'expedientes_prueba.xlsx'
    ]
    
    for archivo in archivos:
        if os.path.exists(archivo):
            size = os.path.getsize(archivo) / 1024
            print(f"   ✅ {archivo} ({size:.1f} KB)")
        else:
            print(f"   ❌ {archivo} (no encontrado)")

if __name__ == "__main__":
    main()