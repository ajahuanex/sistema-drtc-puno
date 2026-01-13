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
    
    @staticmethod
    def validar_plantilla_padres(df: pd.DataFrame) -> Dict[str, Any]:
        """Validar estructura y datos de la plantilla de resoluciones padres"""
        
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
            resolucion_asociada = str(row.get('RESOLUCION_ASOCIADA', '')).strip()
            if tipo_resolucion == 'RENOVACION' and not resolucion_asociada:
                advertencias.append(f"Fila {fila}, Columna C (RESOLUCION_ASOCIADA): Se recomienda especificar la resolución que se está renovando")
        
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
        
        # Validar primero
        validacion = self.validar_plantilla_padres(df)
        if not validacion['valido']:
            return {
                'exito': False,
                'mensaje': 'Errores de validación encontrados',
                'errores': validacion['errores'],
                'advertencias': validacion['advertencias']
            }
        
        resoluciones_creadas = []
        resoluciones_actualizadas = []
        errores_procesamiento = []
        
        for idx, row in df.iterrows():
            try:
                fila = idx + 2
                
                # Obtener datos de la fila
                ruc = str(row['RUC_EMPRESA_ASOCIADA']).strip()
                numero_resolucion_original = str(row['RESOLUCION_NUMERO']).strip()
                resolucion_asociada = str(row.get('RESOLUCION_ASOCIADA', '')).strip()
                tipo_resolucion_frontend = str(row['TIPO_RESOLUCION']).strip().upper()
                estado_frontend = str(row['ESTADO']).strip().upper()
                anios_vigencia = int(row['ANIOS_VIGENCIA'])
                
                # Convertir fechas usando la nueva función de parseo
                try:
                    fecha_resolucion = self._parse_excel_date(
                        row.get('FECHA_RESOLUCION'), fila, 'FECHA_RESOLUCION'
                    )
                except:
                    fecha_resolucion = None  # Es opcional
                
                try:
                    fecha_inicio = self._parse_excel_date(
                        row['FECHA_INICIO_VIGENCIA'], fila, 'FECHA_INICIO_VIGENCIA'
                    )
                    fecha_fin = self._parse_excel_date(
                        row['FECHA_FIN_VIGENCIA'], fila, 'FECHA_FIN_VIGENCIA'
                    )
                except ValueError as e:
                    errores_procesamiento.append(f"Fila {fila}: Error en fechas - {str(e)}")
                    continue
                
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
                
                anios_vigencia = int(row['ANIOS_VIGENCIA'])
                
                # Buscar empresa por RUC
                empresa = await self.empresas_collection.find_one({"ruc": ruc})
                if not empresa:
                    errores_procesamiento.append(f"Fila {fila}, Columna A (RUC_EMPRESA_ASOCIADA): Empresa con RUC '{ruc}' no encontrada en la base de datos")
                    continue
                
                empresa_id = str(empresa.get('_id', empresa.get('id', '')))
                empresa_razon_social = empresa.get('razonSocial', {}).get('principal', 'Sin razón social')
                
                # Verificar si la resolución ya existe
                resolucion_existente = await self.resoluciones_collection.find_one({
                    "nroResolucion": numero_resolucion
                })
                
                if resolucion_existente:
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
                    
                    # Solo agregar fecha de emisión si está disponible
                    if fecha_resolucion:
                        update_data["fechaEmision"] = fecha_resolucion
                    
                    if resolucion_asociada:
                        update_data["resolucionAsociada"] = resolucion_asociada
                    
                    await self.resoluciones_collection.update_one(
                        {"_id": resolucion_existente["_id"]},
                        {"$set": update_data}
                    )
                    
                    resoluciones_actualizadas.append({
                        'numero': numero_resolucion,
                        'empresa': empresa_razon_social,
                        'tipo': tipo_resolucion_frontend,  # Mostrar valor del frontend al usuario
                        'estado': estado_frontend  # Mostrar valor del frontend al usuario
                    })
                else:
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
                    
                    # Solo agregar fecha de emisión si está disponible
                    if fecha_resolucion:
                        nueva_resolucion["fechaEmision"] = fecha_resolucion
                    
                    if resolucion_asociada:
                        nueva_resolucion["resolucionAsociada"] = resolucion_asociada
                    
                    result = await self.resoluciones_collection.insert_one(nueva_resolucion)
                    nueva_resolucion["id"] = str(result.inserted_id)
                    
                    resoluciones_creadas.append({
                        'numero': numero_resolucion,
                        'empresa': empresa_razon_social,
                        'tipo': tipo_resolucion_frontend,  # Mostrar valor del frontend al usuario
                        'estado': estado_frontend  # Mostrar valor del frontend al usuario
                    })
                
            except Exception as e:
                logger.error(f"Error procesando fila {fila}: {str(e)}")
                errores_procesamiento.append(f"Fila {fila}: Error de procesamiento - {str(e)}")
        
        return {
            'exito': len(errores_procesamiento) == 0,
            'mensaje': f'Procesamiento completado. {len(resoluciones_creadas)} creadas, {len(resoluciones_actualizadas)} actualizadas',
            'resoluciones_creadas': resoluciones_creadas,
            'resoluciones_actualizadas': resoluciones_actualizadas,
            'errores': errores_procesamiento,
            'advertencias': validacion['advertencias'],
            'estadisticas': {
                'total_procesadas': len(resoluciones_creadas) + len(resoluciones_actualizadas),
                'creadas': len(resoluciones_creadas),
                'actualizadas': len(resoluciones_actualizadas),
                'errores': len(errores_procesamiento)
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