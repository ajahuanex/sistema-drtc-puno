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
        # Validar que el número sea único por año
        if not await self.validar_numero_unico_por_anio(resolucion_data.nroResolucion, resolucion_data.fechaEmision):
            anio = resolucion_data.fechaEmision.year
            raise ValueError(f"Ya existe una resolución con el número {resolucion_data.nroResolucion} en el año {anio}")
        
        # Generar nuevo ID
        new_id = str(len(self.resoluciones) + 1)
        
        # Crear diccionario con los campos correctos
        resolucion_dict = {
            "id": new_id,
            "nroResolucion": resolucion_data.nroResolucion,
            "empresaId": resolucion_data.empresaId,
            "expedienteId": resolucion_data.expedienteId,
            "fechaEmision": resolucion_data.fechaEmision,
            "fechaVigenciaInicio": resolucion_data.fechaVigenciaInicio,
            "fechaVigenciaFin": resolucion_data.fechaVigenciaFin,
            "tipoResolucion": resolucion_data.tipoResolucion,
            "resolucionPadreId": resolucion_data.resolucionPadreId,
            "vehiculosHabilitadosIds": resolucion_data.vehiculosHabilitadosIds,
            "rutasAutorizadasIds": resolucion_data.rutasAutorizadasIds,
            "tipoTramite": resolucion_data.tipoTramite,
            "descripcion": resolucion_data.descripcion,
            "documentoId": resolucion_data.documentoId,
            "usuarioEmisionId": resolucion_data.usuarioEmisionId,
            "observaciones": resolucion_data.observaciones,
            "fechaRegistro": datetime.utcnow(),
            "fechaActualizacion": datetime.utcnow(),
            "estaActivo": True,
            "estado": "VIGENTE",
            "resolucionesHijasIds": []
        }
        
        new_resolucion = ResolucionInDB(**resolucion_dict)
        self.resoluciones[new_id] = new_resolucion
        
        return new_resolucion

    async def get_resolucion_by_id(self, resolucion_id: str) -> Optional[ResolucionInDB]:
        """Obtener resolución por ID"""
        return self.resoluciones.get(resolucion_id)

    async def get_resolucion_by_numero(self, numero: str) -> Optional[ResolucionInDB]:
        """Obtener resolución por número"""
        for resolucion in self.resoluciones.values():
            if resolucion.nroResolucion == numero:
                return resolucion
        return None

    async def get_resoluciones_activas(self) -> List[ResolucionInDB]:
        """Obtener todas las resoluciones activas"""
        return [resolucion for resolucion in self.resoluciones.values() if resolucion.estaActivo]

    async def get_resoluciones_por_estado(self, estado: str) -> List[ResolucionInDB]:
        """Obtener resoluciones por estado"""
        return [resolucion for resolucion in self.resoluciones.values() 
                if resolucion.estado == estado and resolucion.estaActivo]

    async def get_resoluciones_por_empresa(self, empresa_id: str) -> List[ResolucionInDB]:
        """Obtener resoluciones por empresa"""
        return [resolucion for resolucion in self.resoluciones.values() 
                if resolucion.empresaId == empresa_id and resolucion.estaActivo]

    async def get_resoluciones_por_tipo(self, tipo: str) -> List[ResolucionInDB]:
        """Obtener resoluciones por tipo"""
        return [resolucion for resolucion in self.resoluciones.values() 
                if resolucion.tipoResolucion == tipo and resolucion.estaActivo]

    async def get_resoluciones_vencidas(self) -> List[ResolucionInDB]:
        """Obtener resoluciones vencidas"""
        hoy = datetime.utcnow()
        return [resolucion for resolucion in self.resoluciones.values() 
                if resolucion.fechaVigenciaFin < hoy and resolucion.estaActivo]

    async def get_resoluciones_con_filtros(self, filtros: Dict) -> List[ResolucionInDB]:
        """Obtener resoluciones con filtros avanzados"""
        resoluciones = list(self.resoluciones.values())
        
        # Aplicar filtros
        if 'estado' in filtros and filtros['estado']:
            resoluciones = [r for r in resoluciones if r.estado == filtros['estado']]
        
        if 'numero' in filtros and filtros['numero']:
            resoluciones = [r for r in resoluciones if filtros['numero'].upper() in r.nroResolucion.upper()]
        
        if 'tipo' in filtros and filtros['tipo']:
            resoluciones = [r for r in resoluciones if r.tipoResolucion == filtros['tipo']]
        
        if 'empresa_id' in filtros and filtros['empresa_id']:
            resoluciones = [r for r in resoluciones if r.empresaId == filtros['empresa_id']]
        
        if 'expediente_id' in filtros and filtros['expediente_id']:
            resoluciones = [r for r in resoluciones if r.expedienteId == filtros['expediente_id']]
        
        if 'fecha_desde' in filtros and filtros['fecha_desde']:
            resoluciones = [r for r in resoluciones if r.fechaEmision >= filtros['fecha_desde']]
        
        if 'fecha_hasta' in filtros and filtros['fecha_hasta']:
            resoluciones = [r for r in resoluciones if r.fechaEmision <= filtros['fecha_hasta']]
        
        return [r for r in resoluciones if r.estaActivo]

    async def get_estadisticas(self) -> Dict:
        """Obtener estadísticas de resoluciones"""
        resoluciones_activas = [r for r in self.resoluciones.values() if r.estaActivo]

    async def validar_numero_unico_por_anio(self, numero: str, fecha_emision: datetime) -> bool:
        """Validar que el número de resolución sea único por año"""
        anio = fecha_emision.year
        numero_completo = f"R-{numero}-{anio}"
        
        # Buscar si ya existe una resolución con el mismo número en el mismo año
        for resolucion in self.resoluciones.values():
            if resolucion.nroResolucion == numero_completo:
                return False  # Ya existe
        
        return True  # Es único

    async def generar_siguiente_numero(self, fecha_emision: datetime) -> str:
        """Generar el siguiente número de resolución disponible para un año específico"""
        anio = fecha_emision.year
        
        # Obtener todas las resoluciones del año
        resoluciones_del_anio = []
        for resolucion in self.resoluciones.values():
            try:
                r_anio = int(resolucion.nroResolucion.split('-')[2])
                if r_anio == anio:
                    resoluciones_del_anio.append(resolucion)
            except (IndexError, ValueError):
                continue
        
        if not resoluciones_del_anio:
            return "0001"  # Primera resolución del año
        
        # Obtener el número más alto del año
        numeros = []
        for resolucion in resoluciones_del_anio:
            try:
                numero = resolucion.nroResolucion.split('-')[1]
                numeros.append(int(numero))
            except (IndexError, ValueError):
                continue
        
        if not numeros:
            return "0001"
        
        siguiente_numero = max(numeros) + 1
        return f"{siguiente_numero:04d}"
        hoy = datetime.utcnow()
        
        return {
            'total': len(resoluciones_activas),
            'vigentes': len([r for r in resoluciones_activas if r.estado == 'VIGENTE']),
            'vencidas': len([r for r in resoluciones_activas if r.estado == 'VENCIDA']),
            'suspendidas': len([r for r in resoluciones_activas if r.estado == 'SUSPENDIDA']),
            'por_vencer': len([r for r in resoluciones_activas 
                              if r.fechaVigenciaFin > hoy and r.fechaVigenciaFin <= hoy + timedelta(days=30)]),
            'por_tipo': {
                'PADRE': len([r for r in resoluciones_activas if r.tipoResolucion == 'PADRE']),
                'HIJO': len([r for r in resoluciones_activas if r.tipoResolucion == 'HIJO'])
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
            self.resoluciones[resolucion_id].estaActivo = False
            self.resoluciones[resolucion_id].fecha_actualizacion = datetime.utcnow()
            return True
        return False

    async def renovar_resolucion(self, resolucion_id: str, nueva_fecha_vencimiento: datetime) -> Optional[ResolucionInDB]:
        """Renovar resolución con nueva fecha de vencimiento"""
        if resolucion_id in self.resoluciones:
            self.resoluciones[resolucion_id].fechaVigenciaFin = nueva_fecha_vencimiento
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