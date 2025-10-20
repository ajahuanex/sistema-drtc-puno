#!/usr/bin/env python3
"""
Script para probar los endpoints de carga masiva de vehículos
"""

import requests
import json
from pathlib import Path

# Configuración
API_BASE = "http://localhost:8000/api/v1/vehiculos"
TEST_FILES_DIR = Path(".")

def test_descargar_plantilla():
    """Probar descarga de plantilla Excel"""
    print("🔽 Probando descarga de plantilla...")
    
    try:
        response = requests.get(f"{API_BASE}/plantilla-excel")
        
        if response.status_code == 200:
            # Guardar archivo
            with open("plantilla_descargada.xlsx", "wb") as f:
                f.write(response.content)
            print("✅ Plantilla descargada correctamente: plantilla_descargada.xlsx")
            return True
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def test_validar_excel():
    """Probar validación de archivo Excel"""
    print("\n🔍 Probando validación de Excel...")
    
    # Usar el archivo de prueba generado anteriormente
    archivo_prueba = "vehiculos_prueba.xlsx"
    
    if not Path(archivo_prueba).exists():
        print(f"❌ Archivo de prueba no encontrado: {archivo_prueba}")
        print("   Ejecuta primero: python test_carga_masiva_vehiculos.py")
        return False
    
    try:
        with open(archivo_prueba, "rb") as f:
            files = {"archivo": (archivo_prueba, f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
            response = requests.post(f"{API_BASE}/validar-excel", files=files)
        
        if response.status_code == 200:
            validaciones = response.json()
            
            validos = len([v for v in validaciones if v["valido"]])
            invalidos = len([v for v in validaciones if not v["valido"]])
            
            print(f"✅ Validación completada:")
            print(f"   📊 Total registros: {len(validaciones)}")
            print(f"   ✅ Válidos: {validos}")
            print(f"   ❌ Inválidos: {invalidos}")
            
            if invalidos > 0:
                print("   📋 Errores encontrados:")
                for v in validaciones:
                    if not v["valido"]:
                        print(f"     • Fila {v['fila']} - Placa {v['placa']}: {', '.join(v['errores'])}")
            
            return True
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_carga_masiva():
    """Probar carga masiva de vehículos"""
    print("\n🚀 Probando carga masiva...")
    
    # Crear un archivo de prueba con datos válidos
    import pandas as pd
    
    datos_validos = {
        'Placa': ['TST-100', 'TST-200'],
        'RUC Empresa': ['20123456789', '20234567890'],
        'Resolución Primigenia': ['', ''],
        'Resolución Hija': ['', ''],
        'Rutas Asignadas': ['', ''],
        'Sede de Registro': ['PUNO', 'AREQUIPA'],
        'Categoría': ['M3', 'N3'],
        'Marca': ['MERCEDES BENZ', 'VOLVO'],
        'Modelo': ['O500', 'FH16'],
        'Año Fabricación': [2020, 2019],
        'Color': ['BLANCO', 'AZUL'],
        'Número Serie': ['TEST001', 'TEST002'],
        'Motor': ['OM 457 LA', 'D16G750'],
        'Chasis': ['TEST123456', 'TEST789012'],
        'Ejes': [2, 3],
        'Asientos': [50, 2],
        'Peso Neto (kg)': [8500.0, 12000.0],
        'Peso Bruto (kg)': [16000.0, 26000.0],
        'Largo (m)': [12.0, 16.0],
        'Ancho (m)': [2.55, 2.6],
        'Alto (m)': [3.2, 3.8],
        'Tipo Combustible': ['DIESEL', 'DIESEL'],
        'Cilindrada': [11967.0, 16000.0],
        'Potencia (HP)': [354.0, 750.0],
        'Estado': ['ACTIVO', 'ACTIVO'],
        'Observaciones': ['Vehículo de prueba válido 1', 'Vehículo de prueba válido 2']
    }
    
    df_validos = pd.DataFrame(datos_validos)
    archivo_validos = 'vehiculos_validos_prueba.xlsx'
    df_validos.to_excel(archivo_validos, index=False)
    
    try:
        with open(archivo_validos, "rb") as f:
            files = {"archivo": (archivo_validos, f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
            response = requests.post(f"{API_BASE}/carga-masiva", files=files)
        
        if response.status_code == 200:
            resultado = response.json()
            
            print(f"✅ Carga masiva completada:")
            print(f"   📊 Total procesados: {resultado['total_procesados']}")
            print(f"   ✅ Exitosos: {resultado['exitosos']}")
            print(f"   ❌ Errores: {resultado['errores']}")
            print(f"   🆔 Vehículos creados: {', '.join(resultado['vehiculos_creados'])}")
            
            if resultado.get('errores_detalle'):
                print("   📋 Errores de procesamiento:")
                for error in resultado['errores_detalle']:
                    print(f"     • Fila {error['fila']} - Placa {error['placa']}: {', '.join(error['errores'])}")
            
            return True
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_estadisticas():
    """Probar endpoint de estadísticas"""
    print("\n📊 Probando estadísticas...")
    
    try:
        response = requests.get(f"{API_BASE}/carga-masiva/estadisticas")
        
        if response.status_code == 200:
            stats = response.json()
            
            print(f"✅ Estadísticas obtenidas:")
            print(f"   📈 Total cargas: {stats['total_cargas']}")
            print(f"   🚗 Vehículos cargados: {stats['vehiculos_cargados_total']}")
            print(f"   📅 Última carga: {stats['ultima_carga']}")
            print(f"   📊 Promedio éxito: {stats['promedio_exitosos']}%")
            
            if stats.get('errores_comunes'):
                print("   🔍 Errores más comunes:")
                for error in stats['errores_comunes']:
                    print(f"     • {error['error']}: {error['frecuencia']} veces")
            
            return True
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Ejecutar todas las pruebas"""
    print("🚗 INICIANDO PRUEBAS DE ENDPOINTS DE CARGA MASIVA")
    print("=" * 60)
    
    # Verificar que el servidor esté ejecutándose
    try:
        response = requests.get("http://localhost:8000/docs")
        print(f"✅ Servidor disponible en {API_BASE}")
    except Exception as e:
        print(f"❌ Servidor no disponible: {e}")
        print("   Asegúrate de que el backend esté ejecutándose en http://localhost:8000")
        return
    
    # Ejecutar pruebas
    resultados = []
    
    resultados.append(("Descargar Plantilla", test_descargar_plantilla()))
    resultados.append(("Validar Excel", test_validar_excel()))
    resultados.append(("Carga Masiva", test_carga_masiva()))
    resultados.append(("Estadísticas", test_estadisticas()))
    
    # Resumen
    print("\n" + "=" * 60)
    print("📋 RESUMEN DE PRUEBAS:")
    
    exitosas = 0
    for nombre, resultado in resultados:
        estado = "✅ EXITOSA" if resultado else "❌ FALLIDA"
        print(f"   {nombre}: {estado}")
        if resultado:
            exitosas += 1
    
    print(f"\n🎯 Resultado final: {exitosas}/{len(resultados)} pruebas exitosas")
    
    if exitosas == len(resultados):
        print("🎉 ¡Todas las pruebas pasaron! La funcionalidad de carga masiva está funcionando correctamente.")
    else:
        print("⚠️  Algunas pruebas fallaron. Revisa los errores anteriores.")

if __name__ == "__main__":
    main()