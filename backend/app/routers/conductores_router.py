from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.models.conductor import (
    ConductorCreate, 
    ConductorUpdate, 
    ConductorResponse, 
    ConductorFiltros,
    ConductorEstadisticas,
    ConductorResumen,
    EstadoConductor,
    CalidadConductor,
    TipoLicencia,
    Licencia,
    InfraccionConductor
)
from app.dependencies.auth import get_current_user
from app.models.usuario import UsuarioResponse
from app.dependencies.db import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(prefix="/conductores", tags=["conductores"])

# Mock data para conductores
MOCK_CONDUCTORES = [
    {
        "_id": "CON001",
        "dni": "12345678",
        "nombres": "Juan Carlos",
        "apellidos": "Pérez García",
        "fechaNacimiento": datetime(1985, 5, 15),
        "direccion": "Av. Arequipa 123, Puno",
        "telefono": "951234567",
        "email": "juan.perez@email.com",
        "licencia": {
            "numero": "LIC-001-2024",
            "tipo": "C2",
            "fechaEmision": datetime(2024, 1, 15),
            "fechaVencimiento": datetime(2029, 1, 15),
            "categoria": "TRANSPORTE_PUBLICO",
            "restricciones": [],
            "estaActiva": True
        },
        "estado": "HABILITADO",
        "calidadConductor": "ÓPTIMO",
        "estaActivo": True,
        "fechaRegistro": datetime(2024, 1, 15, 8, 0, 0),
        "fechaActualizacion": datetime(2024, 1, 15, 8, 0, 0),
        "empresasAsociadasIds": ["EMP001"],
        "vehiculosAsignadosIds": ["VEH001"],
        "infracciones": [],
        "documentosIds": ["DOC001"],
        "historialIds": ["HIST001"],
        "observaciones": "Conductor experimentado con excelente historial",
        "fotoUrl": None,
        "huellaDigital": None
    },
    {
        "_id": "CON002",
        "dni": "87654321",
        "nombres": "María Elena",
        "apellidos": "Rodríguez López",
        "fechaNacimiento": datetime(1990, 8, 22),
        "direccion": "Jr. Tacna 456, Puno",
        "telefono": "987654321",
        "email": "maria.rodriguez@email.com",
        "licencia": {
            "numero": "LIC-002-2024",
            "tipo": "C1",
            "fechaEmision": datetime(2024, 2, 20),
            "fechaVencimiento": datetime(2029, 2, 20),
            "categoria": "TRANSPORTE_PUBLICO",
            "restricciones": ["LENTES"],
            "estaActiva": True
        },
        "estado": "HABILITADO",
        "calidadConductor": "ÓPTIMO",
        "estaActivo": True,
        "fechaRegistro": datetime(2024, 2, 20, 9, 0, 0),
        "fechaActualizacion": datetime(2024, 2, 20, 9, 0, 0),
        "empresasAsociadasIds": ["EMP002"],
        "vehiculosAsignadosIds": ["VEH002"],
        "infracciones": [],
        "documentosIds": ["DOC002"],
        "historialIds": ["HIST002"],
        "observaciones": "Conductora responsable con restricción de lentes",
        "fotoUrl": None,
        "huellaDigital": None
    },
    {
        "_id": "CON003",
        "dni": "11223344",
        "nombres": "Carlos Alberto",
        "apellidos": "Gutiérrez Silva",
        "fechaNacimiento": datetime(1988, 12, 10),
        "direccion": "Av. La Marina 789, Puno",
        "telefono": "945678123",
        "email": "carlos.gutierrez@email.com",
        "licencia": {
            "numero": "LIC-003-2024",
            "tipo": "D2",
            "fechaEmision": datetime(2024, 3, 10),
            "fechaVencimiento": datetime(2029, 3, 10),
            "categoria": "CARGA",
            "restricciones": [],
            "estaActiva": True
        },
        "estado": "EN_SANCION",
        "calidadConductor": "EN_SANCION",
        "estaActivo": True,
        "fechaRegistro": datetime(2024, 3, 10, 10, 0, 0),
        "fechaActualizacion": datetime(2024, 6, 15, 14, 30, 0),
        "empresasAsociadasIds": ["EMP003"],
        "vehiculosAsignadosIds": ["VEH003"],
        "infracciones": [
            {
                "fecha": datetime(2024, 6, 10, 16, 0, 0),
                "codigo": "INF-001",
                "descripcion": "Exceso de velocidad en zona urbana",
                "monto": 150.0,
                "estado": "PAGADA",
                "observaciones": "Multa pagada, sancionado por 30 días"
            }
        ],
        "documentosIds": ["DOC003"],
        "historialIds": ["HIST003"],
        "observaciones": "Conductor con infracción reciente, en período de sanción",
        "fotoUrl": None,
        "huellaDigital": None
    }
]

@router.get("/", response_model=List[ConductorResponse])
async def get_conductores(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    dni: Optional[str] = Query(None, description="DNI del conductor"),
    nombres: Optional[str] = Query(None, description="Nombres del conductor"),
    apellidos: Optional[str] = Query(None, description="Apellidos del conductor"),
    estado: Optional[str] = Query(None, description="Estado del conductor"),
    calidadConductor: Optional[str] = Query(None, description="Calidad del conductor"),
    empresaId: Optional[str] = Query(None, description="ID de la empresa"),
    tieneLicenciaVigente: Optional[bool] = Query(None, description="Si tiene licencia vigente"),
    tieneInfracciones: Optional[bool] = Query(None, description="Si tiene infracciones")
):
    """
    Obtener lista de conductores con filtros opcionales
    """
    try:
        # Filtrar conductores
        conductores_filtrados = MOCK_CONDUCTORES.copy()
        
        if dni:
            conductores_filtrados = [c for c in conductores_filtrados if c["dni"] == dni]
        
        if nombres:
            conductores_filtrados = [c for c in conductores_filtrados if nombres.lower() in c["nombres"].lower()]
        
        if apellidos:
            conductores_filtrados = [c for c in conductores_filtrados if apellidos.lower() in c["apellidos"].lower()]
        
        if estado:
            conductores_filtrados = [c for c in conductores_filtrados if c["estado"] == estado]
        
        if calidadConductor:
            conductores_filtrados = [c for c in conductores_filtrados if c["calidadConductor"] == calidadConductor]
        
        if empresaId:
            conductores_filtrados = [c for c in conductores_filtrados if empresaId in c["empresasAsociadasIds"]]
        
        if tieneLicenciaVigente is not None:
            if tieneLicenciaVigente:
                conductores_filtrados = [c for c in conductores_filtrados if c["licencia"]["estaActiva"] and c["licencia"]["fechaVencimiento"] > datetime.utcnow()]
            else:
                conductores_filtrados = [c for c in conductores_filtrados if not c["licencia"]["estaActiva"] or c["licencia"]["fechaVencimiento"] <= datetime.utcnow()]
        
        if tieneInfracciones is not None:
            if tieneInfracciones:
                conductores_filtrados = [c for c in conductores_filtrados if len(c["infracciones"]) > 0]
            else:
                conductores_filtrados = [c for c in conductores_filtrados if len(c["infracciones"]) == 0]
        
        # Aplicar paginación
        total = len(conductores_filtrados)
        conductores_paginados = conductores_filtrados[skip:skip + limit]
        
        # Convertir a ConductorResponse
        response = []
        for conductor in conductores_paginados:
            response.append(ConductorResponse(
                id=conductor["_id"],
                dni=conductor["dni"],
                nombres=conductor["nombres"],
                apellidos=conductor["apellidos"],
                fechaNacimiento=conductor["fechaNacimiento"],
                direccion=conductor["direccion"],
                telefono=conductor["telefono"],
                email=conductor["email"],
                licencia=Licencia(**conductor["licencia"]),
                estado=conductor["estado"],
                calidadConductor=conductor["calidadConductor"],
                estaActivo=conductor["estaActivo"],
                fechaRegistro=conductor["fechaRegistro"],
                fechaActualizacion=conductor["fechaActualizacion"],
                empresasAsociadasIds=conductor["empresasAsociadasIds"],
                vehiculosAsignadosIds=conductor["vehiculosAsignadosIds"],
                infracciones=[InfraccionConductor(**inf) for inf in conductor["infracciones"]],
                documentosIds=conductor["documentosIds"],
                historialIds=conductor["historialIds"],
                observaciones=conductor["observaciones"],
                fotoUrl=conductor["fotoUrl"],
                huellaDigital=conductor["huellaDigital"]
            ))
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/{conductor_id}", response_model=ConductorResponse)
async def get_conductor(
    conductor_id: str
):
    """
    Obtener un conductor específico por ID
    """
    try:
        conductor = next((c for c in MOCK_CONDUCTORES if c["_id"] == conductor_id), None)
        
        if not conductor:
            raise HTTPException(status_code=404, detail="Conductor no encontrado")
        
        return ConductorResponse(
            id=conductor["_id"],
            dni=conductor["dni"],
            nombres=conductor["nombres"],
            apellidos=conductor["apellidos"],
            fechaNacimiento=conductor["fechaNacimiento"],
            direccion=conductor["direccion"],
            telefono=conductor["telefono"],
            email=conductor["email"],
            licencia=Licencia(**conductor["licencia"]),
            estado=conductor["estado"],
            calidadConductor=conductor["calidadConductor"],
            estaActivo=conductor["estaActivo"],
            fechaRegistro=conductor["fechaRegistro"],
            fechaActualizacion=conductor["fechaActualizacion"],
            empresasAsociadasIds=conductor["empresasAsociadasIds"],
            vehiculosAsignadosIds=conductor["vehiculosAsignadosIds"],
            infracciones=[InfraccionConductor(**inf) for inf in conductor["infracciones"]],
            documentosIds=conductor["documentosIds"],
            historialIds=conductor["historialIds"],
            observaciones=conductor["observaciones"],
            fotoUrl=conductor["fotoUrl"],
            huellaDigital=conductor["huellaDigital"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.post("/", response_model=ConductorResponse)
async def create_conductor(
    conductor: ConductorCreate,
    current_user: UsuarioResponse = Depends(get_current_user)
):
    """
    Crear un nuevo conductor
    """
    try:
        # Generar ID único
        new_id = f"CON{str(len(MOCK_CONDUCTORES) + 1).zfill(3)}"
        
        nuevo_conductor = {
            "_id": new_id,
            "dni": conductor.dni,
            "nombres": conductor.nombres,
            "apellidos": conductor.apellidos,
            "fechaNacimiento": conductor.fechaNacimiento,
            "direccion": conductor.direccion,
            "telefono": conductor.telefono,
            "email": conductor.email,
            "licencia": conductor.licencia.dict(),
            "estado": EstadoConductor.HABILITADO,
            "calidadConductor": CalidadConductor.OPTIMO,
            "estaActivo": True,
            "fechaRegistro": datetime.utcnow(),
            "fechaActualizacion": datetime.utcnow(),
            "empresasAsociadasIds": [],
            "vehiculosAsignadosIds": [],
            "infracciones": [],
            "documentosIds": [],
            "historialIds": [],
            "observaciones": conductor.observaciones,
            "fotoUrl": None,
            "huellaDigital": None
        }
        
        MOCK_CONDUCTORES.append(nuevo_conductor)
        
        return ConductorResponse(
            id=nuevo_conductor["_id"],
            dni=nuevo_conductor["dni"],
            nombres=nuevo_conductor["nombres"],
            apellidos=nuevo_conductor["apellidos"],
            fechaNacimiento=nuevo_conductor["fechaNacimiento"],
            direccion=nuevo_conductor["direccion"],
            telefono=nuevo_conductor["telefono"],
            email=nuevo_conductor["email"],
            licencia=Licencia(**nuevo_conductor["licencia"]),
            estado=nuevo_conductor["estado"],
            calidadConductor=nuevo_conductor["calidadConductor"],
            estaActivo=nuevo_conductor["estaActivo"],
            fechaRegistro=nuevo_conductor["fechaRegistro"],
            fechaActualizacion=nuevo_conductor["fechaActualizacion"],
            empresasAsociadasIds=nuevo_conductor["empresasAsociadasIds"],
            vehiculosAsignadosIds=nuevo_conductor["vehiculosAsignadosIds"],
            infracciones=[InfraccionConductor(**inf) for inf in nuevo_conductor["infracciones"]],
            documentosIds=nuevo_conductor["documentosIds"],
            historialIds=nuevo_conductor["historialIds"],
            observaciones=nuevo_conductor["observaciones"],
            fotoUrl=nuevo_conductor["fotoUrl"],
            huellaDigital=nuevo_conductor["huellaDigital"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.put("/{conductor_id}", response_model=ConductorResponse)
async def update_conductor(
    conductor_id: str,
    conductor_update: ConductorUpdate,
    current_user: UsuarioResponse = Depends(get_current_user)
):
    """
    Actualizar un conductor existente
    """
    try:
        conductor = next((c for c in MOCK_CONDUCTORES if c["_id"] == conductor_id), None)
        
        if not conductor:
            raise HTTPException(status_code=404, detail="Conductor no encontrado")
        
        # Actualizar campos
        update_data = conductor_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == "licencia" and value:
                conductor["licencia"] = value.dict()
            else:
                conductor[field] = value
        
        conductor["fechaActualizacion"] = datetime.utcnow()
        
        return ConductorResponse(
            id=conductor["_id"],
            dni=conductor["dni"],
            nombres=conductor["nombres"],
            apellidos=conductor["apellidos"],
            fechaNacimiento=conductor["fechaNacimiento"],
            direccion=conductor["direccion"],
            telefono=conductor["telefono"],
            email=conductor["email"],
            licencia=Licencia(**conductor["licencia"]),
            estado=conductor["estado"],
            calidadConductor=conductor["calidadConductor"],
            estaActivo=conductor["estaActivo"],
            fechaRegistro=conductor["fechaRegistro"],
            fechaActualizacion=conductor["fechaActualizacion"],
            empresasAsociadasIds=conductor["empresasAsociadasIds"],
            vehiculosAsignadosIds=conductor["vehiculosAsignadosIds"],
            infracciones=[InfraccionConductor(**inf) for inf in conductor["infracciones"]],
            documentosIds=conductor["documentosIds"],
            historialIds=conductor["historialIds"],
            observaciones=conductor["observaciones"],
            fotoUrl=conductor["fotoUrl"],
            huellaDigital=conductor["huellaDigital"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.delete("/{conductor_id}")
async def delete_conductor(
    conductor_id: str,
    current_user: UsuarioResponse = Depends(get_current_user)
):
    """
    Eliminar un conductor
    """
    try:
        conductor = next((c for c in MOCK_CONDUCTORES if c["_id"] == conductor_id), None)
        
        if not conductor:
            raise HTTPException(status_code=404, detail="Conductor no encontrado")
        
        # Marcar como inactivo en lugar de eliminar
        conductor["estaActivo"] = False
        conductor["fechaActualizacion"] = datetime.utcnow()
        
        return {"message": "Conductor eliminado exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/estadisticas", response_model=ConductorEstadisticas)
async def get_estadisticas_conductores():
    """
    Obtener estadísticas de conductores
    """
    try:
        total = len(MOCK_CONDUCTORES)
        habilitados = len([c for c in MOCK_CONDUCTORES if c["estado"] == "HABILITADO"])
        inhabilitados = len([c for c in MOCK_CONDUCTORES if c["estado"] == "INHABILITADO"])
        en_sancion = len([c for c in MOCK_CONDUCTORES if c["estado"] == "EN_SANCION"])
        suspendidos = len([c for c in MOCK_CONDUCTORES if c["estado"] == "SUSPENDIDO"])
        dados_de_baja = len([c for c in MOCK_CONDUCTORES if c["estado"] == "DADO_DE_BAJA"])
        
        licencias_vigentes = len([c for c in MOCK_CONDUCTORES if c["licencia"]["estaActiva"] and c["licencia"]["fechaVencimiento"] > datetime.utcnow()])
        con_infracciones = len([c for c in MOCK_CONDUCTORES if len(c["infracciones"]) > 0])
        
        # Calcular promedio de conductores por empresa (simulado)
        empresas_unicas = set()
        for c in MOCK_CONDUCTORES:
            empresas_unicas.update(c["empresasAsociadasIds"])
        promedio_por_empresa = total / len(empresas_unicas) if empresas_unicas else 0
        
        # Distribución por calidad
        distribucion_calidad = {}
        for c in MOCK_CONDUCTORES:
            calidad = c["calidadConductor"]
            distribucion_calidad[calidad] = distribucion_calidad.get(calidad, 0) + 1
        
        return ConductorEstadisticas(
            totalConductores=total,
            conductoresHabilitados=habilitados,
            conductoresInhabilitados=inhabilitados,
            conductoresEnSancion=en_sancion,
            conductoresSuspendidos=suspendidos,
            conductoresDadosDeBaja=dados_de_baja,
            conductoresConLicenciaVigente=licencias_vigentes,
            conductoresConInfracciones=con_infracciones,
            promedioConductoresPorEmpresa=promedio_por_empresa,
            distribucionPorCalidad=distribucion_calidad
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/resumen", response_model=List[ConductorResumen])
async def get_resumen_conductores(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar")
):
    """
    Obtener resumen de conductores
    """
    try:
        # Aplicar paginación
        total = len(MOCK_CONDUCTORES)
        conductores_paginados = MOCK_CONDUCTORES[skip:skip + limit]
        
        response = []
        for conductor in conductores_paginados:
            tiene_licencia_vigente = conductor["licencia"]["estaActiva"] and conductor["licencia"]["fechaVencimiento"] > datetime.utcnow()
            
            response.append(ConductorResumen(
                id=conductor["_id"],
                dni=conductor["dni"],
                nombres=conductor["nombres"],
                apellidos=conductor["apellidos"],
                estado=conductor["estado"],
                calidadConductor=conductor["calidadConductor"],
                tieneLicenciaVigente=tiene_licencia_vigente,
                empresasAsociadasCount=len(conductor["empresasAsociadasIds"]),
                vehiculosAsignadosCount=len(conductor["vehiculosAsignadosIds"]),
                infraccionesCount=len(conductor["infracciones"]),
                ultimaActualizacion=conductor["fechaActualizacion"] or conductor["fechaRegistro"]
            ))
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/validar-dni/{dni}")
async def validar_dni(dni: str):
    """
    Validar DNI de conductor
    """
    try:
        conductor = next((c for c in MOCK_CONDUCTORES if c["dni"] == dni), None)
        
        if conductor:
            return {
                "dni": dni,
                "valido": True,
                "nombres": conductor["nombres"],
                "apellidos": conductor["apellidos"],
                "fechaNacimiento": conductor["fechaNacimiento"].isoformat(),
                "estado": conductor["estado"],
                "fechaConsulta": datetime.utcnow(),
                "error": None
            }
        else:
            return {
                "dni": dni,
                "valido": False,
                "nombres": None,
                "apellidos": None,
                "fechaNacimiento": None,
                "estado": None,
                "fechaConsulta": datetime.utcnow(),
                "error": "DNI no encontrado en el sistema"
            }
        
    except Exception as e:
        return {
            "dni": dni,
            "valido": False,
            "nombres": None,
            "apellidos": None,
            "fechaNacimiento": None,
            "estado": None,
            "fechaConsulta": datetime.utcnow(),
            "error": f"Error en la validación: {str(e)}"
        } 