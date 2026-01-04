#!/usr/bin/env python3
"""
Script final para generar la plantilla de carga masiva de empresas actualizada
con las nuevas validaciones: solo RUC y Razón Social Principal obligatorios.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.empresa_excel_service import EmpresaExcelService

def generar_plantilla_final():
    """Generar la plantilla final actualizada."""
    
    print("📋 GENERANDO PLANTILLA FINAL ACTUALIZADA")
    print("=" * 50)
    print("✅ Solo RUC y Razón Social Principal son OBLIGATORIOS")
    print("✅ Todos los demás campos son OPCIONALES")
    print("✅ Múltiples teléfonos soportados (separados por espacios)")
    print("✅ Validaciones flexibles implementadas")
    print()
    
    try:
        # Crear servicio
        service = EmpresaExcelService()
        
        # Generar plantilla
        print("🔄 Generando plantilla Excel...")
        plantilla_buffer = service.generar_plantilla_excel()
        
        # Guardar plantilla
        filename = 'plantilla_empresas_actualizada_final.xlsx'
        with open(filename, 'wb') as f:
            f.write(plantilla_buffer.getvalue())
        
        print(f"✅ Plantilla generada exitosamente: {filename}")
        print()
        
        # Mostrar características
        print("📋 CARACTERÍSTICAS DE LA PLANTILLA:")
        print("   • Hoja INSTRUCCIONES: Guía completa actualizada")
        print("   • Hoja CAMPOS: Descripción de campos obligatorios/opcionales")
        print("   • Hoja EJEMPLOS: Casos de uso con datos mínimos y completos")
        print("   • Hoja DATOS: Para completar la carga masiva")
        print()
        
        print("🔧 CAMPOS OBLIGATORIOS:")
        print("   • RUC: Exactamente 11 dígitos")
        print("   • Razón Social Principal: Nombre de la empresa")
        print()
        
        print("📝 CAMPOS OPCIONALES:")
        print("   • Dirección Fiscal")
        print("   • Teléfono Contacto (múltiples números separados por espacios)")
        print("   • Email Contacto")
        print("   • Nombres Representante")
        print("   • Apellidos Representante")
        print("   • DNI Representante")
        print("   • Partida Registral")
        print("   • Razón Social SUNAT")
        print("   • Razón Social Mínimo")
        print("   • Estado")
        print("   • Estado SUNAT")
        print("   • Tipo de Servicio")
        print("   • Observaciones")
        print()
        
        print("🎯 EJEMPLOS EN LA PLANTILLA:")
        print("   • Empresa completa con todos los datos")
        print("   • Empresa con datos mínimos (solo RUC + Razón Social)")
        print("   • Empresa con múltiples teléfonos")
        print()
        
        print("✨ FUNCIONALIDADES:")
        print("   • Normalización automática de teléfonos")
        print("   • Validación flexible de campos")
        print("   • Instrucciones claras y detalladas")
        print("   • Ejemplos prácticos de uso")
        print()
        
        print(f"🎉 ¡PLANTILLA LISTA PARA USAR!")
        print(f"📁 Archivo: {filename}")
        
        return filename
        
    except Exception as e:
        print(f"❌ Error generando plantilla: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    generar_plantilla_final()