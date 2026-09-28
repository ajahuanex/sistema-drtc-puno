"""
Servicio Orquestador del Módulo Inicializador de Datos (Data Onboarding Hub)
Gestiona la secuencia de migración y arranque de las 5 bases maestras de DRTC Puno:
1. DB_EMPRESAS
2. DB_RESOLUCIONES (Primigenias)
3. DB_RUTAS
4. DB_VEHICULOS (vehiculos-data / Ficha Técnica Saneada)
5. DB_MATRIZ (flota_empresa)
"""
import io
import re
import logging
from typing import Dict, Any, List, Optional
import httpx
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.empresa_excel_service import EmpresaExcelService
from app.services.resolucion_primigenia_excel_service import ResolucionPrimigeniaExcelService
from app.services.ruta_excel_service import RutaExcelService
from app.services.vehiculo_data_excel_service import VehiculoDataExcelService
from app.services.flota_empresa_excel_service import FlotaEmpresaExcelService

logger = logging.getLogger("inicializador_service")

# URLs predeterminadas oficiales provistas por DRTC Puno
DEFAULT_SHEETS_URLS = {
    "empresas": "https://docs.google.com/spreadsheets/d/1M_GKLrrIN_lXupWzoWRCeuoQhtN2UYidTZFac0ooM7Y/edit?gid=0#gid=0",
    "resoluciones": "https://docs.google.com/spreadsheets/d/1mL0mxt8BbJX9qBU-ba__H6xx8T95RGNaqZhIIVtnpI0/edit?gid=0#gid=0",
    "rutas": "https://docs.google.com/spreadsheets/d/1K22A0urIqnyWV-u4Yb2_PSPJpoFNxhhMj4D5QCRfpg0/edit?gid=0#gid=0",
    "vehiculos": "https://docs.google.com/spreadsheets/d/1VAY3H0-J0xUYpbKhWczGeBPTNk2ME0SrOfGa_U2vwjI/edit?usp=drive_web&ouid=116680375118904809154",
    "matriz": "https://docs.google.com/spreadsheets/d/1HNGDNmU0La1v6mfbJwoJtK7-0zPvOjpxq9OhgcBe--I/edit?gid=0#gid=0"
}


class InicializadorService:
    DEFAULT_URLS = DEFAULT_SHEETS_URLS

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    @staticmethod
    def convertir_url_google_sheets(url: str) -> str:
        """Convierte una URL estándar de Google Sheets en enlace de exportación CSV con GID"""
        if not url:
            return ""
        match = re.search(r'/spreadsheets/d/([a-zA-Z0-9-_]+)', url)
        if not match:
            return url
        spreadsheet_id = match.group(1)
        gid_match = re.search(r'[#&?]gid=([0-9]+)', url)
        if gid_match:
            return f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv&gid={gid_match.group(1)}"
        return f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv"

    async def descargar_csv_google_sheets(self, url: str) -> str:
        """Descarga el contenido CSV de un Google Sheet público"""
        csv_url = self.convertir_url_google_sheets(url)
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            resp = await client.get(csv_url, headers=headers)
            if resp.status_code != 200:
                raise Exception(
                    f"Error al descargar Google Sheet (HTTP {resp.status_code}). "
                    f"Verifique que la hoja esté configurada como pública ('Cualquier persona con el enlace puede ver')."
                )
            return resp.text

    async def obtener_estado_sistema(self) -> Dict[str, Any]:
        """Consulta el número de registros y estado de cada una de las 5 entidades maestras"""
        try:
            total_empresas = await self.db["empresas"].count_documents({})
            total_resoluciones = await self.db["resoluciones_primigenias"].count_documents({})
            total_rutas = await self.db["rutas"].count_documents({})
            total_vehiculos_data = await self.db["vehiculos_data"].count_documents({})
            total_flota_empresa = await self.db["flota_empresa"].count_documents({})

            return {
                "success": True,
                "default_urls": DEFAULT_SHEETS_URLS,
                "etapas": [
                    {
                        "id": "empresas",
                        "nombre": "1. Empresas Operadoras (DB_EMPRESAS)",
                        "coleccion": "empresas",
                        "total_registros": total_empresas,
                        "default_url": DEFAULT_SHEETS_URLS["empresas"],
                        "completado": total_empresas > 0,
                        "descripcion": "Padrón institucional de personas jurídicas con RUC y representante legal."
                    },
                    {
                        "id": "resoluciones",
                        "nombre": "2. Resoluciones Primigenias (DB_RESOLUCIONES)",
                        "coleccion": "resoluciones_primigenias",
                        "total_registros": total_resoluciones,
                        "default_url": DEFAULT_SHEETS_URLS["resoluciones"],
                        "completado": total_resoluciones > 0,
                        "descripcion": "Títulos habilitantes originarios de concesión por 10 años (Art. 38 RNAT)."
                    },
                    {
                        "id": "rutas",
                        "nombre": "3. Red Vial e Itinerarios (DB_RUTAS)",
                        "coleccion": "rutas",
                        "total_registros": total_rutas,
                        "default_url": DEFAULT_SHEETS_URLS["rutas"],
                        "completado": total_rutas > 0,
                        "descripcion": "Catálogo maestro de rutas autorizadas interprovinciales en Puno."
                    },
                    {
                        "id": "vehiculos",
                        "nombre": "4. Ficha Técnica Saneada (DB_VEHICULOS / vehiculos-data)",
                        "coleccion": "vehiculos_data",
                        "total_registros": total_vehiculos_data,
                        "default_url": DEFAULT_SHEETS_URLS["vehiculos"],
                        "completado": total_vehiculos_data > 0,
                        "descripcion": "Base de datos técnica propia saneada (marca, modelo, año, asientos, categoría M2/M3)."
                    },
                    {
                        "id": "matriz",
                        "nombre": "5. Centro de Trámites y Matriz Operacional (DB_MATRIZ)",
                        "coleccion": "flota_empresa",
                        "total_registros": total_flota_empresa,
                        "default_url": DEFAULT_SHEETS_URLS["matriz"],
                        "completado": total_flota_empresa > 0,
                        "descripcion": "Alimenta el Centro de Trámites (Resoluciones Hijas, Expedientes) y proyecta el padrón vehicular de cada empresa."
                    }
                ]
            }
        except Exception as e:
            logger.error(f"Error consultando estado del inicializador: {e}")
            raise Exception(f"Error consultando base de datos: {str(e)}")

    async def previsualizar_hoja(self, etapa: str, url: Optional[str] = None, file_content: Optional[bytes] = None, is_csv: bool = True) -> Dict[str, Any]:
        """Genera una vista previa normalizada y validada de las columnas para la etapa indicada"""
        try:
            if url:
                csv_text = await self.descargar_csv_google_sheets(url)
                df = pd.read_csv(io.StringIO(csv_text), dtype=str)
            elif file_content:
                if is_csv:
                    df = pd.read_csv(io.BytesIO(file_content), dtype=str)
                else:
                    df = pd.read_excel(io.BytesIO(file_content), dtype=str)
            else:
                raise Exception("Debe proporcionar una URL de Google Sheets o un archivo Excel/CSV.")

            # Limpiar nombres de columnas
            df.columns = [str(c).strip() for c in df.columns]
            columnas_detectadas = list(df.columns)
            total_filas = len(df)

            # Extraer primeras 5 filas de muestra saneando NaN
            muestra_df = df.head(5).fillna("")
            muestra = muestra_df.to_dict(orient="records")

            return {
                "success": True,
                "etapa": etapa,
                "total_filas": total_filas,
                "total_columnas": len(columnas_detectadas),
                "columnas": columnas_detectadas,
                "muestra": muestra
            }
        except Exception as e:
            logger.error(f"Error en previsualización de etapa {etapa}: {e}")
            raise Exception(f"Error procesando vista previa: {str(e)}")

    async def ejecutar_ingesta(self, etapa: str, url: Optional[str] = None, file_content: Optional[bytes] = None, is_csv: bool = True) -> Dict[str, Any]:
        """Ejecuta la importación para la etapa seleccionada usando el servicio especializado correspondiente"""
        try:
            # Obtener bytes del archivo o descargar CSV de Google Sheets
            if url:
                csv_text = await self.descargar_csv_google_sheets(url)
                content_bytes = csv_text.encode('utf-8')
                is_csv = True
            elif file_content:
                content_bytes = file_content
            else:
                raise Exception("Debe proporcionar una URL o archivo para la ingesta.")

            # Delegación según la etapa
            if etapa == "empresas":
                empresa_excel_service = EmpresaExcelService(self.db)
                resultado = await empresa_excel_service.procesar_archivo_excel(
                    content_bytes,
                    es_csv=is_csv
                )
                return {
                    "success": True,
                    "etapa": etapa,
                    "mensaje": "Empresas importadas exitosamente",
                    "resultado": resultado
                }

            elif etapa == "resoluciones":
                res_service = ResolucionPrimigeniaExcelService(self.db)
                resultado = await res_service.procesar_archivo_excel(content_bytes)
                return {
                    "success": True,
                    "etapa": etapa,
                    "mensaje": "Resoluciones primigenias importadas exitosamente",
                    "resultado": resultado
                }

            elif etapa == "rutas":
                ruta_service = RutaExcelService(self.db)
                resultado = await ruta_service.procesar_archivo_excel_completo(content_bytes)
                return {
                    "success": True,
                    "etapa": etapa,
                    "mensaje": "Rutas e itinerarios importados exitosamente",
                    "resultado": resultado
                }

            elif etapa == "vehiculos":
                vehiculo_service = VehiculoDataExcelService(self.db)
                df = pd.read_csv(io.BytesIO(content_bytes), dtype=str) if is_csv else pd.read_excel(io.BytesIO(content_bytes), dtype=str)
                filas_procesadas = vehiculo_service.procesar_dataframe(df)
                if not filas_procesadas.get("filas"):
                    raise Exception("No se encontraron registros técnicos vehiculares válidos.")
                guardado = await vehiculo_service.guardar_carga_masiva(filas_procesadas["filas"])
                return {
                    "success": True,
                    "etapa": etapa,
                    "mensaje": "Fichas técnicas vehiculares guardadas exitosamente",
                    "resultado": guardado
                }

            elif etapa == "matriz":
                flota_service = FlotaEmpresaExcelService(self.db)
                resultado = await flota_service.procesar_archivo_excel(content_bytes)
                return {
                    "success": True,
                    "etapa": etapa,
                    "mensaje": "Matriz operacional de flota importada exitosamente",
                    "resultado": resultado
                }
            else:
                raise Exception(f"Etapa '{etapa}' no reconocida. Válidas: empresas, resoluciones, rutas, vehiculos, matriz.")

        except Exception as e:
            logger.error(f"Error ejecutando ingesta de etapa {etapa}: {e}")
            raise Exception(f"Fallo en la ingesta de {etapa}: {str(e)}")
