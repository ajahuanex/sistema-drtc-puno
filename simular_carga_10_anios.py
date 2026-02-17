#!/usr/bin/env python3
"""
Script para simular la carga de resoluciones con 10 años
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def simular_carga():
    """Simular carga de archivo con 10 años"""
    from app.services.resolucion_excel_service import ResolucionExcelService
    from io import BytesIO
    import glob
    
    print("=" * 70)
    print("SIMULACIÓN: Carga de Resoluciones con 10 años")
    print("=" * 70)
    
    # Buscar archivo de prueba
    archivos_test = glob.glob("TEST_10_ANIOS_*.xlsx")
    
    if not archivos_test:
        print("\n❌ No se encontró archivo de prueba")
        print("   Ejecuta primero: python test_lectura_excel_10_anios.py")
        return
    
    archivo = archivos_test[0]
    print(f"\n📄 Usando archivo: {archivo}")
    
    service = ResolucionExcelService()
    
    try:
        # Leer archivo
        with open(archivo, 'rb') as f:
            contenido = f.read()
        
        archivo_bytes = BytesIO(contenido)
        
        # Validar archivo
        print("\n🔍 Paso 1: Validando archivo...")
        resultado = await service.validar_archivo_excel(archivo_bytes)
        
        print(f"\n📊 Resultados de validación:")
        print(f"   Total filas: {resultado.get('total_filas', 0)}")
        print(f"   Válidos: {resultado.get('validos', 0)}")
        print(f"   Inválidos: {resultado.get('invalidos', 0)}")
        
        # Mostrar resoluciones válidas
        if resultado.get('resoluciones_validas'):
            print(f"\n✅ Resoluciones válidas: {len(resultado['resoluciones_validas'])}")
            
            for i, res in enumerate(resultado['resoluciones_validas'], 1):
                numero = res.get('nroResolucion')
                anios = res.get('aniosVigencia')
                fecha_inicio = res.get('fechaVigenciaInicio')
                fecha_fin = res.get('fechaVigenciaFin')
                
                emoji = "⭐" if anios == 10 else "✓"
                print(f"\n   {emoji} Resolución {i}:")
                print(f"      Número: {numero}")
                print(f"      Años Vigencia: {anios}")
                print(f"      Fecha Inicio: {fecha_inicio}")
                print(f"      Fecha Fin: {fecha_fin}")
                
                # Verificar que sea 10 años
                if anios == 10:
                    print(f"      ✅ CORRECTO: Tiene 10 años de vigencia")
                else:
                    print(f"      ❌ ERROR: Debería tener 10 años pero tiene {anios}")
        
        # Mostrar errores
        if resultado.get('errores'):
            print(f"\n❌ Errores encontrados:")
            for error in resultado['errores']:
                print(f"\n   Fila {error.get('fila')}:")
                for err in error.get('errores', []):
                    print(f"      - {err}")
        
        # Intentar procesar (solo si no hay errores críticos)
        if resultado.get('validos', 0) > 0:
            print(f"\n" + "=" * 70)
            print("🔄 Paso 2: Procesando carga masiva...")
            print("=" * 70)
            
            # Reiniciar el BytesIO
            archivo_bytes.seek(0)
            
            resultado_procesamiento = await service.procesar_carga_masiva(archivo_bytes)
            
            print(f"\n📊 Resultados del procesamiento:")
            print(f"   Total procesadas: {resultado_procesamiento.get('total_procesadas', 0)}")
            print(f"   Creadas: {resultado_procesamiento.get('total_creadas', 0)}")
            print(f"   Actualizadas: {resultado_procesamiento.get('total_actualizadas', 0)}")
            print(f"   Errores: {resultado_procesamiento.get('total_errores_creacion', 0)}")
            
            # Estadísticas de vigencia
            if 'estadisticas_vigencia' in resultado_procesamiento:
                stats = resultado_procesamiento['estadisticas_vigencia']
                print(f"\n📈 Estadísticas de vigencia:")
                print(f"   Con 4 años: {stats.get('con_4_anios', 0)}")
                print(f"   Con 10 años: {stats.get('con_10_anios', 0)} ⭐")
                print(f"   Otros: {stats.get('otros_anios', 0)}")
                print(f"   Sin vigencia (HIJO): {stats.get('sin_vigencia', 0)}")
                
                if stats.get('con_10_anios', 0) > 0:
                    print(f"\n✅ ¡ÉXITO! Se procesaron {stats['con_10_anios']} resoluciones con 10 años")
                else:
                    print(f"\n❌ ERROR: No se procesaron resoluciones con 10 años")
            
            # Mostrar resoluciones creadas
            if resultado_procesamiento.get('resoluciones_creadas'):
                print(f"\n📋 Resoluciones procesadas:")
                for res in resultado_procesamiento['resoluciones_creadas']:
                    numero = res.get('numero_resolucion')
                    anios = res.get('anios_vigencia')
                    accion = res.get('accion')
                    
                    emoji = "⭐" if anios == 10 else "✓"
                    print(f"\n   {emoji} {numero}")
                    print(f"      Años: {anios}")
                    print(f"      Acción: {accion}")
            
            # Mostrar errores de creación
            if resultado_procesamiento.get('errores_creacion'):
                print(f"\n❌ Errores de creación:")
                for error in resultado_procesamiento['errores_creacion']:
                    print(f"\n   {error.get('numero_resolucion')}")
                    print(f"      Error: {error.get('error')}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

async def verificar_en_bd():
    """Verificar en la base de datos"""
    from app.dependencies.db import get_database
    
    print(f"\n" + "=" * 70)
    print("🔍 Paso 3: Verificando en la base de datos...")
    print("=" * 70)
    
    try:
        db = await get_database()
        if not db:
            print("\n⚠️  MongoDB no está conectado")
            print("   No se puede verificar en la base de datos")
            return
        
        resoluciones_collection = db["resoluciones"]
        
        # Buscar las resoluciones de prueba
        resoluciones_test = await resoluciones_collection.find({
            "nroResolucion": {"$in": ["R-9001-2025", "R-9002-2025"]},
            "estaActivo": True
        }).to_list(length=None)
        
        if resoluciones_test:
            print(f"\n✅ Encontradas {len(resoluciones_test)} resoluciones de prueba:")
            
            for res in resoluciones_test:
                numero = res.get('nroResolucion')
                anios = res.get('aniosVigencia')
                fecha_inicio = res.get('fechaVigenciaInicio')
                fecha_fin = res.get('fechaVigenciaFin')
                
                emoji = "⭐" if anios == 10 else "❌"
                print(f"\n{emoji} {numero}")
                print(f"   Años Vigencia: {anios}")
                print(f"   Fecha Inicio: {fecha_inicio}")
                print(f"   Fecha Fin: {fecha_fin}")
                
                if anios == 10:
                    print(f"   ✅ CORRECTO: Se guardó con 10 años")
                else:
                    print(f"   ❌ ERROR: Debería tener 10 años pero tiene {anios}")
        else:
            print(f"\n⚠️  No se encontraron las resoluciones de prueba")
            print(f"   Esto puede significar:")
            print(f"   1. No se procesaron correctamente")
            print(f"   2. Hubo errores en la creación")
            print(f"   3. Las empresas no existen en el sistema")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Función principal"""
    print("\n🧪 Simulación de Carga con 10 años\n")
    
    # Simular carga
    asyncio.run(simular_carga())
    
    # Verificar en BD
    asyncio.run(verificar_en_bd())
    
    print("\n" + "=" * 70)
    print("CONCLUSIÓN:")
    print("=" * 70)
    print("Si las resoluciones se guardaron con 10 años:")
    print("   ✅ El sistema está funcionando correctamente")
    print("")
    print("Si las resoluciones NO se guardaron con 10 años:")
    print("   ❌ Hay un problema en el código")
    print("   📧 Reportar con los logs de este script")
    print("=" * 70)

if __name__ == "__main__":
    main()
