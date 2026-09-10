import pandas as pd
from io import BytesIO
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.resolucion_hija import ResolucionHijaCreate, TipoActoModificatorio
from app.services.resolucion_hija_service import ResolucionHijaService

logger = logging.getLogger(__name__)

class ResolucionHijaExcelService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.service = ResolucionHijaService(db)

    def generar_plantilla_excel(self) -> BytesIO:
        """Generar plantilla Excel con ejemplos para Carga Masiva de Resoluciones Hijas"""
        columnas = [
            'RESOLUCION_NUMERO_HIJA',
            'RESOLUCION_PRIMIGENIA_ASOCIADA',
            'RUC_EMPRESA',
            'TIPO_ACTO',
            'FECHA_RESOLUCION',
            'FECHA_INICIO_EFECTOS',
            'EXPEDIENTE_NUMERO',
            'VEHICULOS_INGRESANTES',
            'VEHICULOS_SALIENTES',
            'LINK_DOCUMENTO',
            'OBSERVACIONES'
        ]

        ejemplos = [
            {
                'RESOLUCION_NUMERO_HIJA': '0450-2023',
                'RESOLUCION_PRIMIGENIA_ASOCIADA': '0100-2021',
                'RUC_EMPRESA': '20123456789',
                'TIPO_ACTO': 'INCREMENTO_FLOTA',
                'FECHA_RESOLUCION': '15/05/2023',
                'FECHA_INICIO_EFECTOS': '15/05/2023',
                'EXPEDIENTE_NUMERO': 'EXP-2023-01290',
                'VEHICULOS_INGRESANTES': 'Z1A-123, Z2B-456',
                'VEHICULOS_SALIENTES': '',
                'LINK_DOCUMENTO': 'https://drive.google.com/file/d/ejemplo_hija1',
                'OBSERVACIONES': 'Incorporación de 2 unidades vehiculares nuevas'
            },
            {
                'RESOLUCION_NUMERO_HIJA': '0512-2024',
                'RESOLUCION_PRIMIGENIA_ASOCIADA': '0100-2021',
                'RUC_EMPRESA': '20123456789',
                'TIPO_ACTO': 'SUSTITUCION_VEHICULAR',
                'FECHA_RESOLUCION': '10/02/2024',
                'FECHA_INICIO_EFECTOS': '10/02/2024',
                'EXPEDIENTE_NUMERO': 'EXP-2024-00412',
                'VEHICULOS_INGRESANTES': 'Z3C-789',
                'VEHICULOS_SALIENTES': 'Z9C-999',
                'LINK_DOCUMENTO': 'https://drive.google.com/file/d/ejemplo_hija2',
                'OBSERVACIONES': 'Sustitución de unidad por renovación de año de fabricación'
            }
        ]

        df = pd.DataFrame(ejemplos, columns=columnas)
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Resoluciones_Hijas', index=False)

            instrucciones = [
                ['INSTRUCCIONES PARA LA CARGA MASIVA DE RESOLUCIONES HIJAS (ACTOS MODIFICATORIOS)'],
                [''],
                ['CAMPOS OBLIGATORIOS:'],
                ['- RESOLUCION_NUMERO_HIJA: Número correlativo y año de la resolución hija (ej. 0450-2023)'],
                ['- RESOLUCION_PRIMIGENIA_ASOCIADA: Número de la resolución matriz a la que modifica (ej. 0100-2021)'],
                ['- RUC_EMPRESA: RUC del titular de la empresa (11 dígitos)'],
                ['- TIPO_ACTO: Tipo de acto administrativo modificatorio.'],
                ['  Valores válidos: RENOVACION, INCREMENTO_FLOTA, SUSTITUCION_VEHICULAR, BAJA_VEHICULAR,'],
                ['                   MODIFICACION_RUTA, CAMBIO_REPRESENTANTE, SUSPENSION_TEMPORAL, CANCELACION_PARCIAL, OTROS'],
                ['- FECHA_RESOLUCION: Fecha de emisión (DD/MM/AAAA)'],
                [''],
                ['CAMPOS OPCIONALES:'],
                ['- FECHA_INICIO_EFECTOS: Fecha legal de vigencia de la modificación. Si no se indica, se asume FECHA_RESOLUCION.'],
                ['- VEHICULOS_INGRESANTES: Placas separadas por coma que se suman a la flota.'],
                ['- VEHICULOS_SALIENTES: Placas separadas por coma que se dan de baja/sustituyen.'],
                ['- LINK_DOCUMENTO: Enlace URL a Google Drive del archivo digital.'],
                ['- OBSERVACIONES: Notas y detalles explicativos del acto modificatorio.']
            ]
            df_inst = pd.DataFrame(instrucciones)
            df_inst.to_excel(writer, sheet_name='Instrucciones', index=False, header=False)

        buffer.seek(0)
        return buffer

    async def procesar_carga_masiva(self, archivo_buffer: BytesIO) -> Dict[str, Any]:
        """Procesar archivo Excel o CSV (Google Sheets) con registros de resoluciones hijas"""
        try:
            df = pd.read_excel(archivo_buffer, sheet_name=0)
        except Exception:
            archivo_buffer.seek(0)
            try:
                df = pd.read_csv(archivo_buffer, encoding='utf-8')
            except Exception:
                archivo_buffer.seek(0)
                df = pd.read_csv(archivo_buffer, encoding='latin1')

        df.columns = [str(col).strip().upper() for col in df.columns]

        procesadas = 0
        creadas = 0
        errores = []
        registros_creados = []

        def get_col_val(row, *aliases):
            for a in aliases:
                val = row.get(a)
                if pd.notna(val) and str(val).strip() != '' and str(val).strip().lower() != 'nan':
                    return str(val).strip()
            return ''

        for idx, row in df.iterrows():
            fila = idx + 2
            try:
                numero_hija = get_col_val(row, 'RESOLUCION_NUMERO_HIJA', 'NRO_RESOLUCION_HIJA', 'NRO_RESOLUCION', 'RESOLUCION_HIJA', 'RESOLUCION_NUMERO')
                if not numero_hija:
                    errores.append(f"Fila {fila}: Número de resolución hija no proporcionado.")
                    continue

                numero_primigenia = get_col_val(row, 'RESOLUCION_PRIMIGENIA_ASOCIADA', 'NRO_RESOLUCION_PRIMIGENIA', 'PRIMIGENIA_ASOCIADA', 'PRIMIGENIA', 'RESOLUCION_PRIMIGENIA')
                if not numero_primigenia:
                    errores.append(f"Fila {fila}: Número de resolución primigenia asociada no proporcionado.")
                    continue

                ruc = get_col_val(row, 'RUC_EMPRESA', 'RUC', 'RUC_TITULAR', 'RUC EMPRESA')
                if not ruc or len(ruc) != 11 or not ruc.isdigit():
                    errores.append(f"Fila {fila}: RUC de empresa inválido '{ruc}'.")
                    continue

                tipo_acto_str = get_col_val(row, 'TIPO_ACTO', 'ACTO_MODIFICATORIO', 'TIPO_ACTO_MODIFICATORIO').upper() or 'INCREMENTO_FLOTA'
                tipo_acto = TipoActoModificatorio.INCREMENTO_FLOTA
                if tipo_acto_str in TipoActoModificatorio.__members__:
                    tipo_acto = TipoActoModificatorio[tipo_acto_str]

                fecha_res_raw = row.get('FECHA_RESOLUCION') if pd.notna(row.get('FECHA_RESOLUCION')) else row.get('FECHA_EMISION')
                fecha_res = self._parse_fecha(fecha_res_raw, fila, 'FECHA_RESOLUCION')
                if not fecha_res:
                    errores.append(f"Fila {fila}: Fecha de resolución es obligatoria.")
                    continue

                fecha_efectos_raw = row.get('FECHA_INICIO_EFECTOS') if pd.notna(row.get('FECHA_INICIO_EFECTOS')) else row.get('FECHA_EFECTOS')
                fecha_efectos = self._parse_fecha(fecha_efectos_raw, fila, 'FECHA_INICIO_EFECTOS')

                expediente = get_col_val(row, 'EXPEDIENTE_NUMERO', 'NRO_EXPEDIENTE', 'EXPEDIENTE') or None
                link_doc = get_col_val(row, 'LINK_DOCUMENTO', 'LINK', 'DRIVE', 'DRIVE_LINK', 'URL') or None
                obs = get_col_val(row, 'OBSERVACIONES', 'OBSERVACION', 'NOTAS') or None

                veh_ing_raw = get_col_val(row, 'VEHICULOS_INGRESANTES', 'INGRESANTES', 'PLACAS_INGRESANTES', 'VEHICULOS_ALTAS')
                veh_ing = [v.strip() for v in veh_ing_raw.split(',') if v.strip()] if veh_ing_raw else []

                veh_sal_raw = get_col_val(row, 'VEHICULOS_SALIENTES', 'SALIENTES', 'PLACAS_SALIENTES', 'VEHICULOS_BAJAS')
                veh_sal = [v.strip() for v in veh_sal_raw.split(',') if v.strip()] if veh_sal_raw else []

                dto = ResolucionHijaCreate(
                    nro_resolucion=numero_hija,
                    nro_resolucion_primigenia=numero_primigenia,
                    ruc_empresa=ruc,
                    tipo_acto=tipo_acto,
                    fecha_resolucion=fecha_res,
                    fecha_inicio_efectos=fecha_efectos,
                    expediente_numero=expediente,
                    link_documento=link_doc,
                    vehiculos_ingresantes=veh_ing,
                    vehiculos_salientes=veh_sal,
                    observaciones=obs
                )

                creado = await self.service.create_resolucion_hija(dto)
                creadas += 1
                registros_creados.append(creado.nro_resolucion)
            except Exception as e:
                errores.append(f"Fila {fila}: Error al procesar ({str(e)})")
            finally:
                procesadas += 1

        return {
            "total_filas": len(df),
            "procesadas": procesadas,
            "creadas": creadas,
            "errores": errores,
            "registros": registros_creados
        }

    def _parse_fecha(self, val: Any, fila: int, campo: str) -> Optional[datetime]:
        if pd.isna(val) or val == '' or str(val).strip() == '':
            return None
        if isinstance(val, pd.Timestamp):
            return val.to_pydatetime()
        if isinstance(val, datetime):
            return val

        date_str = str(val).strip()
        formatos = ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%d/%m/%y']
        for fmt in formatos:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        return None
