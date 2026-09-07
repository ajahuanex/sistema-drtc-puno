"""
Servicio para carga masiva de rutas desde archivos Excel
"""
import re
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
    LocalidadItinerario,
    EmpresaEmbebida,
    ResolucionEmbebida,
    FrecuenciaServicio,
    TipoFrecuencia,
    crear_frecuencia_diaria
)
from app.utils.validacion_binaria import ValidacionBinaria
from app.utils.buscar_localidad import buscar_localidad_por_nombre

# Constantes de nombres de columnas flexibles
KEYS_RUC = ['RUC_ASOCIADA', 'RUC', 'RUC_EMPRESA', 'RUC EMPRESA', 'RUC_ASOCIADO']
KEYS_RESOLUCION = [
    'RESOLUCION_ASOCIADA', 'Resolución', 'Resolucion', 'RESOLUCION',
    'NRO_RESOLUCION', 'Resolución Primigenia', 'RESOLUCION_PRIMIGENIA',
    'RES_PRIMIGENIA', 'NRO_RES', 'NRO RESOLUCION', 'NUMERO_RESOLUCION',
    'RESOLUCION PRIMIGENIA', 'RES. PRIMIGENIA'
]
KEYS_CODIGO_RUTA = [
    'RUTA_NUMERO', 'ID_RUTA', 'Código Ruta', 'Codigo Ruta', 'CODIGO_RUTA',
    'NUMERO_RUTA', 'ID', 'CODIGO', 'CÓDIGO', 'RUTA', 'NRO', 'Nº', 'N°',
    'COD', 'ITEM', 'COD_RUTA', 'NRO_RUTA', 'Nº RUTA', 'N° RUTA',
    'CODIGO DE RUTA', 'CÓDIGO DE RUTA'
]
KEYS_ESTADO = ['ESTADO_RUTA', 'Estado', 'ESTADO', 'CONDICION', 'CONDICIÓN']



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
        print("[LOG] DEBUG PROCESAMIENTO: Iniciando procesamiento de carga masiva")
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
                print(f"[LOG] DEBUG PROCESAMIENTO: Procesando ruta con RUC {ruta_data.get('ruc')} y código {ruta_data.get('codigoRuta')}")
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
                        'fila': ruta_data.get('fila', 'N/A'),  # [LOG] NUEVO: Incluir número de fila
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
            fila_num = ruta_data.get('fila', 'N/A')
            print(f"[LOG] Procesando fila {fila_num}: {ruta_data['codigoRuta']} - {ruta_data['origen']} -> {ruta_data['destino']}")
            
            from app.services.ruta_service import RutaService
            
            # Buscar empresa por RUC
            empresa = await self.empresas_collection.find_one({
                "ruc": ruta_data['ruc'],
                "estaActivo": True
            })
            
            # [LOG] CAMBIO: No rechazar si no encuentra empresa, marcar en validacionBinaria
            empresa_embebida = None
            empresa_validada = False
            
            if empresa:
                print(f"[LOG] DEBUG: Empresa encontrada - ID: {empresa.get('_id')}, RUC: {empresa.get('ruc')}")
                
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
                empresa_validada = True
            else:
                print(f"[LOG] WARNING: Empresa con RUC {ruta_data['ruc']} no encontrada - creando embebido temporal")
                # Crear empresa embebida temporal con datos del Excel
                empresa_embebida = EmpresaEmbebida(
                    id="",  # Sin ID indica que no está en BD
                    ruc=ruta_data['ruc'],
                    razonSocial=ruta_data.get('razonSocial', 'Empresa por validar')
                )
                empresa_validada = False
            
            # Buscar resolución por número (sin validar tipo, ya que viene del usuario)
            # Intentar búsqueda con normalización
            resolucion = await self.resoluciones_collection.find_one({
                "nroResolucion": ruta_data['resolucionNormalizada'],
                "estaActivo": True
            })
            
            # Si no encuentra, intentar variaciones
            if not resolucion:
                # Intentar sin el prefijo R-
                resolucion_sin_prefijo = ruta_data['resolucionNormalizada'].replace('R-', '')
                resolucion = await self.resoluciones_collection.find_one({
                    "nroResolucion": resolucion_sin_prefijo,
                    "estaActivo": True
                })
            
            # Si aún no encuentra, hacer búsqueda más flexible (contains)
            if not resolucion:
                resolucion = await self.resoluciones_collection.find_one({
                    "nroResolucion": {"$regex": ruta_data['resolucionNormalizada'].replace('R-', ''), "$options": "i"},
                    "estaActivo": True
                })
            
            print(f"[LOG] DEBUG: Resultado búsqueda resolución: {resolucion is not None}")
            
            # [LOG] CAMBIO: No rechazar si no encuentra resolución, marcar en validacionBinaria
            resolucion_embebida = None
            resolucion_validada = False
            
            if not resolucion:
                print(f"[LOG] WARNING: Resolución {ruta_data['resolucionNormalizada']} no encontrada - creando embebido temporal")
                # Crear resolución embebida temporal con datos del Excel
                resolucion_embebida = ResolucionEmbebida(
                    id="",  # Sin ID indica que no está en BD
                    nroResolucion=ruta_data['resolucionNormalizada'],
                    tipoResolucion="PADRE",  # Asumir PADRE por defecto
                    estado="VIGENTE"  # Asumir VIGENTE
                )
                resolucion_validada = False
            else:
                # Resolución encontrada, crear embebido con datos reales
                resolucion_embebida = ResolucionEmbebida(
                    id=str(resolucion["_id"]),
                    nroResolucion=resolucion["nroResolucion"],
                    tipoResolucion=resolucion["tipoResolucion"],
                    estado=resolucion["estado"]
                )
                resolucion_validada = True
            
            # Crear empresa embebida
            print(f"[LOG] DEBUG FILA {fila_num}: Empresa embebida preparada con ID: {empresa_embebida.id}")
            
            # Buscar o crear localidades
            print(f"[LOG] DEBUG FILA {fila_num}: Buscando localidad origen: {ruta_data['origen']}")
            origen_localidad = await self._buscar_o_crear_localidad(ruta_data['origen'])
            print(f"[LOG] DEBUG FILA {fila_num}: Origen localidad obtenida: {origen_localidad.get('_id')}")
            print(f"[LOG] DEBUG FILA {fila_num}: Origen coordenadas: {origen_localidad.get('coordenadas')}")
            
            print(f"[LOG] DEBUG FILA {fila_num}: Buscando localidad destino: {ruta_data['destino']}")
            destino_localidad = await self._buscar_o_crear_localidad(ruta_data['destino'])
            print(f"[LOG] DEBUG FILA {fila_num}: Destino localidad obtenida: {destino_localidad.get('_id')}")
            print(f"[LOG] DEBUG FILA {fila_num}: Destino coordenadas: {destino_localidad.get('coordenadas')}")
            
            # Las localidades siempre se validan porque se crean si no existen
            localidades_validadas = True
            
            # Extraer coordenadas válidas
            print(f"[LOG] DEBUG FILA {fila_num}: Extrayendo coordenadas válidas para origen...")
            origen_coords = self._extraer_coordenadas_validas(origen_localidad.get("coordenadas"))
            print(f"[LOG] DEBUG FILA {fila_num}: Origen coordenadas extraídas: {origen_coords}")
            
            print(f"[LOG] DEBUG FILA {fila_num}: Extrayendo coordenadas válidas para destino...")
            destino_coords = self._extraer_coordenadas_validas(destino_localidad.get("coordenadas"))
            print(f"[LOG] DEBUG FILA {fila_num}: Destino coordenadas extraídas: {destino_coords}")
            
            print(f"[LOG] DEBUG FILA {fila_num}: Creando LocalidadEmbebida para origen...")
            
            # [LOG] Construir diccionario dinámicamente, solo con campos que tienen valor
            origen_dict = {
                "id": str(origen_localidad["_id"]),
                "nombre": origen_localidad["nombre"]
            }
            
            # Agregar campos opcionales solo si tienen valor
            if origen_localidad.get("tipo"):
                origen_dict["tipo"] = origen_localidad.get("tipo")
            if origen_localidad.get("ubigeo"):
                origen_dict["ubigeo"] = origen_localidad.get("ubigeo")
            if origen_localidad.get("departamento"):
                origen_dict["departamento"] = origen_localidad.get("departamento")
            if origen_localidad.get("provincia"):
                origen_dict["provincia"] = origen_localidad.get("provincia")
            if origen_localidad.get("distrito"):
                origen_dict["distrito"] = origen_localidad.get("distrito")
            
            # Agregar coordenadas solo si son válidas
            if origen_coords is not None:
                origen_dict["coordenadas"] = origen_coords
            
            print(f"[LOG] DEBUG FILA {fila_num}: Diccionario origen: {origen_dict}")
            origen_embebido = LocalidadEmbebida(**origen_dict)
            print(f"[LOG] DEBUG FILA {fila_num}: LocalidadEmbebida origen creada OK")
            
            print(f"[LOG] DEBUG FILA {fila_num}: Creando LocalidadEmbebida para destino...")
            
            # [LOG] Mismo proceso para destino
            destino_dict = {
                "id": str(destino_localidad["_id"]),
                "nombre": destino_localidad["nombre"]
            }
            
            # Agregar campos opcionales solo si tienen valor
            if destino_localidad.get("tipo"):
                destino_dict["tipo"] = destino_localidad.get("tipo")
            if destino_localidad.get("ubigeo"):
                destino_dict["ubigeo"] = destino_localidad.get("ubigeo")
            if destino_localidad.get("departamento"):
                destino_dict["departamento"] = destino_localidad.get("departamento")
            if destino_localidad.get("provincia"):
                destino_dict["provincia"] = destino_localidad.get("provincia")
            if destino_localidad.get("distrito"):
                destino_dict["distrito"] = destino_localidad.get("distrito")
            
            # Agregar coordenadas solo si son válidas
            if destino_coords is not None:
                destino_dict["coordenadas"] = destino_coords
            
            print(f"[LOG] DEBUG FILA {fila_num}: Diccionario destino: {destino_dict}")
            destino_embebido = LocalidadEmbebida(**destino_dict)
            print(f"[LOG] DEBUG FILA {fila_num}: LocalidadEmbebida destino creada OK")
            
            # Crear frecuencia
            frecuencia = FrecuenciaServicio(
                tipo=TipoFrecuencia.DIARIO,
                cantidad=1,
                dias=[],
                descripcion=ruta_data['frecuencia']
            )
            
            # [LOG] PARSEAR Y VINCULAR ITINERARIO DESDE EL TEXTO DEL EXCEL
            itinerario_texto = ruta_data.get('itinerario', '')
            itinerario_vinculado = []
            
            if itinerario_texto and itinerario_texto != 'SIN ITINERARIO':
                print(f"[LOG] DEBUG FILA {fila_num}: Parseando itinerario: '{itinerario_texto}'")
                
                # Separar por guiones, comas, barras
                paradas_nombres = re.split(r'\s*[-–/,]\s*', itinerario_texto.strip())
                paradas_nombres = [p.strip().upper() for p in paradas_nombres if p.strip() and len(p.strip()) >= 2]
                
                print(f"  Paradas detectadas: {paradas_nombres}")
                
                for orden, nombre_parada in enumerate(paradas_nombres, start=1):
                    # Buscar todas las coincidencias exactas
                    candidatos = await self.localidades_collection.find({
                        "nombre": {"$regex": f"^{re.escape(nombre_parada)}$", "$options": "i"},
                        "estaActiva": True
                    }).to_list(length=None)
                    
                    localidad_parada = None
                    if candidatos:
                        # [LOG] PRIORIDAD CORRECTA: centro_poblado > distrito > provincia
                        # Centros poblados tienen coordenadas exactas, provincias/distritos son centroides
                        PRIORIDAD_TIPO = {
                            "centro_poblado": 0, "CENTRO_POBLADO": 0,
                            "ciudad": 0, "CIUDAD": 0,
                            "distrito": 1, "DISTRITO": 1,
                            "provincia": 2, "PROVINCIA": 2,
                            "otros": 3, "OTROS": 3,
                        }
                        # Filtrar los que tienen coordenadas válidas
                        con_coords = [
                            c for c in candidatos
                            if c.get("coordenadas") and
                               c["coordenadas"].get("latitud") and
                               c["coordenadas"].get("longitud")
                        ]
                        if con_coords:
                            # Ordenar: menor número = mayor prioridad
                            con_coords.sort(key=lambda x: PRIORIDAD_TIPO.get(x.get("tipo", ""), 99))
                            localidad_parada = con_coords[0]
                        else:
                            # Si ninguno tiene coords, usar cualquiera priorizando por tipo
                            candidatos.sort(key=lambda x: PRIORIDAD_TIPO.get(x.get("tipo", ""), 99))
                            localidad_parada = candidatos[0]
                    
                    # Si no hay exacta, buscar parcial con misma lógica de prioridad
                    if not localidad_parada:
                        parciales = await self.localidades_collection.find({
                            "nombre": {"$regex": re.escape(nombre_parada), "$options": "i"},
                            "estaActiva": True
                        }).to_list(length=None)
                        if parciales:
                            PRIORIDAD_TIPO = {
                                "centro_poblado": 0, "CENTRO_POBLADO": 0,
                                "ciudad": 0, "CIUDAD": 0,
                                "distrito": 1, "DISTRITO": 1,
                                "provincia": 2, "PROVINCIA": 2,
                                "otros": 3, "OTROS": 3,
                            }
                            con_coords = [
                                c for c in parciales
                                if c.get("coordenadas") and
                                   c["coordenadas"].get("latitud") and
                                   c["coordenadas"].get("longitud")
                            ]
                            if con_coords:
                                con_coords.sort(key=lambda x: PRIORIDAD_TIPO.get(x.get("tipo", ""), 99))
                                localidad_parada = con_coords[0]
                            else:
                                parciales.sort(key=lambda x: PRIORIDAD_TIPO.get(x.get("tipo", ""), 99))
                                localidad_parada = parciales[0]
                    
                    parada_kwargs = {
                        "id": str(localidad_parada["_id"]) if localidad_parada else "",
                        "nombre": localidad_parada["nombre"] if localidad_parada else nombre_parada,
                        "orden": orden
                    }
                    
                    # Agregar coordenadas si la localidad las tiene
                    if localidad_parada and localidad_parada.get("coordenadas"):
                        coords_raw = localidad_parada["coordenadas"]
                        lat = coords_raw.get("latitud")
                        lng = coords_raw.get("longitud")
                        if lat is not None and lng is not None:
                            parada_kwargs["coordenadas"] = {
                                "latitud": float(lat),
                                "longitud": float(lng)
                            }
                            print(f"    [LOG] Parada {orden}: {nombre_parada} -> coords [{lat}, {lng}]")
                        else:
                            print(f"    [LOG] Parada {orden}: {nombre_parada} -> localidad sin coords")
                    else:
                        print(f"    [LOG] Parada {orden}: {nombre_parada} -> no encontrada en BD (se guardará solo el nombre)")
                    
                    # Agregar campos opcionales si existen
                    for campo in ["tipo", "ubigeo", "departamento", "provincia", "distrito"]:
                        if localidad_parada and localidad_parada.get(campo):
                            parada_kwargs[campo] = localidad_parada[campo]
                    
                    itinerario_vinculado.append(LocalidadItinerario(**parada_kwargs))                
                print(f"  Total paradas procesadas: {len(itinerario_vinculado)}")
            
            # Crear modelo de ruta
            ruta_create = RutaCreate(
                codigoRuta=ruta_data['codigoRuta'],
                nombre=f"{ruta_data['origen']} - {ruta_data['destino']}",
                origen=origen_embebido,
                destino=destino_embebido,
                itinerario=itinerario_vinculado,  # [LOG] Ahora con paradas vinculadas
                empresa=empresa_embebida,
                resolucion=resolucion_embebida,
                frecuencia=frecuencia,
                horarios=[],
                tipoRuta=TipoRuta(ruta_data.get('tipoRuta', 'INTERREGIONAL')),
                tipoServicio=TipoServicio(ruta_data.get('tipoServicio', 'PASAJEROS')),
                estado=EstadoRuta(ruta_data.get('estado', 'ACTIVA')),
                distancia=ruta_data.get('distancia'),
                tiempoEstimado=ruta_data.get('tiempoEstimado'),
                tarifaBase=ruta_data.get('tarifaBase'),
                capacidadMaxima=ruta_data.get('capacidadMaxima'),
                restricciones=[],
                observaciones=ruta_data.get('observaciones'),
                descripcion=ruta_data['itinerario'],  # Mantener el texto original también
                # [LOG] VALIDACIÓN BINARIA basada en datos encontrados
                validacionBinaria=ValidacionBinaria.crear_binaria(
                    ruc_validado=empresa_validada,
                    resolucion_validada=resolucion_validada,
                    localidades_validadas=localidades_validadas
                )
            )
            
            print(f"[LOG] DEBUG: RutaCreate preparada con validacionBinaria: {ruta_create.validacionBinaria}")
            print(f"  - Empresa validada: {empresa_validada}")
            print(f"  - Resolución validada: {resolucion_validada}")
            print(f"  - Localidades validadas: {localidades_validadas}")
            
            # Usar el servicio de rutas para crear
            ruta_service = RutaService(self.db)
            print(f"[LOG] DEBUG: Llamando a ruta_service.create_ruta...")
            resultado = await ruta_service.create_ruta(ruta_create)
            print(f"[LOG] DEBUG: Ruta creada exitosamente con ID: {resultado.id}")
            return resultado
            
        except Exception as e:
            fila_num = ruta_data.get('fila', 'N/A')
            print(f"\n{'='*80}")
            print(f"[LOG] ERROR FILA {fila_num}: {str(e)}")
            print(f"[LOG] ERROR tipo: {type(e).__name__}")
            print(f"[LOG] Datos de la ruta:")
            print(f"   - RUC: {ruta_data.get('ruc')}")
            print(f"   - Resolución: {ruta_data.get('resolucionNormalizada')}")
            print(f"   - Código: {ruta_data.get('codigoRuta')}")
            print(f"   - Origen: {ruta_data.get('origen')}")
            print(f"   - Destino: {ruta_data.get('destino')}")
            print(f"{'='*80}\n")
            import traceback
            print(f"[LOG] Traceback completo:")
            traceback.print_exc()
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
        """
        Buscar localidad existente con prioridad:
        1. Coincidencia exacta con coordenadas, tipo DISTRITO o PROVINCIA
        2. Coincidencia exacta con coordenadas (cualquier tipo)
        3. Coincidencia exacta sin coordenadas
        4. Coincidencia parcial
        5. Crear nueva si no existe
        """
        nombre_upper = nombre_localidad.upper().strip()
        
        # Buscar todas las coincidencias exactas activas
        candidatos = await self.localidades_collection.find({
            "nombre": {"$regex": f"^{re.escape(nombre_upper)}$", "$options": "i"},
            "estaActiva": True
        }).to_list(length=None)
        
        if candidatos:
            # Priorizar localidades con coordenadas válidas
            con_coords = [
                c for c in candidatos
                if c.get("coordenadas") and
                   c["coordenadas"].get("latitud") and
                   c["coordenadas"].get("longitud")
            ]
            
            if con_coords:
                # Entre las que tienen coords, priorizar por tipo
                orden_tipo = {"PROVINCIA": 0, "DISTRITO": 1, "CENTRO_POBLADO": 2}
                con_coords.sort(key=lambda x: orden_tipo.get(x.get("tipo", ""), 99))
                return con_coords[0]
            
            # Si ninguna tiene coords, devolver la primera
            return candidatos[0]
        
        # Detectar tipo automáticamente basado en el prefijo del nombre
        tipo_localidad = self._detectar_tipo_localidad(nombre_localidad)
        print(f"[LOG] TIPO DETECTADO: {nombre_localidad} -> {tipo_localidad}")
        
        # Si no existe, crear nueva localidad con departamento PUNO por defecto
        nueva_localidad = {
            "_id": ObjectId(),
            "nombre": nombre_upper,
            "tipo": tipo_localidad,
            "departamento": "PUNO",
            "provincia": None,
            "distrito": None,
            "ubigeo": None,
            "coordenadas": None,
            "estaActiva": True,
            "fechaRegistro": datetime.utcnow(),
            "fechaActualizacion": datetime.utcnow(),
            "creadoPorCargaMasiva": True,
            "observaciones": f"Localidad creada automáticamente durante carga masiva de rutas. Tipo detectado: {tipo_localidad}"
        }
        
        await self.localidades_collection.insert_one(nueva_localidad)
        return nueva_localidad
    
    def _extraer_coordenadas_validas(self, coordenadas: Any) -> Optional[dict]:
        """
        Extraer coordenadas solo si tienen valores válidos.
        Retorna None si las coordenadas son inválidas o están vacías.
        """
        # print(f"  [LOG] _extraer_coordenadas_validas: Input type: {type(coordenadas)}, value: {coordenadas}")
        
        if coordenadas is None:
            # print(f"  [LOG] Coordenadas is None, returning None")
            return None
        
        # [LOG] NUEVO: Si es un objeto Pydantic/Coordenadas, convertir a dict
        if hasattr(coordenadas, 'model_dump'):
            # print(f"  [LOG] Convirtiendo objeto Pydantic a dict con model_dump()")
            try:
                coordenadas = coordenadas.model_dump()
                # print(f"  [LOG] Convertido a dict: {coordenadas}")
            except Exception as e:
                # print(f"  [LOG] Error en model_dump(): {e}")
                # Intentar con __dict__
                if hasattr(coordenadas, '__dict__'):
                    coordenadas = coordenadas.__dict__
                    # print(f"  [LOG] Convertido con __dict__: {coordenadas}")
        
        # [LOG] NUEVO: Si tiene atributos latitud/longitud pero no es dict, convertir
        if not isinstance(coordenadas, dict):
            if hasattr(coordenadas, 'latitud') and hasattr(coordenadas, 'longitud'):
                # print(f"  [LOG] Convirtiendo objeto con atributos a dict")
                try:
                    coordenadas = {
                        "latitud": getattr(coordenadas, 'latitud'),
                        "longitud": getattr(coordenadas, 'longitud')
                    }
                    # print(f"  [LOG] Convertido a dict: {coordenadas}")
                except Exception as e:
                    # print(f"  [LOG] Error convirtiendo atributos: {e}")
                    return None
            else:
                # print(f"  [LOG] No es dict y no tiene atributos latitud/longitud, returning None")
                return None
        
        latitud = coordenadas.get("latitud")
        longitud = coordenadas.get("longitud")
        
        # print(f"  [LOG] latitud: {latitud} (type: {type(latitud)})")
        # print(f"  [LOG] longitud: {longitud} (type: {type(longitud)})")
        
        # Si ambos son None o no existen, retornar None
        if latitud is None and longitud is None:
            # print(f"  [LOG] Ambos son None, returning None")
            return None
        
        # Si alguno es None, también retornar None (coordenadas incompletas)
        if latitud is None or longitud is None:
            # print(f"  [LOG] Coordenadas incompletas, returning None")
            return None
        
        # Ambos tienen valores, retornar el diccionario
        try:
            result = {
                "latitud": float(latitud),
                "longitud": float(longitud)
            }
            # print(f"  [LOG] Coordenadas válidas extraídas: {result}")
            return result
        except (ValueError, TypeError) as e:
            # print(f"  [LOG] Error convirtiendo coordenadas a float: {e}")
            return None
    
    async def validar_archivo_excel(self, archivo_excel: BytesIO) -> Dict[str, Any]:
        """Validar archivo Excel de rutas"""
        print("[LOG] DEBUG VALIDACIÓN: Iniciando validación de archivo Excel")
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
                        # Intentar leer como CSV si falla Excel
                        try:
                            archivo_excel.seek(0)
                            df = pd.read_csv(archivo_excel, encoding='utf-8')
                            sheet_name_used = 'Archivo CSV (utf-8)'
                        except Exception as e_csv1:
                            try:
                                archivo_excel.seek(0)
                                df = pd.read_csv(archivo_excel, encoding='latin-1')
                                sheet_name_used = 'Archivo CSV (latin-1)'
                            except Exception as e_csv2:
                                return {
                                    'error': f'No se pudo leer el archivo Excel o CSV. Errores: DATOS={str(e1)}, CSV={str(e_csv1)}',
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
            
            # [LOG] AGREGAR SEGUIMIENTO DE CÓDIGOS POR RUC + RESOLUCIÓN + CÓDIGO
            codigos_por_empresa_res = {}  # {(ruc, resolucion_normalizada, codigo_normalizado): fila_num}
            
            # Procesar todas las filas
            for index, row in df.iterrows():
                fila_num = index + 2  # +2 porque Excel empieza en 1 y tiene header
                
                errores_fila = []
                advertencias_fila = []
                
                # Validar fila
                try:
                    errores_fila, advertencias_fila = self._validar_fila_ruta(row, fila_num)
                except Exception as e:
                    errores_fila = [f"Error en validación: {str(e)}"]
                
                # [LOG] VALIDAR CÓDIGOS ÚNICOS POR RUC + RESOLUCIÓN + CÓDIGO EN EL EXCEL (SOLO PARA RUTAS ACTIVAS)
                if not errores_fila:  # Solo si no hay errores básicos
                    try:
                        ruc_raw = self._get_val(row, KEYS_RUC, pos_index=0)
                        resolucion_raw = self._get_val(row, KEYS_RESOLUCION, pos_index=2)
                        codigo_raw = self._get_val(row, KEYS_CODIGO_RUTA, pos_index=3)
                        
                        # Verificar si es una ruta cancelada o inactiva
                        es_cancelada = self._es_fila_con_guiones(row)
                        estado_temp = self._get_val(row, KEYS_ESTADO, 'ACTIVA').upper()
                        es_inactiva_o_cancelada = es_cancelada or estado_temp in ['CANCELADA', 'INACTIVA']
                        
                        # Las rutas CANCELADAS pueden repetirse porque quedan para el histórico
                        if ruc_raw and resolucion_raw and codigo_raw and not es_inactiva_o_cancelada:
                            resolucion_normalizada = self._normalizar_resolucion(resolucion_raw)
                            codigo_normalizado = self._normalizar_codigo_ruta(codigo_raw)
                            clave_unica = (ruc_raw, resolucion_normalizada, codigo_normalizado)
                            
                            if clave_unica in codigos_por_empresa_res:
                                fila_anterior = codigos_por_empresa_res[clave_unica]
                                errores_fila.append(f"Ruta activa duplicada en el archivo: Código '{codigo_normalizado}' para RUC {ruc_raw} y resolución {resolucion_normalizada} (ya usado en fila {fila_anterior})")
                            else:
                                codigos_por_empresa_res[clave_unica] = fila_num
                    except Exception as e:
                        advertencias_fila.append(f"No se pudo validar unicidad de código: {str(e)}")

                
                if errores_fila:
                    resultados['invalidos'] += 1
                    codigo_ruta = self._get_val(row, KEYS_CODIGO_RUTA, default='N/A', pos_index=3)
                    ruc_val = self._get_val(row, KEYS_RUC, default='N/A', pos_index=0)
                    res_val = self._get_val(row, KEYS_RESOLUCION, default='N/A', pos_index=2)
                    orig_val = self._get_val(row, ['RUTA_ORIGEN', 'Origen', 'ORIGEN', 'LOCALIDAD_ORIGEN'], default='N/A')
                    dest_val = self._get_val(row, ['RUTA_DESTINO', 'Destino', 'DESTINO', 'LOCALIDAD_DESTINO'], default='N/A')
                    est_val = self._get_val(row, KEYS_ESTADO, default='ACTIVA')
                    
                    resultados['errores'].append({
                        'fila': fila_num,
                        'codigo_ruta': codigo_ruta,
                        'ruc': ruc_val,
                        'resolucion': res_val,
                        'origen': orig_val,
                        'destino': dest_val,
                        'estado': est_val,
                        'error': ', '.join(errores_fila),
                        'errores': errores_fila
                    })
                else:
                    if advertencias_fila:
                        resultados['con_advertencias'] += 1
                        codigo_ruta = self._get_val(row, KEYS_CODIGO_RUTA, default='N/A', pos_index=3)
                        resultados['advertencias'].append({
                            'fila': fila_num,
                            'codigo_ruta': codigo_ruta,
                            'advertencias': advertencias_fila
                        })
                    
                    resultados['validos'] += 1
                    # Convertir fila a modelo de ruta
                    try:
                        ruta = self._convertir_fila_a_ruta(row, fila_num)
                        resultados['rutas_validas'].append(ruta)
                    except Exception as e:
                        print(f"DEBUG: Error al convertir fila {fila_num}: {str(e)}")
                        resultados['validos'] -= 1
                        resultados['invalidos'] += 1
                        codigo_ruta = self._get_val(row, KEYS_CODIGO_RUTA, default='N/A', pos_index=3)
                        ruc_val = self._get_val(row, KEYS_RUC, default='N/A', pos_index=0)
                        res_val = self._get_val(row, KEYS_RESOLUCION, default='N/A', pos_index=2)
                        orig_val = self._get_val(row, ['RUTA_ORIGEN', 'Origen', 'ORIGEN', 'LOCALIDAD_ORIGEN'], default='N/A')
                        dest_val = self._get_val(row, ['RUTA_DESTINO', 'Destino', 'DESTINO', 'LOCALIDAD_DESTINO'], default='N/A')
                        est_val = self._get_val(row, KEYS_ESTADO, default='ACTIVA')
                        
                        resultados['errores'].append({
                            'fila': fila_num,
                            'codigo_ruta': codigo_ruta,
                            'ruc': ruc_val,
                            'resolucion': res_val,
                            'origen': orig_val,
                            'destino': dest_val,
                            'estado': est_val,
                            'error': f"Error al procesar ruta: {str(e)}",
                            'errores': [f"Error al procesar ruta: {str(e)}"]
                        })


            
            # [LOG] AGREGAR RESUMEN DE CÓDIGOS POR RUC + RESOLUCIÓN
            print(f"DEBUG: Códigos por RUC y resolución encontrados: {codigos_por_empresa_res}")

            
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
    
    def _get_val(self, row: Any, keys: List[str], default: str = "", pos_index: int = None) -> str:
        """Extrae un valor soportando nombres flexibles, cabeceras oficiales de Google Sheets y posición de columna (A=0, B=1, C=2, D=3, etc.)"""
        if isinstance(row, dict):
            d = row
        elif hasattr(row, 'to_dict'):
            d = row.to_dict()
        else:
            try:
                d = dict(row)
            except:
                d = {}

        # Búsqueda directa por clave exacta
        for k in keys:
            if k in d and d[k] is not None and pd.notna(d[k]):
                v = str(d[k]).strip()
                if v and v.lower() not in ['nan', 'none', 'null']:
                    return v

        # Búsqueda normalizada (insensible a mayúsculas, acentos, espacios y guiones)
        norm_map = {}
        for k, v in d.items():
            if pd.notna(v):
                norm_key = re.sub(r'[^A-Z0-9]', '', str(k).upper())
                norm_map[norm_key] = str(v).strip()

        for k in keys:
            norm_search = re.sub(r'[^A-Z0-9]', '', str(k).upper())
            if norm_search in norm_map:
                val = norm_map[norm_search]
                if val and val.lower() not in ['nan', 'none', 'null']:
                    return val

        # Fallback posicional si pos_index fue provisto (ej. D = 3)
        if pos_index is not None:
            try:
                if isinstance(row, pd.Series) and len(row) > pos_index:
                    val_pos = row.iloc[pos_index]
                    if pd.notna(val_pos):
                        v = str(val_pos).strip()
                        if v and v.lower() not in ['nan', 'none', 'null']:
                            return v
                elif hasattr(row, 'values') and len(row.values) > pos_index:
                    val_pos = row.values[pos_index]
                    if pd.notna(val_pos):
                        v = str(val_pos).strip()
                        if v and v.lower() not in ['nan', 'none', 'null']:
                            return v
            except Exception:
                pass

        return default


    def _validar_fila_ruta(self, row: pd.Series, fila_num: int) -> Tuple[List[str], List[str]]:
        """Validar una fila de ruta"""
        errores = []
        advertencias = []
        
        # Verificar si es una fila con guiones (ruta cancelada)
        es_ruta_cancelada = self._es_fila_con_guiones(row)
        
        # Obtener datos básicos con alias flexibles y fallback posicional (A=0, C=2, D=3)
        ruc = self._get_val(row, KEYS_RUC, pos_index=0)
        resolucion = self._get_val(row, KEYS_RESOLUCION, pos_index=2)
        codigo_ruta = self._get_val(row, KEYS_CODIGO_RUTA, pos_index=3)
        
        # Validar RUC (requerido)
        if not ruc:
            errores.append("RUC es requerido")
        elif not self._validar_formato_ruc(ruc):
            errores.append(f"Formato de RUC inválido: {ruc}")
        
        # Validar Resolución (requerido en todas las rutas, incluidas canceladas)
        if not resolucion or not self._validar_formato_resolucion(resolucion):
            errores.append(f"Resolución inválida o con guión ('{resolucion}'). Debe tener estructura válida de resolución (ej: 0123-2026 o R-0123-2026), no se permite '-'")
        
        # Validar código de ruta (requerido)
        if not codigo_ruta:
            errores.append("Código de ruta es requerido")
        elif not self._validar_formato_codigo_ruta(codigo_ruta):
            errores.append(f"Formato de código de ruta inválido: {codigo_ruta} (debe ser numérico de 1-3 dígitos)")
        
        if es_ruta_cancelada:
            # Para rutas canceladas, solo validar campos básicos y marcar como cancelada
            advertencias.append("Ruta detectada como CANCELADA (contiene guiones o estado INACTIVA/CANCELADA)")
            
            origen = self._get_val(row, ['RUTA_ORIGEN', 'Origen', 'ORIGEN', 'LOCALIDAD_ORIGEN'])
            destino = self._get_val(row, ['RUTA_DESTINO', 'Destino', 'DESTINO', 'LOCALIDAD_DESTINO'])
            
            if (origen and destino 
                and origen.strip() not in ['-', '', 'nan', 'null'] 
                and destino.strip() not in ['-', '', 'nan', 'null']
                and origen.strip().upper() == destino.strip().upper()):
                errores.append(f"El origen y destino no pueden ser la misma localidad (ambos son '{origen}')")
        else:
            # Verificar si el estado indica que es una ruta inactiva/cancelada
            estado_temp = self._get_val(row, KEYS_ESTADO, 'ACTIVA').upper()
            es_estado_inactivo = estado_temp in ['INACTIVA', 'CANCELADA']
            
            if es_estado_inactivo:
                advertencias.append(f"Ruta con estado {estado_temp} - validaciones relajadas")
                
                origen = self._get_val(row, ['RUTA_ORIGEN', 'Origen', 'ORIGEN', 'LOCALIDAD_ORIGEN'])
                if not origen:
                    advertencias.append("Origen no especificado para ruta inactiva")
                
                destino = self._get_val(row, ['RUTA_DESTINO', 'Destino', 'DESTINO', 'LOCALIDAD_DESTINO'])
                if not destino:
                    advertencias.append("Destino no especificado para ruta inactiva")
                elif (origen and destino 
                      and origen.strip() not in ['-', '', 'nan', 'null'] 
                      and destino.strip() not in ['-', '', 'nan', 'null']
                      and origen.strip().upper() == destino.strip().upper()):
                    errores.append(f"El origen y destino no pueden ser la misma localidad (ambos son '{origen}')")
                
                frecuencia = self._get_val(row, ['RUTA_FRECUENCIA', 'Frecuencia', 'FRECUENCIA'])
                if not frecuencia:
                    advertencias.append("Frecuencia no especificada para ruta inactiva")
            else:
                origen = self._get_val(row, ['RUTA_ORIGEN', 'Origen', 'ORIGEN', 'LOCALIDAD_ORIGEN'])
                if not origen:
                    errores.append("Origen es requerido")
                
                destino = self._get_val(row, ['RUTA_DESTINO', 'Destino', 'DESTINO', 'LOCALIDAD_DESTINO'])
                if not destino:
                    errores.append("Destino es requerido")
                elif (origen and destino 
                      and origen.strip() not in ['-', '', 'nan', 'null'] 
                      and destino.strip() not in ['-', '', 'nan', 'null']
                      and origen.strip().upper() == destino.strip().upper()):
                    errores.append(f"El origen y destino no pueden ser la misma localidad (ambos son '{origen}')")


                
                frecuencia = self._get_val(row, ['RUTA_FRECUENCIA', 'Frecuencia', 'FRECUENCIA'])
                if not frecuencia:
                    errores.append("Frecuencia es requerida")
        
        # Validar itinerario (opcional)
        itinerario = self._get_val(row, ['RUTA_ITINERARIO', 'Itinerario', 'ITINERARIO', 'TRAMOS'])

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
    
    def _validar_formato_resolucion(self, resolucion: str) -> bool:
        """Validar que la resolución tenga formato estructural válido (ej: 0123-2026, R-0123-2026) y NO sea '-'"""
        if not resolucion:
            return False
        res_clean = str(resolucion).strip()
        if not res_clean or res_clean in ['-', '--', '---', 'NAN', 'NULL', 'NONE']:
            return False
        # Debe contener al menos dígitos numéricos indicando número o año de resolución
        if not re.search(r'\d', res_clean):
            return False
        return True

    def _normalizar_resolucion(self, resolucion: str) -> str:
        """
        Normalizar formato de resolución a R-XXXX-YYYY
        Limpia sufijos institucionales (ej: -DRTC, -GRTC, -MTC, /DRTC, DRTC, etc.)
        """
        if not resolucion or not self._validar_formato_resolucion(resolucion):
            return ""
        
        res_str = str(resolucion).strip().upper()
        
        # Buscar patrón de número y año (ej: 0685-2021-DRTC -> num: 0685, anio: 2021)
        match = re.search(r'(?:R-|\b)(\d{1,6})[-/](\d{4})', res_str)
        if match:
            num_str = match.group(1)
            anio_str = match.group(2)
            # Rellenar con ceros a la izquierda a mínimo 4 dígitos (0685)
            num_formatted = f"{int(num_str):04d}" if len(num_str) <= 4 else num_str
            return f"R-{num_formatted}-{anio_str}"
        
        # Fallback si no coincide con el patrón año 4 dígitos
        if not res_str.startswith('R-'):
            res_str = f"R-{res_str}"
            
        return res_str

    
    def _es_fila_con_guiones(self, row: Any) -> bool:
        """Detectar si una fila contiene guiones o estado CANCELADA/INACTIVA"""
        origen = self._get_val(row, ['RUTA_ORIGEN', 'Origen', 'ORIGEN', 'LOCALIDAD_ORIGEN'])
        destino = self._get_val(row, ['RUTA_DESTINO', 'Destino', 'DESTINO', 'LOCALIDAD_DESTINO'])
        frecuencia = self._get_val(row, ['RUTA_FRECUENCIA', 'Frecuencia', 'FRECUENCIA'])
        estado = self._get_val(row, KEYS_ESTADO)
        
        if estado and estado.upper() in ['CANCELADA', 'INACTIVA']:
            return True
            
        return origen == '-' or destino == '-' or frecuencia == '-'

    
    def _normalizar_campo_con_guion(self, valor: str, campo_nombre: str) -> str:
        """Normalizar campos que contienen guiones"""
        # [LOG] PROTECCIÓN CONTRA VALORES NULOS
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
        """Validar formato de código de ruta (numérico o alfanumérico estándar como 01, R-01, R-101)"""
        if not codigo:
            return False
        codigo_str = str(codigo).strip()
        if not codigo_str:
            return False
        return len(codigo_str) <= 15

    def _normalizar_codigo_ruta(self, codigo: str) -> str:
        """Normalizar código de ruta"""
        if not codigo:
            return ""
        codigo_str = str(codigo).strip()
        
        # Manejar números flotantes como "1.0", "2.0"
        if '.' in codigo_str and codigo_str.replace('.', '').isdigit():
            try:
                numero = float(codigo_str)
                if numero == int(numero):
                    codigo_str = str(int(numero))
            except:
                pass
            
        if codigo_str.isdigit():
            numero = int(codigo_str)
            return f"{numero:02d}"
            
        return codigo_str
    
    def _convertir_fila_a_ruta(self, row: pd.Series, fila_num: int = None) -> Dict[str, Any]:
        """Convertir fila de Excel o Google Sheet a datos de ruta"""
        
        # Verificar si es una ruta cancelada
        es_ruta_cancelada = self._es_fila_con_guiones(row)
        
        # Datos básicos con alias flexibles y fallback posicional (A=0, C=2, D=3)
        ruc = self._get_val(row, KEYS_RUC, pos_index=0)
        resolucion = self._get_val(row, KEYS_RESOLUCION, pos_index=2)
        codigo_ruta = self._get_val(row, KEYS_CODIGO_RUTA, pos_index=3)
        
        # [LOG] VALIDACIÓN OBLIGATORIA
        if not ruc:
            raise ValueError("RUC es obligatorio y no puede estar vacío")
        if not resolucion or not self._validar_formato_resolucion(resolucion):
            raise ValueError(f"Resolución obligatoria con estructura válida (ej: 0123-2026). No se permite '{resolucion}'")
        if not codigo_ruta:
            raise ValueError("Código de ruta es obligatorio y no puede estar vacío")
        
        # Normalizar campos que pueden tener guiones
        origen_raw = self._get_val(row, ['RUTA_ORIGEN', 'Origen', 'ORIGEN', 'LOCALIDAD_ORIGEN'])
        destino_raw = self._get_val(row, ['RUTA_DESTINO', 'Destino', 'DESTINO', 'LOCALIDAD_DESTINO'])
        frecuencia_raw = self._get_val(row, ['RUTA_FRECUENCIA', 'Frecuencia', 'FRECUENCIA'])
        
        origen = self._normalizar_campo_con_guion(origen_raw, 'origen')
        destino = self._normalizar_campo_con_guion(destino_raw, 'destino')
        frecuencia = self._normalizar_campo_con_guion(frecuencia_raw, 'frecuencia')
        
        # [LOG] VALIDAR CAMPOS OBLIGATORIOS ADICIONALES
        if not origen or origen == 'nan':
            raise ValueError("Origen es obligatorio y no puede estar vacío")
        if not destino or destino == 'nan':
            raise ValueError("Destino es obligatorio y no puede estar vacío")
        if not frecuencia or frecuencia == 'nan':
            raise ValueError("Frecuencia es obligatoria y no puede estar vacía")
        
        itinerario_raw = self._get_val(row, ['RUTA_ITINERARIO', 'Itinerario', 'ITINERARIO', 'TRAMOS'])
        itinerario_excel = self._normalizar_campo_con_guion(itinerario_raw, 'itinerario')
        
        # Campos opcionales
        tipo_ruta_raw = self._get_val(row, ['Tipo Ruta', 'TIPO_RUTA', 'TIPO'], '').upper()
        tipo_ruta = tipo_ruta_raw if tipo_ruta_raw else 'INTERREGIONAL'
        
        tipo_servicio_raw = self._get_val(row, ['Tipo Servicio', 'TIPO_SERVICIO'], 'PASAJEROS').upper()
        tipo_servicio = tipo_servicio_raw if tipo_servicio_raw else 'PASAJEROS'
        
        estado_raw = self._get_val(row, KEYS_ESTADO, 'ACTIVA').upper()
        estado = estado_raw if estado_raw else 'ACTIVA'
        
        # Si es ruta cancelada (con guiones) y el estado no fue indicado explícitamente como diferente
        if es_ruta_cancelada and estado_raw in ['', 'ACTIVA']:
            estado = 'CANCELADA'
        
        tiempo_estimado = self._get_val(row, ['Tiempo Estimado', 'TIEMPO_ESTIMADO']) or None
        observaciones = self._get_val(row, ['OBSERVACIONES', 'Observaciones', 'OBSERVACION']) or None
        usuario = self._get_val(row, ['USUARIO', 'Usuario', 'CREADO_POR']) or 'CARGA_MASIVA'
        id_original = self._get_val(row, ['ID_RUTA', 'id_ruta'])
        
        # Agregar observación para rutas canceladas
        if es_ruta_cancelada:
            obs_cancelada = "Ruta cancelada (importada con guiones)"
            if observaciones:
                observaciones = f"{obs_cancelada}. {observaciones}"
            else:
                observaciones = obs_cancelada
        
        # Campos numéricos
        distancia = None
        dist_val = self._get_val(row, ['Distancia', 'DISTANCIA'])
        if dist_val:
            try:
                distancia = float(dist_val)
            except:
                pass
        
        tarifa_base = None
        tarifa_val = self._get_val(row, ['Tarifa Base', 'TARIFA_BASE'])
        if tarifa_val:
            try:
                tarifa_base = float(tarifa_val)
            except:
                pass

        cantidad_vehiculos = None
        cant_veh_val = self._get_val(row, ['CANTIDAD_VEHICULOS_POR_RUTA', 'CANTIDAD_VEHICULOS', 'Capacidad Máxima', 'Capacidad Maxima'])
        if cant_veh_val:
            try:
                cantidad_vehiculos = int(float(cant_veh_val))
            except:
                pass
        
        # Normalizar resolución y código de ruta
        resolucion_normalizada = self._normalizar_resolucion(resolucion)
        codigo_normalizado = self._normalizar_codigo_ruta(codigo_ruta)
        
        # Crear itinerario
        if es_ruta_cancelada and not itinerario_excel:
            itinerario = "RUTA CANCELADA"
        elif itinerario_excel and itinerario_excel.strip():
            itinerario = itinerario_excel
        else:
            itinerario = "SIN ITINERARIO"
        
        metadata = {
            "fuente": "google_sheets_import",
            "usuario": usuario
        }
        if id_original:
            metadata["id_original"] = id_original

        return {
            'fila': fila_num,
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
            'cantidadVehiculos': cantidad_vehiculos,
            'capacidadMaxima': cantidad_vehiculos,
            'observaciones': observaciones,
            'metadata': metadata,
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
            'fila': fila_num,  # [LOG] NUEVO: Agregar número de fila
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
  
  # ========================================
    # MÉTODOS PARA MODO UPSERT
    # ========================================
    
    async def _buscar_ruta_existente(
        self, 
        ruc: str, 
        numero_resolucion: str, 
        codigo_ruta: str
    ) -> Optional[Dict]:
        """
        Buscar ruta existente por la clave única estricta de 3 partes:
        RUC + Resolución + Código de Ruta
        """
        try:
            if not ruc or not codigo_ruta or not numero_resolucion:
                return None
                
            # 1. Búsqueda directa por RUC + Resolución + Código de Ruta en el objeto embebido
            ruta = await self.rutas_collection.find_one({
                "empresa.ruc": ruc,
                "resolucion.nroResolucion": numero_resolucion,
                "codigoRuta": codigo_ruta,
                "estaActivo": True
            })
            if ruta:
                print(f"[LOG] UPSERT: Ruta encontrada por RUC + Res. + Código - ID: {ruta.get('_id')}")
                return ruta
                
            # 1b. Probar sin prefijo R-
            res_sin_r = numero_resolucion.replace('R-', '')
            ruta = await self.rutas_collection.find_one({
                "empresa.ruc": ruc,
                "resolucion.nroResolucion": res_sin_r,
                "codigoRuta": codigo_ruta,
                "estaActivo": True
            })
            if ruta:
                print(f"[LOG] UPSERT: Ruta encontrada por RUC + Res(sin R) + Código - ID: {ruta.get('_id')}")
                return ruta

            print(f"[LOG] UPSERT: Ruta no encontrada - RUC: {ruc}, Res: {numero_resolucion}, Código: {codigo_ruta}")
            return None
            
        except Exception as e:
            print(f"[LOG] ERROR en _buscar_ruta_existente: {str(e)}")
            return None


    
    async def _upsert_ruta_desde_datos(
        self, 
        ruta_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Crear o actualizar ruta según exista o no (UPSERT)
        
        Args:
            ruta_data: Datos de la ruta del Excel
            
        Returns:
            {
                'accion': 'creada' | 'actualizada',
                'ruta': Ruta,
                'cambios': List[str]
            }
        """
        try:
            # Buscar ruta existente por clave única
            ruta_existente = await self._buscar_ruta_existente(
                ruc=ruta_data['ruc'],
                numero_resolucion=ruta_data['resolucionNormalizada'],
                codigo_ruta=ruta_data['codigoRuta']
            )
            
            if ruta_existente:
                # ACTUALIZAR ruta existente
                print(f"[LOG] UPSERT: Actualizando ruta existente - Código: {ruta_data['codigoRuta']}")
                
                # Preparar datos de actualización
                ruta_update = await self._preparar_datos_actualizacion(
                    ruta_data, 
                    ruta_existente
                )
                
                # Actualizar en la base de datos
                from app.services.ruta_service import RutaService
                from app.models.ruta import RutaUpdate
                
                ruta_service = RutaService(self.db)
                ruta_actualizada = await ruta_service.update_ruta(
                    str(ruta_existente["_id"]),
                    ruta_update
                )
                
                # Detectar qué campos cambiaron
                cambios = self._detectar_cambios(ruta_existente, ruta_update)
                
                print(f"[LOG] UPSERT: Ruta actualizada - Cambios: {len(cambios)}")
                
                return {
                    'accion': 'actualizada',
                    'ruta': ruta_actualizada,
                    'cambios': cambios
                }
            else:
                # CREAR ruta nueva
                print(f"✨ UPSERT: Creando ruta nueva - Código: {ruta_data['codigoRuta']}")
                
                ruta_creada = await self._crear_ruta_desde_datos(ruta_data)
                
                return {
                    'accion': 'creada',
                    'ruta': ruta_creada,
                    'cambios': []
                }
                
        except Exception as e:
            print(f"[LOG] ERROR en _upsert_ruta_desde_datos: {str(e)}")
            raise e
    
    async def _preparar_datos_actualizacion(
        self,
        ruta_data: Dict[str, Any],
        ruta_existente: Dict[str, Any]
    ):
        """
        Preparar objeto RutaUpdate con los nuevos datos
        
        Args:
            ruta_data: Datos nuevos del Excel
            ruta_existente: Ruta existente en la BD
            
        Returns:
            RutaUpdate con los datos a actualizar
        """
        from app.models.ruta import RutaUpdate
        
        # Buscar o crear localidades
        origen_localidad = await self._buscar_o_crear_localidad(ruta_data['origen'])
        destino_localidad = await self._buscar_o_crear_localidad(ruta_data['destino'])
        
        # Extraer coordenadas válidas
        origen_coords = self._extraer_coordenadas_validas(origen_localidad.get("coordenadas"))
        destino_coords = self._extraer_coordenadas_validas(destino_localidad.get("coordenadas"))
        
        # Crear objetos embebidos con construcción dinámica
        origen_dict = {
            "id": str(origen_localidad["_id"]),
            "nombre": origen_localidad["nombre"]
        }
        if origen_localidad.get("tipo"):
            origen_dict["tipo"] = origen_localidad.get("tipo")
        if origen_localidad.get("departamento"):
            origen_dict["departamento"] = origen_localidad.get("departamento")
        if origen_coords is not None:
            origen_dict["coordenadas"] = origen_coords
        
        origen_embebido = LocalidadEmbebida(**origen_dict)
        
        destino_dict = {
            "id": str(destino_localidad["_id"]),
            "nombre": destino_localidad["nombre"]
        }
        if destino_localidad.get("tipo"):
            destino_dict["tipo"] = destino_localidad.get("tipo")
        if destino_localidad.get("departamento"):
            destino_dict["departamento"] = destino_localidad.get("departamento")
        if destino_coords is not None:
            destino_dict["coordenadas"] = destino_coords
        
        destino_embebido = LocalidadEmbebida(**destino_dict)
        
        # Crear frecuencia
        frecuencia = FrecuenciaServicio(
            tipo=TipoFrecuencia.DIARIO,
            cantidad=1,
            dias=[],
            descripcion=ruta_data['frecuencia']
        )
        
        # Crear objeto de actualización
        ruta_update = RutaUpdate(
            nombre=f"{ruta_data['origen']} - {ruta_data['destino']}",
            origen=origen_embebido,
            destino=destino_embebido,
            frecuencia=frecuencia,
            tipoRuta=TipoRuta(ruta_data.get('tipoRuta', 'INTERREGIONAL')) if ruta_data.get('tipoRuta') else None,
            tipoServicio=TipoServicio(ruta_data.get('tipoServicio', 'PASAJEROS')) if ruta_data.get('tipoServicio') else None,
            estado=EstadoRuta(ruta_data.get('estado')) if ruta_data.get('estado') else None,
            distancia=ruta_data.get('distancia'),
            tiempoEstimado=ruta_data.get('tiempoEstimado'),
            tarifaBase=ruta_data.get('tarifaBase'),
            observaciones=ruta_data.get('observaciones'),
            descripcion=ruta_data.get('itinerario', 'SIN ITINERARIO')
        )
        
        return ruta_update
    
    def _detectar_cambios(
        self,
        ruta_anterior: Dict[str, Any],
        ruta_nueva
    ) -> List[str]:
        """
        Detectar qué campos cambiaron entre la ruta anterior y la nueva
        
        Args:
            ruta_anterior: Ruta existente en la BD
            ruta_nueva: RutaUpdate con los nuevos datos
            
        Returns:
            Lista de descripciones de cambios
        """
        cambios = []
        
        try:
            # Comparar origen
            if ruta_nueva.origen:
                origen_anterior = ruta_anterior.get('origen', {}).get('nombre', '')
                if ruta_nueva.origen.nombre != origen_anterior:
                    cambios.append(f"Origen: {origen_anterior} → {ruta_nueva.origen.nombre}")
            
            # Comparar destino
            if ruta_nueva.destino:
                destino_anterior = ruta_anterior.get('destino', {}).get('nombre', '')
                if ruta_nueva.destino.nombre != destino_anterior:
                    cambios.append(f"Destino: {destino_anterior} → {ruta_nueva.destino.nombre}")
            
            # Comparar frecuencia
            if ruta_nueva.frecuencia:
                frecuencia_anterior = ruta_anterior.get('frecuencia', {}).get('descripcion', '')
                if ruta_nueva.frecuencia.descripcion != frecuencia_anterior:
                    cambios.append(f"Frecuencia: {frecuencia_anterior} → {ruta_nueva.frecuencia.descripcion}")
            
            # Comparar tipo de ruta
            if ruta_nueva.tipoRuta:
                tipo_anterior = ruta_anterior.get('tipoRuta', '')
                tipo_val = ruta_nueva.tipoRuta.value if hasattr(ruta_nueva.tipoRuta, 'value') else str(ruta_nueva.tipoRuta)
                if tipo_val != tipo_anterior:
                    cambios.append(f"Tipo: {tipo_anterior} → {tipo_val}")
            
            # Comparar tipo de servicio
            if ruta_nueva.tipoServicio:
                servicio_anterior = ruta_anterior.get('tipoServicio', '')
                servicio_val = ruta_nueva.tipoServicio.value if hasattr(ruta_nueva.tipoServicio, 'value') else str(ruta_nueva.tipoServicio)
                if servicio_val != servicio_anterior:
                    cambios.append(f"Servicio: {servicio_anterior} → {servicio_val}")

            # Comparar estado
            if ruta_nueva.estado:
                estado_anterior = ruta_anterior.get('estado', '')
                estado_val = ruta_nueva.estado.value if hasattr(ruta_nueva.estado, 'value') else str(ruta_nueva.estado)
                if estado_val != estado_anterior:
                    cambios.append(f"Estado: {estado_anterior} → {estado_val}")

            
            # Comparar distancia
            if ruta_nueva.distancia is not None:
                distancia_anterior = ruta_anterior.get('distancia')
                if distancia_anterior != ruta_nueva.distancia:
                    cambios.append(f"Distancia: {distancia_anterior} km → {ruta_nueva.distancia} km")
            
            # Comparar observaciones
            if ruta_nueva.observaciones:
                obs_anterior = ruta_anterior.get('observaciones', '')
                if ruta_nueva.observaciones != obs_anterior:
                    cambios.append("Observaciones actualizadas")
            
            # Comparar descripción/itinerario
            if ruta_nueva.descripcion:
                desc_anterior = ruta_anterior.get('descripcion', '')
                if ruta_nueva.descripcion != desc_anterior:
                    cambios.append("Itinerario actualizado")
            
        except Exception as e:
            print(f"[LOG] Error detectando cambios: {str(e)}")
        
        return cambios
    
    async def procesar_carga_masiva_con_modo(
        self, 
        archivo_excel: BytesIO, 
        modo: str = "crear"
    ) -> Dict[str, Any]:
        """
        Procesar carga masiva de rutas con modo específico
        
        Args:
            archivo_excel: Archivo Excel con las rutas
            modo: Modo de procesamiento ("crear", "actualizar", "upsert")
            
        Returns:
            Resultados del procesamiento con estadísticas
        """
        print(f"[LOG] DEBUG PROCESAMIENTO: Iniciando en modo '{modo}'")
        
        try:
            # Validar archivo primero
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
                'modo': modo,
                'total_procesadas': 0,
                'exitosas': 0,
                'fallidas': 0,
                'creadas': 0,
                'actualizadas': 0,
                'rutas_creadas': [],
                'rutas_actualizadas': [],
                'errores_procesamiento': [],
                'validacion': validacion
            }
            
            for ruta_data in validacion['rutas_validas']:
                print(f"[LOG] Procesando ruta: RUC {ruta_data.get('ruc')}, Código {ruta_data.get('codigoRuta')}")
                
                try:
                    if modo == "upsert":
                        # Modo UPSERT: Crear o actualizar
                        resultado = await self._upsert_ruta_desde_datos(ruta_data)
                        
                        if resultado['accion'] == 'creada':
                            resultados['creadas'] += 1
                            resultados['rutas_creadas'].append({
                                'codigo': resultado['ruta'].codigoRuta,
                                'nombre': resultado['ruta'].nombre,
                                'id': resultado['ruta'].id,
                                'ruc': ruta_data.get('ruc'),
                                'resolucion': ruta_data.get('resolucionNormalizada')
                            })
                        else:
                            resultados['actualizadas'] += 1
                            resultados['rutas_actualizadas'].append({
                                'codigo': resultado['ruta'].codigoRuta,
                                'nombre': resultado['ruta'].nombre,
                                'id': resultado['ruta'].id,
                                'ruc': ruta_data.get('ruc'),
                                'resolucion': ruta_data.get('resolucionNormalizada'),
                                'cambios': resultado['cambios']
                            })
                        
                        resultados['exitosas'] += 1
                        
                    else:
                        # Modo CREAR (comportamiento original)
                        ruta_creada = await self._crear_ruta_desde_datos(ruta_data)
                        
                        resultados['exitosas'] += 1
                        resultados['creadas'] += 1
                        resultados['rutas_creadas'].append({
                            'codigo': ruta_creada.codigoRuta,
                            'nombre': ruta_creada.nombre,
                            'id': ruta_creada.id,
                            'ruc': ruta_data.get('ruc'),
                            'resolucion': ruta_data.get('resolucionNormalizada')
                        })

                    
                except Exception as e:
                    resultados['fallidas'] += 1
                    resultados['errores_procesamiento'].append({
                        'fila': ruta_data.get('fila', 'N/A'),
                        'codigo_ruta': ruta_data.get('codigoRuta', 'N/A'),
                        'ruc': ruta_data.get('ruc', 'N/A'),
                        'resolucion': ruta_data.get('resolucionNormalizada', 'N/A'),
                        'origen': ruta_data.get('origen', 'N/A'),
                        'destino': ruta_data.get('destino', 'N/A'),
                        'error': str(e),
                        'errores': [str(e)]
                    })
                    print(f"[LOG] ERROR EN FILA {ruta_data.get('fila', 'N/A')}: {str(e)}")

                
                resultados['total_procesadas'] += 1
            
            return resultados
            
        except Exception as e:
            return {
                'error': f"Error al procesar carga masiva: {str(e)}",
                'modo': modo,
                'total_procesadas': 0,
                'exitosas': 0,
                'fallidas': 0,
                'creadas': 0,
                'actualizadas': 0,
                'rutas_creadas': [],
                'rutas_actualizadas': [],
                'errores_procesamiento': []
            }
