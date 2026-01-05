#!/usr/bin/env python3
"""
Script para consultar empresas reales en la base de datos
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import logging

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración de MongoDB
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "sirret_db"

async def consultar_empresas_reales():
    """Consultar empresas reales en la base de datos"""
    
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    empresas_collection = db["empresas"]
    
    try:
        # Obtener todas las empresas activas
        cursor = empresas_collection.find({"estaActivo": True})
        empresas = await cursor.to_list(None)
        
        logger.info(f"📊 Total de empresas activas encontradas: {len(empresas)}")
        
        if len(empresas) == 0:
            logger.warning("⚠️ No se encontraron empresas activas en la base de datos")
            return []
        
        # Mostrar las primeras 10 empresas para la plantilla
        logger.info(f"\n📋 Primeras empresas disponibles para resoluciones padres:")
        empresas_para_plantilla = []
        
        for i, empresa in enumerate(empresas[:10]):
            ruc = empresa.get('ruc', 'Sin RUC')
            razon_social = empresa.get('razonSocial', {})
            
            if isinstance(razon_social, dict):
                nombre = razon_social.get('principal', 'Sin nombre')
            else:
                nombre = str(razon_social) if razon_social else 'Sin nombre'
            
            logger.info(f"   {i+1:2d}. {ruc} - {nombre}")
            
            empresas_para_plantilla.append({
                'ruc': ruc,
                'razon_social': nombre
            })
        
        # Mostrar estadísticas adicionales
        logger.info(f"\n📈 Estadísticas:")
        
        # Contar empresas por estado
        pipeline_estados = [
            {"$group": {"_id": "$estado", "cantidad": {"$sum": 1}}}
        ]
        estados_result = await empresas_collection.aggregate(pipeline_estados).to_list(None)
        
        logger.info(f"   Por estado:")
        for item in estados_result:
            estado = item.get('_id', 'Sin estado')
            cantidad = item.get('cantidad', 0)
            logger.info(f"     {estado}: {cantidad}")
        
        return empresas_para_plantilla
        
    except Exception as e:
        logger.error(f"❌ Error consultando empresas: {str(e)}")
        return []
        
    finally:
        client.close()

async def main():
    """Función principal"""
    logger.info("🔍 Consultando empresas reales en la base de datos...")
    
    empresas = await consultar_empresas_reales()
    
    if empresas:
        logger.info(f"\n✅ Consulta completada. {len(empresas)} empresas disponibles para plantilla.")
        logger.info("Puedes usar estos RUCs en la plantilla de resoluciones padres.")
    else:
        logger.error("\n❌ No se encontraron empresas o hubo un error en la consulta")

if __name__ == "__main__":
    asyncio.run(main())