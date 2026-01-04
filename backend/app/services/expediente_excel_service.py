"""
Servicio para carga masiva de expedientes desde archivos Excel
"""
import pandas as pd
import re
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from io import BytesIO
from app.models.expediente import (
    ExpedienteCreate, 
    EstadoExpediente, 
    TipoTramite, 
    PrioridadExpediente
)
# from app.services.mock_data import get_mock_empresas  # COMENTADO: mock eliminado

class ExpedienteExcelService:
    def __init__(self):
        pass
        
    def generar_plantilla_excel(self) -> BytesIO:
        """Generar plantilla Excel para carga masiva de expedientes"""
        
        # Crear DataFrame con datos de ejemplo
        datos_ejemplo = {
            'Número Expediente': ['EXP007', 'EXP008'],
            'RUC Empresa': ['20123456789', '20234567890'],
            'Tipo Trámite': ['AUTORIZACION_NUEVA', 'RENOVACION'],
            'Descripción': ['Solicitud de autorización para nueva ruta interprovincial', 'Renovación de autorización de transporte'],
            'Prioridad': ['MEDIA', 'ALTA'],
            'Estado': ['EN_PROCESO', 'EN_REVISION'],
            'Fecha Ingreso': ['2024-01-15', '2024-01-20'],
            'Fecha Límite': ['2024-02-15', '2024-02-20'],
            'Solicitante Nombre': ['JUAN PÉREZ MAMANI', 'MARÍA RODRÍGUEZ LÓPEZ'],
            'Solicitante DNI': ['12345678', '87654321'],
            'Solicitante Email': ['juan.perez@empresa.com', 'maria.rodriguez@empresa.com'],
            'Solicitante Teléfono': ['951234567', '987654321'],
            'Observaciones': ['Expediente completo con toda la documentación', 'Requiere revisión adicional de documentos']
        }
        
        df = pd.DataFrame(datos_ejemplo)
        
        # Crear archivo Excel en memoria
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Expedientes', index=False)
            
            # Obtener el workbook y worksheet para formatear
            workbook = writer.book
            worksheet = writer.sheets['Expedientes']
            
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
        """Validar archivo Excel de expedientes"""
        try:
            df = pd.read_excel(archivo_excel)
            
            resultados = {
                'total_filas': len(df),
                'validos': 0,
                'invalidos': 0,
                'con_advertencias': 0,
                'errores': [],
                'advertencias': [],
                'expedientes_validos': []
            }
            
            for index, row in df.iterrows():
                fila_num = index + 2  # +2 porque Excel empieza en 1 y tiene header
                errores_fila = []
                advertencias_fila = []
                
                # Validar fila
                errores_fila, advertencias_fila = self._validar_fila_expediente(row, fila_num)
                
                if errores_fila:
                    resultados['invalidos'] += 1
                    numero_expediente = str(row.get('Número Expediente', 'N/A')).strip()
                    resultados['errores'].append({
                        'fila': fila_num,
                        'numero_expediente': numero_expediente,
                        'errores': errores_fila
                    })
                else:
                    if advertencias_fila:
                        resultados['con_advertencias'] += 1
                        numero_expediente = str(row.get('Número Expediente', 'N/A')).strip()
                        resultados['advertencias'].append({
                            'fila': fila_num,
                            'numero_expediente': numero_expediente,
                            'advertencias': advertencias_fila
                        })
                    
                    resultados['validos'] += 1
                    # Convertir fila a modelo de expediente
                    try:
                        expediente = self._convertir_fila_a_expediente(row)
                        resultados['expedientes_validos'].append(expediente)
                    except Exception as e:
                        resultados['validos'] -= 1
                        resultados['invalidos'] += 1
                        numero_expediente = str(row.get('Número Expediente', 'N/A')).strip()
                        resultados['errores'].append({
                            'fila': fila_num,
                            'numero_expediente': numero_expediente,
                            'errores': [f"Error al procesar expediente: {str(e)}"]
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
                'expedientes_validos': []
            }
    
    def _validar_fila_expediente(self, row: pd.Series, fila_num: int) -> Tuple[List[str], List[str]]:
        """Validar una fila de expediente"""
        errores = []
        advertencias = []
        
        # Validar número de expediente (requerido)
        numero_expediente = str(row.get('Número Expediente', '')).strip() if pd.notna(row.get('Número Expediente')) else ''
        if not numero_expediente:
            errores.append("Número de expediente es requerido")
        elif not self._validar_formato_expediente(numero_expediente):
            errores.append(f"Formato de número de expediente inválido: {numero_expediente} (debe ser EXP seguido de números)")
        
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
        
        # Validar tipo de trámite
        tipo_tramite = str(row.get('Tipo Trámite', '')).strip().upper() if pd.notna(row.get('Tipo Trámite')) else ''
        if not tipo_tramite:
            errores.append("Tipo de trámite es requerido")
        elif tipo_tramite not in [e.value for e in TipoTramite]:
            errores.append(f"Tipo de trámite inválido: {tipo_tramite}. Valores válidos: {', '.join([e.value for e in TipoTramite])}")
        
        # Validar descripción (requerida)
        descripcion = str(row.get('Descripción', '')).strip() if pd.notna(row.get('Descripción')) else ''
        if not descripcion:
            errores.append("Descripción es requerida")
        elif len(descripcion) < 10:
            errores.append("Descripción debe tener al menos 10 caracteres")
        
        # Validar prioridad
        prioridad = str(row.get('Prioridad', '')).strip().upper() if pd.notna(row.get('Prioridad')) else 'MEDIA'
        if prioridad and prioridad not in [e.value for e in PrioridadExpediente]:
            errores.append(f"Prioridad inválida: {prioridad}. Valores válidos: {', '.join([e.value for e in PrioridadExpediente])}")
        
        # Validar estado
        estado = str(row.get('Estado', '')).strip().upper() if pd.notna(row.get('Estado')) else 'EN_PROCESO'
        if estado and estado not in [e.value for e in EstadoExpediente]:
            errores.append(f"Estado inválido: {estado}. Valores válidos: {', '.join([e.value for e in EstadoExpediente])}")
        
        # Validar fechas
        fecha_ingreso = str(row.get('Fecha Ingreso', '')).strip() if pd.notna(row.get('Fecha Ingreso')) else ''
        if not fecha_ingreso:
            errores.append("Fecha de ingreso es requerida")
        elif not self._validar_formato_fecha(fecha_ingreso):
            errores.append(f"Formato de fecha de ingreso inválido: {fecha_ingreso} (debe ser YYYY-MM-DD)")
        
        fecha_limite = str(row.get('Fecha Límite', '')).strip() if pd.notna(row.get('Fecha Límite')) else None
        if fecha_limite and not self._validar_formato_fecha(fecha_limite):
            errores.append(f"Formato de fecha límite inválido: {fecha_limite} (debe ser YYYY-MM-DD)")
        
        # Validar datos del solicitante
        solicitante_nombre = str(row.get('Solicitante Nombre', '')).strip() if pd.notna(row.get('Solicitante Nombre')) else ''
        if not solicitante_nombre:
            errores.append("Nombre del solicitante es requerido")
        elif len(solicitante_nombre) < 3:
            errores.append("Nombre del solicitante debe tener al menos 3 caracteres")
        
        solicitante_dni = str(row.get('Solicitante DNI', '')).strip() if pd.notna(row.get('Solicitante DNI')) else ''
        if not solicitante_dni:
            errores.append("DNI del solicitante es requerido")
        elif not self._validar_formato_dni(solicitante_dni):
            errores.append(f"DNI debe tener 8 dígitos: {solicitante_dni}")
        
        # Validar email del solicitante (opcional pero formato válido si se proporciona)
        solicitante_email = str(row.get('Solicitante Email', '')).strip() if pd.notna(row.get('Solicitante Email')) else None
        if solicitante_email and not self._validar_formato_email(solicitante_email):
            errores.append(f"Formato de email del solicitante inválido: {solicitante_email}")
        
        # Validar teléfono del solicitante (opcional pero formato válido si se proporciona)
        solicitante_telefono = str(row.get('Solicitante Teléfono', '')).strip() if pd.notna(row.get('Solicitante Teléfono')) else None
        if solicitante_telefono and not self._validar_formato_telefono(solicitante_telefono):
            errores.append(f"Formato de teléfono del solicitante inválido: {solicitante_telefono}")
        
        return errores, advertencias
    
    def _validar_formato_expediente(self, numero: str) -> bool:
        """Validar formato de expediente EXP seguido de números"""
        patron = r'^EXP\d+$'
        return bool(re.match(patron, numero.upper()))
    
    def _validar_formato_ruc(self, ruc: str) -> bool:
        """Validar formato de RUC: 11 dígitos"""
        return ruc.isdigit() and len(ruc) == 11
    
    def _validar_formato_dni(self, dni: str) -> bool:
        """Validar formato de DNI: 8 dígitos"""
        return dni.isdigit() and len(dni) == 8
    
    def _validar_formato_fecha(self, fecha: str) -> bool:
        """Validar formato de fecha YYYY-MM-DD"""
        try:
            datetime.strptime(fecha, '%Y-%m-%d')
            return True
        except ValueError:
            return False
    
    def _validar_formato_email(self, email: str) -> bool:
        """Validar formato de email"""
        patron = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(patron, email))
    
    def _validar_formato_telefono(self, telefono: str) -> bool:
        """Validar formato de teléfono: números, espacios, guiones y paréntesis. Acepta múltiples teléfonos separados por espacios"""
        if not telefono:
            return True
        
        # Normalizar el teléfono para validación
        telefono_normalizado = self._normalizar_telefono(telefono)
        
        # Si contiene comas, validar cada número por separado
        if ',' in telefono_normalizado:
            numeros = [num.strip() for num in telefono_normalizado.split(',')]
            for numero in numeros:
                if numero:  # Solo validar números no vacíos
                    patron = r'^[\d\s\-\(\)\+]{7,15}$'
                    if not re.match(patron, numero):
                        return False
            return True
        else:
            # Validar como un solo número
            patron = r'^[\d\s\-\(\)\+]{7,15}$'
            return bool(re.match(patron, telefono_normalizado))
    
    def _normalizar_telefono(self, telefono: str) -> str:
        """Normalizar teléfono: convertir espacios a comas para múltiples números"""
        if not telefono:
            return telefono
        
        # Limpiar el teléfono
        telefono_limpio = telefono.strip()
        
        # Si contiene espacios que separan números completos, convertir a comas
        # Patrón mejorado para detectar múltiples números separados por espacios
        import re
        
        # Buscar patrones de números telefónicos completos separados por espacios
        # Un número telefónico puede incluir: dígitos, guiones, paréntesis, signos +
        # Pero debe tener al menos 7 dígitos consecutivos o separados por guiones/paréntesis
        
        # Estrategia más simple: dividir por espacios y verificar si cada parte parece un número
        partes = re.split(r'\s+', telefono_limpio)
        
        if len(partes) > 1:
            # Verificar si cada parte parece un número telefónico válido
            numeros_validos = []
            for parte in partes:
                parte = parte.strip()
                if parte and len(parte) >= 7:  # Mínimo 7 caracteres para ser un número
                    # Verificar que tenga suficientes dígitos
                    digitos = re.findall(r'\d', parte)
                    if len(digitos) >= 6:  # Al menos 6 dígitos
                        numeros_validos.append(parte)
                    else:
                        # Si no es un número válido, mantener el original
                        return telefono_limpio
                elif parte:
                    # Si hay una parte muy corta, mantener el original
                    return telefono_limpio
            
            # Si todas las partes son números válidos, unir con comas
            if len(numeros_validos) > 1:
                return ', '.join(numeros_validos)
        
        return telefono_limpio
    
    def _existe_empresa_con_ruc(self, ruc: str) -> bool:
        """Verificar si existe empresa con el RUC dado"""
        empresas_mock = get_mock_empresas()
        return any(emp.ruc == ruc for emp in empresas_mock)
    
    def _convertir_fila_a_expediente(self, row: pd.Series) -> Dict[str, Any]:
        """Convertir fila de Excel a datos de expediente"""
        
        # Datos básicos
        numero_expediente = str(row.get('Número Expediente', '')).strip().upper()
        ruc_empresa = str(row.get('RUC Empresa', '')).strip()
        
        # Tipo y estado
        tipo_tramite = str(row.get('Tipo Trámite', 'AUTORIZACION_NUEVA')).strip().upper()
        prioridad = str(row.get('Prioridad', 'MEDIA')).strip().upper()
        estado = str(row.get('Estado', 'EN_PROCESO')).strip().upper()
        
        # Descripción y fechas
        descripcion = str(row.get('Descripción', '')).strip()
        fecha_ingreso = str(row.get('Fecha Ingreso', '')).strip()
        fecha_limite = str(row.get('Fecha Límite', '')).strip() if pd.notna(row.get('Fecha Límite')) else None
        
        # Datos del solicitante
        solicitante_nombre = str(row.get('Solicitante Nombre', '')).strip()
        solicitante_dni = str(row.get('Solicitante DNI', '')).strip()
        solicitante_email = str(row.get('Solicitante Email', '')).strip() if pd.notna(row.get('Solicitante Email')) else None
        solicitante_telefono = str(row.get('Solicitante Teléfono', '')).strip() if pd.notna(row.get('Solicitante Teléfono')) else None
        
        # Normalizar teléfono si existe
        if solicitante_telefono:
            solicitante_telefono = self._normalizar_telefono(solicitante_telefono)
        
        # Observaciones
        observaciones = str(row.get('Observaciones', '')).strip() if pd.notna(row.get('Observaciones')) else None
        
        return {
            'numeroExpediente': numero_expediente,
            'empresaRuc': ruc_empresa,
            'tipoTramite': tipo_tramite,
            'descripcion': descripcion,
            'prioridad': prioridad,
            'estado': estado,
            'fechaIngreso': fecha_ingreso,
            'fechaLimite': fecha_limite,
            'solicitanteNombre': solicitante_nombre,
            'solicitanteDni': solicitante_dni,
            'solicitanteEmail': solicitante_email,
            'solicitanteTelefono': solicitante_telefono,
            'observaciones': observaciones
        }
    
    def procesar_carga_masiva(self, archivo_excel: BytesIO) -> Dict[str, Any]:
        """Procesar carga masiva de expedientes desde Excel"""
        
        # Primero validar el archivo
        resultado_validacion = self.validar_archivo_excel(archivo_excel)
        
        if 'error' in resultado_validacion:
            return resultado_validacion
        
        # Si hay expedientes válidos, procesarlos
        expedientes_creados = []
        errores_creacion = []
        
        for expediente_data in resultado_validacion['expedientes_validos']:
            try:
                # Aquí iría la lógica para crear el expediente en la base de datos
                # Por ahora simulamos la creación
                expediente_creado = {
                    'numero_expediente': expediente_data['numeroExpediente'],
                    'empresa_ruc': expediente_data['empresaRuc'],
                    'tipo_tramite': expediente_data['tipoTramite'],
                    'estado': 'CREADO'
                }
                expedientes_creados.append(expediente_creado)
                
            except Exception as e:
                errores_creacion.append({
                    'numero_expediente': expediente_data['numeroExpediente'],
                    'error': str(e)
                })
        
        return {
            **resultado_validacion,
            'expedientes_creados': expedientes_creados,
            'errores_creacion': errores_creacion,
            'total_creadas': len(expedientes_creados)
        }