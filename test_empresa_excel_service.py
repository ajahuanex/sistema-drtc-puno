#!/usr/bin/env python3
"""
Script para probar el EmpresaExcelService
"""
import asyncio
import sys
import os

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_empresa_excel_service():
    """Probar el servicio de Excel de empresas"""
    try:
        print("🔍 PROBANDO EMPRESA EXCEL SERVICE")
        print("=" * 50)
        
        # Importar después de agregar al path
        from app.services.empresa_excel_service import EmpresaExcelService
        
        # Crear instancia del servicio
        excel_service = EmpresaExcelService()
        
        # Probar obtener servicio de configuraciones
        print("📡 Probando obtener servicio de configuraciones...")
        config_service = await excel_service._get_configuracion_service()
        print("✅ Servicio de configuraciones obtenido")
        
        # Probar obtener tipos de servicio
        print("📡 Probando obtener tipos de servicio...")
        tipos = await config_service.get_tipos_servicio_codigos()
        print(f"✅ Tipos de servicio obtenidos: {tipos}")
        
        # Probar generar plantilla
        print("📡 Probando generar plantilla Excel...")
        plantilla = excel_service.generar_plantilla_excel()
        print(f"✅ Plantilla generada: {len(plantilla.getvalue())} bytes")
        
        print("\n🎯 Todas las pruebas pasaron exitosamente")
        
    except Exception as e:
        print(f"❌ Error en las pruebas: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_empresa_excel_service())