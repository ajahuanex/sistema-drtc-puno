from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from app.models.infraccion import (
    Infraccion, InfraccionCreate, InfraccionUpdate, InfraccionResponse,
    Fiscalizacion, FiscalizacionCreate, FiscalizacionUpdate, FiscalizacionResponse,
    FiscalizacionFiltros, FiscalizacionEstadisticas
)

from app.dependencies.auth import get_current_user
# from app.dependencies.db import get_database
# from app.services.infraccion_service import InfraccionService  # NO EXISTE AÚN

router = APIRouter(prefix="/infracciones", tags=["Infracciones"])

# Mock service para infracciones
mock_infracciones = [
    {
        "id": "1",
        "codigo": "I-001",
        "descripcion": "Exceso de velocidad en zona urbana",
        "tipo": "EXCESO_VELOCIDAD",
        "montoMulta": 500.00,
        "puntosPenalizacion": 10,
        "normativa": "Decreto Supremo N° 017-2009-MTC",
        "articulo": "Artículo 198",
        "inciso": "a)",
        "estaActivo": True,
        "fechaCreacion": "2025-01-01T00:00:00Z",
        "fechaActualizacion": None
    },
    {
        "id": "2",
        "codigo": "I-002",
        "descripcion": "Exceso de pasajeros",
        "tipo": "EXCESO_PASAJEROS",
        "montoMulta": 800.00,
        "puntosPenalizacion": 15,
        "normativa": "Decreto Supremo N° 017-2009-MTC",
        "articulo": "Artículo 199",
        "inciso": "b)",
        "estaActivo": True,
        "fechaCreacion": "2025-01-01T00:00:00Z",
        "fechaActualizacion": None
    },
    {
        "id": "3",
        "codigo": "I-003",
        "descripcion": "Documentación vencida",
        "tipo": "DOCUMENTACION_VENCIDA",
        "montoMulta": 300.00,
        "puntosPenalizacion": 5,
        "normativa": "Decreto Supremo N° 017-2009-MTC",
        "articulo": "Artículo 200",
        "inciso": "c)",
        "estaActivo": True,
        "fechaCreacion": "2025-01-01T00:00:00Z",
        "fechaActualizacion": None
    }
]

# Mock service para fiscalizaciones
mock_fiscalizaciones = [
    {
        "id": "1",
        "fechaHora": "2025-01-15T10:30:00Z",
        "inspector": {
            "id": "1",
            "dni": "40123456",
            "nombres": "Juan Carlos",
            "apellidos": "Perez Quispe",
            "cargo": "Inspector de Tránsito",
            "area": "Fiscalización"
        },
        "vehiculoInspeccionado": {
            "id": "1",
            "placa": "ABC-123",
            "empresaId": "1",
            "empresaNombre": "Transportes El Veloz S.A.C."
        },
        "resultado": "CON_INFRACCION",
        "papeleta": {
            "nroPapeleta": "P-001-2025",
            "infraccionesIds": ["1"],
            "montoTotal": 500.00,
            "estado": "EMITIDA",
            "fechaEmision": "2025-01-15T10:30:00Z"
        },
        "estaActivo": True,
        "fechaCreacion": "2025-01-15T10:30:00Z"
    }
]

@router.get("/", response_model=List[InfraccionResponse])
async def listar_infracciones(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo de infracción"),
    esta_activo: Optional[bool] = Query(None, description="Filtrar por estado activo")
):
    """Lista todas las infracciones con filtros opcionales"""
    try:
        # Aplicar filtros
        filtered_infracciones = mock_infracciones
        
        if tipo:
            filtered_infracciones = [i for i in filtered_infracciones if i["tipo"] == tipo]
        
        if esta_activo is not None:
            filtered_infracciones = [i for i in filtered_infracciones if i["estaActivo"] == esta_activo]
        
        # Aplicar paginación
        paginated_infracciones = filtered_infracciones[skip:skip + limit]
        
        return [InfraccionResponse(**infraccion) for infraccion in paginated_infracciones]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar infracciones: {str(e)}"
        )

@router.get("/{infraccion_id}", response_model=InfraccionResponse)
async def obtener_infraccion(infraccion_id: str):
    """Obtiene una infracción específica por ID"""
    try:
        infraccion = next((i for i in mock_infracciones if i["id"] == infraccion_id), None)
        
        if not infraccion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Infracción no encontrada"
            )
        
        return InfraccionResponse(**infraccion)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener infracción: {str(e)}"
        )

@router.post("/", response_model=InfraccionResponse, status_code=status.HTTP_201_CREATED)
async def crear_infraccion(infraccion: InfraccionCreate):
    """Crea una nueva infracción"""
    try:
        nueva_infraccion = {
            "id": str(len(mock_infracciones) + 1),
            **infraccion.dict(),
            "estaActivo": True,
            "fechaCreacion": datetime.utcnow().isoformat(),
            "fechaActualizacion": None
        }
        
        mock_infracciones.append(nueva_infraccion)
        
        return InfraccionResponse(**nueva_infraccion)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear infracción: {str(e)}"
        )

@router.put("/{infraccion_id}", response_model=InfraccionResponse)
async def actualizar_infraccion(infraccion_id: str, infraccion_update: InfraccionUpdate):
    """Actualiza una infracción existente"""
    try:
        infraccion_index = next((i for i, inf in enumerate(mock_infracciones) if inf["id"] == infraccion_id), None)
        
        if infraccion_index is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Infracción no encontrada"
            )
        
        # Actualizar solo los campos proporcionados
        update_data = infraccion_update.dict(exclude_unset=True)
        mock_infracciones[infraccion_index].update(update_data)
        mock_infracciones[infraccion_index]["fechaActualizacion"] = datetime.utcnow().isoformat()
        
        return InfraccionResponse(**mock_infracciones[infraccion_index])
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar infracción: {str(e)}"
        )

@router.delete("/{infraccion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_infraccion(infraccion_id: str):
    """Elimina lógicamente una infracción (borrado lógico)"""
    try:
        infraccion_index = next((i for i, inf in enumerate(mock_infracciones) if inf["id"] == infraccion_id), None)
        
        if infraccion_index is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Infracción no encontrada"
            )
        
        # Borrado lógico
        mock_infracciones[infraccion_index]["estaActivo"] = False
        mock_infracciones[infraccion_index]["fechaActualizacion"] = datetime.utcnow().isoformat()
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar infracción: {str(e)}"
        )

# Endpoints para Fiscalizaciones

@router.get("/fiscalizaciones/", response_model=List[FiscalizacionResponse])
async def listar_fiscalizaciones(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    resultado: Optional[str] = Query(None, description="Filtrar por resultado de fiscalización"),
    estado_papeleta: Optional[str] = Query(None, description="Filtrar por estado de papeleta"),
    fecha_desde: Optional[datetime] = Query(None, description="Filtrar desde fecha"),
    fecha_hasta: Optional[datetime] = Query(None, description="Filtrar hasta fecha")
):
    """Lista todas las fiscalizaciones con filtros opcionales"""
    try:
        # Aplicar filtros
        filtered_fiscalizaciones = mock_fiscalizaciones
        
        if resultado:
            filtered_fiscalizaciones = [f for f in filtered_fiscalizaciones if f["resultado"] == resultado]
        
        if estado_papeleta and any(f.get("papeleta") for f in filtered_fiscalizaciones):
            filtered_fiscalizaciones = [
                f for f in filtered_fiscalizaciones 
                if f.get("papeleta") and f["papeleta"]["estado"] == estado_papeleta
            ]
        
        # Aplicar paginación
        paginated_fiscalizaciones = filtered_fiscalizaciones[skip:skip + limit]
        
        return [FiscalizacionResponse(**fiscalizacion) for fiscalizacion in paginated_fiscalizaciones]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar fiscalizaciones: {str(e)}"
        )

@router.get("/fiscalizaciones/{fiscalizacion_id}", response_model=FiscalizacionResponse)
async def obtener_fiscalizacion(fiscalizacion_id: str):
    """Obtiene una fiscalización específica por ID"""
    try:
        fiscalizacion = next((f for f in mock_fiscalizaciones if f["id"] == fiscalizacion_id), None)
        
        if not fiscalizacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fiscalización no encontrada"
            )
        
        return FiscalizacionResponse(**fiscalizacion)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener fiscalización: {str(e)}"
        )

@router.post("/fiscalizaciones/", response_model=FiscalizacionResponse, status_code=status.HTTP_201_CREATED)
async def crear_fiscalizacion(fiscalizacion: FiscalizacionCreate):
    """Crea una nueva fiscalización"""
    try:
        nueva_fiscalizacion = {
            "id": str(len(mock_fiscalizaciones) + 1),
            **fiscalizacion.dict(),
            "estaActivo": True,
            "fechaCreacion": datetime.utcnow().isoformat(),
            "fechaActualizacion": None
        }
        
        mock_fiscalizaciones.append(nueva_fiscalizacion)
        
        return FiscalizacionResponse(**nueva_fiscalizacion)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear fiscalización: {str(e)}"
        )

@router.put("/fiscalizaciones/{fiscalizacion_id}", response_model=FiscalizacionResponse)
async def actualizar_fiscalizacion(fiscalizacion_id: str, fiscalizacion_update: FiscalizacionUpdate):
    """Actualiza una fiscalización existente"""
    try:
        fiscalizacion_index = next((i for i, f in enumerate(mock_fiscalizaciones) if f["id"] == fiscalizacion_id), None)
        
        if fiscalizacion_index is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fiscalización no encontrada"
            )
        
        # Actualizar solo los campos proporcionados
        update_data = fiscalizacion_update.dict(exclude_unset=True)
        mock_fiscalizaciones[fiscalizacion_index].update(update_data)
        mock_fiscalizaciones[fiscalizacion_index]["fechaActualizacion"] = datetime.utcnow().isoformat()
        
        return FiscalizacionResponse(**mock_fiscalizaciones[fiscalizacion_index])
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar fiscalización: {str(e)}"
        )

@router.get("/fiscalizaciones/estadisticas/", response_model=FiscalizacionEstadisticas)
async def obtener_estadisticas_fiscalizaciones():
    """Obtiene estadísticas de las fiscalizaciones"""
    try:
        total = len(mock_fiscalizaciones)
        con_infraccion = len([f for f in mock_fiscalizaciones if f["resultado"] == "CON_INFRACCION"])
        sin_infraccion = len([f for f in mock_fiscalizaciones if f["resultado"] == "SIN_INFRACCION"])
        
        papeletas_emitidas = len([f for f in mock_fiscalizaciones if f.get("papeleta")])
        monto_total = sum(f["papeleta"]["montoTotal"] for f in mock_fiscalizaciones if f.get("papeleta"))
        
        return FiscalizacionEstadisticas(
            totalFiscalizaciones=total,
            conInfraccion=con_infraccion,
            sinInfraccion=sin_infraccion,
            advertencias=0,
            papeletasEmitidas=papeletas_emitidas,
            papeletasPagadas=0,
            papeletasImpugnadas=0,
            montoTotalMultas=monto_total,
            montoTotalPagado=0,
            montoTotalPendiente=monto_total
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas: {str(e)}"
        ) 