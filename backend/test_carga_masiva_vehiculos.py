#!/usr/bin/env python3
"""
Script de prueba para la funcionalidad de carga masiva de vehículos
"""

import asyncio
import pandas as pd
from app.services.vehiculo_excel_service import VehiculoExcelService
from app.services.mock_data import mock_service

async def test_carga_masiva():
    """Probar la funcionalidad de carga masiva de vehículos"""
    
    print("🚗 INICIANDO PRUEBAS DE CARGA MASIVA DE VEHÍCULOS")
    print("=" * 60)
    
    # Inicializar servicio
    excel_service = VehiculoExcelService()
    
    # 1. Generar plantilla Excel
    print("\n1️⃣ GENERANDO PLANTILLA EXCEL...")
    try:
        archivo_plantilla = await excel_service.generar_plantilla_excel()
        print(f"✅ Plantilla generada: {archivo_plantilla}")
    except Exception as e:
        print(f"❌ Error generando plantilla: {e}")
        return
    
    # 2. Crear archivo de prueba con datos válidos e inválidos
    print("\n2️⃣ CREANDO ARCHIVO DE PRUEBA...")
    datos_prueba = {
        'Placa': ['TEST-001', 'TEST-002', 'ABC-123', 'TEST-003', 'INVALID'],  # ABC-123 ya existe
        'RUC Empresa': ['20123456789', '20234567890', '20123456789', '99999999999', '20123456789'],  # RUC inválido
        'Resolución Primigenia': ['001-2024-DRTC-PUNO', '002-2024-DRTC-PUNO', '', '', ''],
        'Resolución Hija': ['', '', '', '', ''],
        'Rutas Asignadas': ['01,02', '03', '01', '', ''],
        'Categoría': ['M3', 'N3', 'M2', 'INVALID', 'M3'],  # Categoría inválida
        'Marca': ['MERCEDES BENZ', 'VOLVO', 'FORD', 'TOYOTA', 'SCANIA'],
        'Modelo': ['O500', 'FH16', 'TRANSIT', 'HIACE', 'K320'],
        'Año Fabricación': [2020, 2019, 2021, 1800, 2022],  # Año inválido
        'Color': ['BLANCO', 'AZUL', 'PLATEADO', 'ROJO', 'VERDE'],
        'Número Serie': ['MB001', 'VL002', 'FD003', 'TY004', 'SC005'],
        'Motor': ['OM 457 LA', 'D16G750', '2.0L EcoBlue', '2.7L', 'DC13-320'],
        'Chasis': ['WDB001', 'VOL002', 'FOR003', 'TOY004', 'SCA005'],
        'Ejes': [2, 3, 2, 2, 2],
        'Asientos': [50, 2, 15, 12, 32],
        'Peso Neto (kg)': [8500.0, 12000.0, 2200.0, 1800.0, 8800.0],
        'Peso Bruto (kg)': [16000.0, 26000.0, 3500.0, 3000.0, 17200.0],
        'Largo (m)': [12.0, 16.0, 5.3, 5.0, 10.8],
        'Ancho (m)': [2.55, 2.6, 2.0, 1.8, 2.5],
        'Alto (m)': [3.2, 3.8, 2.5, 2.2, 3.1],
        'Tipo Combustible': ['DIESEL', 'DIESEL', 'DIESEL', 'INVALID', 'DIESEL'],  # Combustible inválido
        'Cilindrada': [11967.0, 16000.0, 1997.0, 2700.0, 13000.0],
        'Potencia (HP)': [354.0, 750.0, 130.0, 150.0, 320.0],
        'Estado': ['ACTIVO', 'ACTIVO', 'ACTIVO', 'ACTIVO', 'ACTIVO'],
        'Observaciones': ['Vehículo de prueba 1', 'Vehículo de prueba 2', 'Placa duplicada', 'Datos inválidos', 'Vehículo de prueba 5']
    }
    
    df_prueba = pd.DataFrame(datos_prueba)
    archivo_prueba = 'vehiculos_prueba.xlsx'
    df_prueba.to_excel(archivo_prueba, index=False)
    print(f"✅ Archivo de prueba creado: {archivo_prueba}")
    
    # 3. Validar archivo de prueba
    print("\n3️⃣ VALIDANDO ARCHIVO DE PRUEBA...")
    try:
        validaciones = await excel_service.validar_excel_preview(archivo_prueba)
        
        print(f"📊 RESULTADOS DE VALIDACIÓN:")
        print(f"   Total filas: {len(validaciones)}")
        
        validos = [v for v in validaciones if v.valido]
        invalidos = [v for v in validaciones if not v.valido]
        con_advertencias = [v for v in validaciones if v.advertencias]
        
        print(f"   ✅ Válidos: {len(validos)}")
        print(f"   ❌ Inválidos: {len(invalidos)}")
        print(f"   ⚠️  Con advertencias: {len(con_advertencias)}")
        
        # Mostrar errores
        if invalidos:
            print(f"\n📋 ERRORES ENCONTRADOS:")
            for v in invalidos:
                print(f"   Fila {v.fila} - Placa {v.placa}:")
                for error in v.errores:
                    print(f"     • {error}")
        
        # Mostrar advertencias
        if con_advertencias:
            print(f"\n⚠️  ADVERTENCIAS:")
            for v in con_advertencias:
                if v.advertencias:
                    print(f"   Fila {v.fila} - Placa {v.placa}:")
                    for advertencia in v.advertencias:
                        print(f"     • {advertencia}")
        
    except Exception as e:
        print(f"❌ Error validando archivo: {e}")
        return
    
    # 4. Procesar carga masiva (solo si hay registros válidos)
    if validos:
        print(f"\n4️⃣ PROCESANDO CARGA MASIVA...")
        try:
            resultado = await excel_service.procesar_excel(archivo_prueba)
            
            print(f"📊 RESULTADOS DE PROCESAMIENTO:")
            print(f"   Total procesados: {resultado.total_procesados}")
            print(f"   ✅ Exitosos: {resultado.exitosos}")
            print(f"   ❌ Errores: {resultado.errores}")
            print(f"   🆔 Vehículos creados: {resultado.vehiculos_creados}")
            
            if resultado.errores_detalle:
                print(f"\n📋 ERRORES DE PROCESAMIENTO:")
                for error in resultado.errores_detalle:
                    print(f"   Fila {error['fila']} - Placa {error['placa']}:")
                    for mensaje in error['errores']:
                        print(f"     • {mensaje}")
            
        except Exception as e:
            print(f"❌ Error procesando carga masiva: {e}")
    
    # 5. Mostrar estadísticas finales
    print(f"\n5️⃣ ESTADÍSTICAS FINALES...")
    print(f"   📊 Total empresas disponibles: {len(mock_service.empresas)}")
    print(f"   📊 Total resoluciones disponibles: {len(mock_service.resoluciones)}")
    print(f"   📊 Total rutas disponibles: {len(mock_service.rutas)}")
    print(f"   🚗 Total vehículos después del procesamiento: {len(mock_service.vehiculos)}")
    
    print("\n" + "=" * 60)
    print("✅ PRUEBAS COMPLETADAS")

def test_validaciones_especificas():
    """Probar validaciones específicas"""
    
    print("\n🔍 PROBANDO VALIDACIONES ESPECÍFICAS")
    print("-" * 40)
    
    excel_service = VehiculoExcelService()
    
    # Probar validación de placa
    placas_test = ['ABC-123', 'AB-1234', 'ABCD-123', '123-ABC', 'abc-123']
    print("📋 Validación de placas:")
    for placa in placas_test:
        valida = excel_service._validar_formato_placa(placa)
        print(f"   {placa}: {'✅' if valida else '❌'}")
    
    # Probar búsqueda de empresa por RUC
    rucs_test = ['20123456789', '20234567890', '99999999999']
    print("\n🏢 Búsqueda de empresas por RUC:")
    for ruc in rucs_test:
        empresa = excel_service._buscar_empresa_por_ruc(ruc)
        if empresa:
            print(f"   {ruc}: ✅ {empresa.razonSocial.principal}")
        else:
            print(f"   {ruc}: ❌ No encontrada")
    
    # Probar búsqueda de resoluciones
    resoluciones_test = ['001-2024-DRTC-PUNO', '002-2024-DRTC-PUNO', '999-2024-DRTC-PUNO']
    print("\n📄 Búsqueda de resoluciones:")
    for resolucion in resoluciones_test:
        res = excel_service._buscar_resolucion_por_numero(resolucion)
        if res:
            print(f"   {resolucion}: ✅ Encontrada")
        else:
            print(f"   {resolucion}: ❌ No encontrada")
    
    # Probar búsqueda de rutas
    rutas_test = ['01', '02', '99']
    print("\n🛣️  Búsqueda de rutas:")
    for ruta in rutas_test:
        r = excel_service._buscar_ruta_por_codigo(ruta)
        if r:
            print(f"   {ruta}: ✅ {r.nombre}")
        else:
            print(f"   {ruta}: ❌ No encontrada")

if __name__ == "__main__":
    print("🚀 INICIANDO PRUEBAS DEL SISTEMA DE CARGA MASIVA DE VEHÍCULOS")
    print("=" * 80)
    
    # Ejecutar pruebas de validaciones específicas
    test_validaciones_especificas()
    
    # Ejecutar pruebas principales
    asyncio.run(test_carga_masiva())
    
    print("\n🎉 TODAS LAS PRUEBAS COMPLETADAS")