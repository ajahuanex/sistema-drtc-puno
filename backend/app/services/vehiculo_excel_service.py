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

    # ========================================
    # FUNCIONES DE NORMALIZACIÓN FLEXIBLES
    # ========================================
    
    def _normalizar_ruc(self, ruc_raw) -> str:
        """Normalizar RUC a formato estándar de 11 dígitos"""
        if pd.isna(ruc_raw):
            return ''
        
        ruc_str = str(ruc_raw).strip()
        
        # Remover puntos, comas, espacios
        ruc_clean = re.sub(r'[^\d]', '', ruc_str)
        
        # Si es un número flotante como "20123456789.0", remover el .0
        if '.' in ruc_str:
            try:
                ruc_float = float(ruc_str)
                ruc_clean = str(int(ruc_float))
            except:
                pass
        
        # Validar longitud
        if len(ruc_clean) == 11 and ruc_clean.isdigit():
            return ruc_clean
        elif len(ruc_clean) < 11 and ruc_clean.isdigit():
            # Rellenar con ceros a la izquierda si es necesario
            return ruc_clean.zfill(11)
        
        return ruc_clean  # Devolver tal como está para validación posterior
    
    def _normalizar_numero_resolucion(self, numero_raw) -> str:
        """Normalizar número de resolución a formato R-XXXX-YYYY"""
        if pd.isna(numero_raw):
            return ''
        
        numero_str = str(numero_raw).strip().upper()
        
        # Si ya tiene el formato correcto, devolverlo
        if re.match(r'^R-\d{4}-\d{4}$', numero_str):
            return numero_str
        
        # Intentar extraer números del formato XXXX-YYYY
        match = re.search(r'(\d{4})-(\d{4})', numero_str)
        if match:
            numero, anio = match.groups()
            return f"R-{numero}-{anio}"
        
        # Intentar formato solo números XXXX2025
        match = re.search(r'^(\d{4})(\d{4})$', numero_str)
        if match:
            numero, anio = match.groups()
            return f"R-{numero}-{anio}"
        
        # Intentar formato 0123-2025 (agregar R-)
        match = re.search(r'^(\d{4})-(\d{4})$', numero_str)
        if match:
            numero, anio = match.groups()
            return f"R-{numero}-{anio}"
        
        return numero_str  # Devolver tal como está para validación posterior
    
    def _normalizar_placa(self, placa_raw) -> str:
        """Normalizar placa a formato estándar ABC-123"""
        if pd.isna(placa_raw):
            return ''
        
        placa_str = str(placa_raw).strip().upper()
        
        # Si ya tiene guión, verificar formato
        if '-' in placa_str:
            return placa_str
        
        # Intentar agregar guión automáticamente
        # Formato ABC123 -> ABC-123
        match = re.match(r'^([A-Z]{2,3})(\d{3,4})$', placa_str)
        if match:
            letras, numeros = match.groups()
            return f"{letras}-{numeros}"
        
        return placa_str
    
    def _normalizar_fecha(self, fecha_raw) -> Optional[datetime]:
        """Normalizar fecha a formato datetime"""
        if pd.isna(fecha_raw):
            return None
        
        fecha_str = str(fecha_raw).strip()
        
        # Intentar diferentes formatos de fecha
        formatos = [
            '%d/%m/%Y',
            '%d-%m-%Y',
            '%Y-%m-%d',
            '%d/%m/%y',
            '%d-%m-%y'
        ]
        
        for formato in formatos:
            try:
                return datetime.strptime(fecha_str, formato)
            except:
                continue
        
        return None
    
    def _validar_formato_resolucion_flexible(self, numero: str) -> bool:
        """Validar formato de resolución de manera flexible"""
        if not numero:
            return False
        
        numero_normalizado = self._normalizar_numero_resolucion(numero)
        
        # Verificar si el formato normalizado es válido
        return bool(re.match(r'^R-\d{4}-\d{4}$', numero_normalizado))
    
    def _validar_formato_placa_flexible(self, placa: str) -> bool:
        """Validar formato de placa de manera flexible"""
        if not placa:
            return False
        
        placa_normalizada = self._normalizar_placa(placa)
        
        # Verificar formato ABC-123 o AB-1234
        return bool(re.match(r'^[A-Z]{2,3}-\d{3,4}$', placa_normalizada))
    
    def _validar_ruc_flexible(self, ruc: str) -> bool:
        """Validar RUC de manera flexible"""
        if not ruc:
            return False
        
        ruc_normalizado = self._normalizar_ruc(ruc)
        
        # Verificar que tenga 11 dígitos
        return len(ruc_normalizado) == 11 and ruc_normalizado.isdigit()

    async def procesar_excel(self, archivo_path: str) -> VehiculoCargaMasivaResponse:
        """Procesar archivo Excel y crear vehículos en lote"""
        try:
            # Leer archivo Excel sin interpretar fechas automáticamente
            df = pd.read_excel(archivo_path, dtype=str)
            
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
                        # Formatear errores con información de columnas
                        errores_formateados = []
                        for error in validacion.errores:
                            if isinstance(error, dict):
                                errores_formateados.append(f"Columna '{error['columna']}': {error['mensaje']} (valor: '{error['valor']}')")
                            else:
                                errores_formateados.append(str(error))
                        
                        errores_detalle.append({
                            'fila': validacion.fila,
                            'placa': validacion.placa,
                            'errores': errores_formateados,
                            'errores_detallados': validacion.errores  # Mantener formato estructurado para frontend
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
        """Validar datos de una fila específica con validaciones flexibles"""
        errores = []
        advertencias = []
        
        # Normalizar y validar placa
        placa_raw = row.get('Placa', '')
        placa_normalizada = self._normalizar_placa(placa_raw)
        
        if not placa_normalizada:
            errores.append({
                'columna': 'Placa',
                'valor': placa_raw,
                'mensaje': "Placa es requerida"
            })
        elif not self._validar_formato_placa_flexible(placa_raw):
            errores.append({
                'columna': 'Placa',
                'valor': placa_raw,
                'mensaje': f"Formato de placa inválido (se esperaba formato ABC-123)"
            })
        else:
            # Verificar si la placa ya existe (usar la normalizada)
            vehiculo_existente = await self.vehiculo_service.get_vehiculo_by_placa(placa_normalizada)
            if vehiculo_existente:
                advertencias.append({
                    'columna': 'Placa',
                    'valor': placa_raw,
                    'mensaje': f"Ya existe un vehículo con placa {placa_normalizada} - se actualizará"
                })
        
        # Normalizar y validar empresa por RUC
        empresa_ruc_raw = row.get('RUC Empresa', '')
        empresa_ruc_normalizado = self._normalizar_ruc(empresa_ruc_raw)
        
        if not empresa_ruc_normalizado:
            errores.append({
                'columna': 'RUC Empresa',
                'valor': empresa_ruc_raw,
                'mensaje': "RUC de empresa es requerido"
            })
        elif not self._validar_ruc_flexible(empresa_ruc_raw):
            errores.append({
                'columna': 'RUC Empresa',
                'valor': empresa_ruc_raw,
                'mensaje': f"RUC inválido (se esperaba 11 dígitos, se normalizó a: '{empresa_ruc_normalizado}')"
            })
        else:
            # Buscar empresa con RUC normalizado
            empresa = self._buscar_empresa_por_ruc(empresa_ruc_normalizado)
            if not empresa:
                if self.auto_crear_empresas:
                    advertencias.append({
                        'columna': 'RUC Empresa',
                        'valor': empresa_ruc_raw,
                        'mensaje': f"Empresa con RUC {empresa_ruc_normalizado} será creada automáticamente"
                    })
                else:
                    errores.append({
                        'columna': 'RUC Empresa',
                        'valor': empresa_ruc_raw,
                        'mensaje': f"No se encontró empresa con RUC {empresa_ruc_normalizado}"
                    })
        
        # Validar categoría (más flexible)
        categoria_raw = row.get('Categoría', '')
        categoria_str = str(categoria_raw).strip().upper() if pd.notna(categoria_raw) else ''
        
        if not categoria_str:
            advertencias.append({
                'columna': 'Categoría',
                'valor': categoria_raw,
                'mensaje': "Categoría no especificada, se usará M1 por defecto"
            })
        elif categoria_str not in [cat.value for cat in CategoriaVehiculo]:
            # Intentar mapear categorías comunes
            mapeo_categorias = {
                'M1': 'M1', 'M2': 'M2', 'M3': 'M3',
                'AUTOMOVIL': 'M1', 'AUTO': 'M1',
                'MICROBUS': 'M2', 'MICRO': 'M2',
                'OMNIBUS': 'M3', 'BUS': 'M3'
            }
            categoria_mapeada = mapeo_categorias.get(categoria_str)
            if categoria_mapeada:
                advertencias.append({
                    'columna': 'Categoría',
                    'valor': categoria_raw,
                    'mensaje': f"Categoría '{categoria_str}' mapeada a '{categoria_mapeada}'"
                })
            else:
                errores.append({
                    'columna': 'Categoría',
                    'valor': categoria_raw,
                    'mensaje': f"Categoría inválida (válidas: {[cat.value for cat in CategoriaVehiculo]})"
                })
        
        # Validar tipo de combustible (más flexible)
        tipo_combustible_raw = row.get('Tipo Combustible', '')
        tipo_combustible_str = str(tipo_combustible_raw).strip().upper() if pd.notna(tipo_combustible_raw) else ''
        
        if not tipo_combustible_str:
            advertencias.append({
                'columna': 'Tipo Combustible',
                'valor': tipo_combustible_raw,
                'mensaje': "Tipo de combustible no especificado, se usará GASOLINA por defecto"
            })
        elif tipo_combustible_str not in [tc.value for tc in TipoCombustible]:
            # Intentar mapear tipos comunes
            mapeo_combustibles = {
                'GASOLINA': 'GASOLINA', 'GAS': 'GASOLINA',
                'DIESEL': 'DIESEL', 'PETROLEO': 'DIESEL',
                'GLP': 'GLP', 'GAS_LICUADO': 'GLP',
                'GNV': 'GNV', 'GAS_NATURAL': 'GNV',
                'ELECTRICO': 'ELECTRICO', 'ELECTRIC': 'ELECTRICO'
            }
            combustible_mapeado = mapeo_combustibles.get(tipo_combustible_str)
            if combustible_mapeado:
                advertencias.append({
                    'columna': 'Tipo Combustible',
                    'valor': tipo_combustible_raw,
                    'mensaje': f"Tipo de combustible '{tipo_combustible_str}' mapeado a '{combustible_mapeado}'"
                })
            else:
                errores.append({
                    'columna': 'Tipo Combustible',
                    'valor': tipo_combustible_raw,
                    'mensaje': f"Tipo de combustible inválido (válidos: {[tc.value for tc in TipoCombustible]})"
                })
        
        # Validar sede de registro (más flexible)
        sede_registro_raw = row.get('Sede de Registro', 'PUNO')
        sede_registro_str = str(sede_registro_raw).strip().upper() if pd.notna(sede_registro_raw) else 'PUNO'
        
        if sede_registro_str and sede_registro_str not in [sede.value for sede in SedeRegistro]:
            # Intentar mapear sedes comunes
            mapeo_sedes = {
                'PUNO': 'PUNO', 'JULIACA': 'JULIACA',
                'AZANGARO': 'AZANGARO', 'YUNGUYO': 'YUNGUYO'
            }
            sede_mapeada = mapeo_sedes.get(sede_registro_str)
            if sede_mapeada:
                advertencias.append({
                    'columna': 'Sede de Registro',
                    'valor': sede_registro_raw,
                    'mensaje': f"Sede '{sede_registro_str}' mapeada a '{sede_mapeada}'"
                })
            else:
                advertencias.append({
                    'columna': 'Sede de Registro',
                    'valor': sede_registro_raw,
                    'mensaje': f"Sede de registro '{sede_registro_str}' no reconocida, se usará PUNO por defecto"
                })
        
        # Validar campos numéricos con más flexibilidad
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
            valor_raw = row.get(campo)
            if pd.isna(valor_raw) or str(valor_raw).strip() == '':
                # Solo algunos campos son realmente obligatorios
                if campo in ['Año Fabricación', 'Ejes', 'Asientos']:
                    errores.append({
                        'columna': campo,
                        'valor': valor_raw,
                        'mensaje': f"{campo} es requerido"
                    })
                else:
                    advertencias.append({
                        'columna': campo,
                        'valor': valor_raw,
                        'mensaje': f"{campo} no especificado, se usará valor por defecto"
                    })
            else:
                try:
                    # Limpiar el valor (remover comas, espacios, etc.)
                    valor_str = str(valor_raw).replace(',', '').replace(' ', '').strip()
                    valor_num = float(valor_str)
                    
                    if valor_num < min_val or valor_num > max_val:
                        errores.append({
                            'columna': campo,
                            'valor': valor_raw,
                            'mensaje': f"{campo} debe estar entre {min_val} y {max_val}"
                        })
                except (ValueError, TypeError):
                    errores.append({
                        'columna': campo,
                        'valor': valor_raw,
                        'mensaje': f"{campo} debe ser un número válido"
                    })
        
        # Validar resoluciones con normalización flexible
        if pd.notna(row.get('Resolución Primigenia')):
            resolucion_primigenia_raw = str(row.get('Resolución Primigenia')).strip()
            resolucion_primigenia_normalizada = self._normalizar_numero_resolucion(resolucion_primigenia_raw)
            
            if not self._validar_formato_resolucion_flexible(resolucion_primigenia_raw):
                errores.append({
                    'columna': 'Resolución Primigenia',
                    'valor': resolucion_primigenia_raw,
                    'mensaje': f"Formato de resolución primigenia inválido (se normalizó a: '{resolucion_primigenia_normalizada}')"
                })
            else:
                if resolucion_primigenia_raw != resolucion_primigenia_normalizada:
                    advertencias.append({
                        'columna': 'Resolución Primigenia',
                        'valor': resolucion_primigenia_raw,
                        'mensaje': f"Resolución primigenia normalizada a '{resolucion_primigenia_normalizada}'"
                    })
                
                resolucion = self._buscar_resolucion_por_numero(resolucion_primigenia_normalizada)
                if not resolucion:
                    if self.auto_crear_resoluciones:
                        advertencias.append({
                            'columna': 'Resolución Primigenia',
                            'valor': resolucion_primigenia_raw,
                            'mensaje': f"Resolución primigenia {resolucion_primigenia_normalizada} será creada automáticamente"
                        })
                    else:
                        advertencias.append({
                            'columna': 'Resolución Primigenia',
                            'valor': resolucion_primigenia_raw,
                            'mensaje': f"No se encontró resolución primigenia: {resolucion_primigenia_normalizada}"
                        })
        
        if pd.notna(row.get('Resolución Hija')):
            resolucion_hija_raw = str(row.get('Resolución Hija')).strip()
            resolucion_hija_normalizada = self._normalizar_numero_resolucion(resolucion_hija_raw)
            
            if not self._validar_formato_resolucion_flexible(resolucion_hija_raw):
                errores.append({
                    'columna': 'Resolución Hija',
                    'valor': resolucion_hija_raw,
                    'mensaje': f"Formato de resolución hija inválido (se normalizó a: '{resolucion_hija_normalizada}')"
                })
            else:
                if resolucion_hija_raw != resolucion_hija_normalizada:
                    advertencias.append({
                        'columna': 'Resolución Hija',
                        'valor': resolucion_hija_raw,
                        'mensaje': f"Resolución hija normalizada a '{resolucion_hija_normalizada}'"
                    })
                
                resolucion = self._buscar_resolucion_por_numero(resolucion_hija_normalizada)
                if not resolucion:
                    if self.auto_crear_resoluciones:
                        advertencias.append({
                            'columna': 'Resolución Hija',
                            'valor': resolucion_hija_raw,
                            'mensaje': f"Resolución hija {resolucion_hija_normalizada} será creada automáticamente"
                        })
                    else:
                        advertencias.append({
                            'columna': 'Resolución Hija',
                            'valor': resolucion_hija_raw,
                            'mensaje': f"No se encontró resolución hija: {resolucion_hija_normalizada}"
                        })
            
            # Validar que si hay resolución hija, debe haber primigenia
            if not pd.notna(row.get('Resolución Primigenia')):
                errores.append({
                    'columna': 'Resolución Hija',
                    'valor': resolucion_hija_raw,
                    'mensaje': "Si se especifica una resolución hija, debe especificarse también la resolución primigenia"
                })
        
        # Validar rutas si se proporcionan
        if pd.notna(row.get('Rutas Asignadas')):
            rutas_str = str(row.get('Rutas Asignadas')).strip()
            rutas_codigos = [r.strip() for r in rutas_str.split(',') if r.strip()]
            for codigo_ruta in rutas_codigos:
                if not self._buscar_ruta_por_codigo(codigo_ruta):
                    advertencias.append({
                        'columna': 'Rutas Asignadas',
                        'valor': rutas_str,
                        'mensaje': f"No se encontró ruta con código: {codigo_ruta}"
                    })
        
        return VehiculoValidacionExcel(
            fila=fila,
            placa=placa_normalizada,  # Usar la placa normalizada
            valido=len(errores) == 0,
            errores=errores,
            advertencias=advertencias
        )

    async def _convertir_fila_a_vehiculo_create(self, row: pd.Series) -> VehiculoCreate:
        """Convertir fila de Excel a modelo VehiculoCreate usando datos normalizados"""
        
        # Normalizar y validar campos requeridos
        placa_raw = row.get('Placa', '')
        placa = self._normalizar_placa(placa_raw).upper()
        if not placa:
            raise ValueError("Placa es requerida")
            
        marca = str(row.get('Marca', '')).strip()
        if not marca or marca.lower() == 'nan':
            marca = "MARCA_PENDIENTE"  # Valor por defecto
            
        modelo = str(row.get('Modelo', '')).strip()
        if not modelo or modelo.lower() == 'nan':
            modelo = "MODELO_PENDIENTE"  # Valor por defecto
        
        print(f"📋 Datos básicos validados - Placa: {placa}, Marca: {marca}, Modelo: {modelo}")
        
        # Normalizar y buscar empresa por RUC
        empresa_id = None
        empresa_ruc_raw = row.get('RUC Empresa', '')
        empresa_ruc = self._normalizar_ruc(empresa_ruc_raw)
        
        if empresa_ruc and len(empresa_ruc) == 11:
            # Intentar encontrar empresa existente con RUC normalizado
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
        
        # Normalizar categoría
        categoria_raw = row.get('Categoría', 'M1')
        categoria_str = str(categoria_raw).strip().upper()
        
        # Mapear categorías comunes
        mapeo_categorias = {
            'M1': 'M1', 'M2': 'M2', 'M3': 'M3',
            'AUTOMOVIL': 'M1', 'AUTO': 'M1',
            'MICROBUS': 'M2', 'MICRO': 'M2',
            'OMNIBUS': 'M3', 'BUS': 'M3'
        }
        
        categoria_str = mapeo_categorias.get(categoria_str, 'M1')
        
        # Normalizar tipo de combustible
        tipo_combustible_raw = row.get('Tipo Combustible', 'GASOLINA')
        tipo_combustible_str = str(tipo_combustible_raw).strip().upper()
        
        # Mapear tipos de combustible comunes
        mapeo_combustibles = {
            'GASOLINA': TipoCombustible.GASOLINA,
            'GAS': TipoCombustible.GASOLINA,
            'DIESEL': TipoCombustible.DIESEL,
            'PETROLEO': TipoCombustible.DIESEL,
            'GLP': TipoCombustible.GLP,
            'GAS_LICUADO': TipoCombustible.GLP,
            'GNV': TipoCombustible.GNV,
            'GAS_NATURAL': TipoCombustible.GNV,
            'ELECTRICO': TipoCombustible.ELECTRICO,
            'ELECTRIC': TipoCombustible.ELECTRICO
        }
        
        tipo_combustible = mapeo_combustibles.get(tipo_combustible_str, TipoCombustible.GASOLINA)
        
        # Normalizar sede de registro
        sede_raw = row.get('Sede de Registro', 'PUNO')
        sede_str = str(sede_raw).strip().upper()
        
        mapeo_sedes = {
            'PUNO': SedeRegistro.PUNO,
            'JULIACA': SedeRegistro.JULIACA,
            'AZANGARO': SedeRegistro.AZANGARO,
            'YUNGUYO': SedeRegistro.YUNGUYO
        }
        
        sede_registro = mapeo_sedes.get(sede_str, SedeRegistro.PUNO)
        
        # Crear datos técnicos con valores normalizados
        try:
            # Normalizar valores numéricos
            def normalizar_numero(valor, default):
                if pd.isna(valor) or str(valor).strip() == '':
                    return default
                try:
                    return float(str(valor).replace(',', '').strip())
                except:
                    return default
            
            ejes = int(normalizar_numero(row.get('Ejes'), 2))
            asientos = int(normalizar_numero(row.get('Asientos'), 5))
            peso_neto = normalizar_numero(row.get('Peso Neto (kg)'), 1200.0)
            peso_bruto = normalizar_numero(row.get('Peso Bruto (kg)'), 1500.0)
            largo = normalizar_numero(row.get('Largo (m)'), 4.5)
            ancho = normalizar_numero(row.get('Ancho (m)'), 1.8)
            alto = normalizar_numero(row.get('Alto (m)'), 1.5)
            
            datos_tecnicos = DatosTecnicos(
                motor=str(row.get('Motor', 'MOTOR_PENDIENTE')).strip() or 'MOTOR_PENDIENTE',
                chasis=str(row.get('Chasis', f'CHASIS_{placa}')).strip() or f'CHASIS_{placa}',
                ejes=ejes,
                asientos=asientos,
                pesoNeto=peso_neto,
                pesoBruto=peso_bruto,
                tipoCombustible=tipo_combustible,
                medidas={
                    'largo': largo,
                    'ancho': ancho,
                    'alto': alto
                }
            )
        except Exception as e:
            raise ValueError(f"Error creando datos técnicos: {e}")
        
        print(f"📋 Datos técnicos creados exitosamente")
        
        # Normalizar año de fabricación
        anio_raw = row.get('Año Fabricación', 2020)
        anio_fabricacion = int(normalizar_numero(anio_raw, 2020))
        
        return VehiculoCreate(
            placa=placa,
            empresaActualId=empresa_id,
            categoria=CategoriaVehiculo(categoria_str),
            marca=marca,
            modelo=modelo,
            anioFabricacion=anio_fabricacion,
            sedeRegistro=sede_registro,
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
        """Validar formato de placa peruana (usa la versión flexible)"""
        return self._validar_formato_placa_flexible(placa)

    def _validar_formato_resolucion(self, numero: str) -> bool:
        """Validar formato de resolución (usa la versión flexible)"""
        return self._validar_formato_resolucion_flexible(numero)

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