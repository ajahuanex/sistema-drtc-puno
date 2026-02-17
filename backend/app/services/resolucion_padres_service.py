"""
Servicio para procesar plantilla de resoluciones padres
Maneja la carga masiva de resoluciones con estado y resoluciones asociadas
"""

import pandas as pd
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import pytz
from ..utils.resolucion_utils import (
    calcular_fecha_fin_vigencia,
    validar_anios_vigencia,
    validar_coherencia_fechas,
    calcular_fechas_vigencia_automaticas
)

logger = logging.getLogger(__name__)

# Configurar zona horaria de Lima
LIMA_TZ = pytz.timezone('America/Lima')

class ResolucionPadresService:
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.resoluciones_collection = db["resoluciones"]
        self.empresas_collection = db["empresas"]
    
    @staticmethod
    def _normalizar_nombres_columnas(df: pd.DataFrame) -> pd.DataFrame:
        """
        Normalizar nombres de columnas para soportar múltiples formatos
        Convierte formatos con espacios a formato con guiones bajos
        """
        # LOG: Columnas originales
        logger.info("=" * 70)
        logger.info("NORMALIZACIÓN DE COLUMNAS - INICIO")
        logger.info("=" * 70)
        logger.info(f"Columnas ORIGINALES del Excel: {list(df.columns)}")
        
        # Verificar si hay columna de años de vigencia
        col_anios_original = None
        for col in df.columns:
            if 'ANIOS' in col.upper() or 'AÑOS' in col.upper():
                col_anios_original = col
                logger.info(f"✅ Columna de años encontrada: '{col}'")
                # Mostrar valores
                valores = df[col].tolist()
                logger.info(f"   Valores en la columna: {valores}")
                break
        
        if not col_anios_original:
            logger.warning("⚠️  NO se encontró columna de años de vigencia en el Excel")
        
        # Mapeo de nombres alternativos a nombres estándar (con guiones bajos)
        mapeo_columnas = {
            # Formatos con espacios → guiones bajos
            'RUC Empresa': 'RUC_EMPRESA_ASOCIADA',
            'Número Resolución': 'RESOLUCION_NUMERO',
            'Resolución Padre': 'RESOLUCION_ASOCIADA',
            'Resolución Asociada': 'RESOLUCION_ASOCIADA',
            'Tipo Resolución': 'TIPO_RESOLUCION',
            'Fecha Emisión': 'FECHA_RESOLUCION',
            'Fecha Resolución': 'FECHA_RESOLUCION',
            'Fecha Vigencia Inicio': 'FECHA_INICIO_VIGENCIA',
            'Años Vigencia': 'ANIOS_VIGENCIA',
            'Fecha Vigencia Fin': 'FECHA_FIN_VIGENCIA',
            'Estado': 'ESTADO',
            'Descripción': 'DESCRIPCION',
            'ID Expediente': 'ID_EXPEDIENTE',
            'Usuario Emisión': 'USUARIO_EMISION',
            'Observaciones': 'OBSERVACIONES',
            'Tipo Trámite': 'TIPO_TRAMITE',
            # Formatos con guiones bajos (ya estándar)
            'RUC_EMPRESA_ASOCIADA': 'RUC_EMPRESA_ASOCIADA',
            'RESOLUCION_NUMERO': 'RESOLUCION_NUMERO',
            'RESOLUCION_ASOCIADA': 'RESOLUCION_ASOCIADA',
            'TIPO_RESOLUCION': 'TIPO_RESOLUCION',
            'FECHA_RESOLUCION': 'FECHA_RESOLUCION',
            'FECHA_INICIO_VIGENCIA': 'FECHA_INICIO_VIGENCIA',
            'ANIOS_VIGENCIA': 'ANIOS_VIGENCIA',
            'FECHA_FIN_VIGENCIA': 'FECHA_FIN_VIGENCIA',
            'ESTADO': 'ESTADO',
            'DESCRIPCION': 'DESCRIPCION',
            'ID_EXPEDIENTE': 'ID_EXPEDIENTE',
            'USUARIO_EMISION': 'USUARIO_EMISION',
            'OBSERVACIONES': 'OBSERVACIONES',
            'TIPO_TRAMITE': 'TIPO_TRAMITE'
        }
        
        # Renombrar columnas según el mapeo
        columnas_renombradas = {}
        for col in df.columns:
            col_limpio = col.strip()
            if col_limpio in mapeo_columnas:
                columnas_renombradas[col] = mapeo_columnas[col_limpio]
                if col_limpio != mapeo_columnas[col_limpio]:
                    logger.info(f"   Renombrando: '{col_limpio}' → '{mapeo_columnas[col_limpio]}'")
            else:
                # Mantener el nombre original si no está en el mapeo
                columnas_renombradas[col] = col
                logger.warning(f"   ⚠️  Columna no reconocida: '{col_limpio}' (se mantiene sin cambios)")
        
        df = df.rename(columns=columnas_renombradas)
        
        # LOG: Columnas después de normalizar
        logger.info(f"Columnas NORMALIZADAS: {list(df.columns)}")
        
        # Verificar columna de años después de normalizar
        if 'ANIOS_VIGENCIA' in df.columns:
            valores_normalizados = df['ANIOS_VIGENCIA'].tolist()
            logger.info(f"✅ Columna 'ANIOS_VIGENCIA' presente después de normalizar")
            logger.info(f"   Valores: {valores_normalizados}")
            
            # Contar valores
            con_4 = sum(1 for v in valores_normalizados if str(v).strip() == '4')
            con_10 = sum(1 for v in valores_normalizados if str(v).strip() == '10')
            vacios = sum(1 for v in valores_normalizados if str(v).strip() == '')
            
            logger.info(f"   Distribución: 4 años={con_4}, 10 años={con_10}, vacíos={vacios}")
            
            if con_10 > 0:
                logger.info(f"   ⭐ ¡HAY {con_10} RESOLUCIONES CON 10 AÑOS!")
            else:
                logger.warning(f"   ⚠️  NO hay resoluciones con 10 años")
        else:
            logger.error("❌ ERROR: Columna 'ANIOS_VIGENCIA' NO encontrada después de normalizar")
        
        logger.info("=" * 70)
        
        return df
    
    @staticmethod
    def _normalizar_numero_resolucion(numero_resolucion: str, fecha_emision: datetime) -> str:
        """
        Normaliza el número de resolución al formato estándar R-XXXX-YYYY
        PRESERVA el año original del número si ya está presente
        
        IMPORTANTE: El año del número de resolución se basa en la fecha de EMISIÓN,
        NO en la fecha de vigencia, debido a la figura legal de EFICACIA ANTICIPADA.
        
        Eficacia anticipada: Una resolución puede tener vigencia desde una fecha
        anterior a su emisión. Ejemplo:
        - Resolución R-0290-2024 (emitida en marzo 2024)
        - Vigencia desde 01/01/2023 (eficacia anticipada)
        - El año del número (2024) corresponde al año de emisión
        
        Ejemplos:
        - "0290-2023" → "R-0290-2023" (preserva el año 2023)
        - "R-0290-2023" → "R-0290-2023" (ya normalizado)
        - "290" → "R-0290-2025" (usa año de fecha_emision)
        """
        numero = numero_resolucion.strip().upper()
        
        # Si ya tiene el formato completo R-XXXX-YYYY, devolverlo tal como está
        if numero.startswith('R-') and numero.count('-') == 2:
            partes = numero.split('-')
            if len(partes) == 3 and partes[1].isdigit() and partes[2].isdigit():
                # Ya está en formato correcto, solo asegurar padding del número
                numero_parte = partes[1].zfill(4)
                anio_parte = partes[2]
                return f"R-{numero_parte}-{anio_parte}"
        
        # Si tiene formato XXXX-YYYY (sin R-), preservar el año
        if '-' in numero and not numero.startswith('R-'):
            partes = numero.split('-')
            if len(partes) == 2 and partes[0].isdigit() and partes[1].isdigit():
                numero_parte = partes[0].zfill(4)
                anio_parte = partes[1]
                return f"R-{numero_parte}-{anio_parte}"
        
        # Si solo tiene el número (sin año), usar el año de la fecha de emisión
        numero_limpio = numero.replace('R-', '').replace('-', '')
        if numero_limpio.isdigit():
            numero_formateado = numero_limpio.zfill(4)
            anio = fecha_emision.year
            return f"R-{numero_formateado}-{anio}"
        
        # Fallback: intentar extraer números y usar año de fecha
        import re
        numeros = re.findall(r'\d+', numero)
        if numeros:
            numero_base = numeros[0].zfill(4)
            anio = fecha_emision.year
            return f"R-{numero_base}-{anio}"
        
        # Último recurso
        anio = fecha_emision.year
        return f"R-0001-{anio}"
    
    @staticmethod
    def _parse_excel_date(date_value, fila: int, columna: str) -> Optional[datetime]:
        """
        Parsea fechas de Excel manejando diferentes formatos y zona horaria de Lima
        """
        if pd.isna(date_value) or date_value == '' or str(date_value).strip() == '':
            return None
        
        try:
            # Si ya es un datetime de pandas (común en Excel)
            if isinstance(date_value, pd.Timestamp):
                # Convertir a datetime naive (sin zona horaria) para evitar problemas
                return date_value.to_pydatetime().replace(tzinfo=None)
            
            # Si es una cadena, intentar parsear con diferentes formatos
            date_str = str(date_value).strip()
            
            # Si tiene timestamp, extraer solo la fecha
            if ' ' in date_str:
                date_str = date_str.split(' ')[0]
            
            # Formatos comunes de fecha en orden de prioridad
            formatos = [
                '%d/%m/%Y',      # 01/01/2025 (español - preferido)
                '%Y-%m-%d',      # 2025-01-01 (ISO - el que está causando problemas)
                '%d-%m-%Y',      # 01-01-2025
                '%m/%d/%Y',      # 01/01/2025 (americano)
                '%d/%m/%y',      # 01/01/25
                '%d-%m-%y'       # 01-01-25
            ]
            
            for formato in formatos:
                try:
                    fecha = datetime.strptime(date_str, formato)
                    # Asegurar que el año esté en el rango correcto
                    if fecha.year < 100:
                        fecha = fecha.replace(year=fecha.year + 2000)
                    # Validar que la fecha sea razonable (entre 1900 y 2100)
                    if 1900 <= fecha.year <= 2100:
                        return fecha
                except ValueError:
                    continue
            
            # Si no se pudo parsear con ningún formato
            raise ValueError(f"Formato de fecha no reconocido: {date_str}")
            
        except Exception as e:
            logger.error(f"Error parseando fecha en fila {fila}, columna {columna}: {date_value} - {str(e)}")
            raise ValueError(f"Fecha inválida en {columna}: '{date_value}'. Formatos aceptados: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY")
    
    async def validar_plantilla_padres_con_db(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Validar estructura y datos de la plantilla de resoluciones padres
        Incluye validaciones contra la base de datos
        """
        
        # Normalizar nombres de columnas primero
        df = self._normalizar_nombres_columnas(df)
        
        # Primero hacer validación estática
        resultado_estatico = self.validar_plantilla_padres(df)
        
        errores = resultado_estatico['errores'].copy()
        advertencias = resultado_estatico['advertencias'].copy()
        
        # Validaciones adicionales con base de datos
        for idx, row in df.iterrows():
            fila = idx + 2
            
            # Validar que la empresa exista
            ruc = str(row.get('RUC_EMPRESA_ASOCIADA', '')).strip()
            if ruc and len(ruc) == 11:
                empresa = await self.empresas_collection.find_one({"ruc": ruc})
                if not empresa:
                    errores.append(f"Fila {fila}, Columna A (RUC_EMPRESA_ASOCIADA): Empresa con RUC '{ruc}' no encontrada en la base de datos")
            
            # Validar que la resolución asociada exista (solo si está especificada)
            # No generar advertencia si está vacía, es normal en resoluciones antiguas
            tipo_resolucion = str(row.get('TIPO_RESOLUCION', '')).strip().upper()
            resolucion_asociada = str(row.get('RESOLUCION_ASOCIADA', '')).strip()
            
            # Solo validar si la resolución asociada está especificada
            if resolucion_asociada:
                # Normalizar el número para buscar
                try:
                    fecha_resolucion = self._parse_excel_date(
                        row.get('FECHA_RESOLUCION'), fila, 'FECHA_RESOLUCION'
                    )
                except:
                    fecha_resolucion = datetime.now()
                
                resolucion_asociada_normalizada = self._normalizar_numero_resolucion(
                    resolucion_asociada, fecha_resolucion
                )
                
                resolucion_anterior = await self.resoluciones_collection.find_one({
                    "nroResolucion": resolucion_asociada_normalizada
                })
                
                # Solo advertir si se especificó pero no existe
                if not resolucion_anterior:
                    advertencias.append(
                        f"Fila {fila}: Resolución asociada '{resolucion_asociada}' no encontrada en la base de datos. "
                        f"Se creará la resolución pero no se actualizará el estado de la anterior."
                    )
        
        return {
            'valido': len(errores) == 0,
            'errores': errores,
            'advertencias': advertencias,
            'total_filas': len(df)
        }
    
    @staticmethod
    def validar_plantilla_padres(df: pd.DataFrame) -> Dict[str, Any]:
        """Validar estructura y datos de la plantilla de resoluciones padres"""
        
        # Nota: df ya debe venir normalizado desde validar_plantilla_padres_con_db
        # pero por si acaso se llama directamente, normalizamos aquí también
        if 'Años Vigencia' in df.columns or 'RUC Empresa' in df.columns:
            df = ResolucionPadresService._normalizar_nombres_columnas(df)
        
        errores = []
        advertencias = []
        
        # Columnas requeridas (ESTADO al final, FECHA_RESOLUCION opcional)
        columnas_requeridas = [
            'RUC_EMPRESA_ASOCIADA',
            'RESOLUCION_NUMERO', 
            'TIPO_RESOLUCION',
            'FECHA_INICIO_VIGENCIA',  # Esta es la fecha obligatoria para cálculos
            'ANIOS_VIGENCIA',
            'FECHA_FIN_VIGENCIA',
            'ESTADO'
        ]
        
        # Verificar columnas requeridas
        columnas_faltantes = [col for col in columnas_requeridas if col not in df.columns]
        if columnas_faltantes:
            errores.append(f"Columnas faltantes: {', '.join(columnas_faltantes)}")
        
        # Validar datos por fila
        for idx, row in df.iterrows():
            fila = idx + 2  # +2 porque pandas empieza en 0 y Excel en 1, más header
            
            # Validar RUC (Columna A)
            ruc = str(row.get('RUC_EMPRESA_ASOCIADA', '')).strip()
            if not ruc:
                errores.append(f"Fila {fila}, Columna A (RUC_EMPRESA_ASOCIADA): Campo vacío")
            elif len(ruc) != 11:
                errores.append(f"Fila {fila}, Columna A (RUC_EMPRESA_ASOCIADA): RUC '{ruc}' debe tener exactamente 11 dígitos")
            elif not ruc.isdigit():
                errores.append(f"Fila {fila}, Columna A (RUC_EMPRESA_ASOCIADA): RUC '{ruc}' debe contener solo números")
            
            # Validar número de resolución (Columna B)
            numero_resolucion = str(row.get('RESOLUCION_NUMERO', '')).strip()
            if not numero_resolucion:
                errores.append(f"Fila {fila}, Columna B (RESOLUCION_NUMERO): Campo vacío")
            
            # Validar tipo de resolución (Columna D)
            tipo_resolucion = str(row.get('TIPO_RESOLUCION', '')).strip().upper()
            
            # Normalizar tipos que contengan "NUEVA" a solo "NUEVA"
            if 'NUEVA' in tipo_resolucion:
                tipo_resolucion = 'NUEVA'
            
            # Mapear valores del frontend a valores del backend
            mapeo_tipos = {
                'NUEVA': 'AUTORIZACION_NUEVA',
                'RENOVACION': 'RENOVACION',
                'MODIFICACION': 'OTROS'
            }
            tipos_validos_frontend = ['NUEVA', 'RENOVACION', 'MODIFICACION']
            if not tipo_resolucion:
                errores.append(f"Fila {fila}, Columna D (TIPO_RESOLUCION): Campo vacío")
            elif tipo_resolucion not in tipos_validos_frontend:
                errores.append(f"Fila {fila}, Columna D (TIPO_RESOLUCION): Valor '{tipo_resolucion}' inválido. Valores válidos: {', '.join(tipos_validos_frontend)}")
            
            # Validar estado (Columna I)
            estado = str(row.get('ESTADO', '')).strip().upper()
            # Mapear valores del frontend a valores del backend
            mapeo_estados = {
                'ACTIVA': 'VIGENTE',
                'VENCIDA': 'VENCIDA',
                'RENOVADA': 'VIGENTE',  # Una resolución renovada sigue vigente
                'ANULADA': 'ANULADA'
            }
            estados_validos_frontend = ['ACTIVA', 'VENCIDA', 'RENOVADA', 'ANULADA']
            if not estado:
                errores.append(f"Fila {fila}, Columna I (ESTADO): Campo vacío")
            elif estado not in estados_validos_frontend:
                errores.append(f"Fila {fila}, Columna I (ESTADO): Valor '{estado}' inválido. Valores válidos: {', '.join(estados_validos_frontend)}")
            
            # Validar años de vigencia (Columna G)
            try:
                anios_vigencia_str = str(row.get('ANIOS_VIGENCIA', '')).strip()
                if not anios_vigencia_str:
                    errores.append(f"Fila {fila}, Columna G (ANIOS_VIGENCIA): Campo vacío")
                else:
                    anios_vigencia = int(anios_vigencia_str)
                    if not validar_anios_vigencia(anios_vigencia):
                        errores.append(f"Fila {fila}, Columna G (ANIOS_VIGENCIA): Valor '{anios_vigencia}' inválido (debe ser entre 1 y 20 años)")
            except ValueError:
                errores.append(f"Fila {fila}, Columna G (ANIOS_VIGENCIA): Valor '{row.get('ANIOS_VIGENCIA', '')}' no es un número entero válido")
            
            # Validar fechas
            # Fecha de inicio de vigencia (Columna F) - OBLIGATORIA
            fecha_inicio = None
            try:
                fecha_inicio = ResolucionPadresService._parse_excel_date(
                    row.get('FECHA_INICIO_VIGENCIA'), fila, 'Columna F (FECHA_INICIO_VIGENCIA)'
                )
                if fecha_inicio is None:
                    errores.append(f"Fila {fila}, Columna F (FECHA_INICIO_VIGENCIA): Campo vacío")
            except ValueError as e:
                errores.append(f"Fila {fila}, Columna F (FECHA_INICIO_VIGENCIA): {str(e)}")
            
            # Fecha de fin de vigencia (Columna H) - OBLIGATORIA
            fecha_fin = None
            try:
                fecha_fin = ResolucionPadresService._parse_excel_date(
                    row.get('FECHA_FIN_VIGENCIA'), fila, 'Columna H (FECHA_FIN_VIGENCIA)'
                )
                if fecha_fin is None:
                    errores.append(f"Fila {fila}, Columna H (FECHA_FIN_VIGENCIA): Campo vacío")
            except ValueError as e:
                errores.append(f"Fila {fila}, Columna H (FECHA_FIN_VIGENCIA): {str(e)}")
            
            # Fecha de resolución (Columna E) - OPCIONAL
            fecha_resolucion = None
            try:
                fecha_resolucion = ResolucionPadresService._parse_excel_date(
                    row.get('FECHA_RESOLUCION'), fila, 'Columna E (FECHA_RESOLUCION)'
                )
            except ValueError as e:
                advertencias.append(f"Fila {fila}, Columna E (FECHA_RESOLUCION): {str(e)} - Se ignorará esta fecha")
            
            # Validar coherencia de fechas solo si todas las fechas obligatorias son válidas
            # NOTA: Es normal que fecha_inicio sea anterior a fecha_resolucion (eficacia anticipada)
            if fecha_inicio and fecha_fin and 'anios_vigencia' in locals():
                try:
                    es_valido, mensaje_error = validar_coherencia_fechas(
                        fecha_inicio,
                        fecha_fin,
                        anios_vigencia,
                        fecha_resolucion
                    )
                    
                    if not es_valido:
                        advertencias.append(f"Fila {fila}, Coherencia de fechas: {mensaje_error}")
                except Exception as e:
                    advertencias.append(f"Fila {fila}, Coherencia de fechas: Error validando coherencia - {str(e)}")
            
            # Validar resolución asociada (Columna C) - OPCIONAL
            # No generar advertencia si no está presente, es normal en resoluciones antiguas
            # resolucion_asociada = str(row.get('RESOLUCION_ASOCIADA', '')).strip()
            # La validación de existencia se hace en validar_plantilla_padres_con_db si es necesario

        
        return {
            'valido': len(errores) == 0,
            'errores': errores,
            'advertencias': advertencias,
            'total_filas': len(df)
        }
    
    async def procesar_plantilla_padres(
        self, 
        df: pd.DataFrame, 
        usuario_id: str
    ) -> Dict[str, Any]:
        """Procesar plantilla de resoluciones padres y crear registros"""
        
        # Normalizar nombres de columnas primero
        df = self._normalizar_nombres_columnas(df)
        
        # NO validar todo el archivo primero, procesar fila por fila
        # Esto permite procesar las filas válidas aunque haya algunas inválidas
        
        resoluciones_creadas = []
        resoluciones_actualizadas = []
        errores_procesamiento = []
        advertencias_procesamiento = []
        filas_omitidas = []
        
        for idx, row in df.iterrows():
            try:
                fila = idx + 2
                
                # LOG: Solo para las primeras 10 filas o si hay algo importante
                log_detallado = fila <= 10
                
                if log_detallado:
                    logger.info("=" * 70)
                    logger.info(f"PROCESANDO FILA {fila}")
                    logger.info("=" * 70)
                
                # VALIDACIÓN RÁPIDA: Verificar campos obligatorios
                errores_fila = []
                
                # Validar RUC
                ruc = str(row.get('RUC_EMPRESA_ASOCIADA', '')).strip()
                if not ruc:
                    errores_fila.append("RUC vacío")
                elif len(ruc) != 11:
                    errores_fila.append(f"RUC debe tener 11 dígitos (tiene {len(ruc)})")
                
                # Validar número resolución
                numero_resolucion_original = str(row.get('RESOLUCION_NUMERO', '')).strip()
                if not numero_resolucion_original:
                    errores_fila.append("Número de resolución vacío")
                
                # Validar tipo resolución
                tipo_resolucion_frontend = str(row.get('TIPO_RESOLUCION', '')).strip().upper()
                if 'NUEVA' in tipo_resolucion_frontend:
                    tipo_resolucion_frontend = 'NUEVA'
                if tipo_resolucion_frontend not in ['NUEVA', 'RENOVACION', 'MODIFICACION']:
                    errores_fila.append(f"Tipo de resolución inválido: '{tipo_resolucion_frontend}'")
                
                # Validar estado
                estado_frontend = str(row.get('ESTADO', '')).strip().upper()
                if estado_frontend not in ['ACTIVA', 'VENCIDA', 'RENOVADA', 'ANULADA']:
                    errores_fila.append(f"Estado inválido: '{estado_frontend}'")
                
                # Si hay errores de validación, omitir esta fila
                if errores_fila:
                    logger.warning(f"   ⚠️  Fila {fila} OMITIDA por errores de validación:")
                    for error in errores_fila:
                        logger.warning(f"      - {error}")
                    
                    filas_omitidas.append({
                        'fila': fila,
                        'numero': numero_resolucion_original,
                        'errores': errores_fila
                    })
                    continue  # Saltar esta fila y continuar con la siguiente
                
                # Obtener datos de la fila
                resolucion_asociada = str(row.get('RESOLUCION_ASOCIADA', '')).strip()
                
                # LOG: Leer años de vigencia con detalle
                anios_vigencia_raw = row.get('ANIOS_VIGENCIA', '')
                if log_detallado:
                    logger.info(f"Fila {fila} - Número: {numero_resolucion_original}")
                    logger.info(f"   ANIOS_VIGENCIA (raw): '{anios_vigencia_raw}' (tipo: {type(anios_vigencia_raw).__name__})")
                
                try:
                    anios_vigencia = int(anios_vigencia_raw)
                    if log_detallado:
                        logger.info(f"   ANIOS_VIGENCIA (convertido): {anios_vigencia}")
                    
                    if anios_vigencia == 10:
                        # SIEMPRE registrar resoluciones con 10 años
                        logger.info(f"   ⭐ FILA {fila} - {numero_resolucion_original}: ¡RESOLUCIÓN CON 10 AÑOS DETECTADA!")
                    elif log_detallado and anios_vigencia == 4:
                        logger.info(f"   ✓ Resolución con 4 años")
                    elif anios_vigencia not in [4, 10]:
                        logger.warning(f"   ⚠️  Fila {fila}: Años de vigencia inusual: {anios_vigencia}")
                except (ValueError, TypeError) as e:
                    logger.error(f"   ❌ FILA {fila} ERROR convirtiendo años de vigencia: {e}")
                    anios_vigencia = 4  # Valor por defecto
                    logger.warning(f"   Usando valor por defecto: {anios_vigencia}")
                
                # Convertir fechas usando la nueva función de parseo
                try:
                    fecha_resolucion = self._parse_excel_date(
                        row.get('FECHA_RESOLUCION'), fila, 'FECHA_RESOLUCION'
                    )
                except:
                    fecha_resolucion = None  # Es opcional
                
                # Intentar leer fechas del Excel
                fecha_inicio = None
                fecha_fin = None
                try:
                    fecha_inicio = self._parse_excel_date(
                        row.get('FECHA_INICIO_VIGENCIA'), fila, 'FECHA_INICIO_VIGENCIA'
                    )
                    fecha_fin = self._parse_excel_date(
                        row.get('FECHA_FIN_VIGENCIA'), fila, 'FECHA_FIN_VIGENCIA'
                    )
                except ValueError as e:
                    logger.warning(f"   ⚠️  Fila {fila}: Error leyendo fechas del Excel: {e}")
                
                # Si las fechas no están en el Excel, calcularlas automáticamente
                if fecha_inicio is None or fecha_fin is None:
                    logger.info(f"   📅 Fila {fila}: Calculando fechas automáticamente")
                    
                    # Extraer el año del número de resolución
                    import re
                    match = re.search(r'(\d{4})', numero_resolucion_original)
                    if match:
                        anio_resolucion = int(match.group(1))
                    else:
                        anio_resolucion = datetime.now().year
                    
                    # Fecha de inicio: 01/01/AÑO
                    fecha_inicio = datetime(anio_resolucion, 1, 1)
                    
                    # Fecha de fin: fecha_inicio + años de vigencia
                    from dateutil.relativedelta import relativedelta
                    fecha_fin = fecha_inicio + relativedelta(years=anios_vigencia)
                    
                    logger.info(f"   📅 Fechas calculadas: {fecha_inicio.strftime('%d/%m/%Y')} - {fecha_fin.strftime('%d/%m/%Y')}")
                
                # Normalizar número de resolución al formato R-XXXX-YYYY
                # IMPORTANTE: El año debe basarse en la fecha de emisión de la resolución,
                # NO en la fecha de vigencia (por eficacia anticipada)
                if fecha_resolucion:
                    fecha_para_normalizacion = fecha_resolucion
                else:
                    # Si no hay fecha de resolución, usar la fecha actual como referencia
                    # ya que la resolución se está procesando ahora
                    fecha_para_normalizacion = datetime.now()
                
                numero_resolucion = self._normalizar_numero_resolucion(
                    numero_resolucion_original, fecha_para_normalizacion
                )
                # Log de normalización
                if numero_resolucion != numero_resolucion_original:
                    logger.info(f"Fila {fila}: Número normalizado '{numero_resolucion_original}' → '{numero_resolucion}'")
                
                # Mapear valores del frontend a valores del backend
                mapeo_tipos = {
                    'NUEVA': 'AUTORIZACION_NUEVA',
                    'RENOVACION': 'RENOVACION',
                    'MODIFICACION': 'OTROS'
                }
                mapeo_estados = {
                    'ACTIVA': 'VIGENTE',
                    'VENCIDA': 'VENCIDA',
                    'RENOVADA': 'VIGENTE',
                    'ANULADA': 'ANULADA'
                }
                
                tipo_resolucion_backend = mapeo_tipos.get(tipo_resolucion_frontend, tipo_resolucion_frontend)
                estado_backend = mapeo_estados.get(estado_frontend, estado_frontend)
                
                # NOTA: anios_vigencia ya fue leído y procesado arriba con logs
                # NO volver a leerlo aquí para no sobrescribir
                
                # Buscar empresa por RUC
                empresa = await self.empresas_collection.find_one({"ruc": ruc})
                if not empresa:
                    errores_procesamiento.append(f"Fila {fila}, Columna A (RUC_EMPRESA_ASOCIADA): Empresa con RUC '{ruc}' no encontrada en la base de datos")
                    continue
                
                empresa_id = str(empresa.get('_id', empresa.get('id', '')))
                empresa_razon_social = empresa.get('razonSocial', {}).get('principal', 'Sin razón social')
                
                # Si es una RENOVACION con resolución asociada, actualizar el estado de la resolución anterior
                if tipo_resolucion_frontend == 'RENOVACION' and resolucion_asociada:
                    # Normalizar el número de la resolución asociada
                    resolucion_asociada_normalizada = self._normalizar_numero_resolucion(
                        resolucion_asociada, 
                        fecha_resolucion if fecha_resolucion else datetime.now()
                    )
                    
                    # Buscar la resolución anterior
                    resolucion_anterior = await self.resoluciones_collection.find_one({
                        "nroResolucion": resolucion_asociada_normalizada
                    })
                    
                    if resolucion_anterior:
                        # Ejecutar protocolo de renovación
                        from ..services.protocolo_renovacion_service import ProtocoloRenovacionService
                        
                        protocolo_service = ProtocoloRenovacionService(self.db)
                        resultado_protocolo = await protocolo_service.ejecutar_protocolo(
                            resolucion_asociada_normalizada,
                            numero_resolucion,
                            fecha_resolucion if fecha_resolucion else datetime.now()
                        )
                        
                        if resultado_protocolo['exito']:
                            logger.info(
                                f"Fila {fila}: Protocolo de renovación ejecutado. "
                                f"Vehículos transferidos: {resultado_protocolo['estadisticas']['vehiculos_transferidos']}, "
                                f"Rutas transferidas: {resultado_protocolo['estadisticas']['rutas_transferidas']}"
                            )
                        else:
                            advertencias_procesamiento.append(
                                f"Fila {fila}: Error ejecutando protocolo de renovación: {resultado_protocolo['mensaje']}"
                            )
                    else:
                        # Advertencia si no se encuentra la resolución anterior
                        advertencias_procesamiento.append(
                            f"Fila {fila}: Resolución asociada '{resolucion_asociada}' no encontrada en la base de datos. "
                            f"No se pudo ejecutar el protocolo de renovación."
                        )
                
                # Verificar si la resolución ya existe
                resolucion_existente = await self.resoluciones_collection.find_one({
                    "nroResolucion": numero_resolucion
                })
                
                if resolucion_existente:
                    # LOG: Solo para primeras 10 o si es de 10 años
                    if log_detallado or anios_vigencia == 10:
                        logger.info(f"   📝 ACTUALIZANDO resolución existente: {numero_resolucion}")
                        logger.info(f"   Años de vigencia a guardar: {anios_vigencia}")
                    
                    # Actualizar resolución existente
                    update_data = {
                        "empresaId": empresa_id,
                        "tipoResolucion": "PADRE",  # Las resoluciones padres son siempre PADRE
                        "tipoTramite": tipo_resolucion_backend,  # Usar valor mapeado del backend
                        "fechaVigenciaInicio": fecha_inicio,
                        "fechaVigenciaFin": fecha_fin,
                        "aniosVigencia": anios_vigencia,
                        "estado": estado_backend,  # Usar valor mapeado del backend
                        "fechaActualizacion": datetime.now()
                    }
                    
                    if log_detallado or anios_vigencia == 10:
                        logger.info(f"   Datos a actualizar: aniosVigencia={update_data['aniosVigencia']}")
                    
                    # Solo agregar fecha de emisión si está disponible
                    if fecha_resolucion:
                        update_data["fechaEmision"] = fecha_resolucion
                        
                        # Detectar eficacia anticipada
                        # Eficacia anticipada = cuando la vigencia inicia ANTES de la fecha de emisión
                        # Es decir: fechaEmision > fechaVigenciaInicio
                        if fecha_resolucion > fecha_inicio:
                            dias_diferencia = (fecha_resolucion - fecha_inicio).days
                            update_data["tieneEficaciaAnticipada"] = True
                            update_data["diasEficaciaAnticipada"] = dias_diferencia
                            logger.info(f"   ⚠️  Eficacia anticipada detectada: {dias_diferencia} días")
                        else:
                            update_data["tieneEficaciaAnticipada"] = False
                            update_data["diasEficaciaAnticipada"] = 0
                    
                    if resolucion_asociada:
                        update_data["resolucionAsociada"] = resolucion_asociada
                    
                    await self.resoluciones_collection.update_one(
                        {"_id": resolucion_existente["_id"]},
                        {"$set": update_data}
                    )
                    
                    if log_detallado or anios_vigencia == 10:
                        logger.info(f"   ✅ Resolución ACTUALIZADA en BD")
                    
                    # Verificar que se guardó correctamente
                    resolucion_verificada = await self.resoluciones_collection.find_one({"_id": resolucion_existente["_id"]})
                    anios_guardados = resolucion_verificada.get('aniosVigencia')
                    
                    if log_detallado or anios_vigencia == 10:
                        logger.info(f"   Verificación: aniosVigencia guardado en BD = {anios_guardados}")
                    
                    if anios_guardados != anios_vigencia:
                        logger.error(f"   ❌ FILA {fila} ERROR: Se intentó guardar {anios_vigencia} pero se guardó {anios_guardados}")
                    elif anios_guardados == 10:
                        logger.info(f"   ⭐ ¡CONFIRMADO! Resolución con 10 años guardada correctamente")
                    
                    resoluciones_actualizadas.append({
                        'numero': numero_resolucion,
                        'empresa': empresa_razon_social,
                        'tipo': tipo_resolucion_frontend,  # Mostrar valor del frontend al usuario
                        'estado': estado_frontend,  # Mostrar valor del frontend al usuario
                        'anios_vigencia': anios_guardados  # Agregar para verificación
                    })
                else:
                    # LOG: Solo para primeras 10 o si es de 10 años
                    if log_detallado or anios_vigencia == 10:
                        logger.info(f"   ✨ CREANDO nueva resolución: {numero_resolucion}")
                        logger.info(f"   Años de vigencia a guardar: {anios_vigencia}")
                    
                    # Crear nueva resolución
                    nueva_resolucion = {
                        "nroResolucion": numero_resolucion,
                        "empresaId": empresa_id,
                        "tipoResolucion": "PADRE",  # Las resoluciones padres son siempre PADRE
                        "tipoTramite": tipo_resolucion_backend,  # Usar valor mapeado del backend
                        "fechaVigenciaInicio": fecha_inicio,
                        "fechaVigenciaFin": fecha_fin,
                        "aniosVigencia": anios_vigencia,
                        "estado": estado_backend,  # Usar valor mapeado del backend
                        "descripcion": f"Resolución {tipo_resolucion_frontend.lower()} - Carga masiva",
                        "vehiculosHabilitadosIds": [],
                        "rutasAutorizadasIds": [],
                        "resolucionesHijasIds": [],
                        "estaActivo": True,
                        "fechaRegistro": datetime.now(),
                        "usuarioEmisionId": usuario_id
                    }
                    
                    if log_detallado or anios_vigencia == 10:
                        logger.info(f"   Documento a crear: aniosVigencia={nueva_resolucion['aniosVigencia']}")
                    
                    # Solo agregar fecha de emisión si está disponible
                    if fecha_resolucion:
                        nueva_resolucion["fechaEmision"] = fecha_resolucion
                        
                        # Detectar eficacia anticipada
                        # Eficacia anticipada = cuando la vigencia inicia ANTES de la fecha de emisión
                        # Es decir: fechaEmision > fechaVigenciaInicio
                        if fecha_resolucion > fecha_inicio:
                            dias_diferencia = (fecha_resolucion - fecha_inicio).days
                            nueva_resolucion["tieneEficaciaAnticipada"] = True
                            nueva_resolucion["diasEficaciaAnticipada"] = dias_diferencia
                            logger.info(f"   ⚠️  Eficacia anticipada detectada: {dias_diferencia} días")
                        else:
                            nueva_resolucion["tieneEficaciaAnticipada"] = False
                            nueva_resolucion["diasEficaciaAnticipada"] = 0
                    else:
                        # Si no hay fecha de emisión, no se puede determinar eficacia anticipada
                        nueva_resolucion["tieneEficaciaAnticipada"] = None
                        nueva_resolucion["diasEficaciaAnticipada"] = None
                    
                    if resolucion_asociada:
                        nueva_resolucion["resolucionAsociada"] = resolucion_asociada
                    
                    result = await self.resoluciones_collection.insert_one(nueva_resolucion)
                    nueva_resolucion["id"] = str(result.inserted_id)
                    
                    if log_detallado or anios_vigencia == 10:
                        logger.info(f"   ✅ Resolución CREADA en BD con ID: {nueva_resolucion['id']}")
                    
                    # Verificar que se guardó correctamente
                    resolucion_verificada = await self.resoluciones_collection.find_one({"_id": result.inserted_id})
                    anios_guardados = resolucion_verificada.get('aniosVigencia')
                    
                    if log_detallado or anios_vigencia == 10:
                        logger.info(f"   Verificación: aniosVigencia guardado en BD = {anios_guardados}")
                    
                    if anios_guardados != anios_vigencia:
                        logger.error(f"   ❌ FILA {fila} ERROR: Se intentó guardar {anios_vigencia} pero se guardó {anios_guardados}")
                    elif anios_guardados == 10:
                        logger.info(f"   ⭐ ¡CONFIRMADO! Resolución con 10 años guardada correctamente")
                    
                    resoluciones_creadas.append({
                        'numero': numero_resolucion,
                        'empresa': empresa_razon_social,
                        'tipo': tipo_resolucion_frontend,  # Mostrar valor del frontend al usuario
                        'estado': estado_frontend,  # Mostrar valor del frontend al usuario
                        'anios_vigencia': anios_guardados  # Agregar para verificación
                    })
                
            except Exception as e:
                logger.error(f"❌ Error procesando fila {fila}: {str(e)}")
                import traceback
                logger.error(traceback.format_exc())
                errores_procesamiento.append(f"Fila {fila}: Error de procesamiento - {str(e)}")
        
        # LOG: Resumen final
        logger.info("=" * 70)
        logger.info("RESUMEN FINAL DE PROCESAMIENTO")
        logger.info("=" * 70)
        logger.info(f"Total procesadas: {len(resoluciones_creadas) + len(resoluciones_actualizadas)}")
        logger.info(f"Creadas: {len(resoluciones_creadas)}")
        logger.info(f"Actualizadas: {len(resoluciones_actualizadas)}")
        logger.info(f"Filas omitidas: {len(filas_omitidas)}")
        logger.info(f"Errores: {len(errores_procesamiento)}")
        
        # Contar resoluciones con 10 años
        con_10_anios = sum(1 for r in resoluciones_creadas + resoluciones_actualizadas if r.get('anios_vigencia') == 10)
        con_4_anios = sum(1 for r in resoluciones_creadas + resoluciones_actualizadas if r.get('anios_vigencia') == 4)
        
        logger.info(f"\nDistribución de años de vigencia:")
        logger.info(f"   Con 4 años: {con_4_anios}")
        logger.info(f"   Con 10 años: {con_10_anios}")
        
        if con_10_anios > 0:
            logger.info(f"\n⭐ ¡ÉXITO! Se procesaron {con_10_anios} resoluciones con 10 años")
            logger.info(f"Resoluciones con 10 años:")
            for r in resoluciones_creadas + resoluciones_actualizadas:
                if r.get('anios_vigencia') == 10:
                    logger.info(f"   - {r['numero']}")
        else:
            logger.warning(f"\n⚠️  NO se procesaron resoluciones con 10 años")
        
        if filas_omitidas:
            logger.warning(f"\n⚠️  Se omitieron {len(filas_omitidas)} filas por errores de validación")
        
        logger.info("=" * 70)
        
        # Preparar mensaje de resultado
        total_procesadas = len(resoluciones_creadas) + len(resoluciones_actualizadas)
        if total_procesadas > 0:
            mensaje = f'Procesamiento completado. {len(resoluciones_creadas)} creadas, {len(resoluciones_actualizadas)} actualizadas'
            if filas_omitidas:
                mensaje += f', {len(filas_omitidas)} filas omitidas'
            exito = True
        else:
            mensaje = 'No se procesó ninguna resolución. Todas las filas tienen errores.'
            exito = False
        
        # Convertir filas omitidas a formato de errores para el frontend
        errores_validacion = [
            f"Fila {f['fila']} ({f['numero']}): {', '.join(f['errores'])}"
            for f in filas_omitidas
        ]
        
        return {
            'exito': exito,
            'mensaje': mensaje,
            'resoluciones_creadas': resoluciones_creadas,
            'resoluciones_actualizadas': resoluciones_actualizadas,
            'errores': errores_procesamiento + errores_validacion,
            'advertencias': advertencias_procesamiento,
            'estadisticas': {
                'total_procesadas': total_procesadas,
                'creadas': len(resoluciones_creadas),
                'actualizadas': len(resoluciones_actualizadas),
                'errores': len(errores_procesamiento),
                'filas_omitidas': len(filas_omitidas),
                'con_4_anios': con_4_anios,
                'con_10_anios': con_10_anios
            }
        }
    
    async def generar_reporte_estados(self) -> Dict[str, Any]:
        """Generar reporte de estados de resoluciones"""
        
        try:
            # Contar por estado
            pipeline_estados = [
                {"$match": {"estaActivo": True}},
                {"$group": {"_id": "$estado", "cantidad": {"$sum": 1}}}
            ]
            estados_result = await self.resoluciones_collection.aggregate(pipeline_estados).to_list(None)
            por_estado = {item["_id"]: item["cantidad"] for item in estados_result if item["_id"]}
            
            # Contar por tipo de trámite
            pipeline_tipos = [
                {"$match": {"estaActivo": True}},
                {"$group": {"_id": "$tipoTramite", "cantidad": {"$sum": 1}}}
            ]
            tipos_result = await self.resoluciones_collection.aggregate(pipeline_tipos).to_list(None)
            por_tipo = {item["_id"]: item["cantidad"] for item in tipos_result if item["_id"]}
            
            # Resoluciones con y sin resolución asociada
            con_asociadas = await self.resoluciones_collection.count_documents({
                "estaActivo": True,
                "resolucionAsociada": {"$exists": True, "$ne": "", "$ne": None}
            })
            
            sin_asociadas = await self.resoluciones_collection.count_documents({
                "estaActivo": True,
                "$or": [
                    {"resolucionAsociada": {"$exists": False}},
                    {"resolucionAsociada": ""},
                    {"resolucionAsociada": None}
                ]
            })
            
            total = await self.resoluciones_collection.count_documents({"estaActivo": True})
            
            return {
                'exito': True,
                'por_estado': por_estado,
                'por_tipo': por_tipo,
                'con_resolucion_asociada': con_asociadas,
                'sin_resolucion_asociada': sin_asociadas,
                'total': total
            }
            
        except Exception as e:
            logger.error(f"Error generando reporte de estados: {str(e)}")
            return {
                'exito': False,
                'mensaje': f'Error generando reporte: {str(e)}'
            }