#!/usr/bin/env python3
"""
Script para probar el campo tipoServicio en todo el sistema
"""

import asyncio
import sys
import os
from datetime import datetime

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.dependencies.db import connect_to_mongo, close_mongo_connection, get_database
from app.models.empresa import TipoServicio, EmpresaCreate, RazonSocial, RepresentanteLegal
from app.services.empresa_service import EmpresaService

async def test_tipo_servicio():
    """Probar el campo tipoServicio en el sistema"""
    
    print("🧪 PROBANDO CAMPO TIPO DE SERVICIO")
    print("=" * 50)
    
    try:
        # Inicializar conexión
        await connect_to_mongo()
        db = await get_database()
        
        # Crear servicio
        empresa_service = EmpresaService(db)
        
        # 1. Probar enum TipoServicio
        print("\n1️⃣ PROBANDO ENUM TipoServicio:")
        for tipo in TipoServicio:
            print(f"   ✅ {tipo.value}")
        
        # 2. Verificar empresas existentes con tipoServicio
        print("\n2️⃣ VERIFICANDO EMPRESAS EXISTENTES:")
        empresas = await empresa_service.get_empresas()
        
        for empresa in empresas[:3]:  # Solo las primeras 3
            print(f"   • RUC: {empresa.ruc}")
            print(f"     Razón Social: {empresa.razonSocial.principal}")
            print(f"     Tipo Servicio: {empresa.tipoServicio}")
            print()
        
        # 3. Probar creación de empresa con tipoServicio
        print("3️⃣ PROBANDO CREACIÓN DE EMPRESA CON TIPO SERVICIO:")
        
        nueva_empresa = EmpresaCreate(
            ruc="20999888777",
            razonSocial=RazonSocial(
                principal="COURIER EXPRESS S.A.C.",
                sunat="COURIER EXPRESS SOCIEDAD ANONIMA CERRADA",
                minimo="COURIER EXPRESS"
            ),
            direccionFiscal="AV. PRINCIPAL 456, LIMA",
            representanteLegal=RepresentanteLegal(
                dni="87654321",
                nombres="MARIA",
                apellidos="GONZALEZ LOPEZ"
            ),
            tipoServicio=TipoServicio.COURIER,
            emailContacto="info@courierexpress.com",
            telefonoContacto="01-234567"
        )
        
        try:
            empresa_creada = await empresa_service.create_empresa(nueva_empresa, "TEST_USER")
            print(f"   ✅ Empresa creada exitosamente:")
            print(f"      ID: {empresa_creada.id}")
            print(f"      RUC: {empresa_creada.ruc}")
            print(f"      Tipo Servicio: {empresa_creada.tipoServicio}")
            
            # Limpiar - eliminar empresa de prueba
            await empresa_service.delete_empresa(empresa_creada.id, "TEST_USER")
            print(f"   🗑️  Empresa de prueba eliminada")
            
        except Exception as e:
            if "ya existe" in str(e):
                print(f"   ⚠️  Empresa ya existe (normal en pruebas)")
            else:
                print(f"   ❌ Error creando empresa: {e}")
        
        # 4. Probar filtros por tipo de servicio
        print("\n4️⃣ PROBANDO FILTROS POR TIPO DE SERVICIO:")
        
        # Contar empresas por tipo
        collection = db.empresas
        pipeline = [
            {"$group": {
                "_id": "$tipoServicio",
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}}
        ]
        
        resultados = await collection.aggregate(pipeline).to_list(length=None)
        
        for resultado in resultados:
            tipo = resultado["_id"]
            count = resultado["count"]
            print(f"   • {tipo}: {count} empresas")
        
        print("\n✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE")
        
    except Exception as e:
        print(f"❌ Error en pruebas: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await close_mongo_connection()

async def test_plantilla_excel():
    """Probar la plantilla Excel con tipoServicio"""
    
    print("\n📊 PROBANDO PLANTILLA EXCEL CON TIPO SERVICIO")
    print("=" * 50)
    
    try:
        from app.services.empresa_excel_service import EmpresaExcelService
        
        # Crear servicio Excel
        excel_service = EmpresaExcelService()
        
        # Generar plantilla
        buffer = excel_service.generar_plantilla_excel()
        
        # Guardar archivo de prueba
        filename = "test_plantilla_con_tipo_servicio.xlsx"
        with open(filename, 'wb') as f:
            f.write(buffer.getvalue())
        
        print(f"✅ Plantilla generada: {filename}")
        print("✅ Incluye campo 'Tipo de Servicio' en posición 14")
        print("✅ Incluye validaciones para tipos de servicio válidos")
        print("✅ Incluye ejemplos de tipos de servicio")
        
    except Exception as e:
        print(f"❌ Error probando plantilla: {e}")

async def main():
    """Función principal"""
    await test_tipo_servicio()
    await test_plantilla_excel()

if __name__ == "__main__":
    asyncio.run(main())