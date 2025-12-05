"""
Script para diagnosticar el problema de resoluciones en el módulo de rutas
"""
from pymongo import MongoClient
from bson import ObjectId
import sys

# Configuración
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"

def diagnosticar_problema():
    """Diagnostica el problema de resoluciones en rutas"""
    try:
        print("\n" + "="*70)
        print("  DIAGNÓSTICO: PROBLEMA DE RESOLUCIONES EN RUTAS")
        print("="*70 + "\n")
        
        # Conectar a MongoDB
        client = MongoClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        # 1. Verificar empresas
        print("1. EMPRESAS EN LA BASE DE DATOS:")
        print("-" * 70)
        empresas = list(db.empresas.find({}, {'_id': 1, 'ruc': 1, 'razonSocial': 1}))
        for empresa in empresas:
            print(f"   ID: {empresa['_id']}")
            print(f"   RUC: {empresa.get('ruc')}")
            razon_social = empresa.get('razonSocial', {})
            if isinstance(razon_social, dict):
                print(f"   Razón Social: {razon_social.get('principal', 'N/A')}")
            else:
                print(f"   Razón Social: {razon_social}")
            print()
        
        if not empresas:
            print("   ❌ NO HAY EMPRESAS EN LA BASE DE DATOS")
            print()
            return
        
        # 2. Verificar resoluciones
        print("\n2. RESOLUCIONES EN LA BASE DE DATOS:")
        print("-" * 70)
        resoluciones = list(db.resoluciones.find({}, {
            '_id': 1,
            'nroResolucion': 1,
            'empresaId': 1,
            'tipoResolucion': 1,
            'tipoTramite': 1,
            'estado': 1,
            'estaActivo': 1
        }))
        
        if not resoluciones:
            print("   ❌ NO HAY RESOLUCIONES EN LA BASE DE DATOS")
            print()
            return
        
        for resolucion in resoluciones:
            print(f"   ID: {resolucion['_id']}")
            print(f"   Número: {resolucion.get('nroResolucion')}")
            print(f"   Empresa ID: {resolucion.get('empresaId')}")
            print(f"   Tipo Resolución: {resolucion.get('tipoResolucion')}")
            print(f"   Tipo Trámite: {resolucion.get('tipoTramite')}")
            print(f"   Estado: {resolucion.get('estado')}")
            print(f"   Activo: {resolucion.get('estaActivo')}")
            print()
        
        # 3. Verificar relación empresa-resolución
        print("\n3. RELACIÓN EMPRESA-RESOLUCIÓN:")
        print("-" * 70)
        for empresa in empresas:
            empresa_id_str = str(empresa['_id'])
            razon_social = empresa.get('razonSocial', {})
            if isinstance(razon_social, dict):
                nombre_empresa = razon_social.get('principal', 'N/A')
            else:
                nombre_empresa = razon_social
            print(f"\n   Empresa: {nombre_empresa}")
            print(f"   ID: {empresa_id_str}")
            
            # Buscar resoluciones de esta empresa
            resoluciones_empresa = list(db.resoluciones.find({'empresaId': empresa_id_str}))
            
            if resoluciones_empresa:
                print(f"   ✅ {len(resoluciones_empresa)} resolución(es) encontrada(s):")
                for res in resoluciones_empresa:
                    print(f"      - {res.get('nroResolucion')} ({res.get('tipoResolucion')}, {res.get('estado')})")
            else:
                print(f"   ❌ NO HAY RESOLUCIONES PARA ESTA EMPRESA")
                
                # Verificar si hay resoluciones con empresaId como ObjectId
                resoluciones_objectid = list(db.resoluciones.find({'empresaId': empresa['_id']}))
                if resoluciones_objectid:
                    print(f"   ⚠️  PROBLEMA ENCONTRADO: {len(resoluciones_objectid)} resolución(es) con empresaId como ObjectId")
                    print(f"      Deberían tener empresaId como string: '{empresa_id_str}'")
        
        # 4. Verificar resoluciones VIGENTES y PADRE
        print("\n\n4. RESOLUCIONES VIGENTES Y PADRE (VÁLIDAS PARA RUTAS):")
        print("-" * 70)
        resoluciones_validas = list(db.resoluciones.find({
            'estado': 'VIGENTE',
            'tipoResolucion': 'PADRE',
            'estaActivo': True
        }))
        
        if resoluciones_validas:
            print(f"   ✅ {len(resoluciones_validas)} resolución(es) válida(s) para crear rutas:")
            for res in resoluciones_validas:
                print(f"      - {res.get('nroResolucion')}")
                print(f"        Empresa ID: {res.get('empresaId')}")
                print(f"        Tipo Trámite: {res.get('tipoTramite')}")
                print()
        else:
            print("   ❌ NO HAY RESOLUCIONES VIGENTES Y PADRE")
            print("      Para crear rutas necesitas resoluciones con:")
            print("      - estado: VIGENTE")
            print("      - tipoResolucion: PADRE")
            print("      - estaActivo: true")
        
        # 5. Verificar rutas existentes
        print("\n5. RUTAS EN LA BASE DE DATOS:")
        print("-" * 70)
        rutas = list(db.rutas.find({}, {
            '_id': 1,
            'codigoRuta': 1,
            'nombre': 1,
            'empresaId': 1,
            'resolucionId': 1
        }))
        
        if rutas:
            print(f"   ✅ {len(rutas)} ruta(s) encontrada(s):")
            for ruta in rutas:
                print(f"      - Código: {ruta.get('codigoRuta')}")
                print(f"        Nombre: {ruta.get('nombre')}")
                print(f"        Empresa ID: {ruta.get('empresaId')}")
                print(f"        Resolución ID: {ruta.get('resolucionId')}")
                print()
        else:
            print("   ℹ️  NO HAY RUTAS EN LA BASE DE DATOS")
        
        # 6. Diagnóstico final
        print("\n" + "="*70)
        print("  DIAGNÓSTICO FINAL")
        print("="*70)
        
        if not empresas:
            print("\n❌ PROBLEMA: No hay empresas en la base de datos")
            print("   SOLUCIÓN: Ejecuta 'python crear_datos_iniciales.py'")
        elif not resoluciones:
            print("\n❌ PROBLEMA: No hay resoluciones en la base de datos")
            print("   SOLUCIÓN: Crea una resolución para la empresa desde el frontend")
        elif not resoluciones_validas:
            print("\n❌ PROBLEMA: No hay resoluciones VIGENTES y PADRE")
            print("   SOLUCIÓN: Las resoluciones deben tener:")
            print("   - estado: VIGENTE")
            print("   - tipoResolucion: PADRE")
            print("   - tipoTramite: AUTORIZACION_NUEVA")
        else:
            # Verificar si las resoluciones tienen el empresaId correcto
            problema_empresaid = False
            for empresa in empresas:
                empresa_id_str = str(empresa['_id'])
                resoluciones_empresa = list(db.resoluciones.find({'empresaId': empresa_id_str}))
                if not resoluciones_empresa:
                    resoluciones_objectid = list(db.resoluciones.find({'empresaId': empresa['_id']}))
                    if resoluciones_objectid:
                        problema_empresaid = True
                        break
            
            if problema_empresaid:
                print("\n⚠️  PROBLEMA: Las resoluciones tienen empresaId como ObjectId en lugar de string")
                print("   SOLUCIÓN: Ejecuta el script de corrección de relaciones")
            else:
                print("\n✅ TODO ESTÁ CORRECTO")
                print("   Las empresas y resoluciones están bien configuradas")
                print("   Deberías poder crear rutas sin problemas")
        
        print("\n" + "="*70 + "\n")
        
        client.close()
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    diagnosticar_problema()
