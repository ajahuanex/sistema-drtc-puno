#!/usr/bin/env python3
"""
Pruebas para el sistema de códigos de empresa
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.codigo_empresa_utils import CodigoEmpresaUtils
from app.models.empresa import TipoEmpresa

def test_validacion_formato():
    """Prueba la validación del formato de códigos"""
    print("=== Prueba de Validación de Formato ===")
    
    # Códigos válidos
    codigos_validos = [
        "0001PRT",
        "0123PRT", 
        "9999PRT",
        "0456PRT"
    ]
    
    # Códigos inválidos
    codigos_invalidos = [
        "123PRT",      # Muy corto
        "00001PRT",    # Muy largo
        "0123ABC",     # Letras incorrectas
        "ABCDPRT",     # Sin números
        "0123PR",      # Solo 2 letras
        "0123PRTT",    # 4 letras
        "0123PR1",     # Número en lugar de letra
        "",            # Vacío
        None           # Null
    ]
    
    print("Probando códigos válidos:")
    for codigo in codigos_validos:
        es_valido = CodigoEmpresaUtils.validar_formato_codigo(codigo)
        print(f"  {codigo}: {'✓' if es_valido else '✗'}")
        assert es_valido, f"El código {codigo} debería ser válido"
    
    print("\nProbando códigos inválidos:")
    for codigo in codigos_invalidos:
        if codigo is not None:
            es_valido = CodigoEmpresaUtils.validar_formato_codigo(codigo)
            print(f"  {codigo}: {'✗' if not es_valido else '✓'}")
            assert not es_valido, f"El código {codigo} debería ser inválido"
    
    print("✓ Todas las validaciones de formato pasaron\n")

def test_generacion_codigos():
    """Prueba la generación de códigos"""
    print("=== Prueba de Generación de Códigos ===")
    
    # Generar códigos simples
    codigo1 = CodigoEmpresaUtils.generar_codigo_empresa_simple(1)
    codigo2 = CodigoEmpresaUtils.generar_codigo_empresa_simple(123)
    codigo3 = CodigoEmpresaUtils.generar_codigo_empresa_simple(9999)
    
    print(f"Código para empresa #1: {codigo1}")
    print(f"Código para empresa #123: {codigo2}")
    print(f"Código para empresa #9999: {codigo3}")
    
    # Verificar formato
    assert codigo1 == "0001PRT", f"Esperado: 0001PRT, Obtenido: {codigo1}"
    assert codigo2 == "0123PRT", f"Esperado: 0123PRT, Obtenido: {codigo2}"
    assert codigo3 == "9999PRT", f"Esperado: 9999PRT, Obtenido: {codigo3}"
    
    # Generar códigos personalizados
    codigo_personalizado = CodigoEmpresaUtils.generar_codigo_empresa(
        456, 
        [TipoEmpresa.PERSONAS, TipoEmpresa.TURISMO]
    )
    print(f"Código personalizado: {codigo_personalizado}")
    
    # Verificar que sea válido
    assert CodigoEmpresaUtils.validar_formato_codigo(codigo_personalizado), \
        f"El código personalizado {codigo_personalizado} debería ser válido"
    
    print("✓ Todas las generaciones de códigos pasaron\n")

def test_extraccion_informacion():
    """Prueba la extracción de información de códigos"""
    print("=== Prueba de Extracción de Información ===")
    
    codigo = "0123PRT"
    info = CodigoEmpresaUtils.extraer_informacion_codigo(codigo)
    
    print(f"Código: {codigo}")
    print(f"Información extraída: {info}")
    
    # Verificar información extraída
    assert info["numero_secuencial"] == 123, f"Esperado: 123, Obtenido: {info['numero_secuencial']}"
    assert info["codigo_completo"] == "0123PRT", f"Esperado: 0123PRT, Obtenido: {info['codigo_completo']}"
    assert len(info["tipos_empresa"]) == 3, f"Esperado: 3 tipos, Obtenido: {len(info['tipos_empresa'])}"
    
    # Verificar tipos de empresa
    tipos_esperados = [TipoEmpresa.PERSONAS, TipoEmpresa.REGIONAL, TipoEmpresa.TURISMO]
    for tipo in tipos_esperados:
        assert tipo in info["tipos_empresa"], f"El tipo {tipo} debería estar presente"
    
    print("✓ Extracción de información pasó\n")

def test_generacion_siguiente_codigo():
    """Prueba la generación del siguiente código disponible"""
    print("=== Prueba de Generación del Siguiente Código ===")
    
    # Simular códigos existentes
    codigos_existentes = ["0001PRT", "0002PRT", "0005PRT"]
    
    siguiente_codigo = CodigoEmpresaUtils.generar_siguiente_codigo_disponible(codigos_existentes)
    print(f"Códigos existentes: {codigos_existentes}")
    print(f"Siguiente código disponible: {siguiente_codigo}")
    
    # Verificar que sea el siguiente número secuencial
    assert siguiente_codigo == "0006PRT", f"Esperado: 0006PRT, Obtenido: {siguiente_codigo}"
    
    # Probar con lista vacía
    siguiente_vacio = CodigoEmpresaUtils.generar_siguiente_codigo_disponible([])
    assert siguiente_vacio == "0001PRT", f"Esperado: 0001PRT, Obtenido: {siguiente_vacio}"
    
    print("✓ Generación del siguiente código pasó\n")

def test_descripcion_tipos():
    """Prueba la obtención de descripciones de tipos"""
    print("=== Prueba de Descripciones de Tipos ===")
    
    tipos = [TipoEmpresa.PERSONAS, TipoEmpresa.REGIONAL, TipoEmpresa.TURISMO]
    descripcion = CodigoEmpresaUtils.obtener_descripcion_tipos(tipos)
    
    print(f"Tipos: {tipos}")
    print(f"Descripción: {descripcion}")
    
    # Verificar descripción
    assert "Personas" in descripcion, "Debería incluir 'Personas'"
    assert "Regional" in descripcion, "Debería incluir 'Regional'"
    assert "Turismo" in descripcion, "Debería incluir 'Turismo'"
    
    print("✓ Descripción de tipos pasó\n")

def test_errores_y_excepciones():
    """Prueba el manejo de errores y excepciones"""
    print("=== Prueba de Manejo de Errores ===")
    
    # Probar con número secuencial inválido
    try:
        CodigoEmpresaUtils.generar_codigo_empresa(0, [TipoEmpresa.PERSONAS])
        assert False, "Debería haber lanzado ValueError para número 0"
    except ValueError:
        print("✓ Error capturado para número 0")
    
    try:
        CodigoEmpresaUtils.generar_codigo_empresa(10000, [TipoEmpresa.PERSONAS])
        assert False, "Debería haber lanzado ValueError para número 10000"
    except ValueError:
        print("✓ Error capturado para número 10000")
    
    # Probar con tipos de empresa excesivos
    try:
        CodigoEmpresaUtils.generar_codigo_empresa(1, [TipoEmpresa.PERSONAS, TipoEmpresa.REGIONAL, TipoEmpresa.TURISMO, TipoEmpresa.PERSONAS])
        assert False, "Debería haber lanzado ValueError para más de 3 tipos"
    except ValueError:
        print("✓ Error capturado para más de 3 tipos")
    
    # Probar extracción de código inválido
    try:
        CodigoEmpresaUtils.extraer_informacion_codigo("INVALID")
        assert False, "Debería haber lanzado ValueError para código inválido"
    except ValueError:
        print("✓ Error capturado para código inválido")
    
    print("✓ Manejo de errores pasó\n")

def main():
    """Función principal que ejecuta todas las pruebas"""
    print("🚀 Iniciando pruebas del sistema de códigos de empresa...\n")
    
    try:
        test_validacion_formato()
        test_generacion_codigos()
        test_extraccion_informacion()
        test_generacion_siguiente_codigo()
        test_descripcion_tipos()
        test_errores_y_excepciones()
        
        print("🎉 ¡Todas las pruebas pasaron exitosamente!")
        print("✅ El sistema de códigos de empresa está funcionando correctamente")
        
    except Exception as e:
        print(f"❌ Error en las pruebas: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
