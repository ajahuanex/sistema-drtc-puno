"""
Script para corregir los tipos de resoluciones inconsistentes
"""

from pymongo import MongoClient

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"

def corregir():
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("=" * 80)
    print("CORRECCIÓN DE TIPOS DE RESOLUCIONES")
    print("=" * 80)
    
    resoluciones_col = db["resoluciones"]
    
    # Buscar resoluciones con inconsistencias
    resoluciones = list(resoluciones_col.find({}))
    
    print(f"\n📋 Analizando {len(resoluciones)} resoluciones...")
    
    corregidas = 0
    
    for res in resoluciones:
        tipo_actual = res.get('tipoResolucion')
        tiene_padre = res.get('resolucionPadreId') is not None
        numero = res.get('nroResolucion')
        
        # Determinar el tipo correcto basado en si tiene padre
        tipo_correcto = 'HIJO' if tiene_padre else 'PADRE'
        
        if tipo_actual != tipo_correcto:
            print(f"\n⚠️  Inconsistencia encontrada:")
            print(f"   Resolución: {numero}")
            print(f"   Tipo actual: {tipo_actual}")
            print(f"   Tiene padre: {tiene_padre}")
            print(f"   Tipo correcto: {tipo_correcto}")
            
            # Corregir
            result = resoluciones_col.update_one(
                {"_id": res["_id"]},
                {"$set": {"tipoResolucion": tipo_correcto}}
            )
            
            if result.modified_count > 0:
                print(f"   ✅ Corregido a {tipo_correcto}")
                corregidas += 1
    
    print(f"\n" + "=" * 80)
    print(f"✅ Corrección completada: {corregidas} resoluciones corregidas")
    print("=" * 80)
    
    # Mostrar resumen final
    print("\n📊 RESUMEN FINAL:")
    padres = list(resoluciones_col.find({"tipoResolucion": "PADRE"}))
    hijas = list(resoluciones_col.find({"tipoResolucion": "HIJO"}))
    
    print(f"   - Resoluciones PADRE: {len(padres)}")
    print(f"   - Resoluciones HIJO: {len(hijas)}")
    
    # Verificar que no haya inconsistencias
    padres_con_padre = [p for p in padres if p.get('resolucionPadreId')]
    hijas_sin_padre = [h for h in hijas if not h.get('resolucionPadreId')]
    
    if padres_con_padre:
        print(f"\n   ⚠️  {len(padres_con_padre)} resoluciones PADRE aún tienen resolucionPadreId")
    
    if hijas_sin_padre:
        print(f"\n   ⚠️  {len(hijas_sin_padre)} resoluciones HIJO no tienen resolucionPadreId")
    
    if not padres_con_padre and not hijas_sin_padre:
        print(f"\n   ✅ Todas las resoluciones son consistentes")

if __name__ == "__main__":
    corregir()
