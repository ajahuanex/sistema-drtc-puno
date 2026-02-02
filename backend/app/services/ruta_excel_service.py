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
    TipoServicio,
    LocalidadEmbebida,
    EmpresaEmbebida,
    ResolucionEmbebida,
    FrecuenciaServicio,
    TipoFrecuencia,
    crear_frecuencia_diaria
)

class RutaExcelService:
    def __init__(self, db: AsyncIOMotorDatabase = None):
        self.db = db
        if db is not None:
            self.rutas_collection = db["rutas"]
            self.empresas_collection = db["empresas"]
            self.resoluciones_collection = db["resoluciones"]
            self.localidades_collection = db["localidades"]
        
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
                    '3. RUC debe corresponder a una empresa activa en el sistema',
                    '4. Resolución debe ser PADRE y VIGENTE',
                    '5. Origen y Destino deben existir como localidades activas',
                    '6. El código de ruta debe ser único dentro de la resolución',
                    '7. Guarde el archivo y súbalo al sistema',
                    '',
                    'CAMPOS OBLIGATORIOS:',
                    '• RUC (*): RUC de la empresa (ej: 20448048242)',
                    '• Resolución (*): Formato flexible (ej: 921-2023, R-0921-2023)',
                    '• Código Ruta (*): Número de 1-3 dígitos (ej: 1, 02, 123)',
                    '• Origen (*): Nombre de localidad origen (ej: PUNO)',
                    '• Destino (*): Nombre de localidad destino (ej: JULIACA)',
                    '• Frecuencia (*): Descripción (ej: 08 DIARIAS, 02 SEMANALES)',
                    '',
                    'NORMALIZACIONES AUTOMÁTICAS:',
                    '• Código Ruta: Se normaliza a 2 dígitos (1 → 01, 2 → 02)',
                    '• Resolución: Se normaliza a R-XXXX-YYYY (921-2023 → R-0921-2023)',
                    '• Localidades: Si no existen, se crean con departamento PUNO (solo rutas activas)',
                    '• Estado CANCELADA: Se convierte automáticamente a INACTIVA',
                    '• Guiones (-): Indican rutas canceladas, se procesan como INACTIVA',
                    '• Itinerario vacío: Se convierte a "SIN ITINERARIO"',
                    '• Tipo Ruta vacío: Se asigna "INTERREGIONAL" por defecto',
                    '• Rutas INACTIVAS/CANCELADAS: No requieren localidades válidas',
                    '',
                    'CAMPOS OPCIONALES:',
                    '• Itinerario: Descripción del recorrido (vacío = "SIN ITINERARIO")',
                    '• Tipo Ruta: URBANA, INTERURBANA, INTERPROVINCIAL, INTERREGIONAL, RURAL (vacío = INTERREGIONAL)',
                    '• Tipo Servicio: PASAJEROS, CARGA, MIXTO',
                    '• Estado: ACTIVA, INACTIVA, EN_MANTENIMIENTO, SUSPENDIDA',
                    '• Distancia: Distancia en kilómetros (ej: 45.5)',
                    '• Tiempo Estimado: Tiempo de viaje (ej: 1h 30min)',
                    '• Tarifa Base: Tarifa en soles (ej: 15.50)',
                    '• Observaciones: Comentarios adicionales',
                ]
            }
            
            df_instrucciones = pd.DataFrame(instrucciones_data)
            df_instrucciones.to_excel(writer, sheet_name='INSTRUCCIONES', index=False)
            
            # Hoja 2: Plantilla vacía para completar
            columnas_datos = [
                'RUC (*)', 
                'Resolución (*)', 
                'Código Ruta (*)', 
                'Origen (*)', 
                'Destino (*)', 
                'Itinerario',
                'Frecuencia (*)', 
                'Tipo Ruta',
                'Tipo Servicio',
                'Estado', 
                'Distancia (km)',
                'Tiempo Estimado',
                'Tarifa Base (S/.)',
                'Observaciones'
            ]
            
            # Crear ejemplos
            ejemplos = [
                ['20448048242', '921-2023', '1', 'PUNO', 'JULIACA', '', '08 DIARIAS', '', 'PASAJEROS', 'ACTIVA', '45.5', '1h 30min', '15.50', 'Ruta principal'],
                ['20364360771', 'R-0495-2022', '2', 'JULIACA', 'AREQUIPA', 'JULIACA - LAMPA - AREQUIPA', '04 DIARIAS', 'INTERREGIONAL', 'PASAJEROS', 'ACTIVA', '280.0', '4h 15min', '35.00', 'Ruta interregional'],
                ['20115054229', '290-2023', '01', 'PUNO', 'CUSCO', '', '02 DIARIAS', 'INTERPROVINCIAL', 'PASAJEROS', 'ACTIVA', '390.0', '6h 00min', '45.00', 'Ruta turística']
            ]
            
            df_datos = pd.DataFrame(ejemplos, columns=columnas_datos)
            df_datos.to_excel(writer, sheet_name='DATOS', index=False)
            
            # Hoja 3: Valores válidos
            valores_data = {
                'TIPO RUTA': ['URBANA', 'INTERURBANA', 'INTERPROVINCIAL', 'INTERREGIONAL', 'RURAL'],
                'TIPO SERVICIO': ['PASAJEROS', 'CARGA', 'MIXTO'],
                'ESTADO': ['ACTIVA', 'INACTIVA', 'CANCELADA', 'EN_MANTENIMIENTO', 'SUSPENDIDA'],
                'EJEMPLOS FRECUENCIA': ['01 DIARIA', '02 DIARIAS', '08 DIARIAS', '03 SEMANALES', '01 SEMANAL']
            }
            
            # Hacer que todas las listas tengan la misma longitud
            max_len = max(len(v) for v in valores_data.values())
            for key in valores_data:
                while len(valores_data[key]) < max_len:
                    valores_data[key].append('')
            
            df_valores = pd.DataFrame(valores_data)
            df_valores.to_excel(writer, sheet_name='VALORES_VALIDOS', index=False)
            
            # Formatear hojas
            workbook = writer.book
            
            # Formatear todas las hojas
            for sheet_name in ['INSTRUCCIONES', 'DATOS', 'VALORES_VALIDOS']:
                ws = writer.sheets[sheet_name]
                for column in ws.columns:
                    max_length = 0
                    column_letter = column[0].column_letter
                    for cell in column:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except:
                            pass
                    adjusted_width = min(max_length + 2, 50)
                    ws.column_dimensions[column_letter].width = adjusted_width
        
        buffer.seek(0)
        return buffer
    
    async def procesar_carga_masiva(self, archivo_excel: BytesIO) -> Dict[str, Any]:
        """Procesar carga masiva de rutas desde Excel"""
        print("🔍 DEBUG PROCESAMIENTO: Iniciando procesamiento de carga masiva")
        try:
            # Primero validar el archivo
            validacion = await self.validar_archivo_excel(archivo_excel)
            
            if 'error' in validacion:
                return validacion
            
            if validacion['validos'] == 0:
                return {
                    'error': 'No hay rutas válidas para procesar',
                    'validacion': validacion
                }
            
            # Procesar rutas válidas
            resultados = {
                'total_procesadas': 0,
                'exitosas': 0,
                'fallidas': 0,
                'rutas_creadas': [],
                'errores_procesamiento': [],
                'validacion': validacion
            }
            
            for ruta_data in validacion['rutas_validas']:
                print(f"🔍 DEBUG PROCESAMIENTO: Procesando ruta con RUC {ruta_data.get('ruc')} y código {ruta_data.get('codigoRuta')}")
                try:
                    # Crear la ruta usando el servicio
                    ruta_creada = await self._crear_ruta_desde_datos(ruta_data)
                    
                    resultados['exitosas'] += 1
                    resultados['rutas_creadas'].append({
                        'codigo': ruta_creada.codigoRuta,
                        'nombre': ruta_creada.nombre,
                        'id': ruta_creada.id
                    })
                    
                except Exception as e:
                    resultados['fallidas'] += 1
                    resultados['errores_procesamiento'].append({
                        'codigo_ruta': ruta_data.get('codigoRuta', 'N/A'),
                        'error': str(e)
                    })
                
                resultados['total_procesadas'] += 1
            
            return resultados
            
        except Exception as e:
            return {
                'error': f"Error al procesar carga masiva: {str(e)}",
                'total_procesadas': 0,
                'exitosas': 0,
                'fallidas': 0,
                'rutas_creadas': [],
                'errores_procesamiento': []
            }
    
    async def _crear_ruta_desde_datos(self, ruta_data: Dict[str, Any]) -> Any:
        """Crear una ruta desde los datos procesados del Excel"""
        try:
            print(f"🔍 DEBUG: INICIANDO _crear_ruta_desde_datos para RUC {ruta_data['ruc']}")
            from app.services.ruta_service import RutaService
            
            # DEBUG: Logging detallado
            print(f"🔍 DEBUG: Buscando empresa con RUC: '{ruta_data['ruc']}'")
            print(f"🔍 DEBUG: Tipo de RUC: {type(ruta_data['ruc'])}")
            print(f"🔍 DEBUG: Longitud del RUC: {len(ruta_data['ruc'])}")
            
            # Buscar empresa por RUC
            empresa = await self.empresas_collection.find_one({
                "ruc": ruta_data['ruc'],
                "estaActivo": True
            })
            
            print(f"🔍 DEBUG: Resultado búsqueda empresa: {empresa is not None}")
            if empresa:
                print(f"🔍 DEBUG: Empresa encontrada - ID: {empresa.get('_id')}, RUC: {empresa.get('ruc')}")
            else:
                print(f"🔍 DEBUG: Empresa no encontrada")
            
            if not empresa:
                raise Exception(f"Empresa con RUC {ruta_data['ruc']} no encontrada o inactiva")
            
            # Buscar resolución por número
            resolucion = await self.resoluciones_collection.find_one({
                "nroResolucion": ruta_data['resolucionNormalizada'],
                "tipoResolucion": "PADRE",
                "estado": "VIGENTE",
                "estaActivo": True
            })
            
            print(f"🔍 DEBUG: Resultado búsqueda resolución: {resolucion is not None}")
            if not resolucion:
                raise Exception(f"Resolución {ruta_data['resolucionNormalizada']} no encontrada, no es PADRE o no está VIGENTE")
            
            # Buscar o crear localidades
            origen_localidad = await self._buscar_o_crear_localidad(ruta_data['origen'])
            destino_localidad = await self._buscar_o_crear_localidad(ruta_data['destino'])
            
            origen_embebido = LocalidadEmbebida(
                id=str(origen_localidad["_id"]),
                nombre=origen_localidad["nombre"]
            )
            
            destino_embebido = LocalidadEmbebida(
                id=str(destino_localidad["_id"]),
                nombre=destino_localidad["nombre"]
            )
            
            # Crear empresa embebida
            print(f"🔍 DEBUG: Creando EmpresaEmbebida...")
            razon_social_principal = "Sin razón social"
            if 'razonSocial' in empresa:
                if isinstance(empresa['razonSocial'], dict):
                    razon_social_principal = empresa['razonSocial'].get('principal', 'Sin razón social')
                else:
                    razon_social_principal = str(empresa['razonSocial'])
            
            empresa_embebida = EmpresaEmbebida(
                id=str(empresa["_id"]),
                ruc=empresa["ruc"],
                razonSocial=razon_social_principal
            )
            print(f"🔍 DEBUG: EmpresaEmbebida creada exitosamente")
            
            resolucion_embebida = ResolucionEmbebida(
                id=str(resolucion["_id"]),
                nroResolucion=resolucion["nroResolucion"],
                tipoResolucion=resolucion["tipoResolucion"],
                estado=resolucion["estado"]
            )
            
            # Crear frecuencia
            frecuencia = FrecuenciaServicio(
                tipo=TipoFrecuencia.DIARIO,
                cantidad=1,
                dias=[],
                descripcion=ruta_data['frecuencia']
            )
            
            # Crear modelo de ruta
            ruta_create = RutaCreate(
                codigoRuta=ruta_data['codigoRuta'],
                nombre=f"{ruta_data['origen']} - {ruta_data['destino']}",  # Nombre descriptivo de la ruta
                origen=origen_embebido,
                destino=destino_embebido,
                itinerario=[],  # Por ahora vacío, se puede mejorar después
                empresa=empresa_embebida,
                resolucion=resolucion_embebida,
                frecuencia=frecuencia,
                horarios=[],
                tipoRuta=TipoRuta(ruta_data.get('tipoRuta', 'INTERREGIONAL')),
                tipoServicio=TipoServicio(ruta_data.get('tipoServicio', 'PASAJEROS')),
                distancia=ruta_data.get('distancia'),
                tiempoEstimado=ruta_data.get('tiempoEstimado'),
                tarifaBase=ruta_data.get('tarifaBase'),
                capacidadMaxima=ruta_data.get('capacidadMaxima'),
                restricciones=[],
                observaciones=ruta_data.get('observaciones'),
                descripcion=ruta_data['itinerario']  # El itinerario va en descripción
            )
            
            # Usar el servicio de rutas para crear
            ruta_service = RutaService(self.db)
            print(f"🔍 DEBUG: Llamando a ruta_service.create_ruta...")
            resultado = await ruta_service.create_ruta(ruta_create)
            print(f"🔍 DEBUG: Ruta creada exitosamente con ID: {resultado.id}")
            return resultado
            
        except Exception as e:
            print(f"❌ ERROR en _crear_ruta_desde_datos: {str(e)}")
            print(f"❌ ERROR tipo: {type(e)}")
            import traceback
            print(f"❌ ERROR traceback: {traceback.format_exc()}")
            raise e
    
    def _detectar_tipo_localidad(self, nombre_localidad: str) -> str:
        """
        Detectar automáticamente el tipo de localidad basado en su nombre
        Siguiendo la clasificación del INEI
        
        Args:
            nombre_localidad: Nombre de la localidad
            
        Returns:
            Tipo de localidad detectado
        """
        nombre_upper = nombre_localidad.upper().strip()
        
        # Patrones para Centro Poblado
        if (nombre_upper.startswith("C.P.") or 
            nombre_upper.startswith("CP ") or
            nombre_upper.startswith("CENTRO POBLADO")):
            return "CENTRO_POBLADO"
        
        # Patrones para Distrito
        elif (nombre_upper.startswith("DISTRITO") or
              nombre_upper.startswith("DIST.")):
            return "DISTRITO"
        
        # Patrones para Ciudad
        elif (nombre_upper.startswith("CIUDAD") or
              nombre_upper.startswith("CDAD.")):
            return "CIUDAD"
        
        # Patrones para Anexo
        elif (nombre_upper.startswith("ANEXO") or
              nombre_upper.startswith("ANX.")):
            return "ANEXO"
        
        # Patrones para Comunidad
        elif (nombre_upper.startswith("COMUNIDAD") or
              nombre_upper.startswith("COM.") or
              nombre_upper.startswith("CC.")):
            return "COMUNIDAD"
        
        # Por defecto es LOCALIDAD (según INEI)
        else:
            return "LOCALIDAD"

    async def _buscar_o_crear_localidad(self, nombre_localidad: str) -> Dict[str, Any]:
        """Buscar localidad existente o crear nueva con departamento PUNO por defecto"""
        # Primero buscar localidad existente
        localidad_existente = await self.localidades_collection.find_one({
            "nombre": {"$regex": f"^{nombre_localidad}$", "$options": "i"},
            "estaActiva": True
        })
        
        if localidad_existente:
            return localidad_existente
        
        # Detectar tipo automáticamente basado en el prefijo del nombre
        tipo_localidad = self._detectar_tipo_localidad(nombre_localidad)
        print(f"🏘️ TIPO DETECTADO: {nombre_localidad} -> {tipo_localidad}")
        
        # Si no existe, crear nueva localidad con departamento PUNO por defecto
        nueva_localidad = {
            "_id": ObjectId(),
            "nombre": nombre_localidad.upper(),
            "tipo": tipo_localidad,
            "departamento": "PUNO",
            "provincia": None,
            "distrito": None,
            "ubigeo": None,
            "coordenadas": {
                "latitud": None,
                "longitud": None
            },
            "estaActiva": True,
            "fechaRegistro": datetime.utcnow(),
            "fechaActualizacion": datetime.utcnow(),
            "creadoPorCargaMasiva": True,
            "observaciones": f"Localidad creada automáticamente durante carga masiva de rutas. Tipo detectado: {tipo_localidad}"
        }
        
        # Insertar la nueva localidad
        await self.localidades_collection.insert_one(nueva_localidad)
        
        return nueva_localidad
    
    async def validar_archivo_excel(self, archivo_excel: BytesIO) -> Dict[str, Any]:
        """Validar archivo Excel de rutas"""
        print("🔍 DEBUG VALIDACIÓN: Iniciando validación de archivo Excel")
        try:
            # Intentar leer diferentes hojas
            df = None
            sheet_name_used = None
            
            try:
                df = pd.read_excel(archivo_excel, sheet_name='DATOS')
                sheet_name_used = 'DATOS'
            except Exception as e1:
                try:
                    df = pd.read_excel(archivo_excel, sheet_name=0)  # Primera hoja
                    sheet_name_used = 'Primera hoja (índice 0)'
                except Exception as e2:
                    try:
                        df = pd.read_excel(archivo_excel)
                        sheet_name_used = 'Hoja por defecto'
                    except Exception as e3:
                        return {
                            'error': f'No se pudo leer el archivo Excel. Errores: DATOS={str(e1)}, Índice0={str(e2)}, Default={str(e3)}',
                            'total_filas': 0,
                            'validos': 0,
                            'invalidos': 0,
                            'con_advertencias': 0,
                            'errores': [],
                            'advertencias': [],
                            'rutas_validas': []
                        }
            
            if df is None or df.empty:
                return {
                    'error': f'El archivo Excel está vacío o no se pudo leer (hoja: {sheet_name_used})',
                    'total_filas': 0,
                    'validos': 0,
                    'invalidos': 0,
                    'con_advertencias': 0,
                    'errores': [],
                    'advertencias': [],
                    'rutas_validas': []
                }
            
            # Debug: mostrar información del DataFrame
            print(f"DEBUG: DataFrame leído exitosamente desde {sheet_name_used}")
            print(f"DEBUG: Forma del DataFrame: {df.shape}")
            print(f"DEBUG: Columnas originales: {list(df.columns)}")
            
            # Normalizar nombres de columnas
            df.columns = df.columns.str.strip()
            df.columns = df.columns.str.replace(r'\s*\(\*\)\s*', '', regex=True)  # Remover (*)
            df.columns = df.columns.str.replace(r'\s*\([^)]*\)\s*', '', regex=True)  # Remover otros paréntesis
            
            print(f"DEBUG: Columnas normalizadas: {list(df.columns)}")
            
            # Filtrar filas vacías
            df = df.dropna(how='all')  # Eliminar filas completamente vacías
            
            print(f"DEBUG: Filas después de eliminar vacías: {len(df)}")
            
            if len(df) == 0:
                return {
                    'error': 'El archivo no contiene datos válidos (todas las filas están vacías)',
                    'total_filas': 0,
                    'validos': 0,
                    'invalidos': 0,
                    'con_advertencias': 0,
                    'errores': [],
                    'advertencias': [],
                    'rutas_validas': []
                }
            
            resultados = {
                'total_filas': len(df),
                'validos': 0,
                'invalidos': 0,
                'con_advertencias': 0,
                'errores': [],
                'advertencias': [],
                'rutas_validas': []
            }
            
            # ✅ AGREGAR SEGUIMIENTO DE CÓDIGOS POR RESOLUCIÓN
            codigos_por_resolucion = {}  # {resolucion_normalizada: {codigo_normalizado: fila_num}}
            
            for index, row in df.iterrows():
                fila_num = index + 2  # +2 porque Excel empieza en 1 y tiene header
                
                print(f"DEBUG: Procesando fila {fila_num}: {dict(row)}")
                
                errores_fila = []
                advertencias_fila = []
                
                # Validar fila
                try:
                    errores_fila, advertencias_fila = self._validar_fila_ruta(row, fila_num)
                except Exception as e:
                    errores_fila = [f"Error en validación: {str(e)}"]
                
                # ✅ VALIDAR CÓDIGOS ÚNICOS POR RESOLUCIÓN EN EL EXCEL
                if not errores_fila:  # Solo si no hay errores básicos
                    try:
                        # Obtener datos normalizados
                        resolucion_raw = str(row.get('Resolución', '')).strip() if pd.notna(row.get('Resolución')) else ''
                        codigo_raw = str(row.get('Código Ruta', '')).strip() if pd.notna(row.get('Código Ruta')) else ''
                        
                        if resolucion_raw and codigo_raw:
                            resolucion_normalizada = self._normalizar_resolucion(resolucion_raw)
                            codigo_normalizado = self._normalizar_codigo_ruta(codigo_raw)
                            
                            if resolucion_normalizada and codigo_normalizado:
                                # Verificar si ya existe este código en esta resolución
                                if resolucion_normalizada not in codigos_por_resolucion:
                                    codigos_por_resolucion[resolucion_normalizada] = {}
                                
                                if codigo_normalizado in codigos_por_resolucion[resolucion_normalizada]:
                                    fila_anterior = codigos_por_resolucion[resolucion_normalizada][codigo_normalizado]
                                    errores_fila.append(f"Código de ruta {codigo_normalizado} duplicado en resolución {resolucion_normalizada} (ya usado en fila {fila_anterior})")
                                else:
                                    codigos_por_resolucion[resolucion_normalizada][codigo_normalizado] = fila_num
                    except Exception as e:
                        advertencias_fila.append(f"No se pudo validar unicidad de código: {str(e)}")
                
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
                        print(f"DEBUG: Error al convertir fila {fila_num}: {str(e)}")
                        resultados['validos'] -= 1
                        resultados['invalidos'] += 1
                        codigo_ruta = str(row.get('Código Ruta', 'N/A')).strip()
                        resultados['errores'].append({
                            'fila': fila_num,
                            'codigo_ruta': codigo_ruta,
                            'errores': [f"Error al procesar ruta: {str(e)}"]
                        })
            
            # ✅ AGREGAR RESUMEN DE CÓDIGOS POR RESOLUCIÓN
            print(f"DEBUG: Códigos por resolución encontrados: {codigos_por_resolucion}")
            
            print(f"DEBUG: Resultados finales: {resultados}")
            return resultados
            
        except Exception as e:
            print(f"DEBUG: Error general en validación: {str(e)}")
            import traceback
            traceback.print_exc()
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
        
        # Verificar si es una fila con guiones (ruta cancelada)
        es_ruta_cancelada = self._es_fila_con_guiones(row)
        
        # Obtener datos básicos
        ruc = str(row.get('RUC', '')).strip() if pd.notna(row.get('RUC')) else ''
        resolucion = str(row.get('Resolución', '')).strip() if pd.notna(row.get('Resolución')) else ''
        
        # Validar RUC (requerido)
        if not ruc:
            errores.append("RUC es requerido")
        elif not self._validar_formato_ruc(ruc):
            errores.append(f"Formato de RUC inválido: {ruc}")
        
        # Validar Resolución (requerido)
        if not resolucion:
            errores.append("Resolución es requerida")
        
        # Validar código de ruta (requerido)
        codigo_ruta = str(row.get('Código Ruta', '')).strip() if pd.notna(row.get('Código Ruta')) else ''
        if not codigo_ruta:
            errores.append("Código de ruta es requerido")
        elif not self._validar_formato_codigo_ruta(codigo_ruta):
            errores.append(f"Formato de código de ruta inválido: {codigo_ruta} (debe ser numérico de 1-3 dígitos)")
        
        if es_ruta_cancelada:
            # Para rutas canceladas, solo validar campos básicos y marcar como cancelada
            advertencias.append("Ruta detectada como CANCELADA (contiene guiones)")
            
            # Validar que al menos origen o destino no sean guiones
            origen = str(row.get('Origen', '')).strip() if pd.notna(row.get('Origen')) else ''
            destino = str(row.get('Destino', '')).strip() if pd.notna(row.get('Destino')) else ''
            
            if origen == '-' and destino == '-':
                errores.append("Al menos origen o destino debe estar especificado (no ambos pueden ser guiones)")
        else:
            # Verificar si el estado indica que es una ruta inactiva/cancelada
            estado_temp = str(row.get('Estado', 'ACTIVA')).strip().upper() if pd.notna(row.get('Estado')) else 'ACTIVA'
            es_estado_inactivo = estado_temp in ['INACTIVA', 'CANCELADA']
            
            if es_estado_inactivo:
                # Para rutas con estado INACTIVA/CANCELADA, ser más flexible con validaciones
                advertencias.append(f"Ruta con estado {estado_temp} - validaciones relajadas")
                
                # Validar origen (más flexible para rutas inactivas)
                origen = str(row.get('Origen', '')).strip() if pd.notna(row.get('Origen')) else ''
                if not origen:
                    advertencias.append("Origen no especificado para ruta inactiva")
                
                # Validar destino (más flexible para rutas inactivas)
                destino = str(row.get('Destino', '')).strip() if pd.notna(row.get('Destino')) else ''
                if not destino:
                    advertencias.append("Destino no especificado para ruta inactiva")
                elif origen == destino:
                    advertencias.append("Origen y destino son iguales")
                
                # Validar frecuencia (más flexible para rutas inactivas)
                frecuencia = str(row.get('Frecuencia', '')).strip() if pd.notna(row.get('Frecuencia')) else ''
                if not frecuencia:
                    advertencias.append("Frecuencia no especificada para ruta inactiva")
            else:
                # Validación normal para rutas activas
                # Validar origen (requerido)
                origen = str(row.get('Origen', '')).strip() if pd.notna(row.get('Origen')) else ''
                if not origen:
                    errores.append("Origen es requerido")
                
                # Validar destino (requerido)
                destino = str(row.get('Destino', '')).strip() if pd.notna(row.get('Destino')) else ''
                if not destino:
                    errores.append("Destino es requerido")
                elif origen == destino:
                    advertencias.append("Origen y destino son iguales")
                
                # Validar frecuencia (requerido)
                frecuencia = str(row.get('Frecuencia', '')).strip() if pd.notna(row.get('Frecuencia')) else ''
                if not frecuencia:
                    errores.append("Frecuencia es requerida")
        
        # Validar itinerario (opcional)
        itinerario = str(row.get('Itinerario', '')).strip() if pd.notna(row.get('Itinerario')) else ''
        if not itinerario:
            if es_ruta_cancelada:
                advertencias.append("Itinerario no especificado para ruta cancelada, se usará 'RUTA CANCELADA'")
            else:
                advertencias.append("Itinerario no especificado, se usará 'SIN ITINERARIO'")
        
        # Validar campos opcionales - Solo usar por defecto si está vacío
        tipo_ruta_raw = str(row.get('Tipo Ruta', '')).strip().upper() if pd.notna(row.get('Tipo Ruta')) else ''
        tipo_ruta = tipo_ruta_raw if tipo_ruta_raw else 'INTERREGIONAL'  # Solo por defecto si está vacío
        
        if tipo_ruta and tipo_ruta not in [e.value for e in TipoRuta]:
            errores.append(f"Tipo de ruta inválido: {tipo_ruta}. Valores válidos: {', '.join([e.value for e in TipoRuta])}")
        
        tipo_servicio = str(row.get('Tipo Servicio', 'PASAJEROS')).strip().upper() if pd.notna(row.get('Tipo Servicio')) else 'PASAJEROS'
        if tipo_servicio and tipo_servicio not in [e.value for e in TipoServicio]:
            errores.append(f"Tipo de servicio inválido: {tipo_servicio}. Valores válidos: {', '.join([e.value for e in TipoServicio])}")
        
        estado = str(row.get('Estado', 'ACTIVA')).strip().upper() if pd.notna(row.get('Estado')) else 'ACTIVA'
        # Normalizar CANCELADA a INACTIVA
        if estado == 'CANCELADA':
            estado = 'INACTIVA'
            advertencias.append("Estado 'CANCELADA' normalizado a 'INACTIVA'")
        
        if estado and estado not in [e.value for e in EstadoRuta]:
            errores.append(f"Estado inválido: {estado}. Valores válidos: {', '.join([e.value for e in EstadoRuta])}")
        
        # Validar campos numéricos opcionales
        distancia = row.get('Distancia')
        if pd.notna(distancia) and distancia != '':
            try:
                float(distancia)
            except:
                errores.append(f"Distancia debe ser un número: {distancia}")
        
        tarifa = row.get('Tarifa Base')
        if pd.notna(tarifa) and tarifa != '':
            try:
                float(tarifa)
            except:
                errores.append(f"Tarifa base debe ser un número: {tarifa}")
        
        return errores, advertencias
    
    def _validar_formato_ruc(self, ruc: str) -> bool:
        """Validar formato de RUC: 11 dígitos"""
        return ruc.isdigit() and len(ruc) == 11
    
    def _normalizar_resolucion(self, resolucion: str) -> str:
        """Normalizar formato de resolución a R-XXXX-YYYY (mínimo 4 dígitos, puede ser 5 o 6)"""
        # ✅ PROTECCIÓN CONTRA VALORES NULOS
        if resolucion is None:
            return ""
        
        # Remover espacios y convertir a mayúsculas
        resolucion = str(resolucion).strip().upper()
        
        # ✅ VERIFICAR QUE NO ESTÉ VACÍO DESPUÉS DEL STRIP
        if not resolucion:
            return ""
        
        # Si ya tiene el formato correcto R-XXXX-YYYY (4+ dígitos), devolverlo
        if re.match(r'^R-\d{4,6}-\d{4}$', resolucion):
            return resolucion
        
        # Si tiene formato XXXX-YYYY (4+ dígitos sin R-), agregar R-
        if re.match(r'^\d{4,6}-\d{4}$', resolucion):
            return f"R-{resolucion}"
        
        # Si tiene formato R-XXX-YYYY (3 dígitos), convertir a 4 dígitos
        match = re.match(r'^R-(\d{3})-(\d{4})$', resolucion)
        if match:
            return f"R-0{match.group(1)}-{match.group(2)}"
        
        # Si tiene formato XXX-YYYY (3 dígitos), convertir a R-0XXX-YYYY
        match = re.match(r'^(\d{3})-(\d{4})$', resolucion)
        if match:
            return f"R-0{match.group(1)}-{match.group(2)}"
        
        # Si tiene formato R-XX-YYYY (2 dígitos), convertir a 4 dígitos
        match = re.match(r'^R-(\d{2})-(\d{4})$', resolucion)
        if match:
            return f"R-00{match.group(1)}-{match.group(2)}"
        
        # Si tiene formato XX-YYYY (2 dígitos), convertir a R-00XX-YYYY
        match = re.match(r'^(\d{2})-(\d{4})$', resolucion)
        if match:
            return f"R-00{match.group(1)}-{match.group(2)}"
        
        # Si tiene formato R-X-YYYY (1 dígito), convertir a 4 dígitos
        match = re.match(r'^R-(\d{1})-(\d{4})$', resolucion)
        if match:
            return f"R-000{match.group(1)}-{match.group(2)}"
        
        # Si tiene formato X-YYYY (1 dígito), convertir a R-000X-YYYY
        match = re.match(r'^(\d{1})-(\d{4})$', resolucion)
        if match:
            return f"R-000{match.group(1)}-{match.group(2)}"
        
        # Si no coincide con ningún patrón, devolver tal como está
        return resolucion
    
    def _es_fila_con_guiones(self, row: pd.Series) -> bool:
        """Detectar si una fila contiene guiones indicando ruta cancelada"""
        # Verificar si los campos principales contienen solo guiones
        origen = str(row.get('Origen', '')).strip() if pd.notna(row.get('Origen')) else ''
        destino = str(row.get('Destino', '')).strip() if pd.notna(row.get('Destino')) else ''
        frecuencia = str(row.get('Frecuencia', '')).strip() if pd.notna(row.get('Frecuencia')) else ''
        
        # Si origen, destino o frecuencia son solo guiones, es una ruta cancelada
        return origen == '-' or destino == '-' or frecuencia == '-'
    
    def _normalizar_campo_con_guion(self, valor: str, campo_nombre: str) -> str:
        """Normalizar campos que contienen guiones"""
        # ✅ PROTECCIÓN CONTRA VALORES NULOS
        if valor is None:
            valor = ''
        else:
            valor = str(valor).strip() if pd.notna(valor) else ''
            
        if valor == '-':
            if campo_nombre in ['origen', 'destino']:
                return 'SIN ESPECIFICAR'
            elif campo_nombre == 'frecuencia':
                return 'CANCELADA'
            elif campo_nombre == 'itinerario':
                return 'RUTA CANCELADA'
        
        return valor
    def _validar_formato_codigo_ruta(self, codigo: str) -> bool:
        """Validar formato de código de ruta: debe ser numérico para normalizar a 2 dígitos"""
        # Limpiar el código primero
        codigo = str(codigo).strip()
        
        # Si es un número flotante como "1.0", extraer la parte entera
        if '.' in codigo and codigo.replace('.', '').isdigit():
            try:
                numero = float(codigo)
                if numero == int(numero):  # Es un entero representado como float
                    codigo = str(int(numero))
            except:
                pass
        
        return codigo.isdigit() and 1 <= len(codigo) <= 3
    
    def _normalizar_codigo_ruta(self, codigo: str) -> str:
        """Normalizar código de ruta a formato de 2 dígitos (01, 02, 03, etc.)"""
        # ✅ PROTECCIÓN CONTRA VALORES NULOS
        if codigo is None:
            return ""
        
        codigo = str(codigo).strip()
        
        # ✅ VERIFICAR QUE NO ESTÉ VACÍO DESPUÉS DEL STRIP
        if not codigo:
            return ""
        
        # ✅ MANEJAR NÚMEROS FLOTANTES COMO "1.0", "2.0"
        if '.' in codigo and codigo.replace('.', '').isdigit():
            try:
                numero = float(codigo)
                if numero == int(numero):  # Es un entero representado como float
                    codigo = str(int(numero))
            except:
                pass
            
        if codigo.isdigit():
            # Convertir a entero y luego formatear con 2 dígitos mínimo
            numero = int(codigo)
            return f"{numero:02d}"  # Formato con 2 dígitos, rellenando con 0 si es necesario
        return codigo
    
    def _convertir_fila_a_ruta(self, row: pd.Series) -> Dict[str, Any]:
        """Convertir fila de Excel a datos de ruta"""
        
        # Verificar si es una ruta cancelada
        es_ruta_cancelada = self._es_fila_con_guiones(row)
        
        # Datos básicos - VALIDAR QUE NO ESTÉN VACÍOS
        ruc_raw = row.get('RUC', '')
        resolucion_raw = row.get('Resolución', '')
        codigo_raw = row.get('Código Ruta', '')
        
        # Convertir a string y limpiar, manejando números flotantes
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
        
        # ✅ VALIDACIÓN OBLIGATORIA - NO CREAR RUTAS CON DATOS VACÍOS
        if not ruc:
            raise ValueError("RUC es obligatorio y no puede estar vacío")
        if not resolucion:
            raise ValueError("Resolución es obligatoria y no puede estar vacía")
        if not codigo_ruta:
            raise ValueError("Código de ruta es obligatorio y no puede estar vacío")
        
        # Normalizar campos que pueden tener guiones
        origen = self._normalizar_campo_con_guion(row.get('Origen', ''), 'origen')
        destino = self._normalizar_campo_con_guion(row.get('Destino', ''), 'destino')
        frecuencia = self._normalizar_campo_con_guion(row.get('Frecuencia', ''), 'frecuencia')
        
        # ✅ VALIDAR CAMPOS OBLIGATORIOS ADICIONALES
        if not origen or origen == 'nan':
            raise ValueError("Origen es obligatorio y no puede estar vacío")
        if not destino or destino == 'nan':
            raise ValueError("Destino es obligatorio y no puede estar vacío")
        if not frecuencia or frecuencia == 'nan':
            raise ValueError("Frecuencia es obligatoria y no puede estar vacía")
        
        itinerario_excel = self._normalizar_campo_con_guion(row.get('Itinerario', ''), 'itinerario') if pd.notna(row.get('Itinerario')) else ''
        
        # Campos opcionales - Solo usar por defecto si están vacíos
        tipo_ruta_raw = str(row.get('Tipo Ruta', '')).strip().upper() if pd.notna(row.get('Tipo Ruta')) else ''
        tipo_ruta = tipo_ruta_raw if tipo_ruta_raw else 'INTERREGIONAL'  # Solo por defecto si está vacío
        
        tipo_servicio = str(row.get('Tipo Servicio', 'PASAJEROS')).strip().upper() if pd.notna(row.get('Tipo Servicio')) else 'PASAJEROS'
        estado = str(row.get('Estado', 'ACTIVA')).strip().upper() if pd.notna(row.get('Estado')) else 'ACTIVA'
        
        # Si es ruta cancelada, forzar estado a INACTIVA
        if es_ruta_cancelada:
            estado = 'INACTIVA'
        
        # Normalizar CANCELADA a INACTIVA
        if estado == 'CANCELADA':
            estado = 'INACTIVA'
        
        tiempo_estimado = str(row.get('Tiempo Estimado', '')).strip() if pd.notna(row.get('Tiempo Estimado')) else None
        observaciones = str(row.get('Observaciones', '')).strip() if pd.notna(row.get('Observaciones')) else None
        
        # Agregar observación para rutas canceladas
        if es_ruta_cancelada:
            obs_cancelada = "Ruta cancelada (importada con guiones)"
            if observaciones:
                observaciones = f"{obs_cancelada}. {observaciones}"
            else:
                observaciones = obs_cancelada
        
        # Campos numéricos
        distancia = None
        if pd.notna(row.get('Distancia')) and row.get('Distancia') != '':
            try:
                distancia = float(row.get('Distancia'))
            except:
                pass
        
        tarifa_base = None
        if pd.notna(row.get('Tarifa Base')) and row.get('Tarifa Base') != '':
            try:
                tarifa_base = float(row.get('Tarifa Base'))
            except:
                pass
        
        # Normalizar resolución y código de ruta
        resolucion_normalizada = self._normalizar_resolucion(resolucion)
        codigo_normalizado = self._normalizar_codigo_ruta(codigo_ruta)
        
        # Crear nombre de ruta - Manejar itinerarios vacíos
        if es_ruta_cancelada and not itinerario_excel:
            itinerario = "RUTA CANCELADA"
        elif itinerario_excel and itinerario_excel.strip():
            itinerario = itinerario_excel
        else:
            # Si itinerario está vacío, usar "SIN ITINERARIO"
            itinerario = "SIN ITINERARIO"
        
        return {
            'ruc': ruc,
            'resolucionNormalizada': resolucion_normalizada,
            'codigoRuta': codigo_normalizado,
            'origen': origen,
            'destino': destino,
            'itinerario': itinerario,
            'frecuencia': frecuencia,
            'tipoRuta': tipo_ruta,
            'tipoServicio': tipo_servicio,
            'estado': estado,
            'distancia': distancia,
            'tiempoEstimado': tiempo_estimado,
            'tarifaBase': tarifa_base,
            'observaciones': observaciones,
            'esCancelada': es_ruta_cancelada
        }
        if estado == 'CANCELADA':
            estado = 'INACTIVA'
        
        tiempo_estimado = str(row.get('Tiempo Estimado', '')).strip() if pd.notna(row.get('Tiempo Estimado')) else None
        observaciones = str(row.get('Observaciones', '')).strip() if pd.notna(row.get('Observaciones')) else None
        
        # Agregar observación para rutas canceladas
        if es_ruta_cancelada:
            obs_cancelada = "Ruta cancelada (importada con guiones)"
            if observaciones:
                observaciones = f"{obs_cancelada}. {observaciones}"
            else:
                observaciones = obs_cancelada
        
        # Campos numéricos
        distancia = None
        if pd.notna(row.get('Distancia')) and row.get('Distancia') != '':
            try:
                distancia = float(row.get('Distancia'))
            except:
                pass
        
        tarifa_base = None
        if pd.notna(row.get('Tarifa Base')) and row.get('Tarifa Base') != '':
            try:
                tarifa_base = float(row.get('Tarifa Base'))
            except:
                pass
        
        # Normalizar resolución y código de ruta
        resolucion_normalizada = self._normalizar_resolucion(resolucion)
        codigo_normalizado = self._normalizar_codigo_ruta(codigo_ruta)
        
        # Crear nombre de ruta - Manejar itinerarios vacíos
        if es_ruta_cancelada and not itinerario_excel:
            itinerario = "RUTA CANCELADA"
        elif itinerario_excel and itinerario_excel.strip():
            itinerario = itinerario_excel
        else:
            # Si itinerario está vacío, usar "SIN ITINERARIO"
            itinerario = "SIN ITINERARIO"
        
        return {
            'ruc': ruc,
            'resolucionNormalizada': resolucion_normalizada,
            'codigoRuta': codigo_normalizado,
            'origen': origen,
            'destino': destino,
            'itinerario': itinerario,
            'frecuencia': frecuencia,
            'tipoRuta': tipo_ruta,
            'tipoServicio': tipo_servicio,
            'estado': estado,
            'distancia': distancia,
            'tiempoEstimado': tiempo_estimado,
            'tarifaBase': tarifa_base,
            'observaciones': observaciones,
            'esCancelada': es_ruta_cancelada
        }