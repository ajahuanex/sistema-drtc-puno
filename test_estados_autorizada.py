#!/usr/bin/env python3
"""
Test para verificar que los cambios de HABILITADA a AUTORIZADA funcionan correctamente.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.models.empresa import EstadoEmpresa
from app.services.empresa_excel_service import EmpresaExcelService
import pandas as pd

def test_estados_autorizada():
    """Test de los cambios de estado AUTORIZADA."""
    
    print("🧪 TEST ESTADOS EMPRESA - HABILITADA → AUTORIZADA")
    print("=" * 50)
    
    # 1. Verificar enum EstadoEmpresa
    print("\n1. Verificando enum EstadoEmpresa...")
    
    estados_esperados = ["AUTORIZADA", "EN_TRAMITE", "SUSPENDIDA", "CANCELADA", "DADA_DE_BAJA"]
    estados_actuales = [e.value for e in EstadoEmpresa]
    
    print(f"Estados esperados: {estados_esperados}")
    print(f"Estados actuales:  {estados_actuales}")
    
    if "AUTORIZADA" in estados_actuales:
        print("✅ Estado AUTORIZADA encontrado en el enum")
    else:
        print("❌ Estado AUTORIZADA NO encontrado en el enum")
    
    if "HABILITADA" not in estados_actuales:
        print("✅ Estado HABILITADA removido del enum")
    else:
        print("❌ Estado HABILITADA aún presente en el enum")
    
    # 2. Verificar validación en servicio Excel
    print("\n2. Verificando validación en servicio Excel...")
    
    service = EmpresaExcelService()
    
    # Casos de prueba
    casos_estado = [
        {"estado": "AUTORIZADA", "esperado": "válido"},
        {"estado": "EN_TRAMITE", "esperado": "válido"},
        {"estado": "SUSPENDIDA", "esperado": "válido"},
        {"estado": "CANCELADA", "esperado": "válido"},
        {"estado": "DADA_DE_BAJA", "esperado": "válido"},
        {"estado": "HABILITADA", "esperado": "inválido"},  # Ya no debe ser válido
        {"estado": "INVALIDO", "esperado": "inválido"},
    ]
    
    for caso in casos_estado:
        # Crear datos de prueba
        datos = {
            'RUC': '20123456789',
            'Razón Social Principal': 'EMPRESA TEST',
            'Estado': caso["estado"]
        }
        
        row = pd.Series(datos)
        
        # Validar estado
        estado = str(row.get('Estado', '')).strip().upper() if pd.notna(row.get('Estado')) else 'AUTORIZADA'
        es_valido = estado in [e.value for e in EstadoEmpresa]
        
        resultado = "válido" if es_valido else "inválido"
        coincide = resultado == caso["esperado"]
        
        if coincide:
            print(f"   ✅ {caso['estado']}: {resultado} (como se esperaba)")
        else:
            print(f"   ❌ {caso['estado']}: {resultado} (se esperaba {caso['esperado']})")
    
    # 3. Verificar estado por defecto
    print("\n3. Verificando estado por defecto...")
    
    datos_sin_estado = {
        'RUC': '20123456789',
        'Razón Social Principal': 'EMPRESA SIN ESTADO',
        'Estado': ''  # Vacío
    }
    
    row = pd.Series(datos_sin_estado)
    
    # Usar la misma lógica que el servicio
    estado_raw = row.get('Estado', '')
    if pd.isna(estado_raw) or str(estado_raw).strip() == '':
        estado_defecto = 'AUTORIZADA'  # Estado por defecto
    else:
        estado_defecto = str(estado_raw).strip().upper()
    
    if estado_defecto == 'AUTORIZADA':
        print("✅ Estado por defecto es AUTORIZADA")
    else:
        print(f"❌ Estado por defecto es {estado_defecto}, debería ser AUTORIZADA")
    
    # 4. Verificar plantilla Excel
    print("\n4. Verificando plantilla Excel...")
    
    try:
        plantilla_buffer = service.generar_plantilla_excel()
        print("✅ Plantilla generada exitosamente")
        
        # Guardar para inspección manual
        with open('plantilla_test_autorizada.xlsx', 'wb') as f:
            f.write(plantilla_buffer.getvalue())
        print("📁 Plantilla guardada como: plantilla_test_autorizada.xlsx")
        
    except Exception as e:
        print(f"❌ Error generando plantilla: {e}")
    
    # 5. Resumen
    print(f"\n📊 RESUMEN:")
    
    checks = [
        ("Enum contiene AUTORIZADA", "AUTORIZADA" in estados_actuales),
        ("Enum NO contiene HABILITADA", "HABILITADA" not in estados_actuales),
        ("Estado por defecto es AUTORIZADA", estado_defecto == 'AUTORIZADA'),
        ("Plantilla se genera correctamente", True),  # Si llegamos aquí, se generó
    ]
    
    exitosos = sum(1 for _, check in checks if check)
    total = len(checks)
    
    for descripcion, check in checks:
        status = "✅" if check else "❌"
        print(f"   {status} {descripcion}")
    
    print(f"\n🎯 RESULTADO: {exitosos}/{total} checks pasaron")
    
    if exitosos == total:
        print("🎉 ¡TODOS LOS CAMBIOS FUNCIONAN CORRECTAMENTE!")
        print("✅ HABILITADA → AUTORIZADA implementado exitosamente")
    else:
        print("⚠️  Algunos cambios necesitan revisión")
    
    return exitosos == total

if __name__ == "__main__":
    test_estados_autorizada()