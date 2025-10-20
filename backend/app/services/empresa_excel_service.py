"""
Servicio para carga masiva de empresas desde archivos Excel
"""
import pandas as pd
import re
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from io import BytesIO
from app.models.empresa import (
    EmpresaCreate, 
    RazonSocial, 
    RepresentanteLegal, 
    EstadoEmpresa,
    DocumentoEmpresa,
    TipoDocumento
)
from app.services.mock_data import get_mock_empresas

class EmpresaExcelService:
    def __init__(self):
        pass  # No necesitamos EmpresaService para las validaciones básicas
        
    def generar_plantilla_excel(self) -> BytesIO:
        """Generar plantilla Excel para carga masiva de empresas"""
        
        # Definir columnas de la plantilla
        columnas = {
            # Datos básicos de la empresa
            'codigo_empresa': 'Código Empresa',
            'ruc': 'RUC',
            'razon_social_principal': 'Razón Social Principal',
            'razon_social_sunat': 'Razón Social SUNAT',
            'razon_social_minimo': 'Razón Social Mínimo',
            'direccion_fiscal': 'Dirección Fiscal',
            'estado': 'Estado',
            
            # Representante legal
            'representante_dni': 'DNI Representante',
            'representante_nombres': 'Nombres Representante',
            'representante_apellidos': 'Apellidos Representante',
            'representante_email': 'Email Representante',
            'representante_telefono': 'Teléfono Representante',
            'representante_direccion': 'Dirección Representante',
            
            # Contacto de la empresa
            'email_contacto': 'Email Contacto',
            'telefono_contacto': 'Teléfono Contacto',
            'sitio_web': 'Sitio Web',
            
            # Observaciones
            'observaciones': 'Observaciones'
        }
        
        # Crear DataFrame con datos de ejemplo
        datos_ejemplo = {
            # Datos básicos
            'Código Empresa': ['0001TRP', '0002LOG'],
            'RUC': ['20123456789', '20987654321'],
            'Razón Social Principal': ['TRANSPORTES PUNO S.A.', 'LOGÍSTICA AREQUIPA E.I.R.L.'],
            'Razón Social SUNAT': ['TRANSPORTES PUNO SOCIEDAD ANONIMA', 'LOGISTICA AREQUIPA EMPRESA INDIVIDUAL DE RESPONSABILIDAD LIMITADA'],
            'Razón Social Mínimo': ['TRANSPORTES PUNO', 'LOGISTICA AREQUIPA'],
            'Dirección Fiscal': ['AV. EJERCITO 123, PUNO', 'JR. MERCADERES 456, AREQUIPA'],
            'Estado': ['HABILITADA', 'HABILITADA'],
            
            # Representante legal
            'DNI Representante': ['12345678', '87654321'],
            'Nombres Representante': ['JUAN CARLOS', 'MARIA ELENA'],
            'Apellidos Representante': ['MAMANI QUISPE', 'RODRIGUEZ VARGAS'],
            'Email Representante': ['juan.mamani@transportespuno.com', 'maria.rodriguez@logisticaarequipa.com'],
            'Teléfono Representante': ['951234567', '987654321'],
            'Dirección Representante': ['AV. SIMON BOLIVAR 789, PUNO', 'CALLE SANTA CATALINA 321, AREQUIPA'],
            
            # Contacto empresa
            'Email Contacto': ['contacto@transportespuno.com', 'info@logisticaarequipa.com'],
            'Teléfono Contacto': ['051-123456', '054-987654'],
            'Sitio Web': ['www.transportespuno.com', 'www.logisticaarequipa.com'],
            
            # Observaciones
            'Observaciones': ['Empresa con 15 años de experiencia', 'Especializada en carga pesada']
        }
        
        df = pd.DataFrame(datos_ejemplo)
        
        # Crear archivo Excel en memoria
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Empresas', index=False)
            
            # Obtener el workbook y worksheet para formatear
            workbook = writer.book
            worksheet = writer.sheets['Empresas']
            
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
        """Validar archivo Excel de empresas"""
        try:
            df = pd.read_excel(archivo_excel)
            
            resultados = {
                'total_filas': len(df),
                'validos': 0,
                'invalidos': 0,
                'con_advertencias': 0,
                'errores': [],
                'advertencias': [],
                'empresas_validas': []
            }
            
            for index, row in df.iterrows():
                fila_num = index + 2  # +2 porque Excel empieza en 1 y tiene header
                errores_fila = []
                advertencias_fila = []
                
                # Validar fila
                errores_fila, advertencias_fila = self._validar_fila_empresa(row, fila_num)
                
                if errores_fila:
                    resultados['invalidos'] += 1
                    codigo_empresa = str(row.get('Código Empresa', 'N/A')).strip()
                    resultados['errores'].append({
                        'fila': fila_num,
                        'codigo_empresa': codigo_empresa,
                        'errores': errores_fila
                    })
                else:
                    if advertencias_fila:
                        resultados['con_advertencias'] += 1
                        codigo_empresa = str(row.get('Código Empresa', 'N/A')).strip()
                        resultados['advertencias'].append({
                            'fila': fila_num,
                            'codigo_empresa': codigo_empresa,
                            'advertencias': advertencias_fila
                        })
                    
                    resultados['validos'] += 1
                    # Convertir fila a modelo de empresa
                    try:
                        empresa = self._convertir_fila_a_empresa(row)
                        resultados['empresas_validas'].append(empresa)
                    except Exception as e:
                        resultados['validos'] -= 1
                        resultados['invalidos'] += 1
                        codigo_empresa = str(row.get('Código Empresa', 'N/A')).strip()
                        resultados['errores'].append({
                            'fila': fila_num,
                            'codigo_empresa': codigo_empresa,
                            'errores': [f"Error al procesar empresa: {str(e)}"]
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
                'empresas_validas': []
            }
    
    def _validar_fila_empresa(self, row: pd.Series, fila_num: int) -> Tuple[List[str], List[str]]:
        """Validar una fila de empresa"""
        errores = []
        advertencias = []
        
        # Validar código de empresa (requerido)
        codigo_empresa = str(row.get('Código Empresa', '')).strip() if pd.notna(row.get('Código Empresa')) else ''
        if not codigo_empresa:
            errores.append("Código de empresa es requerido")
        elif not self._validar_formato_codigo_empresa(codigo_empresa):
            errores.append(f"Formato de código de empresa inválido: {codigo_empresa} (debe ser 4 dígitos + 3 letras, ej: 0123TRP)")
        else:
            # Verificar si ya existe
            if self._existe_empresa_con_codigo(codigo_empresa):
                errores.append(f"Ya existe una empresa con código: {codigo_empresa}")
        
        # Validar RUC (requerido)
        ruc = str(row.get('RUC', '')).strip() if pd.notna(row.get('RUC')) else ''
        if not ruc:
            errores.append("RUC es requerido")
        elif not self._validar_formato_ruc(ruc):
            errores.append(f"RUC debe tener 11 dígitos: {ruc}")
        else:
            # Verificar si ya existe
            if self._existe_empresa_con_ruc(ruc):
                errores.append(f"Ya existe una empresa con RUC: {ruc}")
        
        # Validar razón social principal (requerida)
        razon_social = str(row.get('Razón Social Principal', '')).strip() if pd.notna(row.get('Razón Social Principal')) else ''
        if not razon_social:
            errores.append("Razón Social Principal es requerida")
        elif len(razon_social) < 3:
            errores.append("Razón Social Principal debe tener al menos 3 caracteres")
        
        # Validar dirección fiscal (requerida)
        direccion = str(row.get('Dirección Fiscal', '')).strip() if pd.notna(row.get('Dirección Fiscal')) else ''
        if not direccion:
            errores.append("Dirección Fiscal es requerida")
        elif len(direccion) < 10:
            errores.append("Dirección Fiscal debe tener al menos 10 caracteres")
        
        # Validar estado
        estado = str(row.get('Estado', '')).strip().upper() if pd.notna(row.get('Estado')) else 'HABILITADA'
        if estado and estado not in [e.value for e in EstadoEmpresa]:
            errores.append(f"Estado inválido: {estado}. Valores válidos: {', '.join([e.value for e in EstadoEmpresa])}")
        
        # Validar DNI representante (requerido)
        dni_rep = str(row.get('DNI Representante', '')).strip() if pd.notna(row.get('DNI Representante')) else ''
        if not dni_rep:
            errores.append("DNI del Representante es requerido")
        elif not self._validar_formato_dni(dni_rep):
            errores.append(f"DNI debe tener 8 dígitos: {dni_rep}")
        
        # Validar nombres representante (requerido)
        nombres_rep = str(row.get('Nombres Representante', '')).strip() if pd.notna(row.get('Nombres Representante')) else ''
        if not nombres_rep:
            errores.append("Nombres del Representante son requeridos")
        elif len(nombres_rep) < 2:
            errores.append("Nombres del Representante deben tener al menos 2 caracteres")
        
        # Validar apellidos representante (requerido)
        apellidos_rep = str(row.get('Apellidos Representante', '')).strip() if pd.notna(row.get('Apellidos Representante')) else ''
        if not apellidos_rep:
            errores.append("Apellidos del Representante son requeridos")
        elif len(apellidos_rep) < 2:
            errores.append("Apellidos del Representante deben tener al menos 2 caracteres")
        
        # Validar email representante (opcional pero formato válido si se proporciona)
        email_rep = str(row.get('Email Representante', '')).strip() if pd.notna(row.get('Email Representante')) else None
        if email_rep and not self._validar_formato_email(email_rep):
            errores.append(f"Formato de email del representante inválido: {email_rep}")
        
        # Validar teléfono representante (opcional pero formato válido si se proporciona)
        telefono_rep = str(row.get('Teléfono Representante', '')).strip() if pd.notna(row.get('Teléfono Representante')) else None
        if telefono_rep and not self._validar_formato_telefono(telefono_rep):
            errores.append(f"Formato de teléfono del representante inválido: {telefono_rep}")
        
        # Validar email contacto (opcional pero formato válido si se proporciona)
        email_contacto = str(row.get('Email Contacto', '')).strip() if pd.notna(row.get('Email Contacto')) else None
        if email_contacto and not self._validar_formato_email(email_contacto):
            errores.append(f"Formato de email de contacto inválido: {email_contacto}")
        
        # Validar teléfono contacto (opcional pero formato válido si se proporciona)
        telefono_contacto = str(row.get('Teléfono Contacto', '')).strip() if pd.notna(row.get('Teléfono Contacto')) else None
        if telefono_contacto and not self._validar_formato_telefono(telefono_contacto):
            errores.append(f"Formato de teléfono de contacto inválido: {telefono_contacto}")
        
        return errores, advertencias
    
    def _validar_formato_codigo_empresa(self, codigo: str) -> bool:
        """Validar formato de código de empresa: 4 dígitos + 3 letras"""
        patron = r'^\d{4}[A-Z]{3}$'
        return bool(re.match(patron, codigo.upper()))
    
    def _validar_formato_ruc(self, ruc: str) -> bool:
        """Validar formato de RUC: 11 dígitos"""
        return ruc.isdigit() and len(ruc) == 11
    
    def _validar_formato_dni(self, dni: str) -> bool:
        """Validar formato de DNI: 8 dígitos"""
        return dni.isdigit() and len(dni) == 8
    
    def _validar_formato_email(self, email: str) -> bool:
        """Validar formato de email"""
        patron = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(patron, email))
    
    def _validar_formato_telefono(self, telefono: str) -> bool:
        """Validar formato de teléfono: números, espacios, guiones y paréntesis"""
        patron = r'^[\d\s\-\(\)\+]{7,15}$'
        return bool(re.match(patron, telefono))
    
    def _existe_empresa_con_codigo(self, codigo: str) -> bool:
        """Verificar si existe empresa con el código dado"""
        empresas_mock = get_mock_empresas()
        return any(emp.codigoEmpresa.upper() == codigo.upper() for emp in empresas_mock)
    
    def _existe_empresa_con_ruc(self, ruc: str) -> bool:
        """Verificar si existe empresa con el RUC dado"""
        empresas_mock = get_mock_empresas()
        return any(emp.ruc == ruc for emp in empresas_mock)
    
    def _convertir_fila_a_empresa(self, row: pd.Series) -> EmpresaCreate:
        """Convertir fila de Excel a modelo EmpresaCreate"""
        
        # Datos básicos
        codigo_empresa = str(row.get('Código Empresa', '')).strip().upper()
        ruc = str(row.get('RUC', '')).strip()
        
        # Razón social
        razon_social_principal = str(row.get('Razón Social Principal', '')).strip()
        razon_social_sunat = str(row.get('Razón Social SUNAT', '')).strip() if pd.notna(row.get('Razón Social SUNAT')) else None
        razon_social_minimo = str(row.get('Razón Social Mínimo', '')).strip() if pd.notna(row.get('Razón Social Mínimo')) else None
        
        razon_social = RazonSocial(
            principal=razon_social_principal,
            sunat=razon_social_sunat,
            minimo=razon_social_minimo
        )
        
        # Dirección fiscal
        direccion_fiscal = str(row.get('Dirección Fiscal', '')).strip()
        
        # Representante legal
        dni_rep = str(row.get('DNI Representante', '')).strip()
        nombres_rep = str(row.get('Nombres Representante', '')).strip()
        apellidos_rep = str(row.get('Apellidos Representante', '')).strip()
        email_rep = str(row.get('Email Representante', '')).strip() if pd.notna(row.get('Email Representante')) else None
        telefono_rep = str(row.get('Teléfono Representante', '')).strip() if pd.notna(row.get('Teléfono Representante')) else None
        direccion_rep = str(row.get('Dirección Representante', '')).strip() if pd.notna(row.get('Dirección Representante')) else None
        
        representante_legal = RepresentanteLegal(
            dni=dni_rep,
            nombres=nombres_rep,
            apellidos=apellidos_rep,
            email=email_rep,
            telefono=telefono_rep,
            direccion=direccion_rep
        )
        
        # Contacto empresa
        email_contacto = str(row.get('Email Contacto', '')).strip() if pd.notna(row.get('Email Contacto')) else None
        telefono_contacto = str(row.get('Teléfono Contacto', '')).strip() if pd.notna(row.get('Teléfono Contacto')) else None
        sitio_web = str(row.get('Sitio Web', '')).strip() if pd.notna(row.get('Sitio Web')) else None
        
        return EmpresaCreate(
            codigoEmpresa=codigo_empresa,
            ruc=ruc,
            razonSocial=razon_social,
            direccionFiscal=direccion_fiscal,
            representanteLegal=representante_legal,
            emailContacto=email_contacto,
            telefonoContacto=telefono_contacto,
            sitioWeb=sitio_web
        )
    
    def procesar_carga_masiva(self, archivo_excel: BytesIO) -> Dict[str, Any]:
        """Procesar carga masiva de empresas desde Excel"""
        
        # Primero validar el archivo
        resultado_validacion = self.validar_archivo_excel(archivo_excel)
        
        if 'error' in resultado_validacion:
            return resultado_validacion
        
        # Si hay empresas válidas, procesarlas
        empresas_creadas = []
        errores_creacion = []
        
        for empresa_data in resultado_validacion['empresas_validas']:
            try:
                # Aquí iría la lógica para crear la empresa en la base de datos
                # Por ahora simulamos la creación
                empresa_creada = {
                    'codigo_empresa': empresa_data.codigoEmpresa,
                    'ruc': empresa_data.ruc,
                    'razon_social': empresa_data.razonSocial.principal,
                    'estado': 'CREADA'
                }
                empresas_creadas.append(empresa_creada)
                
            except Exception as e:
                errores_creacion.append({
                    'codigo_empresa': empresa_data.codigoEmpresa,
                    'error': str(e)
                })
        
        return {
            **resultado_validacion,
            'empresas_creadas': empresas_creadas,
            'errores_creacion': errores_creacion,
            'total_creadas': len(empresas_creadas)
        }