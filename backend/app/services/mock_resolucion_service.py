from typing import List, Optional, Dict
from datetime import datetime, timedelta
from app.models.resolucion import ResolucionCreate, ResolucionUpdate, ResolucionInDB
from app.services.mock_data import mock_service

class MockResolucionService:
    """Servicio mock para resoluciones en desarrollo"""
    
    def __init__(self):
        self.resoluciones = mock_service.resoluciones

    async def create_resolucion(self, resolucion_data: ResolucionCreate) -> ResolucionInDB:
        """Crear nueva resolución"""
        # Verificar si ya existe una resolución con el mismo número
        existing_resolucion = await self.get_resolucion_by_numero(resolucion_data.numero)
        if existing_resolucion:
            raise ValueError(f"Ya existe una resolución con número {resolucion_data.numero}")
        
        # Generar nuevo ID
        new_id = str(len(self.resoluciones) + 1)
        
        resolucion_dict = resolucion_data.model_dump()
        resolucion_dict["id"] = new_id
        resolucion_dict["fecha_registro"] = datetime.utcnow()
        resolucion_dict["esta_activo"] = True
        resolucion_dict["estado"] = "VIGENTE"
        
        new_resolucion = ResolucionInDB(**resolucion_dict)
        self.resoluciones[new_id] = new_resolucion
        
        return new_resolucion

    async def get_resolucion_by_id(self, resolucion_id: str) -> Optional[ResolucionInDB]:
        """Obtener resolución por ID"""
        return self.resoluciones.get(resolucion_id)

    async def get_resolucion_by_numero(self, numero: str) -> Optional[ResolucionInDB]:
        """Obtener resolución por número"""
        for resolucion in self.resoluciones.values():
            if resolucion.numero == numero:
                return resolucion
        return None

    async def get_resoluciones_activas(self) -> List[ResolucionInDB]:
        """Obtener todas las resoluciones activas"""
        return [resolucion for resolucion in self.resoluciones.values() if resolucion.esta_activo]

    async def get_resoluciones_por_estado(self, estado: str) -> List[ResolucionInDB]:
        """Obtener resoluciones por estado"""
        return [resolucion for resolucion in self.resoluciones.values() 
                if resolucion.estado == estado and resolucion.esta_activo]

    async def get_resoluciones_por_empresa(self, empresa_id: str) -> List[ResolucionInDB]:
        """Obtener resoluciones por empresa"""
        return [resolucion for resolucion in self.resoluciones.values() 
                if resolucion.empresa_id == empresa_id and resolucion.esta_activo]

    async def get_resoluciones_por_tipo(self, tipo: str) -> List[ResolucionInDB]:
        """Obtener resoluciones por tipo"""
        return [resolucion for resolucion in self.resoluciones.values() 
                if resolucion.tipo == tipo and resolucion.esta_activo]

    async def get_resoluciones_vencidas(self) -> List[ResolucionInDB]:
        """Obtener resoluciones vencidas"""
        hoy = datetime.utcnow()
        return [resolucion for resolucion in self.resoluciones.values() 
                if resolucion.fecha_vencimiento < hoy and resolucion.esta_activo]

    async def get_resoluciones_con_filtros(self, filtros: Dict) -> List[ResolucionInDB]:
        """Obtener resoluciones con filtros avanzados"""
        resoluciones = list(self.resoluciones.values())
        
        # Aplicar filtros
        if 'estado' in filtros and filtros['estado']:
            resoluciones = [r for r in resoluciones if r.estado == filtros['estado']]
        
        if 'numero' in filtros and filtros['numero']:
            resoluciones = [r for r in resoluciones if filtros['numero'].upper() in r.numero.upper()]
        
        if 'tipo' in filtros and filtros['tipo']:
            resoluciones = [r for r in resoluciones if r.tipo == filtros['tipo']]
        
        if 'empresa_id' in filtros and filtros['empresa_id']:
            resoluciones = [r for r in resoluciones if r.empresa_id == filtros['empresa_id']]
        
        if 'expediente_id' in filtros and filtros['expediente_id']:
            resoluciones = [r for r in resoluciones if r.expediente_id == filtros['expediente_id']]
        
        if 'fecha_desde' in filtros and filtros['fecha_desde']:
            resoluciones = [r for r in resoluciones if r.fecha_emision >= filtros['fecha_desde']]
        
        if 'fecha_hasta' in filtros and filtros['fecha_hasta']:
            resoluciones = [r for r in resoluciones if r.fecha_emision <= filtros['fecha_hasta']]
        
        return [r for r in resoluciones if r.esta_activo]

    async def get_estadisticas(self) -> Dict:
        """Obtener estadísticas de resoluciones"""
        resoluciones_activas = [r for r in self.resoluciones.values() if r.esta_activo]
        hoy = datetime.utcnow()
        
        return {
            'total': len(resoluciones_activas),
            'vigentes': len([r for r in resoluciones_activas if r.estado == 'VIGENTE']),
            'vencidas': len([r for r in resoluciones_activas if r.estado == 'VENCIDA']),
            'suspendidas': len([r for r in resoluciones_activas if r.estado == 'SUSPENDIDA']),
            'por_vencer': len([r for r in resoluciones_activas 
                              if r.fecha_vencimiento > hoy and r.fecha_vencimiento <= hoy + timedelta(days=30)]),
            'por_tipo': {
                'PRIMIGENIA': len([r for r in resoluciones_activas if r.tipo == 'PRIMIGENIA']),
                'MODIFICATORIA': len([r for r in resoluciones_activas if r.tipo == 'MODIFICATORIA']),
                'AMPLIATORIA': len([r for r in resoluciones_activas if r.tipo == 'AMPLIATORIA'])
            }
        }

    async def update_resolucion(self, resolucion_id: str, resolucion_data: ResolucionUpdate) -> Optional[ResolucionInDB]:
        """Actualizar resolución"""
        if resolucion_id not in self.resoluciones:
            return None
        
        resolucion = self.resoluciones[resolucion_id]
        update_data = resolucion_data.model_dump(exclude_unset=True)
        
        if update_data:
            update_data["fecha_actualizacion"] = datetime.utcnow()
            
            # Actualizar campos
            for key, value in update_data.items():
                setattr(resolucion, key, value)
            
            return resolucion
        
        return None

    async def soft_delete_resolucion(self, resolucion_id: str) -> bool:
        """Desactivar resolución (borrado lógico)"""
        if resolucion_id in self.resoluciones:
            self.resoluciones[resolucion_id].esta_activo = False
            self.resoluciones[resolucion_id].fecha_actualizacion = datetime.utcnow()
            return True
        return False

    async def renovar_resolucion(self, resolucion_id: str, nueva_fecha_vencimiento: datetime) -> Optional[ResolucionInDB]:
        """Renovar resolución con nueva fecha de vencimiento"""
        if resolucion_id in self.resoluciones:
            self.resoluciones[resolucion_id].fecha_vencimiento = nueva_fecha_vencimiento
            self.resoluciones[resolucion_id].estado = "VIGENTE"
            self.resoluciones[resolucion_id].fecha_actualizacion = datetime.utcnow()
            return self.resoluciones[resolucion_id]
        return None

    async def suspender_resolucion(self, resolucion_id: str, motivo: str) -> Optional[ResolucionInDB]:
        """Suspender resolución"""
        if resolucion_id in self.resoluciones:
            self.resoluciones[resolucion_id].estado = "SUSPENDIDA"
            self.resoluciones[resolucion_id].observaciones = f"SUSPENDIDA: {motivo}"
            self.resoluciones[resolucion_id].fecha_actualizacion = datetime.utcnow()
            return self.resoluciones[resolucion_id]
        return None

    async def activar_resolucion(self, resolucion_id: str) -> Optional[ResolucionInDB]:
        """Activar resolución suspendida"""
        if resolucion_id in self.resoluciones:
            self.resoluciones[resolucion_id].estado = "VIGENTE"
            self.resoluciones[resolucion_id].observaciones = "REACTIVADA"
            self.resoluciones[resolucion_id].fecha_actualizacion = datetime.utcnow()
            return self.resoluciones[resolucion_id]
        return None 