#!/usr/bin/env python3
"""
Script para capturar logs durante la carga de resoluciones
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def probar_carga_con_logs():
    """Probar carga con logs detallados"""
    import logging
    from app.services.resolucion_padres_service import ResolucionPadresService
    from app.dependencies.db import get_database
    import pandas as pd
    import glob
    
    # Configurar logging para ver TODO
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('carga_resoluciones.log', mode='w')
        ]
    )
    
    logger = logging.getLogger(__name__)
    
    print("=" * 70)
    print("CAPTURA DE LOGS: Carga de Resoluciones")
    print("=" * 70)
    
    # Buscar archivo de prueba
    archivos = glob.glob("TEST_10_ANIOS_*.xlsx")
    
    if not archivos:
        print("\n❌ No se encontró archivo de prueba")
        print("Ejecuta: python test_lectura_excel_10_anios.py")
        return
    
    archivo = archivos[0]
    print(f"\n📄 Usando archivo: {archivo}")
    
    try:
        # Conectar a BD
        db = await get_database()
        if db is None:
            print("\n❌ No hay conexión a MongoDB")
            print("Asegúrate de que MongoDB esté corriendo")
            return
        
        print("✅ Conectado a MongoDB")
        
        # Crear servicio
        service = ResolucionPadresService(db)
        
        # Leer Excel
        print(f"\n📖 Leyendo archivo Excel...")
        df = pd.read_excel(archivo, dtype=str, keep_default_na=False)
        df = df.fillna('')
        
        print(f"   Filas: {len(df)}")
        print(f"   Columnas: {list(df.columns)}")
        
        # Mostrar datos
        print(f"\n📊 Datos del Excel:")
        for idx, row in df.iterrows():
            numero = row.get('Número Resolución', row.get('RESOLUCION_NUMERO', 'N/A'))
            anios = row.get('Años Vigencia', row.get('ANIOS_VIGENCIA', 'N/A'))
            print(f"   Fila {idx+1}: {numero} - Años: {anios}")
        
        # Procesar con logs
        print(f"\n🔄 Procesando con el servicio...")
        print("=" * 70)
        
        resultado = await service.procesar_plantilla_padres(df, 'USR001')
        
        print("=" * 70)
        print(f"\n📊 RESULTADO:")
        print(f"   Éxito: {resultado['exito']}")
        print(f"   Mensaje: {resultado['mensaje']}")
        
        if 'estadisticas' in resultado:
            stats = resultado['estadisticas']
            print(f"\n📈 Estadísticas:")
            print(f"   Total procesadas: {stats.get('total_procesadas', 0)}")
            print(f"   Creadas: {stats.get('creadas', 0)}")
            print(f"   Actualizadas: {stats.get('actualizadas', 0)}")
            print(f"   Con 4 años: {stats.get('con_4_anios', 0)}")
            print(f"   Con 10 años: {stats.get('con_10_anios', 0)}")
            
            if stats.get('con_10_anios', 0) > 0:
                print(f"\n✅ ¡SE PROCESARON {stats['con_10_anios']} RESOLUCIONES CON 10 AÑOS!")
            else:
                print(f"\n❌ NO se procesaron resoluciones con 10 años")
        
        if resultado.get('errores'):
            print(f"\n❌ Errores ({len(resultado['errores'])}):")
            for error in resultado['errores']:
                print(f"   - {error}")
        
        if resultado.get('advertencias'):
            print(f"\n⚠️  Advertencias ({len(resultado['advertencias'])}):")
            for adv in resultado['advertencias'][:5]:
                print(f"   - {adv}")
        
        # Verificar en BD
        print(f"\n🔍 Verificando en base de datos...")
        resoluciones_collection = db["resoluciones"]
        
        for res_info in resultado.get('resoluciones_creadas', []) + resultado.get('resoluciones_actualizadas', []):
            numero = res_info.get('numero')
            if numero:
                res_bd = await resoluciones_collection.find_one({"nroResolucion": numero})
                if res_bd:
                    anios_bd = res_bd.get('aniosVigencia')
                    print(f"   {numero}: aniosVigencia = {anios_bd}")
                    
                    if anios_bd == 10:
                        print(f"      ⭐ ¡CONFIRMADO EN BD!")
                    elif anios_bd == 4:
                        print(f"      ⚠️  Tiene 4 años (debería ser 10?)")
        
        print(f"\n📝 Logs guardados en: carga_resoluciones.log")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Función principal"""
    print("\n🔍 Captura de Logs de Carga de Resoluciones\n")
    asyncio.run(probar_carga_con_logs())
    print("\n✅ Proceso completado")
    print("Revisa el archivo 'carga_resoluciones.log' para ver todos los logs")

if __name__ == "__main__":
    main()
