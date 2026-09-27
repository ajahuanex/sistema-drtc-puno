"""
Router del Módulo Inicializador de Datos (Data Onboarding Hub)
Orquesta la importación y sincronización de las 5 bases maestras de DRTC Puno:
1. DB_EMPRESAS
2. DB_RESOLUCIONES (Primigenias)
3. DB_RUTAS
4. DB_VEHICULOS (vehiculos-data)
5. DB_MATRIZ (flota_empresa)
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

from app.dependencies.db import get_database
from app.services.inicializador_service import InicializadorService

logger = logging.getLogger("inicializador_router")

router = APIRouter(prefix="/inicializador", tags=["Inicializador de Datos"])


@router.get("/estado", summary="Consultar estado de las 5 etapas del inicializador")
async def obtener_estado(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Retorna el conteo de documentos en cada una de las 5 colecciones maestras y sus URLs oficiales."""
    try:
        service = InicializadorService(db)
        return await service.obtener_estado_sistema()
    except Exception as e:
        logger.error(f"Error en /inicializador/estado: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/preview", summary="Previsualizar datos desde URL de Google Sheets o Archivo")
async def previsualizar_etapa(
    payload: Dict[str, Any] = Body(...),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Genera una vista previa validando columnas y extrayendo 5 filas de muestra.
    Espera JSON: {"etapa": "empresas"|"resoluciones"|"rutas"|"vehiculos"|"matriz", "url": "https://docs.google.com/..."}
    """
    etapa = payload.get("etapa", "").strip().lower()
    url = payload.get("url", "").strip()

    if not etapa:
        raise HTTPException(status_code=400, detail="El campo 'etapa' es obligatorio.")
    if not url:
        url = InicializadorService.DEFAULT_URLS.get(etapa, "")
    if not url:
        raise HTTPException(status_code=400, detail=f"No se encontró URL por defecto para la etapa '{etapa}'. Proporcione 'url'.")

    try:
        service = InicializadorService(db)
        resultado = await service.previsualizar_hoja(etapa=etapa, url=url)
        return resultado
    except Exception as e:
        logger.error(f"Error en previsualización de {etapa}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/preview-file", summary="Previsualizar datos desde archivo Excel/CSV subido")
async def previsualizar_archivo(
    etapa: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Previsualiza un archivo subido localmente."""
    try:
        content = await file.read()
        is_csv = file.filename.lower().endswith(".csv")
        service = InicializadorService(db)
        resultado = await service.previsualizar_hoja(
            etapa=etapa.strip().lower(),
            file_content=content,
            is_csv=is_csv
        )
        return resultado
    except Exception as e:
        logger.error(f"Error en previsualización de archivo para {etapa}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/ejecutar", summary="Ejecutar ingesta de una etapa desde URL de Google Sheets")
async def ejecutar_etapa(
    payload: Dict[str, Any] = Body(...),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Ejecuta la migración de una etapa específica procesando la URL de Google Sheets.
    Espera JSON: {"etapa": "empresas"|"resoluciones"|"rutas"|"vehiculos"|"matriz", "url": "https://docs.google.com/..."}
    """
    etapa = payload.get("etapa", "").strip().lower()
    url = payload.get("url", "").strip()

    if not etapa:
        raise HTTPException(status_code=400, detail="El campo 'etapa' es obligatorio.")
    if not url:
        url = InicializadorService.DEFAULT_URLS.get(etapa, "")
    if not url:
        raise HTTPException(status_code=400, detail=f"No se encontró URL por defecto para la etapa '{etapa}'. Proporcione 'url'.")

    try:
        service = InicializadorService(db)
        resultado = await service.ejecutar_ingesta(etapa=etapa, url=url)
        return resultado
    except Exception as e:
        logger.error(f"Error en ejecución de ingesta {etapa}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ejecutar-file", summary="Ejecutar ingesta desde un archivo subido")
async def ejecutar_archivo(
    etapa: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Ejecuta la importación a partir de un archivo subido localmente (.xlsx, .xls o .csv)."""
    try:
        content = await file.read()
        is_csv = file.filename.lower().endswith(".csv")
        service = InicializadorService(db)
        resultado = await service.ejecutar_ingesta(
            etapa=etapa.strip().lower(),
            file_content=content,
            is_csv=is_csv
        )
        return resultado
    except Exception as e:
        logger.error(f"Error ejecutando archivo para {etapa}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
