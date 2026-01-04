#!/usr/bin/env python3
"""
Script para probar la nueva plantilla Excel con el orden de columnas actualizado
"""

import asyncio
import sys
import os

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.empresa_excel_service import EmpresaExcelService

async def main():
    """Función principal para probar la nueva plantilla"""
    print("🔄 Generando nueva plantilla Excel con orden actualizado...")
    
    try:
        # Crear servicio
        excel_service = EmpresaExcelService()
        
        # Generar plantilla
        buffer = excel_service.generar_plantilla_excel()
        
        # Guardar archivo
        filename = "plantilla_empresas_nuevo_orden.xlsx"
        with open(filename, 'wb') as f:
            f.write(buffer.getvalue())
        
        print(f"✅ Plantilla generada exitosamente: {filename}")
        print("\n📋 Orden de columnas:")
        columnas = [
            "RUC",
            "Razón Social Principal", 
            "Dirección Fiscal",
            "Teléfono Contacto",
            "Email Contacto",
            "Nombres Representante",
            "Apellidos Representante", 
            "DNI Representante",
            "Partida Registral",
            "Razón Social SUNAT",
            "Razón Social Mínimo",
            "Estado",
            "Estado SUNAT",
            "Tipo de Servicio",
            "Observaciones"
        ]
        
        for i, col in enumerate(columnas, 1):
            print(f"  {i:2d}. {col}")
        
        print(f"\n📊 Total de columnas: {len(columnas)}")
        print("\n🎯 La plantilla incluye 4 hojas:")
        print("  • DATOS: Para completar los datos")
        print("  • INSTRUCCIONES: Guía de uso")
        print("  • CAMPOS: Descripción de cada campo")
        print("  • EJEMPLOS: Ejemplos de datos válidos")
        
    except Exception as e:
        print(f"❌ Error generando plantilla: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())