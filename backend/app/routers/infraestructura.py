"""
Router de Infraestructura Complementaria
Endpoints para gestión de infraestructuras (Terminales Terrestres, Estaciones de Ruta, etc.)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Any, Union
from datetime import datetime
import logging

from app.dependencies.db import get_database
from app.dependencies.auth import get_current_user, get_current_user_optional
from app.services.infraestructura_service import InfraestructuraService
from app.schemas.infraestructura import (
    InfraestructuraCreate,
    InfraestructuraUpdate,
    InfraestructuraResponse,
    InfraestructuraListResponse,
    InfraestructuraEstadisticas,
    CambiarEstadoInfraestructura,
    FiltrosInfraestructura
)
from app.models.infraestructura import TipoInfraestructura, EstadoInfraestructura

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/infraestructura",
    tags=["Infraestructura Complementaria"]
)


def _get_user_id(current_user: Any) -> str:
    """Extrae el ID del usuario actual de manera segura"""
    if hasattr(current_user, "id") and current_user.id:
        return str(current_user.id)
    if isinstance(current_user, dict):
        return str(current_user.get("id") or current_user.get("_id") or "sistema")
    return str(current_user)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def crear_infraestructura(
    infraestructura: InfraestructuraCreate,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Crear nueva infraestructura complementaria
    """
    try:
        service = InfraestructuraService(db)
        usuario_id = _get_user_id(current_user)
        infraestructura_creada = await service.crear_infraestructura(
            infraestructura,
            usuario_id
        )
        resp = InfraestructuraResponse(**infraestructura_creada).model_dump(by_alias=True)
        return {"infraestructura": resp}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creando infraestructura: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor: {str(e)}"
        )


@router.get("/", response_model=InfraestructuraListResponse)
async def listar_infraestructuras(
    pagina: int = Query(0, ge=0, description="Número de página"),
    por_pagina: Optional[int] = Query(None, ge=1, le=1000, description="Elementos por página"),
    porPagina: Optional[int] = Query(None, ge=1, le=1000, description="Alias de elementos por página"),
    tipo_infraestructura: Optional[str] = Query(None, description="Tipo de infraestructura o separados por coma"),
    estado: Optional[str] = Query(None, description="Estado o separados por coma"),
    capacidad_minima: Optional[int] = Query(None, ge=0),
    capacidad_maxima: Optional[int] = Query(None, ge=0),
    score_riesgo_minimo: Optional[int] = Query(None, ge=0, le=100),
    score_riesgo_maximo: Optional[int] = Query(None, ge=0, le=100),
    busqueda: Optional[str] = Query(None, description="Búsqueda por RUC, razón social o dirección"),
    db=Depends(get_database),
    current_user=Depends(get_current_user_optional)
):
    """
    Listar infraestructuras con paginación y filtros
    """
    try:
        service = InfraestructuraService(db)
        limit = porPagina or por_pagina or 50

        # Procesar tipo_infraestructura (puede venir separado por comas)
        tipos_filtrados = None
        if tipo_infraestructura:
            tokens = [t.strip().upper() for t in tipo_infraestructura.split(",") if t.strip()]
            validos = []
            for t in tokens:
                try:
                    validos.append(TipoInfraestructura(t))
                except ValueError:
                    pass
            if validos:
                tipos_filtrados = validos

        # Procesar estado
        estados_filtrados = None
        if estado:
            tokens = [e.strip().upper() for e in estado.split(",") if e.strip()]
            validos = []
            for e in tokens:
                try:
                    validos.append(EstadoInfraestructura(e))
                except ValueError:
                    pass
            if validos:
                estados_filtrados = validos

        # Construir filtros
        filtros = FiltrosInfraestructura(
            tipo_infraestructura=tipos_filtrados,
            estado=estados_filtrados,
            capacidad_minima=capacidad_minima,
            capacidad_maxima=capacidad_maxima,
            score_riesgo_minimo=score_riesgo_minimo,
            score_riesgo_maximo=score_riesgo_maximo,
            texto_busqueda=busqueda
        )

        resultado = await service.listar_infraestructuras(pagina, limit, filtros)
        return resultado
    except Exception as e:
        logger.error(f"Error listando infraestructuras: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor: {str(e)}"
        )


@router.get("/estadisticas", response_model=InfraestructuraEstadisticas)
async def obtener_estadisticas(
    db=Depends(get_database),
    current_user=Depends(get_current_user_optional)
):
    """
    Obtener estadísticas generales de infraestructuras
    """
    try:
        service = InfraestructuraService(db)
        estadisticas = await service.obtener_estadisticas()
        return estadisticas
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


@router.get("/{infraestructura_id}")
async def obtener_infraestructura(
    infraestructura_id: str,
    db=Depends(get_database),
    current_user=Depends(get_current_user_optional)
):
    """
    Obtener infraestructura por ID
    """
    try:
        service = InfraestructuraService(db)
        infraestructura = await service.obtener_infraestructura(infraestructura_id)

        if not infraestructura:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Infraestructura no encontrada"
            )

        resp = InfraestructuraResponse(**infraestructura).model_dump(by_alias=True)
        return {"infraestructura": resp}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo infraestructura: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


@router.put("/{infraestructura_id}")
async def actualizar_infraestructura(
    infraestructura_id: str,
    infraestructura: InfraestructuraUpdate,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Actualizar infraestructura existente
    """
    try:
        service = InfraestructuraService(db)
        usuario_id = _get_user_id(current_user)
        infraestructura_actualizada = await service.actualizar_infraestructura(
            infraestructura_id,
            infraestructura,
            usuario_id
        )

        if not infraestructura_actualizada:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Infraestructura no encontrada"
            )

        resp = InfraestructuraResponse(**infraestructura_actualizada).model_dump(by_alias=True)
        return {"infraestructura": resp}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando infraestructura: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


@router.put("/{infraestructura_id}/cambiar-estado")
async def cambiar_estado_infraestructura(
    infraestructura_id: str,
    cambio_estado: CambiarEstadoInfraestructura,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Cambiar estado de infraestructura
    """
    try:
        service = InfraestructuraService(db)
        usuario_id = _get_user_id(current_user)
        infraestructura_actualizada = await service.cambiar_estado(
            infraestructura_id,
            cambio_estado,
            usuario_id
        )

        if not infraestructura_actualizada:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Infraestructura no encontrada"
            )

        resp = InfraestructuraResponse(**infraestructura_actualizada).model_dump(by_alias=True)
        return {"infraestructura": resp}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cambiando estado: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


@router.delete("/{infraestructura_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_infraestructura(
    infraestructura_id: str,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Eliminar infraestructura (soft delete)
    """
    try:
        service = InfraestructuraService(db)
        eliminada = await service.eliminar_infraestructura(infraestructura_id)

        if not eliminada:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Infraestructura no encontrada"
            )

        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando infraestructura: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


@router.post("/validar-ruc", response_model=dict)
async def validar_ruc(
    ruc: str = Query(..., min_length=11, max_length=11),
    db=Depends(get_database),
    current_user=Depends(get_current_user_optional)
):
    """
    Validar RUC con SUNAT
    """
    try:
        service = InfraestructuraService(db)
        datos_sunat = await service._validar_ruc_sunat(ruc)
        return datos_sunat.model_dump(by_alias=True)
    except Exception as e:
        logger.error(f"Error validando RUC: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error validando RUC con SUNAT"
        )


@router.get("/verificar-ruc/{ruc}", response_model=dict)
async def verificar_disponibilidad_ruc(
    ruc: str,
    db=Depends(get_database),
    current_user=Depends(get_current_user_optional)
):
    """
    Verificar si un RUC ya está registrado
    """
    try:
        service = InfraestructuraService(db)
        existe = await service.collection.find_one({"ruc": ruc})
        return {"disponible": existe is None}
    except Exception as e:
        logger.error(f"Error verificando RUC: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error verificando disponibilidad del RUC"
        )


@router.post("/seed-inicial")
async def seed_infraestructuras_iniciales(
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Siembra datos iniciales de terminales terrestres y estaciones de ruta de la región Puno
    si la colección está vacía.
    """
    try:
        service = InfraestructuraService(db)
        count = await service.collection.count_documents({})
        if count > 0:
            return {
                "success": True,
                "message": f"Ya existen {count} registros de infraestructura.",
                "total": count
            }

        terminales_seed = [
            {
                "ruc": "20147632191",
                "razon_social": {"principal": "Terminal Terrestre Interregional de Puno", "sunat": "TERMINAL TERRESTRE PUNO S.A."},
                "tipo_infraestructura": "TERMINAL_TERRESTRE",
                "direccion_fiscal": "Jr. Primero de Mayo 703, Barrio San Antonio, Puno",
                "estado": "AUTORIZADA",
                "esta_activo": True,
                "fecha_registro": datetime.now(),
                "fecha_actualizacion": datetime.now(),
                "representante_legal": {
                    "dni": "01234567",
                    "nombres": "Carlos Alberto",
                    "apellidos": "Mendoza Quispe",
                    "email": "cmendoza@terminalpuno.gob.pe",
                    "telefono": "951234567"
                },
                "email_contacto": "informes@terminalpuno.gob.pe",
                "telefono_contacto": "051-368420",
                "sitio_web": "https://terminalpuno.pe",
                "especificaciones": {
                    "capacidad_maxima": 3500,
                    "area_total": 12500.0,
                    "numero_andenes": 36,
                    "numero_plataformas": 12,
                    "servicios_disponibles": ["ENCOMIENDAS", "SALA_ESPERA", "RESTAURANTE", "CUSTODIA", "TOPICO_EMERGENCIA"]
                },
                "score_riesgo": 10,
                "datos_sunat": {"valido": True, "estado": "ACTIVO", "condicion": "HABIDO"}
            },
            {
                "ruc": "20165432987",
                "razon_social": {"principal": "Terminal Terrestre de Juliaca - San Román", "sunat": "TERMINAL TERRESTRE JULIACA S.A."},
                "tipo_infraestructura": "TERMINAL_TERRESTRE",
                "direccion_fiscal": "Av. Circunvalación Este Km 2.5, Juliaca",
                "estado": "AUTORIZADA",
                "esta_activo": True,
                "fecha_registro": datetime.now(),
                "fecha_actualizacion": datetime.now(),
                "representante_legal": {
                    "dni": "02345678",
                    "nombres": "Rosa Elena",
                    "apellidos": "Vargas Mamani",
                    "email": "rvargas@terminaljuliaca.pe",
                    "telefono": "952345678"
                },
                "email_contacto": "contacto@terminaljuliaca.pe",
                "telefono_contacto": "051-321150",
                "especificaciones": {
                    "capacidad_maxima": 5000,
                    "area_total": 18000.0,
                    "numero_andenes": 45,
                    "numero_plataformas": 15,
                    "servicios_disponibles": ["ENCOMIENDAS", "SALA_ESPERA", "FARMACIA", "HOTEL", "SEGURIDAD_24H"]
                },
                "score_riesgo": 15,
                "datos_sunat": {"valido": True, "estado": "ACTIVO", "condicion": "HABIDO"}
            },
            {
                "ruc": "20456789123",
                "razon_social": {"principal": "Estación de Ruta Central Ilave", "sunat": "ESTACION DE RUTA ILAVE E.I.R.L."},
                "tipo_infraestructura": "ESTACION_DE_RUTA",
                "direccion_fiscal": "Jr. Puno s/n con Carretera Panamericana Sur, Ilave",
                "estado": "AUTORIZADA",
                "esta_activo": True,
                "fecha_registro": datetime.now(),
                "fecha_actualizacion": datetime.now(),
                "representante_legal": {
                    "dni": "03456789",
                    "nombres": "Eusebio",
                    "apellidos": "Flores Condori",
                    "telefono": "953456789"
                },
                "telefono_contacto": "051-852140",
                "especificaciones": {
                    "capacidad_maxima": 800,
                    "area_total": 3500.0,
                    "numero_andenes": 12,
                    "numero_plataformas": 4,
                    "servicios_disponibles": ["SALA_ESPERA", "SERVICIOS_HIGIENICOS"]
                },
                "score_riesgo": 5,
                "datos_sunat": {"valido": True, "estado": "ACTIVO", "condicion": "HABIDO"}
            },
            {
                "ruc": "20567891234",
                "razon_social": {"principal": "Estación Interdistrital Ayaviri - Melgar", "sunat": "ESTACION AYAVIRI MELGAR S.R.L."},
                "tipo_infraestructura": "ESTACION_DE_RUTA",
                "direccion_fiscal": "Jr. Mariano Melgar 450, Ayaviri",
                "estado": "AUTORIZADA",
                "esta_activo": True,
                "fecha_registro": datetime.now(),
                "fecha_actualizacion": datetime.now(),
                "representante_legal": {
                    "dni": "04567891",
                    "nombres": "Pedro",
                    "apellidos": "Apaza Ramos",
                    "telefono": "954567891"
                },
                "especificaciones": {
                    "capacidad_maxima": 600,
                    "area_total": 2800.0,
                    "numero_andenes": 8,
                    "numero_plataformas": 3,
                    "servicios_disponibles": ["SALA_ESPERA", "ENCOMIENDAS"]
                },
                "score_riesgo": 10,
                "datos_sunat": {"valido": True, "estado": "ACTIVO", "condicion": "HABIDO"}
            },
            {
                "ruc": "20389123456",
                "razon_social": {"principal": "Terminal Terrestre Internacional Yunguyo", "sunat": "TERMINAL YUNGUYO FRONTERA S.A."},
                "tipo_infraestructura": "TERMINAL_TERRESTRE",
                "direccion_fiscal": "Av. Panamericana Sur s/n, Yunguyo",
                "estado": "EN_TRAMITE",
                "esta_activo": True,
                "fecha_registro": datetime.now(),
                "fecha_actualizacion": datetime.now(),
                "representante_legal": {
                    "dni": "05678912",
                    "nombres": "Walter",
                    "apellidos": "Chura Laura",
                    "telefono": "955678912"
                },
                "especificaciones": {
                    "capacidad_maxima": 1200,
                    "area_total": 5200.0,
                    "numero_andenes": 15,
                    "numero_plataformas": 5,
                    "servicios_disponibles": ["CAMBIO_MONEDA", "SALA_ESPERA", "CONTROL_MIGRATORIO"]
                },
                "score_riesgo": 20,
                "datos_sunat": {"valido": True, "estado": "ACTIVO", "condicion": "HABIDO"}
            }
        ]

        result = await service.collection.insert_many(terminales_seed)
        return {
            "success": True,
            "message": f"Se sembraron {len(result.inserted_ids)} infraestructuras iniciales en Puno.",
            "total": len(result.inserted_ids)
        }
    except Exception as e:
        logger.error(f"Error sembrando datos iniciales de infraestructura: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sembrando datos: {str(e)}"
        )
