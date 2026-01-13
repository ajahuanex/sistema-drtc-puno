"""
Servicio para carga masiva de resoluciones desde archivos Excel
"""
import pandas as pd
import re
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from io import BytesIO
from app.models.resolucion import (
    ResolucionCreate, 
    TipoResolucion, 
    TipoTramite, 
    EstadoResolucion
)
from app.dependencies.db import get_database

class ResolucionExcelService:
    def __init__(self):
        self.db = None
        
    async def _get_database(self):
        """Obtener conexión a la base de datos"""
        if not self.db:
            self.db = await get_database()
        return self.db
        
    def generar_plantilla_excel(self) -> BytesIO:
        """Generar plantilla Excel para carga masiva de resoluciones"""
        
        # Crear DataFrame con datos de ejemplo actualizados
        datos_ejemplo = {
            'Resolución Padre': ['', 'R-1005-2024'],  # Nueva columna al inicio
            'Número Resolución': ['1005-2024', '1006-2024'],  # Sin R- en plantilla
            'RUC Empresa': ['20123456789', '20234567890'],
            'Fecha Emisión': ['15/01/2024', '20/01/2024'],  # Formato español dd/mm/yyyy
            'Fecha Vigencia Inicio': ['15/01/2024', ''],  # Solo para resoluciones padre
            'Fecha Vigencia Fin': ['15/01/2029', ''],  # Solo para resoluciones padre
            'Tipo Resolución': ['PADRE', 'HIJO'],
            'Tipo Trámite': ['PRIMIGENIA', 'RENOVACION'],
            'Descripción': ['Autorización para operar rutas interprovinciales', 'Renovación de autorización de transporte'],
            'ID Expediente': ['123-2024', '456-2024-E'],  # Formatos flexibles, opcional
            'Usuario Emisión': ['USR001', 'USR001'],
            'Estado': ['VIGENTE', 'VIGENTE'],
            'Observaciones': ['Resolución emitida según normativa vigente', 'Renovación por 5 años adicionales']
        }
        
        df = pd.DataFrame(datos_ejemplo)
        
        # Crear archivo Excel en memoria
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Resoluciones', index=False)
            
            # Obtener el workbook y worksheet para formatear
            workbook = writer.book
            worksheet = writer.sheets['Resoluciones']
            
            # Ajustar ancho de columnas
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
                
            # Agregar comentarios explicativos usando openpyxl
            from openpyxl.comments import Comment
            
            worksheet['A1'].comment = Comment("Número de resolución padre (solo para resoluciones hijas). Dejar vacío para resoluciones padre.", "Sistema")
            worksheet['B1'].comment = Comment("Número sin prefijo R-. Ejemplo: 1005-2024 (el sistema agregará R-)", "Sistema")
            worksheet['D1'].comment = Comment("Formato: dd/mm/yyyy. Ejemplo: 15/01/2024", "Sistema")
            worksheet['E1'].comment = Comment("Solo para resoluciones PADRE. Dejar vacío para resoluciones HIJO.", "Sistema")
            worksheet['F1'].comment = Comment("Solo para resoluciones PADRE. Dejar vacío para resoluciones HIJO.", "Sistema")
            worksheet['J1'].comment = Comment("OPCIONAL. Formatos aceptados: 123-2024, E-123-2024, 123-2024-E (se convertirá a E-0123-2024)", "Sistema")
        
        buffer.seek(0)
        return buffer
    
    async def validar_archivo_excel(self, archivo_excel: BytesIO) -> Dict[str, Any]:
        """Validar archivo Excel de resoluciones"""
        try:
            # Leer Excel manteniendo las fechas como texto para evitar conversión automática
            df = pd.read_excel(archivo_excel, dtype=str, keep_default_na=False)
            
            # Reemplazar valores NaN y vacíos con cadenas vacías
            df = df.fillna('')
            
            resultados = {
                'total_filas': len(df),
                'validos': 0,
                'invalidos': 0,
                'con_advertencias': 0,
                'errores': [],
                'advertencias': [],
                'resoluciones_validas': []
            }
            
            for index, row in df.iterrows():
                fila_num = index + 2  # +2 porque Excel empieza en 1 y tiene header
                errores_fila = []
                advertencias_fila = []
                
                # Validar fila
                errores_fila, advertencias_fila = await self._validar_fila_resolucion(row, fila_num)
                
                if errores_fila:
                    resultados['invalidos'] += 1
                    numero_resolucion = str(row.get('Número Resolución', 'N/A')).strip()
                    resultados['errores'].append({
                        'fila': fila_num,
                        'numero_resolucion': numero_resolucion,
                        'errores': errores_fila
                    })
                else:
                    if advertencias_fila:
                        resultados['con_advertencias'] += 1
                        numero_resolucion = str(row.get('Número Resolución', 'N/A')).strip()
                        resultados['advertencias'].append({
                            'fila': fila_num,
                            'numero_resolucion': numero_resolucion,
                            'advertencias': advertencias_fila
                        })
                    
                    resultados['validos'] += 1
                    # Convertir fila a modelo de resolución
                    try:
                        resolucion = self._convertir_fila_a_resolucion(row)
                        resultados['resoluciones_validas'].append(resolucion)
                    except Exception as e:
                        resultados['validos'] -= 1
                        resultados['invalidos'] += 1
                        numero_resolucion = str(row.get('Número Resolución', 'N/A')).strip()
                        resultados['errores'].append({
                            'fila': fila_num,
                            'numero_resolucion': numero_resolucion,
                            'errores': [f"Error al procesar resolución: {str(e)}"]
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
                'resoluciones_validas': []
            }
    
    async def _validar_fila_resolucion(self, row: pd.Series, fila_num: int) -> Tuple[List[str], List[str]]:
        """Validar una fila de resolución"""
        errores = []
        advertencias = []
        
        # Validar resolución padre (opcional)
        resolucion_padre = str(row.get('Resolución Padre', '')).strip() if row.get('Resolución Padre') and str(row.get('Resolución Padre')).strip() else ''
        if resolucion_padre:
            # Normalizar formato de resolución padre
            resolucion_padre_normalizada = self._normalizar_numero_resolucion(resolucion_padre)
            if not self._validar_formato_resolucion_normalizada(resolucion_padre_normalizada):
                errores.append(f"Formato de resolución padre inválido: {resolucion_padre}")
            else:
                # Verificar que la resolución padre existe
                if not await self._existe_resolucion(resolucion_padre_normalizada):
                    errores.append(f"La resolución padre {resolucion_padre_normalizada} no existe")
        
        # Validar número de resolución (requerido)
        numero_resolucion = str(row.get('Número Resolución', '')).strip() if row.get('Número Resolución') and str(row.get('Número Resolución')).strip() else ''
        if not numero_resolucion:
            errores.append("Número de resolución es requerido")
        else:
            # Normalizar formato (agregar R- si no lo tiene)
            numero_normalizado = self._normalizar_numero_resolucion(numero_resolucion)
            if not self._validar_formato_resolucion_normalizada(numero_normalizado):
                errores.append(f"Formato de número de resolución inválido: {numero_resolucion} (debe ser XXXX-YYYY)")
            else:
                # Solo advertir si ya existe, no marcar como error (se puede actualizar)
                if await self._existe_resolucion(numero_normalizado):
                    advertencias.append(f"La resolución {numero_normalizado} ya existe y será actualizada")
        
        # Validar tipo de resolución y lógica de resolución padre
        tipo_resolucion = str(row.get('Tipo Resolución', '')).strip().upper() if row.get('Tipo Resolución') and str(row.get('Tipo Resolución')).strip() else ''
        if tipo_resolucion:
            if tipo_resolucion not in [e.value for e in TipoResolucion]:
                errores.append(f"Tipo de resolución inválido: {tipo_resolucion}. Valores válidos: {', '.join([e.value for e in TipoResolucion])}")
            else:
                # Validar lógica de resolución padre/hijo
                if tipo_resolucion == 'HIJO' and not resolucion_padre:
                    errores.append("Las resoluciones HIJO deben tener una resolución padre")
                elif tipo_resolucion == 'PADRE' and resolucion_padre:
                    advertencias.append("Las resoluciones PADRE no deberían tener resolución padre")
        
        # Validar fechas de vigencia según tipo de resolución
        fecha_vigencia_inicio = str(row.get('Fecha Vigencia Inicio', '')).strip() if row.get('Fecha Vigencia Inicio') and str(row.get('Fecha Vigencia Inicio')).strip() else ''
        fecha_vigencia_fin = str(row.get('Fecha Vigencia Fin', '')).strip() if row.get('Fecha Vigencia Fin') and str(row.get('Fecha Vigencia Fin')).strip() else ''
        
        if tipo_resolucion == 'PADRE':
            # Las resoluciones padre deben tener fechas de vigencia
            if not fecha_vigencia_inicio:
                errores.append("Las resoluciones PADRE deben tener fecha de vigencia inicio")
            elif not self._validar_formato_fecha_espanol(fecha_vigencia_inicio):
                errores.append(f"Formato de fecha de vigencia inicio inválido: {fecha_vigencia_inicio} (formatos aceptados: dd/mm/yyyy, yyyy-mm-dd, dd-mm-yyyy)")
                
            if not fecha_vigencia_fin:
                errores.append("Las resoluciones PADRE deben tener fecha de vigencia fin")
            elif not self._validar_formato_fecha_espanol(fecha_vigencia_fin):
                errores.append(f"Formato de fecha de vigencia fin inválido: {fecha_vigencia_fin} (formatos aceptados: dd/mm/yyyy, yyyy-mm-dd, dd-mm-yyyy)")
        elif tipo_resolucion == 'HIJO':
            # Las resoluciones hijo no deben tener fechas de vigencia
            if fecha_vigencia_inicio:
                advertencias.append("Las resoluciones HIJO no necesitan fecha de vigencia inicio (se hereda del padre)")
            if fecha_vigencia_fin:
                advertencias.append("Las resoluciones HIJO no necesitan fecha de vigencia fin (se hereda del padre)")
        
        # Validar RUC empresa (requerido)
        ruc_empresa = str(row.get('RUC Empresa', '')).strip() if row.get('RUC Empresa') and str(row.get('RUC Empresa')).strip() else ''
        if not ruc_empresa:
            errores.append("RUC de empresa es requerido")
        elif not self._validar_formato_ruc(ruc_empresa):
            errores.append(f"RUC debe tener 11 dígitos: {ruc_empresa}")
        else:
            # Verificar si la empresa existe
            if not await self._existe_empresa_con_ruc(ruc_empresa):
                errores.append(f"No se encontró empresa con RUC: {ruc_empresa}")
        
        # Validar fecha de emisión (requerida para todas las resoluciones)
        fecha_emision = str(row.get('Fecha Emisión', '')).strip() if row.get('Fecha Emisión') and str(row.get('Fecha Emisión')).strip() else ''
        if not fecha_emision:
            errores.append("Fecha de emisión es requerida")
        elif not self._validar_formato_fecha_espanol(fecha_emision):
            errores.append(f"Formato de fecha de emisión inválido: {fecha_emision} (formatos aceptados: dd/mm/yyyy, yyyy-mm-dd, dd-mm-yyyy)")
        
        # Validar tipo de trámite
        tipo_tramite = str(row.get('Tipo Trámite', '')).strip().upper() if row.get('Tipo Trámite') and str(row.get('Tipo Trámite')).strip() else ''
        if tipo_tramite and tipo_tramite not in [e.value for e in TipoTramite]:
            errores.append(f"Tipo de trámite inválido: {tipo_tramite}. Valores válidos: {', '.join([e.value for e in TipoTramite])}")
        
        # Validar estado
        estado = str(row.get('Estado', '')).strip().upper() if row.get('Estado') and str(row.get('Estado')).strip() else 'VIGENTE'
        if estado and estado not in [e.value for e in EstadoResolucion]:
            errores.append(f"Estado inválido: {estado}. Valores válidos: {', '.join([e.value for e in EstadoResolucion])}")
        
        # Validar descripción (requerida)
        descripcion = str(row.get('Descripción', '')).strip() if row.get('Descripción') and str(row.get('Descripción')).strip() else ''
        if not descripcion:
            errores.append("Descripción es requerida")
        elif len(descripcion) < 10:
            errores.append("Descripción debe tener al menos 10 caracteres")
        
        # Validar ID expediente (OPCIONAL)
        expediente_id = str(row.get('ID Expediente', '')).strip() if row.get('ID Expediente') and str(row.get('ID Expediente')).strip() else ''
        if expediente_id:
            # Normalizar formato de expediente
            expediente_normalizado = self._normalizar_numero_expediente(expediente_id)
            if not self._validar_formato_expediente_normalizado(expediente_normalizado):
                errores.append(f"Formato de expediente inválido: {expediente_id}")
        
        return errores, advertencias
    
    def _normalizar_numero_resolucion(self, numero: str) -> str:
        """Normalizar número de resolución agregando R- si no lo tiene"""
        numero = numero.strip().upper()
        if not numero.startswith('R-'):
            numero = f"R-{numero}"
        return numero
    
    def _normalizar_numero_expediente(self, expediente: str) -> str:
        """Normalizar número de expediente a formato E-XXXX-YYYY"""
        expediente = expediente.strip().upper()
        
        # Remover prefijos y sufijos existentes
        expediente = expediente.replace('E-', '').replace('-E', '')
        
        # Extraer números y año
        partes = expediente.split('-')
        if len(partes) >= 2:
            numero = partes[0].zfill(4)  # Rellenar con ceros a la izquierda
            año = partes[1]
            return f"E-{numero}-{año}"
        else:
            # Si no tiene el formato esperado, intentar extraer números
            import re
            numeros = re.findall(r'\d+', expediente)
            if len(numeros) >= 2:
                numero = numeros[0].zfill(4)
                año = numeros[1]
                return f"E-{numero}-{año}"
        
        return expediente  # Retornar original si no se puede normalizar
    
    def _validar_formato_resolucion_normalizada(self, numero: str) -> bool:
        """Validar formato de resolución normalizada R-XXXX-YYYY"""
        patron = r'^R-\d{4}-\d{4}$'
        return bool(re.match(patron, numero.upper()))
    
    def _validar_formato_expediente_normalizado(self, expediente: str) -> bool:
        """Validar formato de expediente normalizado E-XXXX-YYYY"""
        patron = r'^E-\d{4}-\d{4}$'
        return bool(re.match(patron, expediente.upper()))
    
    def _validar_y_normalizar_fecha(self, fecha: str) -> Tuple[bool, str]:
        """
        Validar y normalizar fecha desde múltiples formatos a formato ISO yyyy-mm-dd
        Formatos soportados:
        - dd/mm/yyyy (español)
        - yyyy-mm-dd (ISO)
        - dd-mm-yyyy
        - mm/dd/yyyy (americano)
        - Con timestamps: yyyy-mm-dd hh:mm:ss
        """
        if not fecha or not fecha.strip():
            return False, ""
            
        fecha = fecha.strip()
        
        # Si tiene timestamp, extraer solo la fecha
        if ' ' in fecha:
            fecha = fecha.split(' ')[0]
        
        # Lista de formatos a probar en orden de prioridad
        formatos = [
            '%d/%m/%Y',    # dd/mm/yyyy (español - preferido)
            '%Y-%m-%d',    # yyyy-mm-dd (ISO)
            '%d-%m-%Y',    # dd-mm-yyyy
            '%m/%d/%Y',    # mm/dd/yyyy (americano)
            '%Y/%m/%d',    # yyyy/mm/dd
            '%d.%m.%Y',    # dd.mm.yyyy
        ]
        
        for formato in formatos:
            try:
                fecha_obj = datetime.strptime(fecha, formato)
                # Validar que la fecha sea razonable (entre 1900 y 2100)
                if 1900 <= fecha_obj.year <= 2100:
                    return True, fecha_obj.strftime('%Y-%m-%d')
            except ValueError:
                continue
        
        return False, fecha
    
    def _validar_formato_fecha_espanol(self, fecha: str) -> bool:
        """Validar formato de fecha (múltiples formatos soportados)"""
        valida, _ = self._validar_y_normalizar_fecha(fecha)
        return valida
    
    def _convertir_fecha_espanol_a_iso(self, fecha_espanol: str) -> str:
        """Convertir fecha de múltiples formatos a ISO yyyy-mm-dd"""
        valida, fecha_normalizada = self._validar_y_normalizar_fecha(fecha_espanol)
        return fecha_normalizada if valida else fecha_espanol
    
    def _validar_formato_ruc(self, ruc: str) -> bool:
        """Validar formato de RUC: 11 dígitos"""
        return ruc.isdigit() and len(ruc) == 11
    
    def _validar_formato_fecha(self, fecha: str) -> bool:
        """Validar formato de fecha YYYY-MM-DD"""
        try:
            datetime.strptime(fecha, '%Y-%m-%d')
            return True
        except ValueError:
            return False
    
    async def _existe_resolucion(self, numero: str) -> bool:
        """Verificar si existe resolución con el número dado en la base de datos"""
        try:
            db = await self._get_database()
            resoluciones_collection = db["resoluciones"]
            
            # Buscar resolución por número
            resolucion = await resoluciones_collection.find_one({
                "nroResolucion": numero.upper(),
                "estaActivo": True
            })
            
            return resolucion is not None
            
        except Exception as e:
            print(f"Error verificando existencia de resolución {numero}: {e}")
            return False
    
    async def _existe_empresa_con_ruc(self, ruc: str) -> bool:
        """Verificar si existe empresa con el RUC dado en la base de datos"""
        try:
            db = await self._get_database()
            empresas_collection = db["empresas"]
            
            # Buscar empresa por RUC
            empresa = await empresas_collection.find_one({
                "ruc": ruc,
                "estaActivo": True
            })
            
            return empresa is not None
            
        except Exception as e:
            print(f"Error verificando existencia de empresa con RUC {ruc}: {e}")
            return False
    
    def _convertir_fila_a_resolucion(self, row: pd.Series) -> Dict[str, Any]:
        """Convertir fila de Excel a datos de resolución"""
        
        # Resolución padre (opcional)
        resolucion_padre = str(row.get('Resolución Padre', '')).strip() if row.get('Resolución Padre') and str(row.get('Resolución Padre')).strip() else None
        if resolucion_padre:
            resolucion_padre = self._normalizar_numero_resolucion(resolucion_padre)
        
        # Datos básicos
        numero_resolucion = str(row.get('Número Resolución', '')).strip()
        numero_resolucion = self._normalizar_numero_resolucion(numero_resolucion)
        ruc_empresa = str(row.get('RUC Empresa', '')).strip()
        
        # Fechas - convertir de formato español a ISO
        fecha_emision = str(row.get('Fecha Emisión', '')).strip()
        if fecha_emision:
            valida, fecha_normalizada = self._validar_y_normalizar_fecha(fecha_emision)
            fecha_emision = fecha_normalizada if valida else fecha_emision
        
        # Fechas de vigencia (solo para resoluciones padre)
        tipo_resolucion = str(row.get('Tipo Resolución', 'PADRE')).strip().upper()
        fecha_vigencia_inicio = None
        fecha_vigencia_fin = None
        
        if tipo_resolucion == 'PADRE':
            fecha_vigencia_inicio_str = str(row.get('Fecha Vigencia Inicio', '')).strip() if row.get('Fecha Vigencia Inicio') and str(row.get('Fecha Vigencia Inicio')).strip() else ''
            fecha_vigencia_fin_str = str(row.get('Fecha Vigencia Fin', '')).strip() if row.get('Fecha Vigencia Fin') and str(row.get('Fecha Vigencia Fin')).strip() else ''
            
            if fecha_vigencia_inicio_str:
                valida, fecha_normalizada = self._validar_y_normalizar_fecha(fecha_vigencia_inicio_str)
                fecha_vigencia_inicio = fecha_normalizada if valida else fecha_vigencia_inicio_str
            if fecha_vigencia_fin_str:
                valida, fecha_normalizada = self._validar_y_normalizar_fecha(fecha_vigencia_fin_str)
                fecha_vigencia_fin = fecha_normalizada if valida else fecha_vigencia_fin_str
        
        # Otros campos
        tipo_tramite = str(row.get('Tipo Trámite', 'PRIMIGENIA')).strip().upper()
        estado = str(row.get('Estado', 'VIGENTE')).strip().upper()
        descripcion = str(row.get('Descripción', '')).strip()
        usuario_emision = str(row.get('Usuario Emisión', 'USR001')).strip()
        observaciones = str(row.get('Observaciones', '')).strip() if row.get('Observaciones') and str(row.get('Observaciones')).strip() else None
        
        # Expediente (opcional) - normalizar si existe
        expediente_id = str(row.get('ID Expediente', '')).strip() if row.get('ID Expediente') and str(row.get('ID Expediente')).strip() else ''
        if expediente_id:
            expediente_id = self._normalizar_numero_expediente(expediente_id)
        else:
            expediente_id = None
        
        return {
            'resolucionPadreId': resolucion_padre,
            'nroResolucion': numero_resolucion,
            'empresaRuc': ruc_empresa,
            'fechaEmision': fecha_emision,
            'fechaVigenciaInicio': fecha_vigencia_inicio,
            'fechaVigenciaFin': fecha_vigencia_fin,
            'tipoResolucion': tipo_resolucion,
            'tipoTramite': tipo_tramite,
            'descripcion': descripcion,
            'expedienteId': expediente_id,
            'usuarioEmisionId': usuario_emision,
            'estado': estado,
            'observaciones': observaciones
        }
    
    async def procesar_carga_masiva(self, archivo_excel: BytesIO) -> Dict[str, Any]:
        """Procesar carga masiva de resoluciones desde Excel"""
        
        # Primero validar el archivo
        resultado_validacion = await self.validar_archivo_excel(archivo_excel)
        
        if 'error' in resultado_validacion:
            return resultado_validacion
        
        # Si hay resoluciones válidas, procesarlas
        resoluciones_creadas = []
        resoluciones_actualizadas = []
        errores_creacion = []
        
        for resolucion_data in resultado_validacion['resoluciones_validas']:
            try:
                # Verificar si la resolución ya existe
                existe = await self._existe_resolucion(resolucion_data['nroResolucion'])
                
                # Obtener datos de la empresa
                empresa_info = await self._obtener_info_empresa(resolucion_data['empresaRuc'])
                
                if existe:
                    # Actualizar resolución existente
                    resolucion_actualizada = {
                        'numero_resolucion': resolucion_data['nroResolucion'],
                        'empresa_ruc': resolucion_data['empresaRuc'],
                        'empresa_razon_social': empresa_info.get('razon_social', f"Empresa con RUC {resolucion_data['empresaRuc']}"),
                        'tipo_resolucion': resolucion_data['tipoResolucion'],
                        'estado': 'ACTUALIZADA',
                        'accion': 'ACTUALIZADA'
                    }
                    resoluciones_actualizadas.append(resolucion_actualizada)
                else:
                    # Crear nueva resolución
                    resolucion_creada = {
                        'numero_resolucion': resolucion_data['nroResolucion'],
                        'empresa_ruc': resolucion_data['empresaRuc'],
                        'empresa_razon_social': empresa_info.get('razon_social', f"Empresa con RUC {resolucion_data['empresaRuc']}"),
                        'tipo_resolucion': resolucion_data['tipoResolucion'],
                        'estado': 'CREADA',
                        'accion': 'CREADA'
                    }
                    resoluciones_creadas.append(resolucion_creada)
                
            except Exception as e:
                errores_creacion.append({
                    'numero_resolucion': resolucion_data['nroResolucion'],
                    'error': str(e)
                })
        
        # Combinar resoluciones creadas y actualizadas para el resultado
        todas_resoluciones = resoluciones_creadas + resoluciones_actualizadas
        
        return {
            **resultado_validacion,
            'resoluciones_creadas': todas_resoluciones,  # Incluye creadas y actualizadas
            'resoluciones_nuevas': resoluciones_creadas,
            'resoluciones_actualizadas': resoluciones_actualizadas,
            'errores_creacion': errores_creacion,
            'total_creadas': len(resoluciones_creadas),
            'total_actualizadas': len(resoluciones_actualizadas),
            'total_procesadas': len(todas_resoluciones)
        }
    
    async def _obtener_info_empresa(self, ruc: str) -> Dict[str, Any]:
        """Obtener información de la empresa por RUC"""
        try:
            db = await self._get_database()
            empresas_collection = db["empresas"]
            
            empresa = await empresas_collection.find_one({
                "ruc": ruc,
                "estaActivo": True
            })
            
            if empresa:
                return {
                    'id': str(empresa.get('_id')),
                    'razon_social': empresa.get('razonSocial', {}).get('principal', f'Empresa {ruc}'),
                    'ruc': empresa.get('ruc')
                }
            else:
                return {
                    'id': None,
                    'razon_social': f'Empresa con RUC {ruc}',
                    'ruc': ruc
                }
                
        except Exception as e:
            print(f"Error obteniendo info de empresa {ruc}: {e}")
            return {
                'id': None,
                'razon_social': f'Empresa con RUC {ruc}',
                'ruc': ruc
            }