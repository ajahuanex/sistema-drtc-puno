from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import List, Optional
from datetime import datetime, date
from app.dependencies.auth import get_current_active_user
from app.services.mock_conductor_service import MockConductorService
from app.models.conductor import (
    ConductorCreate, 
    ConductorUpdate, 
    ConductorInDB, 
    ConductorResponse,
    ConductorFiltros,
    EstadoConductor,
    EstadoLicencia
)
from app.utils.exceptions import (
    ConductorNotFoundException, 
    ConductorAlreadyExistsException,
    ValidationErrorException
)

router = APIRouter(prefix="/conductores", tags=["conductores"])

def build_conductor_response(conductor) -> ConductorResponse:
    """Función helper para construir ConductorResponse con todos los campos requeridos"""
    return ConductorResponse(
        id=conductor.id,
        dni=conductor.dni,
        apellidoPaterno=conductor.apellidoPaterno,
        apellidoMaterno=conductor.apellidoMaterno,
        nombres=conductor.nombres,
        nombreCompleto=f"{conductor.apellidoPaterno} {conductor.apellidoMaterno}, {conductor.nombres}",
        fechaNacimiento=conductor.fechaNacimiento,
        genero=conductor.genero,
        estadoCivil=conductor.estadoCivil,
        direccion=conductor.direccion,
        distrito=conductor.distrito,
        provincia=conductor.provincia,
        departamento=conductor.departamento,
        telefono=conductor.telefono,
        celular=conductor.celular,
        email=conductor.email,
        numeroLicencia=conductor.numeroLicencia,
        categoriaLicencia=conductor.categoriaLicencia,
        fechaEmisionLicencia=conductor.fechaEmisionLicencia,
        fechaVencimientoLicencia=conductor.fechaVencimientoLicencia,
        estadoLicencia=conductor.estadoLicencia,
        entidadEmisora=conductor.entidadEmisora,
        empresaId=conductor.empresaId,
        fechaIngreso=conductor.fechaIngreso,
        cargo=conductor.cargo,
        estado=conductor.estado,
        estaActivo=conductor.estaActivo,
        experienciaAnos=conductor.experienciaAnos,
        tipoSangre=conductor.tipoSangre,
        restricciones=conductor.restricciones,
        observaciones=conductor.observaciones,
        documentosIds=conductor.documentosIds,
        fotoPerfil=conductor.fotoPerfil,
        fechaRegistro=conductor.fechaRegistro,
        fechaActualizacion=conductor.fechaActualizacion,
        fechaUltimaVerificacion=conductor.fechaUltimaVerificacion,
        usuarioRegistroId=conductor.usuarioRegistroId,
        usuarioActualizacionId=conductor.usuarioActualizacionId
    )

@router.post("/", response_model=ConductorResponse, status_code=201)
async def create_conductor(
    conductor_data: ConductorCreate
) -> ConductorResponse:
    """Crear nuevo conductor"""
    # Guard clauses al inicio
    if not conductor_data.dni.strip():
        raise ValidationErrorException("DNI", "El DNI no puede estar vacío")
    
    if not conductor_data.numeroLicencia.strip():
        raise ValidationErrorException("Número de Licencia", "El número de licencia no puede estar vacío")
    
    conductor_service = MockConductorService()
    
    try:
        conductor = await conductor_service.create_conductor(conductor_data)
        return build_conductor_response(conductor)
    except ValueError as e:
        if "DNI" in str(e):
            raise ConductorAlreadyExistsException(f"DNI {conductor_data.dni}")
        elif "licencia" in str(e):
            raise ConductorAlreadyExistsException(f"Licencia {conductor_data.numeroLicencia}")
        else:
            raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[ConductorResponse])
async def get_conductores(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    empresa_id: Optional[str] = Query(None, description="Filtrar por empresa")
) -> List[ConductorResponse]:
    """Obtener lista de conductores con filtros opcionales"""
    try:
        conductor_service = MockConductorService()
        
        # Usar el método get_conductores del servicio
        conductores = await conductor_service.get_conductores(skip, limit, estado, empresa_id)
        
        return [build_conductor_response(conductor) for conductor in conductores]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/filtros", response_model=List[ConductorResponse])
async def get_conductores_con_filtros(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    dni: Optional[str] = Query(None),
    nombres: Optional[str] = Query(None),
    apellido_paterno: Optional[str] = Query(None),
    apellido_materno: Optional[str] = Query(None),
    numero_licencia: Optional[str] = Query(None),
    categoria_licencia: Optional[str] = Query(None),
    estado_licencia: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
    empresa_id: Optional[str] = Query(None),
    distrito: Optional[str] = Query(None),
    provincia: Optional[str] = Query(None),
    departamento: Optional[str] = Query(None),
    fecha_vencimiento_desde: Optional[date] = Query(None),
    fecha_vencimiento_hasta: Optional[date] = Query(None),
    experiencia_minima: Optional[int] = Query(None),
    experiencia_maxima: Optional[int] = Query(None)
) -> List[ConductorResponse]:
    """Obtener conductores con filtros avanzados"""
    conductor_service = MockConductorService()
    
    # Construir filtros
    filtros = ConductorFiltros(
        dni=dni,
        nombres=nombres,
        apellidoPaterno=apellido_paterno,
        apellidoMaterno=apellido_materno,
        numeroLicencia=numero_licencia,
        categoriaLicencia=categoria_licencia,
        estadoLicencia=estado_licencia,
        estado=estado,
        empresaId=empresa_id,
        distrito=distrito,
        provincia=provincia,
        departamento=departamento,
        fechaVencimientoDesde=fecha_vencimiento_desde,
        fechaVencimientoHasta=fecha_vencimiento_hasta,
        experienciaMinima=experiencia_minima,
        experienciaMaxima=experiencia_maxima
    )
    
    conductores = await conductor_service.get_conductores_con_filtros(filtros)
    conductores = conductores[skip:skip + limit]
    
    return [build_conductor_response(conductor) for conductor in conductores]

@router.get("/estadisticas")
async def get_estadisticas_conductores():
    """Obtener estadísticas de conductores"""
    conductor_service = MockConductorService()
    estadisticas = await conductor_service.get_estadisticas()
    
    return {
        "totalConductores": estadisticas['total'],
        "estados": estadisticas['estados'],
        "licenciasVigentes": estadisticas['licenciasVigentes'],
        "licenciasVencidas": estadisticas['licenciasVencidas'],
        "licenciasPorVencer": estadisticas['licenciasPorVencer'],
        "distribucionPorGenero": estadisticas['distribucionPorGenero'],
        "distribucionPorEdad": estadisticas['distribucionPorEdad'],
        "distribucionPorCategoria": estadisticas['distribucionPorCategoria'],
        "promedioExperiencia": estadisticas['promedioExperiencia']
    }

@router.get("/{conductor_id}", response_model=ConductorResponse)
async def get_conductor(
    conductor_id: str
) -> ConductorResponse:
    """Obtener conductor por ID"""
    # Guard clause
    if not conductor_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de conductor inválido")
    
    conductor_service = MockConductorService()
    conductor = await conductor_service.get_conductor_by_id(conductor_id)
    
    if not conductor:
        raise ConductorNotFoundException(conductor_id)
    
    return build_conductor_response(conductor)

@router.get("/dni/{dni}", response_model=ConductorResponse)
async def get_conductor_by_dni(
    dni: str
) -> ConductorResponse:
    """Obtener conductor por DNI"""
    conductor_service = MockConductorService()
    conductor = await conductor_service.get_conductor_by_dni(dni)
    
    if not conductor:
        raise ConductorNotFoundException(f"DNI {dni}")
    
    return build_conductor_response(conductor)

@router.get("/licencia/{numero_licencia}", response_model=ConductorResponse)
async def get_conductor_by_licencia(
    numero_licencia: str
) -> ConductorResponse:
    """Obtener conductor por número de licencia"""
    conductor_service = MockConductorService()
    conductor = await conductor_service.get_conductor_by_licencia(numero_licencia)
    
    if not conductor:
        raise ConductorNotFoundException(f"Licencia {numero_licencia}")
    
    return build_conductor_response(conductor)

@router.get("/validar-dni/{dni}")
async def validar_dni_conductor(dni: str):
    """Validar si un DNI ya existe"""
    conductor_service = MockConductorService()
    conductor_existente = await conductor_service.get_conductor_by_dni(dni)
    
    return {
        "valido": not conductor_existente,
        "conductor": conductor_existente
    }

@router.get("/validar-licencia/{numero_licencia}")
async def validar_licencia_conductor(numero_licencia: str):
    """Validar si un número de licencia ya existe"""
    conductor_service = MockConductorService()
    conductor_existente = await conductor_service.get_conductor_by_licencia(numero_licencia)
    
    return {
        "valido": not conductor_existente,
        "conductor": conductor_existente
    }

@router.put("/{conductor_id}", response_model=ConductorResponse)
async def update_conductor(
    conductor_id: str,
    conductor_data: ConductorUpdate
) -> ConductorResponse:
    """Actualizar conductor"""
    # Guard clauses
    if not conductor_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de conductor inválido")
    
    if not conductor_data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
    
    conductor_service = MockConductorService()
    
    # Si se está actualizando el DNI, validar que sea único
    if conductor_data.dni:
        # Obtener el conductor actual para verificar
        conductor_actual = await conductor_service.get_conductor_by_id(conductor_id)
        if not conductor_actual:
            raise ConductorNotFoundException(conductor_id)
        
        # Verificar que el nuevo DNI no exista
        if not await conductor_service.validar_dni_unico(conductor_data.dni, conductor_id):
            raise HTTPException(
                status_code=400, 
                detail=f"Ya existe un conductor con DNI {conductor_data.dni}"
            )
    
    # Si se está actualizando la licencia, validar que sea única
    if conductor_data.numeroLicencia:
        # Obtener el conductor actual para verificar
        conductor_actual = await conductor_service.get_conductor_by_id(conductor_id)
        if not conductor_actual:
            raise ConductorNotFoundException(conductor_id)
        
        # Verificar que el nuevo número de licencia no exista
        if not await conductor_service.validar_licencia_unica(conductor_data.numeroLicencia, conductor_id):
            raise HTTPException(
                status_code=400, 
                detail=f"Ya existe un conductor con licencia {conductor_data.numeroLicencia}"
            )
    
    updated_conductor = await conductor_service.update_conductor(conductor_id, conductor_data)
    
    if not updated_conductor:
        raise ConductorNotFoundException(conductor_id)
    
    return build_conductor_response(updated_conductor)

@router.delete("/{conductor_id}", status_code=204)
async def delete_conductor(
    conductor_id: str
):
    """Desactivar conductor (borrado lógico)"""
    # Guard clause
    if not conductor_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de conductor inválido")
    
    conductor_service = MockConductorService()
    success = await conductor_service.soft_delete_conductor(conductor_id)
    
    if not success:
        raise ConductorNotFoundException(conductor_id)

@router.patch("/{conductor_id}/estado", response_model=ConductorResponse)
async def cambiar_estado_conductor(
    conductor_id: str,
    nuevo_estado: EstadoConductor = Body(..., embed=True)
) -> ConductorResponse:
    """Cambiar estado del conductor"""
    if not conductor_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de conductor inválido")
    
    conductor_service = MockConductorService()
    conductor = await conductor_service.cambiar_estado_conductor(conductor_id, nuevo_estado)
    
    if not conductor:
        raise ConductorNotFoundException(conductor_id)
    
    return build_conductor_response(conductor)

@router.patch("/{conductor_id}/empresa", response_model=ConductorResponse)
async def asignar_empresa_conductor(
    conductor_id: str,
    empresa_id: str = Body(..., embed=True),
    cargo: Optional[str] = Body(None, embed=True)
) -> ConductorResponse:
    """Asignar conductor a una empresa"""
    if not conductor_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de conductor inválido")
    
    conductor_service = MockConductorService()
    conductor = await conductor_service.asignar_empresa(conductor_id, empresa_id, cargo)
    
    if not conductor:
        raise ConductorNotFoundException(conductor_id)
    
    return build_conductor_response(conductor)

@router.delete("/{conductor_id}/empresa", response_model=ConductorResponse)
async def desasignar_empresa_conductor(
    conductor_id: str
) -> ConductorResponse:
    """Desasignar conductor de empresa"""
    if not conductor_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de conductor inválido")
    
    conductor_service = MockConductorService()
    conductor = await conductor_service.desasignar_empresa(conductor_id)
    
    if not conductor:
        raise ConductorNotFoundException(conductor_id)
    
    return build_conductor_response(conductor)

@router.post("/{conductor_id}/verificar-licencia", response_model=ConductorResponse)
async def verificar_licencia_conductor(
    conductor_id: str
) -> ConductorResponse:
    """Verificar estado de licencia del conductor"""
    if not conductor_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de conductor inválido")
    
    conductor_service = MockConductorService()
    conductor = await conductor_service.verificar_licencia(conductor_id)
    
    if not conductor:
        raise ConductorNotFoundException(conductor_id)
    
    return build_conductor_response(conductor)

@router.get("/licencias/por-vencer")
async def get_conductores_licencia_por_vencer(
    dias: int = Query(30, ge=1, le=365, description="Días para considerar licencia por vencer")
):
    """Obtener conductores cuya licencia vence en los próximos días"""
    conductor_service = MockConductorService()
    conductores = await conductor_service.get_conductores_por_vencer_licencia(dias)
    
    return {
        "dias": dias,
        "total": len(conductores),
        "conductores": [build_conductor_response(conductor) for conductor in conductores]
    }

@router.get("/licencias/vencidas")
async def get_conductores_licencia_vencida():
    """Obtener conductores con licencia vencida"""
    conductor_service = MockConductorService()
    conductores = await conductor_service.get_conductores_licencia_vencida()
    
    return {
        "total": len(conductores),
        "conductores": [build_conductor_response(conductor) for conductor in conductores]
    }

@router.get("/empresa/{empresa_id}", response_model=List[ConductorResponse])
async def get_conductores_por_empresa(
    empresa_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
) -> List[ConductorResponse]:
    """Obtener conductores por empresa"""
    conductor_service = MockConductorService()
    conductores = await conductor_service.get_conductores_por_empresa(empresa_id)
    
    # Aplicar paginación
    conductores = conductores[skip:skip + limit]
    
    return [build_conductor_response(conductor) for conductor in conductores]

@router.get("/exportar/{formato}")
async def exportar_conductores(
    formato: str,
    estado: Optional[str] = Query(None),
    empresa_id: Optional[str] = Query(None)
):
    """Exportar conductores en diferentes formatos"""
    if formato not in ['pdf', 'excel', 'csv']:
        raise HTTPException(status_code=400, detail="Formato no soportado")
    
    conductor_service = MockConductorService()
    
    # Obtener conductores según filtros
    if empresa_id:
        conductores = await conductor_service.get_conductores_por_empresa(empresa_id)
    elif estado:
        conductores = await conductor_service.get_conductores_por_estado(EstadoConductor(estado))
    else:
        conductores = await conductor_service.get_conductores_activos()
    
    # Simular exportación
    if formato == 'excel':
        return {"message": f"Exportando {len(conductores)} conductores a Excel"}
    elif formato == 'pdf':
        return {"message": f"Exportando {len(conductores)} conductores a PDF"}
    elif formato == 'csv':
        return {"message": f"Exportando {len(conductores)} conductores a CSV"} 