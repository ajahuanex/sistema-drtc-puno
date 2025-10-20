import pandas as pd
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import re
from app.models.vehiculo import (
    VehiculoExcel, VehiculoCargaMasivaResponse, VehiculoValidacionExcel,
    VehiculoCreate, DatosTecnicos, CategoriaVehiculo, EstadoVehiculo, TipoCombustible, SedeRegistro, MotivoSustitucion
)
from app.services.mock_vehiculo_service import MockVehiculoService
from app.services.mock_data import mock_service

class VehiculoExcelService:
    """Servicio para procesar archivos Excel de vehículos"""
    
    def __init__(self):
        self.vehiculo_service = MockVehiculoService()
        self.empresas = mock_service.empresas
        self.resoluciones = mock_service.resoluciones
        self.rutas = mock_service.rutas
        
        # Configuración de auto-creación
        self.auto_crear_empresas = True  # Auto-crear empresas si no existen
        self.auto_crear_resoluciones = False  # NO auto-crear resoluciones (requieren proceso formal)
        self.auto_crear_rutas = False  # NO auto-crear rutas (requieren autorización)
        
        # Mapeo de columnas esperadas en Excel
        self.columnas_requeridas = {
            'placa': 'Placa',
            'empresa_ruc': 'RUC Empresa',
            'resolucion_primigenia': 'Resolución Primigenia',
            'resolucion_hija': 'Resolución Hija',
            'rutas_asignadas': 'Rutas Asignadas',
            'sede_registro': 'Sede de Registro',
            # Campos de sustitución
            'placa_sustituida': 'Placa Sustituida',
            'motivo_sustitucion': 'Motivo Sustitución',
            'resolucion_sustitucion': 'Resolución Sustitución',
            'categoria': 'Categoría',
            'marca': 'Marca',
            'modelo': 'Modelo',
            'anio_fabricacion': 'Año Fabricación',
            'color': 'Color',
            'numero_serie': 'Número Serie',
            'motor': 'Motor',
            'chasis': 'Chasis',
            'ejes': 'Ejes',
            'asientos': 'Asientos',
            'peso_neto': 'Peso Neto (kg)',
            'peso_bruto': 'Peso Bruto (kg)',
            'largo': 'Largo (m)',
            'ancho': 'Ancho (m)',
            'alto': 'Alto (m)',
            'tipo_combustible': 'Tipo Combustible',
            'cilindrada': 'Cilindrada',
            'potencia': 'Potencia (HP)',
            'estado': 'Estado',
            'observaciones': 'Observaciones'
        }

    async def procesar_excel(self, archivo_path: str) -> VehiculoCargaMasivaResponse:
        """Procesar archivo Excel y crear vehículos en lote"""
        try:
            # Leer archivo Excel
            df = pd.read_excel(archivo_path)
            
            # Validar estructura del archivo
            errores_estructura = self._validar_estructura_excel(df)
            if errores_estructura:
                return VehiculoCargaMasivaResponse(
                    total_procesados=0,
                    exitosos=0,
                    errores=len(errores_estructura),
                    vehiculos_creados=[],
                    errores_detalle=errores_estructura
                )
            
            # Procesar cada fila
            vehiculos_creados = []
            errores_detalle = []
            
            for index, row in df.iterrows():
                try:
                    # Validar datos de la fila
                    validacion = await self._validar_fila(index + 2, row)  # +2 porque Excel empieza en 1 y tiene header
                    
                    if not validacion.valido:
                        errores_detalle.append({
                            'fila': validacion.fila,
                            'placa': validacion.placa,
                            'errores': validacion.errores
                        })
                        continue
                    
                    # Crear vehículo
                    vehiculo_data = await self._convertir_fila_a_vehiculo(row)
                    vehiculo_creado = await self.vehiculo_service.create_vehiculo(vehiculo_data)
                    vehiculos_creados.append(vehiculo_creado.id)
                    
                except Exception as e:
                    errores_detalle.append({
                        'fila': index + 2,
                        'placa': str(row.get('Placa', 'N/A')),
                        'errores': [f"Error al procesar: {str(e)}"]
                    })
            
            return VehiculoCargaMasivaResponse(
                total_procesados=len(df),
                exitosos=len(vehiculos_creados),
                errores=len(errores_detalle),
                vehiculos_creados=vehiculos_creados,
                errores_detalle=errores_detalle
            )
            
        except Exception as e:
            return VehiculoCargaMasivaResponse(
                total_procesados=0,
                exitosos=0,
                errores=1,
                vehiculos_creados=[],
                errores_detalle=[{
                    'fila': 0,
                    'placa': 'N/A',
                    'errores': [f"Error al leer archivo: {str(e)}"]
                }]
            )

    def _validar_estructura_excel(self, df: pd.DataFrame) -> List[Dict]:
        """Validar que el Excel tenga la estructura correcta"""
        errores = []
        
        # Verificar columnas requeridas
        columnas_faltantes = []
        for col_key, col_name in self.columnas_requeridas.items():
            if col_name not in df.columns:
                # Solo marcar como faltantes las columnas realmente requeridas
                if col_key in ['placa', 'empresa_ruc', 'categoria', 'marca', 'modelo', 
                              'anio_fabricacion', 'motor', 'chasis', 'ejes', 'asientos',
                              'peso_neto', 'peso_bruto', 'largo', 'ancho', 'alto', 'tipo_combustible']:
                    columnas_faltantes.append(col_name)
        
        if columnas_faltantes:
            errores.append({
                'fila': 0,
                'placa': 'N/A',
                'errores': [f"Columnas faltantes: {', '.join(columnas_faltantes)}"]
            })
        
        # Verificar que hay datos
        if len(df) == 0:
            errores.append({
                'fila': 0,
                'placa': 'N/A',
                'errores': ["El archivo no contiene datos"]
            })
        
        return errores

    async def _validar_fila(self, fila: int, row: pd.Series) -> VehiculoValidacionExcel:
        """Validar datos de una fila específica"""
        errores = []
        advertencias = []
        placa = str(row.get('Placa', '')).strip()
        
        # Validar placa
        if not placa:
            errores.append("Placa es requerida")
        elif not self._validar_formato_placa(placa):
            errores.append("Formato de placa inválido")
        else:
            # Verificar si la placa ya existe
            vehiculo_existente = await self.vehiculo_service.get_vehiculo_by_placa(placa)
            if vehiculo_existente:
                errores.append(f"Ya existe un vehículo con placa {placa}")
        
        # Validar empresa por RUC
        empresa_ruc = str(row.get('RUC Empresa', '')).strip()
        if not empresa_ruc:
            errores.append("RUC de empresa es requerido")
        elif not re.match(r'^\d{11}$', empresa_ruc):
            errores.append(f"RUC debe tener 11 dígitos: {empresa_ruc}")
        else:
            empresa = self._buscar_empresa_por_ruc(empresa_ruc)
            if not empresa:
                if self.auto_crear_empresas:
                    advertencias.append(f"Empresa con RUC {empresa_ruc} será creada automáticamente")
                else:
                    errores.append(f"No se encontró empresa con RUC {empresa_ruc}")
        
        # Validar categoría
        categoria = str(row.get('Categoría', '')).strip()
        if not categoria:
            errores.append("Categoría es requerida")
        elif categoria not in [cat.value for cat in CategoriaVehiculo]:
            errores.append(f"Categoría inválida: {categoria}")
        
        # Validar tipo de combustible
        tipo_combustible = str(row.get('Tipo Combustible', '')).strip()
        if not tipo_combustible:
            errores.append("Tipo de combustible es requerido")
        elif tipo_combustible not in [tc.value for tc in TipoCombustible]:
            errores.append(f"Tipo de combustible inválido: {tipo_combustible}")
        
        # Validar sede de registro
        sede_registro = str(row.get('Sede de Registro', 'PUNO')).strip()
        if sede_registro and sede_registro not in [sede.value for sede in SedeRegistro]:
            errores.append(f"Sede de registro inválida: {sede_registro}")
        
        # Validar campos de sustitución
        placa_sustituida = str(row.get('Placa Sustituida', '')).strip() if pd.notna(row.get('Placa Sustituida')) else None
        motivo_sustitucion = str(row.get('Motivo Sustitución', '')).strip() if pd.notna(row.get('Motivo Sustitución')) else None
        resolucion_sustitucion = str(row.get('Resolución Sustitución', '')).strip() if pd.notna(row.get('Resolución Sustitución')) else None
        
        # Si hay placa sustituida, validar que exista el vehículo
        if placa_sustituida:
            if not self._validar_formato_placa(placa_sustituida):
                errores.append(f"Formato de placa sustituida inválido: {placa_sustituida}")
            else:
                # Verificar que el vehículo sustituido exista
                vehiculo_sustituido = await self.vehiculo_service.get_vehiculo_by_placa(placa_sustituida)
                if not vehiculo_sustituido:
                    advertencias.append(f"Vehículo con placa {placa_sustituida} no encontrado para sustitución")
                
                # Si hay sustitución, debe haber motivo
                if not motivo_sustitucion:
                    errores.append("Si se especifica placa sustituida, debe indicarse el motivo de sustitución")
                elif motivo_sustitucion not in [motivo.value for motivo in MotivoSustitucion]:
                    errores.append(f"Motivo de sustitución inválido: {motivo_sustitucion}")
                
                # Si hay sustitución, debe haber resolución de sustitución
                if not resolucion_sustitucion:
                    errores.append("Si se especifica placa sustituida, debe indicarse la resolución de sustitución")
                elif not self._validar_formato_resolucion(resolucion_sustitucion):
                    errores.append(f"Formato de resolución de sustitución inválido: {resolucion_sustitucion}")
        
        # Validar campos numéricos
        campos_numericos = {
            'Año Fabricación': (1900, 2030),
            'Ejes': (1, 10),
            'Asientos': (1, 100),
            'Peso Neto (kg)': (100, 50000),
            'Peso Bruto (kg)': (100, 100000),
            'Largo (m)': (1, 30),
            'Ancho (m)': (0.5, 5),
            'Alto (m)': (0.5, 5)
        }
        
        for campo, (min_val, max_val) in campos_numericos.items():
            valor = row.get(campo)
            if pd.isna(valor):
                errores.append(f"{campo} es requerido")
            else:
                try:
                    valor_num = float(valor)
                    if valor_num < min_val or valor_num > max_val:
                        errores.append(f"{campo} debe estar entre {min_val} y {max_val}")
                except (ValueError, TypeError):
                    errores.append(f"{campo} debe ser un número válido")
        
        # Validar resoluciones si se proporcionan
        if pd.notna(row.get('Resolución Primigenia')):
            resolucion_primigenia = str(row.get('Resolución Primigenia')).strip()
            
            # Validar formato R-1234-2025
            if not self._validar_formato_resolucion(resolucion_primigenia):
                errores.append(f"Formato de resolución primigenia inválido: {resolucion_primigenia} (debe ser R-1234-2025)")
            else:
                resolucion = self._buscar_resolucion_por_numero(resolucion_primigenia)
                if not resolucion:
                    if self.auto_crear_resoluciones:
                        advertencias.append(f"Resolución primigenia {resolucion_primigenia} será creada automáticamente")
                    else:
                        errores.append(f"No se encontró resolución primigenia: {resolucion_primigenia}")
                elif resolucion.tipoResolucion != 'PADRE':
                    advertencias.append(f"La resolución {resolucion_primigenia} no es una resolución primigenia (PADRE)")
        
        if pd.notna(row.get('Resolución Hija')):
            resolucion_hija = str(row.get('Resolución Hija')).strip()
            
            # Validar formato R-1234-2025
            if not self._validar_formato_resolucion(resolucion_hija):
                errores.append(f"Formato de resolución hija inválido: {resolucion_hija} (debe ser R-1234-2025)")
            else:
                resolucion = self._buscar_resolucion_por_numero(resolucion_hija)
                if not resolucion:
                    if self.auto_crear_resoluciones:
                        advertencias.append(f"Resolución hija {resolucion_hija} será creada automáticamente")
                    else:
                        errores.append(f"No se encontró resolución hija: {resolucion_hija}")
                elif resolucion.tipoResolucion != 'HIJA':
                    advertencias.append(f"La resolución {resolucion_hija} no es una resolución hija")
            
            # Validar que si hay resolución hija, debe haber primigenia
            if not pd.notna(row.get('Resolución Primigenia')):
                errores.append("Si se especifica una resolución hija, debe especificarse también la resolución primigenia")
        
        # Validar rutas si se proporcionan
        if pd.notna(row.get('Rutas Asignadas')):
            rutas_str = str(row.get('Rutas Asignadas')).strip()
            rutas_codigos = [r.strip() for r in rutas_str.split(',') if r.strip()]
            for codigo_ruta in rutas_codigos:
                if not self._buscar_ruta_por_codigo(codigo_ruta):
                    advertencias.append(f"No se encontró ruta con código: {codigo_ruta}")
        
        return VehiculoValidacionExcel(
            fila=fila,
            placa=placa,
            valido=len(errores) == 0,
            errores=errores,
            advertencias=advertencias
        )

    async def _convertir_fila_a_vehiculo(self, row: pd.Series) -> VehiculoCreate:
        """Convertir fila de Excel a modelo VehiculoCreate"""
        
        # Obtener o crear empresa por RUC
        empresa_ruc = str(row.get('RUC Empresa')).strip()
        nombre_sugerido = f"EMPRESA {str(row.get('Marca', '')).strip()} {str(row.get('Modelo', '')).strip()}".strip()
        empresa = self._obtener_o_crear_empresa(empresa_ruc, nombre_sugerido)
        
        # Determinar qué resolución usar (priorizar resolución hija si existe)
        resolucion_id = None
        if pd.notna(row.get('Resolución Hija')) and str(row.get('Resolución Hija')).strip():
            resolucion_hija = self._buscar_resolucion_por_numero(str(row.get('Resolución Hija')).strip())
            if resolucion_hija:
                resolucion_id = resolucion_hija.id
        elif pd.notna(row.get('Resolución Primigenia')) and str(row.get('Resolución Primigenia')).strip():
            resolucion_primigenia = self._buscar_resolucion_por_numero(str(row.get('Resolución Primigenia')).strip())
            if resolucion_primigenia:
                resolucion_id = resolucion_primigenia.id
        
        # Procesar rutas asignadas
        rutas_asignadas = []
        if pd.notna(row.get('Rutas Asignadas')):
            rutas_str = str(row.get('Rutas Asignadas')).strip()
            rutas_codigos = [r.strip() for r in rutas_str.split(',') if r.strip()]
            for codigo_ruta in rutas_codigos:
                ruta = self._buscar_ruta_por_codigo(codigo_ruta)
                if ruta:
                    rutas_asignadas.append(ruta.id)
        
        # Crear datos técnicos con conversiones seguras
        try:
            datos_tecnicos = DatosTecnicos(
                motor=str(row.get('Motor', '')).strip(),
                chasis=str(row.get('Chasis', '')).strip(),
                ejes=int(float(str(row.get('Ejes', 2)))),
                asientos=int(float(str(row.get('Asientos', 1)))),
                pesoNeto=float(str(row.get('Peso Neto (kg)', 1000))),
                pesoBruto=float(str(row.get('Peso Bruto (kg)', 2000))),
                medidas={
                    'largo': float(str(row.get('Largo (m)', 5))),
                    'ancho': float(str(row.get('Ancho (m)', 2))),
                    'alto': float(str(row.get('Alto (m)', 2)))
                },
                tipoCombustible=TipoCombustible(str(row.get('Tipo Combustible')).strip()),
                cilindrada=float(str(row.get('Cilindrada'))) if pd.notna(row.get('Cilindrada')) and str(row.get('Cilindrada')).strip() else None,
                potencia=float(str(row.get('Potencia (HP)'))) if pd.notna(row.get('Potencia (HP)')) and str(row.get('Potencia (HP)')).strip() else None
            )
        except (ValueError, TypeError) as e:
            raise ValueError(f"Error en datos técnicos: {str(e)}")
        
        # Determinar sede de registro
        sede_registro_str = str(row.get('Sede de Registro', 'PUNO')).strip()
        sede_registro = SedeRegistro(sede_registro_str) if sede_registro_str in [sede.value for sede in SedeRegistro] else SedeRegistro.PUNO
        
        # Procesar campos de sustitución
        placa_sustituida = str(row.get('Placa Sustituida', '')).strip() if pd.notna(row.get('Placa Sustituida')) else None
        motivo_sustitucion = None
        if pd.notna(row.get('Motivo Sustitución')):
            motivo_str = str(row.get('Motivo Sustitución')).strip()
            if motivo_str in [motivo.value for motivo in MotivoSustitucion]:
                motivo_sustitucion = MotivoSustitucion(motivo_str)
        
        resolucion_sustitucion = str(row.get('Resolución Sustitución', '')).strip() if pd.notna(row.get('Resolución Sustitución')) else None
        fecha_sustitucion = datetime.utcnow() if placa_sustituida else None
        
        return VehiculoCreate(
            placa=str(row.get('Placa')).strip(),
            empresaActualId=str(empresa.id),
            resolucionId=resolucion_id,
            rutasAsignadasIds=rutas_asignadas,
            categoria=CategoriaVehiculo(str(row.get('Categoría')).strip()),
            marca=str(row.get('Marca', '')).strip(),
            modelo=str(row.get('Modelo', '')).strip(),
            anioFabricacion=int(float(str(row.get('Año Fabricación', 2020)))),
            sedeRegistro=sede_registro,
            # Campos de sustitución
            placaSustituida=placa_sustituida,
            fechaSustitucion=fecha_sustitucion,
            motivoSustitucion=motivo_sustitucion,
            resolucionSustitucion=resolucion_sustitucion,
            datosTecnicos=datos_tecnicos,
            color=str(row.get('Color', '')).strip() if pd.notna(row.get('Color')) else None,
            numeroSerie=str(row.get('Número Serie', '')).strip() if pd.notna(row.get('Número Serie')) else None,
            observaciones=str(row.get('Observaciones', '')).strip() if pd.notna(row.get('Observaciones')) else None
        )

    def _validar_formato_placa(self, placa: str) -> bool:
        """Validar formato de placa peruana"""
        # Formato: ABC-123 o AB-1234
        patron = r'^[A-Z]{2,3}-\d{3,4}$'
        return bool(re.match(patron, placa.upper()))

    def _buscar_empresa_por_ruc(self, ruc: str):
        """Buscar empresa por RUC"""
        for empresa in self.empresas.values():
            if empresa.ruc == ruc:
                return empresa
        return None

    def _buscar_resolucion_por_numero(self, numero: str):
        """Buscar resolución por número"""
        for resolucion in self.resoluciones.values():
            if resolucion.nroResolucion == numero:
                return resolucion
        return None

    def _buscar_ruta_por_codigo(self, codigo: str):
        """Buscar ruta por código"""
        for ruta in self.rutas.values():
            if ruta.codigoRuta == codigo:
                return ruta
        return None

    def _validar_formato_resolucion(self, numero: str) -> bool:
        """Validar formato de resolución R-1234-2025"""
        patron = r'^R-\d{4}-\d{4}$'
        return bool(re.match(patron, numero.upper()))

    def _crear_empresa_automatica(self, ruc: str, nombre_sugerido: str = None):
        """Crear empresa automáticamente si no existe"""
        if not self.auto_crear_empresas:
            return None
            
        # Validar RUC (11 dígitos)
        if not re.match(r'^\d{11}$', ruc):
            return None
            
        # Generar nuevo ID
        nuevo_id = str(len(self.empresas) + 1)
        
        # Crear empresa básica
        from app.models.empresa import EmpresaInDB, RazonSocial, RepresentanteLegal, EstadoEmpresa
        
        nombre_empresa = nombre_sugerido or f"EMPRESA RUC {ruc}"
        
        nueva_empresa = EmpresaInDB(
            id=nuevo_id,
            codigoEmpresa=f"{nuevo_id:04d}AUT",  # Código automático
            ruc=ruc,
            razonSocial=RazonSocial(
                principal=nombre_empresa,
                sunat=nombre_empresa,
                minimo=nombre_empresa[:20]
            ),
            direccionFiscal="DIRECCIÓN POR COMPLETAR",
            estado=EstadoEmpresa.HABILITADA,
            representanteLegal=RepresentanteLegal(
                dni="00000000",
                nombres="POR",
                apellidos="COMPLETAR",
                email="pendiente@empresa.com",
                telefono="+51 000 000 000",
                direccion="POR COMPLETAR"
            ),
            emailContacto="pendiente@empresa.com",
            telefonoContacto="+51 000 000 000",
            sitioWeb="",
            estaActivo=True,
            fechaRegistro=datetime.utcnow(),
            fechaActualizacion=datetime.utcnow()
        )
        
        # Agregar a la colección
        self.empresas[nuevo_id] = nueva_empresa
        
        return nueva_empresa

    def _obtener_o_crear_empresa(self, ruc: str, nombre_sugerido: str = None):
        """Obtener empresa existente o crear una nueva"""
        # Buscar empresa existente
        empresa_existente = self._buscar_empresa_por_ruc(ruc)
        if empresa_existente:
            return empresa_existente
            
        # Si no existe y está habilitada la auto-creación, crear nueva
        if self.auto_crear_empresas:
            return self._crear_empresa_automatica(ruc, nombre_sugerido)
            
        return None

    async def generar_plantilla_excel(self) -> str:
        """Generar plantilla Excel para carga masiva"""
        # Crear DataFrame con las columnas requeridas
        columnas = list(self.columnas_requeridas.values())
        
        # Datos de ejemplo
        datos_ejemplo = {
            'Placa': ['ABC-123', 'XYZ-456'],
            'RUC Empresa': ['20123456789', '20234567890'],
            'Resolución Primigenia': ['R-1001-2024', 'R-1002-2024'],
            'Resolución Hija': ['', ''],  # Opcional
            'Rutas Asignadas': ['01,02', '03'],
            'Sede de Registro': ['PUNO', 'AREQUIPA'],
            # Campos de sustitución (opcionales)
            'Placa Sustituida': ['', 'OLD-789'],  # Segundo vehículo sustituye a OLD-789
            'Motivo Sustitución': ['', 'ANTIGÜEDAD'],
            'Resolución Sustitución': ['', 'R-1002-2024'],
            'Categoría': ['M3', 'N3'],
            'Marca': ['MERCEDES BENZ', 'VOLVO'],
            'Modelo': ['O500', 'FH16'],
            'Año Fabricación': [2020, 2019],
            'Color': ['BLANCO', 'AZUL'],
            'Número Serie': ['MB123456', 'VL789012'],
            'Motor': ['OM 457 LA', 'D16G750'],
            'Chasis': ['WDB9066131L123456', 'VOLVOH16C123456'],
            'Ejes': [2, 3],
            'Asientos': [50, 2],
            'Peso Neto (kg)': [8500.0, 12000.0],
            'Peso Bruto (kg)': [16000.0, 26000.0],
            'Largo (m)': [12.0, 16.0],
            'Ancho (m)': [2.55, 2.6],
            'Alto (m)': [3.2, 3.8],
            'Tipo Combustible': ['DIESEL', 'DIESEL'],
            'Cilindrada': [11967.0, 16000.0],
            'Potencia (HP)': [354.0, 750.0],
            'Estado': ['ACTIVO', 'ACTIVO'],
            'Observaciones': ['Vehículo de ejemplo', 'Camión de carga']
        }
        
        df = pd.DataFrame(datos_ejemplo)
        
        # Guardar archivo
        archivo_plantilla = 'plantilla_vehiculos.xlsx'
        df.to_excel(archivo_plantilla, index=False)
        
        return archivo_plantilla

    async def validar_excel_preview(self, archivo_path: str) -> List[VehiculoValidacionExcel]:
        """Validar Excel y mostrar preview de errores sin procesar"""
        try:
            df = pd.read_excel(archivo_path)
            
            # Validar estructura
            errores_estructura = self._validar_estructura_excel(df)
            if errores_estructura:
                return [VehiculoValidacionExcel(
                    fila=0,
                    placa='N/A',
                    valido=False,
                    errores=[error['errores'][0] for error in errores_estructura],
                    advertencias=[]
                )]
            
            # Validar cada fila (máximo 100 para preview)
            validaciones = []
            max_filas = min(len(df), 100)
            
            for index in range(max_filas):
                row = df.iloc[index]
                validacion = await self._validar_fila(index + 2, row)
                validaciones.append(validacion)
            
            return validaciones
            
        except Exception as e:
            return [VehiculoValidacionExcel(
                fila=0,
                placa='N/A',
                valido=False,
                errores=[f"Error al leer archivo: {str(e)}"],
                advertencias=[]
            )]