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
        
        <h2 style="color: #374151; border-bottom: 1px solid #ccc;">DISTRIBUCIÓN DE EMPRESAS POR RESOLUCIONES PRIMIGENIAS</h2>
        <ul>
            <li><strong>Empresas con 1 Resolución:</strong> {estadisticas.get('empresasPorResoluciones', {}).get('con1', 0)}</li>
            <li><strong>Empresas con 2 Resoluciones:</strong> {estadisticas.get('empresasPorResoluciones', {}).get('con2', 0)}</li>
            <li><strong>Empresas con 3 Resoluciones:</strong> {estadisticas.get('empresasPorResoluciones', {}).get('con3', 0)}</li>
            <li><strong>Empresas con 4 Resoluciones:</strong> {estadisticas.get('empresasPorResoluciones', {}).get('con4', 0)}</li>
            <li><strong>Empresas con 5 o más Resoluciones:</strong> {estadisticas.get('empresasPorResoluciones', {}).get('con5Mas', 0)}</li>
        </ul>

        <h2 style="color: #374151; border-bottom: 1px solid #ccc;">TOP CORREDORES POR FLOTA VEHICULAR (ORIGEN - DESTINO Y VIC.)</h2>
        <ol>
        """
        
        for corr in estadisticas.get('flotasPorCorredor', [])[:15]:
            html_content += f"<li><strong>{corr['corredor']}:</strong> {corr['totalVehiculos']} vehículos ({corr['totalEmpresas']} empresas)</li>"
            
        html_content += """
        </ol>
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
            
        html_content += f"""
        </ol>
        <h2 style="color: #b91c1c; border-bottom: 1px solid #fca5a5;">RESOLUCIONES PRIMIGENIAS PRÓXIMAS A VENCER</h2>
        <p><strong>Por vencer en los próximos 30 días:</strong> {estadisticas.get('resolucionesPorVencer30', {}).get('total', 0)} resoluciones</p>
        <p><strong>Por vencer en los próximos 60 días (acumulado):</strong> {estadisticas.get('resolucionesPorVencer60', {}).get('total', 0)} resoluciones</p>
        <ul>
        """
        for item in estadisticas.get('resolucionesPorVencer60', {}).get('items', [])[:15]:
            html_content += f"<li><strong>{item['nroResolucion']}</strong> - {item['razonSocial']} (RUC: {item['ruc']}) • Vence: {item['fechaFinVigencia']} ({item['diasRestantes']} días restantes)</li>"

        html_content += f"""
        </ul>
        <h2 style="color: #374151; border-bottom: 1px solid #ccc;">TOP EMPRESAS CON MAYOR VOLUMEN DE TRÁMITES (SUSTITUCIONES E INCREMENTOS)</h2>
        <p><strong>Total Trámites Registrados:</strong> {estadisticas.get('totalTramitesFlota', 0)} ({estadisticas.get('totalSustituciones', 0)} sustituciones / {estadisticas.get('totalIncrementos', 0)} incrementos)</p>
        <ol>
        """
        for t in estadisticas.get('topEmpresasTramites', [])[:10]:
            html_content += f"<li><strong>{t['razonSocial']}</strong> (RUC: {t['ruc']}) - Total: {t['totalTramites']} ({t['sustituciones']} sustituciones, {t['incrementos']} incrementos)</li>"

        html_content += f"""
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
