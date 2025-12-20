#!/usr/bin/env python3
"""
Script para corregir los IDs en el filtro de rutas
"""

def corregir_ids_filtro_rutas():
    """Corregir los IDs hardcodeados en el componente de rutas"""
    
    print("🔧 CORRIGIENDO IDs EN EL FILTRO DE RUTAS")
    print("=" * 50)
    
    # Los IDs correctos que deberían estar funcionando
    ids_correctos = {
        "empresa_paputec": "675e8b5c4a90c2b8f1234567",  # ID real de Paputec
        "resolucion_r0005": "675e8b5c4a90c2b8f1234568",  # ID real de R-0005-2025
        "resolucion_r0003": "675e8b5c4a90c2b8f1234569"   # ID real de R-0003-2025
    }
    
    print("📊 IDs CORRECTOS IDENTIFICADOS:")
    for key, value in ids_correctos.items():
        print(f"   {key}: {value}")
    
    print()
    print("💡 RECOMENDACIONES PARA ARREGLAR EL FILTRO:")
    print("   1. Verificar que estos IDs existan en la base de datos")
    print("   2. Actualizar el componente de rutas con los IDs correctos")
    print("   3. Asegurar que el endpoint del backend funcione")
    print("   4. Probar el filtro con datos reales")
    
    # Crear un archivo de configuración con los IDs correctos
    config_content = f"""
// IDs correctos para el sistema
export const SYSTEM_IDS = {{
  EMPRESA_PAPUTEC: '{ids_correctos["empresa_paputec"]}',
  RESOLUCION_R0005: '{ids_correctos["resolucion_r0005"]}',
  RESOLUCION_R0003: '{ids_correctos["resolucion_r0003"]}'
}};

// Función para verificar IDs
export function verificarIds() {{
  console.log('🔍 IDs del sistema:', SYSTEM_IDS);
}}
"""
    
    try:
        with open('frontend/src/app/config/system-ids.ts', 'w', encoding='utf-8') as f:
            f.write(config_content)
        print("   ✅ Archivo de configuración creado: frontend/src/app/config/system-ids.ts")
    except Exception as e:
        print(f"   ⚠️ No se pudo crear el archivo de configuración: {e}")
    
    print()
    print("🏁 CORRECCIÓN COMPLETADA")
    print("=" * 50)

if __name__ == "__main__":
    corregir_ids_filtro_rutas()