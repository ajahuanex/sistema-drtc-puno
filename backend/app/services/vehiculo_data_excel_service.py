import pandas as pd
import numpy as np
import re
import httpx
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger("vehiculo_data_excel_service")

class VehiculoDataExcelService:
    """
    Servicio para procesar importaciones masivas de datos técnicos de vehículos (vehiculos_data)
    desde archivos Excel / CSV o enlaces de Google Sheets.
    """
    
    def __init__(self, db: Optional[AsyncIOMotorDatabase] = None):
        self.db = db
        self.collection = db["vehiculos_data"] if db is not None else None
        
    @staticmethod
    def normalizar_placa(placa_raw: Any) -> str:
        """Normalizar placa a formato estándar ABC-123 o AB-1234"""
        if pd.isna(placa_raw) or not str(placa_raw).strip():
            return ''
        placa_str = str(placa_raw).strip().upper()
        # Si ya tiene guión
        if '-' in placa_str:
            return placa_str
        # Intentar formato ABC123 -> ABC-123
        match = re.match(r'^([A-Z]{2,3})(\d{3,4})$', placa_str)
        if match:
            letras, numeros = match.groups()
            return f"{letras}-{numeros}"
        return placa_str

    @staticmethod
    def normalizar_float_3_decimales(val_raw: Any, default: float = 0.0) -> float:
        """Convierte a flotante y redondea a 3 decimales (para pesos en toneladas y medidas en metros)"""
        if pd.isna(val_raw) or str(val_raw).strip() == '':
            return default
        try:
            val_clean = str(val_raw).replace(',', '.').replace(' ', '').strip()
            num = float(val_clean)
            return round(num, 3)
        except Exception:
            return default

    @staticmethod
    def normalizar_int(val_raw: Any, default: int = 0) -> int:
        """Convierte a entero de forma segura"""
        if pd.isna(val_raw) or str(val_raw).strip() == '':
            return default
        try:
            val_clean = str(val_raw).split('.')[0].replace(',', '').strip()
            return int(val_clean)
        except Exception:
            return default

    @staticmethod
    def normalizar_str(val_raw: Any, default: str = "") -> str:
        """Normalizar string omitiendo valores 'nan' o nulos"""
        if pd.isna(val_raw):
            return default
        val_str = str(val_raw).strip()
        if val_str.lower() in ['nan', 'none', 'null']:
            return default
        return val_str

    @staticmethod
    def convertir_url_google_sheets(url: str) -> str:
        """Convierte una URL normal de Google Sheets a su URL de exportación CSV"""
        match = re.search(r'/spreadsheets/d/([a-zA-Z0-9-_]+)', url)
        if match:
            spreadsheet_id = match.group(1)
            # Solo incluir &gid=... si la URL dada tiene un gid explícito
            gid_match = re.search(r'[#&?]gid=([0-9]+)', url)
            if gid_match:
                gid = gid_match.group(1)
                return f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv&gid={gid}"
            return f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv"
        return url

    async def descargar_google_sheet_csv(self, url: str) -> str:
        """Descarga el contenido CSV de un enlace público de Google Sheets"""
        export_url = self.convertir_url_google_sheets(url)
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            resp = await client.get(export_url)
            if resp.status_code != 200:
                raise ValueError(f"No se pudo descargar el Google Sheet. Código HTTP {resp.status_code}")
            return resp.text

    def procesar_dataframe(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Lee el DataFrame (cargado de Excel o CSV), valida las cabeceras y estructura cada fila
        lista para insertar/actualizar en MongoDB.
        """
        if df.empty:
            return {"valido": False, "error": "El archivo no contiene datos", "filas": []}

        # Normalizar nombres de columnas (strip e mayúsculas)
        df.columns = [str(col).strip().upper() for col in df.columns]
        
        # Verificar que la columna PLACA exista (columna 2 en adelante, ignorando ITEM si viene primera)
        if 'PLACA' not in df.columns:
            return {"valido": False, "error": "No se encontró la columna 'PLACA' en la hoja de cálculo", "filas": []}

        filas_procesadas = []
        errores_count = 0
        advertencias_count = 0
        
        ahora = datetime.utcnow()

        for idx, row in df.iterrows():
            numero_fila = idx + 2  # Excel 1-indexed con cabecera
            
            placa_raw = row.get('PLACA')
            placa = self.normalizar_placa(placa_raw)
            
            if not placa:
                errores_count += 1
                filas_procesadas.append({
                    "fila": numero_fila,
                    "placa": "N/A",
                    "estado": "ERROR",
                    "mensaje": "La celda de PLACA está vacía o es inválida",
                    "datos": None
                })
                continue
                
            # Extraer campos de datos técnicos
            marca = self.normalizar_str(row.get('MARCA'))
            modelo = self.normalizar_str(row.get('MODELO'))
            anio_fab = self.normalizar_int(row.get('ANIO_FABRICACION'), 0)
            color = self.normalizar_str(row.get('COLOR'))
            categoria = self.normalizar_str(row.get('CATEGORIA'))
            carroceria = self.normalizar_str(row.get('CARROCERIA'))
            clase = self.normalizar_str(row.get('CLASE'))
            combustible = self.normalizar_str(row.get('COMBUSTIBLE'))
            numero_motor = self.normalizar_str(row.get('NUMERO_MOTOR'))
            vin_serie = self.normalizar_str(row.get('NUMERO_SERIE_VIN'))
            num_pasajeros = self.normalizar_int(row.get('NUM_PASAJEROS'), 0)
            num_asientos = self.normalizar_int(row.get('NUM_ASIENTOS'), 0)
            cilindros = self.normalizar_int(row.get('CILINDROS'), 0)
            ejes = self.normalizar_int(row.get('EJES'), 0)
            ruedas = self.normalizar_int(row.get('RUEDAS'), 0)
            
            # Pesos en toneladas (redondeados a 3 decimales)
            peso_bruto_ton = self.normalizar_float_3_decimales(row.get('PESO_BRUTO'), 0.0)
            peso_neto_ton = self.normalizar_float_3_decimales(row.get('PESO_NETO'), 0.0)
            carga_util_ton = self.normalizar_float_3_decimales(row.get('CARGA_UTIL'), 0.0)
            
            # Medidas en metros (redondeados a 3 decimales)
            largo_m = self.normalizar_float_3_decimales(row.get('LARGO'), 0.0)
            ancho_m = self.normalizar_float_3_decimales(row.get('ANCHO'), 0.0)
            alto_m = self.normalizar_float_3_decimales(row.get('ALTO'), 0.0)
            
            observaciones = self.normalizar_str(row.get('OBSERVACIONES'))
            fecha_registro_raw = self.normalizar_str(row.get('FECHA_CREACION_REGISTRO'))
            fecha_actualizacion_raw = self.normalizar_str(row.get('FECHA_ACTUALIZACION_REGISTRO'))
            usuario = self.normalizar_str(row.get('USUARIO'), 'SISTEMA_IMPORTADOR')
            origen = self.normalizar_str(row.get('ORIGEN'), 'GOOGLE_SHEETS_IMPORT')
            
            # Sub-objeto pcmMetadata con las 14 columnas de auditoría/legado
            pcm_metadata = {
                "pcm_estado": self.normalizar_str(row.get('PCM_ESTADO')),
                "pcm_cambios": self.normalizar_str(row.get('PCM_CAMBIOS')),
                "pcm_fecha_consulta": self.normalizar_str(row.get('PCM_FECHA_CONSULTA')),
                "pcm_sede": self.normalizar_str(row.get('PCM_SEDE')),
                "pcm_propietario": self.normalizar_str(row.get('PCM_PROPIETARIO')),
                "pcm_fuente_legado": self.normalizar_str(row.get('PCM_FUENTE_LEGADO')),
                "pcm_campos_legado": self.normalizar_str(row.get('PCM_CAMPOS_LEGADO')),
                "categoria_orig": self.normalizar_str(row.get('CATEGORIA_ORIG')),
                "clase_orig": self.normalizar_str(row.get('CLASE_ORIG')),
                "respaldo_ok": str(row.get('RESPALDO_OK', '')).upper() in ['TRUE', '1', 'SI', 'S', 'OK'],
                "revision_categoria": self.normalizar_str(row.get('REVISION_CATEGORIA')),
                "clase_estado": self.normalizar_str(row.get('CLASE_ESTADO')),
                "fuente_categoria": self.normalizar_str(row.get('FUENTE_CATEGORIA')),
                "clase_origen": self.normalizar_str(row.get('CLASE_ORIGEN'))
            }

            doc_vehiculo = {
                "placa_actual": placa,
                "vin": vin_serie or f"VIN_{placa}",
                "numero_serie": vin_serie or f"SERIE_{placa}",
                "numero_motor": numero_motor or "SIN_INFORMACION",
                "marca": marca or "DESCONOCIDA",
                "modelo": modelo or "DESCONOCIDO",
                "anio_fabricacion": anio_fab,
                "anio_modelo": anio_fab,
                "color": color or "DESCONOCIDO",
                "categoria": categoria or "M1",
                "carroceria": carroceria or "MINIBUS",
                "clase": clase or "CAMIONETA",
                "combustible": combustible or "DIESEL",
                "numero_pasajeros": num_pasajeros,
                "numero_asientos": num_asientos,
                "cilindrada": cilindros,
                "numero_ejes": ejes,
                "numero_ruedas": ruedas,
                # Pesos en toneladas (3 decimales)
                "peso_bruto": peso_bruto_ton,
                "peso_seco": peso_neto_ton,
                "peso_neto": peso_neto_ton,
                "carga_util": carga_util_ton,
                # Medidas en metros (3 decimales)
                "longitud": largo_m,
                "ancho": ancho_m,
                "altura": alto_m,
                "observaciones": observaciones,
                "creado_por": usuario,
                "actualizado_por": usuario,
                "fuente_datos": origen,
                "pcmMetadata": pcm_metadata,
                "fecha_actualizacion": ahora,
                "fecha_creacion": ahora
            }
            
            filas_procesadas.append({
                "fila": numero_fila,
                "placa": placa,
                "estado": "OK",
                "mensaje": "Válido para importación",
                "datos": doc_vehiculo
            })

        return {
            "valido": True,
            "total": len(filas_procesadas),
            "correctos": len([f for f in filas_procesadas if f["estado"] == "OK"]),
            "errores": errores_count,
            "filas": filas_procesadas
        }

    async def guardar_carga_masiva(self, filas_validas: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Ejecuta el guardado masivo en la colección vehiculos_data de MongoDB
        usando la estrategia UPSERT por placa_actual.
        """
        insertados = 0
        actualizados = 0
        errores = 0
        detalles_errores = []

        for item in filas_validas:
            datos = item.get("datos")
            if not datos:
                continue
                
            placa = datos["placa_actual"]
            try:
                # Verificar si existe para distinguir entre inserción y actualización
                existente = await self.collection.find_one({"placa_actual": placa})
                
                # Mantener fecha_creacion original si ya existe
                if existente and "fecha_creacion" in existente:
                    datos["fecha_creacion"] = existente["fecha_creacion"]
                
                res = await self.collection.update_one(
                    {"placa_actual": placa},
                    {"$set": datos},
                    upsert=True
                )
                
                if res.upserted_id:
                    insertados += 1
                else:
                    actualizados += 1
            except Exception as e:
                logger.error(f"Error guardando vehículo placa {placa}: {e}")
                errores += 1
                detalles_errores.append({"placa": placa, "error": str(e)})

        return {
            "exito": True,
            "insertados": insertados,
            "actualizados": actualizados,
            "errores": errores,
            "detalles_errores": detalles_errores,
            "total_procesados": insertados + actualizados + errores
        }
