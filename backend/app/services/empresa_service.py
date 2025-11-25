from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
import httpx
import asyncio
from app.models.empresa import (
    EmpresaCreate, EmpresaUpdate, EmpresaInDB, EmpresaEstadisticas, 
    EmpresaFiltros, EstadoEmpresa, AuditoriaEmpresa, DocumentoEmpresa
)
from app.utils.exceptions import (
    EmpresaNotFoundException, 
    EmpresaAlreadyExistsException,
    ValidationErrorException,
    SunatValidationError
)
from app.utils.codigo_empresa_utils import CodigoEmpresaUtils

class EmpresaService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.empresas
        self.auditoria_collection = db.empresas_auditoria

    async def create_empresa(self, empresa_data: EmpresaCreate, usuario_id: str) -> EmpresaInDB:
        """Crear nueva empresa con validación SUNAT y auditoría"""
        # Verificar si ya existe una empresa con el mismo RUC
        existing_empresa = await self.get_empresa_by_ruc(empresa_data.ruc)
        if existing_empresa:
            raise EmpresaAlreadyExistsException(f"Ya existe una empresa con RUC {empresa_data.ruc}")
        
        # Verificar si ya existe una empresa con el mismo código
        if empresa_data.codigoEmpresa:
            existing_codigo = await self.get_empresa_by_codigo(empresa_data.codigoEmpresa)
            if existing_codigo:
                raise EmpresaAlreadyExistsException(f"Ya existe una empresa con código {empresa_data.codigoEmpresa}")
        else:
            # Generar código automáticamente si no se proporciona
            codigos_existentes = await self.obtener_codigos_empresas_existentes()
            empresa_data.codigoEmpresa = CodigoEmpresaUtils.generar_siguiente_codigo_disponible(codigos_existentes)
        
        # Validar formato del código de empresa
        if not CodigoEmpresaUtils.validar_formato_codigo(empresa_data.codigoEmpresa):
            raise ValidationErrorException(f"Formato de código de empresa inválido: {empresa_data.codigoEmpresa}")
        
        # Validar RUC con SUNAT
        datos_sunat = await self.validar_ruc_sunat(empresa_data.ruc)
        
        # Calcular score de riesgo
        score_riesgo = await self.calcular_score_riesgo(empresa_data, datos_sunat)
        
        empresa_dict = empresa_data.model_dump(by_alias=False)
        empresa_dict["fechaRegistro"] = datetime.utcnow()
        empresa_dict["estaActivo"] = True
        empresa_dict["estado"] = EstadoEmpresa.EN_TRAMITE
        empresa_dict["datosSunat"] = datos_sunat
        empresa_dict["ultimaValidacionSunat"] = datetime.utcnow()
        empresa_dict["scoreRiesgo"] = score_riesgo
        empresa_dict["auditoria"] = []
        
        # Crear registro de auditoría
        auditoria = AuditoriaEmpresa(
            fecha_cambio=datetime.utcnow(),
            usuario_id=usuario_id,
            tipo_cambio="CREACION_EMPRESA",
            campo_anterior=None,
            campo_nuevo=f"Empresa creada con código: {empresa_data.codigoEmpresa} y RUC: {empresa_data.ruc}",
            observaciones="Creación inicial de empresa"
        )
        empresa_dict["auditoria"] = [auditoria.model_dump()]
        
        result = await self.collection.insert_one(empresa_dict)
        empresa_creada = await self.get_empresa_by_id(str(result.inserted_id))
        
        # Crear notificación
        await self.crear_notificacion_empresa(empresa_creada, "EMPRESA_CREADA")
        
        return empresa_creada

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

    async def calcular_score_riesgo(self, empresa_data: EmpresaCreate, datos_sunat: Dict[str, Any]) -> int:
        """Calcular score de riesgo de la empresa"""
        score = 0
        
        # Validar datos SUNAT
        if datos_sunat.get("valido"):
            score += 20
        else:
            score += 80  # Alto riesgo si no es válido en SUNAT
        
        # Validar representante legal
        if empresa_data.representanteLegal.dni and len(empresa_data.representanteLegal.dni) == 8:
            score += 10
        else:
            score += 30
        
        # Validar documentos
        if empresa_data.documentos:
            documentos_vencidos = sum(1 for doc in empresa_data.documentos 
                                   if doc.fechaVencimiento and doc.fechaVencimiento < datetime.utcnow())
            score += documentos_vencidos * 15
        
        # Validar información de contacto
        if empresa_data.emailContacto:
            score += 5
        if empresa_data.telefonoContacto:
            score += 5
        
        return min(score, 100)  # Máximo 100

    async def get_empresa_by_id(self, empresa_id: str) -> Optional[EmpresaInDB]:
        """Obtener empresa por ID"""
        empresa = await self.collection.find_one({"_id": ObjectId(empresa_id)})
        return EmpresaInDB(**empresa) if empresa else None

    async def get_empresa_by_ruc(self, ruc: str) -> Optional[EmpresaInDB]:
        """Obtener empresa por RUC"""
        empresa = await self.collection.find_one({"ruc": ruc})
        return EmpresaInDB(**empresa) if empresa else None

    async def get_empresa_by_codigo(self, codigo: str) -> Optional[EmpresaInDB]:
        """Obtener empresa por código de empresa"""
        empresa = await self.collection.find_one({"codigoEmpresa": codigo})
        return EmpresaInDB(**empresa) if empresa else None

    async def get_empresas_activas(self) -> List[EmpresaInDB]:
        """Obtener todas las empresas activas"""
        cursor = self.collection.find({"estaActivo": True})
        empresas = await cursor.to_list(length=None)
        return [EmpresaInDB(**empresa) for empresa in empresas]

    async def get_empresas_por_estado(self, estado: EstadoEmpresa) -> List[EmpresaInDB]:
        """Obtener empresas por estado"""
        cursor = self.collection.find({"estado": estado, "estaActivo": True})
        empresas = await cursor.to_list(length=None)
        return [EmpresaInDB(**empresa) for empresa in empresas]

    async def get_empresas_con_filtros(self, filtros: EmpresaFiltros) -> List[EmpresaInDB]:
        """Obtener empresas con filtros avanzados"""
        query = {"estaActivo": True}
        
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
            query["documentos"] = {
                "$elemMatch": {
                    "fechaVencimiento": {"$lt": datetime.utcnow()},
                    "estaActivo": True
                }
            }
        
        if filtros.tiene_vehiculos:
            query["vehiculosHabilitadosIds"] = {"$ne": []}
        
        if filtros.tiene_conductores:
            query["conductoresHabilitadosIds"] = {"$ne": []}
        
        cursor = self.collection.find(query)
        empresas = await cursor.to_list(length=None)
        return [EmpresaInDB(**empresa) for empresa in empresas]

    async def update_empresa(self, empresa_id: str, empresa_data: EmpresaUpdate, usuario_id: str) -> Optional[EmpresaInDB]:
        """Actualizar empresa con auditoría"""
        empresa_actual = await self.get_empresa_by_id(empresa_id)
        if not empresa_actual:
            return None
        
        update_data = empresa_data.model_dump(exclude_unset=True)
        
        if update_data:
            # Crear registro de auditoría
            auditoria = await self.crear_auditoria_cambio(empresa_actual, update_data, usuario_id)
            
            update_data["fechaActualizacion"] = datetime.utcnow()
            update_data["auditoria"] = empresa_actual.auditoria + [auditoria.model_dump()]
            
            # Si se actualiza el RUC, validar con SUNAT
            if "ruc" in update_data:
                datos_sunat = await self.validar_ruc_sunat(update_data["ruc"])
                update_data["datosSunat"] = datos_sunat
                update_data["ultimaValidacionSunat"] = datetime.utcnow()
            
            # Recalcular score de riesgo
            score_riesgo = await self.calcular_score_riesgo_actualizado(empresa_actual, update_data)
            update_data["scoreRiesgo"] = score_riesgo
            
            result = await self.collection.update_one(
                {"_id": ObjectId(empresa_id)},
                {"$set": update_data}
            )
            
            if result.modified_count:
                empresa_actualizada = await self.get_empresa_by_id(empresa_id)
                await self.crear_notificacion_empresa(empresa_actualizada, "EMPRESA_ACTUALIZADA")
                return empresa_actualizada
        
        return None

    async def crear_auditoria_cambio(self, empresa_actual: EmpresaInDB, cambios: Dict[str, Any], usuario_id: str) -> AuditoriaEmpresa:
        """Crear registro de auditoría para cambios"""
        cambios_texto = []
        for campo, valor in cambios.items():
            if campo != "auditoria":  # Excluir el campo auditoría
                valor_anterior = getattr(empresa_actual, campo, None)
                cambios_texto.append(f"{campo}: {valor_anterior} -> {valor}")
        
        return AuditoriaEmpresa(
            fecha_cambio=datetime.utcnow(),
            usuario_id=usuario_id,
            tipo_cambio="ACTUALIZACION_EMPRESA",
            campo_anterior=str(cambios_texto),
            campo_nuevo="Actualización de datos",
            observaciones=f"Actualización realizada por usuario {usuario_id}"
        )

    async def calcular_score_riesgo_actualizado(self, empresa: EmpresaInDB, cambios: Dict[str, Any]) -> int:
        """Recalcular score de riesgo con cambios"""
        # Implementar lógica de recálculo basada en cambios
        score_base = empresa.scoreRiesgo or 50
        
        # Ajustar según cambios
        if "datosSunat" in cambios:
            if cambios["datosSunat"].get("valido"):
                score_base -= 20
            else:
                score_base += 30
        
        if "documentos" in cambios:
            documentos_vencidos = sum(1 for doc in cambios["documentos"] 
                                   if doc.fechaVencimiento and doc.fechaVencimiento < datetime.utcnow())
            score_base += documentos_vencidos * 10
        
        return max(0, min(score_base, 100))

    async def soft_delete_empresa(self, empresa_id: str, usuario_id: str) -> bool:
        """Desactivar empresa (borrado lógico) con auditoría"""
        empresa = await self.get_empresa_by_id(empresa_id)
        if not empresa:
            return False
        
        # Crear auditoría
        auditoria = AuditoriaEmpresa(
            fecha_cambio=datetime.utcnow(),
            usuario_id=usuario_id,
            tipo_cambio="DESACTIVACION_EMPRESA",
            campo_anterior="Activa",
            campo_nuevo="Inactiva",
            observaciones="Empresa desactivada por usuario"
        )
        
        result = await self.collection.update_one(
            {"_id": ObjectId(empresa_id)},
            {
                "$set": {
                    "estaActivo": False,
                    "fechaActualizacion": datetime.utcnow()
                },
                "$push": {"auditoria": auditoria.model_dump()}
            }
        )
        
        if result.modified_count:
            await self.crear_notificacion_empresa(empresa, "EMPRESA_DESACTIVADA")
            return True
        
        return False

    async def agregar_documento(self, empresa_id: str, documento: DocumentoEmpresa, usuario_id: str) -> bool:
        """Agregar documento a empresa"""
        auditoria = AuditoriaEmpresa(
            fecha_cambio=datetime.utcnow(),
            usuario_id=usuario_id,
            tipo_cambio="AGREGAR_DOCUMENTO",
            campo_anterior=None,
            campo_nuevo=f"Documento {documento.tipo}: {documento.numero}",
            observaciones=f"Documento agregado: {documento.tipo}"
        )
        
        result = await self.collection.update_one(
            {"_id": ObjectId(empresa_id)},
            {
                "$push": {
                    "documentos": documento.model_dump(),
                    "auditoria": auditoria.model_dump()
                },
                "$set": {"fechaActualizacion": datetime.utcnow()}
            }
        )
        
        return result.modified_count > 0

    async def get_documentos_vencidos(self, empresa_id: str) -> List[DocumentoEmpresa]:
        """Obtener documentos vencidos de una empresa"""
        empresa = await self.get_empresa_by_id(empresa_id)
        if not empresa:
            return []
        
        documentos_vencidos = []
        for doc in empresa.documentos:
            if doc.fechaVencimiento and doc.fechaVencimiento < datetime.utcnow() and doc.estaActivo:
                documentos_vencidos.append(doc)
        
        return documentos_vencidos

    async def get_estadisticas(self) -> EmpresaEstadisticas:
        """Obtener estadísticas detalladas de empresas"""
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
                "promedio_conductores": {"$avg": {"$size": {"$ifNull": ["$conductoresHabilitadosIds", []]}}}
            }}
        ]
        
        resultado = await self.collection.aggregate(pipeline).to_list(1)
        
        if resultado:
            stats = resultado[0]
            return EmpresaEstadisticas(
                totalEmpresas=stats["total_empresas"],
                empresasHabilitadas=stats["empresas_habilitadas"],
                empresasEnTramite=stats["empresas_en_tramite"],
                empresasSuspendidas=stats["empresas_suspendidas"],
                empresasCanceladas=stats["empresas_canceladas"],
                empresasDadasDeBaja=stats["empresas_dadas_de_baja"],
                empresasConDocumentosVencidos=0,  # Calcular por separado
                empresasConScoreAltoRiesgo=0,  # Calcular por separado
                promedioVehiculosPorEmpresa=stats["promedio_vehiculos"],
                promedioConductoresPorEmpresa=stats["promedio_conductores"]
            )
        
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
            promedioConductoresPorEmpresa=0.0
        )

    async def crear_notificacion_empresa(self, empresa: EmpresaInDB, tipo: str):
        """Crear notificación para cambios en empresa"""
        # Implementar lógica de notificaciones
        notificacion = {
            "empresa_id": empresa.id,
            "tipo": tipo,
            "fecha": datetime.utcnow(),
            "mensaje": f"Empresa {empresa.ruc} - {tipo}",
            "leida": False
        }
        
        # Aquí se insertaría en la colección de notificaciones
        # await self.db.notificaciones.insert_one(notificacion)

    async def obtener_codigos_empresas_existentes(self) -> List[str]:
        """Obtener todos los códigos de empresas existentes"""
        cursor = self.collection.find({}, {"codigoEmpresa": 1})
        empresas = await cursor.to_list(length=None)
        return [empresa.get("codigoEmpresa") for empresa in empresas if empresa.get("codigoEmpresa")]

    async def generar_siguiente_codigo_empresa(self) -> str:
        """Generar el siguiente código de empresa disponible"""
        codigos_existentes = await self.obtener_codigos_empresas_existentes()
        return CodigoEmpresaUtils.generar_siguiente_codigo_disponible(codigos_existentes)

    # Métodos existentes para gestión de relaciones
    async def agregar_vehiculo_habilitado(self, empresa_id: str, vehiculo_id: str) -> bool:
        """Agregar vehículo habilitado a la empresa"""
        result = await self.collection.update_one(
            {"_id": ObjectId(empresa_id)},
            {"$addToSet": {"vehiculosHabilitadosIds": vehiculo_id}}
        )
        return result.modified_count > 0

    async def remover_vehiculo_habilitado(self, empresa_id: str, vehiculo_id: str) -> bool:
        """Remover vehículo habilitado de la empresa"""
        result = await self.collection.update_one(
            {"_id": ObjectId(empresa_id)},
            {"$pull": {"vehiculosHabilitadosIds": vehiculo_id}}
        )
        return result.modified_count > 0

    async def agregar_conductor_habilitado(self, empresa_id: str, conductor_id: str) -> bool:
        """Agregar conductor habilitado a la empresa"""
        result = await self.collection.update_one(
            {"_id": ObjectId(empresa_id)},
            {"$addToSet": {"conductoresHabilitadosIds": conductor_id}}
        )
        return result.modified_count > 0

    async def remover_conductor_habilitado(self, empresa_id: str, conductor_id: str) -> bool:
        """Remover conductor habilitado de la empresa"""
        result = await self.collection.update_one(
            {"_id": ObjectId(empresa_id)},
            {"$pull": {"conductoresHabilitadosIds": conductor_id}}
        )
        return result.modified_count > 0

    async def agregar_ruta_autorizada(self, empresa_id: str, ruta_id: str) -> bool:
        """Agregar ruta autorizada a la empresa"""
        result = await self.collection.update_one(
            {"_id": ObjectId(empresa_id)},
            {"$addToSet": {"rutasAutorizadasIds": ruta_id}}
        )
        return result.modified_count > 0

    async def remover_ruta_autorizada(self, empresa_id: str, ruta_id: str) -> bool:
        """Remover ruta autorizada de la empresa"""
        result = await self.collection.update_one(
            {"_id": ObjectId(empresa_id)},
            {"$pull": {"rutasAutorizadasIds": ruta_id}}
        )
        return result.modified_count > 0

    async def agregar_resolucion_primigenia(self, empresa_id: str, resolucion_id: str) -> bool:
        """Agregar resolución primigenia a la empresa"""
        result = await self.collection.update_one(
            {"_id": ObjectId(empresa_id)},
            {"$addToSet": {"resolucionesPrimigeniasIds": resolucion_id}}
        )
        return result.modified_count > 0 