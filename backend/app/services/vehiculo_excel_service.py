import pandas as pd
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import re
from app.models.vehiculo import (
    VehiculoExcel, VehiculoCargaMasivaResponse, VehiculoValidacionExcel,
    VehiculoCreate, VehiculoUpdate, DatosTecnicos, CategoriaVehiculo, EstadoVehiculo, TipoCombustible, SedeRegistro, MotivoSustitucion
)
from app.services.vehiculo_service import VehiculoService
from app.services.empresa_service import EmpresaService
from app.services.resolucion_service import ResolucionService
from app.services.ruta_service import RutaService

class VehiculoExcelService:
    """Servicio para procesar archivos Excel de vehículos"""
    
    def __init__(self, db=None):
        from app.dependencies.db import get_database
        if db is None:
            # Para uso en tests o cuando no se pasa db
            import asyncio
            try:
                db = asyncio.get_event_loop().run_until_complete(get_database())
            except:
                db = None
        self.vehiculo_service = VehiculoService(db) if db else None
        self.empresa_service = EmpresaService(db) if db else None
        self.resolucion_service = ResolucionService(db) if db else None
        self.ruta_service = RutaService(db) if db else None
        
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
            'cilindros': 'Cilindros',  # NUEVO CAMPO
            'ruedas': 'Ruedas',        # NUEVO CAMPO
            'asientos': 'Asientos',
            'peso_neto': 'Peso Neto (kg)',
            'peso_bruto': 'Peso Bruto (kg)',
            'carga_util': 'Carga Útil (kg)',
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
                    vehiculos_actualizados=[],
                    errores_detalle=errores_estructura
                )
            
            # Procesar cada fila
            vehiculos_creados = []
            vehiculos_actualizados = []
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
                    
                    placa = str(row.get('Placa')).strip().upper()
                    print(f"🔄 Procesando fila {index + 2}: {placa}")
                    
                    # Verificar si el vehículo ya existe
                    print(f"🔍 Verificando si existe vehículo con placa: {placa}")
                    vehiculo_existente = await self.vehiculo_service.get_vehiculo_by_placa(placa)
                    
                    if vehiculo_existente:
                        # ACTUALIZAR vehículo existente
                        print(f"🔄 Actualizando vehículo existente: {placa} (ID: {vehiculo_existente.id})")
                        vehiculo_update_data = self._convertir_fila_a_vehiculo_update(row, vehiculo_existente)
                        print(f"📋 Datos de actualización: {vehiculo_update_data.model_dump(exclude_unset=True)}")
                        
                        vehiculo_actualizado = await self.vehiculo_service.update_vehiculo(vehiculo_existente.id, vehiculo_update_data)
                        vehiculos_actualizados.append(vehiculo_actualizado.id)
                        print(f"✅ Vehículo actualizado: {vehiculo_actualizado.id}")
                    else:
                        # CREAR nuevo vehículo
                        print(f"🆕 Creando nuevo vehículo: {placa}")
                        vehiculo_data = await self._convertir_fila_a_vehiculo_create(row)
                        print(f"📋 Datos del nuevo vehículo: {vehiculo_data.model_dump()}")
                        
                        vehiculo_creado = await self.vehiculo_service.create_vehiculo(vehiculo_data)
                        vehiculos_creados.append(vehiculo_creado.id)
                        print(f"✅ Vehículo creado: {vehiculo_creado.id}")
                    
                except Exception as e:
                    print(f"❌ Error procesando fila {index + 2}: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    errores_detalle.append({
                        'fila': index + 2,
                        'placa': str(row.get('Placa', 'N/A')),
                        'errores': [f"Error al procesar: {str(e)}"]
                    })
            
            return VehiculoCargaMasivaResponse(
                total_procesados=len(df),
                exitosos=len(vehiculos_creados) + len(vehiculos_actualizados),
                errores=len(errores_detalle),
                vehiculos_creados=vehiculos_creados,
                vehiculos_actualizados=vehiculos_actualizados,
                errores_detalle=errores_detalle
            )
            
        except Exception as e:
            return VehiculoCargaMasivaResponse(
                total_procesados=0,
                exitosos=0,
                errores=1,
                vehiculos_creados=[],
                vehiculos_actualizados=[],
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
            'Carga Útil (kg)': (50, 50000),
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

    async def _convertir_fila_a_vehiculo_create(self, row: pd.Series) -> VehiculoCreate:
        """Convertir fila de Excel a modelo VehiculoCreate"""
        
        # Validar campos requeridos
        placa = str(row.get('Placa', '')).strip().upper()
        if not placa or placa == 'NAN':
            raise ValueError("Placa es requerida")
            
        marca = str(row.get('Marca', '')).strip()
        if not marca or marca == 'nan':
            marca = "MARCA_PENDIENTE"  # Valor por defecto
            
        modelo = str(row.get('Modelo', '')).strip()
        if not modelo or modelo == 'nan':
            modelo = "MODELO_PENDIENTE"  # Valor por defecto
        
        print(f"📋 Datos básicos validados - Placa: {placa}, Marca: {marca}, Modelo: {modelo}")
        
        # USAR EMPRESA EXISTENTE en lugar de crear automáticamente
        empresa_id = None
        empresa_ruc = str(row.get('RUC Empresa', '')).strip()
        
        if empresa_ruc and empresa_ruc != 'nan':
            # Intentar encontrar empresa existente
            try:
                empresas = await self.empresa_service.get_empresas()
                for empresa in empresas:
                    if empresa.ruc == empresa_ruc:
                        empresa_id = empresa.id
                        print(f"✅ Empresa encontrada: {empresa_id} - RUC: {empresa_ruc}")
                        break
            except Exception as e:
                print(f"⚠️ Error buscando empresa: {e}")
        
        # Si no se encontró empresa, usar la primera disponible
        if not empresa_id:
            try:
                empresas = await self.empresa_service.get_empresas()
                if empresas:
                    empresa_id = empresas[0].id
                    print(f"⚠️ Usando primera empresa disponible: {empresa_id}")
                else:
                    raise ValueError("No hay empresas disponibles en el sistema")
            except Exception as e:
                raise ValueError(f"Error obteniendo empresas: {e}")
        
        # Validar categoría
        categoria_str = str(row.get('Categoría', 'M1')).strip().upper()
        if categoria_str == 'NAN' or categoria_str not in [cat.value for cat in CategoriaVehiculo]:
            categoria_str = 'M1'  # Valor por defecto
        
        # Crear datos técnicos básicos y seguros
        try:
            datos_tecnicos = DatosTecnicos(
                motor=str(row.get('Motor', 'MOTOR_PENDIENTE')).strip() or 'MOTOR_PENDIENTE',
                chasis=str(row.get('Chasis', f'CHASIS_{placa}')).strip() or f'CHASIS_{placa}',
                ejes=2,  # Valor por defecto seguro
                asientos=int(float(str(row.get('Asientos', 5)))) if pd.notna(row.get('Asientos')) else 5,
                pesoNeto=1200.0,  # Valor por defecto
                pesoBruto=1500.0,  # Valor por defecto
                tipoCombustible=TipoCombustible.GASOLINA,  # Valor por defecto seguro
                medidas={
                    'largo': 4.5,
                    'ancho': 1.8,
                    'alto': 1.5
                }
            )
        except Exception as e:
            raise ValueError(f"Error creando datos técnicos: {e}")
        
        print(f"📋 Datos técnicos creados exitosamente")
        
        return VehiculoCreate(
            placa=placa,
            empresaActualId=empresa_id,
            categoria=CategoriaVehiculo(categoria_str),
            marca=marca,
            modelo=modelo,
            anioFabricacion=int(float(str(row.get('Año Fabricación', 2020)))),
            sedeRegistro=SedeRegistro.PUNO,  # Valor por defecto
            datosTecnicos=datos_tecnicos
        )

    def _convertir_fila_a_vehiculo_update(self, row: pd.Series, vehiculo_existente) -> 'VehiculoUpdate':
        """Convertir fila de Excel a modelo VehiculoUpdate (solo campos presentes)"""
        from app.models.vehiculo import VehiculoUpdate
        
        update_data = {}
        
        # Solo actualizar campos que están presentes y no vacíos en la plantilla
        
        # Empresa (solo si se especifica un RUC diferente)
        if pd.notna(row.get('RUC Empresa')) and str(row.get('RUC Empresa')).strip():
            empresa_ruc = str(row.get('RUC Empresa')).strip()
            nombre_sugerido = f"EMPRESA {str(row.get('Marca', '')).strip()} {str(row.get('Modelo', '')).strip()}".strip()
            empresa = self._obtener_o_crear_empresa(empresa_ruc, nombre_sugerido)
            if empresa and str(empresa.id) != vehiculo_existente.empresaActualId:
                update_data['empresaActualId'] = str(empresa.id)
        
        # Resolución (solo si se especifica)
        if pd.notna(row.get('Resolución Hija')) and str(row.get('Resolución Hija')).strip():
            resolucion_hija = self._buscar_resolucion_por_numero(str(row.get('Resolución Hija')).strip())
            if resolucion_hija:
                update_data['resolucionId'] = resolucion_hija.id
        elif pd.notna(row.get('Resolución Primigenia')) and str(row.get('Resolución Primigenia')).strip():
            resolucion_primigenia = self._buscar_resolucion_por_numero(str(row.get('Resolución Primigenia')).strip())
            if resolucion_primigenia:
                update_data['resolucionId'] = resolucion_primigenia.id
        
        # Rutas (solo si se especifican)
        if pd.notna(row.get('Rutas Asignadas')) and str(row.get('Rutas Asignadas')).strip():
            rutas_str = str(row.get('Rutas Asignadas')).strip()
            rutas_codigos = [r.strip() for r in rutas_str.split(',') if r.strip()]
            rutas_asignadas = []
            for codigo_ruta in rutas_codigos:
                ruta = self._buscar_ruta_por_codigo(codigo_ruta)
                if ruta:
                    rutas_asignadas.append(ruta.id)
            if rutas_asignadas:
                update_data['rutasAsignadasIds'] = rutas_asignadas
        
        # Categoría (solo si se especifica)
        if pd.notna(row.get('Categoría')) and str(row.get('Categoría')).strip():
            categoria_str = str(row.get('Categoría')).strip().upper()
            if categoria_str in [cat.value for cat in CategoriaVehiculo]:
                update_data['categoria'] = categoria_str
        
        # Marca y modelo (solo si se especifican)
        if pd.notna(row.get('Marca')) and str(row.get('Marca')).strip():
            update_data['marca'] = str(row.get('Marca')).strip()
        
        if pd.notna(row.get('Modelo')) and str(row.get('Modelo')).strip():
            update_data['modelo'] = str(row.get('Modelo')).strip()
        
        # Año de fabricación (solo si se especifica)
        if pd.notna(row.get('Año Fabricación')) and str(row.get('Año Fabricación')).strip():
            try:
                update_data['anioFabricacion'] = int(float(str(row.get('Año Fabricación'))))
            except (ValueError, TypeError):
                pass  # Ignorar si no es un número válido
        
        # Sede de registro (solo si se especifica)
        if pd.notna(row.get('Sede de Registro')) and str(row.get('Sede de Registro')).strip():
            sede_registro_str = str(row.get('Sede de Registro')).strip()
            if sede_registro_str in [sede.value for sede in SedeRegistro]:
                update_data['sedeRegistro'] = sede_registro_str
        
        # Color (solo si se especifica)
        if pd.notna(row.get('Color')) and str(row.get('Color')).strip():
            update_data['color'] = str(row.get('Color')).strip()
        
        # Número de serie (solo si se especifica)
        if pd.notna(row.get('Número Serie')) and str(row.get('Número Serie')).strip():
            update_data['numeroSerie'] = str(row.get('Número Serie')).strip()
        
        # Observaciones (solo si se especifican)
        if pd.notna(row.get('Observaciones')) and str(row.get('Observaciones')).strip():
            update_data['observaciones'] = str(row.get('Observaciones')).strip()
        
        # Datos técnicos (solo actualizar campos específicos que estén presentes)
        datos_tecnicos_update = {}
        
        if pd.notna(row.get('Motor')) and str(row.get('Motor')).strip():
            datos_tecnicos_update['motor'] = str(row.get('Motor')).strip()
        
        if pd.notna(row.get('Chasis')) and str(row.get('Chasis')).strip():
            datos_tecnicos_update['chasis'] = str(row.get('Chasis')).strip()
        
        if pd.notna(row.get('Ejes')) and str(row.get('Ejes')).strip():
            try:
                datos_tecnicos_update['ejes'] = int(float(str(row.get('Ejes'))))
            except (ValueError, TypeError):
                pass
        
        if pd.notna(row.get('Asientos')) and str(row.get('Asientos')).strip():
            try:
                datos_tecnicos_update['asientos'] = int(float(str(row.get('Asientos'))))
            except (ValueError, TypeError):
                pass
        
        if pd.notna(row.get('Tipo Combustible')) and str(row.get('Tipo Combustible')).strip():
            tipo_combustible_str = str(row.get('Tipo Combustible')).strip().upper()
            if tipo_combustible_str in [tc.value for tc in TipoCombustible]:
                datos_tecnicos_update['tipoCombustible'] = tipo_combustible_str
        
        # Agregar más campos de datos técnicos según sea necesario...
        
        if datos_tecnicos_update:
            # Combinar con datos técnicos existentes
            datos_tecnicos_actuales = vehiculo_existente.datosTecnicos
            if hasattr(datos_tecnicos_actuales, 'model_dump'):
                datos_tecnicos_dict = datos_tecnicos_actuales.model_dump()
            elif hasattr(datos_tecnicos_actuales, 'dict'):
                datos_tecnicos_dict = datos_tecnicos_actuales.dict()
            else:
                datos_tecnicos_dict = dict(datos_tecnicos_actuales)
            
            # Actualizar solo los campos especificados
            datos_tecnicos_dict.update(datos_tecnicos_update)
            update_data['datosTecnicos'] = datos_tecnicos_dict
        
        return VehiculoUpdate(**update_data)

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
                email="pendiente@transportespuno.gob.pe",
                telefono="+51 000 000 000",
                direccion="POR COMPLETAR"
            ),
            emailContacto="pendiente@transportespuno.gob.pe",
            telefonoContacto="+51 000 000 000",
            sitioWeb="",
            estaActivo=True,
            fechaRegistro=datetime.utcnow(),
            fechaActualizacion=datetime.utcnow()
        )
        
        # Agregar a la colección
        self.empresas[nuevo_id] = nueva_empresa
        
        return nueva_empresa

    async def _obtener_o_crear_empresa_async(self, ruc: str, nombre_sugerido: str = None):
        """Obtener empresa existente o crear una nueva (versión async)"""
        if not self.empresa_service:
            raise ValueError("Servicio de empresas no disponible")
            
        # Buscar empresa existente por RUC
        try:
            empresas = await self.empresa_service.get_empresas()
            empresa_existente = None
            for empresa in empresas:
                if empresa.ruc == ruc:
                    empresa_existente = empresa
                    break
                    
            if empresa_existente:
                print(f"✅ Empresa encontrada: {empresa_existente.id} - RUC: {ruc}")
                return empresa_existente
        except Exception as e:
            print(f"⚠️ Error buscando empresa: {e}")
        
        # Si no existe y está habilitada la auto-creación, crear nueva
        if self.auto_crear_empresas:
            print(f"🆕 Creando nueva empresa con RUC: {ruc}")
            try:
                from app.models.empresa import EmpresaCreate
                nueva_empresa_data = EmpresaCreate(
                    ruc=ruc,
                    razonSocial={
                        "principal": nombre_sugerido or f"EMPRESA {ruc}",
                        "sunat": nombre_sugerido or f"EMPRESA {ruc}",
                        "minimo": nombre_sugerido or f"EMPRESA {ruc}"
                    },
                    direccionFiscal="DIRECCIÓN PENDIENTE",
                    telefono="TELÉFONO PENDIENTE",
                    email="email@transportespuno.gob.pe"
                )
                nueva_empresa = await self.empresa_service.create_empresa(nueva_empresa_data)
                print(f"✅ Nueva empresa creada: {nueva_empresa.id} - RUC: {ruc}")
                return nueva_empresa
            except Exception as e:
                print(f"❌ Error creando empresa: {e}")
                return None
            
        print(f"❌ No se pudo obtener empresa con RUC: {ruc} (auto-creación deshabilitada)")
        return None

    def _obtener_o_crear_empresa(self, ruc: str, nombre_sugerido: str = None):
        """Obtener empresa existente o crear una nueva (wrapper sync)"""
        # Este método ahora solo devuelve None y fuerza el uso del método async
        return None

    async def generar_plantilla_excel(self) -> str:
        """Generar plantilla Excel para carga masiva"""
        # Crear DataFrame con las columnas requeridas
        columnas = list(self.columnas_requeridas.values())
        
        # Datos de ejemplo actualizados
        datos_ejemplo = {
            'Placa': ['ABC-123', 'XYZ-456'],
            'RUC Empresa': ['20123456789', '20234567890'],
            'Resolución Primigenia': ['R-1001-2024', 'R-1002-2024'],
            'Resolución Hija': ['', ''],  # Opcional
            'Rutas Asignadas': ['01,02', '03'],
            'Sede de Registro': ['PUNO', 'AREQUIPA'],
            # Campos de baja actualizados
            'Placa de Baja': ['', 'OLD-789'],  # Cambio: era "Placa Sustituida"
            'Motivo Sustitución': ['', 'ANTIGÜEDAD'],
            # Eliminado: 'Resolución Sustitución' ya no es necesario
            'Categoría': ['M3', 'N3'],
            'Marca': ['MERCEDES BENZ', 'VOLVO'],
            'Modelo': ['O500', 'FH16'],
            'Año Fabricación': [2020, 2019],
            'Color': ['BLANCO', 'AZUL'],
            'Número Serie': ['MB123456', 'VL789012'],
            'Motor': ['OM 457 LA', 'D16G750'],
            'Chasis': ['WDB9066131L123456', 'VOLVOH16C123456'],
            'Ejes': [2, 3],
            'Cilindros': [6, 8],  # NUEVO: Número de cilindros
            'Ruedas': [6, 10],    # NUEVO: Número de ruedas
            'Asientos': [50, 2],
            'Peso Neto (t)': [8.5, 12.0],      # CAMBIO: Ahora en toneladas
            'Peso Bruto (t)': [16.0, 26.0],    # CAMBIO: Ahora en toneladas
            'Carga Útil (t)': [7.5, 14.0],     # CAMBIO: Ahora en toneladas
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