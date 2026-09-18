from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.dependencies.db import get_database
from app.services.reporte_google_docs import GoogleDocsReportService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/estadisticas")
async def get_dashboard_estadisticas(db = Depends(get_database)):
    """
    Obtener reporte estadístico para el dashboard
    """
    try:
        # 1. Empresas autorizadas por modalidad
        empresas_por_modalidad_cursor = db["empresas"].aggregate([
            {"$match": {"estado": "AUTORIZADA", "estaActivo": True}},
            {"$unwind": "$tiposServicio"},
            {"$group": {"_id": "$tiposServicio", "total": {"$sum": 1}}}
        ])
        empresas_por_modalidad = []
        async for doc in empresas_por_modalidad_cursor:
            empresas_por_modalidad.append({"modalidad": doc["_id"], "total": doc["total"]})
            
        # 2. Rutas habilitadas en total
        rutas_habilitadas = await db["rutas"].count_documents({
            "estado": "ACTIVA", 
            "estaActivo": True
        })
        
        # 2.1 Rutas con más empresas autorizadas (Top 10)
        rutas_empresas_cursor = db["rutas"].aggregate([
            {"$match": {"estado": "ACTIVA", "estaActivo": True}},
            {"$group": {
                "_id": "$nombre",
                "empresas_unicas": {"$addToSet": "$empresa.ruc"}
            }},
            {"$project": {
                "nombre": "$_id",
                "totalEmpresas": {"$size": "$empresas_unicas"}
            }},
            {"$sort": {"totalEmpresas": -1}},
            {"$limit": 10}
        ])
        rutas_con_mas_empresas = []
        async for doc in rutas_empresas_cursor:
            rutas_con_mas_empresas.append({
                "nombre": doc["nombre"] or "DESCONOCIDO", 
                "totalEmpresas": doc["totalEmpresas"]
            })
        
        # 3. Resoluciones primigenias autorizadas
        resoluciones_primigenias = await db["resoluciones_primigenias"].count_documents({
            "estado": "VIGENTE", 
            "esta_activo": True
        })
        
        # 4 & 5. Total de sustituciones e incrementos
        # Corrección: el modelo usa el enum TipoActoModificatorio en el campo "tipo_acto"
        total_sustituciones = await db["resoluciones_hijas"].count_documents({
            "tipo_acto": "SUSTITUCION_VEHICULAR",
            "esta_activo": True
        })
        
        total_incrementos = await db["resoluciones_hijas"].count_documents({
            "tipo_acto": "INCREMENTO_FLOTA",
            "esta_activo": True
        })
        
        # 6. Cantidad flotas habilitadas por empresas (Top 10)
        flotas_por_empresa_cursor = db["flota_empresa"].aggregate([
            {"$match": {"estado": "HABILITADO", "esta_activo": True}},
            {"$group": {
                "_id": "$ruc", 
                "razonSocial": {"$first": "$razon_social"},
                "total": {"$sum": 1}
            }},
            {"$sort": {"total": -1}},
            {"$limit": 10}
        ])
        
        flotas_por_empresa = []
        async for doc in flotas_por_empresa_cursor:
            flotas_por_empresa.append({
                "ruc": doc["_id"],
                "razonSocial": doc.get("razonSocial", "Desconocido"),
                "total": doc["total"]
            })
            
        # Total flota habilitada (general)
        total_flota_habilitada = await db["flota_empresa"].count_documents({
            "estado": "HABILITADO", 
            "esta_activo": True
        })
            
        return {
            "empresasPorModalidad": empresas_por_modalidad,
            "rutasHabilitadasTotal": rutas_habilitadas,
            "rutasConMasEmpresas": rutas_con_mas_empresas,
            "resolucionesPrimigeniasAutorizadas": resoluciones_primigenias,
            "totalSustituciones": total_sustituciones,
            "totalIncrementos": total_incrementos,
            "totalFlotaHabilitada": total_flota_habilitada,
            "topFlotasPorEmpresa": flotas_por_empresa
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener estadísticas del dashboard: {str(e)}")

@router.post("/generar-reporte")
async def generar_reporte_google_docs(db = Depends(get_database)):
    """
    Genera un reporte de Google Docs con las estadísticas actuales y lo sube al Drive configurado.
    """
    try:
        # Obtenemos las estadísticas reutilizando la lógica
        estadisticas = await get_dashboard_estadisticas(db)
        
        # Inicializamos el servicio y generamos el documento
        reporte_service = GoogleDocsReportService()
        url_documento = reporte_service.generar_reporte_estadistico(estadisticas)
        
        return {
            "success": True,
            "message": "Reporte generado y guardado en Google Drive exitosamente.",
            "url": url_documento
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al generar reporte: {str(e)}")
