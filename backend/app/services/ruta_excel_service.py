"""
Servicio para carga masiva de rutas desde archivos Excel
"""
import pandas as pd
import re
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from io import BytesIO
from app.models.ruta import (
    RutaCreate, 
    EstadoRuta, 
    TipoRuta, 
    TipoServicio
)
# from app.services.mock_data import get_mock_rutas  # COMENTADO: mock eliminado

class RutaExcelService:
    def __init__(self):
        pass
        
    def generar_plantilla_excel(self) -> BytesIO:
        """Generar plantilla Excel para carga masiva de rutas"""
        
        # Crear DataFrame con datos de ejemplo
        datos_ejemplo = {
            'Código Ruta': ['04', '05'],
            'Nombre': ['PUNO - AREQUIPA', 'JULIACA - CUSCO'],
            'Origen ID': ['1', '2'],
            'Destino ID': ['3', '4'],
            'Tipo Ruta': ['INTERPROVINCIAL', 'INTERPROVINCIAL'],
            'Tipo Servicio': ['PASAJEROS', 'PASAJEROS'],
            'Frecuencias': ['Diaria, cada 2 horas', 'Diaria, 4 veces al día'],
            'Distancia (km)': [280.5, 320.0],
            'Tiempo Estimado': ['04:30', '05:00'],
            'Tarifa Base': [35.00, 40.00],
            'Capacidad Máxima': [45, 50],
            'Estado': ['ACTIVA', 'ACTIVA'],
            'Observaciones': ['Ruta turística principal', 'Ruta con paradas intermedias']
        }
        
        df = pd.DataFrame(datos_ejemplo)
        
        # Crear archivo Excel en memoria
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Rutas', index=False)
            
            # Obtener el workbook y worksheet para formatear
            workbook = writer.book
            worksheet = writer.sheets['Rutas']
            
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
        """Validar archivo Excel de rutas"""
        try:
            df = pd.read_excel(archivo_excel)
            
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
                errores_fila, advertencias_fila = self._validar_fila_ruta(row, fila_num)
                
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
                        ruta = self._convertir_fila_a_ruta(row)
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
    
    def _validar_fila_ruta(self, row: pd.Series, fila_num: int) -> Tuple[List[str], List[str]]:
        """Validar una fila de ruta"""
        errores = []
        advertencias = []
        
        # Validar código de ruta (requerido)
        codigo_ruta = str(row.get('Código Ruta', '')).strip() if pd.notna(row.get('Código Ruta')) else ''
        if not codigo_ruta:
            errores.append("Código de ruta es requerido")
        elif not self._validar_formato_codigo_ruta(codigo_ruta):
            errores.append(f"Formato de código de ruta inválido: {codigo_ruta} (debe ser 2-3 dígitos)")
        else:
            # Verificar si ya existe
            if self._existe_ruta_con_codigo(codigo_ruta):
                errores.append(f"Ya existe una ruta con código: {codigo_ruta}")
        
        # Validar nombre (requerido)
        nombre = str(row.get('Nombre', '')).strip() if pd.notna(row.get('Nombre')) else ''
        if not nombre:
            errores.append("Nombre de ruta es requerido")
        elif len(nombre) < 5:
            errores.append("Nombre de ruta debe tener al menos 5 caracteres")
        
        # Validar origen y destino
        origen_id = str(row.get('Origen ID', '')).strip() if pd.notna(row.get('Origen ID')) else ''
        if not origen_id:
            errores.append("ID de origen es requerido")
        
        destino_id = str(row.get('Destino ID', '')).strip() if pd.notna(row.get('Destino ID')) else ''
        if not destino_id:
            errores.append("ID de destino es requerido")
        
        if origen_id and destino_id and origen_id == destino_id:
            errores.append("El origen y destino no pueden ser iguales")
        
        # Validar tipo de ruta
        tipo_ruta = str(row.get('Tipo Ruta', '')).strip().upper() if pd.notna(row.get('Tipo Ruta')) else ''
        if tipo_ruta and tipo_ruta not in [e.value for e in TipoRuta]:
            errores.append(f"Tipo de ruta inválido: {tipo_ruta}. Valores válidos: {', '.join([e.value for e in TipoRuta])}")
        
        # Validar tipo de servicio
        tipo_servicio = str(row.get('Tipo Servicio', '')).strip().upper() if pd.notna(row.get('Tipo Servicio')) else ''
        if tipo_servicio and tipo_servicio not in [e.value for e in TipoServicio]:
            errores.append(f"Tipo de servicio inválido: {tipo_servicio}. Valores válidos: {', '.join([e.value for e in TipoServicio])}")
        
        # Validar estado
        estado = str(row.get('Estado', '')).strip().upper() if pd.notna(row.get('Estado')) else 'ACTIVA'
        if estado and estado not in [e.value for e in EstadoRuta]:
            errores.append(f"Estado inválido: {estado}. Valores válidos: {', '.join([e.value for e in EstadoRuta])}")
        
        # Validar frecuencias (requerido)
        frecuencias = str(row.get('Frecuencias', '')).strip() if pd.notna(row.get('Frecuencias')) else ''
        if not frecuencias:
            errores.append("Frecuencias son requeridas")
        
        # Validar campos numéricos opcionales
        distancia = row.get('Distancia (km)')
        if pd.notna(distancia):
            try:
                distancia_float = float(distancia)
                if distancia_float <= 0:
                    errores.append("La distancia debe ser mayor a 0")
            except (ValueError, TypeError):
                errores.append(f"Distancia inválida: {distancia}")
        
        tarifa_base = row.get('Tarifa Base')
        if pd.notna(tarifa_base):
            try:
                tarifa_float = float(tarifa_base)
                if tarifa_float <= 0:
                    errores.append("La tarifa base debe ser mayor a 0")
            except (ValueError, TypeError):
                errores.append(f"Tarifa base inválida: {tarifa_base}")
        
        capacidad_maxima = row.get('Capacidad Máxima')
        if pd.notna(capacidad_maxima):
            try:
                capacidad_int = int(capacidad_maxima)
                if capacidad_int <= 0:
                    errores.append("La capacidad máxima debe ser mayor a 0")
            except (ValueError, TypeError):
                errores.append(f"Capacidad máxima inválida: {capacidad_maxima}")
        
        # Validar tiempo estimado
        tiempo_estimado = str(row.get('Tiempo Estimado', '')).strip() if pd.notna(row.get('Tiempo Estimado')) else None
        if tiempo_estimado and not self._validar_formato_tiempo(tiempo_estimado):
            errores.append(f"Formato de tiempo estimado inválido: {tiempo_estimado} (debe ser HH:MM)")
        
        return errores, advertencias
    
    def _validar_formato_codigo_ruta(self, codigo: str) -> bool:
        """Validar formato de código de ruta: 2-3 dígitos"""
        return codigo.isdigit() and 2 <= len(codigo) <= 3
    
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
    
    def _existe_ruta_con_codigo(self, codigo: str) -> bool:
        """Verificar si existe ruta con el código dado"""
        rutas_mock = get_mock_rutas()
        return any(ruta.codigoRuta == codigo for ruta in rutas_mock)
    
    def _convertir_fila_a_ruta(self, row: pd.Series) -> Dict[str, Any]:
        """Convertir fila de Excel a datos de ruta"""
        
        # Datos básicos
        codigo_ruta = str(row.get('Código Ruta', '')).strip()
        nombre = str(row.get('Nombre', '')).strip()
        origen_id = str(row.get('Origen ID', '')).strip()
        destino_id = str(row.get('Destino ID', '')).strip()
        
        # Tipos y estado
        tipo_ruta = str(row.get('Tipo Ruta', 'INTERPROVINCIAL')).strip().upper()
        tipo_servicio = str(row.get('Tipo Servicio', 'PASAJEROS')).strip().upper()
        estado = str(row.get('Estado', 'ACTIVA')).strip().upper()
        
        # Otros campos
        frecuencias = str(row.get('Frecuencias', '')).strip()
        observaciones = str(row.get('Observaciones', '')).strip() if pd.notna(row.get('Observaciones')) else None
        
        # Campos numéricos opcionales
        distancia = float(row.get('Distancia (km)')) if pd.notna(row.get('Distancia (km)')) else None
        tarifa_base = float(row.get('Tarifa Base')) if pd.notna(row.get('Tarifa Base')) else None
        capacidad_maxima = int(row.get('Capacidad Máxima')) if pd.notna(row.get('Capacidad Máxima')) else None
        tiempo_estimado = str(row.get('Tiempo Estimado', '')).strip() if pd.notna(row.get('Tiempo Estimado')) else None
        
        return {
            'codigoRuta': codigo_ruta,
            'nombre': nombre,
            'origenId': origen_id,
            'destinoId': destino_id,
            'tipoRuta': tipo_ruta,
            'tipoServicio': tipo_servicio,
            'frecuencias': frecuencias,
            'estado': estado,
            'distancia': distancia,
            'tiempoEstimado': tiempo_estimado,
            'tarifaBase': tarifa_base,
            'capacidadMaxima': capacidad_maxima,
            'observaciones': observaciones
        }
    
    def procesar_carga_masiva(self, archivo_excel: BytesIO) -> Dict[str, Any]:
        """Procesar carga masiva de rutas desde Excel"""
        
        # Primero validar el archivo
        resultado_validacion = self.validar_archivo_excel(archivo_excel)
        
        if 'error' in resultado_validacion:
            return resultado_validacion
        
        # Si hay rutas válidas, procesarlas
        rutas_creadas = []
        errores_creacion = []
        
        for ruta_data in resultado_validacion['rutas_validas']:
            try:
                # Aquí iría la lógica para crear la ruta en la base de datos
                # Por ahora simulamos la creación
                ruta_creada = {
                    'codigo_ruta': ruta_data['codigoRuta'],
                    'nombre': ruta_data['nombre'],
                    'tipo_ruta': ruta_data['tipoRuta'],
                    'estado': 'CREADA'
                }
                rutas_creadas.append(ruta_creada)
                
            except Exception as e:
                errores_creacion.append({
                    'codigo_ruta': ruta_data['codigoRuta'],
                    'error': str(e)
                })
        
        return {
            **resultado_validacion,
            'rutas_creadas': rutas_creadas,
            'errores_creacion': errores_creacion,
            'total_creadas': len(rutas_creadas)
        }