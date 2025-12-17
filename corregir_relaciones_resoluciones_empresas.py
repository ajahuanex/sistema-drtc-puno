#!/usr/bin/env python3
"""
Script para corregir las relaciones entre resoluciones y empresas
Asegurar que las resoluciones primigenias tengan empresaId válido
"""

from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime

def corregir_relaciones_resoluciones():
    """Corregir relaciones entre resoluciones y empresas"""
    print("🔧 Corrigiendo relaciones resoluciones-empresas...")
    
    try:
        client = MongoClient('mongodb://admin:admin123@localhost:27017/', serverSelectionTimeoutMS=5000)
        db = client['drtc_puno_db']
        
        # Obtener empresas disponibles
        empresas = list(db.empresas.find({"estaActivo": True}))
        print(f"🏢 Empresas disponibles: {len(empresas)}")
        
        if not empresas:
            print("❌ No hay empresas disponibles")
            return
        
        # Obtener resoluciones sin empresa o con empresa inválida
        resoluciones = list(db.resoluciones.find({
            "tipoResolucion": "PADRE",
            "estado": "VIGENTE",
            "estaActivo": True
        }))
        
        print(f"📄 Resoluciones primigenias: {len(resoluciones)}")
        
        resoluciones_corregidas = 0
        
        for resolucion in resoluciones:
            print(f"\n🔍 Procesando resolución: {resolucion.get('nroResolucion', 'Sin número')}")
            
            empresa_id = resolucion.get('empresaId')
            empresa_valida = None
            
            # Verificar si tiene empresa válida
            if empresa_id:
                # Buscar empresa por ID o ObjectId
                empresa_valida = db.empresas.find_one({
                    "$or": [
                        {"_id": ObjectId(empresa_id) if ObjectId.is_valid(empresa_id) else None},
                        {"id": empresa_id}
                    ]
                })
            
            if not empresa_valida:
                # Asignar empresa (distribuir entre las disponibles)
                empresa_asignada = empresas[resoluciones_corregidas % len(empresas)]
                nuevo_empresa_id = str(empresa_asignada['_id'])
                
                print(f"   ❌ Sin empresa válida, asignando: {empresa_asignada.get('ruc', 'Sin RUC')}")
                
                # Actualizar resolución
                result = db.resoluciones.update_one(
                    {"_id": resolucion["_id"]},
                    {
                        "$set": {
                            "empresaId": nuevo_empresa_id,
                            "fechaActualizacion": datetime.utcnow()
                        }
                    }
                )
                
                if result.modified_count > 0:
                    print(f"   ✅ Resolución actualizada con empresa: {nuevo_empresa_id}")
                    resoluciones_corregidas += 1
                else:
                    print(f"   ⚠️  No se pudo actualizar la resolución")
            else:
                print(f"   ✅ Ya tiene empresa válida: {empresa_valida.get('ruc', 'Sin RUC')}")
        
        print(f"\n📊 Resumen:")
        print(f"   - Resoluciones procesadas: {len(resoluciones)}")
        print(f"   - Resoluciones corregidas: {resoluciones_corregidas}")
        
        # Verificar correcciones
        print(f"\n🔍 Verificando correcciones...")
        resoluciones_verificadas = list(db.resoluciones.find({
            "tipoResolucion": "PADRE",
            "estado": "VIGENTE",
            "estaActivo": True
        }))
        
        for resolucion in resoluciones_verificadas[:3]:  # Mostrar solo las primeras 3
            empresa_id = resolucion.get('empresaId')
            empresa = db.empresas.find_one({
                "$or": [
                    {"_id": ObjectId(empresa_id) if ObjectId.is_valid(empresa_id) else None},
                    {"id": empresa_id}
                ]
            }) if empresa_id else None
            
            print(f"\n   📋 Resolución: {resolucion.get('nroResolucion', 'Sin número')}")
            print(f"      EmpresaId: {empresa_id}")
            if empresa:
                print(f"      Empresa: {empresa.get('ruc', 'Sin RUC')} - {empresa.get('razonSocial', {}).get('principal', 'Sin razón social')}")
                print(f"      ✅ Relación válida")
            else:
                print(f"      ❌ Relación inválida")
        
        client.close()
        print(f"\n✅ Corrección completada!")
        
    except Exception as e:
        print(f"❌ Error corrigiendo relaciones: {e}")

def main():
    """Función principal"""
    print("🚀 CORRECCIÓN DE RELACIONES RESOLUCIONES-EMPRESAS")
    print("="*60)
    
    corregir_relaciones_resoluciones()
    
    print("\n" + "="*60)
    print("✅ PROCESO COMPLETADO")

if __name__ == "__main__":
    main()