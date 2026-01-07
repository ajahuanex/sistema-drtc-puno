"""
Servicio para carga masiva de rutas desde archivos Excel
"""
import pandas as pd
import re
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from io import BytesIO
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.ruta import (
    RutaCreate, 
    EstadoRuta, 
    TipoRuta, 
    TipoServicio
)

class RutaExcelService:
    def __init__(self, db: AsyncIOMotorDatabase = None):
        self.db = db
        if db is not None:
            self.rutas_collection = db["rutas"]
            self.empresas_collection = db["empresas"]
            self.resoluciones_collection = db["resoluciones"]
        
    def generar_plantilla_excel(self) -> BytesIO:
        """Generar plantilla Excel para carga masiva de rutas"""
        
        # Crear workbook con múltiples hojas
        buffer = BytesIO()
        
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            # Hoja 1: Instrucciones
            instrucciones_data = {
                'INSTRUCCIONES PARA CARGA MASIVA DE RUTAS': [
                    '1. Complete la hoja "DATOS" con la información de las rutas',
                    '2. Los campos marcados con (*) son obligatorios',
                    '3. Empresa ID y Resolución ID deben existir en el sistema',
                    '4. El código de ruta debe ser único dentro de la resolución',
                    '5. Guarde el archivo y súbalo al sistema',
                    '',
                    'CAMPOS OBLIGATORIOS (en este orden):',
                    '• RUC: RUC de la empresa (ej: 20232008261)',
                    '• Resolución: Número de resolución (ej: 0921-2023, R-0921-2023) - se normaliza automáticamente',
                    '• Código Ruta: 1-3 dígitos (ej: 1, 02, 123) - se normaliza automáticamente',
                    '• Origen: Lugar de origen (ej: PUNO, JULIACA)',
                    '• Destino: Lugar de destino (ej: JULIACA, AREQUIPA)',
                    '• Frecuencia: Descripción de frecuencias (ej: 08 DIARIAS, 02 SEMANALES)',
                    '',
                    'CAMPOS OPCIONALES (en este orden):',
                    '• Itinerario: Descripción de la ruta (ej: PUNO - JULIACA)',
                    '• Estado: ACTIVA, INACTIVA, EN_MANTENIMIENTO, SUSPENDIDA, DADA_DE_BAJA, CANCELADA (por defecto: ACTIVA)',
                    '• Observaciones: Comentarios adicionales',
                ]
            }
            
            df_instrucciones = pd.DataFrame(instrucciones_data)
            df_instrucciones.to_excel(writer, sheet_name='INSTRUCCIONES', index=False)
            
            # Hoja 2: Ejemplos con el orden específico solicitado
            datos_ejemplo = {
                'RUC (*)': ['20232008261', '20364027410', '20231231006'],
                'Resolución (*)': ['0921-2023', 'R-0495-2022', '195-2024'],  # Diferentes formatos
                'Código Ruta (*)': ['1', '2', '03'],  # Ejemplos con 1 y 2 dígitos
                'Origen (*)': ['PUNO', 'JULIACA', 'AZANGARO'],
                'Destino (*)': ['JULIACA', 'AREQUIPA', 'JULIACA'],
                'Frecuencia (*)': ['08 DIARIAS', '02 DIARIAS', '10 DIARIAS'],
                'Itinerario': ['PUNO - JULIACA', 'JULIACA - AREQUIPA', 'AZANGARO - JULIACA'],  # Sin (*)
                'Estado': ['ACTIVA', 'ACTIVA', 'ACTIVA'],
                'Observaciones': ['Ruta principal Puno-Juliaca', 'Ruta comercial', 'Ruta regional']
            }
            
            df_ejemplos = pd.DataFrame(datos_ejemplo)
            df_ejemplos.to_excel(writer, sheet_name='EJEMPLOS', index=False)
            
            # Hoja 3: Datos (vacía para completar) con el orden específico
            columnas_datos = [
                'RUC (*)', 
                'Resolución (*)', 
                'Código Ruta (*)', 
                'Origen (*)', 
                'Destino (*)', 
                'Frecuencia (*)',
                'Itinerario',  # Sin (*)
                'Estado', 
                'Observaciones'
            ]
            
            df_datos = pd.DataFrame(columns=columnas_datos)
            df_datos.to_excel(writer, sheet_name='DATOS', index=False)
            
            # Formatear hojas
            workbook = writer.book
            
            # Formatear hoja de instrucciones
            ws_instrucciones = writer.sheets['INSTRUCCIONES']
            for column in ws_instrucciones.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 80)
                ws_instrucciones.column_dimensions[column_letter].width = adjusted_width
            
            # Formatear hoja de ejemplos y datos
            for sheet_name in ['EJEMPLOS', 'DATOS']:
                worksheet = writer.sheets[sheet_name]
                for column in worksheet.columns:
                    max_length = 0
                    column_letter = column[0].column_letter
                    for cell in column:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except:
                            pass
                    adjusted_width = min(max_length + 2, 30)
                    worksheet.column_dimensions[column_letter].width = adjusted_width
        
        buffer.seek(0)
        return buffer
    
    async def validar_archivo_excel(self, archivo_excel: BytesIO) -> Dict[str, Any]:
        """Validar archivo Excel de rutas"""
        try:
            # Intentar leer diferentes hojas
            df = None
            try:
                df = pd.read_excel(archivo_excel, sheet_name='DATOS')
            except:
                try:
                    df = pd.read_excel(archivo_excel, sheet_name=0)  # Primera hoja
                except:
                    df = pd.read_excel(archivo_excel)
            
            if df is None or df.empty:
                return {
                    'error': 'No se pudo leer el archivo Excel o está vacío',
                    'total_filas': 0,
                    'validos': 0,
                    'invalidos': 0,
                    'con_advertencias': 0,
                    'errores': [],
                    'advertencias': [],
                    'rutas_validas': []
                }
            
            # Normalizar nombres de columnas
            df.columns = df.columns.str.strip()
            df.columns = df.columns.str.replace(r'\s*\(\*\)\s*', '', regex=True)  # Remover (*)
            
            resultados = {
                'total_filas': len(df),
                'validos': 0,
                'invalidos': 0,
                'con_advertencias': 0,
                'errores': [],
                'advertencias': [],
                'rutas_validas': []
            }
            
            for index, row in df.iterrows():
                fila_num = index + 2  # +2 porque Excel empieza en 1 y tiene header
                errores_fila = []
                advertencias_fila = []
                
                # Validar fila
                errores_fila, advertencias_fila = await self._validar_fila_ruta(row, fila_num)
                
                if errores_fila:
                    resultados['invalidos'] += 1
                    codigo_ruta = str(row.get('Código Ruta', 'N/A')).strip()
                    resultados['errores'].append({
                        'fila': fila_num,
                        'codigo_ruta': codigo_ruta,
                        'errores': errores_fila
                    })
                else:
                    if advertencias_fila:
                        resultados['con_advertencias'] += 1
                        codigo_ruta = str(row.get('Código Ruta', 'N/A')).strip()
                        resultados['advertencias'].append({
                            'fila': fila_num,
                            'codigo_ruta': codigo_ruta,
                            'advertencias': advertencias_fila
                        })
                    
                    resultados['validos'] += 1
                    # Convertir fila a modelo de ruta
                    try:
                        ruta = await self._convertir_fila_a_ruta(row)
                        resultados['rutas_validas'].append(ruta)
                    except Exception as e:
                        resultados['validos'] -= 1
                        resultados['invalidos'] += 1
                        codigo_ruta = str(row.get('Código Ruta', 'N/A')).strip()
                        resultados['errores'].append({
                            'fila': fila_num,
                            'codigo_ruta': codigo_ruta,
                            'errores': [f"Error al procesar ruta: {str(e)}"]
                        })
            
            return resultados
            
        except Exception as e:
            return {
                'error': f"Error al procesar archivo Excel: {str(e)}",
                'total_filas': 0,
                'validos': 0,
                'invalidos': 0,
                'con_advertencias': 0,
                'errores': [],
                'advertencias': [],
                'rutas_validas': []
            }
    
    async def _validar_fila_ruta(self, row: pd.Series, fila_num: int) -> Tuple[List[str], List[str]]:
        """Validar una fila de ruta con el nuevo formato"""
        errores = []
        advertencias = []
        
        # Obtener datos básicos
        ruc = str(row.get('RUC', '')).strip() if pd.notna(row.get('RUC')) else ''
        resolucion = str(row.get('Resolución', '')).strip() if pd.notna(row.get('Resolución')) else ''
        
        # Validar RUC (requerido)
        if not ruc:
            errores.append("RUC es requerido")
        
        # Validar Resolución (requerido) - normalizar formato
        if not resolucion:
            errores.append("Resolución es requerida")
        
        # Si tenemos ambos datos y conexión a BD, validar la relación
        if ruc and resolucion and self.db is not None:
            resolucion_normalizada = self._normalizar_resolucion(resolucion)
            resolucion_valida, mensaje_resolucion = await self._validar_resolucion_y_ruc(resolucion_normalizada, ruc)
            if not resolucion_valida:
                # Si la resolución no existe, permitir crear con estado DADA_DE_BAJA para revisión
                if "no existe" in mensaje_resolucion.lower():
                    advertencias.append(f"Resolución no encontrada: {resolucion_normalizada} - Se creará con estado DADA_DE_BAJA para revisión")
                else:
                    errores.append(mensaje_resolucion)
        
        # Validar código de ruta (requerido)
        codigo_ruta = str(row.get('Código Ruta', '')).strip() if pd.notna(row.get('Código Ruta')) else ''
        if not codigo_ruta:
            errores.append("Código de ruta es requerido")
        elif not self._validar_formato_codigo_ruta(codigo_ruta):
            errores.append(f"Formato de código de ruta inválido: {codigo_ruta} (debe ser 1-3 dígitos)")
        elif self.db is not None and resolucion:
            # Normalizar código antes de validar duplicados
            codigo_normalizado = self._normalizar_codigo_ruta(codigo_ruta)
            # Validar código único dentro de la resolución
            resolucion_normalizada = self._normalizar_resolucion(resolucion)
            if await self._existe_codigo_en_resolucion(codigo_normalizado, resolucion_normalizada):
                advertencias.append(f"Ya existe una ruta con código {codigo_normalizado} en esta resolución - se actualizará")
        
        # Validar origen (requerido)
        origen = str(row.get('Origen', '')).strip() if pd.notna(row.get('Origen')) else ''
        if not origen:
            errores.append("Origen es requerido")
        
        # Validar destino (requerido)
        destino = str(row.get('Destino', '')).strip() if pd.notna(row.get('Destino')) else ''
        if not destino:
            errores.append("Destino es requerido")
        
        # Validar origen y destino iguales - PERMITIR cuando tienen "-" (rutas canceladas/en edición)
        if origen and destino and origen == destino and origen != "-":
            errores.append("El origen y destino no pueden ser iguales (excepto cuando es '-' para rutas canceladas)")
        
        # Validar itinerario (opcional) - La normalización se hace en _convertir_fila_a_ruta
        itinerario = str(row.get('Itinerario', '')).strip() if pd.notna(row.get('Itinerario')) else ''
        # Solo validar longitud si no está vacío (vacío se convierte en "SIN ITINERARIO" después)
        if itinerario and len(itinerario) < 5:
            errores.append("Itinerario debe tener al menos 5 caracteres")
        
        # Validar frecuencia (requerido)
        frecuencia = str(row.get('Frecuencia', '')).strip() if pd.notna(row.get('Frecuencia')) else ''
        if not frecuencia:
            errores.append("Frecuencia es requerida")
        
        # Validar estado (opcional)
        estado = str(row.get('Estado', 'ACTIVA')).strip().upper() if pd.notna(row.get('Estado')) else 'ACTIVA'
        if estado and estado not in [e.value for e in EstadoRuta]:
            errores.append(f"Estado inválido: {estado}. Valores válidos: {', '.join([e.value for e in EstadoRuta])}")
        
        return errores, advertencias
    
    def _normalizar_resolucion(self, resolucion: str) -> str:
        """Normalizar formato de resolución a R-XXXX-YYYY"""
        # Remover espacios y convertir a mayúsculas
        resolucion = resolucion.strip().upper()
        
        # Si ya tiene el formato correcto R-XXXX-YYYY, devolverlo
        if re.match(r'^R-\d{4}-\d{4}$', resolucion):
            return resolucion
        
        # Si tiene formato XXXX-YYYY (sin R-), agregar R-
        if re.match(r'^\d{4}-\d{4}$', resolucion):
            return f"R-{resolucion}"
        
        # Si tiene formato R-XXX-YYYY (3 dígitos), convertir a 4 dígitos
        match = re.match(r'^R-(\d{3})-(\d{4})$', resolucion)
        if match:
            return f"R-0{match.group(1)}-{match.group(2)}"
        
        # Si tiene formato XXX-YYYY (3 dígitos), convertir a R-0XXX-YYYY
        match = re.match(r'^(\d{3})-(\d{4})$', resolucion)
        if match:
            return f"R-0{match.group(1)}-{match.group(2)}"
        
        # Si no coincide con ningún patrón, devolver tal como está
        return resolucion
    
    async def _validar_resolucion_flexible(self, resolucion_original: str, ruc: str) -> Tuple[bool, str]:
        """Validar resolución con múltiples formatos posibles"""
        if self.db is None:
            return True, "OK"
        
        try:
            # Intentar con el formato original primero
            resolucion = await self.resoluciones_collection.find_one({"nroResolucion": resolucion_original})
            
            # Si no se encuentra, intentar con formato normalizado
            if not resolucion:
                resolucion_normalizada = self._normalizar_resolucion(resolucion_original)
                resolucion = await self.resoluciones_collection.find_one({"nroResolucion": resolucion_normalizada})
            
            if not resolucion:
                return False, f"Resolución {resolucion_original} no existe (probado también como {self._normalizar_resolucion(resolucion_original)})"
            
            # Obtener empresa por RUC para validar la relación
            empresa = await self.empresas_collection.find_one({"ruc": ruc})
            if not empresa:
                return False, f"Empresa con RUC {ruc} no encontrada"
            
            # Validar que la resolución pertenezca a la empresa
            empresa_obj_id = str(empresa.get("_id", ""))
            resolucion_empresa_id = resolucion.get("empresaId", "")
            
            if resolucion_empresa_id != empresa_obj_id and resolucion_empresa_id != empresa.get("id", ""):
                return False, f"La resolución {resolucion_original} no pertenece a la empresa {ruc}"
            
            # Validar estado VIGENTE
            if resolucion.get("estado") != "VIGENTE":
                return False, f"La resolución debe estar VIGENTE. Estado actual: {resolucion.get('estado')}"
            
            # Validar tipo PADRE
            if resolucion.get("tipoResolucion") != "PADRE":
                return False, "Solo se pueden asociar rutas a resoluciones PADRE (primigenias)"
            
            return True, "OK"
            
        except Exception as e:
            return False, f"Error al validar resolución: {str(e)}"
    
    def _normalizar_codigo_ruta(self, codigo: str) -> str:
        """Normalizar código de ruta a formato de 2 dígitos mínimo"""
        codigo = codigo.strip()
        if codigo.isdigit():
            # Si es 1 dígito, agregar 0 al inicio
            if len(codigo) == 1:
                return f"0{codigo}"
            # Si es 2 o 3 dígitos, mantener tal como está
            return codigo
        return codigo
    
    def _validar_formato_codigo_ruta(self, codigo: str) -> bool:
        """Validar formato de código de ruta: 1-3 dígitos"""
        return codigo.isdigit() and 1 <= len(codigo) <= 3
    
    def _validar_formato_tiempo(self, tiempo: str) -> bool:
        """Validar formato de tiempo HH:MM"""
        patron = r'^\d{1,2}:\d{2}$'
        if not re.match(patron, tiempo):
            return False
        try:
            horas, minutos = tiempo.split(':')
            return 0 <= int(horas) <= 23 and 0 <= int(minutos) <= 59
        except ValueError:
            return False
    
    async def _existe_empresa(self, empresa_id: str) -> bool:
        """Verificar si existe la empresa por RUC"""
        if self.db is None:
            return True  # Sin DB, asumir que existe
        
        try:
            # Buscar por RUC (que es lo que se usa como empresa_id en los datos reales)
            empresa = await self.empresas_collection.find_one({"ruc": empresa_id})
            if empresa:
                return True
            
            # También buscar por ObjectId si es válido
            if ObjectId.is_valid(empresa_id):
                empresa = await self.empresas_collection.find_one({"_id": ObjectId(empresa_id)})
                if empresa:
                    return True
            
            # Buscar por campo id
            empresa = await self.empresas_collection.find_one({"id": empresa_id})
            return empresa is not None
        except:
            return False
    
    async def _validar_resolucion_y_ruc(self, resolucion_normalizada: str, ruc: str) -> Tuple[bool, str]:
        """Validar resolución y que el RUC coincida con la empresa de esa resolución"""
        if self.db is None:
            return True, "OK"  # Sin DB, asumir que es válida
        
        try:
            # 1. Buscar resolución por número normalizado
            resolucion = await self.resoluciones_collection.find_one({"nroResolucion": resolucion_normalizada})
            
            if not resolucion:
                return False, f"Resolución {resolucion_normalizada} no existe"
            
            # 2. Validar estado VIGENTE
            if resolucion.get("estado") != "VIGENTE":
                return False, f"La resolución debe estar VIGENTE. Estado actual: {resolucion.get('estado')}"
            
            # 3. Validar tipo PADRE
            if resolucion.get("tipoResolucion") != "PADRE":
                return False, "Solo se pueden asociar rutas a resoluciones PADRE (primigenias)"
            
            # 4. Obtener empresa asociada a la resolución
            empresa_id_resolucion = resolucion.get("empresaId", "")
            
            # 5. Buscar empresa por el ID de la resolución
            empresa_resolucion = None
            if ObjectId.is_valid(empresa_id_resolucion):
                empresa_resolucion = await self.empresas_collection.find_one({"_id": ObjectId(empresa_id_resolucion)})
            if not empresa_resolucion:
                empresa_resolucion = await self.empresas_collection.find_one({"id": empresa_id_resolucion})
            
            if not empresa_resolucion:
                return False, f"No se encontró la empresa asociada a la resolución {resolucion_normalizada}"
            
            # 6. Validar que el RUC del Excel coincida con el RUC de la empresa de la resolución
            ruc_empresa_resolucion = empresa_resolucion.get("ruc", "")
            if ruc != ruc_empresa_resolucion:
                return False, f"El RUC {ruc} no coincide con el RUC {ruc_empresa_resolucion} de la empresa asociada a la resolución {resolucion_normalizada}"
            
            return True, "OK"
            
        except Exception as e:
            return False, f"Error al validar resolución y RUC: {str(e)}"
    
    async def _validar_resolucion(self, resolucion_normalizada: str, ruc: str) -> Tuple[bool, str]:
        """Validar que la resolución sea PADRE, VIGENTE y pertenezca a la empresa"""
        if self.db is None:
            return True, "OK"  # Sin DB, asumir que es válida
        
        try:
            # Buscar por número de resolución normalizado
            resolucion = await self.resoluciones_collection.find_one({"nroResolucion": resolucion_normalizada})
            
            if not resolucion:
                return False, f"Resolución {resolucion_normalizada} no existe"
            
            # Obtener empresa por RUC para validar la relación
            empresa = await self.empresas_collection.find_one({"ruc": ruc})
            if not empresa:
                return False, f"Empresa con RUC {ruc} no encontrada"
            
            # Validar que la resolución pertenezca a la empresa
            empresa_obj_id = str(empresa.get("_id", ""))
            resolucion_empresa_id = resolucion.get("empresaId", "")
            
            if resolucion_empresa_id != empresa_obj_id and resolucion_empresa_id != empresa.get("id", ""):
                return False, f"La resolución {resolucion_normalizada} no pertenece a la empresa {ruc}"
            
            # Validar estado VIGENTE
            if resolucion.get("estado") != "VIGENTE":
                return False, f"La resolución debe estar VIGENTE. Estado actual: {resolucion.get('estado')}"
            
            # Validar tipo PADRE
            if resolucion.get("tipoResolucion") != "PADRE":
                return False, "Solo se pueden asociar rutas a resoluciones PADRE (primigenias)"
            
            return True, "OK"
            
        except Exception as e:
            return False, f"Error al validar resolución: {str(e)}"
    
    async def _obtener_id_ruta_existente(self, codigo_ruta: str, resolucion_normalizada: str) -> str:
        """Obtener el ID de una ruta existente"""
        if self.db is None:
            return None
        
        try:
            # Buscar resolución por número normalizado
            resolucion = await self.resoluciones_collection.find_one({"nroResolucion": resolucion_normalizada})
            if not resolucion:
                return None
            
            resolucion_id = str(resolucion.get("_id"))
            
            # Buscar ruta existente
            ruta_existente = await self.rutas_collection.find_one({
                "codigoRuta": codigo_ruta,
                "resolucionId": resolucion_id,
                "estaActivo": True
            })
            
            if ruta_existente:
                return str(ruta_existente.get("_id"))
            return None
        except:
            return None
    
    async def _existe_codigo_en_resolucion(self, codigo_ruta: str, resolucion_normalizada: str) -> bool:
        """Verificar si ya existe el código de ruta en la resolución"""
        if self.db is None:
            return False  # Sin DB, asumir que no existe
        
        try:
            # Buscar resolución por número normalizado
            resolucion = await self.resoluciones_collection.find_one({"nroResolucion": resolucion_normalizada})
            if not resolucion:
                return False
            
            resolucion_id = str(resolucion.get("_id"))
            
            # Buscar ruta existente
            ruta_existente = await self.rutas_collection.find_one({
                "codigoRuta": codigo_ruta,
                "resolucionId": resolucion_id,
                "estaActivo": True
            })
            return ruta_existente is not None
        except:
            return False
    
    async def _convertir_fila_a_ruta(self, row: pd.Series) -> Dict[str, Any]:
        """Convertir fila de Excel a datos de ruta con el nuevo formato"""
        
        # Datos básicos en el orden especificado
        ruc = str(row.get('RUC', '')).strip()
        resolucion = str(row.get('Resolución', '')).strip()
        codigo_ruta = str(row.get('Código Ruta', '')).strip()
        origen = str(row.get('Origen', '')).strip()
        destino = str(row.get('Destino', '')).strip()
        itinerario = str(row.get('Itinerario', '')).strip()
        frecuencia = str(row.get('Frecuencia', '')).strip()
        
        # Campos opcionales
        estado = str(row.get('Estado', 'ACTIVA')).strip().upper()
        observaciones = str(row.get('Observaciones', '')).strip() if pd.notna(row.get('Observaciones')) else None
        
        # Normalizar resolución y código de ruta
        resolucion_normalizada = self._normalizar_resolucion(resolucion)
        codigo_normalizado = self._normalizar_codigo_ruta(codigo_ruta)
        
        # Manejar itinerario vacío
        if not itinerario:
            itinerario = "SIN ITINERARIO"
        
        # Verificar si la resolución existe para determinar el estado
        resolucion_existe = True
        if self.db is not None:
            resolucion_doc = await self.resoluciones_collection.find_one({"nroResolucion": resolucion_normalizada})
            resolucion_existe = resolucion_doc is not None
        
        # Si la resolución no existe, forzar estado DADA_DE_BAJA
        if not resolucion_existe and estado == 'ACTIVA':
            estado = 'DADA_DE_BAJA'
            if observaciones:
                observaciones += " | Resolución no encontrada - Requiere revisión"
            else:
                observaciones = "Resolución no encontrada - Requiere revisión"
        
        # Verificar si es una actualización (si ya existe la ruta)
        es_actualizacion = False
        ruta_existente_id = None
        if self.db is not None and resolucion_existe:  # Solo verificar actualizaciones si la resolución existe
            es_actualizacion = await self._existe_codigo_en_resolucion(codigo_normalizado, resolucion_normalizada)
            if es_actualizacion:
                ruta_existente_id = await self._obtener_id_ruta_existente(codigo_normalizado, resolucion_normalizada)
        
        return {
            'ruc': ruc,
            'resolucionNormalizada': resolucion_normalizada,
            'codigoRuta': codigo_normalizado,  # Usar código normalizado
            'origen': origen,
            'destino': destino,
            'itinerario': itinerario,
            'frecuencia': frecuencia,
            'estado': estado,
            'observaciones': observaciones,
            'esActualizacion': es_actualizacion,
            'rutaExistenteId': ruta_existente_id
        }
    
    async def procesar_carga_masiva(self, archivo_excel: BytesIO, ruta_service) -> Dict[str, Any]:
        """Procesar carga masiva de rutas desde Excel con el nuevo formato"""
        
        # Primero validar el archivo
        resultado_validacion = await self.validar_archivo_excel(archivo_excel)
        
        if 'error' in resultado_validacion:
            return resultado_validacion
        
        # Si hay rutas válidas, procesarlas
        rutas_creadas = []
        rutas_actualizadas = []
        errores_creacion = []
        
        for ruta_data in resultado_validacion['rutas_validas']:
            try:
                # Convertir RUC a empresa ID
                ruc = ruta_data.get('ruc')
                empresa = await self.empresas_collection.find_one({"ruc": ruc})
                if not empresa:
                    raise Exception(f"Empresa con RUC {ruc} no encontrada")
                
                empresa_id = str(empresa.get("_id"))
                
                # Convertir resolución normalizada a resolución ID
                resolucion_normalizada = ruta_data.get('resolucionNormalizada')
                resolucion = await self.resoluciones_collection.find_one({"nroResolucion": resolucion_normalizada})
                if not resolucion:
                    raise Exception(f"Resolución {resolucion_normalizada} no encontrada")
                
                resolucion_id = str(resolucion.get("_id"))
                
                # Preparar datos para crear/actualizar la ruta
                ruta_data_dict = {
                    'codigoRuta': ruta_data['codigoRuta'],
                    'nombre': ruta_data.get('itinerario') or f"{ruta_data['origen']} - {ruta_data['destino']}",  # Usar itinerario o generar nombre
                    'empresaId': empresa_id,
                    'resolucionId': resolucion_id,
                    'origenId': ruta_data['origen'],
                    'destinoId': ruta_data['destino'],
                    'tipoRuta': 'INTERPROVINCIAL',  # Por defecto
                    'tipoServicio': 'PASAJEROS',  # Por defecto
                    'frecuencias': ruta_data['frecuencia']
                }
                
                # Agregar campos opcionales si existen
                if ruta_data.get('observaciones'):
                    ruta_data_dict['observaciones'] = ruta_data['observaciones']
                
                # Verificar si es actualización o creación
                if ruta_data.get('esActualizacion') and ruta_data.get('rutaExistenteId'):
                    # ACTUALIZAR ruta existente
                    from app.models.ruta import RutaUpdate
                    ruta_update = RutaUpdate(**ruta_data_dict)
                    
                    ruta_actualizada = await ruta_service.update_ruta(ruta_data['rutaExistenteId'], ruta_update)
                    
                    rutas_actualizadas.append({
                        'codigo_ruta': ruta_actualizada.codigoRuta,
                        'nombre': ruta_actualizada.nombre,
                        'tipo_ruta': ruta_actualizada.tipoRuta,
                        'estado': 'ACTUALIZADA',
                        'id': ruta_actualizada.id
                    })
                else:
                    # CREAR nueva ruta
                    from app.models.ruta import RutaCreate
                    ruta_create = RutaCreate(**ruta_data_dict)
                    
                    ruta_creada = await ruta_service.create_ruta(ruta_create)
                    
                    rutas_creadas.append({
                        'codigo_ruta': ruta_creada.codigoRuta,
                        'nombre': ruta_creada.nombre,
                        'tipo_ruta': ruta_creada.tipoRuta,
                        'estado': 'CREADA',
                        'id': ruta_creada.id
                    })
                
            except Exception as e:
                errores_creacion.append({
                    'codigo_ruta': ruta_data.get('codigoRuta', 'N/A'),
                    'error': str(e)
                })
        
        return {
            **resultado_validacion,
            'rutas_creadas': rutas_creadas,
            'rutas_actualizadas': rutas_actualizadas,
            'errores_creacion': errores_creacion,
            'total_creadas': len(rutas_creadas),
            'total_actualizadas': len(rutas_actualizadas)
        }