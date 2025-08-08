from typing import List, Optional, Dict
from datetime import datetime
from app.models.vehiculo import VehiculoCreate, VehiculoUpdate, VehiculoInDB, DatosTecnicos, Tuc
from app.services.mock_data import mock_service

class MockVehiculoService:
    """Servicio mock para vehículos en desarrollo"""
    
    def __init__(self):
        self.vehiculos = mock_service.vehiculos

    async def create_vehiculo(self, vehiculo_data: VehiculoCreate) -> VehiculoInDB:
        """Crear nuevo vehículo"""
        # Verificar si ya existe un vehículo con la misma placa
        existing_vehiculo = await self.get_vehiculo_by_placa(vehiculo_data.placa)
        if existing_vehiculo:
            raise ValueError(f"Ya existe un vehículo con placa {vehiculo_data.placa}")
        
        # Generar nuevo ID
        new_id = str(len(self.vehiculos) + 1)
        
        vehiculo_dict = vehiculo_data.model_dump()
        vehiculo_dict["id"] = new_id
        vehiculo_dict["fecha_registro"] = datetime.utcnow()
        vehiculo_dict["esta_activo"] = True
        vehiculo_dict["estado"] = "ACTIVO"
        
        new_vehiculo = VehiculoInDB(**vehiculo_dict)
        self.vehiculos[new_id] = new_vehiculo
        
        return new_vehiculo

    async def get_vehiculo_by_id(self, vehiculo_id: str) -> Optional[VehiculoInDB]:
        """Obtener vehículo por ID"""
        return self.vehiculos.get(vehiculo_id)

    async def get_vehiculo_by_placa(self, placa: str) -> Optional[VehiculoInDB]:
        """Obtener vehículo por placa"""
        for vehiculo in self.vehiculos.values():
            if vehiculo.placa == placa:
                return vehiculo
        return None

    async def get_vehiculos_activos(self) -> List[VehiculoInDB]:
        """Obtener todos los vehículos activos"""
        return [vehiculo for vehiculo in self.vehiculos.values() if vehiculo.esta_activo]

    async def get_vehiculos_por_estado(self, estado: str) -> List[VehiculoInDB]:
        """Obtener vehículos por estado"""
        return [vehiculo for vehiculo in self.vehiculos.values() 
                if vehiculo.estado == estado and vehiculo.esta_activo]

    async def get_vehiculos_por_empresa(self, empresa_id: str) -> List[VehiculoInDB]:
        """Obtener vehículos por empresa"""
        return [vehiculo for vehiculo in self.vehiculos.values() 
                if vehiculo.empresa_actual_id == empresa_id and vehiculo.esta_activo]

    async def get_vehiculos_con_filtros(self, filtros: Dict) -> List[VehiculoInDB]:
        """Obtener vehículos con filtros avanzados"""
        vehiculos = list(self.vehiculos.values())
        
        # Aplicar filtros
        if 'estado' in filtros and filtros['estado']:
            vehiculos = [veh for veh in vehiculos if veh.estado == filtros['estado']]
        
        if 'placa' in filtros and filtros['placa']:
            vehiculos = [veh for veh in vehiculos if filtros['placa'].upper() in veh.placa.upper()]
        
        if 'marca' in filtros and filtros['marca']:
            vehiculos = [veh for veh in vehiculos 
                       if filtros['marca'].lower() in veh.marca.lower()]
        
        if 'categoria' in filtros and filtros['categoria']:
            vehiculos = [veh for veh in vehiculos if veh.categoria == filtros['categoria']]
        
        if 'empresa_id' in filtros and filtros['empresa_id']:
            vehiculos = [veh for veh in vehiculos if veh.empresa_actual_id == filtros['empresa_id']]
        
        if 'anio_desde' in filtros and filtros['anio_desde']:
            vehiculos = [veh for veh in vehiculos if veh.anio_fabricacion >= filtros['anio_desde']]
        
        if 'anio_hasta' in filtros and filtros['anio_hasta']:
            vehiculos = [veh for veh in vehiculos if veh.anio_fabricacion <= filtros['anio_hasta']]
        
        return [veh for veh in vehiculos if veh.esta_activo]

    async def get_estadisticas(self) -> Dict:
        """Obtener estadísticas de vehículos"""
        vehiculos_activos = [veh for veh in self.vehiculos.values() if veh.esta_activo]
        
        return {
            'total': len(vehiculos_activos),
            'activos': len([veh for veh in vehiculos_activos if veh.estado == 'ACTIVO']),
            'inactivos': len([veh for veh in vehiculos_activos if veh.estado == 'INACTIVO']),
            'mantenimiento': len([veh for veh in vehiculos_activos if veh.estado == 'MANTENIMIENTO']),
            'por_categoria': {
                'M1': len([veh for veh in vehiculos_activos if veh.categoria == 'M1']),
                'M2': len([veh for veh in vehiculos_activos if veh.categoria == 'M2']),
                'M3': len([veh for veh in vehiculos_activos if veh.categoria == 'M3']),
                'N1': len([veh for veh in vehiculos_activos if veh.categoria == 'N1']),
                'N2': len([veh for veh in vehiculos_activos if veh.categoria == 'N2']),
                'N3': len([veh for veh in vehiculos_activos if veh.categoria == 'N3'])
            }
        }

    async def update_vehiculo(self, vehiculo_id: str, vehiculo_data: VehiculoUpdate) -> Optional[VehiculoInDB]:
        """Actualizar vehículo"""
        if vehiculo_id not in self.vehiculos:
            return None
        
        vehiculo = self.vehiculos[vehiculo_id]
        update_data = vehiculo_data.model_dump(exclude_unset=True)
        
        if update_data:
            update_data["fecha_actualizacion"] = datetime.utcnow()
            
            # Actualizar campos
            for key, value in update_data.items():
                setattr(vehiculo, key, value)
            
            return vehiculo
        
        return None

    async def soft_delete_vehiculo(self, vehiculo_id: str) -> bool:
        """Desactivar vehículo (borrado lógico)"""
        if vehiculo_id in self.vehiculos:
            self.vehiculos[vehiculo_id].esta_activo = False
            self.vehiculos[vehiculo_id].fecha_actualizacion = datetime.utcnow()
            return True
        return False

    # Métodos para gestión de rutas
    async def agregar_ruta_a_vehiculo(self, vehiculo_id: str, ruta_id: str) -> Optional[VehiculoInDB]:
        """Agregar ruta a vehículo"""
        if vehiculo_id in self.vehiculos:
            if ruta_id not in self.vehiculos[vehiculo_id].rutas_asignadas_ids:
                self.vehiculos[vehiculo_id].rutas_asignadas_ids.append(ruta_id)
                return self.vehiculos[vehiculo_id]
        return None

    async def remover_ruta_de_vehiculo(self, vehiculo_id: str, ruta_id: str) -> Optional[VehiculoInDB]:
        """Remover ruta de vehículo"""
        if vehiculo_id in self.vehiculos:
            if ruta_id in self.vehiculos[vehiculo_id].rutas_asignadas_ids:
                self.vehiculos[vehiculo_id].rutas_asignadas_ids.remove(ruta_id)
                return self.vehiculos[vehiculo_id]
        return None

    # Métodos para gestión de TUC
    async def asignar_tuc(self, vehiculo_id: str, tuc_data: Tuc) -> Optional[VehiculoInDB]:
        """Asignar TUC a vehículo"""
        if vehiculo_id in self.vehiculos:
            self.vehiculos[vehiculo_id].tuc = tuc_data
            return self.vehiculos[vehiculo_id]
        return None

    async def remover_tuc(self, vehiculo_id: str) -> Optional[VehiculoInDB]:
        """Remover TUC de vehículo"""
        if vehiculo_id in self.vehiculos:
            self.vehiculos[vehiculo_id].tuc = None
            return self.vehiculos[vehiculo_id]
        return None

    # Métodos para cambio de empresa
    async def cambiar_empresa(self, vehiculo_id: str, nueva_empresa_id: str) -> Optional[VehiculoInDB]:
        """Cambiar empresa del vehículo"""
        if vehiculo_id in self.vehiculos:
            self.vehiculos[vehiculo_id].empresa_actual_id = nueva_empresa_id
            self.vehiculos[vehiculo_id].fecha_actualizacion = datetime.utcnow()
            return self.vehiculos[vehiculo_id]
        return None 