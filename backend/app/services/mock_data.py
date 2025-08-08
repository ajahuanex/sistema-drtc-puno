from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from app.models.usuario import UsuarioInDB, UsuarioCreate, UsuarioUpdate
from app.models.empresa import EmpresaInDB, EmpresaCreate, EmpresaUpdate
from app.models.vehiculo import VehiculoInDB, VehiculoCreate, VehiculoUpdate, DatosTecnicos, Tuc
from app.models.ruta import RutaInDB, RutaCreate, RutaUpdate
from app.models.resolucion import ResolucionInDB, ResolucionCreate, ResolucionUpdate
from app.models.tuc import TucInDB, TucCreate, TucUpdate
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
                "password_hash": "$2b$12$fbHM5OEHpgfJ36KMGoqC6.JDSN0tSCSiDCV3rH/ZR5qXq3ctb5.d6",  # password123
                "rol_id": "admin",
                "esta_activo": True,
                "fecha_creacion": datetime.utcnow() - timedelta(days=30),
                "fecha_actualizacion": None
            },
            {
                "id": "2", 
                "dni": "87654321",
                "nombres": "María Elena",
                "apellidos": "García López",
                "email": "maria.garcia@drtc.gob.pe",
                "password_hash": "$2b$12$fbHM5OEHpgfJ36KMGoqC6.JDSN0tSCSiDCV3rH/ZR5qXq3ctb5.d6",  # password123
                "rol_id": "fiscalizador",
                "esta_activo": True,
                "fecha_creacion": datetime.utcnow() - timedelta(days=15),
                "fecha_actualizacion": None
            },
            {
                "id": "3",
                "dni": "11223344",
                "nombres": "Carlos Alberto",
                "apellidos": "Rodríguez Silva",
                "email": "carlos.rodriguez@drtc.gob.pe",
                "password_hash": "$2b$12$fbHM5OEHpgfJ36KMGoqC6.JDSN0tSCSiDCV3rH/ZR5qXq3ctb5.d6",  # password123
                "rol_id": "usuario",
                "esta_activo": True,
                "fecha_creacion": datetime.utcnow() - timedelta(days=10),
                "fecha_actualizacion": None
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
                "razon_social": {
                    "principal": "Transportes El Veloz S.A.C.",
                    "sunat": "TRANSPORTES EL VELOZ S.A.C.",
                    "minimo": "TRANSPORTES EL VELOZ"
                },
                "direccion_fiscal": "Av. El Sol 123, Puno",
                "estado": "HABILITADA",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=60),
                "representante_legal": {
                    "dni": "12345678",
                    "nombres": "Juan Carlos Pérez"
                },
                "resoluciones_primigenias_ids": ["1", "2"],
                "vehiculos_habilitados_ids": ["1", "2", "3"],
                "conductores_habilitados_ids": ["1", "2"],
                "rutas_autorizadas_ids": ["1", "2"]
            },
            {
                "id": "2",
                "ruc": "20234567890",
                "razon_social": {
                    "principal": "Empresa de Transportes Puno S.A.C.",
                    "sunat": "EMPRESA DE TRANSPORTES PUNO S.A.C.",
                    "minimo": "EMPRESA DE TRANSPORTES PUNO"
                },
                "direccion_fiscal": "Jr. Lima 456, Puno",
                "estado": "HABILITADA",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=45),
                "representante_legal": {
                    "dni": "87654321",
                    "nombres": "María Elena García"
                },
                "resoluciones_primigenias_ids": ["3"],
                "vehiculos_habilitados_ids": ["4", "5"],
                "conductores_habilitados_ids": ["3", "4"],
                "rutas_autorizadas_ids": ["3", "4"]
            },
            {
                "id": "3",
                "ruc": "20345678901",
                "razon_social": {
                    "principal": "Transportes Juliaca Express S.A.C.",
                    "sunat": "TRANSPORTES JULIACA EXPRESS S.A.C.",
                    "minimo": "TRANSPORTES JULIACA EXPRESS"
                },
                "direccion_fiscal": "Av. San Martín 789, Juliaca",
                "estado": "EN_TRAMITE",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=20),
                "representante_legal": {
                    "dni": "11223344",
                    "nombres": "Carlos Alberto Rodríguez"
                },
                "resoluciones_primigenias_ids": [],
                "vehiculos_habilitados_ids": [],
                "conductores_habilitados_ids": [],
                "rutas_autorizadas_ids": []
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
                "empresa_actual_id": "1",
                "resolucion_id": "1",
                "rutas_asignadas_ids": ["1", "2"],
                "categoria": "M3",
                "marca": "Mercedes-Benz",
                "anio_fabricacion": 2018,
                "estado": "ACTIVO",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=50),
                "datos_tecnicos": {
                    "motor": "Diesel Euro 4",
                    "chasis": "A123-B456-C789",
                    "ejes": 2,
                    "asientos": 30,
                    "peso_neto": 5000.0,
                    "peso_bruto": 12000.0,
                    "medidas": {
                        "largo": 10.5,
                        "ancho": 2.5,
                        "alto": 3.2
                    }
                },
                "tuc": {
                    "nro_tuc": "T-123456-2025",
                    "fecha_emision": datetime.utcnow() - timedelta(days=30)
                }
            },
            {
                "id": "2",
                "placa": "V2B-456",
                "empresa_actual_id": "1",
                "resolucion_id": "1",
                "rutas_asignadas_ids": ["1"],
                "categoria": "M3",
                "marca": "Volvo",
                "anio_fabricacion": 2019,
                "estado": "ACTIVO",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=45),
                "datos_tecnicos": {
                    "motor": "Diesel Euro 5",
                    "chasis": "D789-E012-F345",
                    "ejes": 2,
                    "asientos": 35,
                    "peso_neto": 5500.0,
                    "peso_bruto": 13000.0,
                    "medidas": {
                        "largo": 11.0,
                        "ancho": 2.6,
                        "alto": 3.3
                    }
                },
                "tuc": {
                    "nro_tuc": "T-123457-2025",
                    "fecha_emision": datetime.utcnow() - timedelta(days=25)
                }
            },
            {
                "id": "3",
                "placa": "V3C-789",
                "empresa_actual_id": "1",
                "resolucion_id": "2",
                "rutas_asignadas_ids": ["2"],
                "categoria": "M2",
                "marca": "Toyota",
                "anio_fabricacion": 2020,
                "estado": "ACTIVO",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=40),
                "datos_tecnicos": {
                    "motor": "Gasolina Euro 6",
                    "chasis": "G678-H901-I234",
                    "ejes": 2,
                    "asientos": 20,
                    "peso_neto": 3500.0,
                    "peso_bruto": 8000.0,
                    "medidas": {
                        "largo": 8.5,
                        "ancho": 2.3,
                        "alto": 2.8
                    }
                },
                "tuc": {
                    "nro_tuc": "T-123458-2025",
                    "fecha_emision": datetime.utcnow() - timedelta(days=20)
                }
            },
            {
                "id": "4",
                "placa": "V4D-012",
                "empresa_actual_id": "2",
                "resolucion_id": "3",
                "rutas_asignadas_ids": ["3"],
                "categoria": "M3",
                "marca": "Scania",
                "anio_fabricacion": 2017,
                "estado": "ACTIVO",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=35),
                "datos_tecnicos": {
                    "motor": "Diesel Euro 4",
                    "chasis": "J567-K890-L123",
                    "ejes": 3,
                    "asientos": 40,
                    "peso_neto": 7000.0,
                    "peso_bruto": 15000.0,
                    "medidas": {
                        "largo": 12.0,
                        "ancho": 2.7,
                        "alto": 3.5
                    }
                },
                "tuc": {
                    "nro_tuc": "T-123459-2025",
                    "fecha_emision": datetime.utcnow() - timedelta(days=15)
                }
            },
            {
                "id": "5",
                "placa": "V5E-345",
                "empresa_actual_id": "2",
                "resolucion_id": "3",
                "rutas_asignadas_ids": ["4"],
                "categoria": "M2",
                "marca": "Nissan",
                "anio_fabricacion": 2021,
                "estado": "MANTENIMIENTO",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=30),
                "datos_tecnicos": {
                    "motor": "Diesel Euro 6",
                    "chasis": "M456-N789-O012",
                    "ejes": 2,
                    "asientos": 25,
                    "peso_neto": 4000.0,
                    "peso_bruto": 9000.0,
                    "medidas": {
                        "largo": 9.0,
                        "ancho": 2.4,
                        "alto": 3.0
                    }
                },
                "tuc": {
                    "nro_tuc": "T-123460-2025",
                    "fecha_emision": datetime.utcnow() - timedelta(days=10)
                }
            }
        ]
        
        for vehiculo_data in mock_vehiculos:
            self.vehiculos[vehiculo_data["id"]] = VehiculoInDB(**vehiculo_data)

    def _create_mock_rutas(self):
        """Crear rutas de prueba"""
        mock_rutas = [
            {
                "id": "1",
                "codigo_ruta": "R001",
                "nombre": "Puno - Juliaca",
                "origen_id": "1",
                "destino_id": "2",
                "itinerario_ids": ["1", "3", "2"],
                "frecuencias": "Cada 30 minutos",
                "estado": "ACTIVA",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=60)
            },
            {
                "id": "2",
                "codigo_ruta": "R002",
                "nombre": "Puno - Cusco",
                "origen_id": "1",
                "destino_id": "3",
                "itinerario_ids": ["1", "4", "5", "3"],
                "frecuencias": "Cada 2 horas",
                "estado": "ACTIVA",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=45)
            },
            {
                "id": "3",
                "codigo_ruta": "R003",
                "nombre": "Juliaca - Arequipa",
                "origen_id": "2",
                "destino_id": "4",
                "itinerario_ids": ["2", "6", "4"],
                "frecuencias": "Cada hora",
                "estado": "ACTIVA",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=30)
            },
            {
                "id": "4",
                "codigo_ruta": "R004",
                "nombre": "Puno - Tacna",
                "origen_id": "1",
                "destino_id": "5",
                "itinerario_ids": ["1", "7", "5"],
                "frecuencias": "Cada 3 horas",
                "estado": "SUSPENDIDA",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=20)
            }
        ]
        
        for ruta_data in mock_rutas:
            self.rutas[ruta_data["id"]] = RutaInDB(**ruta_data)

    def _create_mock_resoluciones(self):
        """Crear resoluciones de prueba"""
        mock_resoluciones = [
            {
                "id": "1",
                "numero": "RES-001-2025",
                "fecha_emision": datetime.utcnow() - timedelta(days=60),
                "fecha_vencimiento": datetime.utcnow() + timedelta(days=300),
                "tipo": "PRIMIGENIA",
                "empresa_id": "1",
                "expediente_id": "1",
                "estado": "VIGENTE",
                "observaciones": "Resolución primigenia para Transportes El Veloz",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=60)
            },
            {
                "id": "2",
                "numero": "RES-002-2025",
                "fecha_emision": datetime.utcnow() - timedelta(days=45),
                "fecha_vencimiento": datetime.utcnow() + timedelta(days=315),
                "tipo": "MODIFICATORIA",
                "empresa_id": "1",
                "expediente_id": "1",
                "estado": "VIGENTE",
                "observaciones": "Modificación de rutas autorizadas",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=45)
            },
            {
                "id": "3",
                "numero": "RES-003-2025",
                "fecha_emision": datetime.utcnow() - timedelta(days=30),
                "fecha_vencimiento": datetime.utcnow() + timedelta(days=330),
                "tipo": "PRIMIGENIA",
                "empresa_id": "2",
                "expediente_id": "2",
                "estado": "VIGENTE",
                "observaciones": "Resolución primigenia para Empresa de Transportes Puno",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=30)
            },
            {
                "id": "4",
                "numero": "RES-004-2024",
                "fecha_emision": datetime.utcnow() - timedelta(days=365),
                "fecha_vencimiento": datetime.utcnow() - timedelta(days=30),
                "tipo": "PRIMIGENIA",
                "empresa_id": "3",
                "expediente_id": "3",
                "estado": "VENCIDA",
                "observaciones": "Resolución vencida",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=365)
            }
        ]
        
        for resolucion_data in mock_resoluciones:
            self.resoluciones[resolucion_data["id"]] = ResolucionInDB(**resolucion_data)

    def _create_mock_tucs(self):
        """Crear TUCs de prueba"""
        mock_tucs = [
            {
                "id": "1",
                "nro_tuc": "T-123456-2025",
                "vehiculo_id": "1",
                "empresa_id": "1",
                "expediente_id": "1",
                "fecha_emision": datetime.utcnow() - timedelta(days=30),
                "fecha_vencimiento": datetime.utcnow() + timedelta(days=335),
                "estado": "VIGENTE",
                "observaciones": "TUC para Mercedes-Benz",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=30)
            },
            {
                "id": "2",
                "nro_tuc": "T-123457-2025",
                "vehiculo_id": "2",
                "empresa_id": "1",
                "expediente_id": "1",
                "fecha_emision": datetime.utcnow() - timedelta(days=25),
                "fecha_vencimiento": datetime.utcnow() + timedelta(days=340),
                "estado": "VIGENTE",
                "observaciones": "TUC para Volvo",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=25)
            },
            {
                "id": "3",
                "nro_tuc": "T-123458-2025",
                "vehiculo_id": "3",
                "empresa_id": "1",
                "expediente_id": "1",
                "fecha_emision": datetime.utcnow() - timedelta(days=20),
                "fecha_vencimiento": datetime.utcnow() + timedelta(days=345),
                "estado": "VIGENTE",
                "observaciones": "TUC para Toyota",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=20)
            },
            {
                "id": "4",
                "nro_tuc": "T-123459-2025",
                "vehiculo_id": "4",
                "empresa_id": "2",
                "expediente_id": "2",
                "fecha_emision": datetime.utcnow() - timedelta(days=15),
                "fecha_vencimiento": datetime.utcnow() + timedelta(days=350),
                "estado": "VIGENTE",
                "observaciones": "TUC para Scania",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=15)
            },
            {
                "id": "5",
                "nro_tuc": "T-123460-2025",
                "vehiculo_id": "5",
                "empresa_id": "2",
                "expediente_id": "2",
                "fecha_emision": datetime.utcnow() - timedelta(days=10),
                "fecha_vencimiento": datetime.utcnow() + timedelta(days=355),
                "estado": "SUSPENDIDO",
                "observaciones": "TUC suspendido por mantenimiento",
                "esta_activo": True,
                "fecha_registro": datetime.utcnow() - timedelta(days=10)
            }
        ]
        
        for tuc_data in mock_tucs:
            self.tucs[tuc_data["id"]] = TucInDB(**tuc_data)

# Instancia global del servicio mock
mock_service = MockDataService() 