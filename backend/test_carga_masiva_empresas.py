#!/usr/bin/env python3
"""
Script de prueba para el sistema de carga masiva de empresas desde Excel
"""

import pandas as pd
import os
from datetime import datetime
from app.services.empresa_excel_service import EmpresaExcelService
from app.services.mock_data import get_mock_empresas

def main():
    print("🏢 INICIANDO PRUEBAS DEL SISTEMA DE CARGA MASIVA DE EMPRESAS")
    print("=" * 80)
    
    # Probar validaciones específicas
    print("🔍 PROBANDO VALIDACIONES ESPECÍFICAS")
    print("-" * 40)
    
    excel_service = EmpresaExcelService()
    
    # Probar validaciones de formato
    print("📋 Validación de códigos de empresa:")
    codigos_prueba = ['0001TRP', '0123PRT', 'INVALID', '123ABC', '0001trp']
    for codigo in codigos_prueba:
        es_valido = excel_service._validar_formato_codigo_empresa(codigo)
        print(f"   {codigo}: {'✅' if es_valido else '❌'}")
    
    print("🏢 Validación de RUCs:")
    rucs_prueba = ['20123456789', '12345678901', '123456789', '2012345678A']
    for ruc in rucs_prueba:
        es_valido = excel_service._validar_formato_ruc(ruc)
        print(f"   {ruc}: {'✅' if es_valido else '❌'}")
    
    print("👤 Validación de DNIs:")
    dnis_prueba = ['12345678', '1234567', '12345678A', '123456789']
    for dni in dnis_prueba:
        es_valido = excel_service._validar_formato_dni(dni)
        print(f"   {dni}: {'✅' if es_valido else '❌'}")
    
    print("📧 Validación de emails:")
    emails_prueba = ['test@example.com', 'invalid-email', 'user@domain', 'test@domain.co.pe']
    for email in emails_prueba:
        es_valido = excel_service._validar_formato_email(email)
        print(f"   {email}: {'✅' if es_valido else '❌'}")
    
    print("📞 Validación de teléfonos:")
    telefonos_prueba = ['951234567', '051-123456', '+51 951 234 567', '12345', 'abc123']
    for telefono in telefonos_prueba:
        es_valido = excel_service._validar_formato_telefono(telefono)
        print(f"   {telefono}: {'✅' if es_valido else '❌'}")
    
    # Verificar empresas existentes
    print("🏢 Búsqueda de empresas por código:")
    empresas_mock = get_mock_empresas()
    codigos_buscar = ['0001PRT', '0002PRT', '9999XXX']
    for codigo in codigos_buscar:
        existe = excel_service._existe_empresa_con_codigo(codigo)
        if existe:
            empresa = next((emp for emp in empresas_mock if emp.codigoEmpresa.upper() == codigo.upper()), None)
            print(f"   {codigo}: ✅ {empresa.razonSocial.principal if empresa else 'Encontrada'}")
        else:
            print(f"   {codigo}: ❌ No encontrada")
    
    print("🏢 Búsqueda de empresas por RUC:")
    rucs_buscar = ['20123456789', '20234567890', '99999999999']
    for ruc in rucs_buscar:
        existe = excel_service._existe_empresa_con_ruc(ruc)
        if existe:
            empresa = next((emp for emp in empresas_mock if emp.ruc == ruc), None)
            print(f"   {ruc}: ✅ {empresa.razonSocial.principal if empresa else 'Encontrada'}")
        else:
            print(f"   {ruc}: ❌ No encontrada")
    
    print("\n🏢 INICIANDO PRUEBAS DE CARGA MASIVA DE EMPRESAS")
    print("=" * 60)
    
    # 1. Generar plantilla
    print("1️⃣ GENERANDO PLANTILLA EXCEL...")
    try:
        plantilla_buffer = excel_service.generar_plantilla_excel()
        with open('plantilla_empresas.xlsx', 'wb') as f:
            f.write(plantilla_buffer.read())
        print("✅ Plantilla generada: plantilla_empresas.xlsx")
    except Exception as e:
        print(f"❌ Error generando plantilla: {e}")
        return
    
    # 2. Crear archivo de prueba con datos válidos e inválidos
    print("2️⃣ CREANDO ARCHIVO DE PRUEBA...")
    try:
        datos_prueba = {
            'Código Empresa': ['0003TRP', 'INVALID', '0001PRT', '0004LOG', 'WRONG'],
            'RUC': ['20111222333', '123456789', '20123456789', '20444555666', '12345'],
            'Razón Social Principal': ['TRANSPORTES NUEVOS S.A.', 'EMPRESA INVÁLIDA', 'EMPRESA DUPLICADA', 'LOGÍSTICA NUEVA E.I.R.L.', 'X'],
            'Razón Social SUNAT': ['TRANSPORTES NUEVOS SOCIEDAD ANONIMA', '', 'EMPRESA DUPLICADA S.A.', 'LOGISTICA NUEVA EMPRESA INDIVIDUAL', ''],
            'Razón Social Mínimo': ['TRANSPORTES NUEVOS', '', 'EMPRESA DUPLICADA', 'LOGISTICA NUEVA', ''],
            'Dirección Fiscal': ['AV. NUEVA 123, PUNO', 'DIRECCIÓN CORTA', 'AV. DUPLICADA 456, PUNO', 'JR. NUEVA 789, AREQUIPA', 'X'],
            'Estado': ['HABILITADA', 'INVALID_ESTADO', 'HABILITADA', 'EN_TRAMITE', 'HABILITADA'],
            'DNI Representante': ['11223344', '1234567', '12345678', '55667788', 'ABCD1234'],
            'Nombres Representante': ['CARLOS ALBERTO', 'X', 'JUAN CARLOS', 'MARÍA ELENA', 'A'],
            'Apellidos Representante': ['MAMANI TORRES', 'Y', 'PÉREZ QUISPE', 'VARGAS LÓPEZ', 'B'],
            'Email Representante': ['carlos@transportesnuevos.com', 'invalid-email', 'juan@empresa.com', 'maria@logisticanueva.com', 'invalid'],
            'Teléfono Representante': ['952111222', '12345', '951234567', '953444555', 'abc'],
            'Dirección Representante': ['AV. REPRESENTANTE 111, PUNO', '', 'AV. PRINCIPAL 123, PUNO', 'JR. REPRESENTANTE 222, AREQUIPA', ''],
            'Email Contacto': ['info@transportesnuevos.com', '', 'info@empresa.com', 'contacto@logisticanueva.com', ''],
            'Teléfono Contacto': ['051-111222', '', '051-123456', '054-444555', ''],
            'Sitio Web': ['www.transportesnuevos.com', '', 'www.empresa.com', 'www.logisticanueva.com', ''],
            'Observaciones': ['Empresa nueva en el mercado', '', 'Empresa duplicada para prueba', 'Especializada en logística', '']
        }
        
        df_prueba = pd.DataFrame(datos_prueba)
        df_prueba.to_excel('empresas_prueba.xlsx', index=False)
        print("✅ Archivo de prueba creado: empresas_prueba.xlsx")
    except Exception as e:
        print(f"❌ Error creando archivo de prueba: {e}")
        return
    
    # 3. Validar archivo de prueba
    print("3️⃣ VALIDANDO ARCHIVO DE PRUEBA...")
    try:
        with open('empresas_prueba.xlsx', 'rb') as f:
            from io import BytesIO
            archivo_buffer = BytesIO(f.read())
            
        resultado = excel_service.validar_archivo_excel(archivo_buffer)
        
        print("📊 RESULTADOS DE VALIDACIÓN:")
        print(f"   Total filas: {resultado['total_filas']}")
        print(f"   ✅ Válidos: {resultado['validos']}")
        print(f"   ❌ Inválidos: {resultado['invalidos']}")
        print(f"   ⚠️  Con advertencias: {resultado['con_advertencias']}")
        
        if resultado['errores']:
            print("📋 ERRORES ENCONTRADOS:")
            for error in resultado['errores']:
                print(f"   Fila {error['fila']} - Código {error['codigo_empresa']}:")
                for mensaje in error['errores']:
                    print(f"     • {mensaje}")
        
        if resultado['advertencias']:
            print("⚠️  ADVERTENCIAS:")
            for advertencia in resultado['advertencias']:
                print(f"   Fila {advertencia['fila']} - Código {advertencia['codigo_empresa']}:")
                for mensaje in advertencia['advertencias']:
                    print(f"     • {mensaje}")
        
    except Exception as e:
        print(f"❌ Error validando archivo: {e}")
        return
    
    # 4. Procesar carga masiva (simulación)
    print("4️⃣ PROCESANDO CARGA MASIVA...")
    try:
        with open('empresas_prueba.xlsx', 'rb') as f:
            archivo_buffer = BytesIO(f.read())
            
        resultado_procesamiento = excel_service.procesar_carga_masiva(archivo_buffer)
        
        print("📊 RESULTADOS DE PROCESAMIENTO:")
        print(f"   Total filas: {resultado_procesamiento['total_filas']}")
        print(f"   ✅ Válidos: {resultado_procesamiento['validos']}")
        print(f"   ❌ Inválidos: {resultado_procesamiento['invalidos']}")
        print(f"   🏢 Empresas creadas: {resultado_procesamiento['total_creadas']}")
        
        if resultado_procesamiento['empresas_creadas']:
            print("🏢 EMPRESAS CREADAS:")
            for empresa in resultado_procesamiento['empresas_creadas']:
                print(f"   • {empresa['codigo_empresa']} - {empresa['ruc']} - {empresa['razon_social']}")
        
        if resultado_procesamiento['errores_creacion']:
            print("❌ ERRORES DE CREACIÓN:")
            for error in resultado_procesamiento['errores_creacion']:
                print(f"   • {error['codigo_empresa']}: {error['error']}")
        
    except Exception as e:
        print(f"❌ Error procesando carga masiva: {e}")
        return
    
    # 5. Estadísticas finales
    print("5️⃣ ESTADÍSTICAS FINALES...")
    try:
        empresas_finales = get_mock_empresas()
        print(f"   📊 Total empresas disponibles: {len(empresas_finales)}")
        
        # Contar por estado
        estados = {}
        for empresa in empresas_finales:
            estado = empresa.estado.value
            estados[estado] = estados.get(estado, 0) + 1
        
        for estado, cantidad in estados.items():
            print(f"   📊 Empresas {estado}: {cantidad}")
        
        print(f"   🏢 Total empresas después del procesamiento: {len(empresas_finales)}")
        
    except Exception as e:
        print(f"❌ Error obteniendo estadísticas: {e}")
    
    print("=" * 60)
    print("✅ PRUEBAS COMPLETADAS")

if __name__ == "__main__":
    print("🎉 TODAS LAS PRUEBAS COMPLETADAS")
    main()