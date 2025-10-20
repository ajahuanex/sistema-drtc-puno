from datetime import datetime, date, timedelta
from typing import Dict, List
from app.models.usuario import UsuarioInDB, UsuarioCreate, UsuarioUpdate
from app.models.empresa import (
    EmpresaInDB, EmpresaCreate, EmpresaUpdate, 
    EstadoEmpresa, TipoDocumento, DocumentoEmpresa, AuditoriaEmpresa,
    RazonSocial, RepresentanteLegal
)
from app.models.vehiculo import VehiculoInDB, VehiculoCreate, VehiculoUpdate, DatosTecnicos, CategoriaVehiculo, EstadoVehiculo, TipoCombustible, SedeRegistro, MotivoSustitucion
from app.models.ruta import RutaInDB, RutaCreate, RutaUpdate, EstadoRuta, TipoRuta, TipoServicio
from app.models.resolucion import ResolucionInDB, ResolucionCreate, ResolucionUpdate, TipoResolucion, TipoTramite, EstadoResolucion
from app.models.tuc import TucInDB, TucCreate, TucUpdate, Tuc
from app.models.conductor import (
    ConductorInDB, 
    EstadoConductor, 
    EstadoLicencia, 
    TipoLicencia,
    Genero,
    EstadoCivil
)
# from passlib.context import CryptContext

# Configurar passlib para evitar errores con bcrypt
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__default_rounds=12)

class MockDataService:
    """Servicio centralizado para datos mock del sistema"""
    
    def __init__(self):
        self._init_usuarios()
        self._init_conductores()
        self._init_empresas()
        self._init_vehiculos()
        self._init_rutas()
        self._init_resoluciones()

    def _init_usuarios(self):
        """Inicializar datos mock de usuarios"""
        self.usuarios: Dict[str, UsuarioInDB] = {}
        
        # Usuario 1 - Administrador del sistema
        self.usuarios["USR001"] = UsuarioInDB(
            id="USR001",
            dni="12345678",
            nombres="ADMINISTRADOR",
            apellidos="SISTEMA DRTC",
            email="admin@drtc-puno.gob.pe",
            passwordHash="hashed_password_here",  # En modo mock, esto no se valida
            rolId="ADMINISTRADOR",
            estaActivo=True,
            fechaCreacion=datetime(2024, 1, 1, 8, 0, 0),
            fechaActualizacion=datetime(2024, 1, 1, 8, 0, 0)
        )
        
        # Usuario 2 - Usuario de prueba
        self.usuarios["USR002"] = UsuarioInDB(
            id="USR002",
            dni="87654321",
            nombres="USUARIO",
            apellidos="PRUEBA SISTEMA",
            email="usuario@drtc-puno.gob.pe",
            passwordHash="hashed_password_here",  # En modo mock, esto no se valida
            rolId="USUARIO",
            estaActivo=True,
            fechaCreacion=datetime(2024, 1, 1, 8, 0, 0),
            fechaActualizacion=datetime(2024, 1, 1, 8, 0, 0)
        )

    def _init_conductores(self):
        """Inicializar datos mock de conductores"""
        self.conductores: Dict[str, ConductorInDB] = {}
        
        # Conductor 1 - Juan Carlos Pérez García
        self.conductores["1"] = ConductorInDB(
            id="1",
            dni="12345678",
            apellidoPaterno="PÉREZ",
            apellidoMaterno="GARCÍA",
            nombres="JUAN CARLOS",
            # nombreCompleto se genera dinámicamente
            fechaNacimiento=date(1985, 5, 15),
            genero=Genero.MASCULINO,
            estadoCivil=EstadoCivil.CASADO,
            direccion="AV. AREQUIPA 123, PUNO",
            distrito="PUNO",
            provincia="PUNO",
            departamento="PUNO",
            telefono="051-123456",
            celular="951234567",
            email="juan.perez@email.com",
            numeroLicencia="LIC-001-2024",
            categoriaLicencia=[TipoLicencia.C2, TipoLicencia.D1],
            fechaEmisionLicencia=date(2024, 1, 15),
            fechaVencimientoLicencia=date(2029, 1, 15),
            estadoLicencia=EstadoLicencia.VIGENTE,
            entidadEmisora="DIRCETUR PUNO",
            empresaId="1",
            fechaIngreso=date(2024, 1, 20),
            cargo="CONDUCTOR PRINCIPAL",
            estado=EstadoConductor.ACTIVO,
            estaActivo=True,
            experienciaAnos=15,
            tipoSangre="O+",
            restricciones=["LENTES"],
            observaciones="Conductor experimentado con excelente historial",
            documentosIds=["DOC001", "DOC002"],
            fotoPerfil=None,
            fechaRegistro=datetime(2024, 1, 15, 8, 0, 0),
            fechaActualizacion=datetime(2024, 1, 20, 9, 0, 0),
            fechaUltimaVerificacion=datetime(2024, 1, 15, 8, 0, 0),
            usuarioRegistroId="USR001",
            usuarioActualizacionId="USR001"
        )

        # Conductor 2 - María Elena Rodríguez López
        self.conductores["2"] = ConductorInDB(
            id="2",
            dni="87654321",
            apellidoPaterno="RODRÍGUEZ",
            apellidoMaterno="LÓPEZ",
            nombres="MARÍA ELENA",
            # nombreCompleto se genera dinámicamente
            fechaNacimiento=date(1990, 8, 22),
            genero=Genero.FEMENINO,
            estadoCivil=EstadoCivil.SOLTERO,
            direccion="JR. TACNA 456, PUNO",
            distrito="PUNO",
            provincia="PUNO",
            departamento="PUNO",
            telefono="051-654321",
            celular="987654321",
            email="maria.rodriguez@email.com",
            numeroLicencia="LIC-002-2024",
            categoriaLicencia=[TipoLicencia.C1, TipoLicencia.B2],
            fechaEmisionLicencia=date(2024, 2, 20),
            fechaVencimientoLicencia=date(2029, 2, 20),
            estadoLicencia=EstadoLicencia.VIGENTE,
            entidadEmisora="DIRCETUR PUNO",
            empresaId="1",
            fechaIngreso=date(2024, 2, 25),
            cargo="CONDUCTORA AUXILIAR",
            estado=EstadoConductor.ACTIVO,
            estaActivo=True,
            experienciaAnos=8,
            tipoSangre="A+",
            restricciones=[],
            observaciones="Conductora responsable con buen historial",
            documentosIds=["DOC003", "DOC004"],
            fotoPerfil=None,
            fechaRegistro=datetime(2024, 2, 20, 9, 0, 0),
            fechaActualizacion=datetime(2024, 2, 25, 10, 0, 0),
            fechaUltimaVerificacion=datetime(2024, 2, 20, 9, 0, 0),
            usuarioRegistroId="USR001",
            usuarioActualizacionId="USR001"
        )

        # Conductor 3 - Carlos Alberto Gutiérrez Silva
        self.conductores["3"] = ConductorInDB(
            id="3",
            dni="11223344",
            apellidoPaterno="GUTIÉRREZ",
            apellidoMaterno="SILVA",
            nombres="CARLOS ALBERTO",
            # nombreCompleto se genera dinámicamente
            fechaNacimiento=date(1988, 12, 10),
            genero=Genero.MASCULINO,
            estadoCivil=EstadoCivil.CONVIVIENTE,
            direccion="AV. LA MARINA 789, PUNO",
            distrito="PUNO",
            provincia="PUNO",
            departamento="PUNO",
            telefono="051-456789",
            celular="945678123",
            email="carlos.gutierrez@email.com",
            numeroLicencia="LIC-003-2024",
            categoriaLicencia=[TipoLicencia.D2, TipoLicencia.C3],
            fechaEmisionLicencia=date(2024, 3, 10),
            fechaVencimientoLicencia=date(2029, 3, 10),
            estadoLicencia=EstadoLicencia.VIGENTE,
            entidadEmisora="DIRCETUR PUNO",
            empresaId="2",
            fechaIngreso=date(2024, 3, 15),
            cargo="CONDUCTOR DE CARGA",
            estado=EstadoConductor.ACTIVO,
            estaActivo=True,
            experienciaAnos=12,
            tipoSangre="B+",
            restricciones=[],
            observaciones="Conductor especializado en transporte de carga",
            documentosIds=["DOC005", "DOC006"],
            fotoPerfil=None,
            fechaRegistro=datetime(2024, 3, 10, 10, 0, 0),
            fechaActualizacion=datetime(2024, 3, 15, 11, 0, 0),
            fechaUltimaVerificacion=datetime(2024, 3, 10, 10, 0, 0),
            usuarioRegistroId="USR001",
            usuarioActualizacionId="USR001"
        )

        # Conductor 4 - Ana Patricia Morales Torres
        self.conductores["4"] = ConductorInDB(
            id="4",
            dni="55667788",
            apellidoPaterno="MORALES",
            apellidoMaterno="TORRES",
            nombres="ANA PATRICIA",
            # nombreCompleto se genera dinámicamente
            fechaNacimiento=date(1992, 4, 18),
            genero=Genero.FEMENINO,
            estadoCivil=EstadoCivil.SOLTERO,
            direccion="JR. LAMPA 321, PUNO",
            distrito="PUNO",
            provincia="PUNO",
            departamento="PUNO",
            telefono="051-789123",
            celular="978912345",
            email="ana.morales@email.com",
            numeroLicencia="LIC-004-2024",
            categoriaLicencia=[TipoLicencia.B1, TipoLicencia.A2],
            fechaEmisionLicencia=date(2024, 4, 5),
            fechaVencimientoLicencia=date(2029, 4, 5),
            estadoLicencia=EstadoLicencia.VIGENTE,
            entidadEmisora="DIRCETUR PUNO",
            empresaId="2",
            fechaIngreso=date(2024, 4, 10),
            cargo="CONDUCTORA DE PASAJEROS",
            estado=EstadoConductor.ACTIVO,
            estaActivo=True,
            experienciaAnos=6,
            tipoSangre="AB+",
            restricciones=["LENTES"],
            observaciones="Conductora joven con potencial de crecimiento",
            documentosIds=["DOC007", "DOC008"],
            fotoPerfil=None,
            fechaRegistro=datetime(2024, 4, 5, 14, 0, 0),
            fechaActualizacion=datetime(2024, 4, 10, 15, 0, 0),
            fechaUltimaVerificacion=datetime(2024, 4, 5, 14, 0, 0),
            usuarioRegistroId="USR001",
            usuarioActualizacionId="USR001"
        )

        # Conductor 5 - Roberto José Fernández Castro
        self.conductores["5"] = ConductorInDB(
            id="5",
            dni="99887766",
            apellidoPaterno="FERNÁNDEZ",
            apellidoMaterno="CASTRO",
            nombres="ROBERTO JOSÉ",
            # nombreCompleto se genera dinámicamente
            fechaNacimiento=date(1983, 7, 30),
            genero=Genero.MASCULINO,
            estadoCivil=EstadoCivil.CASADO,
            direccion="AV. TACNA 654, PUNO",
            distrito="PUNO",
            provincia="PUNO",
            departamento="PUNO",
            telefono="051-321654",
            celular="932165498",
            email="roberto.fernandez@email.com",
            numeroLicencia="LIC-005-2024",
            categoriaLicencia=[TipoLicencia.D3, TipoLicencia.E1],
            fechaEmisionLicencia=date(2024, 5, 12),
            fechaVencimientoLicencia=date(2029, 5, 12),
            estadoLicencia=EstadoLicencia.VIGENTE,
            entidadEmisora="DIRCETUR PUNO",
            empresaId="3",
            fechaIngreso=date(2024, 5, 18),
            cargo="CONDUCTOR SENIOR",
            estado=EstadoConductor.ACTIVO,
            estaActivo=True,
            experienciaAnos=20,
            tipoSangre="O-",
            restricciones=[],
            observaciones="Conductor veterano con amplia experiencia en transporte interprovincial",
            documentosIds=["DOC009", "DOC010"],
            fotoPerfil=None,
            fechaRegistro=datetime(2024, 5, 12, 16, 0, 0),
            fechaActualizacion=datetime(2024, 5, 18, 17, 0, 0),
            fechaUltimaVerificacion=datetime(2024, 5, 12, 16, 0, 0),
            usuarioRegistroId="USR001",
            usuarioActualizacionId="USR001"
        )

        # Conductor 6 - Lucía Isabel Vargas Mendoza
        self.conductores["6"] = ConductorInDB(
            id="6",
            dni="44332211",
            apellidoPaterno="VARGAS",
            apellidoMaterno="MENDOZA",
            nombres="LUCÍA ISABEL",
            # nombreCompleto se genera dinámicamente
            fechaNacimiento=date(1989, 11, 25),
            genero=Genero.FEMENINO,
            estadoCivil=EstadoCivil.DIVORCIADO,
            direccion="JR. MOQUEGUA 987, PUNO",
            distrito="PUNO",
            provincia="PUNO",
            departamento="PUNO",
            telefono="051-987654",
            celular="998765432",
            email="lucia.vargas@email.com",
            numeroLicencia="LIC-006-2024",
            categoriaLicencia=[TipoLicencia.C1, TipoLicencia.B2],
            fechaEmisionLicencia=date(2024, 6, 8),
            fechaVencimientoLicencia=date(2029, 6, 8),
            estadoLicencia=EstadoLicencia.VIGENTE,
            entidadEmisora="DIRCETUR PUNO",
            empresaId="3",
            fechaIngreso=date(2024, 6, 15),
            cargo="CONDUCTORA DE TURISMO",
            estado=EstadoConductor.ACTIVO,
            estaActivo=True,
            experienciaAnos=10,
            tipoSangre="A-",
            restricciones=[],
            observaciones="Conductora especializada en rutas turísticas",
            documentosIds=["DOC011", "DOC012"],
            fotoPerfil=None,
            fechaRegistro=datetime(2024, 6, 8, 12, 0, 0),
            fechaActualizacion=datetime(2024, 6, 15, 13, 0, 0),
            fechaUltimaVerificacion=datetime(2024, 6, 8, 12, 0, 0),
            usuarioRegistroId="USR001",
            usuarioActualizacionId="USR001"
        )

        # Conductor 7 - Miguel Ángel Huamán Quispe
        self.conductores["7"] = ConductorInDB(
            id="7",
            dni="11223355",
            apellidoPaterno="HUAMÁN",
            apellidoMaterno="QUISPE",
            nombres="MIGUEL ÁNGEL",
            # nombreCompleto se genera dinámicamente
            fechaNacimiento=date(1987, 3, 14),
            genero=Genero.MASCULINO,
            estadoCivil=EstadoCivil.CASADO,
            direccion="AV. JULIACA 147, PUNO",
            distrito="PUNO",
            provincia="PUNO",
            departamento="PUNO",
            telefono="051-147258",
            celular="914725836",
            email="miguel.huaman@email.com",
            numeroLicencia="LIC-007-2024",
            categoriaLicencia=[TipoLicencia.A1, TipoLicencia.B1],
            fechaEmisionLicencia=date(2024, 7, 20),
            fechaVencimientoLicencia=date(2029, 7, 20),
            estadoLicencia=EstadoLicencia.VIGENTE,
            entidadEmisora="DIRCETUR PUNO",
            empresaId="4",
            fechaIngreso=date(2024, 7, 25),
            cargo="CONDUCTOR DE MOTOTAXI",
            estado=EstadoConductor.ACTIVO,
            estaActivo=True,
            experienciaAnos=7,
            tipoSangre="B-",
            restricciones=[],
            observaciones="Conductor especializado en transporte urbano con mototaxi",
            documentosIds=["DOC013", "DOC014"],
            fotoPerfil=None,
            fechaRegistro=datetime(2024, 7, 20, 8, 30, 0),
            fechaActualizacion=datetime(2024, 7, 25, 9, 30, 0),
            fechaUltimaVerificacion=datetime(2024, 7, 20, 8, 30, 0),
            usuarioRegistroId="USR001",
            usuarioActualizacionId="USR001"
        )

        # Conductor 8 - Sandra Milagros Ríos Flores
        self.conductores["8"] = ConductorInDB(
            id="8",
            dni="66778899",
            apellidoPaterno="RÍOS",
            apellidoMaterno="FLORES",
            nombres="SANDRA MILAGROS",
            # nombreCompleto se genera dinámicamente
            fechaNacimiento=date(1991, 9, 8),
            genero=Genero.FEMENINO,
            estadoCivil=EstadoCivil.SOLTERO,
            direccion="JR. CUSCO 258, PUNO",
            distrito="PUNO",
            provincia="PUNO",
            departamento="PUNO",
            telefono="051-258369",
            celular="925836947",
            email="sandra.rios@email.com",
            numeroLicencia="LIC-008-2024",
            categoriaLicencia=[TipoLicencia.B2, TipoLicencia.C1],
            fechaEmisionLicencia=date(2024, 8, 15),
            fechaVencimientoLicencia=date(2029, 8, 15),
            estadoLicencia=EstadoLicencia.VIGENTE,
            entidadEmisora="DIRCETUR PUNO",
            empresaId="4",
            fechaIngreso=date(2024, 8, 20),
            cargo="CONDUCTORA DE SERVICIO ESPECIAL",
            estado=EstadoConductor.ACTIVO,
            estaActivo=True,
            experienciaAnos=9,
            tipoSangre="O+",
            restricciones=[],
            observaciones="Conductora especializada en servicios especiales y eventos",
            documentosIds=["DOC015", "DOC016"],
            fotoPerfil=None,
            fechaRegistro=datetime(2024, 8, 15, 10, 0, 0),
            fechaActualizacion=datetime(2024, 8, 20, 11, 0, 0),
            fechaUltimaVerificacion=datetime(2024, 8, 15, 10, 0, 0),
            usuarioRegistroId="USR001",
            usuarioActualizacionId="USR001"
        )

    def _init_empresas(self):
        """Inicializar datos mock de empresas"""
        self.empresas: Dict[str, EmpresaInDB] = {}
        
        # Empresa 1 - TRANSPORTES PUNO S.A.
        self.empresas["1"] = EmpresaInDB(
            id="1",
            codigoEmpresa="0001TPU",
            ruc="20123456789",
            razonSocial=RazonSocial(
                principal="TRANSPORTES PUNO S.A.",
                sunat="TRANSPORTES PUNO S.A.",
                minimo="TRANSPORTES PUNO"
            ),
            direccionFiscal="AV. TACNA 123, PUNO, PUNO",
            estado=EstadoEmpresa.HABILITADA,
            representanteLegal=RepresentanteLegal(
                dni="12345678",
                nombres="JUAN CARLOS",
                apellidos="PEREZ GARCIA",
                email="juan.perez@transpuno.com",
                telefono="+51 951 123 456",
                direccion="AV. TACNA 123, PUNO, PUNO"
            ),
            emailContacto="contacto@transpuno.com",
            telefonoContacto="+51 51 123 456",
            sitioWeb="www.transpuno.com",
            estaActivo=True,
            fechaRegistro=datetime(2024, 1, 1, 8, 0, 0),
            fechaActualizacion=datetime(2024, 1, 1, 8, 0, 0)
        )

        # Empresa 2 - TRANSPORTES LIMA E.I.R.L.
        self.empresas["2"] = EmpresaInDB(
            id="2",
            codigoEmpresa="0002TLI",
            ruc="20234567890",
            razonSocial=RazonSocial(
                principal="TRANSPORTES LIMA E.I.R.L.",
                sunat="TRANSPORTES LIMA E.I.R.L.",
                minimo="TRANSPORTES LIMA"
            ),
            direccionFiscal="JR. AREQUIPA 456, LIMA, LIMA",
            estado=EstadoEmpresa.HABILITADA,
            representanteLegal=RepresentanteLegal(
                dni="23456789",
                nombres="MARIA ELENA",
                apellidos="RODRIGUEZ LOPEZ",
                email="maria.rodriguez@translima.com",
                telefono="+51 951 234 567",
                direccion="JR. AREQUIPA 456, LIMA, LIMA"
            ),
            emailContacto="contacto@translima.com",
            telefonoContacto="+51 1 234 567",
            sitioWeb="www.translima.com",
            estaActivo=True,
            fechaRegistro=datetime(2024, 1, 1, 8, 0, 0),
            fechaActualizacion=datetime(2024, 1, 1, 8, 0, 0)
        )

        # Empresa 3 - TRANSPORTES AREQUIPA S.A.C.
        self.empresas["3"] = EmpresaInDB(
            id="3",
            codigoEmpresa="0003TAR",
            ruc="20345678901",
            razonSocial=RazonSocial(
                principal="TRANSPORTES AREQUIPA S.A.C.",
                sunat="TRANSPORTES AREQUIPA S.A.C.",
                minimo="TRANSPORTES AREQUIPA"
            ),
            direccionFiscal="AV. INDEPENDENCIA 789, AREQUIPA, AREQUIPA",
            estado=EstadoEmpresa.HABILITADA,
            representanteLegal=RepresentanteLegal(
                dni="34567890",
                nombres="CARLOS ALBERTO",
                apellidos="TORRES VARGAS",
                email="carlos.torres@transarequipa.com",
                telefono="+51 951 345 678",
                direccion="AV. INDEPENDENCIA 789, AREQUIPA, AREQUIPA"
            ),
            emailContacto="contacto@transarequipa.com",
            telefonoContacto="+51 54 345 678",
            sitioWeb="www.transarequipa.com",
            estaActivo=True,
            fechaRegistro=datetime(2024, 1, 1, 8, 0, 0),
            fechaActualizacion=datetime(2024, 1, 1, 8, 0, 0)
        )

        # Empresa 4 - TRANSPORTES CUSCO S.A.
        self.empresas["4"] = EmpresaInDB(
            id="4",
            codigoEmpresa="0004TCU",
            ruc="20456789012",
            razonSocial=RazonSocial(
                principal="TRANSPORTES CUSCO S.A.",
                sunat="TRANSPORTES CUSCO S.A.",
                minimo="TRANSPORTES CUSCO"
            ),
            direccionFiscal="AV. SOL 321, CUSCO, CUSCO",
            estado=EstadoEmpresa.HABILITADA,
            representanteLegal=RepresentanteLegal(
                dni="45678901",
                nombres="ANA LUCIA",
                apellidos="FLORES MARTINEZ",
                email="ana.flores@transcusco.com",
                telefono="+51 951 456 789",
                direccion="AV. SOL 321, CUSCO, CUSCO"
            ),
            emailContacto="contacto@transcusco.com",
            telefonoContacto="+51 84 456 789",
            sitioWeb="www.transcusco.com",
            estaActivo=True,
            fechaRegistro=datetime(2024, 1, 1, 8, 0, 0),
            fechaActualizacion=datetime(2024, 1, 1, 8, 0, 0)
        )

    def _init_vehiculos(self):
        """Inicializar datos mock de vehículos"""
        self.vehiculos: Dict[str, VehiculoInDB] = {}
        
        # Vehículo 1 - Bus de pasajeros
        self.vehiculos["1"] = VehiculoInDB(
            id="1",
            placa="ABC-123",
            empresaActualId="1",
            categoria=CategoriaVehiculo.M3,
            marca="MERCEDES BENZ",
            modelo="O500",
            anioFabricacion=2020,
            color="BLANCO",
            estado=EstadoVehiculo.ACTIVO,
            sedeRegistro=SedeRegistro.PUNO,
            datosTecnicos=DatosTecnicos(
                motor="OM 457 LA",
                chasis="WDB9066131L123456",
                ejes=2,
                asientos=50,
                pesoNeto=8500.0,
                pesoBruto=16000.0,
                medidas={"largo": 12.0, "ancho": 2.55, "alto": 3.2},
                tipoCombustible=TipoCombustible.DIESEL,
                cilindrada=11967.0,
                potencia=354.0
            ),
            estaActivo=True,
            fechaRegistro=datetime(2024, 1, 1, 8, 0, 0),
            fechaActualizacion=datetime(2024, 1, 1, 8, 0, 0)
        )

        # Vehículo 2 - Camión de carga
        self.vehiculos["2"] = VehiculoInDB(
            id="2",
            placa="XYZ-789",
            empresaActualId="2",
            categoria=CategoriaVehiculo.N3,
            marca="VOLVO",
            modelo="FH16",
            anioFabricacion=2019,
            color="AZUL",
            estado=EstadoVehiculo.ACTIVO,
            sedeRegistro=SedeRegistro.AREQUIPA,
            datosTecnicos=DatosTecnicos(
                motor="D16G750",
                chasis="VOLVOH16C123456",
                ejes=3,
                asientos=2,
                pesoNeto=12000.0,
                pesoBruto=26000.0,
                medidas={"largo": 16.0, "ancho": 2.6, "alto": 3.8},
                tipoCombustible=TipoCombustible.DIESEL,
                cilindrada=16000.0,
                potencia=750.0
            ),
            estaActivo=True,
            fechaRegistro=datetime(2024, 1, 1, 8, 0, 0),
            fechaActualizacion=datetime(2024, 1, 1, 8, 0, 0)
        )

        # Vehículo 3 - Van de turismo
        self.vehiculos["3"] = VehiculoInDB(
            id="3",
            placa="DEF-456",
            empresaActualId="3",
            categoria=CategoriaVehiculo.M2,
            marca="FORD",
            modelo="TRANSIT",
            anioFabricacion=2021,
            color="PLATEADO",
            estado=EstadoVehiculo.ACTIVO,
            sedeRegistro=SedeRegistro.CUSCO,
            datosTecnicos=DatosTecnicos(
                motor="2.0L EcoBlue",
                chasis="WF0EXXGBP1KE12345",
                ejes=2,
                asientos=15,
                pesoNeto=2200.0,
                pesoBruto=3500.0,
                medidas={"largo": 5.3, "ancho": 2.0, "alto": 2.5},
                tipoCombustible=TipoCombustible.DIESEL,
                cilindrada=1997.0,
                potencia=130.0
            ),
            estaActivo=True,
            fechaRegistro=datetime(2024, 1, 1, 8, 0, 0),
            fechaActualizacion=datetime(2024, 1, 1, 8, 0, 0)
        )

        # Vehículo 4 - Mototaxi (sustituyó a otro vehículo)
        self.vehiculos["4"] = VehiculoInDB(
            id="4",
            placa="GHI-789",
            empresaActualId="4",
            categoria=CategoriaVehiculo.M1,
            marca="HONDA",
            modelo="WAVE",
            anioFabricacion=2022,
            color="ROJO",
            estado=EstadoVehiculo.ACTIVO,
            sedeRegistro=SedeRegistro.JULIACA,
            # Campos de sustitución - este vehículo sustituyó a OLD-456
            placaSustituida="OLD-456",
            fechaSustitucion=datetime(2024, 1, 15, 10, 0, 0),
            motivoSustitucion=MotivoSustitucion.ANTIGUEDAD,
            resolucionSustitucion="R-1004-2024",
            datosTecnicos=DatosTecnicos(
                motor="110cc",
                chasis="MLHJC123456789",
                ejes=2,
                asientos=3,
                pesoNeto=120.0,
                pesoBruto=300.0,
                medidas={"largo": 2.0, "ancho": 0.8, "alto": 1.5},
                tipoCombustible=TipoCombustible.GASOLINA,
                cilindrada=110.0,
                potencia=8.0
            ),
            estaActivo=True,
            fechaRegistro=datetime(2024, 1, 1, 8, 0, 0),
            fechaActualizacion=datetime(2024, 1, 1, 8, 0, 0)
        )

    def _init_rutas(self):
        """Inicializar datos mock de rutas"""
        self.rutas: Dict[str, RutaInDB] = {}
        
        # Ruta 1 - PUNO - JULIACA
        self.rutas["1"] = RutaInDB(
            id="1",
            codigoRuta="01",
            nombre="PUNO - JULIACA",
            origenId="1",
            destinoId="2",
            itinerarioIds=["1", "3", "2"],
            frecuencias="Diaria, cada 30 minutos",
            estado=EstadoRuta.ACTIVA,
            tipoRuta=TipoRuta.INTERPROVINCIAL,
            tipoServicio=TipoServicio.PASAJEROS,
            distancia=45.0,
            tiempoEstimado="01:00",
            tarifaBase=5.00,
            capacidadMaxima=50,
            horarios=[],
            restricciones=[],
            observaciones="Ruta principal interprovincial",
            empresasAutorizadasIds=["1"],
            vehiculosAsignadosIds=["1"],
            documentosIds=["1", "2"],
            historialIds=[],
            estaActivo=True,
            fechaRegistro=datetime(2024, 1, 1, 8, 0, 0),
            fechaActualizacion=datetime(2024, 1, 1, 8, 0, 0)
        )

        # Ruta 2 - PUNO - CUSCO
        self.rutas["2"] = RutaInDB(
            id="2",
            codigoRuta="02",
            nombre="PUNO - CUSCO",
            origenId="1",
            destinoId="3",
            itinerarioIds=["1", "4", "5", "3"],
            frecuencias="Diaria, 3 veces al día",
            estado=EstadoRuta.ACTIVA,
            tipoRuta=TipoRuta.INTERPROVINCIAL,
            tipoServicio=TipoServicio.PASAJEROS,
            distancia=350.0,
            tiempoEstimado="06:00",
            tarifaBase=25.00,
            capacidadMaxima=45,
            horarios=[],
            restricciones=[],
            observaciones="Ruta turística importante",
            empresasAutorizadasIds=["1"],
            vehiculosAsignadosIds=["1"],
            documentosIds=["3", "4"],
            historialIds=[],
            estaActivo=True,
            fechaRegistro=datetime(2024, 1, 1, 8, 0, 0),
            fechaActualizacion=datetime(2024, 1, 1, 8, 0, 0)
        )

    def _init_resoluciones(self):
        """Inicializar datos mock de resoluciones"""
        self.resoluciones: Dict[str, ResolucionInDB] = {}
        
        # Resolución 1 - TRANSPORTES PUNO S.A.
        self.resoluciones["1"] = ResolucionInDB(
            id="1",
            nroResolucion="R-1001-2024",
            empresaId="1",
            fechaEmision=datetime(2024, 1, 15, 8, 0, 0),
            fechaVigenciaInicio=datetime(2024, 1, 15, 8, 0, 0),
            fechaVigenciaFin=datetime(2029, 1, 15, 8, 0, 0),
            tipoResolucion=TipoResolucion.PADRE,
            tipoTramite=TipoTramite.PRIMIGENIA,
            descripcion="Autorización para operar rutas interprovinciales de pasajeros",
            expedienteId="EXP001",
            usuarioEmisionId="USR001",
            estado=EstadoResolucion.VIGENTE,
            estaActivo=True,
            fechaRegistro=datetime(2024, 1, 15, 8, 0, 0),
            fechaActualizacion=datetime(2024, 1, 15, 8, 0, 0)
        )

        # Resolución 2 - TRANSPORTES LIMA E.I.R.L.
        self.resoluciones["2"] = ResolucionInDB(
            id="2",
            nroResolucion="R-1002-2024",
            empresaId="2",
            fechaEmision=datetime(2024, 2, 20, 9, 0, 0),
            fechaVigenciaInicio=datetime(2024, 2, 20, 9, 0, 0),
            fechaVigenciaFin=datetime(2029, 2, 20, 9, 0, 0),
            tipoResolucion=TipoResolucion.PADRE,
            tipoTramite=TipoTramite.PRIMIGENIA,
            descripcion="Autorización para operar transporte de carga",
            expedienteId="EXP002",
            usuarioEmisionId="USR001",
            estado=EstadoResolucion.VIGENTE,
            estaActivo=True,
            fechaRegistro=datetime(2024, 2, 20, 9, 0, 0),
            fechaActualizacion=datetime(2024, 2, 20, 9, 0, 0)
        )

        # Resolución 3 - TRANSPORTES AREQUIPA S.A.C.
        self.resoluciones["3"] = ResolucionInDB(
            id="3",
            nroResolucion="R-1003-2024",
            empresaId="3",
            fechaEmision=datetime(2024, 3, 10, 10, 0, 0),
            fechaVigenciaInicio=datetime(2024, 3, 10, 10, 0, 0),
            fechaVigenciaFin=datetime(2029, 3, 10, 10, 0, 0),
            tipoResolucion=TipoResolucion.PADRE,
            tipoTramite=TipoTramite.PRIMIGENIA,
            descripcion="Autorización para operar transporte turístico",
            expedienteId="EXP003",
            usuarioEmisionId="USR001",
            estado=EstadoResolucion.VIGENTE,
            estaActivo=True,
            fechaRegistro=datetime(2024, 3, 10, 10, 0, 0),
            fechaActualizacion=datetime(2024, 3, 10, 10, 0, 0)
        )

        # Resolución 4 - TRANSPORTES CUSCO S.A.
        self.resoluciones["4"] = ResolucionInDB(
            id="4",
            nroResolucion="R-1004-2024",
            empresaId="4",
            fechaEmision=datetime(2024, 4, 5, 14, 0, 0),
            fechaVigenciaInicio=datetime(2024, 4, 5, 14, 0, 0),
            fechaVigenciaFin=datetime(2029, 4, 5, 14, 0, 0),
            tipoResolucion=TipoResolucion.PADRE,
            tipoTramite=TipoTramite.PRIMIGENIA,
            descripcion="Autorización para operar transporte urbano",
            expedienteId="EXP004",
            usuarioEmisionId="USR001",
            estado=EstadoResolucion.VIGENTE,
            estaActivo=True,
            fechaRegistro=datetime(2024, 4, 5, 14, 0, 0),
            fechaActualizacion=datetime(2024, 4, 5, 14, 0, 0)
        )

# Instancia global del servicio de datos mock
mock_service = MockDataService()

# Funciones de acceso para obtener datos mock
def get_mock_empresas() -> List[EmpresaInDB]:
    """Obtener lista de empresas mock"""
    return list(mock_service.empresas.values())

def get_mock_vehiculos() -> List[VehiculoInDB]:
    """Obtener lista de vehículos mock"""
    return list(mock_service.vehiculos.values())

def get_mock_rutas() -> List[RutaInDB]:
    """Obtener lista de rutas mock"""
    return list(mock_service.rutas.values())

def get_mock_resoluciones() -> List[ResolucionInDB]:
    """Obtener lista de resoluciones mock"""
    return list(mock_service.resoluciones.values())

def get_mock_conductores() -> List[ConductorInDB]:
    """Obtener lista de conductores mock"""
    return list(mock_service.conductores.values())

def get_mock_usuarios() -> List[UsuarioInDB]:
    """Obtener lista de usuarios mock"""
    return list(mock_service.usuarios.values())