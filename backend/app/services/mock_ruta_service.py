from typing import List, Optional, Dict
from datetime import datetime
from app.models.ruta import RutaCreate, RutaUpdate, RutaInDB
from app.services.mock_data import mock_service

class MockRutaService:
    """Servicio mock para rutas en desarrollo"""
    
    def __init__(self):
        self.rutas = mock_service.rutas

    async def create_ruta(self, ruta_data: RutaCreate) -> RutaInDB:
        """Crear nueva ruta"""
        # Verificar si ya existe una ruta con el mismo código
        existing_ruta = await self.get_ruta_by_codigo(ruta_data.codigo_ruta)
        if existing_ruta:
            raise ValueError(f"Ya existe una ruta con código {ruta_data.codigo_ruta}")
        
        # Generar nuevo ID
        new_id = str(len(self.rutas) + 1)
        
        ruta_dict = ruta_data.model_dump()
        ruta_dict["id"] = new_id
        ruta_dict["fecha_registro"] = datetime.utcnow()
        ruta_dict["estaActivo"] = True
        ruta_dict["estado"] = "ACTIVA"
        
        new_ruta = RutaInDB(**ruta_dict)
        self.rutas[new_id] = new_ruta
        
        return new_ruta

    async def get_ruta_by_id(self, ruta_id: str) -> Optional[RutaInDB]:
        """Obtener ruta por ID"""
        return self.rutas.get(ruta_id)

    async def get_ruta_by_codigo(self, codigo: str) -> Optional[RutaInDB]:
        """Obtener ruta por código"""
        for ruta in self.rutas.values():
            if ruta.codigoRuta == codigo:
                return ruta
        return None

    async def get_rutas_activas(self) -> List[RutaInDB]:
        """Obtener todas las rutas activas"""
        return [ruta for ruta in self.rutas.values() if ruta.estaActivo]

    async def get_rutas_por_estado(self, estado: str) -> List[RutaInDB]:
        """Obtener rutas por estado"""
        return [ruta for ruta in self.rutas.values() 
                if ruta.estado == estado and ruta.estaActivo]

    async def get_rutas_con_filtros(self, filtros: Dict) -> List[RutaInDB]:
        """Obtener rutas con filtros avanzados"""
        rutas = list(self.rutas.values())
        
        # Aplicar filtros
        if 'estado' in filtros and filtros['estado']:
            rutas = [r for r in rutas if r.estado == filtros['estado']]
        
        if 'codigo' in filtros and filtros['codigo']:
            rutas = [r for r in rutas if filtros['codigo'].upper() in r.codigoRuta.upper()]
        
        if 'nombre' in filtros and filtros['nombre']:
            rutas = [r for r in rutas 
                    if filtros['nombre'].lower() in r.nombre.lower()]
        
        if 'origen_id' in filtros and filtros['origen_id']:
            rutas = [r for r in rutas if r.origenId == filtros['origen_id']]
        
        if 'destino_id' in filtros and filtros['destino_id']:
            rutas = [r for r in rutas if r.destinoId == filtros['destino_id']]
        
        return [r for r in rutas if r.estaActivo]

    async def get_estadisticas(self) -> Dict:
        """Obtener estadísticas de rutas"""
        rutas_activas = [r for r in self.rutas.values() if r.estaActivo]
        
        return {
            'total': len(rutas_activas),
            'activas': len([r for r in rutas_activas if r.estado == 'ACTIVA']),
            'inactivas': len([r for r in rutas_activas if r.estado == 'INACTIVA']),
            'suspendidas': len([r for r in rutas_activas if r.estado == 'SUSPENDIDA'])
        }

    async def update_ruta(self, ruta_id: str, ruta_data: RutaUpdate) -> Optional[RutaInDB]:
        """Actualizar ruta"""
        if ruta_id not in self.rutas:
            return None
        
        ruta = self.rutas[ruta_id]
        update_data = ruta_data.model_dump(exclude_unset=True)
        
        if update_data:
            update_data["fecha_actualizacion"] = datetime.utcnow()
            
            # Actualizar campos
            for key, value in update_data.items():
                setattr(ruta, key, value)
            
            return ruta
        
        return None

    async def soft_delete_ruta(self, ruta_id: str) -> bool:
        """Desactivar ruta (borrado lógico)"""
        if ruta_id in self.rutas:
            self.rutas[ruta_id].estaActivo = False
            self.rutas[ruta_id].fecha_actualizacion = datetime.utcnow()
            return True
        return False

    # Métodos para gestión de itinerarios
    async def agregar_localidad_a_itinerario(self, ruta_id: str, localidad_id: str) -> Optional[RutaInDB]:
        """Agregar localidad al itinerario de la ruta"""
        if ruta_id in self.rutas:
            if localidad_id not in self.rutas[ruta_id].itinerarioIds:
                self.rutas[ruta_id].itinerarioIds.append(localidad_id)
                return self.rutas[ruta_id]
        return None

    async def remover_localidad_de_itinerario(self, ruta_id: str, localidad_id: str) -> Optional[RutaInDB]:
        """Remover localidad del itinerario de la ruta"""
        if ruta_id in self.rutas:
            if localidad_id in self.rutas[ruta_id].itinerarioIds:
                self.rutas[ruta_id].itinerarioIds.remove(localidad_id)
                return self.rutas[ruta_id]
        return None

    # Métodos para gestión de frecuencias
    async def actualizar_frecuencias(self, ruta_id: str, frecuencias: str) -> Optional[RutaInDB]:
        """Actualizar frecuencias de la ruta"""
        if ruta_id in self.rutas:
            self.rutas[ruta_id].frecuencias = frecuencias
            self.rutas[ruta_id].fecha_actualizacion = datetime.utcnow()
            return self.rutas[ruta_id]
        return None 