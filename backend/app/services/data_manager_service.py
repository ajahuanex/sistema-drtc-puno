from typing import Dict, List, Optional, Any, Set
from datetime import datetime, date, timedelta
from dataclasses import dataclass, field
import json
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)

@dataclass
class RelacionesModulo:
    """Clase para rastrear relaciones entre módulos"""
    empresas_vehiculos: Dict[str, List[str]] = field(default_factory=dict)
    empresas_conductores: Dict[str, List[str]] = field(default_factory=dict)
    empresas_rutas: Dict[str, List[str]] = field(default_factory=dict)
    vehiculos_conductores: Dict[str, List[str]] = field(default_factory=dict)
    conductores_vehiculos: Dict[str, List[str]] = field(default_factory=dict)
    rutas_vehiculos: Dict[str, List[str]] = field(default_factory=dict)
    vehiculos_expedientes: Dict[str, List[str]] = field(default_factory=dict)
    expedientes_resoluciones: Dict[str, List[str]] = field(default_factory=dict)
    vehiculos_historial: Dict[str, List[str]] = field(default_factory=dict)

@dataclass
class EstadisticasGlobales:
    """Estadísticas globales del sistema"""
    total_empresas: int = 0
    total_vehiculos: int = 0
    total_conductores: int = 0
    total_rutas: int = 0
    total_expedientes: int = 0
    total_resoluciones: int = 0
    total_validaciones: int = 0
    
    # Estadísticas por estado
    vehiculos_por_estado: Dict[str, int] = field(default_factory=dict)
    conductores_por_estado: Dict[str, int] = field(default_factory=dict)
    expedientes_por_estado: Dict[str, int] = field(default_factory=dict)
    
    # Relaciones activas
    vehiculos_con_conductor: int = 0
    vehiculos_sin_conductor: int = 0
    conductores_con_vehiculo: int = 0
    conductores_sin_vehiculo: int = 0
    
    # Fechas importantes
    ultima_actualizacion: datetime = field(default_factory=datetime.now)
    inicio_sesion: datetime = field(default_factory=datetime.now)

class DataManagerService:
    """Servicio central para gestión de datos persistentes en memoria"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DataManagerService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """Inicializar la instancia única"""
        # Almacenes de datos por módulo
        self.empresas: Dict[str, Dict] = {}
        self.vehiculos: Dict[str, Dict] = {}
        self.conductores: Dict[str, Dict] = {}
        self.rutas: Dict[str, Dict] = {}
        self.expedientes: Dict[str, Dict] = {}
        self.resoluciones: Dict[str, Dict] = {}
        self.validaciones_historial: Dict[str, List[Dict]] = {}
        
        # Sistema de relaciones
        self.relaciones = RelacionesModulo()
        
        # Estadísticas globales
        self.estadisticas = EstadisticasGlobales()
        
        # Contadores para IDs únicos
        self.contadores = {
            'empresas': 1,
            'vehiculos': 1,
            'conductores': 1,
            'rutas': 1,
            'expedientes': 1,
            'resoluciones': 1,
            'validaciones': 1
        }
        
        # Log de operaciones
        self.log_operaciones: List[Dict] = []
        
        # Inicializar con datos de prueba
        self._inicializar_datos_relacionados()
        
        logger.info("🗄️ DataManagerService inicializado como singleton con datos relacionados")
    
    def _inicializar_datos_relacionados(self):
        """Inicializar datos de prueba con relaciones completas"""
        
        # 1. EMPRESAS
        empresas_data = [
            {
                "id": "1",
                "razonSocial": "Transportes Titicaca S.A.C.",
                "ruc": "20123456789",
                "representanteLegal": "Juan Pérez Mamani",
                "telefono": "051-123456",
                "email": "contacto@titicaca.com",
                "direccion": "Av. El Sol 123, Puno",
                "estado": "ACTIVO",
                "fechaConstitucion": "2020-01-15",
                "modalidadServicio": "REGULAR",
                "tipoEmpresa": "MEDIANA"
            },
            {
                "id": "2", 
                "razonSocial": "Empresa de Transportes Altiplano E.I.R.L.",
                "ruc": "20987654321",
                "representanteLegal": "María Quispe Condori",
                "telefono": "051-654321",
                "email": "info@altiplano.com",
                "direccion": "Jr. Lima 456, Juliaca",
                "estado": "ACTIVO",
                "fechaConstitucion": "2019-06-20",
                "modalidadServicio": "REGULAR",
                "tipoEmpresa": "PEQUEÑA"
            },
            {
                "id": "3",
                "razonSocial": "Transportes Lago Sagrado S.R.L.",
                "ruc": "20555666777",
                "representanteLegal": "Carlos Mamani Huanca",
                "telefono": "051-789123",
                "email": "gerencia@lagosagrado.com",
                "direccion": "Av. Circunvalación 789, Puno",
                "estado": "ACTIVO",
                "fechaConstitucion": "2021-03-10",
                "modalidadServicio": "TURISTICO",
                "tipoEmpresa": "GRANDE"
            }
        ]
        
        for empresa in empresas_data:
            self.agregar_empresa(empresa)
        
        # 2. VEHÍCULOS
        vehiculos_data = [
            {
                "id": "1",
                "empresaId": "1",
                "placa": "ABC-123",
                "numeroTarjetaCirculacion": "TC001",
                "marca": "MERCEDES BENZ",
                "modelo": "OH-1628",
                "año": 2020,
                "numeroAsientos": 45,
                "numeroMotor": "OM906LA001",
                "numeroChasis": "8JMOH1628LA001",
                "combustible": "DIESEL",
                "cilindrada": 6374,
                "potencia": 280,
                "pesoSeco": 8500,
                "pesoBruto": 16000,
                "cargaUtil": 7500,
                "estado": "ACTIVO",
                "fechaFabricacion": "2020-05-15",
                "fechaImportacion": "2020-06-20"
            },
            {
                "id": "2",
                "empresaId": "1", 
                "placa": "DEF-456",
                "numeroTarjetaCirculacion": "TC002",
                "marca": "VOLVO",
                "modelo": "B7R",
                "año": 2019,
                "numeroAsientos": 42,
                "numeroMotor": "D7E290002",
                "numeroChasis": "YV3R4X20XKA002",
                "combustible": "DIESEL",
                "cilindrada": 7142,
                "potencia": 290,
                "pesoSeco": 9200,
                "pesoBruto": 17000,
                "cargaUtil": 7800,
                "estado": "ACTIVO",
                "fechaFabricacion": "2019-08-10",
                "fechaImportacion": "2019-09-15"
            },
            {
                "id": "3",
                "empresaId": "2",
                "placa": "GHI-789",
                "numeroTarjetaCirculacion": "TC003",
                "marca": "SCANIA",
                "modelo": "K360IB",
                "año": 2021,
                "numeroAsientos": 48,
                "numeroMotor": "DC09108003",
                "numeroChasis": "9BSK4X2X0MA003",
                "combustible": "DIESEL",
                "cilindrada": 8870,
                "potencia": 360,
                "pesoSeco": 9800,
                "pesoBruto": 18000,
                "cargaUtil": 8200,
                "estado": "ACTIVO",
                "fechaFabricacion": "2021-02-20",
                "fechaImportacion": "2021-03-25"
            },
            {
                "id": "4",
                "empresaId": "2",
                "placa": "JKL-012",
                "numeroTarjetaCirculacion": "TC004",
                "marca": "MERCEDES BENZ",
                "modelo": "OH-1721",
                "año": 2018,
                "numeroAsientos": 40,
                "numeroMotor": "OM906LA004",
                "numeroChasis": "8JMOH1721JA004",
                "combustible": "DIESEL",
                "cilindrada": 6374,
                "potencia": 280,
                "pesoSeco": 8200,
                "pesoBruto": 15500,
                "cargaUtil": 7300,
                "estado": "MANTENIMIENTO",
                "fechaFabricacion": "2018-11-05",
                "fechaImportacion": "2018-12-10"
            },
            {
                "id": "5",
                "empresaId": "3",
                "placa": "MNO-345",
                "numeroTarjetaCirculacion": "TC005",
                "marca": "IVECO",
                "modelo": "MAGELYS PRO",
                "año": 2022,
                "numeroAsientos": 35,
                "numeroMotor": "F4AE3681D005",
                "numeroChasis": "ZCFC4A1A0NA005",
                "combustible": "DIESEL",
                "cilindrada": 5880,
                "potencia": 320,
                "pesoSeco": 8800,
                "pesoBruto": 16500,
                "cargaUtil": 7700,
                "estado": "ACTIVO",
                "fechaFabricacion": "2022-01-15",
                "fechaImportacion": "2022-02-20"
            }
        ]
        
        for vehiculo in vehiculos_data:
            self.agregar_vehiculo(vehiculo)
        
        # 3. CONDUCTORES
        conductores_data = [
            {
                "id": "1",
                "empresaId": "1",
                "codigoConductor": "COND001",
                "nombres": "Juan Carlos",
                "apellidoPaterno": "García",
                "apellidoMaterno": "López",
                "dni": "12345678",
                "fechaNacimiento": "1985-03-15",
                "telefono": "987654321",
                "email": "juan.garcia@email.com",
                "numeroLicencia": "P12345678",
                "categoria": "B-III",
                "fechaVencimiento": "2025-01-15",
                "tipoConductor": "TITULAR",
                "estado": "ACTIVO",
                "vehiculosAsignadosIds": ["1"],
                "vehiculoPrincipalId": "1",
                "fechaIngreso": "2023-01-01",
                "salario": 1500.0
            },
            {
                "id": "2",
                "empresaId": "1",
                "codigoConductor": "COND002",
                "nombres": "Ana María",
                "apellidoPaterno": "Quispe",
                "apellidoMaterno": "Mamani",
                "dni": "87654321",
                "fechaNacimiento": "1990-07-22",
                "telefono": "912345678",
                "email": "ana.quispe@email.com",
                "numeroLicencia": "P87654321",
                "categoria": "B-IIA",
                "fechaVencimiento": "2026-05-10",
                "tipoConductor": "SUPLENTE",
                "estado": "ACTIVO",
                "vehiculosAsignadosIds": ["2"],
                "fechaIngreso": "2023-06-15",
                "salario": 1200.0
            },
            {
                "id": "3",
                "empresaId": "2",
                "codigoConductor": "COND003",
                "nombres": "Carlos Alberto",
                "apellidoPaterno": "Mamani",
                "apellidoMaterno": "Choque",
                "dni": "11223344",
                "fechaNacimiento": "1988-12-05",
                "telefono": "998877665",
                "email": "carlos.mamani@email.com",
                "numeroLicencia": "P11223344",
                "categoria": "B-III",
                "fechaVencimiento": "2024-08-20",
                "tipoConductor": "TITULAR",
                "estado": "ACTIVO",
                "vehiculosAsignadosIds": ["3", "4"],
                "vehiculoPrincipalId": "3",
                "fechaIngreso": "2022-03-10",
                "salario": 1800.0
            },
            {
                "id": "4",
                "empresaId": "3",
                "codigoConductor": "COND004",
                "nombres": "Luis Fernando",
                "apellidoPaterno": "Condori",
                "apellidoMaterno": "Apaza",
                "dni": "55667788",
                "fechaNacimiento": "1995-04-18",
                "telefono": "955443322",
                "email": "luis.condori@email.com",
                "numeroLicencia": "P55667788",
                "categoria": "B-I",
                "fechaVencimiento": "2027-01-15",
                "tipoConductor": "PRACTICANTE",
                "estado": "ACTIVO",
                "vehiculosAsignadosIds": ["5"],
                "fechaIngreso": "2024-01-15",
                "salario": 900.0
            }
        ]
        
        for conductor in conductores_data:
            self.agregar_conductor(conductor)
        
        # 4. RUTAS
        rutas_data = [
            {
                "id": "1",
                "empresaId": "1",
                "codigoRuta": "R001",
                "nombre": "Puno - Juliaca",
                "origen": "Puno",
                "destino": "Juliaca",
                "distanciaKm": 45.5,
                "tiempoEstimado": 60,
                "estado": "ACTIVA",
                "vehiculosAsignadosIds": ["1", "2"],
                "tarifaAdulto": 8.50,
                "tarifaNiño": 4.25,
                "frecuenciaDiaria": 12
            },
            {
                "id": "2",
                "empresaId": "2",
                "codigoRuta": "R002",
                "nombre": "Juliaca - Arequipa",
                "origen": "Juliaca",
                "destino": "Arequipa",
                "distanciaKm": 280.0,
                "tiempoEstimado": 300,
                "estado": "ACTIVA",
                "vehiculosAsignadosIds": ["3"],
                "tarifaAdulto": 35.00,
                "tarifaNiño": 17.50,
                "frecuenciaDiaria": 4
            },
            {
                "id": "3",
                "empresaId": "3",
                "codigoRuta": "R003",
                "nombre": "Puno - Cusco (Turístico)",
                "origen": "Puno",
                "destino": "Cusco",
                "distanciaKm": 390.0,
                "tiempoEstimado": 420,
                "estado": "ACTIVA",
                "vehiculosAsignadosIds": ["5"],
                "tarifaAdulto": 85.00,
                "tarifaNiño": 42.50,
                "frecuenciaDiaria": 2,
                "tipoServicio": "TURISTICO"
            }
        ]
        
        for ruta in rutas_data:
            self.agregar_ruta(ruta)
        
        # 5. EXPEDIENTES
        expedientes_data = [
            {
                "id": "1",
                "vehiculoId": "1",
                "numeroExpediente": "EXP-2024-001",
                "tipoTramite": "ALTA",
                "fechaInicio": "2024-01-15",
                "estado": "APROBADO",
                "observaciones": "Expediente de alta inicial del vehículo"
            },
            {
                "id": "2",
                "vehiculoId": "2",
                "numeroExpediente": "EXP-2024-002",
                "tipoTramite": "MODIFICACION",
                "fechaInicio": "2024-02-10",
                "estado": "EN_PROCESO",
                "observaciones": "Modificación de datos técnicos"
            },
            {
                "id": "3",
                "vehiculoId": "3",
                "numeroExpediente": "EXP-2024-003",
                "tipoTramite": "ALTA",
                "fechaInicio": "2024-01-20",
                "estado": "APROBADO",
                "observaciones": "Alta de vehículo nuevo"
            }
        ]
        
        for expediente in expedientes_data:
            self.agregar_expediente(expediente)
        
        # 6. RESOLUCIONES
        resoluciones_data = [
            {
                "id": "1",
                "expedienteId": "1",
                "numeroResolucion": "RES-001-2024",
                "fechaEmision": "2024-01-20",
                "tipoResolucion": "APROBACION",
                "estado": "VIGENTE",
                "observaciones": "Resolución de aprobación de alta"
            },
            {
                "id": "2",
                "expedienteId": "3",
                "numeroResolucion": "RES-002-2024",
                "fechaEmision": "2024-01-25",
                "tipoResolucion": "APROBACION",
                "estado": "VIGENTE",
                "observaciones": "Resolución de aprobación de alta"
            }
        ]
        
        for resolucion in resoluciones_data:
            self.agregar_resolucion(resolucion)
        
        # 7. HISTORIAL DE VALIDACIONES
        self._generar_historial_validaciones()
        
        # Actualizar estadísticas
        self._actualizar_estadisticas()
        
        self._log_operacion("INICIALIZACION", "Sistema inicializado con datos relacionados")
    
    def _generar_historial_validaciones(self):
        """Generar historial de validaciones para los vehículos"""
        
        validaciones_data = [
            {
                "vehiculoId": "1",
                "validaciones": [
                    {
                        "id": "1",
                        "numeroSecuencial": 1,
                        "fechaValidacion": "2024-01-15",
                        "tipoValidacion": "INICIAL",
                        "estado": "APROBADO",
                        "observaciones": "Validación inicial exitosa",
                        "resolucionId": "1"
                    },
                    {
                        "id": "2",
                        "numeroSecuencial": 2,
                        "fechaValidacion": "2024-06-15",
                        "tipoValidacion": "RENOVACION",
                        "estado": "APROBADO",
                        "observaciones": "Renovación semestral"
                    }
                ]
            },
            {
                "vehiculoId": "2",
                "validaciones": [
                    {
                        "id": "3",
                        "numeroSecuencial": 1,
                        "fechaValidacion": "2024-02-10",
                        "tipoValidacion": "INICIAL",
                        "estado": "PENDIENTE",
                        "observaciones": "En proceso de validación"
                    }
                ]
            },
            {
                "vehiculoId": "3",
                "validaciones": [
                    {
                        "id": "4",
                        "numeroSecuencial": 1,
                        "fechaValidacion": "2024-01-20",
                        "tipoValidacion": "INICIAL",
                        "estado": "APROBADO",
                        "observaciones": "Validación inicial exitosa",
                        "resolucionId": "2"
                    }
                ]
            }
        ]
        
        for item in validaciones_data:
            vehiculo_id = item["vehiculoId"]
            self.validaciones_historial[vehiculo_id] = item["validaciones"]
    
    # MÉTODOS PARA AGREGAR DATOS
    
    def agregar_empresa(self, empresa_data: Dict) -> str:
        """Agregar empresa al sistema"""
        empresa_id = empresa_data.get("id", str(self.contadores['empresas']))
        self.empresas[empresa_id] = {
            **empresa_data,
            "id": empresa_id,
            "fechaCreacion": datetime.now().isoformat(),
            "fechaActualizacion": datetime.now().isoformat()
        }
        
        # Inicializar relaciones
        self.relaciones.empresas_vehiculos[empresa_id] = []
        self.relaciones.empresas_conductores[empresa_id] = []
        self.relaciones.empresas_rutas[empresa_id] = []
        
        self.contadores['empresas'] += 1
        self._log_operacion("CREAR", f"Empresa {empresa_id} agregada")
        return empresa_id
    
    def agregar_vehiculo(self, vehiculo_data: Dict) -> str:
        """Agregar vehículo al sistema"""
        vehiculo_id = vehiculo_data.get("id", str(self.contadores['vehiculos']))
        empresa_id = vehiculo_data.get("empresaId")
        
        self.vehiculos[vehiculo_id] = {
            **vehiculo_data,
            "id": vehiculo_id,
            "fechaCreacion": datetime.now().isoformat(),
            "fechaActualizacion": datetime.now().isoformat()
        }
        
        # Actualizar relaciones
        if empresa_id and empresa_id in self.relaciones.empresas_vehiculos:
            if vehiculo_id not in self.relaciones.empresas_vehiculos[empresa_id]:
                self.relaciones.empresas_vehiculos[empresa_id].append(vehiculo_id)
        
        # Inicializar relaciones del vehículo
        self.relaciones.vehiculos_conductores[vehiculo_id] = []
        self.relaciones.vehiculos_expedientes[vehiculo_id] = []
        self.relaciones.vehiculos_historial[vehiculo_id] = []
        
        self.contadores['vehiculos'] += 1
        self._log_operacion("CREAR", f"Vehículo {vehiculo_id} agregado a empresa {empresa_id}")
        return vehiculo_id
    
    def agregar_conductor(self, conductor_data: Dict) -> str:
        """Agregar conductor al sistema"""
        conductor_id = conductor_data.get("id", str(self.contadores['conductores']))
        empresa_id = conductor_data.get("empresaId")
        vehiculos_asignados = conductor_data.get("vehiculosAsignadosIds", [])
        
        self.conductores[conductor_id] = {
            **conductor_data,
            "id": conductor_id,
            "fechaCreacion": datetime.now().isoformat(),
            "fechaActualizacion": datetime.now().isoformat()
        }
        
        # Actualizar relaciones empresa-conductor
        if empresa_id and empresa_id in self.relaciones.empresas_conductores:
            if conductor_id not in self.relaciones.empresas_conductores[empresa_id]:
                self.relaciones.empresas_conductores[empresa_id].append(conductor_id)
        
        # Actualizar relaciones conductor-vehículos
        self.relaciones.conductores_vehiculos[conductor_id] = vehiculos_asignados
        
        # Actualizar relaciones vehículo-conductor
        for vehiculo_id in vehiculos_asignados:
            if vehiculo_id not in self.relaciones.vehiculos_conductores:
                self.relaciones.vehiculos_conductores[vehiculo_id] = []
            if conductor_id not in self.relaciones.vehiculos_conductores[vehiculo_id]:
                self.relaciones.vehiculos_conductores[vehiculo_id].append(conductor_id)
        
        self.contadores['conductores'] += 1
        self._log_operacion("CREAR", f"Conductor {conductor_id} agregado a empresa {empresa_id}")
        return conductor_id
    
    def agregar_ruta(self, ruta_data: Dict) -> str:
        """Agregar ruta al sistema"""
        ruta_id = ruta_data.get("id", str(self.contadores['rutas']))
        empresa_id = ruta_data.get("empresaId")
        vehiculos_asignados = ruta_data.get("vehiculosAsignadosIds", [])
        
        self.rutas[ruta_id] = {
            **ruta_data,
            "id": ruta_id,
            "fechaCreacion": datetime.now().isoformat(),
            "fechaActualizacion": datetime.now().isoformat()
        }
        
        # Actualizar relaciones empresa-ruta
        if empresa_id and empresa_id in self.relaciones.empresas_rutas:
            if ruta_id not in self.relaciones.empresas_rutas[empresa_id]:
                self.relaciones.empresas_rutas[empresa_id].append(ruta_id)
        
        # Actualizar relaciones ruta-vehículos
        for vehiculo_id in vehiculos_asignados:
            if vehiculo_id not in self.relaciones.rutas_vehiculos:
                self.relaciones.rutas_vehiculos[vehiculo_id] = []
            if ruta_id not in self.relaciones.rutas_vehiculos[vehiculo_id]:
                self.relaciones.rutas_vehiculos[vehiculo_id].append(ruta_id)
        
        self.contadores['rutas'] += 1
        self._log_operacion("CREAR", f"Ruta {ruta_id} agregada a empresa {empresa_id}")
        return ruta_id
    
    def agregar_expediente(self, expediente_data: Dict) -> str:
        """Agregar expediente al sistema"""
        expediente_id = expediente_data.get("id", str(self.contadores['expedientes']))
        vehiculo_id = expediente_data.get("vehiculoId")
        
        self.expedientes[expediente_id] = {
            **expediente_data,
            "id": expediente_id,
            "fechaCreacion": datetime.now().isoformat(),
            "fechaActualizacion": datetime.now().isoformat()
        }
        
        # Actualizar relaciones vehículo-expediente
        if vehiculo_id and vehiculo_id in self.relaciones.vehiculos_expedientes:
            if expediente_id not in self.relaciones.vehiculos_expedientes[vehiculo_id]:
                self.relaciones.vehiculos_expedientes[vehiculo_id].append(expediente_id)
        
        # Inicializar relaciones del expediente
        self.relaciones.expedientes_resoluciones[expediente_id] = []
        
        self.contadores['expedientes'] += 1
        self._log_operacion("CREAR", f"Expediente {expediente_id} agregado para vehículo {vehiculo_id}")
        return expediente_id
    
    def agregar_resolucion(self, resolucion_data: Dict) -> str:
        """Agregar resolución al sistema"""
        resolucion_id = resolucion_data.get("id", str(self.contadores['resoluciones']))
        expediente_id = resolucion_data.get("expedienteId")
        
        self.resoluciones[resolucion_id] = {
            **resolucion_data,
            "id": resolucion_id,
            "fechaCreacion": datetime.now().isoformat(),
            "fechaActualizacion": datetime.now().isoformat()
        }
        
        # Actualizar relaciones expediente-resolución
        if expediente_id and expediente_id in self.relaciones.expedientes_resoluciones:
            if resolucion_id not in self.relaciones.expedientes_resoluciones[expediente_id]:
                self.relaciones.expedientes_resoluciones[expediente_id].append(resolucion_id)
        
        self.contadores['resoluciones'] += 1
        self._log_operacion("CREAR", f"Resolución {resolucion_id} agregada para expediente {expediente_id}")
        return resolucion_id
    
    def agregar_validacion_historial(self, vehiculo_id: str, validacion_data: Dict) -> str:
        """Agregar validación al historial de un vehículo"""
        validacion_id = validacion_data.get("id", str(self.contadores['validaciones']))
        
        if vehiculo_id not in self.validaciones_historial:
            self.validaciones_historial[vehiculo_id] = []
        
        # Calcular número secuencial
        numero_secuencial = len(self.validaciones_historial[vehiculo_id]) + 1
        
        validacion = {
            **validacion_data,
            "id": validacion_id,
            "numeroSecuencial": numero_secuencial,
            "fechaCreacion": datetime.now().isoformat()
        }
        
        self.validaciones_historial[vehiculo_id].append(validacion)
        
        # Actualizar relaciones
        if vehiculo_id not in self.relaciones.vehiculos_historial:
            self.relaciones.vehiculos_historial[vehiculo_id] = []
        self.relaciones.vehiculos_historial[vehiculo_id].append(validacion_id)
        
        self.contadores['validaciones'] += 1
        self._log_operacion("CREAR", f"Validación {validacion_id} agregada al historial del vehículo {vehiculo_id}")
        return validacion_id
    
    # MÉTODOS DE CONSULTA
    
    def obtener_empresa_completa(self, empresa_id: str) -> Optional[Dict]:
        """Obtener empresa con todas sus relaciones"""
        if empresa_id not in self.empresas:
            return None
        
        empresa = self.empresas[empresa_id].copy()
        
        # Agregar vehículos relacionados
        vehiculos_ids = self.relaciones.empresas_vehiculos.get(empresa_id, [])
        empresa["vehiculos"] = [self.vehiculos.get(vid) for vid in vehiculos_ids if vid in self.vehiculos]
        
        # Agregar conductores relacionados
        conductores_ids = self.relaciones.empresas_conductores.get(empresa_id, [])
        empresa["conductores"] = [self.conductores.get(cid) for cid in conductores_ids if cid in self.conductores]
        
        # Agregar rutas relacionadas
        rutas_ids = self.relaciones.empresas_rutas.get(empresa_id, [])
        empresa["rutas"] = [self.rutas.get(rid) for rid in rutas_ids if rid in self.rutas]
        
        # Estadísticas de la empresa
        empresa["estadisticas"] = {
            "total_vehiculos": len(vehiculos_ids),
            "total_conductores": len(conductores_ids),
            "total_rutas": len(rutas_ids),
            "vehiculos_activos": len([v for v in empresa["vehiculos"] if v and v.get("estado") == "ACTIVO"]),
            "conductores_activos": len([c for c in empresa["conductores"] if c and c.get("estado") == "ACTIVO"])
        }
        
        return empresa
    
    def obtener_vehiculo_completo(self, vehiculo_id: str) -> Optional[Dict]:
        """Obtener vehículo con todas sus relaciones"""
        if vehiculo_id not in self.vehiculos:
            return None
        
        vehiculo = self.vehiculos[vehiculo_id].copy()
        
        # Agregar empresa
        empresa_id = vehiculo.get("empresaId")
        if empresa_id and empresa_id in self.empresas:
            vehiculo["empresa"] = self.empresas[empresa_id]
        
        # Agregar conductores asignados
        conductores_ids = self.relaciones.vehiculos_conductores.get(vehiculo_id, [])
        vehiculo["conductores"] = [self.conductores.get(cid) for cid in conductores_ids if cid in self.conductores]
        
        # Agregar expedientes
        expedientes_ids = self.relaciones.vehiculos_expedientes.get(vehiculo_id, [])
        vehiculo["expedientes"] = [self.expedientes.get(eid) for eid in expedientes_ids if eid in self.expedientes]
        
        # Agregar historial de validaciones
        vehiculo["historial_validaciones"] = self.validaciones_historial.get(vehiculo_id, [])
        
        # Agregar rutas donde está asignado
        rutas_asignadas = []
        for ruta_id, vehiculos_ruta in self.relaciones.rutas_vehiculos.items():
            if vehiculo_id in vehiculos_ruta and ruta_id in self.rutas:
                rutas_asignadas.append(self.rutas[ruta_id])
        vehiculo["rutas"] = rutas_asignadas
        
        return vehiculo
    
    def obtener_flujo_completo_vehiculo(self, vehiculo_id: str) -> Optional[Dict]:
        """Obtener el flujo completo de un vehículo (desde empresa hasta resoluciones)"""
        vehiculo_completo = self.obtener_vehiculo_completo(vehiculo_id)
        if not vehiculo_completo:
            return None
        
        # Enriquecer expedientes con sus resoluciones
        for expediente in vehiculo_completo.get("expedientes", []):
            if expediente:
                expediente_id = expediente["id"]
                resoluciones_ids = self.relaciones.expedientes_resoluciones.get(expediente_id, [])
                expediente["resoluciones"] = [
                    self.resoluciones.get(rid) for rid in resoluciones_ids 
                    if rid in self.resoluciones
                ]
        
        # Agregar timeline de eventos
        timeline = []
        
        # Eventos de creación
        timeline.append({
            "fecha": vehiculo_completo.get("fechaCreacion"),
            "tipo": "CREACION_VEHICULO",
            "descripcion": f"Vehículo {vehiculo_completo.get('placa')} creado"
        })
        
        # Eventos de expedientes
        for expediente in vehiculo_completo.get("expedientes", []):
            if expediente:
                timeline.append({
                    "fecha": expediente.get("fechaInicio"),
                    "tipo": "EXPEDIENTE",
                    "descripcion": f"Expediente {expediente.get('numeroExpediente')} - {expediente.get('tipoTramite')}"
                })
                
                # Eventos de resoluciones
                for resolucion in expediente.get("resoluciones", []):
                    if resolucion:
                        timeline.append({
                            "fecha": resolucion.get("fechaEmision"),
                            "tipo": "RESOLUCION",
                            "descripcion": f"Resolución {resolucion.get('numeroResolucion')} - {resolucion.get('tipoResolucion')}"
                        })
        
        # Eventos de validaciones
        for validacion in vehiculo_completo.get("historial_validaciones", []):
            timeline.append({
                "fecha": validacion.get("fechaValidacion"),
                "tipo": "VALIDACION",
                "descripcion": f"Validación #{validacion.get('numeroSecuencial')} - {validacion.get('tipoValidacion')}"
            })
        
        # Ordenar timeline por fecha
        timeline.sort(key=lambda x: x.get("fecha", ""), reverse=True)
        vehiculo_completo["timeline"] = timeline
        
        return vehiculo_completo
    
    def obtener_estadisticas_globales(self) -> Dict:
        """Obtener estadísticas globales del sistema"""
        self._actualizar_estadisticas()
        
        return {
            "estadisticas_generales": {
                "total_empresas": self.estadisticas.total_empresas,
                "total_vehiculos": self.estadisticas.total_vehiculos,
                "total_conductores": self.estadisticas.total_conductores,
                "total_rutas": self.estadisticas.total_rutas,
                "total_expedientes": self.estadisticas.total_expedientes,
                "total_resoluciones": self.estadisticas.total_resoluciones,
                "total_validaciones": self.estadisticas.total_validaciones
            },
            "estadisticas_por_estado": {
                "vehiculos": self.estadisticas.vehiculos_por_estado,
                "conductores": self.estadisticas.conductores_por_estado,
                "expedientes": self.estadisticas.expedientes_por_estado
            },
            "relaciones_activas": {
                "vehiculos_con_conductor": self.estadisticas.vehiculos_con_conductor,
                "vehiculos_sin_conductor": self.estadisticas.vehiculos_sin_conductor,
                "conductores_con_vehiculo": self.estadisticas.conductores_con_vehiculo,
                "conductores_sin_vehiculo": self.estadisticas.conductores_sin_vehiculo
            },
            "informacion_sesion": {
                "inicio_sesion": self.estadisticas.inicio_sesion.isoformat(),
                "ultima_actualizacion": self.estadisticas.ultima_actualizacion.isoformat(),
                "tiempo_activo": str(datetime.now() - self.estadisticas.inicio_sesion)
            },
            "log_operaciones_recientes": self.log_operaciones[-10:]  # Últimas 10 operaciones
        }
    
    def obtener_mapa_relaciones(self) -> Dict:
        """Obtener mapa completo de relaciones del sistema"""
        return {
            "empresas_vehiculos": dict(self.relaciones.empresas_vehiculos),
            "empresas_conductores": dict(self.relaciones.empresas_conductores),
            "empresas_rutas": dict(self.relaciones.empresas_rutas),
            "vehiculos_conductores": dict(self.relaciones.vehiculos_conductores),
            "conductores_vehiculos": dict(self.relaciones.conductores_vehiculos),
            "rutas_vehiculos": dict(self.relaciones.rutas_vehiculos),
            "vehiculos_expedientes": dict(self.relaciones.vehiculos_expedientes),
            "expedientes_resoluciones": dict(self.relaciones.expedientes_resoluciones),
            "vehiculos_historial": dict(self.relaciones.vehiculos_historial)
        }
    
    def buscar_por_criterios(self, modulo: str, criterios: Dict) -> List[Dict]:
        """Buscar elementos por criterios específicos"""
        resultados = []
        
        if modulo == "empresas":
            datos = self.empresas
        elif modulo == "vehiculos":
            datos = self.vehiculos
        elif modulo == "conductores":
            datos = self.conductores
        elif modulo == "rutas":
            datos = self.rutas
        elif modulo == "expedientes":
            datos = self.expedientes
        elif modulo == "resoluciones":
            datos = self.resoluciones
        else:
            return []
        
        for item_id, item_data in datos.items():
            coincide = True
            for campo, valor in criterios.items():
                if campo not in item_data or item_data[campo] != valor:
                    coincide = False
                    break
            
            if coincide:
                resultados.append(item_data)
        
        return resultados
    
    # MÉTODOS INTERNOS
    
    def _actualizar_estadisticas(self):
        """Actualizar estadísticas globales"""
        self.estadisticas.total_empresas = len(self.empresas)
        self.estadisticas.total_vehiculos = len(self.vehiculos)
        self.estadisticas.total_conductores = len(self.conductores)
        self.estadisticas.total_rutas = len(self.rutas)
        self.estadisticas.total_expedientes = len(self.expedientes)
        self.estadisticas.total_resoluciones = len(self.resoluciones)
        self.estadisticas.total_validaciones = sum(len(validaciones) for validaciones in self.validaciones_historial.values())
        
        # Estadísticas por estado
        self.estadisticas.vehiculos_por_estado = defaultdict(int)
        for vehiculo in self.vehiculos.values():
            estado = vehiculo.get("estado", "DESCONOCIDO")
            self.estadisticas.vehiculos_por_estado[estado] += 1
        
        self.estadisticas.conductores_por_estado = defaultdict(int)
        for conductor in self.conductores.values():
            estado = conductor.get("estado", "DESCONOCIDO")
            self.estadisticas.conductores_por_estado[estado] += 1
        
        self.estadisticas.expedientes_por_estado = defaultdict(int)
        for expediente in self.expedientes.values():
            estado = expediente.get("estado", "DESCONOCIDO")
            self.estadisticas.expedientes_por_estado[estado] += 1
        
        # Relaciones activas
        self.estadisticas.vehiculos_con_conductor = len([
            vid for vid, conductores in self.relaciones.vehiculos_conductores.items()
            if conductores
        ])
        self.estadisticas.vehiculos_sin_conductor = self.estadisticas.total_vehiculos - self.estadisticas.vehiculos_con_conductor
        
        self.estadisticas.conductores_con_vehiculo = len([
            cid for cid, vehiculos in self.relaciones.conductores_vehiculos.items()
            if vehiculos
        ])
        self.estadisticas.conductores_sin_vehiculo = self.estadisticas.total_conductores - self.estadisticas.conductores_con_vehiculo
        
        self.estadisticas.ultima_actualizacion = datetime.now()
    
    def _log_operacion(self, tipo: str, descripcion: str):
        """Registrar operación en el log"""
        self.log_operaciones.append({
            "timestamp": datetime.now().isoformat(),
            "tipo": tipo,
            "descripcion": descripcion
        })
        
        # Mantener solo las últimas 100 operaciones
        if len(self.log_operaciones) > 100:
            self.log_operaciones = self.log_operaciones[-100:]
    
    def reset_datos(self):
        """Resetear todos los datos (útil para pruebas)"""
        self._initialize()
        logger.info("🔄 DataManagerService reseteado completamente")

# Función para obtener la instancia global del servicio
def get_data_manager() -> DataManagerService:
    """Obtener la instancia única del DataManager"""
    return DataManagerService()