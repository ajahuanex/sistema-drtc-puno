"""
Script para verificar los datos en la base de datos
"""
from pymongo import MongoClient
import json

def verificar_datos():
    print("=" * 80)
    print("🔍 VERIFICANDO DATOS EN BASE DE DATOS")
    print("=" * 80)
    
    # Conectar a MongoDB
    client = MongoClient('mongodb://admin:admin123@localhost:27017/')
    db = client['drtc_puno_db']
    
    # 1. Verificar empresas
    print("\n1️⃣ Verificando empresas...")
    empresas = list(db.empresas.find({}).limit(3))
    print(f"Total empresas: {len(empresas)}")
    
    if empresas:
        print("\nPrimera empresa:")
        empresa = empresas[0]
        print(f"  • ID: {empresa.get('_id')}")
        print(f"  • Código: {empresa.get('codigoEmpresa')}")
        print(f"  • RUC: {empresa.get('ruc')}")
        print(f"  • Razón Social: {empresa.get('razonSocial')}")
        print(f"  • Estado: {empresa.get('estado')}")
        print(f"  • Representante: {empresa.get('representanteLegal')}")
        print(f"  • Está Activo: {empresa.get('estaActivo')}")
    
    # 2. Verificar resoluciones
    print(f"\n2️⃣ Verificando resoluciones...")
    resoluciones = list(db.resoluciones.find({}).limit(3))
    print(f"Total resoluciones: {len(resoluciones)}")
    
    if resoluciones:
        print("\nPrimera resolución:")
        resolucion = resoluciones[0]
        print(f"  • ID: {resolucion.get('_id')}")
        print(f"  • Número: {resolucion.get('nroResolucion')}")
        print(f"  • Tipo: {resolucion.get('tipoResolucion')}")
        print(f"  • Estado: {resolucion.get('estado')}")
        print(f"  • Empresa ID: {resolucion.get('empresaId')}")
    
    # 3. Verificar rutas
    print(f"\n3️⃣ Verificando rutas...")
    rutas = list(db.rutas.find({}).limit(3))
    print(f"Total rutas: {len(rutas)}")
    
    if rutas:
        print("\nPrimera ruta:")
        ruta = rutas[0]
        print(f"  • ID: {ruta.get('_id')}")
        print(f"  • Código: {ruta.get('codigoRuta')}")
        print(f"  • Nombre: {ruta.get('nombre')}")
        print(f"  • Estado: {ruta.get('estado')}")
        print(f"  • Empresa ID: {ruta.get('empresaId')}")
        print(f"  • Resolución ID: {ruta.get('resolucionId')}")
    
    client.close()
    print("=" * 80)

if __name__ == "__main__":
    verificar_datos()