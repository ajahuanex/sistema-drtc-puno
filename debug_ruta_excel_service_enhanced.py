"""
Versión mejorada del servicio de Excel con logging detallado para debugging
"""
import pandas as pd
import logging
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from io import BytesIO

# Configurar logging detallado
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class RutaExcelServiceDebug:
    """Versión de debug del servicio de Excel con logging detallado"""
    
    def __init__(self, db=None):
        self.db = db
        if db is not None:
            self.rutas_collection = db["rutas"]
            self.empresas_collection = db["empresas"]
            self.resoluciones_collection = db["resoluciones"]
            self.localidades_collection = db["localidades"]
    
    async def validar_archivo_excel_debug(self, archivo_excel: BytesIO) -> Dict[str, Any]:
        """Validar archivo Excel con logging detallado"""
        
        logger.info("🔍 INICIANDO VALIDACIÓN DE ARCHIVO EXCEL CON DEBUG")
        logger.info("=" * 60)
        
        try:
            # Paso 1: Intentar leer diferentes hojas
            logger.info("📁 Paso 1: Intentando leer archivo Excel...")
            
            df = None
            sheet_name_used = None
            
            try:
                df = pd.read_excel(archivo_excel, sheet_name='DATOS')
                sheet_name_used = 'DATOS'
                logger.info("✅ Archivo leído exitosamente desde hoja 'DATOS'")
            except Exception as e1:
                logger.warning(f"⚠️  No se pudo leer hoja 'DATOS': {str(e1)}")
                try:
                    df = pd.read_excel(archivo_excel, sheet_name=0)
                    sheet_name_used = 'Primera hoja (índice 0)'
                    logger.info("✅ Archivo leído exitosamente desde primera hoja")
                except Exception as e2:
                    logger.warning(f"⚠️  No se pudo leer primera hoja: {str(e2)}")
                    try:
                        df = pd.read_excel(archivo_excel)
                        sheet_name_used = 'Hoja por defecto'
                        logger.info("✅ Archivo leído exitosamente desde hoja por defecto")
                    except Exception as e3:
                        error_msg = f'No se pudo leer el archivo Excel. Errores: DATOS={str(e1)}, Índice0={str(e2)}, Default={str(e3)}'
                        logger.error(f"❌ {error_msg}")
                        return {
                            'error': error_msg,
                            'total_filas': 0,
                            'validos': 0,
                            'invalidos': 0,
                            'con_advertencias': 0,
                            'errores': [],
                            'advertencias': [],
                            'rutas_validas': []
                        }
            
            if df is None or df.empty:
                error_msg = f'El archivo Excel está vacío o no se pudo leer (hoja: {sheet_name_used})'
                logger.error(f"❌ {error_msg}")
                return {
                    'error': error_msg,
                    'total_filas': 0,
                    'validos': 0,
                    'invalidos': 0,
                    'con_advertencias': 0,
                    'errores': [],
                    'advertencias': [],
                    'rutas_validas': []
                }
            
            # Paso 2: Analizar estructura inicial
            logger.info(f"📊 Paso 2: Analizando estructura del DataFrame...")
            logger.info(f"   • Hoja utilizada: {sheet_name_used}")
            logger.info(f"   • Forma del DataFrame: {df.shape}")
            logger.info(f"   • Columnas originales: {list(df.columns)}")
            
            # Paso 3: Normalizar nombres de columnas
            logger.info(f"🔧 Paso 3: Normalizando nombres de columnas...")
            columnas_originales = list(df.columns)
            
            df.columns = df.columns.str.strip()
            df.columns = df.columns.str.replace(r'\s*\(\*\)\s*', '', regex=True)
            df.columns = df.columns.str.replace(r'\s*\([^)]*\)\s*', '', regex=True)
            
            columnas_normalizadas = list(df.columns)
            logger.info(f"   • Columnas normalizadas: {columnas_normalizadas}")
            
            # Mostrar cambios en columnas
            cambios_columnas = []
            for orig, norm in zip(columnas_originales, columnas_normalizadas):
                if orig != norm:
                    cambios_columnas.append(f"'{orig}' → '{norm}'")
            
            if cambios_columnas:
                logger.info(f"   • Cambios realizados en columnas:")
                for cambio in cambios_columnas:
                    logger.info(f"     - {cambio}")
            
            # Paso 4: Filtrar filas vacías
            logger.info(f"🧹 Paso 4: Filtrando filas vacías...")
            filas_antes = len(df)
            df = df.dropna(how='all')
            filas_despues = len(df)
            
            logger.info(f"   • Filas antes del filtrado: {filas_antes}")
            logger.info(f"   • Filas después del filtrado: {filas_despues}")
            logger.info(f"   • Filas eliminadas: {filas_antes - filas_despues}")
            
            if filas_despues == 0:
                error_msg = 'El archivo no contiene datos válidos (todas las filas están vacías)'
                logger.error(f"❌ {error_msg}")
                return {
                    'error': error_msg,
                    'total_filas': 0,
                    'validos': 0,
                    'invalidos': 0,
                    'con_advertencias': 0,
                    'errores': [],
                    'advertencias': [],
                    'rutas_validas': []
                }
            
            # Paso 5: Analizar datos por columna
            logger.info(f"📋 Paso 5: Analizando datos por columna...")
            
            columnas_importantes = ['RUC', 'Resolución', 'Código Ruta', 'Origen', 'Destino', 'Frecuencia']
            
            for columna in columnas_importantes:
                if columna in df.columns:
                    valores_no_nulos = df[columna].dropna()
                    valores_unicos = valores_no_nulos.nunique()
                    
                    logger.info(f"   📊 Columna '{columna}':")
                    logger.info(f"      • Valores no nulos: {len(valores_no_nulos)}/{len(df)}")
                    logger.info(f"      • Valores únicos: {valores_unicos}")
                    
                    if len(valores_no_nulos) > 0:
                        # Mostrar algunos ejemplos
                        ejemplos = valores_no_nulos.head(3).tolist()
                        logger.info(f"      • Ejemplos: {ejemplos}")
                        
                        # Para RUC, validar formato
                        if columna == 'RUC':
                            rucs_validos = 0
                            rucs_invalidos = []
                            
                            for idx, valor in valores_no_nulos.items():
                                ruc_str = str(valor).strip()
                                if ruc_str.isdigit() and len(ruc_str) == 11:
                                    rucs_validos += 1
                                else:
                                    rucs_invalidos.append((idx + 2, ruc_str))
                            
                            logger.info(f"      • RUCs válidos: {rucs_validos}/{len(valores_no_nulos)}")
                            
                            if rucs_invalidos:
                                logger.warning(f"      • RUCs inválidos encontrados:")
                                for fila, ruc in rucs_invalidos[:5]:
                                    logger.warning(f"        - Fila {fila}: '{ruc}'")
                else:
                    logger.warning(f"   ❌ Columna obligatoria '{columna}' no encontrada")
            
            # Paso 6: Inicializar resultados
            resultados = {
                'total_filas': len(df),
                'validos': 0,
                'invalidos': 0,
                'con_advertencias': 0,
                'errores': [],
                'advertencias': [],
                'rutas_validas': []
            }
            
            logger.info(f"🔍 Paso 6: Procesando {len(df)} filas...")
            
            # Paso 7: Procesar cada fila con logging detallado
            codigos_por_resolucion = {}
            
            for index, row in df.iterrows():
                fila_num = index + 2  # +2 porque Excel empieza en 1 y tiene header
                
                logger.debug(f"📝 Procesando fila {fila_num}...")
                
                # Extraer y mostrar datos de la fila
                datos_fila = {}
                for columna in columnas_importantes:
                    if columna in df.columns:
                        valor_raw = row.get(columna, '')
                        valor_procesado = str(valor_raw).strip() if pd.notna(valor_raw) else ''
                        
                        if valor_procesado in ['nan', 'None']:
                            valor_procesado = ''
                        
                        datos_fila[columna] = {
                            'raw': valor_raw,
                            'procesado': valor_procesado,
                            'valido': bool(valor_procesado)
                        }
                
                # Log de datos extraídos
                logger.debug(f"   Datos extraídos fila {fila_num}:")
                for columna, info in datos_fila.items():
                    estado = "✅" if info['valido'] else "❌"
                    logger.debug(f"     {estado} {columna}: '{info['raw']}' → '{info['procesado']}'")
                
                # Validar fila
                errores_fila = []
                advertencias_fila = []
                
                try:
                    errores_fila, advertencias_fila = self._validar_fila_ruta_debug(row, fila_num)
                except Exception as e:
                    error_msg = f"Error en validación: {str(e)}"
                    logger.error(f"   ❌ Fila {fila_num}: {error_msg}")
                    errores_fila = [error_msg]
                
                # Validar códigos únicos por resolución
                if not errores_fila:
                    try:
                        resolucion_raw = datos_fila.get('Resolución', {}).get('procesado', '')
                        codigo_raw = datos_fila.get('Código Ruta', {}).get('procesado', '')
                        
                        if resolucion_raw and codigo_raw:
                            resolucion_normalizada = self._normalizar_resolucion(resolucion_raw)
                            codigo_normalizado = self._normalizar_codigo_ruta(codigo_raw)
                            
                            if resolucion_normalizada and codigo_normalizado:
                                if resolucion_normalizada not in codigos_por_resolucion:
                                    codigos_por_resolucion[resolucion_normalizada] = {}
                                
                                if codigo_normalizado in codigos_por_resolucion[resolucion_normalizada]:
                                    fila_anterior = codigos_por_resolucion[resolucion_normalizada][codigo_normalizado]
                                    error_duplicado = f"Código de ruta {codigo_normalizado} duplicado en resolución {resolucion_normalizada} (ya usado en fila {fila_anterior})"
                                    logger.warning(f"   ⚠️  Fila {fila_num}: {error_duplicado}")
                                    errores_fila.append(error_duplicado)
                                else:
                                    codigos_por_resolucion[resolucion_normalizada][codigo_normalizado] = fila_num
                                    logger.debug(f"   ✅ Código {codigo_normalizado} registrado para resolución {resolucion_normalizada}")
                    except Exception as e:
                        advertencia = f"No se pudo validar unicidad de código: {str(e)}"
                        logger.warning(f"   ⚠️  Fila {fila_num}: {advertencia}")
                        advertencias_fila.append(advertencia)
                
                # Procesar resultados de la fila
                if errores_fila:
                    resultados['invalidos'] += 1
                    codigo_ruta = datos_fila.get('Código Ruta', {}).get('procesado', 'N/A')
                    
                    logger.warning(f"   ❌ Fila {fila_num} INVÁLIDA - Código: {codigo_ruta}")
                    for error in errores_fila:
                        logger.warning(f"      • {error}")
                    
                    resultados['errores'].append({
                        'fila': fila_num,
                        'codigo_ruta': codigo_ruta,
                        'errores': errores_fila
                    })
                else:
                    if advertencias_fila:
                        resultados['con_advertencias'] += 1
                        codigo_ruta = datos_fila.get('Código Ruta', {}).get('procesado', 'N/A')
                        
                        logger.info(f"   ⚠️  Fila {fila_num} VÁLIDA CON ADVERTENCIAS - Código: {codigo_ruta}")
                        for advertencia in advertencias_fila:
                            logger.info(f"      • {advertencia}")
                        
                        resultados['advertencias'].append({
                            'fila': fila_num,
                            'codigo_ruta': codigo_ruta,
                            'advertencias': advertencias_fila
                        })
                    else:
                        codigo_ruta = datos_fila.get('Código Ruta', {}).get('procesado', 'N/A')
                        logger.info(f"   ✅ Fila {fila_num} VÁLIDA - Código: {codigo_ruta}")
                    
                    resultados['validos'] += 1
                    
                    # Convertir fila a modelo de ruta
                    try:
                        ruta = self._convertir_fila_a_ruta_debug(row, fila_num)
                        resultados['rutas_validas'].append(ruta)
                        logger.debug(f"   ✅ Fila {fila_num} convertida a modelo de ruta exitosamente")
                    except Exception as e:
                        error_msg = f"Error al procesar ruta: {str(e)}"
                        logger.error(f"   ❌ Fila {fila_num}: {error_msg}")
                        
                        resultados['validos'] -= 1
                        resultados['invalidos'] += 1
                        codigo_ruta = datos_fila.get('Código Ruta', {}).get('procesado', 'N/A')
                        resultados['errores'].append({
                            'fila': fila_num,
                            'codigo_ruta': codigo_ruta,
                            'errores': [error_msg]
                        })
            
            # Paso 8: Resumen final
            logger.info(f"📊 RESUMEN FINAL DE VALIDACIÓN:")
            logger.info(f"   • Total de filas procesadas: {resultados['total_filas']}")
            logger.info(f"   • Filas válidas: {resultados['validos']}")
            logger.info(f"   • Filas inválidas: {resultados['invalidos']}")
            logger.info(f"   • Filas con advertencias: {resultados['con_advertencias']}")
            logger.info(f"   • Códigos por resolución: {len(codigos_por_resolucion)} resoluciones")
            
            for resolucion, codigos in codigos_por_resolucion.items():
                logger.info(f"     - {resolucion}: {len(codigos)} códigos")
            
            return resultados
            
        except Exception as e:
            error_msg = f"Error al procesar archivo Excel: {str(e)}"
            logger.error(f"❌ {error_msg}")
            import traceback
            logger.error(traceback.format_exc())
            
            return {
                'error': error_msg,
                'total_filas': 0,
                'validos': 0,
                'invalidos': 0,
                'con_advertencias': 0,
                'errores': [],
                'advertencias': [],
                'rutas_validas': []
            }
    
    def _validar_fila_ruta_debug(self, row: pd.Series, fila_num: int) -> Tuple[List[str], List[str]]:
        """Validar una fila de ruta con logging detallado"""
        errores = []
        advertencias = []
        
        logger.debug(f"      🔍 Validando fila {fila_num}...")
        
        # Verificar si es una fila con guiones (ruta cancelada)
        es_ruta_cancelada = self._es_fila_con_guiones(row)
        if es_ruta_cancelada:
            logger.debug(f"      📝 Fila {fila_num} detectada como ruta cancelada (contiene guiones)")
        
        # Obtener datos básicos
        ruc = str(row.get('RUC', '')).strip() if pd.notna(row.get('RUC')) else ''
        resolucion = str(row.get('Resolución', '')).strip() if pd.notna(row.get('Resolución')) else ''
        codigo_ruta = str(row.get('Código Ruta', '')).strip() if pd.notna(row.get('Código Ruta')) else ''
        origen = str(row.get('Origen', '')).strip() if pd.notna(row.get('Origen')) else ''
        destino = str(row.get('Destino', '')).strip() if pd.notna(row.get('Destino')) else ''
        frecuencia = str(row.get('Frecuencia', '')).strip() if pd.notna(row.get('Frecuencia')) else ''
        
        logger.debug(f"      📋 Datos extraídos fila {fila_num}:")
        logger.debug(f"         • RUC: '{ruc}'")
        logger.debug(f"         • Resolución: '{resolucion}'")
        logger.debug(f"         • Código Ruta: '{codigo_ruta}'")
        logger.debug(f"         • Origen: '{origen}'")
        logger.debug(f"         • Destino: '{destino}'")
        logger.debug(f"         • Frecuencia: '{frecuencia}'")
        
        # Validar RUC (requerido)
        if not ruc:
            error = "RUC es requerido"
            logger.debug(f"      ❌ {error}")
            errores.append(error)
        elif not self._validar_formato_ruc(ruc):
            error = f"Formato de RUC inválido: {ruc}"
            logger.debug(f"      ❌ {error}")
            errores.append(error)
        else:
            logger.debug(f"      ✅ RUC válido: {ruc}")
        
        # Validar Resolución (requerido)
        if not resolucion:
            error = "Resolución es requerida"
            logger.debug(f"      ❌ {error}")
            errores.append(error)
        else:
            logger.debug(f"      ✅ Resolución presente: {resolucion}")
        
        # Validar código de ruta (requerido)
        if not codigo_ruta:
            error = "Código de ruta es requerido"
            logger.debug(f"      ❌ {error}")
            errores.append(error)
        elif not self._validar_formato_codigo_ruta(codigo_ruta):
            error = f"Formato de código de ruta inválido: {codigo_ruta} (debe ser numérico de 1-3 dígitos)"
            logger.debug(f"      ❌ {error}")
            errores.append(error)
        else:
            logger.debug(f"      ✅ Código de ruta válido: {codigo_ruta}")
        
        # Validaciones específicas según tipo de ruta
        if es_ruta_cancelada:
            advertencia = "Ruta detectada como CANCELADA (contiene guiones)"
            logger.debug(f"      ⚠️  {advertencia}")
            advertencias.append(advertencia)
            
            if origen == '-' and destino == '-':
                error = "Al menos origen o destino debe estar especificado (no ambos pueden ser guiones)"
                logger.debug(f"      ❌ {error}")
                errores.append(error)
        else:
            # Validaciones normales para rutas activas
            if not origen:
                error = "Origen es requerido"
                logger.debug(f"      ❌ {error}")
                errores.append(error)
            else:
                logger.debug(f"      ✅ Origen presente: {origen}")
            
            if not destino:
                error = "Destino es requerido"
                logger.debug(f"      ❌ {error}")
                errores.append(error)
            elif origen == destino:
                advertencia = "Origen y destino son iguales"
                logger.debug(f"      ⚠️  {advertencia}")
                advertencias.append(advertencia)
            else:
                logger.debug(f"      ✅ Destino presente: {destino}")
            
            if not frecuencia:
                error = "Frecuencia es requerida"
                logger.debug(f"      ❌ {error}")
                errores.append(error)
            else:
                logger.debug(f"      ✅ Frecuencia presente: {frecuencia}")
        
        logger.debug(f"      📊 Resultado validación fila {fila_num}: {len(errores)} errores, {len(advertencias)} advertencias")
        
        return errores, advertencias
    
    def _convertir_fila_a_ruta_debug(self, row: pd.Series, fila_num: int) -> Dict[str, Any]:
        """Convertir fila de Excel a datos de ruta con logging detallado"""
        
        logger.debug(f"      🔄 Convirtiendo fila {fila_num} a modelo de ruta...")
        
        # Verificar si es una ruta cancelada
        es_ruta_cancelada = self._es_fila_con_guiones(row)
        
        # Datos básicos - VALIDAR QUE NO ESTÉN VACÍOS
        ruc_raw = row.get('RUC', '')
        resolucion_raw = row.get('Resolución', '')
        codigo_raw = row.get('Código Ruta', '')
        
        # Convertir a string y limpiar
        ruc = str(ruc_raw).strip() if pd.notna(ruc_raw) else ''
        resolucion = str(resolucion_raw).strip() if pd.notna(resolucion_raw) else ''
        codigo_ruta = str(codigo_raw).strip() if pd.notna(codigo_raw) else ''
        
        # Limpiar valores que pandas convierte a 'nan' string
        if ruc in ['nan', 'None']:
            ruc = ''
        if resolucion in ['nan', 'None']:
            resolucion = ''
        if codigo_ruta in ['nan', 'None']:
            codigo_ruta = ''
        
        logger.debug(f"         📋 Datos básicos procesados:")
        logger.debug(f"            • RUC: '{ruc_raw}' → '{ruc}'")
        logger.debug(f"            • Resolución: '{resolucion_raw}' → '{resolucion}'")
        logger.debug(f"            • Código: '{codigo_raw}' → '{codigo_ruta}'")
        
        # Validaciones obligatorias
        if not ruc:
            raise ValueError(f"Fila {fila_num}: RUC es obligatorio y no puede estar vacío")
        if not resolucion:
            raise ValueError(f"Fila {fila_num}: Resolución es obligatoria y no puede estar vacía")
        if not codigo_ruta:
            raise ValueError(f"Fila {fila_num}: Código de ruta es obligatorio y no puede estar vacío")
        
        # Normalizar campos
        origen = self._normalizar_campo_con_guion(row.get('Origen', ''), 'origen')
        destino = self._normalizar_campo_con_guion(row.get('Destino', ''), 'destino')
        frecuencia = self._normalizar_campo_con_guion(row.get('Frecuencia', ''), 'frecuencia')
        
        logger.debug(f"         📋 Campos normalizados:")
        logger.debug(f"            • Origen: '{origen}'")
        logger.debug(f"            • Destino: '{destino}'")
        logger.debug(f"            • Frecuencia: '{frecuencia}'")
        
        # Validar campos obligatorios adicionales
        if not origen or origen == 'nan':
            raise ValueError(f"Fila {fila_num}: Origen es obligatorio y no puede estar vacío")
        if not destino or destino == 'nan':
            raise ValueError(f"Fila {fila_num}: Destino es obligatorio y no puede estar vacío")
        if not frecuencia or frecuencia == 'nan':
            raise ValueError(f"Fila {fila_num}: Frecuencia es obligatoria y no puede estar vacía")
        
        # Normalizar resolución y código
        resolucion_normalizada = self._normalizar_resolucion(resolucion)
        codigo_normalizado = self._normalizar_codigo_ruta(codigo_ruta)
        
        logger.debug(f"         📋 Normalizaciones:")
        logger.debug(f"            • Resolución: '{resolucion}' → '{resolucion_normalizada}'")
        logger.debug(f"            • Código: '{codigo_ruta}' → '{codigo_normalizado}'")
        
        # Crear modelo de datos
        ruta_data = {
            'ruc': ruc,
            'resolucionNormalizada': resolucion_normalizada,
            'codigoRuta': codigo_normalizado,
            'origen': origen,
            'destino': destino,
            'frecuencia': frecuencia,
            'esCancelada': es_ruta_cancelada
        }
        
        logger.debug(f"      ✅ Fila {fila_num} convertida exitosamente a modelo de ruta")
        
        return ruta_data
    
    # Métodos auxiliares (simplificados para debug)
    def _es_fila_con_guiones(self, row: pd.Series) -> bool:
        """Detectar si una fila contiene guiones indicando ruta cancelada"""
        campos_importantes = ['Origen', 'Destino', 'Itinerario', 'Frecuencia']
        guiones_encontrados = 0
        
        for campo in campos_importantes:
            valor = str(row.get(campo, '')).strip()
            if valor == '-':
                guiones_encontrados += 1
        
        return guiones_encontrados >= 2  # Si 2 o más campos tienen guiones
    
    def _validar_formato_ruc(self, ruc: str) -> bool:
        """Validar formato de RUC: 11 dígitos"""
        return ruc.isdigit() and len(ruc) == 11
    
    def _validar_formato_codigo_ruta(self, codigo: str) -> bool:
        """Validar formato de código de ruta: 1-3 dígitos"""
        return codigo.isdigit() and 1 <= len(codigo) <= 3
    
    def _normalizar_resolucion(self, resolucion: str) -> str:
        """Normalizar resolución a formato R-XXXX-YYYY"""
        if not resolucion:
            return ''
        
        # Remover espacios y convertir a mayúsculas
        resolucion = resolucion.strip().upper()
        
        # Si ya tiene el formato correcto, devolverlo
        if resolucion.startswith('R-') and len(resolucion.split('-')) == 3:
            return resolucion
        
        # Extraer números de la resolución
        import re
        numeros = re.findall(r'\d+', resolucion)
        
        if len(numeros) >= 2:
            numero = numeros[0].zfill(4)  # Rellenar con ceros a la izquierda
            año = numeros[1]
            return f"R-{numero}-{año}"
        elif len(numeros) == 1:
            # Asumir año actual si solo hay un número
            numero = numeros[0].zfill(4)
            año = str(datetime.now().year)
            return f"R-{numero}-{año}"
        
        return resolucion  # Devolver original si no se puede normalizar
    
    def _normalizar_codigo_ruta(self, codigo: str) -> str:
        """Normalizar código de ruta a 2 dígitos"""
        if not codigo:
            return ''
        
        # Extraer solo números
        import re
        numeros = re.findall(r'\d+', codigo)
        
        if numeros:
            return numeros[0].zfill(2)  # Rellenar con ceros a la izquierda
        
        return codigo
    
    def _normalizar_campo_con_guion(self, valor, nombre_campo: str) -> str:
        """Normalizar campo que puede contener guiones"""
        if pd.isna(valor) or valor == '':
            return 'SIN ESPECIFICAR'
        
        valor_str = str(valor).strip()
        
        if valor_str == '-':
            return f'{nombre_campo.upper()} CANCELADO'
        
        return valor_str.upper()

# Función para usar el servicio de debug
async def debug_validacion_excel(archivo_path: str):
    """Función para debuggear validación de Excel"""
    
    try:
        with open(archivo_path, 'rb') as f:
            archivo_bytes = BytesIO(f.read())
        
        service = RutaExcelServiceDebug()
        resultado = await service.validar_archivo_excel_debug(archivo_bytes)
        
        print("\n" + "="*60)
        print("RESULTADO FINAL DEL DEBUG:")
        print("="*60)
        print(f"Total filas: {resultado.get('total_filas', 0)}")
        print(f"Válidas: {resultado.get('validos', 0)}")
        print(f"Inválidas: {resultado.get('invalidos', 0)}")
        print(f"Con advertencias: {resultado.get('con_advertencias', 0)}")
        
        if resultado.get('error'):
            print(f"Error: {resultado['error']}")
        
        return resultado
        
    except Exception as e:
        logger.error(f"Error en debug de validación: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import sys
    import asyncio
    
    if len(sys.argv) > 1:
        archivo = sys.argv[1]
        asyncio.run(debug_validacion_excel(archivo))
    else:
        print("Uso: python debug_ruta_excel_service_enhanced.py archivo.xlsx")