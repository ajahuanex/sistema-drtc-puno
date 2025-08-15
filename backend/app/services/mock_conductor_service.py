from typing import List, Optional, Dict
from datetime import datetime, date, timedelta
from app.models.conductor import (
    ConductorCreate, 
    ConductorUpdate, 
    ConductorInDB,
    ConductorFiltros,
    EstadoConductor,
    EstadoLicencia,
    TipoLicencia,
    Genero,
    EstadoCivil
)
from app.services.mock_data import mock_service

class MockConductorService:
    """Servicio mock para conductores en desarrollo"""
    
    def __init__(self):
        self.conductores = mock_service.conductores

    async def create_conductor(self, conductor_data: ConductorCreate) -> ConductorInDB:
        """Crear nuevo conductor"""
        # Verificar si ya existe un conductor con el mismo DNI
        existing_conductor = await self.get_conductor_by_dni(conductor_data.dni)
        if existing_conductor:
            raise ValueError(f"Ya existe un conductor con DNI {conductor_data.dni}")
        
        # Verificar si ya existe un conductor con la misma licencia
        existing_licencia = await self.get_conductor_by_licencia(conductor_data.numeroLicencia)
        if existing_licencia:
            raise ValueError(f"Ya existe un conductor con licencia {conductor_data.numeroLicencia}")
        
        # Generar nuevo ID
        new_id = str(len(self.conductores) + 1)
        
        # Calcular nombre completo
        nombre_completo = f"{conductor_data.apellidoPaterno} {conductor_data.apellidoMaterno}, {conductor_data.nombres}"
        
        # Verificar estado de licencia
        estado_licencia = self._verificar_estado_licencia(conductor_data.fechaVencimientoLicencia)
        
        conductor_dict = conductor_data.model_dump()
        conductor_dict.update({
            "id": new_id,
            # nombreCompleto se genera dinámicamente en el router
            "estadoLicencia": estado_licencia,
            "estado": EstadoConductor.ACTIVO,
            "estaActivo": True,
            "fechaRegistro": datetime.utcnow(),
            "documentosIds": [],
            "restricciones": []
        })
        
        new_conductor = ConductorInDB(**conductor_dict)
        self.conductores[new_id] = new_conductor
        
        return new_conductor

    async def get_conductor_by_id(self, conductor_id: str) -> Optional[ConductorInDB]:
        """Obtener conductor por ID"""
        return self.conductores.get(conductor_id)

    async def get_conductor_by_dni(self, dni: str) -> Optional[ConductorInDB]:
        """Obtener conductor por DNI"""
        for conductor in self.conductores.values():
            if conductor.dni == dni:
                return conductor
        return None

    async def get_conductor_by_licencia(self, numero_licencia: str) -> Optional[ConductorInDB]:
        """Obtener conductor por número de licencia"""
        for conductor in self.conductores.values():
            if conductor.numeroLicencia == numero_licencia:
                return conductor
        return None

    async def get_conductores(self, skip: int = 0, limit: int = 100, estado: Optional[str] = None, empresa_id: Optional[str] = None) -> List[ConductorInDB]:
        """Obtener todos los conductores con paginación y filtros básicos"""
        conductores = list(self.conductores.values())
        
        # Aplicar filtros básicos
        if estado:
            conductores = [c for c in conductores if c.estado.value == estado]
        
        if empresa_id:
            conductores = [c for c in conductores if c.empresaId == empresa_id]
        
        # Filtrar solo conductores activos
        conductores = [c for c in conductores if c.estaActivo]
        
        # Aplicar paginación
        start = skip
        end = skip + limit
        return conductores[start:end]

    async def get_conductores_activos(self) -> List[ConductorInDB]:
        """Obtener todos los conductores activos"""
        return [conductor for conductor in self.conductores.values() if conductor.estaActivo]

    async def get_conductores_por_estado(self, estado: EstadoConductor) -> List[ConductorInDB]:
        """Obtener conductores por estado"""
        return [conductor for conductor in self.conductores.values() 
                if conductor.estado == estado and conductor.estaActivo]

    async def get_conductores_por_empresa(self, empresa_id: str) -> List[ConductorInDB]:
        """Obtener conductores por empresa"""
        return [conductor for conductor in self.conductores.values() 
                if conductor.empresaId == empresa_id and conductor.estaActivo]

    async def get_conductores_con_filtros(self, filtros: ConductorFiltros) -> List[ConductorInDB]:
        """Obtener conductores con filtros avanzados"""
        conductores = list(self.conductores.values())
        
        # Aplicar filtros
        if filtros.dni:
            conductores = [c for c in conductores if filtros.dni.upper() in c.dni.upper()]
        
        if filtros.nombres:
            conductores = [c for c in conductores 
                         if filtros.nombres.lower() in c.nombres.lower()]
        
        if filtros.apellidoPaterno:
            conductores = [c for c in conductores 
                         if filtros.apellidoPaterno.lower() in c.apellidoPaterno.lower()]
        
        if filtros.apellidoMaterno:
            conductores = [c for c in conductores 
                         if filtros.apellidoMaterno.lower() in c.apellidoMaterno.lower()]
        
        if filtros.numeroLicencia:
            conductores = [c for c in conductores 
                         if filtros.numeroLicencia.upper() in c.numeroLicencia.upper()]
        
        if filtros.categoriaLicencia:
            conductores = [c for c in conductores 
                         if filtros.categoriaLicencia in c.categoriaLicencia]
        
        if filtros.estadoLicencia:
            conductores = [c for c in conductores if c.estadoLicencia == filtros.estadoLicencia]
        
        if filtros.estado:
            conductores = [c for c in conductores if c.estado == filtros.estado]
        
        if filtros.empresaId:
            conductores = [c for c in conductores if c.empresaId == filtros.empresaId]
        
        if filtros.distrito:
            conductores = [c for c in conductores 
                         if filtros.distrito.lower() in c.distrito.lower()]
        
        if filtros.provincia:
            conductores = [c for c in conductores 
                         if filtros.provincia.lower() in c.provincia.lower()]
        
        if filtros.departamento:
            conductores = [c for c in conductores 
                         if filtros.departamento.lower() in c.departamento.lower()]
        
        if filtros.fechaVencimientoDesde:
            conductores = [c for c in conductores 
                         if c.fechaVencimientoLicencia >= filtros.fechaVencimientoDesde]
        
        if filtros.fechaVencimientoHasta:
            conductores = [c for c in conductores 
                         if c.fechaVencimientoLicencia <= filtros.fechaVencimientoHasta]
        
        if filtros.experienciaMinima is not None:
            conductores = [c for c in conductores 
                         if c.experienciaAnos and c.experienciaAnos >= filtros.experienciaMinima]
        
        if filtros.experienciaMaxima is not None:
            conductores = [c for c in conductores 
                         if c.experienciaAnos and c.experienciaAnos <= filtros.experienciaMaxima]
        
        return [c for c in conductores if c.estaActivo]

    async def update_conductor(self, conductor_id: str, conductor_data: ConductorUpdate) -> Optional[ConductorInDB]:
        """Actualizar conductor"""
        if conductor_id not in self.conductores:
            return None
        
        conductor = self.conductores[conductor_id]
        update_data = conductor_data.model_dump(exclude_unset=True)
        
        if update_data:
            # Si se actualiza el nombre, recalcular nombre completo
            if 'nombres' in update_data or 'apellidoPaterno' in update_data or 'apellidoMaterno' in update_data:
                nombres = update_data.get('nombres', conductor.nombres)
                apellido_paterno = update_data.get('apellidoPaterno', conductor.apellidoPaterno)
                apellido_materno = update_data.get('apellidoMaterno', conductor.apellidoMaterno)
                # update_data['nombreCompleto'] = f"{apellido_paterno} {apellido_materno}, {nombres}"
            
            # Si se actualiza la fecha de vencimiento de licencia, verificar estado
            if 'fechaVencimientoLicencia' in update_data:
                update_data['estadoLicencia'] = self._verificar_estado_licencia(update_data['fechaVencimientoLicencia'])
            
            # Actualizar campos
            for key, value in update_data.items():
                setattr(conductor, key, value)
            
            # Actualizar fecha de actualización
            conductor.fechaActualizacion = datetime.utcnow()
            
            return conductor
        
        return None

    async def soft_delete_conductor(self, conductor_id: str) -> bool:
        """Desactivar conductor (borrado lógico)"""
        if conductor_id in self.conductores:
            self.conductores[conductor_id].estaActivo = False
            self.conductores[conductor_id].estado = EstadoConductor.DADO_DE_BAJA
            self.conductores[conductor_id].fechaActualizacion = datetime.utcnow()
            return True
        return False

    async def cambiar_estado_conductor(self, conductor_id: str, nuevo_estado: EstadoConductor) -> Optional[ConductorInDB]:
        """Cambiar estado del conductor"""
        if conductor_id in self.conductores:
            conductor = self.conductores[conductor_id]
            conductor.estado = nuevo_estado
            conductor.fechaActualizacion = datetime.utcnow()
            return conductor
        return None

    async def asignar_empresa(self, conductor_id: str, empresa_id: str, cargo: str = None) -> Optional[ConductorInDB]:
        """Asignar conductor a una empresa"""
        if conductor_id in self.conductores:
            conductor = self.conductores[conductor_id]
            conductor.empresaId = empresa_id
            conductor.cargo = cargo
            conductor.fechaIngreso = datetime.now().date()
            conductor.fechaActualizacion = datetime.utcnow()
            return conductor
        return None

    async def desasignar_empresa(self, conductor_id: str) -> Optional[ConductorInDB]:
        """Desasignar conductor de empresa"""
        if conductor_id in self.conductores:
            conductor = self.conductores[conductor_id]
            conductor.empresaId = None
            conductor.cargo = None
            conductor.fechaIngreso = None
            conductor.fechaActualizacion = datetime.utcnow()
            return conductor
        return None

    async def verificar_licencia(self, conductor_id: str) -> Optional[ConductorInDB]:
        """Verificar estado de licencia del conductor"""
        if conductor_id in self.conductores:
            conductor = self.conductores[conductor_id]
            conductor.estadoLicencia = self._verificar_estado_licencia(conductor.fechaVencimientoLicencia)
            conductor.fechaUltimaVerificacion = datetime.utcnow()
            conductor.fechaActualizacion = datetime.utcnow()
            return conductor
        return None

    async def get_estadisticas(self) -> Dict:
        """Obtener estadísticas de conductores"""
        conductores_activos = [c for c in self.conductores.values() if c.estaActivo]
        
        # Contar por estado
        estados = {}
        for estado in EstadoConductor:
            estados[estado.value] = len([c for c in conductores_activos if c.estado == estado])
        
        # Contar por estado de licencia
        licencias_vigentes = len([c for c in conductores_activos if c.estadoLicencia == EstadoLicencia.VIGENTE])
        licencias_vencidas = len([c for c in conductores_activos if c.estadoLicencia == EstadoLicencia.VENCIDA])
        licencias_por_vencer = len([c for c in conductores_activos 
                                  if c.estadoLicencia == EstadoLicencia.VIGENTE and 
                                  c.fechaVencimientoLicencia <= (datetime.now().date() + timedelta(days=30))])
        
        # Distribución por género
        generos = {}
        for genero in Genero:
            generos[genero.value] = len([c for c in conductores_activos if c.genero == genero])
        
        # Distribución por edad
        edades = {"18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "56-65": 0, "65+": 0}
        for conductor in conductores_activos:
            edad = (datetime.now().date() - conductor.fechaNacimiento).days / 365.25
            if edad <= 25:
                edades["18-25"] += 1
            elif edad <= 35:
                edades["26-35"] += 1
            elif edad <= 45:
                edades["36-45"] += 1
            elif edad <= 55:
                edades["46-55"] += 1
            elif edad <= 65:
                edades["56-65"] += 1
            else:
                edades["65+"] += 1
        
        # Distribución por categoría de licencia
        categorias = {}
        for categoria in TipoLicencia:
            categorias[categoria.value] = len([c for c in conductores_activos 
                                            if categoria in c.categoriaLicencia])
        
        # Promedio de experiencia
        experiencias = [c.experienciaAnos for c in conductores_activos if c.experienciaAnos]
        promedio_experiencia = sum(experiencias) / len(experiencias) if experiencias else 0
        
        return {
            'total': len(conductores_activos),
            'estados': estados,
            'licenciasVigentes': licencias_vigentes,
            'licenciasVencidas': licencias_vencidas,
            'licenciasPorVencer': licencias_por_vencer,
            'distribucionPorGenero': generos,
            'distribucionPorEdad': edades,
            'distribucionPorCategoria': categorias,
            'promedioExperiencia': round(promedio_experiencia, 1)
        }

    async def get_conductores_por_vencer_licencia(self, dias: int = 30) -> List[ConductorInDB]:
        """Obtener conductores cuya licencia vence en los próximos días"""
        fecha_limite = datetime.now().date() + timedelta(days=dias)
        return [conductor for conductor in self.conductores.values() 
                if conductor.estaActivo and 
                conductor.estadoLicencia == EstadoLicencia.VIGENTE and
                conductor.fechaVencimientoLicencia <= fecha_limite]

    async def get_conductores_licencia_vencida(self) -> List[ConductorInDB]:
        """Obtener conductores con licencia vencida"""
        return [conductor for conductor in self.conductores.values() 
                if conductor.estaActivo and conductor.estadoLicencia == EstadoLicencia.VENCIDA]

    def _verificar_estado_licencia(self, fecha_vencimiento: date) -> EstadoLicencia:
        """Verificar estado de licencia basado en fecha de vencimiento"""
        hoy = datetime.now().date()
        
        if fecha_vencimiento < hoy:
            return EstadoLicencia.VENCIDA
        elif fecha_vencimiento <= (hoy + timedelta(days=30)):
            return EstadoLicencia.VIGENTE  # Por vencer
        else:
            return EstadoLicencia.VIGENTE

    async def validar_dni_unico(self, dni: str, conductor_id_excluir: str = None) -> bool:
        """Validar que el DNI sea único"""
        for conductor in self.conductores.values():
            if conductor.dni == dni and conductor.id != conductor_id_excluir:
                return False
        return True

    async def validar_licencia_unica(self, numero_licencia: str, conductor_id_excluir: str = None) -> bool:
        """Validar que el número de licencia sea único"""
        for conductor in self.conductores.values():
            if conductor.numeroLicencia == numero_licencia and conductor.id != conductor_id_excluir:
                return False
        return True
