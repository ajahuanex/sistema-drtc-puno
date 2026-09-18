import os
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io
from datetime import datetime

class GoogleDocsReportService:
    def __init__(self):
        # The credentials should be in backend/config/credentials.json
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.credentials_path = os.path.join(base_dir, 'config', 'credentials.json')
        
        # Scopes required to create and move docs
        self.scopes = [
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
        Creates a Google Doc with the statistics and saves it to the target folder using Drive API.
        Returns the Document URL.
        """
        credentials = self._get_credentials()
        drive_service = build('drive', 'v3', credentials=credentials)
        
        fecha_str = datetime.now().strftime("%d/%m/%Y %H:%M")
        doc_title = f"Reporte Estadístico SIRRET - {datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Construir el contenido en HTML, Google Drive lo convierte automáticamente a Doc
        html_content = f"""
        <html>
        <head><title>{doc_title}</title></head>
        <body style="font-family: Arial, sans-serif;">
        <h1 style="color: #1e40af;">Reporte Estadístico del Sistema Regional de Registros de Transporte (SIRRET)</h1>
        <p><strong>Generado el:</strong> {fecha_str}</p>
        
        <h2 style="color: #374151; border-bottom: 1px solid #ccc;">RESUMEN GENERAL</h2>
        <ul>
            <li><strong>Rutas Habilitadas Totales:</strong> {estadisticas.get('rutasHabilitadasTotal', 0)}</li>
            <li><strong>Resoluciones Primigenias Autorizadas:</strong> {estadisticas.get('resolucionesPrimigeniasAutorizadas', 0)}</li>
            <li><strong>Flota Habilitada (Total):</strong> {estadisticas.get('totalFlotaHabilitada', 0)}</li>
            <li><strong>Total Sustituciones Vehiculares:</strong> {estadisticas.get('totalSustituciones', 0)}</li>
            <li><strong>Total Incrementos de Flota:</strong> {estadisticas.get('totalIncrementos', 0)}</li>
        </ul>
        
        <h2 style="color: #374151; border-bottom: 1px solid #ccc;">EMPRESAS POR MODALIDAD</h2>
        <ul>
        """
        
        for emp in estadisticas.get('empresasPorModalidad', []):
            html_content += f"<li><strong>{emp['modalidad']}:</strong> {emp['total']}</li>"
            
        html_content += """
        </ul>
        <h2 style="color: #374151; border-bottom: 1px solid #ccc;">RUTAS CON MÁS EMPRESAS AUTORIZADAS</h2>
        <ol>
        """
        
        for ruta in estadisticas.get('rutasConMasEmpresas', []):
            html_content += f"<li><strong>{ruta['nombre']}:</strong> {ruta['totalEmpresas']} empresas</li>"
            
        html_content += """
        </ol>
        <h2 style="color: #374151; border-bottom: 1px solid #ccc;">TOP 10 EMPRESAS CON MAYOR FLOTA</h2>
        <ol>
        """
        
        for flota in estadisticas.get('topFlotasPorEmpresa', []):
            html_content += f"<li><strong>{flota['razonSocial']}</strong> (RUC: {flota['ruc']}) - Flota: {flota['total']}</li>"
            
        html_content += """
        </ol>
        <br>
        <hr>
        <p style="text-align: center; color: #9ca3af;"><em>-- Fin del Reporte --</em></p>
        </body>
        </html>
        """
        
        file_metadata = {
            'name': doc_title,
            'mimeType': 'application/vnd.google-apps.document',
            'parents': [self.folder_id]
        }
        
        media = MediaIoBaseUpload(io.BytesIO(html_content.encode('utf-8')),
                                  mimetype='text/html',
                                  resumable=True)
                                  
        # Subir y crear el documento directamente en la carpeta usando Drive API
        doc = drive_service.files().create(body=file_metadata,
                                           media_body=media,
                                           fields='id',
                                           supportsAllDrives=True).execute()
                                           
        document_id = doc.get('id')
        return f"https://docs.google.com/document/d/{document_id}/edit"
