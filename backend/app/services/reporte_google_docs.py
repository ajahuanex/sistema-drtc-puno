import os
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from datetime import datetime

class GoogleDocsReportService:
    def __init__(self):
        # The credentials should be in backend/config/credentials.json
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.credentials_path = os.path.join(base_dir, 'config', 'credentials.json')
        
        # Scopes required to create and move docs
        self.scopes = [
            'https://www.googleapis.com/auth/documents',
            'https://www.googleapis.com/auth/drive'
        ]
        
        # Folder ID specified by the user
        self.folder_id = '1awEawM77p1p9u30oXLvmSrfi4vACtFGU'

    def _get_credentials(self):
        if not os.path.exists(self.credentials_path):
            raise Exception(f"Credentials not found at {self.credentials_path}")
        return service_account.Credentials.from_service_account_file(
            self.credentials_path, scopes=self.scopes)

    def generar_reporte_estadistico(self, estadisticas: dict) -> str:
        """
        Creates a Google Doc with the statistics and moves it to the target folder.
        Returns the Document URL.
        """
        credentials = self._get_credentials()
        docs_service = build('docs', 'v1', credentials=credentials)
        drive_service = build('drive', 'v3', credentials=credentials)
        
        # 1. Create a blank document
        fecha_str = datetime.now().strftime("%d/%m/%Y %H:%M")
        doc_title = f"Reporte Estadístico SIRRET - {datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        body = {
            'title': doc_title
        }
        doc = docs_service.documents().create(body=body).execute()
        document_id = doc.get('documentId')
        
        # 2. Structure the content
        requests = [
            {
                'insertText': {
                    'location': {
                        'index': 1,
                    },
                    'text': f"Reporte Estadístico del Sistema Regional de Registros de Transporte (SIRRET)\n"
                            f"Generado el: {fecha_str}\n\n"
                            f"--- RESUMEN GENERAL ---\n"
                            f"Rutas Habilitadas Totales: {estadisticas.get('rutasHabilitadasTotal', 0)}\n"
                            f"Resoluciones Primigenias Autorizadas: {estadisticas.get('resolucionesPrimigeniasAutorizadas', 0)}\n"
                            f"Flota Habilitada (Total): {estadisticas.get('totalFlotaHabilitada', 0)}\n"
                            f"Total Sustituciones Vehiculares: {estadisticas.get('totalSustituciones', 0)}\n"
                            f"Total Incrementos de Flota: {estadisticas.get('totalIncrementos', 0)}\n\n"
                            f"--- EMPRESAS POR MODALIDAD ---\n"
                }
            }
        ]
        
        # Add Empresas por modalidad
        texto_modalidad = ""
        for emp in estadisticas.get('empresasPorModalidad', []):
            texto_modalidad += f"- {emp['modalidad']}: {emp['total']}\n"
        
        requests.append({
            'insertText': {
                'location': {'index': sum(len(r['insertText']['text']) for r in requests) + 1},
                'text': texto_modalidad + "\n--- RUTAS CON MÁS EMPRESAS AUTORIZADAS ---\n"
            }
        })
        
        # Add Rutas con mas empresas
        texto_rutas = ""
        for idx, ruta in enumerate(estadisticas.get('rutasConMasEmpresas', [])):
            texto_rutas += f"{idx + 1}. {ruta['nombre']}: {ruta['totalEmpresas']} empresas\n"
            
        requests.append({
            'insertText': {
                'location': {'index': sum(len(r['insertText']['text']) for r in requests) + 1},
                'text': texto_rutas + "\n--- TOP 10 EMPRESAS CON MAYOR FLOTA ---\n"
            }
        })
        
        # Add Top 10 Flotas
        texto_flotas = ""
        for idx, flota in enumerate(estadisticas.get('topFlotasPorEmpresa', [])):
            texto_flotas += f"{idx + 1}. {flota['razonSocial']} (RUC: {flota['ruc']}) - Flota: {flota['total']}\n"
            
        requests.append({
            'insertText': {
                'location': {'index': sum(len(r['insertText']['text']) for r in requests) + 1},
                'text': texto_flotas + "\n-- Fin del Reporte --\n"
            }
        })
        
        # Apply the text to the document
        docs_service.documents().batchUpdate(
            documentId=document_id, body={'requests': requests}).execute()
            
        # 3. Move the document to the specific folder
        # Retrieve the existing parents to remove them
        file = drive_service.files().get(fileId=document_id, fields='parents').execute()
        previous_parents = ",".join(file.get('parents', []))
        
        # Move the file to the new folder
        drive_service.files().update(
            fileId=document_id,
            addParents=self.folder_id,
            removeParents=previous_parents,
            fields='id, parents'
        ).execute()
        
        return f"https://docs.google.com/document/d/{document_id}/edit"
