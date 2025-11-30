from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
import httpx
import uuid

from app.models.empresa import (
    EmpresaCreate,
    EmpresaUpdate,
    EmpresaInDB,
    EmpresaEstadisticas,
    EmpresaFiltros,
    EstadoEmpresa,
    AuditoriaEmpresa,
    DocumentoEmpresa,
)
from app.utils.exceptions import (
    EmpresaNotFoundException,
    EmpresaAlreadyExistsException,
    ValidationErrorException,
    SunatValidationError,
)
from app.utils.codigo_empresa_utils import CodigoEmpresaUtils


class EmpresaService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.empresas
        self.auditoria_collection = db.empresas_auditoria

    # ---------------------------------------------------------------------
    # Helper methods
    # ---------------------------------------------------------------------
    async def _generate_uuid(self) -> str:
        return str(uuid.uuid4())

    # ---------------------------------------------------------------------
    # CRUD operations
    # ---------------------------------------------------------------------
    async def create_empresa(self, empresa_data: EmpresaCreate, usuario_id: str) -> EmpresaInDB:
        """Crear nueva empresa con validación SUNAT y auditoría"""
        # Verificar RUC duplicado
        if await self.get_empresa_by_ruc(empresa_data.ruc):
            raise EmpresaAlreadyExistsException(f"Ya existe una empresa con RUC {empresa_data.ruc}")
        
        # Verificar código duplicado
        if empresa_data.codigoEmpresa:
            if await self.get_empresa_by_codigo(empresa_data.codigoEmpresa):
                raise EmpresaAlreadyExistsException(f"Ya existe una empresa con código {empresa_data.codigoEmpresa}")
        else:
            codigos = await self.obtener_codigos_empresas_existentes()
            empresa_data.codigoEmpresa = CodigoEmpresaUtils.generar_siguiente_codigo_disponible(codigos)
            
        # Validar formato código
        if not CodigoEmpresaUtils.validar_formato_codigo(empresa_data.codigoEmpresa):
            raise ValidationErrorException(f"Formato de código de empresa inválido: {empresa_data.codigoEmpresa}")
            
        # Validar SUNAT
        datos_sunat = await self.validar_ruc_sunat(empresa_data.ruc)
        
        # Calcular score de riesgo
        score_riesgo = await self.calcular_score_riesgo(empresa_data, datos_sunat)
        
        # Preparar documento
        empresa_dict = empresa_data.model_dump(by_alias=False)
        empresa_dict["fechaRegistro"] = datetime.utcnow()
        empresa_dict["estaActivo"] = True
        empresa_dict["estado"] = EstadoEmpresa.EN_TRAMITE
        empresa_dict["datosSunat"] = datos_sunat
        empresa_dict["ultimaValidacionSunat"] = datetime.utcnow()
        empresa_dict["scoreRiesgo"] = score_riesgo
        empresa_dict["auditoria"] = []
        
        # Auditoría de creación
        auditoria = AuditoriaEmpresa(
            fechaCambio=datetime.utcnow(),
            usuarioId=usuario_id,
            tipoCambio="CREACION_EMPRESA",
            campoAnterior=None,
            campoNuevo=f"Empresa creada con código: {empresa_data.codigoEmpresa} y RUC: {empresa_data.ruc}",
            observaciones="Creación inicial de empresa",
        )
        empresa_dict["auditoria"].append(auditoria.model_dump())
        
        # Garantizar UUID en campo id
        if "id" not in empresa_dict or not empresa_dict["id"]:
            empresa_dict["id"] = await self._generate_uuid()
            
        # Insertar
        result = await self.collection.insert_one(empresa_dict)
        empresa_creada = await self.get_empresa_by_id(str(result.inserted_id))
        
        await self.crear_notificacion_empresa(empresa_creada, "EMPRESA_CREADA")
        
        return empresa_creada

    async def get_empresa_by_id(self, empresa_id: str) -> Optional[EmpresaInDB]:
        """Obtener empresa por ID (UUID o ObjectId)"""
        # Construir query para buscar por UUID 'id' O ObjectId '_id'
        or_conditions = [{"id": empresa_id}]
        
        if ObjectId.is_valid(empresa_id):
             or_conditions.append({"_id": ObjectId(empresa_id)})
             
        query = {"$or": or_conditions}
        
        empresa = await self.collection.find_one(query)
        return EmpresaInDB(**empresa) if empresa else None

    async def get_empresa_by_ruc(self, ruc: str) -> Optional[EmpresaInDB]:
        empresa = await self.collection.find_one({"ruc": ruc})
        return EmpresaInDB(**empresa) if empresa else None

    async def get_empresa_by_codigo(self, codigo: str) -> Optional[EmpresaInDB]:
        empresa = await self.collection.find_one({"codigoEmpresa": codigo})
        return EmpresaInDB(**empresa) if empresa else None

    async def get_empresas_activas(self) -> List[EmpresaInDB]:
        cursor = self.collection.find({"estaActivo": True})
        docs = await cursor.to_list(length=None)
        return [EmpresaInDB(**doc) for doc in docs]

    async def get_empresas_por_estado(self, estado: EstadoEmpresa) -> List[EmpresaInDB]:
        cursor = self.collection.find({"estado": estado, "estaActivo": True})
        docs = await cursor.to_list(length=None)
        return [EmpresaInDB(**doc) for doc in docs]

    async def get_empresas_con_filtros(self, filtros: EmpresaFiltros) -> List[EmpresaInDB]:
        query: Dict[str, Any] = {"estaActivo": True}
        
        if filtros.ruc:
            query["ruc"] = {"$regex": filtros.ruc, "$options": "i"}
            
        if filtros.razon_social:
            query["razonSocial.principal"] = {"$regex": filtros.razon_social, "$options": "i"}
            
        if filtros.estado:
            query["estado"] = filtros.estado
            
        if filtros.fecha_desde or filtros.fecha_hasta:
            query["fechaRegistro"] = {}
            if filtros.fecha_desde:
                query["fechaRegistro"]["$gte"] = filtros.fecha_desde
            if filtros.fecha_hasta:
                query["fechaRegistro"]["$lte"] = filtros.fecha_hasta
                
        if filtros.score_riesgo_min is not None or filtros.score_riesgo_max is not None:
            query["scoreRiesgo"] = {}
            if filtros.score_riesgo_min is not None:
                query["scoreRiesgo"]["$gte"] = filtros.score_riesgo_min
            if filtros.score_riesgo_max is not None:
                query["scoreRiesgo"]["$lte"] = filtros.score_riesgo_max
                
        if filtros.tiene_documentos_vencidos:
            query["documentos"] = {"$elemMatch": {"fechaVencimiento": {"$lt": datetime.utcnow()}, "estaActivo": True}}
            
        if filtros.tiene_vehiculos:
            query["vehiculosHabilitadosIds"] = {"$ne": []}
            
        if filtros.tiene_conductores:
            query["conductoresHabilitadosIds"] = {"$ne": []}
            
        cursor = self.collection.find(query)
        docs = await cursor.to_list(length=None)
        return [EmpresaInDB(**doc) for doc in docs]

    async def update_empresa(self, empresa_id: str, empresa_data: EmpresaUpdate, usuario_id: str) -> Optional[EmpresaInDB]:
        empresa_actual = await self.get_empresa_by_id(empresa_id)
        if not empresa_actual:
            return None
            
        update_data = empresa_data.model_dump(exclude_unset=True)
        if not update_data:
            return None
            
        auditoria = await self.crear_auditoria_cambio(empresa_actual, update_data, usuario_id)
        
        update_data["fechaActualizacion"] = datetime.utcnow()
        auditoria_existente = [a.model_dump() for a in empresa_actual.auditoria]
        update_data["auditoria"] = auditoria_existente + [auditoria.model_dump()]
        
        if "ruc" in update_data:
            datos_sunat = await self.validar_ruc_sunat(update_data["ruc"])
            update_data["datosSunat"] = datos_sunat
            update_data["ultimaValidacionSunat"] = datetime.utcnow()
            
        # Recalcular score
        score_riesgo = await self.calcular_score_riesgo_actualizado(empresa_actual, update_data)
        update_data["scoreRiesgo"] = score_riesgo
        
        # Resolver _id
        filter_query = {"id": empresa_id}
        if ObjectId.is_valid(empresa_id):
             filter_query = {"$or": [{"id": empresa_id}, {"_id": ObjectId(empresa_id)}]}
        doc_raw = await self.collection.find_one(filter_query)
        if not doc_raw:
            return None
            
        result = await self.collection.update_one({"_id": doc_raw["_id"]}, {"$set": update_data})
        
        if result.modified_count:
            empresa_actualizada = await self.get_empresa_by_id(empresa_id)
            await self.crear_notificacion_empresa(empresa_actualizada, "EMPRESA_ACTUALIZADA")
            return empresa_actualizada
            
        return None

    async def crear_auditoria_cambio(self, empresa_actual: EmpresaInDB, cambios: Dict[str, Any], usuario_id: str) -> AuditoriaEmpresa:
        cambios_texto = []
        for campo, valor in cambios.items():
            if campo != "auditoria":
                anterior = getattr(empresa_actual, campo, None)
                cambios_texto.append(f"{campo}: {anterior} -> {valor}")
                
        return AuditoriaEmpresa(
            fechaCambio=datetime.utcnow(),
            usuarioId=usuario_id,
            tipoCambio="ACTUALIZACION_EMPRESA",
            campoAnterior=str(cambios_texto),
            campoNuevo="Actualización de datos",
            observaciones=f"Actualización realizada por usuario {usuario_id}",
        )

    # ---------------------------------------------------------------------
    # Scoring
    # ---------------------------------------------------------------------
    async def calcular_score_riesgo(self, empresa_data: EmpresaCreate, datos_sunat: Dict[str, Any]) -> int:
        score = 0
        
        # SUNAT
        if datos_sunat.get("valido"):
            score += 20
        else:
            score += 80
            
        # Representante legal
        if empresa_data.representanteLegal.dni and len(empresa_data.representanteLegal.dni) == 8:
            score += 10
        else:
            score += 30
            
        # Documentos vencidos
        if empresa_data.documentos:
            vencidos = sum(1 for doc in empresa_data.documentos if doc.fechaVencimiento and doc.fechaVencimiento < datetime.utcnow())
            score += vencidos * 15
            
        # Contacto
        if empresa_data.emailContacto:
            score += 5
        if empresa_data.telefonoContacto:
            score += 5
            
        return score

    async def calcular_score_riesgo_actualizado(self, empresa: EmpresaInDB, cambios: Dict[str, Any]) -> int:
        base = empresa.scoreRiesgo or 50
        
        if "datosSunat" in cambios:
            if cambios["datosSunat"].get("valido"):
                base -= 20
            else:
                base += 30
                
        if "documentos" in cambios:
            vencidos = sum(1 for doc in cambios["documentos"] if doc.fechaVencimiento and doc.fechaVencimiento < datetime.utcnow())
            base += vencidos * 10
            
        if "emailContacto" in cambios:
            base += 5
            
        if "telefonoContacto" in cambios:
            base += 5
            
        return max(0, min(base, 100))

    # ---------------------------------------------------------------------
    # Soft delete
    # ---------------------------------------------------------------------
    async def soft_delete_empresa(self, empresa_id: str, usuario_id: str) -> bool:
        empresa = await self.get_empresa_by_id(empresa_id)
        if not empresa:
            return False
            
        auditoria = AuditoriaEmpresa(
            fechaCambio=datetime.utcnow(),
            usuarioId=usuario_id,
            tipoCambio="DESACTIVACION_EMPRESA",
            campoAnterior="Activa",
            campoNuevo="Inactiva",
            observaciones="Empresa desactivada por usuario",
        )
        
        # Resolver _id
        filter_query = {"id": empresa_id}
        if ObjectId.is_valid(empresa_id):
             filter_query = {"$or": [{"id": empresa_id}, {"_id": ObjectId(empresa_id)}]}
        doc_raw = await self.collection.find_one(filter_query)
        if not doc_raw:
            return False

        result = await self.collection.update_one(
            {"_id": doc_raw["_id"]},
            {"$set": {"estaActivo": False, "fechaActualizacion": datetime.utcnow()}, "$push": {"auditoria": auditoria.model_dump()}},
        )
        
        if result.modified_count:
            await self.crear_notificacion_empresa(empresa, "EMPRESA_DESACTIVADA")
            return True
            
        return False

    # ---------------------------------------------------------------------
    # Document handling
    # ---------------------------------------------------------------------
    async def agregar_documento(self, empresa_id: str, documento: DocumentoEmpresa, usuario_id: str) -> bool:
        auditoria = AuditoriaEmpresa(
            fechaCambio=datetime.utcnow(),
            usuarioId=usuario_id,
            tipoCambio="AGREGAR_DOCUMENTO",
            campoAnterior=None,
            campoNuevo=f"Documento {documento.tipo}: {documento.numero}",
            observaciones=f"Documento agregado: {documento.tipo}",
        )
        
        # Resolver _id
        filter_query = {"id": empresa_id}
        if ObjectId.is_valid(empresa_id):
             filter_query = {"$or": [{"id": empresa_id}, {"_id": ObjectId(empresa_id)}]}
        doc_raw = await self.collection.find_one(filter_query)
        if not doc_raw:
            return False
            
        result = await self.collection.update_one(
            {"_id": doc_raw["_id"]},
            {"$push": {"documentos": documento.model_dump(), "auditoria": auditoria.model_dump()}, "$set": {"fechaActualizacion": datetime.utcnow()}},
        )
        return result.modified_count > 0

    async def get_documentos_vencidos(self, empresa_id: str) -> List[DocumentoEmpresa]:
        empresa = await self.get_empresa_by_id(empresa_id)
        if not empresa:
            return []
            
        vencidos = []
        for doc in empresa.documentos:
            if doc.fechaVencimiento and doc.fechaVencimiento < datetime.utcnow() and doc.estaActivo:
                vencidos.append(doc)
        return vencidos

    # ---------------------------------------------------------------------
    # Statistics
    # ---------------------------------------------------------------------
    async def get_estadisticas(self) -> EmpresaEstadisticas:
        pipeline = [
            {"$match": {"estaActivo": True}},
            {"$group": {
                "_id": None,
                "total_empresas": {"$sum": 1},
                "empresas_habilitadas": {"$sum": {"$cond": [{"$eq": ["$estado", EstadoEmpresa.HABILITADA]}, 1, 0]}},
                "empresas_en_tramite": {"$sum": {"$cond": [{"$eq": ["$estado", EstadoEmpresa.EN_TRAMITE]}, 1, 0]}},
                "empresas_suspendidas": {"$sum": {"$cond": [{"$eq": ["$estado", EstadoEmpresa.SUSPENDIDA]}, 1, 0]}},
                "empresas_canceladas": {"$sum": {"$cond": [{"$eq": ["$estado", EstadoEmpresa.CANCELADA]}, 1, 0]}},
                "empresas_dadas_de_baja": {"$sum": {"$cond": [{"$eq": ["$estado", EstadoEmpresa.DADA_DE_BAJA]}, 1, 0]}},
                "promedio_vehiculos": {"$avg": {"$size": {"$ifNull": ["$vehiculosHabilitadosIds", []]}}},
                "promedio_conductores": {"$avg": {"$size": {"$ifNull": ["$conductoresHabilitadosIds", []]}}},
            }},
        ]
        
        resultado = await self.collection.aggregate(pipeline).to_list(1)
        
        if not resultado:
            return EmpresaEstadisticas(
                totalEmpresas=0,
                empresasHabilitadas=0,
                empresasEnTramite=0,
                empresasSuspendidas=0,
                empresasCanceladas=0,
                empresasDadasDeBaja=0,
                empresasConDocumentosVencidos=0,
                empresasConScoreAltoRiesgo=0,
                promedioVehiculosPorEmpresa=0.0,
                promedioConductoresPorEmpresa=0.0,
            )
            
        s = resultado[0]
        return EmpresaEstadisticas(
            totalEmpresas=s["total_empresas"],
            empresasHabilitadas=s["empresas_habilitadas"],
            empresasEnTramite=s["empresas_en_tramite"],
            empresasSuspendidas=s["empresas_suspendidas"],
            empresasCanceladas=s["empresas_canceladas"],
            empresasDadasDeBaja=s["empresas_dadas_de_baja"],
            empresasConDocumentosVencidos=0,
            empresasConScoreAltoRiesgo=0,
            promedioVehiculosPorEmpresa=s["promedio_vehiculos"],
            promedioConductoresPorEmpresa=s["promedio_conductores"],
        )

    # ---------------------------------------------------------------------
    # Notifications (placeholder)
    # ---------------------------------------------------------------------
    async def crear_notificacion_empresa(self, empresa: EmpresaInDB, tipo: str):
        # Placeholder for notification logic
        pass

    # ---------------------------------------------------------------------
    # Código empresa utilities
    # ---------------------------------------------------------------------
    async def obtener_codigos_empresas_existentes(self) -> List[str]:
        cursor = self.collection.find({}, {"codigoEmpresa": 1})
        docs = await cursor.to_list(length=None)
        return [doc.get("codigoEmpresa") for doc in docs if doc.get("codigoEmpresa")]

    async def generar_siguiente_codigo_empresa(self) -> str:
        codigos = await self.obtener_codigos_empresas_existentes()
        return CodigoEmpresaUtils.generar_siguiente_codigo_disponible(codigos)

    # ---------------------------------------------------------------------
    # Relaciones
    # ---------------------------------------------------------------------
    async def agregar_vehiculo_habilitado(self, empresa_id: str, vehiculo_id: str) -> bool:
        # Resolver _id
        filter_query = {"id": empresa_id}
        if ObjectId.is_valid(empresa_id):
             filter_query = {"$or": [{"id": empresa_id}, {"_id": ObjectId(empresa_id)}]}
        doc_raw = await self.collection.find_one(filter_query)
        if not doc_raw: return False
        
        result = await self.collection.update_one({"_id": doc_raw["_id"]}, {"$addToSet": {"vehiculosHabilitadosIds": vehiculo_id}})
        return result.modified_count > 0

    async def remover_vehiculo_habilitado(self, empresa_id: str, vehiculo_id: str) -> bool:
        # Resolver _id
        filter_query = {"id": empresa_id}
        if ObjectId.is_valid(empresa_id):
             filter_query = {"$or": [{"id": empresa_id}, {"_id": ObjectId(empresa_id)}]}
        doc_raw = await self.collection.find_one(filter_query)
        if not doc_raw: return False

        result = await self.collection.update_one({"_id": doc_raw["_id"]}, {"$pull": {"vehiculosHabilitadosIds": vehiculo_id}})
        return result.modified_count > 0

    async def agregar_conductor_habilitado(self, empresa_id: str, conductor_id: str) -> bool:
        # Resolver _id
        filter_query = {"id": empresa_id}
        if ObjectId.is_valid(empresa_id):
             filter_query = {"$or": [{"id": empresa_id}, {"_id": ObjectId(empresa_id)}]}
        doc_raw = await self.collection.find_one(filter_query)
        if not doc_raw: return False

        result = await self.collection.update_one({"_id": doc_raw["_id"]}, {"$addToSet": {"conductoresHabilitadosIds": conductor_id}})
        return result.modified_count > 0

    async def remover_conductor_habilitado(self, empresa_id: str, conductor_id: str) -> bool:
        # Resolver _id
        filter_query = {"id": empresa_id}
        if ObjectId.is_valid(empresa_id):
             filter_query = {"$or": [{"id": empresa_id}, {"_id": ObjectId(empresa_id)}]}
        doc_raw = await self.collection.find_one(filter_query)
        if not doc_raw: return False

        result = await self.collection.update_one({"_id": doc_raw["_id"]}, {"$pull": {"conductoresHabilitadosIds": conductor_id}})
        return result.modified_count > 0

    async def agregar_ruta_autorizada(self, empresa_id: str, ruta_id: str) -> bool:
        # Resolver _id
        filter_query = {"id": empresa_id}
        if ObjectId.is_valid(empresa_id):
             filter_query = {"$or": [{"id": empresa_id}, {"_id": ObjectId(empresa_id)}]}
        doc_raw = await self.collection.find_one(filter_query)
        if not doc_raw: return False

        result = await self.collection.update_one({"_id": doc_raw["_id"]}, {"$addToSet": {"rutasAutorizadasIds": ruta_id}})
        return result.modified_count > 0

    async def remover_ruta_autorizada(self, empresa_id: str, ruta_id: str) -> bool:
        # Resolver _id
        filter_query = {"id": empresa_id}
        if ObjectId.is_valid(empresa_id):
             filter_query = {"$or": [{"id": empresa_id}, {"_id": ObjectId(empresa_id)}]}
        doc_raw = await self.collection.find_one(filter_query)
        if not doc_raw: return False

        result = await self.collection.update_one({"_id": doc_raw["_id"]}, {"$pull": {"rutasAutorizadasIds": ruta_id}})
        return result.modified_count > 0

    async def agregar_resolucion_primigenia(self, empresa_id: str, resolucion_id: str) -> bool:
        # Resolver _id
        filter_query = {"id": empresa_id}
        if ObjectId.is_valid(empresa_id):
             filter_query = {"$or": [{"id": empresa_id}, {"_id": ObjectId(empresa_id)}]}
        doc_raw = await self.collection.find_one(filter_query)
        if not doc_raw: return False

        result = await self.collection.update_one({"_id": doc_raw["_id"]}, {"$addToSet": {"resolucionesPrimigeniasIds": resolucion_id}})
        return result.modified_count > 0

    async def validar_ruc_sunat(self, ruc: str) -> Dict[str, Any]:
        """Validar RUC con SUNAT"""
        try:
            # Simular llamada a API de SUNAT (en producción usar API real)
            async with httpx.AsyncClient(timeout=10.0) as client:
                # URL simulada - en producción usar API real de SUNAT
                response = await client.get(f"https://api.sunat.gob.pe/v1/ruc/{ruc}")
                
                if response.status_code == 200:
                    datos = response.json()
                    return {
                        "valido": True,
                        "razon_social": datos.get("razon_social"),
                        "estado": datos.get("estado"),
                        "condicion": datos.get("condicion"),
                        "direccion": datos.get("direccion"),
                        "fecha_actualizacion": datetime.utcnow()
                    }
                else:
                    return {
                        "valido": False,
                        "error": "RUC no encontrado en SUNAT",
                        "fecha_actualizacion": datetime.utcnow()
                    }
        except Exception as e:
            return {
                "valido": False,
                "error": f"Error al validar con SUNAT: {str(e)}",
                "fecha_actualizacion": datetime.utcnow()
            }