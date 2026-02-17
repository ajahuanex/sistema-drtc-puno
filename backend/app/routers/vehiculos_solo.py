"""
Router para VehiculoSolo
Endpoints para gestión de datos vehiculares puros

@author Sistema DRTC
@version 1.0.0
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from app.dependencies.db import get_db
from app.models.vehiculo_solo import (
    VehiculoSolo, HistorialPlaca, PropietarioRegistral,
    InspeccionTecnica, SeguroVehicular, DocumentoVehicular
)
from app.schemas.vehiculo_solo import (
    VehiculoSolo as VehiculoSoloSchema,
    VehiculoSoloCreate,
    VehiculoSoloUpdate,
    VehiculoSoloDetallado,
    VehiculoSoloResponse,
    HistorialPlacaCreate,
    HistorialPlaca as HistorialPlacaSchema,
    PropietarioRegistralCreate,
    PropietarioRegistral as PropietarioRegistralSchema,
    InspeccionTecnicaCreate,
    InspeccionTecnica as InspeccionTecnicaSchema,
    SeguroVehicularCreate,
    SeguroVehicular as SeguroVehicularSchema,
    DocumentoVehicularCreate,
    DocumentoVehicular as DocumentoVehicularSchema,
    FiltrosVehiculoSolo,
    ConsultaSUNARP,
    RespuestaSUNARP,
    ConsultaSUTRAN,
    RespuestaSUTRAN,
    EstadisticasVehiculoSolo
)
from app.dependencies.auth import get_current_user

router = APIRouter(
    prefix="/vehiculos-solo",
    tags=["Vehículos Solo"]
)


# ========================================
# CRUD BÁSICO - VEHICULO SOLO
# ========================================

@router.get("", response_model=VehiculoSoloResponse)
async def obtener_vehiculos_solo(
    placa: Optional[str] = None,
    vin: Optional[str] = None,
    marca: Optional[str] = None,
    modelo: Optional[str] = None,
    categoria: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener lista de vehículos con filtros
    """
    query = db.query(VehiculoSolo)

    # Aplicar filtros
    if placa:
        query = query.filter(VehiculoSolo.placa_actual.ilike(f"%{placa}%"))
    if vin:
        query = query.filter(VehiculoSolo.vin.ilike(f"%{vin}%"))
    if marca:
        query = query.filter(VehiculoSolo.marca.ilike(f"%{marca}%"))
    if modelo:
        query = query.filter(VehiculoSolo.modelo.ilike(f"%{modelo}%"))
    if categoria:
        query = query.filter(VehiculoSolo.categoria == categoria)

    # Contar total
    total = query.count()

    # Paginación
    offset = (page - 1) * limit
    vehiculos = query.offset(offset).limit(limit).all()

    # Calcular total de páginas
    total_pages = (total + limit - 1) // limit

    return {
        "vehiculos": vehiculos,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }


@router.get("/{vehiculo_id}/detallado", response_model=VehiculoSoloDetallado)
async def obtener_vehiculo_detallado(
    vehiculo_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener vehículo con todos sus detalles (placas, propietarios, inspecciones, etc.)
    """
    vehiculo = db.query(VehiculoSolo).filter(VehiculoSolo.id == vehiculo_id).first()
    
    if not vehiculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )
    
    return vehiculo


@router.get("/placa/{placa}", response_model=VehiculoSoloSchema)
async def buscar_por_placa(
    placa: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Buscar vehículo por placa
    """
    vehiculo = db.query(VehiculoSolo).filter(
        VehiculoSolo.placa_actual == placa.upper()
    ).first()
    
    if not vehiculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehículo con placa {placa} no encontrado"
        )
    
    return vehiculo


@router.get("/vin/{vin}", response_model=VehiculoSoloSchema)
async def buscar_por_vin(
    vin: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Buscar vehículo por VIN
    """
    vehiculo = db.query(VehiculoSolo).filter(
        VehiculoSolo.vin == vin.upper()
    ).first()
    
    if not vehiculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehículo con VIN {vin} no encontrado"
        )
    
    return vehiculo


@router.post("", response_model=VehiculoSoloSchema, status_code=status.HTTP_201_CREATED)
async def crear_vehiculo_solo(
    vehiculo_data: VehiculoSoloCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Crear nuevo vehículo
    """
    # Verificar que no exista la placa
    existe_placa = db.query(VehiculoSolo).filter(
        VehiculoSolo.placa_actual == vehiculo_data.placa_actual.upper()
    ).first()
    
    if existe_placa:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un vehículo con la placa {vehiculo_data.placa_actual}"
        )
    
    # Verificar que no exista el VIN
    existe_vin = db.query(VehiculoSolo).filter(
        VehiculoSolo.vin == vehiculo_data.vin.upper()
    ).first()
    
    if existe_vin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un vehículo con el VIN {vehiculo_data.vin}"
        )
    
    # Crear vehículo
    nuevo_vehiculo = VehiculoSolo(
        id=str(uuid.uuid4()),
        **vehiculo_data.dict(),
        creado_por=current_user.get("sub", "sistema"),
        actualizado_por=current_user.get("sub", "sistema")
    )
    
    db.add(nuevo_vehiculo)
    db.commit()
    db.refresh(nuevo_vehiculo)
    
    return nuevo_vehiculo


@router.put("/{vehiculo_id}", response_model=VehiculoSoloSchema)
async def actualizar_vehiculo_solo(
    vehiculo_id: str,
    vehiculo_data: VehiculoSoloUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Actualizar vehículo
    """
    vehiculo = db.query(VehiculoSolo).filter(VehiculoSolo.id == vehiculo_id).first()
    
    if not vehiculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )
    
    # Actualizar campos
    update_data = vehiculo_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vehiculo, field, value)
    
    vehiculo.actualizado_por = current_user.get("sub", "sistema")
    vehiculo.fecha_actualizacion = datetime.utcnow()
    
    db.commit()
    db.refresh(vehiculo)
    
    return vehiculo


@router.delete("/{vehiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_vehiculo_solo(
    vehiculo_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Eliminar vehículo
    """
    vehiculo = db.query(VehiculoSolo).filter(VehiculoSolo.id == vehiculo_id).first()
    
    if not vehiculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )
    
    db.delete(vehiculo)
    db.commit()
    
    return None



# ========================================
# HISTORIAL DE PLACAS
# ========================================

@router.get("/{vehiculo_id}/placas", response_model=List[HistorialPlacaSchema])
async def obtener_historial_placas(
    vehiculo_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener historial de placas de un vehículo
    """
    historial = db.query(HistorialPlaca).filter(
        HistorialPlaca.vehiculo_solo_id == vehiculo_id
    ).order_by(HistorialPlaca.fecha_cambio.desc()).all()
    
    return historial


@router.post("/{vehiculo_id}/placas", response_model=HistorialPlacaSchema, status_code=status.HTTP_201_CREATED)
async def registrar_cambio_placa(
    vehiculo_id: str,
    placa_data: HistorialPlacaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Registrar cambio de placa
    """
    # Verificar que el vehículo existe
    vehiculo = db.query(VehiculoSolo).filter(VehiculoSolo.id == vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )
    
    # Crear registro
    nuevo_cambio = HistorialPlaca(
        id=str(uuid.uuid4()),
        **placa_data.dict(),
        registrado_por=current_user.get("sub", "sistema")
    )
    
    # Actualizar placa actual del vehículo
    vehiculo.placa_actual = placa_data.placa_nueva
    vehiculo.actualizado_por = current_user.get("sub", "sistema")
    
    db.add(nuevo_cambio)
    db.commit()
    db.refresh(nuevo_cambio)
    
    return nuevo_cambio


# ========================================
# PROPIETARIOS REGISTRALES
# ========================================

@router.get("/{vehiculo_id}/propietarios", response_model=List[PropietarioRegistralSchema])
async def obtener_propietarios(
    vehiculo_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener propietarios registrales de un vehículo
    """
    propietarios = db.query(PropietarioRegistral).filter(
        PropietarioRegistral.vehiculo_solo_id == vehiculo_id
    ).order_by(PropietarioRegistral.fecha_adquisicion.desc()).all()
    
    return propietarios


@router.post("/{vehiculo_id}/propietarios", response_model=PropietarioRegistralSchema, status_code=status.HTTP_201_CREATED)
async def registrar_propietario(
    vehiculo_id: str,
    propietario_data: PropietarioRegistralCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Registrar propietario registral
    """
    # Verificar que el vehículo existe
    vehiculo = db.query(VehiculoSolo).filter(VehiculoSolo.id == vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )
    
    # Si es propietario actual, desmarcar los demás
    if propietario_data.es_propietario_actual:
        db.query(PropietarioRegistral).filter(
            PropietarioRegistral.vehiculo_solo_id == vehiculo_id,
            PropietarioRegistral.es_propietario_actual == True
        ).update({"es_propietario_actual": False})
    
    # Crear registro
    nuevo_propietario = PropietarioRegistral(
        id=str(uuid.uuid4()),
        **propietario_data.dict()
    )
    
    db.add(nuevo_propietario)
    db.commit()
    db.refresh(nuevo_propietario)
    
    return nuevo_propietario


# ========================================
# INSPECCIONES TÉCNICAS
# ========================================

@router.get("/{vehiculo_id}/inspecciones", response_model=List[InspeccionTecnicaSchema])
async def obtener_inspecciones(
    vehiculo_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener inspecciones técnicas de un vehículo
    """
    inspecciones = db.query(InspeccionTecnica).filter(
        InspeccionTecnica.vehiculo_solo_id == vehiculo_id
    ).order_by(InspeccionTecnica.fecha_inspeccion.desc()).all()
    
    return inspecciones


@router.post("/{vehiculo_id}/inspecciones", response_model=InspeccionTecnicaSchema, status_code=status.HTTP_201_CREATED)
async def registrar_inspeccion(
    vehiculo_id: str,
    inspeccion_data: InspeccionTecnicaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Registrar inspección técnica
    """
    # Verificar que el vehículo existe
    vehiculo = db.query(VehiculoSolo).filter(VehiculoSolo.id == vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )
    
    # Crear registro
    nueva_inspeccion = InspeccionTecnica(
        id=str(uuid.uuid4()),
        **inspeccion_data.dict(),
        registrado_por=current_user.get("sub", "sistema")
    )
    
    db.add(nueva_inspeccion)
    db.commit()
    db.refresh(nueva_inspeccion)
    
    return nueva_inspeccion


# ========================================
# SEGUROS
# ========================================

@router.get("/{vehiculo_id}/seguros", response_model=List[SeguroVehicularSchema])
async def obtener_seguros(
    vehiculo_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener seguros de un vehículo
    """
    seguros = db.query(SeguroVehicular).filter(
        SeguroVehicular.vehiculo_solo_id == vehiculo_id
    ).order_by(SeguroVehicular.fecha_inicio.desc()).all()
    
    return seguros


@router.post("/{vehiculo_id}/seguros", response_model=SeguroVehicularSchema, status_code=status.HTTP_201_CREATED)
async def registrar_seguro(
    vehiculo_id: str,
    seguro_data: SeguroVehicularCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Registrar seguro vehicular
    """
    # Verificar que el vehículo existe
    vehiculo = db.query(VehiculoSolo).filter(VehiculoSolo.id == vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )
    
    # Crear registro
    nuevo_seguro = SeguroVehicular(
        id=str(uuid.uuid4()),
        **seguro_data.dict(),
        registrado_por=current_user.get("sub", "sistema")
    )
    
    db.add(nuevo_seguro)
    db.commit()
    db.refresh(nuevo_seguro)
    
    return nuevo_seguro


# ========================================
# DOCUMENTOS
# ========================================

@router.get("/{vehiculo_id}/documentos", response_model=List[DocumentoVehicularSchema])
async def obtener_documentos(
    vehiculo_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener documentos de un vehículo
    """
    documentos = db.query(DocumentoVehicular).filter(
        DocumentoVehicular.vehiculo_solo_id == vehiculo_id
    ).order_by(DocumentoVehicular.fecha_emision.desc()).all()
    
    return documentos


@router.post("/{vehiculo_id}/documentos", response_model=DocumentoVehicularSchema, status_code=status.HTTP_201_CREATED)
async def registrar_documento(
    vehiculo_id: str,
    documento_data: DocumentoVehicularCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Registrar documento vehicular
    """
    # Verificar que el vehículo existe
    vehiculo = db.query(VehiculoSolo).filter(VehiculoSolo.id == vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )
    
    # Crear registro
    nuevo_documento = DocumentoVehicular(
        id=str(uuid.uuid4()),
        **documento_data.dict(),
        registrado_por=current_user.get("sub", "sistema")
    )
    
    db.add(nuevo_documento)
    db.commit()
    db.refresh(nuevo_documento)
    
    return nuevo_documento


# ========================================
# INTEGRACIÓN CON APIs EXTERNAS
# ========================================

@router.post("/consultar/sunarp", response_model=RespuestaSUNARP)
async def consultar_sunarp(
    consulta: ConsultaSUNARP,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Consultar datos en SUNARP
    TODO: Implementar integración real con API SUNARP
    """
    # Por ahora retorna respuesta simulada
    return {
        "exito": False,
        "mensaje": "Integración con SUNARP en desarrollo",
        "datos": None,
        "fecha_consulta": datetime.utcnow()
    }


@router.post("/consultar/sutran", response_model=RespuestaSUTRAN)
async def consultar_sutran(
    consulta: ConsultaSUTRAN,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Consultar datos en SUTRAN
    TODO: Implementar integración real con API SUTRAN
    """
    # Por ahora retorna respuesta simulada
    return {
        "exito": False,
        "mensaje": "Integración con SUTRAN en desarrollo",
        "datos": None,
        "fecha_consulta": datetime.utcnow()
    }


@router.post("/{vehiculo_id}/actualizar-sunarp", response_model=VehiculoSoloSchema)
async def actualizar_desde_sunarp(
    vehiculo_id: str,
    placa: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Actualizar vehículo desde SUNARP
    TODO: Implementar integración real
    """
    vehiculo = db.query(VehiculoSolo).filter(VehiculoSolo.id == vehiculo_id).first()
    
    if not vehiculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )
    
    # TODO: Consultar SUNARP y actualizar datos
    vehiculo.ultima_actualizacion_externa = datetime.utcnow()
    vehiculo.fuente_datos = "SUNARP"
    
    db.commit()
    db.refresh(vehiculo)
    
    return vehiculo


# ========================================
# ESTADÍSTICAS
# ========================================

@router.get("/estadisticas", response_model=EstadisticasVehiculoSolo)
async def obtener_estadisticas(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener estadísticas generales
    TODO: Implementar cálculos reales
    """
    total_vehiculos = db.query(VehiculoSolo).count()
    
    return {
        "total_vehiculos": total_vehiculos,
        "vehiculos_por_categoria": {},
        "vehiculos_por_marca": [],
        "vehiculos_por_anio": [],
        "vehiculos_por_estado_fisico": {},
        "vehiculos_con_inspeccion_vigente": 0,
        "vehiculos_con_soat_vigente": 0,
        "promedio_kilometraje": 0.0,
        "promedio_edad": 0.0
    }
