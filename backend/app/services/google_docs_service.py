import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from app.services.tuc_document_service import TucDocumentService

logger = logging.getLogger(__name__)

OFFICIAL_TEMPLATE_DOC_ID = "16BUXKmkdHclgcEloeRlj43p3X3RhQ0uO6FwYa34rWY4"
DEFAULT_OUTPUT_FOLDER_ID = "1Yy6q47onyA7flX5MmI8EKuK61YtzGGiA"
CREDENTIALS_PATHS = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "config", "credentials.json"),
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "config", "credentials.json"),
    os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
]

class GoogleDocsTucService:

    @staticmethod
    def get_credentials_path() -> Optional[str]:
        for path in CREDENTIALS_PATHS:
            if path and os.path.exists(path):
                return path
        return None

    @staticmethod
    def get_status() -> Dict[str, Any]:
        creds_path = GoogleDocsTucService.get_credentials_path()
        if creds_path:
            return {
                "disponible": True,
                "mensaje": "Credenciales de Google API detectadas y listas para usar.",
                "credentials_file": os.path.basename(creds_path),
                "plantilla_id": OFFICIAL_TEMPLATE_DOC_ID
            }
        else:
            return {
                "disponible": False,
                "mensaje": "Para generar copias automáticas en la nube de Google Docs, coloque el archivo 'credentials.json' (Service Account o OAuth2) en backend/config/.",
                "credentials_file": None,
                "plantilla_id": OFFICIAL_TEMPLATE_DOC_ID
            }

    @staticmethod
    async def generar_copia_google_doc(placa_o_id: str, carpeta_destino_id: Optional[str] = DEFAULT_OUTPUT_FOLDER_ID) -> Dict[str, Any]:
        """
        Clona la plantilla oficial de Google Docs y reemplaza las etiquetas con la Google Docs API.
        """
        creds_path = GoogleDocsTucService.get_credentials_path()
        if not creds_path:
            return {
                "exito": False,
                "disponible": False,
                "mensaje": "No se encontraron credenciales de Google API en backend/config/credentials.json. Mientras tanto, utilice la opción de Descarga en Word (.docx) o Vista de Impresión directa del servidor.",
                "url": None
            }

        try:
            from google.oauth2 import service_account
            from googleapiclient.discovery import build

            scopes = [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/documents'
            ]
            creds = service_account.Credentials.from_service_account_file(creds_path, scopes=scopes)

            # Obtener datos del vehículo y los 25 placeholders
            tuc_info = await TucDocumentService.get_tuc_data(placa_o_id)
            placeholders = tuc_info["placeholders"]
            placa = tuc_info["placa"]

            drive_service = build('drive', 'v3', credentials=creds)
            docs_service = build('docs', 'v1', credentials=creds)

            # 1. Clonar la plantilla directamente en la carpeta destino del Shared Drive
            copy_metadata = {
                'name': f"TUC_{placa}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            }
            if carpeta_destino_id:
                copy_metadata['parents'] = [carpeta_destino_id]

            copia = drive_service.files().copy(
                fileId=OFFICIAL_TEMPLATE_DOC_ID,
                body=copy_metadata,
                supportsAllDrives=True
            ).execute()

            nuevo_doc_id = copia.get('id')
            logger.info(f"Copia creada: {nuevo_doc_id} en carpeta {carpeta_destino_id or 'raiz'}")
            # 2. Reemplazar texto en el nuevo documento usando documents.batchUpdate
            requests = []
            for k, v in placeholders.items():
                requests.append({
                    'replaceAllText': {
                        'containsText': {
                            'text': k,
                            'matchCase': True
                        },
                        'replaceText': str(v)
                    }
                })

            docs_service.documents().batchUpdate(
                documentId=nuevo_doc_id,
                body={'requests': requests}
            ).execute()

            google_doc_url = f"https://docs.google.com/document/d/{nuevo_doc_id}/edit"

            return {
                "exito": True,
                "disponible": True,
                "mensaje": "Copia en Google Docs generada y editada exitosamente.",
                "nuevo_doc_id": nuevo_doc_id,
                "url": google_doc_url,
                "placa": placa
            }

        except Exception as e:
            logger.error(f"Error al generar copia en Google Docs: {e}", exc_info=True)
            return {
                "exito": False,
                "disponible": True,
                "mensaje": f"Error al interactuar con Google Docs API: {str(e)}",
                "url": None
            }
