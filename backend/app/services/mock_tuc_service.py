from typing import List, Optional, Dict
from datetime import datetime, timedelta
from app.models.tuc import TucCreate, TucUpdate, TucInDB
from app.services.mock_data import mock_service

class MockTucService:
    """Servicio mock para TUCs en desarrollo"""
    
    def __init__(self):
        self.tucs = mock_service.tucs

    async def create_tuc(self, tuc_data: TucCreate) -> TucInDB:
        """Crear nuevo TUC"""
        # Verificar si ya existe un TUC con el mismo número
        existing_tuc = await self.get_tuc_by_numero(tuc_data.nro_tuc)
        if existing_tuc:
            raise ValueError(f"Ya existe un TUC con número {tuc_data.nro_tuc}")
        
        # Generar nuevo ID
        new_id = str(len(self.tucs) + 1)
        
        tuc_dict = tuc_data.model_dump()
        tuc_dict["id"] = new_id
        tuc_dict["fecha_registro"] = datetime.utcnow()
        tuc_dict["estaActivo"] = True
        tuc_dict["estado"] = "VIGENTE"
        
        new_tuc = TucInDB(**tuc_dict)
        self.tucs[new_id] = new_tuc
        
        return new_tuc

    async def get_tuc_by_id(self, tuc_id: str) -> Optional[TucInDB]:
        """Obtener TUC por ID"""
        return self.tucs.get(tuc_id)

    async def get_tuc_by_numero(self, numero: str) -> Optional[TucInDB]:
        """Obtener TUC por número"""
        for tuc in self.tucs.values():
            if tuc.nroTuc == numero:
                return tuc
        return None

    async def get_tucs_activos(self) -> List[TucInDB]:
        """Obtener todos los TUCs activos"""
        return [tuc for tuc in self.tucs.values() if tuc.estaActivo]

    async def get_tucs_por_estado(self, estado: str) -> List[TucInDB]:
        """Obtener TUCs por estado"""
        return [tuc for tuc in self.tucs.values() 
                if tuc.estado == estado]

    async def get_tucs_por_empresa(self, empresa_id: str) -> List[TucInDB]:
        """Obtener TUCs por empresa"""
        return [tuc for tuc in self.tucs.values() 
                if tuc.empresaId == empresa_id]

    async def get_tucs_por_vehiculo(self, vehiculo_id: str) -> List[TucInDB]:
        """Obtener TUCs por vehículo"""
        return [tuc for tuc in self.tucs.values() 
                if tuc.vehiculoId == vehiculo_id]

    async def get_tucs_vencidos(self) -> List[TucInDB]:
        """Obtener TUCs vencidos"""
        hoy = datetime.utcnow()
        return [tuc for tuc in self.tucs.values() 
                if tuc.fechaVencimiento and tuc.fechaVencimiento < hoy]

    async def get_tucs_por_vencer(self, dias: int = 30) -> List[TucInDB]:
        """Obtener TUCs por vencer en los próximos días"""
        hoy = datetime.utcnow()
        fecha_limite = hoy + timedelta(days=dias)
        return [tuc for tuc in self.tucs.values() 
                if tuc.fechaVencimiento and hoy <= tuc.fechaVencimiento <= fecha_limite]

    async def get_tucs_con_filtros(self, filtros: Dict) -> List[TucInDB]:
        """Obtener TUCs con filtros avanzados"""
        tucs = list(self.tucs.values())
        
        # Aplicar filtros
        if 'estado' in filtros and filtros['estado']:
            tucs = [t for t in tucs if t.estado == filtros['estado']]
        
        if 'numero' in filtros and filtros['numero']:
            tucs = [t for t in tucs if filtros['numero'].upper() in t.nroTuc.upper()]
        
        if 'empresa_id' in filtros and filtros['empresa_id']:
            tucs = [t for t in tucs if t.empresaId == filtros['empresa_id']]
        
        if 'vehiculo_id' in filtros and filtros['vehiculo_id']:
            tucs = [t for t in tucs if t.vehiculoId == filtros['vehiculo_id']]
        
        if 'resolucion_padre_id' in filtros and filtros['resolucion_padre_id']:
            tucs = [t for t in tucs if t.resolucionPadreId == filtros['resolucion_padre_id']]
        
        if 'fecha_desde' in filtros and filtros['fecha_desde']:
            tucs = [t for t in tucs if t.fechaEmision >= filtros['fecha_desde']]
        
        if 'fecha_hasta' in filtros and filtros['fecha_hasta']:
            tucs = [t for t in tucs if t.fechaEmision <= filtros['fecha_hasta']]
        
        return tucs

    async def get_estadisticas(self) -> Dict:
        """Obtener estadísticas de TUCs"""
        tucs_activos = [t for t in self.tucs.values() if t.estaActivo]
        hoy = datetime.utcnow()
        
        return {
            'total': len(tucs_activos),
            'vigentes': len([t for t in tucs_activos if t.estado == 'VIGENTE']),
            'vencidos': len([t for t in tucs_activos if t.estado == 'DADA_DE_BAJA']),
            'suspendidos': len([t for t in tucs_activos if t.estado == 'DESECHADA']),
            'por_vencer': len([t for t in tucs_activos 
                              if t.fechaVencimiento and t.fechaVencimiento > hoy and t.fechaVencimiento <= hoy + timedelta(days=30)]),
            'vencidos_hoy': len([t for t in tucs_activos 
                                if t.fechaVencimiento and t.fechaVencimiento.date() == hoy.date()])
        }

    async def update_tuc(self, tuc_id: str, tuc_data: TucUpdate) -> Optional[TucInDB]:
        """Actualizar TUC"""
        if tuc_id not in self.tucs:
            return None
        
        tuc = self.tucs[tuc_id]
        update_data = tuc_data.model_dump(exclude_unset=True)
        
        if update_data:
            update_data["fecha_actualizacion"] = datetime.utcnow()
            
            # Actualizar campos
            for key, value in update_data.items():
                setattr(tuc, key, value)
            
            return tuc
        
        return None

    async def soft_delete_tuc(self, tuc_id: str) -> bool:
        """Desactivar TUC (borrado lógico)"""
        if tuc_id in self.tucs:
            self.tucs[tuc_id].estaActivo = False
            self.tucs[tuc_id].fecha_actualizacion = datetime.utcnow()
            return True
        return False

    async def renovar_tuc(self, tuc_id: str, nueva_fecha_vencimiento: datetime) -> Optional[TucInDB]:
        """Renovar TUC con nueva fecha de vencimiento"""
        if tuc_id in self.tucs:
            self.tucs[tuc_id].fechaVencimiento = nueva_fecha_vencimiento
            self.tucs[tuc_id].estado = "VIGENTE"
            self.tucs[tuc_id].fecha_actualizacion = datetime.utcnow()
            return self.tucs[tuc_id]
        return None

    async def suspender_tuc(self, tuc_id: str, motivo: str) -> Optional[TucInDB]:
        """Suspender TUC"""
        if tuc_id in self.tucs:
            self.tucs[tuc_id].estado = "DADA_DE_BAJA"
            self.tucs[tuc_id].motivo_baja = motivo
            self.tucs[tuc_id].fecha_baja = datetime.utcnow()
            self.tucs[tuc_id].fecha_actualizacion = datetime.utcnow()
            return self.tucs[tuc_id]
        return None

    async def activar_tuc(self, tuc_id: str) -> Optional[TucInDB]:
        """Activar TUC"""
        if tuc_id in self.tucs:
            self.tucs[tuc_id].estado = "VIGENTE"
            self.tucs[tuc_id].motivo_baja = None
            self.tucs[tuc_id].fecha_baja = None
            self.tucs[tuc_id].fecha_actualizacion = datetime.utcnow()
            return self.tucs[tuc_id]
        return None

    async def validar_tuc(self, numero: str) -> Dict:
        """Validar TUC por número"""
        tuc = await self.get_tuc_by_numero(numero)
        if not tuc:
            return {"valido": False, "mensaje": "TUC no encontrado"}
        
        hoy = datetime.utcnow()
        if tuc.fechaVencimiento < hoy:
            return {"valido": False, "mensaje": "TUC vencido"}
        
        if tuc.estado != "VIGENTE":
            return {"valido": False, "mensaje": f"TUC en estado {tuc.estado}"}
        
        return {"valido": True, "tuc": tuc} 