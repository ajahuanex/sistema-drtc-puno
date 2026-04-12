"""Servicio para mapear datos antiguos de empresas al nuevo modelo"""

from typing import Dict, Any, Optional, List
from datetime import datetime
from app.models.empresa import (
    Empresa,
    EstadoEmpresa,
    TipoServicio,
    RazonSocial,
    RepresentanteLegal,
    DocumentoEmpresa,
    AuditoriaEmpresa,
    EventoHistorialEmpresa,
    CambioEstadoEmpresa,
    CambioRepresentanteLegal,
)


class EmpresaMapper:
    """Mapea datos antiguos de empresas al nuevo modelo"""
    
    @staticmethod
    def map_estado(estado_antiguo: str) -> EstadoEmpresa:
        """Mapea estado antiguo al nuevo enum"""
        estado_map = {
            "ACTIVO": EstadoEmpresa.AUTORIZADA,
            "AUTORIZADA": EstadoEmpresa.AUTORIZADA,
            "EN_TRAMITE": EstadoEmpresa.EN_TRAMITE,
            "SUSPENDIDA": EstadoEmpresa.SUSPENDIDA,
            "CANCELADA": EstadoEmpresa.CANCELADA,
            "DADA_DE_BAJA": EstadoEmpresa.DADA_DE_BAJA,
        }
        return estado_map.get(estado_antiguo.upper(), EstadoEmpresa.AUTORIZADA)
    
    @staticmethod
    def map_razon_social(razon_social_data: Any) -> RazonSocial:
        """Mapea razonSocial antigua al nuevo modelo"""
        if isinstance(razon_social_data, dict):
            return RazonSocial(
                principal=razon_social_data.get("principal", ""),
                sunat=razon_social_data.get("sunat") or razon_social_data.get("comercial"),
                minimo=razon_social_data.get("minimo")
            )
        return RazonSocial(principal=str(razon_social_data))
    
    @staticmethod
    def map_representante_legal(rep_data: Any) -> RepresentanteLegal:
        """Mapea representanteLegal antiguo al nuevo modelo"""
        if isinstance(rep_data, dict):
            return RepresentanteLegal(
                dni=rep_data.get("dni", ""),
                nombres=rep_data.get("nombres", ""),
                apellidos=rep_data.get("apellidos", ""),
                email=rep_data.get("email"),
                telefono=rep_data.get("telefono"),
                direccion=rep_data.get("direccion")
            )
        return RepresentanteLegal(
            dni="",
            nombres="",
            apellidos=""
        )
    
    @staticmethod
    def map_tipos_servicio(tipo_empresa: Optional[str], modalidad: Optional[str]) -> List[TipoServicio]:
        """Mapea tipoEmpresa y modalidadServicio al nuevo modelo tiposServicio"""
        tipos = []
        
        if tipo_empresa:
            tipo_map = {
                "PERSONAS": TipoServicio.PERSONAS,
                "P": TipoServicio.PERSONAS,
                "TURISMO": TipoServicio.TURISMO,
                "T": TipoServicio.TURISMO,
                "TRABAJADORES": TipoServicio.TRABAJADORES,
                "MERCANCIAS": TipoServicio.MERCANCIAS,
            }
            tipo_mapeado = tipo_map.get(tipo_empresa.upper())
            if tipo_mapeado:
                tipos.append(tipo_mapeado)
        
        if modalidad:
            modalidad_map = {
                "REGULAR": TipoServicio.PERSONAS,
                "TURISMO": TipoServicio.TURISMO,
                "ESTUDIANTES": TipoServicio.ESTUDIANTES,
            }
            modalidad_mapeada = modalidad_map.get(modalidad.upper())
            if modalidad_mapeada and modalidad_mapeada not in tipos:
                tipos.append(modalidad_mapeada)
        
        return tipos if tipos else [TipoServicio.PERSONAS]
    
    @staticmethod
    def map_documento_antiguo(doc_data: Dict[str, Any]) -> Optional[DocumentoEmpresa]:
        """Mapea documento antiguo al nuevo modelo"""
        try:
            return DocumentoEmpresa(
                tipo=doc_data.get("tipo", "OTRO"),
                numero=doc_data.get("numero", ""),
                fechaEmision=doc_data.get("fechaEmision", datetime.utcnow()),
                fechaVencimiento=doc_data.get("fechaVencimiento"),
                urlDocumento=doc_data.get("urlDocumento"),
                observaciones=doc_data.get("observaciones"),
                estaActivo=doc_data.get("estaActivo", True)
            )
        except Exception:
            return None
    
    @staticmethod
    def map_empresa_antigua(doc: Dict[str, Any]) -> Empresa:
        """Mapea documento antiguo de empresa al nuevo modelo Empresa"""
        
        # Mapear campos básicos
        empresa_dict = {
            "id": str(doc.get("_id")) if "_id" in doc else None,
            "ruc": doc.get("ruc", ""),
            "razonSocial": EmpresaMapper.map_razon_social(doc.get("razonSocial", {})),
            "direccionFiscal": doc.get("direccionFiscal", ""),
            "estado": EmpresaMapper.map_estado(doc.get("estado", "ACTIVO")),
            "tiposServicio": EmpresaMapper.map_tipos_servicio(
                doc.get("tipoEmpresa"),
                doc.get("modalidadServicio")
            ),
            "estaActivo": doc.get("estaActivo", True),
            "fechaRegistro": doc.get("fechaRegistro", datetime.utcnow()),
            "fechaActualizacion": doc.get("fechaActualizacion"),
            "representanteLegal": EmpresaMapper.map_representante_legal(doc.get("representanteLegal", {})),
            "emailContacto": doc.get("emailContacto"),
            "telefonoContacto": doc.get("telefonoContacto"),
            "sitioWeb": doc.get("sitioWeb"),
            
            # Campos complejos con valores por defecto
            "documentos": [],
            "auditoria": [],
            "historialEventos": [],
            "historialEstados": [],
            "historialRepresentantes": [],
            "resolucionesPrimigeniasIds": doc.get("resolucionesPrimigeniasIds", []),
            "vehiculosHabilitadosIds": doc.get("vehiculosHabilitadosIds", []),
            "conductoresHabilitadosIds": doc.get("conductoresHabilitadosIds", []),
            "rutasAutorizadasIds": doc.get("rutasAutorizadasIds", []),
            
            # Campos opcionales
            "datosSunat": doc.get("datosSunat"),
            "ultimaValidacionSunat": doc.get("ultimaValidacionSunat"),
            "scoreRiesgo": doc.get("scoreRiesgo"),
            "observaciones": doc.get("observaciones"),
        }
        
        # Mapear documentos si existen
        if "documentos" in doc and isinstance(doc["documentos"], list):
            documentos_mapeados = []
            for doc_item in doc["documentos"]:
                doc_mapeado = EmpresaMapper.map_documento_antiguo(doc_item)
                if doc_mapeado:
                    documentos_mapeados.append(doc_mapeado)
            empresa_dict["documentos"] = documentos_mapeados
        
        return Empresa(**empresa_dict)
