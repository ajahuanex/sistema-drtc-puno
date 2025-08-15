from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from app.models.usuario import UsuarioInDB, UsuarioCreate, UsuarioUpdate
from app.models.empresa import (
    EmpresaInDB, EmpresaCreate, EmpresaUpdate, 
    EstadoEmpresa, TipoDocumento, DocumentoEmpresa, AuditoriaEmpresa
)
from app.models.vehiculo import VehiculoInDB, VehiculoCreate, VehiculoUpdate, DatosTecnicos
from app.models.ruta import RutaInDB, RutaCreate, RutaUpdate
from app.models.resolucion import ResolucionInDB, ResolucionCreate, ResolucionUpdate
from app.models.tuc import TucInDB, TucCreate, TucUpdate, Tuc
from passlib.context import CryptContext

# Configurar passlib para evitar errores con bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__default_rounds=12)

class MockDataService:
    """Servicio para manejar datos mock en desarrollo"""
    
    def __init__(self):
        self.usuarios: Dict[str, UsuarioInDB] = {}
        self.empresas: Dict[str, EmpresaInDB] = {}
        self.vehiculos: Dict[str, VehiculoInDB] = {}
        self.rutas: Dict[str, RutaInDB] = {}
        self.resoluciones: Dict[str, ResolucionInDB] = {}
        self.tucs: Dict[str, TucInDB] = {}
        self._init_mock_data()
    
    def _init_mock_data(self):
        """Inicializar datos mock"""
        # Crear usuarios mock
        self._create_mock_usuarios()
        # Crear empresas mock
        self._create_mock_empresas()
        # Crear vehículos mock
        self._create_mock_vehiculos()
        # Crear rutas mock
        self._create_mock_rutas()
        # Crear resoluciones mock
        self._create_mock_resoluciones()
        # Crear TUCs mock
        self._create_mock_tucs()
    
    def _create_mock_usuarios(self):
        """Crear usuarios de prueba"""
        # Usar contraseñas hasheadas pre-generadas para evitar el error
        mock_usuarios = [
            {
                "id": "1",
                "dni": "12345678",
                "nombres": "Juan Carlos",
                "apellidos": "Pérez Quispe",
                "email": "juan.perez@drtc.gob.pe",
                "passwordHash": "$2b$12$fbHM5OEHpgfJ36KMGoqC6.JDSN0tSCSiDCV3rH/ZR5qXq3ctb5.d6",  # password123
                "rolId": "admin",
                "estaActivo": True,
                "fechaCreacion": datetime.now(timezone.utc) - timedelta(days=30),
                "fechaActualizacion": None
            },
            {
                "id": "2", 
                "dni": "87654321",
                "nombres": "María Elena",
                "apellidos": "García López",
                "email": "maria.garcia@drtc.gob.pe",
                "passwordHash": "$2b$12$fbHM5OEHpgfJ36KMGoqC6.JDSN0tSCSiDCV3rH/ZR5qXq3ctb5.d6",  # password123
                "rolId": "fiscalizador",
                "estaActivo": True,
                "fechaCreacion": datetime.now(timezone.utc) - timedelta(days=15),
                "fechaActualizacion": None
            },
            {
                "id": "3",
                "dni": "11223344",
                "nombres": "Carlos Alberto",
                "apellidos": "Rodríguez Silva",
                "email": "carlos.rodriguez@drtc.gob.pe",
                "passwordHash": "$2b$12$fbHM5OEHpgfJ36KMGoqC6.JDSN0tSCSiDCV3rH/ZR5qXq3ctb5.d6",  # password123
                "rolId": "usuario",
                "estaActivo": True,
                "fechaCreacion": datetime.now(timezone.utc) - timedelta(days=10),
                "fechaActualizacion": None
            }
        ]
        
        for user_data in mock_usuarios:
            self.usuarios[user_data["id"]] = UsuarioInDB(**user_data)
    
    def _create_mock_empresas(self):
        """Crear empresas de prueba"""
        mock_empresas = [
            {
                "id": "1",
                "ruc": "20123456789",
                "razonSocial": {
                    "principal": "Transportes El Veloz S.A.C.",
                    "sunat": "TRANSPORTES EL VELOZ S.A.C.",
                    "minimo": "TRANSPORTES EL VELOZ"
                },
                "direccionFiscal": "Av. El Sol 123, Puno",
                "estado": EstadoEmpresa.HABILITADA,
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow() - timedelta(days=60),
                "representanteLegal": {
                    "dni": "12345678",
                    "nombres": "Juan Carlos",
                    "apellidos": "Pérez López",
                    "email": "juan.perez@transportesveloz.com",
                    "telefono": "951234567",
                    "direccion": "Av. El Sol 123, Puno"
                },
                "emailContacto": "info@transportesveloz.com",
                "telefonoContacto": "951234567",
                "sitioWeb": "www.transportesveloz.com",
                "documentos": [
                    {
                        "tipo": TipoDocumento.RUC,
                        "numero": "20123456789",
                        "fechaEmision": datetime.utcnow() - timedelta(days=365),
                        "fechaVencimiento": datetime.utcnow() + timedelta(days=365),
                        "urlDocumento": "https://example.com/ruc.pdf",
                        "observaciones": "RUC activo",
                        "estaActivo": True
                    }
                ],
                "auditoria": [
                    {
                        "fechaCambio": datetime.utcnow() - timedelta(days=60),
                        "usuarioId": "1",
                        "tipoCambio": "CREACION_EMPRESA",
                        "campoAnterior": None,
                        "campoNuevo": "Empresa creada con RUC: 20123456789",
                        "observaciones": "Creación inicial de empresa"
                    }
                ],
                "resolucionesPrimigeniasIds": ["1", "2"],
                "vehiculosHabilitadosIds": ["1", "2", "3"],
                "conductoresHabilitadosIds": ["1", "2"],
                "rutasAutorizadasIds": ["1", "2"],
                "datosSunat": {
                    "valido": True,
                    "razonSocial": "TRANSPORTES EL VELOZ S.A.C.",
                    "estado": "ACTIVO",
                    "condicion": "HABIDO",
                    "direccion": "Av. El Sol 123, Puno",
                    "fechaActualizacion": datetime.utcnow()
                },
                "ultimaValidacionSunat": datetime.utcnow(),
                "scoreRiesgo": 25,
                "observaciones": "Empresa en buen estado"
            },
            {
                "id": "2",
                "ruc": "20234567890",
                "razonSocial": {
                    "principal": "Empresa de Transportes Puno S.A.C.",
                    "sunat": "EMPRESA DE TRANSPORTES PUNO S.A.C.",
                    "minimo": "EMPRESA DE TRANSPORTES PUNO"
                },
                "direccionFiscal": "Jr. Lima 456, Puno",
                "estado": EstadoEmpresa.HABILITADA,
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow() - timedelta(days=45),
                "representanteLegal": {
                    "dni": "87654321",
                    "nombres": "María Elena",
                    "apellidos": "García Rodríguez",
                    "email": "maria.garcia@transportespuno.com",
                    "telefono": "952345678",
                    "direccion": "Jr. Lima 456, Puno"
                },
                "emailContacto": "info@transportespuno.com",
                "telefonoContacto": "952345678",
                "sitioWeb": "www.transportespuno.com",
                "documentos": [
                    {
                        "tipo": TipoDocumento.RUC,
                        "numero": "20234567890",
                        "fechaEmision": datetime.utcnow() - timedelta(days=365),
                        "fechaVencimiento": datetime.utcnow() + timedelta(days=365),
                        "urlDocumento": "https://example.com/ruc2.pdf",
                        "observaciones": "RUC activo",
                        "estaActivo": True
                    }
                ],
                "auditoria": [
                    {
                        "fechaCambio": datetime.utcnow() - timedelta(days=45),
                        "usuarioId": "1",
                        "tipoCambio": "CREACION_EMPRESA",
                        "campoAnterior": None,
                        "campoNuevo": "Empresa creada con RUC: 20234567890",
                        "observaciones": "Creación inicial de empresa"
                    }
                ],
                "resolucionesPrimigeniasIds": ["3"],
                "vehiculosHabilitadosIds": ["4", "5"],
                "conductoresHabilitadosIds": ["3"],
                "rutasAutorizadasIds": ["3"],
                "datosSunat": {
                    "valido": True,
                    "razonSocial": "EMPRESA DE TRANSPORTES PUNO S.A.C.",
                    "estado": "ACTIVO",
                    "condicion": "HABIDO",
                    "direccion": "Jr. Lima 456, Puno",
                    "fechaActualizacion": datetime.utcnow()
                },
                "ultimaValidacionSunat": datetime.utcnow(),
                "scoreRiesgo": 30,
                "observaciones": "Empresa en buen estado"
            },
            {
                "id": "3",
                "ruc": "20345678901",
                "razonSocial": {
                    "principal": "Transportes Juliaca Express S.A.C.",
                    "sunat": "TRANSPORTES JULIACA EXPRESS S.A.C.",
                    "minimo": "TRANSPORTES JULIACA EXPRESS"
                },
                "direccionFiscal": "Av. San Martín 789, Juliaca",
                "estado": EstadoEmpresa.EN_TRAMITE,
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow() - timedelta(days=20),
                "representanteLegal": {
                    "dni": "11223344",
                    "nombres": "Carlos Alberto",
                    "apellidos": "Rodríguez Silva",
                    "email": "carlos.rodriguez@juliacaexpress.com",
                    "telefono": "953456789",
                    "direccion": "Av. San Martín 789, Juliaca"
                },
                "emailContacto": "info@juliacaexpress.com",
                "telefonoContacto": "953456789",
                "sitioWeb": "www.juliacaexpress.com",
                "documentos": [
                    {
                        "tipo": TipoDocumento.RUC,
                        "numero": "20345678901",
                        "fechaEmision": datetime.utcnow() - timedelta(days=20),
                        "fechaVencimiento": datetime.utcnow() + timedelta(days=345),
                        "urlDocumento": "https://example.com/ruc3.pdf",
                        "observaciones": "RUC en trámite",
                        "estaActivo": True
                    }
                ],
                "auditoria": [
                    {
                        "fechaCambio": datetime.utcnow() - timedelta(days=20),
                        "usuarioId": "1",
                        "tipoCambio": "CREACION_EMPRESA",
                        "campoAnterior": None,
                        "campoNuevo": "Empresa creada con RUC: 20345678901",
                        "observaciones": "Creación inicial de empresa"
                    }
                ],
                "resolucionesPrimigeniasIds": [],
                "vehiculosHabilitadosIds": [],
                "conductoresHabilitadosIds": [],
                "rutasAutorizadasIds": [],
                "datosSunat": {
                    "valido": True,
                    "razonSocial": "TRANSPORTES JULIACA EXPRESS S.A.C.",
                    "estado": "ACTIVO",
                    "condicion": "HABIDO",
                    "direccion": "Av. San Martín 789, Juliaca",
                    "fechaActualizacion": datetime.utcnow()
                },
                "ultimaValidacionSunat": datetime.utcnow(),
                "scoreRiesgo": 45,
                "observaciones": "Empresa en trámite de habilitación"
            }
        ]
        
        for empresa_data in mock_empresas:
            self.empresas[empresa_data["id"]] = EmpresaInDB(**empresa_data)

    def _create_mock_vehiculos(self):
        """Crear vehículos de prueba"""
        mock_vehiculos = [
            {
                "id": "1",
                "placa": "V1A-123",
                "empresaActualId": "1",
                "resolucionId": "1",
                "rutasAsignadasIds": ["1", "2"],
                "categoria": "M3",
                "marca": "Mercedes-Benz",
                "modelo": "Sprinter",
                "anioFabricacion": 2018,
                "estado": "ACTIVO",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow() - timedelta(days=50),
                "datosTecnicos": {
                    "motor": "Diesel Euro 4",
                    "chasis": "A123-B456-C789",
                    "ejes": 2,
                    "asientos": 30,
                    "pesoNeto": 5000.0,
                    "pesoBruto": 12000.0,
                    "medidas": {
                        "largo": 10.5,
                        "ancho": 2.5,
                        "alto": 3.2
                    },
                    "tipoCombustible": "DIESEL"
                },
                "tuc": {
                    "nroTuc": "T-123456-2025",
                    "fechaEmision": datetime.utcnow() - timedelta(days=30)
                },
                "color": "Blanco",
                "numeroSerie": "MB123456789",
                "observaciones": "Vehículo en buen estado",
                "documentosIds": ["1", "2"],
                "historialIds": []
            },
            {
                "id": "2",
                "placa": "V2B-456",
                "empresaActualId": "1",
                "resolucionId": "1",
                "rutasAsignadasIds": ["1"],
                "categoria": "M3",
                "marca": "Volvo",
                "modelo": "B12",
                "anioFabricacion": 2019,
                "estado": "ACTIVO",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow() - timedelta(days=45),
                "datosTecnicos": {
                    "motor": "Diesel Euro 5",
                    "chasis": "D789-E012-F345",
                    "ejes": 2,
                    "asientos": 35,
                    "pesoNeto": 5500.0,
                    "pesoBruto": 13000.0,
                    "medidas": {
                        "largo": 11.0,
                        "ancho": 2.6,
                        "alto": 3.3
                    },
                    "tipoCombustible": "DIESEL"
                },
                "tuc": {
                    "nroTuc": "T-123457-2025",
                    "fechaEmision": datetime.utcnow() - timedelta(days=25)
                },
                "color": "Azul",
                "numeroSerie": "VO987654321",
                "observaciones": "Vehículo nuevo",
                "documentosIds": ["3", "4"],
                "historialIds": []
            },
            {
                "id": "3",
                "placa": "V3C-789",
                "empresaActualId": "1",
                "resolucionId": "2",
                "rutasAsignadasIds": ["2"],
                "categoria": "M2",
                "marca": "Toyota",
                "modelo": "Hiace",
                "anioFabricacion": 2020,
                "estado": "ACTIVO",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow() - timedelta(days=40),
                "datosTecnicos": {
                    "motor": "Gasolina Euro 6",
                    "chasis": "G678-H901-I234",
                    "ejes": 2,
                    "asientos": 20,
                    "pesoNeto": 3500.0,
                    "pesoBruto": 8000.0,
                    "medidas": {
                        "largo": 8.5,
                        "ancho": 2.3,
                        "alto": 2.8
                    },
                    "tipoCombustible": "GASOLINA"
                },
                "tuc": {
                    "nroTuc": "T-123458-2025",
                    "fechaEmision": datetime.utcnow() - timedelta(days=20)
                },
                "color": "Plateado",
                "numeroSerie": "TO456789123",
                "observaciones": "Vehículo compacto",
                "documentosIds": ["5", "6"],
                "historialIds": []
            },
            {
                "id": "4",
                "placa": "V4D-012",
                "empresaActualId": "2",
                "resolucionId": "3",
                "rutasAsignadasIds": ["3"],
                "categoria": "M3",
                "marca": "Scania",
                "modelo": "K420",
                "anioFabricacion": 2017,
                "estado": "ACTIVO",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow() - timedelta(days=35),
                "datosTecnicos": {
                    "motor": "Diesel Euro 4",
                    "chasis": "J345-K678-L901",
                    "ejes": 3,
                    "asientos": 45,
                    "pesoNeto": 8000.0,
                    "pesoBruto": 18000.0,
                    "medidas": {
                        "largo": 12.5,
                        "ancho": 2.8,
                        "alto": 3.5
                    },
                    "tipoCombustible": "DIESEL"
                },
                "tuc": {
                    "nroTuc": "T-123459-2025",
                    "fechaEmision": datetime.utcnow() - timedelta(days=15)
                },
                "color": "Rojo",
                "numeroSerie": "SC789123456",
                "observaciones": "Vehículo de larga distancia",
                "documentosIds": ["7", "8"],
                "historialIds": []
            },
            {
                "id": "5",
                "placa": "V5E-345",
                "empresaActualId": "2",
                "resolucionId": "3",
                "rutasAsignadasIds": ["3"],
                "categoria": "M2",
                "marca": "Ford",
                "modelo": "Transit",
                "anioFabricacion": 2021,
                "estado": "ACTIVO",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow() - timedelta(days=30),
                "datosTecnicos": {
                    "motor": "Diesel Euro 6",
                    "chasis": "M234-N567-O890",
                    "ejes": 2,
                    "asientos": 25,
                    "pesoNeto": 4000.0,
                    "pesoBruto": 9000.0,
                    "medidas": {
                        "largo": 9.0,
                        "ancho": 2.4,
                        "alto": 3.0
                    },
                    "tipoCombustible": "DIESEL"
                },
                "tuc": {
                    "nroTuc": "T-123460-2025",
                    "fechaEmision": datetime.utcnow() - timedelta(days=10)
                },
                "color": "Verde",
                "numeroSerie": "FO123789456",
                "observaciones": "Vehículo versátil",
                "documentosIds": ["9", "10"],
                "historialIds": []
            }
        ]
        
        for vehiculo_data in mock_vehiculos:
            self.vehiculos[vehiculo_data["id"]] = VehiculoInDB(**vehiculo_data)

    def _create_mock_rutas(self):
        """Crear rutas de prueba"""
        mock_rutas = [
            {
                "id": "1",
                "codigoRuta": "R001",
                "nombre": "Puno - Juliaca",
                "origenId": "1",
                "destinoId": "2",
                "itinerarioIds": ["1", "3", "2"],
                "frecuencias": "Cada 30 minutos",
                "estado": "ACTIVA",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow() - timedelta(days=60),
                "fechaActualizacion": None,
                "tipoRuta": "INTERURBANA",
                "tipoServicio": "PASAJEROS",
                "distancia": 45.5,
                "tiempoEstimado": "01:30",
                "tarifaBase": 8.50,
                "capacidadMaxima": 50,
                "horarios": [
                    {"dia": "LUNES", "horaSalida": "06:00", "horaLlegada": "07:30"},
                    {"dia": "LUNES", "horaSalida": "18:00", "horaLlegada": "19:30"}
                ],
                "restricciones": [],
                "observaciones": "Ruta principal Puno-Juliaca",
                "empresasAutorizadasIds": ["1"],
                "vehiculosAsignadosIds": ["1", "2"],
                "documentosIds": ["1", "2"],
                "historialIds": []
            },
            {
                "id": "2",
                "codigoRuta": "R002",
                "nombre": "Puno - Cusco",
                "origenId": "1",
                "destinoId": "3",
                "itinerarioIds": ["1", "4", "5", "3"],
                "frecuencias": "Cada 2 horas",
                "estado": "ACTIVA",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow() - timedelta(days=45),
                "fechaActualizacion": None,
                "tipoRuta": "INTERREGIONAL",
                "tipoServicio": "PASAJEROS",
                "distancia": 380.0,
                "tiempoEstimado": "08:00",
                "tarifaBase": 45.00,
                "capacidadMaxima": 45,
                "horarios": [
                    {"dia": "LUNES", "horaSalida": "08:00", "horaLlegada": "16:00"},
                    {"dia": "LUNES", "horaSalida": "20:00", "horaLlegada": "04:00"}
                ],
                "restricciones": ["No circular en horario nocturno"],
                "observaciones": "Ruta turística Puno-Cusco",
                "empresasAutorizadasIds": ["1"],
                "vehiculosAsignadosIds": ["3"],
                "documentosIds": ["3", "4"],
                "historialIds": []
            },
            {
                "id": "3",
                "codigoRuta": "R003",
                "nombre": "Juliaca - Arequipa",
                "origenId": "2",
                "destinoId": "4",
                "itinerarioIds": ["2", "6", "4"],
                "frecuencias": "Cada hora",
                "estado": "ACTIVA",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow() - timedelta(days=30),
                "fechaActualizacion": None,
                "tipoRuta": "INTERREGIONAL",
                "tipoServicio": "PASAJEROS",
                "distancia": 280.0,
                "tiempoEstimado": "06:00",
                "tarifaBase": 35.00,
                "capacidadMaxima": 40,
                "horarios": [
                    {"dia": "LUNES", "horaSalida": "07:00", "horaLlegada": "13:00"},
                    {"dia": "LUNES", "horaSalida": "14:00", "horaLlegada": "20:00"}
                ],
                "restricciones": [],
                "observaciones": "Ruta Juliaca-Arequipa",
                "empresasAutorizadasIds": ["2"],
                "vehiculosAsignadosIds": ["4", "5"],
                "documentosIds": ["5", "6"],
                "historialIds": []
            },
            {
                "id": "4",
                "codigoRuta": "R004",
                "nombre": "Puno - Tacna",
                "origenId": "1",
                "destinoId": "5",
                "itinerarioIds": ["1", "7", "5"],
                "frecuencias": "Cada 3 horas",
                "estado": "SUSPENDIDA",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow() - timedelta(days=20),
                "fechaActualizacion": None,
                "tipoRuta": "INTERREGIONAL",
                "tipoServicio": "PASAJEROS",
                "distancia": 420.0,
                "tiempoEstimado": "10:00",
                "tarifaBase": 55.00,
                "capacidadMaxima": 35,
                "horarios": [
                    {"dia": "LUNES", "horaSalida": "06:00", "horaLlegada": "16:00"}
                ],
                "restricciones": ["Ruta suspendida por mantenimiento"],
                "observaciones": "Ruta Puno-Tacna suspendida",
                "empresasAutorizadasIds": ["1"],
                "vehiculosAsignadosIds": [],
                "documentosIds": ["7", "8"],
                "historialIds": []
            },
            {
                "id": "7",
                "codigoRuta": "01",
                "nombre": "AREQUIPA - MOLLENDO",
                "origenId": "9",
                "destinoId": "10",
                "itinerarioIds": ["9", "10"],
                "frecuencias": "Diaria, cada hora",
                "estado": "ACTIVA",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow() - timedelta(days=15),
                "fechaActualizacion": None,
                "tipoRuta": "INTERPROVINCIAL",
                "tipoServicio": "PASAJEROS",
                "distancia": 120.0,
                "tiempoEstimado": "02:00",
                "tarifaBase": 8.00,
                "capacidadMaxima": 30,
                "horarios": [
                    {"dia": "LUNES", "horaSalida": "06:00", "horaLlegada": "08:00"},
                    {"dia": "LUNES", "horaSalida": "18:00", "horaLlegada": "20:00"}
                ],
                "restricciones": [],
                "observaciones": "Ruta costera",
                "empresasAutorizadasIds": ["3"],
                "vehiculosAsignadosIds": ["7"],
                "documentosIds": ["7"],
                "historialIds": []
            },
            {
                "id": "8",
                "codigoRuta": "02",
                "nombre": "AREQUIPA - TACNA",
                "origenId": "9",
                "destinoId": "11",
                "itinerarioIds": ["9", "11"],
                "frecuencias": "Diaria, 3 veces al día",
                "estado": "ACTIVA",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow() - timedelta(days=15),
                "fechaActualizacion": None,
                "tipoRuta": "INTERPROVINCIAL",
                "tipoServicio": "PASAJEROS",
                "distancia": 320.0,
                "tiempoEstimado": "05:00",
                "tarifaBase": 20.00,
                "capacidadMaxima": 25,
                "horarios": [
                    {"dia": "LUNES", "horaSalida": "07:00", "horaLlegada": "12:00"},
                    {"dia": "LUNES", "horaSalida": "14:00", "horaLlegada": "19:00"},
                    {"dia": "LUNES", "horaSalida": "21:00", "horaLlegada": "02:00"}
                ],
                "restricciones": [],
                "observaciones": "Ruta fronteriza",
                "empresasAutorizadasIds": ["3"],
                "vehiculosAsignadosIds": ["8"],
                "documentosIds": ["8"],
                "historialIds": []
            }
        ]
        
        for ruta_data in mock_rutas:
            # Convertir snake_case a camelCase para coincidir con el modelo
            ruta_data_converted = {
                "id": ruta_data["id"],
                "codigoRuta": ruta_data["codigoRuta"],
                "nombre": ruta_data["nombre"],
                "origenId": ruta_data["origenId"],
                "destinoId": ruta_data["destinoId"],
                "itinerarioIds": ruta_data["itinerarioIds"],
                "frecuencias": ruta_data["frecuencias"],
                "estado": ruta_data["estado"],
                "estaActivo": ruta_data["estaActivo"],
                "fechaRegistro": ruta_data["fechaRegistro"],
                "fechaActualizacion": ruta_data["fechaActualizacion"],
                "tipoRuta": ruta_data["tipoRuta"],
                "tipoServicio": ruta_data["tipoServicio"],
                "distancia": ruta_data["distancia"],
                "tiempoEstimado": ruta_data["tiempoEstimado"],
                "tarifaBase": ruta_data["tarifaBase"],
                "capacidadMaxima": ruta_data["capacidadMaxima"],
                "horarios": ruta_data["horarios"],
                "restricciones": ruta_data["restricciones"],
                "observaciones": ruta_data["observaciones"],
                "empresasAutorizadasIds": ruta_data["empresasAutorizadasIds"],
                "vehiculosAsignadosIds": ruta_data["vehiculosAsignadosIds"],
                "documentosIds": ruta_data["documentosIds"],
                "historialIds": ruta_data["historialIds"]
            }
            self.rutas[ruta_data["id"]] = RutaInDB(**ruta_data_converted)

    def _create_mock_resoluciones(self):
        """Crear resoluciones de prueba"""
        mock_resoluciones = [
            {
                "id": "1",
                "nro_resolucion": "R-0001-2025",
                "empresa_id": "1",
                "expediente_id": "1",
                "fecha_emision": datetime.utcnow() - timedelta(days=60),
                "fecha_vigencia_inicio": datetime.utcnow() - timedelta(days=60),
                "fecha_vigencia_fin": datetime.utcnow() + timedelta(days=300),
                "tipo_resolucion": "PADRE",
                "resolucion_padre_id": None,
                "tipo_tramite": "PRIMIGENIA",
                "descripcion": "Resolución primigenia para Transportes El Veloz S.A.C. autorizando operación de transporte interprovincial",
                "vehiculos_habilitados_ids": ["1", "2", "3"],
                "rutas_autorizadas_ids": ["1", "2"],
                "observaciones": "Resolución primigenia para Transportes El Veloz",
                "estado": "VIGENTE",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=60),
                "fecha_actualizacion": None,
                "resoluciones_hijas_ids": ["2"],
                "documento_id": None,
                "usuario_emision_id": "1",
                "usuario_aprobacion_id": "1",
                "fecha_aprobacion": datetime.utcnow() - timedelta(days=60),
                "motivo_suspension": None,
                "fecha_suspension": None
            },
            {
                "id": "2",
                "nro_resolucion": "R-0002-2025",
                "empresa_id": "1",
                "expediente_id": "1",
                "fecha_emision": datetime.utcnow() - timedelta(days=45),
                "fecha_vigencia_inicio": datetime.utcnow() - timedelta(days=45),
                "fecha_vigencia_fin": datetime.utcnow() + timedelta(days=315),
                "tipo_resolucion": "HIJO",
                "resolucion_padre_id": "1",
                "tipo_tramite": "INCREMENTO",
                "descripcion": "Modificación de rutas autorizadas para Transportes El Veloz S.A.C. ampliando cobertura geográfica",
                "vehiculos_habilitados_ids": ["1", "2", "3"],
                "rutas_autorizadas_ids": ["1", "2", "3"],
                "observaciones": "Modificación de rutas autorizadas",
                "estado": "VIGENTE",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=45),
                "fecha_actualizacion": None,
                "resoluciones_hijas_ids": [],
                "documento_id": None,
                "usuario_emision_id": "1",
                "usuario_aprobacion_id": "1",
                "fecha_aprobacion": datetime.utcnow() - timedelta(days=45),
                "motivo_suspension": None,
                "fecha_suspension": None
            },
            {
                "id": "3",
                "nro_resolucion": "R-0003-2025",
                "empresa_id": "2",
                "expediente_id": "2",
                "fecha_emision": datetime.utcnow() - timedelta(days=30),
                "fecha_vigencia_inicio": datetime.utcnow() - timedelta(days=30),
                "fecha_vigencia_fin": datetime.utcnow() + timedelta(days=330),
                "tipo_resolucion": "PADRE",
                "resolucion_padre_id": None,
                "tipo_tramite": "PRIMIGENIA",
                "descripcion": "Resolución primigenia para Empresa de Transportes Puno S.A.C. autorizando operación de transporte interprovincial",
                "vehiculos_habilitados_ids": ["4", "5"],
                "rutas_autorizadas_ids": ["3", "4"],
                "observaciones": "Resolución primigenia para Empresa de Transportes Puno",
                "estado": "VIGENTE",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=30),
                "fecha_actualizacion": None,
                "resoluciones_hijas_ids": [],
                "documento_id": None,
                "usuario_emision_id": "1",
                "usuario_aprobacion_id": "1",
                "fecha_aprobacion": datetime.utcnow() - timedelta(days=30),
                "motivo_suspension": None,
                "fecha_suspension": None
            },
            {
                "id": "4",
                "nro_resolucion": "R-0004-2024",
                "empresa_id": "3",
                "expediente_id": "3",
                "fecha_emision": datetime.utcnow() - timedelta(days=365),
                "fecha_vigencia_inicio": datetime.utcnow() - timedelta(days=365),
                "fecha_vigencia_fin": datetime.utcnow() - timedelta(days=30),
                "tipo_resolucion": "PADRE",
                "resolucion_padre_id": None,
                "tipo_tramite": "PRIMIGENIA",
                "descripcion": "Resolución primigenia para Transportes Juliaca Express S.A.C. autorizando operación de transporte interprovincial",
                "vehiculos_habilitados_ids": [],
                "rutas_autorizadas_ids": [],
                "observaciones": "Resolución vencida",
                "estado": "VENCIDA",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=365),
                "fecha_actualizacion": None,
                "resoluciones_hijas_ids": [],
                "documento_id": None,
                "usuario_emision_id": "1",
                "usuario_aprobacion_id": "1",
                "fecha_aprobacion": datetime.utcnow() - timedelta(days=365),
                "motivo_suspension": None,
                "fecha_suspension": None
            },
            {
                "id": "5",
                "nro_resolucion": "R-0001-2026",
                "empresa_id": "2",
                "expediente_id": "4",
                "fecha_emision": datetime.utcnow() - timedelta(days=300),
                "fecha_vigencia_inicio": datetime.utcnow() - timedelta(days=300),
                "fecha_vigencia_fin": datetime.utcnow() + timedelta(days=1500),
                "tipo_resolucion": "PADRE",
                "resolucion_padre_id": None,
                "tipo_tramite": "PRIMIGENIA",
                "descripcion": "Resolución primigenia para empresa del año 2026",
                "vehiculos_habilitados_ids": ["5", "6"],
                "rutas_autorizadas_ids": ["4", "5"],
                "observaciones": "Resolución del año 2026",
                "estado": "VIGENTE",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=300),
                "fecha_actualizacion": None,
                "resoluciones_hijas_ids": [],
                "documento_id": None,
                "usuario_emision_id": "1",
                "usuario_aprobacion_id": "1",
                "fecha_aprobacion": datetime.utcnow() - timedelta(days=300),
                "motivo_suspension": None,
                "fecha_suspension": None
            },
            {
                "id": "6",
                "nro_resolucion": "R-0002-2026",
                "empresa_id": "3",
                "expediente_id": "5",
                "fecha_emision": datetime.utcnow() - timedelta(days=250),
                "fecha_vigencia_inicio": datetime.utcnow() - timedelta(days=250),
                "fecha_vigencia_fin": datetime.utcnow() + timedelta(days=1550),
                "tipo_resolucion": "PADRE",
                "resolucion_padre_id": None,
                "tipo_tramite": "RENOVACION",
                "descripcion": "Renovación para empresa del año 2026",
                "vehiculos_habilitados_ids": ["7"],
                "rutas_autorizadas_ids": ["6"],
                "observaciones": "Renovación del año 2026",
                "estado": "VIGENTE",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=250),
                "fecha_actualizacion": None,
                "resoluciones_hijas_ids": [],
                "documento_id": None,
                "usuario_emision_id": "1",
                "usuario_aprobacion_id": "1",
                "fecha_aprobacion": datetime.utcnow() - timedelta(days=250),
                "motivo_suspension": None,
                "fecha_suspension": None
            }
        ]
        
        for resolucion_data in mock_resoluciones:
            # Convertir snake_case a camelCase para coincidir con el modelo
            resolucion_data_converted = {
                "id": resolucion_data["id"],
                "nroResolucion": resolucion_data["nro_resolucion"],
                "empresaId": resolucion_data["empresa_id"],
                "fechaEmision": resolucion_data["fecha_emision"],
                "fechaVigenciaInicio": resolucion_data["fecha_vigencia_inicio"],
                "fechaVigenciaFin": resolucion_data["fecha_vigencia_fin"],
                "tipoResolucion": resolucion_data["tipo_resolucion"],
                "resolucionPadreId": resolucion_data["resolucion_padre_id"],
                "resolucionesHijasIds": resolucion_data["resoluciones_hijas_ids"],
                "vehiculosHabilitadosIds": resolucion_data["vehiculos_habilitados_ids"],
                "rutasAutorizadasIds": resolucion_data["rutas_autorizadas_ids"],
                "tipoTramite": resolucion_data["tipo_tramite"],
                "descripcion": resolucion_data["descripcion"],
                "expedienteId": resolucion_data["expediente_id"],
                "documentoId": resolucion_data["documento_id"],
                "estaActivo": resolucion_data["esta_activo"],
                "fechaRegistro": resolucion_data["fecha_registro"],
                "fechaActualizacion": resolucion_data["fecha_actualizacion"],
                "usuarioEmisionId": resolucion_data["usuario_emision_id"],
                "observaciones": resolucion_data["observaciones"],
                "estado": resolucion_data["estado"],
                "motivoSuspension": resolucion_data["motivo_suspension"],
                "fechaSuspension": resolucion_data["fecha_suspension"]
            }
            self.resoluciones[resolucion_data["id"]] = ResolucionInDB(**resolucion_data_converted)

    def _create_mock_tucs(self):
        """Crear TUCs de prueba"""
        mock_tucs = [
            {
                "id": "1",
                "nro_tuc": "T-123456-2025",
                "vehiculo_id": "1",
                "empresa_id": "1",
                "resolucion_padre_id": "1",
                "fecha_emision": datetime.utcnow() - timedelta(days=30),
                "fecha_vencimiento": datetime.utcnow() + timedelta(days=335),
                "estado": "VIGENTE",
                "observaciones": "TUC para Mercedes-Benz",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=30),
                "usuario_emision_id": "1"
            },
            {
                "id": "2",
                "nro_tuc": "T-123457-2025",
                "vehiculo_id": "2",
                "empresa_id": "1",
                "resolucion_padre_id": "1",
                "fecha_emision": datetime.utcnow() - timedelta(days=25),
                "fecha_vencimiento": datetime.utcnow() + timedelta(days=340),
                "estado": "VIGENTE",
                "observaciones": "TUC para Volvo",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=25),
                "usuario_emision_id": "1"
            },
            {
                "id": "3",
                "nro_tuc": "T-123458-2025",
                "vehiculo_id": "3",
                "empresa_id": "1",
                "resolucion_padre_id": "2",
                "fecha_emision": datetime.utcnow() - timedelta(days=20),
                "fecha_vencimiento": datetime.utcnow() + timedelta(days=345),
                "estado": "VIGENTE",
                "observaciones": "TUC para Toyota",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=20),
                "usuario_emision_id": "1"
            },
            {
                "id": "4",
                "nro_tuc": "T-123459-2025",
                "vehiculo_id": "4",
                "empresa_id": "2",
                "resolucion_padre_id": "3",
                "fecha_emision": datetime.utcnow() - timedelta(days=15),
                "fecha_vencimiento": datetime.utcnow() + timedelta(days=350),
                "estado": "VIGENTE",
                "observaciones": "TUC para Scania",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=15),
                "usuario_emision_id": "1"
            },
            {
                "id": "5",
                "nro_tuc": "T-123460-2025",
                "vehiculo_id": "5",
                "empresa_id": "2",
                "resolucion_padre_id": "3",
                "fecha_emision": datetime.utcnow() - timedelta(days=10),
                "fecha_vencimiento": datetime.utcnow() + timedelta(days=355),
                "estado": "DADA_DE_BAJA",
                "observaciones": "TUC dado de baja por mantenimiento",
                "esta_activo": False,
                "fecha_registro": datetime.utcnow() - timedelta(days=10),
                "usuario_emision_id": "1"
            }
        ]
        
        for tuc_data in mock_tucs:
            # Convertir snake_case a camelCase y agregar campos faltantes
            tuc_data_converted = {
                "id": tuc_data["id"],
                "vehiculoId": tuc_data["vehiculo_id"],
                "empresaId": tuc_data["empresa_id"],
                "resolucionPadreId": tuc_data["resolucion_padre_id"],
                "nroTuc": tuc_data["nro_tuc"],
                "fechaEmision": tuc_data["fecha_emision"],
                "fechaVencimiento": tuc_data["fecha_vencimiento"],
                "estado": tuc_data["estado"],
                "razonDescarte": None,
                "estaActivo": tuc_data["esta_activo"],
                "fechaRegistro": tuc_data["fecha_registro"],
                "fechaActualizacion": None,
                "documentoId": None,
                "qrVerificationUrl": f"https://verificacion.drtc-puno.gob.pe/tuc/{tuc_data['nro_tuc']}",
                "datosVehiculo": self._get_vehiculo_mock_data(tuc_data["vehiculo_id"]),
                "datosEmpresa": self._get_empresa_mock_data(tuc_data["empresa_id"]),
                "datosRuta": self._get_ruta_mock_data(tuc_data["resolucion_padre_id"]),
                "observaciones": tuc_data["observaciones"],
                "historialIds": []
            }
            self.tucs[tuc_data["id"]] = TucInDB(**tuc_data_converted)

    def _get_vehiculo_mock_data(self, vehiculo_id: str) -> dict:
        """Obtener datos mock del vehículo para el TUC"""
        vehiculos_data = {
            "1": {"id": "1", "placa": "ABC-123", "marca": "Mercedes-Benz", "modelo": "Sprinter", "anio": "2020"},
            "2": {"id": "2", "placa": "DEF-456", "marca": "Volvo", "modelo": "B12M", "anio": "2019"},
            "3": {"id": "3", "placa": "GHI-789", "marca": "Toyota", "modelo": "Coaster", "anio": "2021"},
            "4": {"id": "4", "placa": "JKL-012", "marca": "Scania", "modelo": "K320", "anio": "2018"},
            "5": {"id": "5", "placa": "MNO-345", "marca": "Iveco", "modelo": "Daily", "anio": "2022"}
        }
        return vehiculos_data.get(vehiculo_id, {"id": vehiculo_id, "placa": "XXX-000", "marca": "Desconocida", "modelo": "Desconocido"})

    def _get_empresa_mock_data(self, empresa_id: str) -> dict:
        """Obtener datos mock de la empresa para el TUC"""
        empresas_data = {
            "1": {"id": "1", "razonSocial": "Transportes El Veloz S.A.C.", "ruc": "20123456789"},
            "2": {"id": "2", "razonSocial": "Empresa de Transportes Puno S.A.C.", "ruc": "20123456790"},
            "3": {"id": "3", "razonSocial": "Transportes Juliaca Express S.A.C.", "ruc": "20123456791"}
        }
        return empresas_data.get(empresa_id, {"id": empresa_id, "razonSocial": "Empresa Desconocida", "ruc": "00000000000"})

    def _get_ruta_mock_data(self, resolucion_id: str) -> dict:
        """Obtener datos mock de la ruta para el TUC"""
        rutas_data = {
            "1": {"id": "1", "nombre": "Puno - Juliaca", "origen": "Puno", "destino": "Juliaca"},
            "2": {"id": "2", "nombre": "Puno - Cusco", "origen": "Puno", "destino": "Cusco"},
            "3": {"id": "3", "nombre": "Juliaca - Arequipa", "origen": "Juliaca", "destino": "Arequipa"}
        }
        return rutas_data.get(resolucion_id, {"id": resolucion_id, "nombre": "Ruta Desconocida", "origen": "Origen", "destino": "Destino"})

# Instancia global del servicio mock
mock_service = MockDataService() 