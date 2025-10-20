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
from app.services.mock_data import get_mock_resoluciones, get_mock_empresas

class ResolucionExcelService:
    def __init__(self):
        pass
        
    def generar_plantilla_excel(self) -> BytesIO:
        """Generar plantilla Excel para carga masiva de resoluciones"""
        
        # Definir columnas de la plantilla
        columnas = {
            # Datos básicos de la resolución
            'numero_resolucion': 'Número Resolución',
            'empresa_ruc': 'RUC Empresa',
            'fecha_emision': 'Fecha Emisión',
            'fecha_vigencia_inicio': 'Fecha Vigencia Inicio',
            'fecha_vigencia_fin': 'Fecha Vigencia Fin',
            'tipo_resolucion': 'Tipo Resolución',
            'tipo_tramite': 'Tipo Trámite',
            'descripcion': 'Descripción',
            'expediente_id': 'ID Expediente',
            'usuario_emision': 'Usuario Emisión',
            'estado': 'Estado',
            'observaciones': 'Observaciones'
        }
        
        # Crear DataFrame con datos de ejemplo
        datos_ejemplo = {
            'Número Resolución': ['R-1005-2024', 'R-1006-2024'],
            'RUC Empresa': ['20123456789', '20234567890'],
            'Fecha Emisión': ['2024-01-15', '2024-01-20'],
            'Fecha Vigencia Inicio': ['2024-01-15', '2024-01-20'],
            'Fecha Vigencia Fin': ['2029-01-15', '2029-01-20'],
            'Tipo Resolución': ['PADRE', 'PADRE'],
            'Tipo Trámite': ['PRIMIGENIA', 'RENOVACION'],
            'Descripción': ['Autorización para operar rutas interprovinciales', 'Renovación de autorización de transporte'],
            'ID Expediente': ['EXP005', 'EXP006'],
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
        
        buffer.seek(0)
        return buffer
    
    def validar_archivo_excel(self, archivo_excel: BytesIO) -> Dict[str, Any]:
        """Validar archivo Excel de resoluciones"""
        try:
            df = pd.read_excel(archivo_excel)
            
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
                errores_fila, advertencias_fila = self._validar_fila_resolucion(row, fila_num)
                
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
    
    def _validar_fila_resolucion(self, row: pd.Series, fila_num: int) -> Tuple[List[str], List[str]]:
        """Validar una fila de resolución"""
        errores = []
        advertencias = []
        
        # Validar número de resolución (requerido)
        numero_resolucion = str(row.get('Número Resolución', '')).strip() if pd.notna(row.get('Número Resolución')) else ''
        if not numero_resolucion:
            errores.append("Número de resolución es requerido")
        elif not self._validar_formato_resolucion(numero_resolucion):
            errores.append(f"Formato de número de resolución inválido: {numero_resolucion} (debe ser R-XXXX-YYYY)")
        else:
            # Verificar si ya existe
            if self._existe_resolucion(numero_resolucion):
                errores.append(f"Ya existe una resolución con número: {numero_resolucion}")
        
        # Validar RUC empresa (requerido)
        ruc_empresa = str(row.get('RUC Empresa', '')).strip() if pd.notna(row.get('RUC Empresa')) else ''
        if not ruc_empresa:
            errores.append("RUC de empresa es requerido")
        elif not self._validar_formato_ruc(ruc_empresa):
            errores.append(f"RUC debe tener 11 dígitos: {ruc_empresa}")
        else:
            # Verificar si la empresa existe
            if not self._existe_empresa_con_ruc(ruc_empresa):
                advertencias.append(f"No se encontró empresa con RUC: {ruc_empresa}")
        
        # Validar fechas
        fecha_emision = str(row.get('Fecha Emisión', '')).strip() if pd.notna(row.get('Fecha Emisión')) else ''
        if not fecha_emision:
            errores.append("Fecha de emisión es requerida")
        elif not self._validar_formato_fecha(fecha_emision):
            errores.append(f"Formato de fecha de emisión inválido: {fecha_emision} (debe ser YYYY-MM-DD)")
        
        # Validar tipo de resolución
        tipo_resolucion = str(row.get('Tipo Resolución', '')).strip().upper() if pd.notna(row.get('Tipo Resolución')) else ''
        if tipo_resolucion and tipo_resolucion not in [e.value for e in TipoResolucion]:
            errores.append(f"Tipo de resolución inválido: {tipo_resolucion}. Valores válidos: {', '.join([e.value for e in TipoResolucion])}")
        
        # Validar tipo de trámite
        tipo_tramite = str(row.get('Tipo Trámite', '')).strip().upper() if pd.notna(row.get('Tipo Trámite')) else ''
        if tipo_tramite and tipo_tramite not in [e.value for e in TipoTramite]:
            errores.append(f"Tipo de trámite inválido: {tipo_tramite}. Valores válidos: {', '.join([e.value for e in TipoTramite])}")
        
        # Validar estado
        estado = str(row.get('Estado', '')).strip().upper() if pd.notna(row.get('Estado')) else 'VIGENTE'
        if estado and estado not in [e.value for e in EstadoResolucion]:
            errores.append(f"Estado inválido: {estado}. Valores válidos: {', '.join([e.value for e in EstadoResolucion])}")
        
        # Validar descripción (requerida)
        descripcion = str(row.get('Descripción', '')).strip() if pd.notna(row.get('Descripción')) else ''
        if not descripcion:
            errores.append("Descripción es requerida")
        elif len(descripcion) < 10:
            errores.append("Descripción debe tener al menos 10 caracteres")
        
        # Validar ID expediente (requerido)
        expediente_id = str(row.get('ID Expediente', '')).strip() if pd.notna(row.get('ID Expediente')) else ''
        if not expediente_id:
            errores.append("ID de expediente es requerido")
        
        return errores, advertencias
    
    def _validar_formato_resolucion(self, numero: str) -> bool:
        """Validar formato de resolución R-1234-2025"""
        patron = r'^R-\d{4}-\d{4}$'
        return bool(re.match(patron, numero.upper()))
    
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
    
    def _existe_resolucion(self, numero: str) -> bool:
        """Verificar si existe resolución con el número dado"""
        resoluciones_mock = get_mock_resoluciones()
        return any(res.nroResolucion.upper() == numero.upper() for res in resoluciones_mock)
    
    def _existe_empresa_con_ruc(self, ruc: str) -> bool:
        """Verificar si existe empresa con el RUC dado"""
        empresas_mock = get_mock_empresas()
        return any(emp.ruc == ruc for emp in empresas_mock)
    
    def _convertir_fila_a_resolucion(self, row: pd.Series) -> Dict[str, Any]:
        """Convertir fila de Excel a datos de resolución"""
        
        # Datos básicos
        numero_resolucion = str(row.get('Número Resolución', '')).strip().upper()
        ruc_empresa = str(row.get('RUC Empresa', '')).strip()
        
        # Fechas
        fecha_emision = str(row.get('Fecha Emisión', '')).strip()
        fecha_vigencia_inicio = str(row.get('Fecha Vigencia Inicio', '')).strip() if pd.notna(row.get('Fecha Vigencia Inicio')) else None
        fecha_vigencia_fin = str(row.get('Fecha Vigencia Fin', '')).strip() if pd.notna(row.get('Fecha Vigencia Fin')) else None
        
        # Tipos y estado
        tipo_resolucion = str(row.get('Tipo Resolución', 'PADRE')).strip().upper()
        tipo_tramite = str(row.get('Tipo Trámite', 'PRIMIGENIA')).strip().upper()
        estado = str(row.get('Estado', 'VIGENTE')).strip().upper()
        
        # Otros campos
        descripcion = str(row.get('Descripción', '')).strip()
        expediente_id = str(row.get('ID Expediente', '')).strip()
        usuario_emision = str(row.get('Usuario Emisión', 'USR001')).strip()
        observaciones = str(row.get('Observaciones', '')).strip() if pd.notna(row.get('Observaciones')) else None
        
        return {
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
    
    def procesar_carga_masiva(self, archivo_excel: BytesIO) -> Dict[str, Any]:
        """Procesar carga masiva de resoluciones desde Excel"""
        
        # Primero validar el archivo
        resultado_validacion = self.validar_archivo_excel(archivo_excel)
        
        if 'error' in resultado_validacion:
            return resultado_validacion
        
        # Si hay resoluciones válidas, procesarlas
        resoluciones_creadas = []
        errores_creacion = []
        
        for resolucion_data in resultado_validacion['resoluciones_validas']:
            try:
                # Aquí iría la lógica para crear la resolución en la base de datos
                # Por ahora simulamos la creación
                resolucion_creada = {
                    'numero_resolucion': resolucion_data['nroResolucion'],
                    'empresa_ruc': resolucion_data['empresaRuc'],
                    'tipo_tramite': resolucion_data['tipoTramite'],
                    'estado': 'CREADA'
                }
                resoluciones_creadas.append(resolucion_creada)
                
            except Exception as e:
                errores_creacion.append({
                    'numero_resolucion': resolucion_data['nroResolucion'],
                    'error': str(e)
                })
        
        return {
            **resultado_validacion,
            'resoluciones_creadas': resoluciones_creadas,
            'errores_creacion': errores_creacion,
            'total_creadas': len(resoluciones_creadas)
        }