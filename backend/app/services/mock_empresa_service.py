from typing import List, Optional, Dict
from datetime import datetime
from app.models.empresa import EmpresaCreate, EmpresaUpdate, EmpresaInDB
from app.services.mock_data import mock_service
from app.utils.codigo_empresa_utils import CodigoEmpresaUtils

class MockEmpresaService:
    """Servicio mock para empresas en desarrollo"""
    
    def __init__(self):
        self.empresas = mock_service.empresas

    async def create_empresa(self, empresa_data: EmpresaCreate) -> EmpresaInDB:
        """Crear nueva empresa"""
        # Verificar si ya existe una empresa con el mismo RUC
        existing_empresa = await self.get_empresa_by_ruc(empresa_data.ruc)
        if existing_empresa:
            raise ValueError(f"Ya existe una empresa con RUC {empresa_data.ruc}")
        
        # Verificar si ya existe una empresa con el mismo código
        if empresa_data.codigoEmpresa:
            existing_codigo = await self.get_empresa_by_codigo(empresa_data.codigoEmpresa)
            if existing_codigo:
                raise ValueError(f"Ya existe una empresa con código {empresa_data.codigoEmpresa}")
        else:
            # Generar código automáticamente si no se proporciona
            codigos_existentes = await self.obtener_codigos_empresas_existentes()
            empresa_data.codigoEmpresa = CodigoEmpresaUtils.generar_siguiente_codigo_disponible(codigos_existentes)
        
        # Validar formato del código de empresa
        if not CodigoEmpresaUtils.validar_formato_codigo(empresa_data.codigoEmpresa):
            raise ValueError(f"Formato de código de empresa inválido: {empresa_data.codigoEmpresa}")
        
        # Generar nuevo ID
        new_id = str(len(self.empresas) + 1)
        
        empresa_dict = empresa_data.model_dump()
        empresa_dict["id"] = new_id
        empresa_dict["fecha_registro"] = datetime.utcnow()
        empresa_dict["estaActivo"] = True
        empresa_dict["estado"] = "EN_TRAMITE"
        
        new_empresa = EmpresaInDB(**empresa_dict)
        self.empresas[new_id] = new_empresa
        
        return new_empresa

    async def get_empresa_by_id(self, empresa_id: str) -> Optional[EmpresaInDB]:
        """Obtener empresa por ID"""
        return self.empresas.get(empresa_id)

    async def get_empresa_by_ruc(self, ruc: str) -> Optional[EmpresaInDB]:
        """Obtener empresa por RUC"""
        for empresa in self.empresas.values():
            if empresa.ruc == ruc:
                return empresa
        return None

    async def get_empresa_by_codigo(self, codigo: str) -> Optional[EmpresaInDB]:
        """Obtener empresa por código de empresa"""
        for empresa in self.empresas.values():
            if empresa.codigoEmpresa == codigo:
                return empresa
        return None

    async def obtener_codigos_empresas_existentes(self) -> List[str]:
        """Obtener todos los códigos de empresas existentes"""
        return [empresa.codigoEmpresa for empresa in self.empresas.values() if hasattr(empresa, 'codigoEmpresa') and empresa.codigoEmpresa]

    async def generar_siguiente_codigo_empresa(self) -> str:
        """Generar el siguiente código de empresa disponible"""
        codigos_existentes = await self.obtener_codigos_empresas_existentes()
        return CodigoEmpresaUtils.generar_siguiente_codigo_disponible(codigos_existentes)

    async def get_empresas_activas(self) -> List[EmpresaInDB]:
        """Obtener todas las empresas activas"""
        return [empresa for empresa in self.empresas.values() if empresa.estaActivo]

    async def get_empresas_por_estado(self, estado: str) -> List[EmpresaInDB]:
        """Obtener empresas por estado"""
        return [empresa for empresa in self.empresas.values() 
                if empresa.estado == estado and empresa.estaActivo]

    async def get_empresas_con_filtros(self, filtros: Dict) -> List[EmpresaInDB]:
        """Obtener empresas con filtros avanzados"""
        empresas = list(self.empresas.values())
        
        # Aplicar filtros
        if 'estado' in filtros and filtros['estado']:
            empresas = [emp for emp in empresas if emp.estado == filtros['estado']]
        
        if 'ruc' in filtros and filtros['ruc']:
            empresas = [emp for emp in empresas if filtros['ruc'] in emp.ruc]
        
        if 'razon_social' in filtros and filtros['razon_social']:
            empresas = [emp for emp in empresas 
                       if filtros['razon_social'].lower() in emp.razon_social.principal.lower()]
        
        if 'fecha_desde' in filtros and filtros['fecha_desde']:
            fecha_desde = datetime.fromisoformat(filtros['fecha_desde'].replace('Z', '+00:00'))
            empresas = [emp for emp in empresas if emp.fecha_registro >= fecha_desde]
        
        if 'fecha_hasta' in filtros and filtros['fecha_hasta']:
            fecha_hasta = datetime.fromisoformat(filtros['fecha_hasta'].replace('Z', '+00:00'))
            empresas = [emp for emp in empresas if emp.fecha_registro <= fecha_hasta]
        
        return [emp for emp in empresas if emp.estaActivo]

    async def get_estadisticas(self) -> Dict:
        """Obtener estadísticas de empresas"""
        empresas_activas = [emp for emp in self.empresas.values() if emp.estaActivo]
        
        return {
            'total': len(empresas_activas),
            'habilitadas': len([emp for emp in empresas_activas if emp.estado == 'HABILITADA']),
            'en_tramite': len([emp for emp in empresas_activas if emp.estado == 'EN_TRAMITE']),
            'suspendidas': len([emp for emp in empresas_activas if emp.estado == 'SUSPENDIDA']),
            'canceladas': len([emp for emp in empresas_activas if emp.estado == 'CANCELADA'])
        }

    async def update_empresa(self, empresa_id: str, empresa_data: EmpresaUpdate) -> Optional[EmpresaInDB]:
        """Actualizar empresa"""
        if empresa_id not in self.empresas:
            return None
        
        empresa = self.empresas[empresa_id]
        update_data = empresa_data.model_dump(exclude_unset=True)
        
        if update_data:
            update_data["fecha_actualizacion"] = datetime.utcnow()
            
            # Actualizar campos
            for key, value in update_data.items():
                setattr(empresa, key, value)
            
            return empresa
        
        return None

    async def soft_delete_empresa(self, empresa_id: str) -> bool:
        """Desactivar empresa (borrado lógico)"""
        if empresa_id in self.empresas:
            self.empresas[empresa_id].estaActivo = False
            self.empresas[empresa_id].fecha_actualizacion = datetime.utcnow()
            return True
        return False

    # Métodos para gestión de vehículos
    async def agregar_vehiculo_a_empresa(self, empresa_id: str, vehiculo_id: str) -> Optional[EmpresaInDB]:
        """Agregar vehículo a empresa"""
        if empresa_id in self.empresas:
            if vehiculo_id not in self.empresas[empresa_id].vehiculos_habilitados_ids:
                self.empresas[empresa_id].vehiculos_habilitados_ids.append(vehiculo_id)
                return self.empresas[empresa_id]
        return None

    async def remover_vehiculo_de_empresa(self, empresa_id: str, vehiculo_id: str) -> Optional[EmpresaInDB]:
        """Remover vehículo de empresa"""
        if empresa_id in self.empresas:
            if vehiculo_id in self.empresas[empresa_id].vehiculos_habilitados_ids:
                self.empresas[empresa_id].vehiculos_habilitados_ids.remove(vehiculo_id)
                return self.empresas[empresa_id]
        return None

    # Métodos para gestión de conductores
    async def agregar_conductor_a_empresa(self, empresa_id: str, conductor_id: str) -> Optional[EmpresaInDB]:
        """Agregar conductor a empresa"""
        if empresa_id in self.empresas:
            if conductor_id not in self.empresas[empresa_id].conductores_habilitados_ids:
                self.empresas[empresa_id].conductores_habilitados_ids.append(conductor_id)
                return self.empresas[empresa_id]
        return None

    async def remover_conductor_de_empresa(self, empresa_id: str, conductor_id: str) -> Optional[EmpresaInDB]:
        """Remover conductor de empresa"""
        if empresa_id in self.empresas:
            if conductor_id in self.empresas[empresa_id].conductores_habilitados_ids:
                self.empresas[empresa_id].conductores_habilitados_ids.remove(conductor_id)
                return self.empresas[empresa_id]
        return None

    # Métodos para gestión de rutas
    async def agregar_ruta_a_empresa(self, empresa_id: str, ruta_id: str) -> Optional[EmpresaInDB]:
        """Agregar ruta a empresa"""
        if empresa_id in self.empresas:
            if ruta_id not in self.empresas[empresa_id].rutas_autorizadas_ids:
                self.empresas[empresa_id].rutas_autorizadas_ids.append(ruta_id)
                return self.empresas[empresa_id]
        return None

    async def remover_ruta_de_empresa(self, empresa_id: str, ruta_id: str) -> Optional[EmpresaInDB]:
        """Remover ruta de empresa"""
        if empresa_id in self.empresas:
            if ruta_id in self.empresas[empresa_id].rutas_autorizadas_ids:
                self.empresas[empresa_id].rutas_autorizadas_ids.remove(ruta_id)
                return self.empresas[empresa_id]
        return None

    # Métodos para gestión de resoluciones
    async def agregar_resolucion_a_empresa(self, empresa_id: str, resolucion_id: str) -> Optional[EmpresaInDB]:
        """Agregar resolución a empresa"""
        if empresa_id in self.empresas:
            if resolucion_id not in self.empresas[empresa_id].resoluciones_primigenias_ids:
                self.empresas[empresa_id].resoluciones_primigenias_ids.append(resolucion_id)
                return self.empresas[empresa_id]
        return None

    async def remover_resolucion_de_empresa(self, empresa_id: str, resolucion_id: str) -> Optional[EmpresaInDB]:
        """Remover resolución de empresa"""
        if empresa_id in self.empresas:
            if resolucion_id in self.empresas[empresa_id].resoluciones_primigenias_ids:
                self.empresas[empresa_id].resoluciones_primigenias_ids.remove(resolucion_id)
                return self.empresas[empresa_id]
        return None

    async def get_resoluciones_empresa(self, empresa_id: str) -> List[str]:
        """Obtener resoluciones de una empresa"""
        if empresa_id in self.empresas:
            return self.empresas[empresa_id].resoluciones_primigenias_ids
        return []

    # Métodos legacy (mantener compatibilidad)
    async def agregar_vehiculo_habilitado(self, empresa_id: str, vehiculo_id: str) -> bool:
        """Agregar vehículo habilitado a la empresa (legacy)"""
        result = await self.agregar_vehiculo_a_empresa(empresa_id, vehiculo_id)
        return result is not None

    async def remover_vehiculo_habilitado(self, empresa_id: str, vehiculo_id: str) -> bool:
        """Remover vehículo habilitado de la empresa (legacy)"""
        result = await self.remover_vehiculo_de_empresa(empresa_id, vehiculo_id)
        return result is not None

    async def agregar_conductor_habilitado(self, empresa_id: str, conductor_id: str) -> bool:
        """Agregar conductor habilitado a la empresa (legacy)"""
        result = await self.agregar_conductor_a_empresa(empresa_id, conductor_id)
        return result is not None

    async def remover_conductor_habilitado(self, empresa_id: str, conductor_id: str) -> bool:
        """Remover conductor habilitado de la empresa (legacy)"""
        result = await self.remover_conductor_de_empresa(empresa_id, conductor_id)
        return result is not None

    async def agregar_ruta_autorizada(self, empresa_id: str, ruta_id: str) -> bool:
        """Agregar ruta autorizada a la empresa (legacy)"""
        result = await self.agregar_ruta_a_empresa(empresa_id, ruta_id)
        return result is not None

    async def remover_ruta_autorizada(self, empresa_id: str, ruta_id: str) -> bool:
        """Remover ruta autorizada de la empresa (legacy)"""
        result = await self.remover_ruta_de_empresa(empresa_id, ruta_id)
        return result is not None

    async def agregar_resolucion_primigenia(self, empresa_id: str, resolucion_id: str) -> bool:
        """Agregar resolución primigenia a la empresa (legacy)"""
        result = await self.agregar_resolucion_a_empresa(empresa_id, resolucion_id)
        return result is not None 