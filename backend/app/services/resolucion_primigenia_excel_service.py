import pandas as pd
from io import BytesIO
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.resolucion_primigenia import ResolucionPrimigeniaCreate, EstadoResolucionPrimigenia
from app.services.resolucion_primigenia_service import ResolucionPrimigeniaService

logger = logging.getLogger(__name__)

class ResolucionPrimigeniaExcelService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.service = ResolucionPrimigeniaService(db)

    def generar_plantilla_excel(self) -> BytesIO:
        """Generar plantilla Excel oficial para Carga Masiva de Resoluciones Primigenias"""
        columnas = [
            'ID_RESOLUCION',
            'RUC_EMPRESA_ASOCIADA',
            'RESOLUCION_NUMERO',
            'RESOLUCION_ASOCIADA',
            'TIPO_RESOLUCION',
            'FECHA_RESOLUCION',
            'FECHA_INICIO_VIGENCIA',
            'ANIOS_VIGENCIA',
            'FECHA_FIN_VIGENCIA',
            'ESTADO',
            'OBSERVACIONES',
            'EFICACIA ANTICIPADA',
            'TIPO AUTORIZACION',
            'LINK',
            'FE_DE_ERRTAS',
            'HISTORIAL_CAMBIOS',
            'EXPEDIENTE'
        ]

        # Plantilla limpia con la estructura exacta requerida
        df = pd.DataFrame(columns=columnas)
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Resoluciones_Primigenias', index=False)

            instrucciones = [
                ['INSTRUCCIONES PARA LA CARGA MASIVA DE RESOLUCIONES PRIMIGENIAS'],
                [''],
                ['CAMPOS OBLIGATORIOS:'],
                ['- RUC_EMPRESA_ASOCIADA: RUC del titular de la empresa (exactamente 11 dígitos)'],
                ['- RESOLUCION_NUMERO: Número correlativo y año (ej. 0100-2021-DRTC)'],
                ['- FECHA_RESOLUCION: Fecha de emisión en formato DD/MM/AAAA'],
                ['- FECHA_INICIO_VIGENCIA: Fecha de inicio de efectos legales en formato DD/MM/AAAA'],
                ['- TIPO AUTORIZACION: Modalidad de servicio (TURISMO, PERSONAS, CARGA, REGIONAL)'],
                [''],
                ['CAMPOS OPCIONALES:'],
                ['- ID_RESOLUCION: Identificador o código de sistema (opcional)'],
                ['- RESOLUCION_ASOCIADA: Número de resolución referenciada o vinculada'],
                ['- TIPO_RESOLUCION: Tipo de acto administrativo (ej. AUTORIZACION PRIMIGENIA, PRIMIGENIA)'],
                ['- ANIOS_VIGENCIA: Período en años (ej. 10 o 4). Si no se ingresa, se asume 10 por defecto.'],
                ['- FECHA_FIN_VIGENCIA: Si no se especifica, se calcula automáticamente sumando los años.'],
                ['- ESTADO: VIGENTE, SUSPENDIDA, CANCELADA, VENCIDA, ANULADA. Por defecto VIGENTE.'],
                ['- EFICACIA ANTICIPADA: SI / NO (indica si aplica efectos retroactivos a la fecha de inicio)'],
                ['- LINK: Enlace URL a Google Drive o repositorio digital del documento.'],
                ['- FE_DE_ERRTAS: Detalle o registro de fe de erratas o rectificación material.'],
                ['- HISTORIAL_CAMBIOS: Anotaciones o resumen de actos modificatorios posteriores.'],
                ['- EXPEDIENTE: Número de expediente de origen (ej. EXP-2023-0012)'],
                ['- OBSERVACIONES: Comentarios o notas adicionales.']
            ]
            df_inst = pd.DataFrame(instrucciones)
            df_inst.to_excel(writer, sheet_name='Instrucciones', index=False, header=False)

        buffer.seek(0)
        return buffer

    async def procesar_carga_masiva(self, archivo_buffer: BytesIO, modo: str = "upsert") -> Dict[str, Any]:
        """Procesar archivo Excel o CSV (Google Sheets) con registros de resoluciones primigenias"""
        try:
            excel_file = pd.ExcelFile(archivo_buffer)
            target_sheet = 0
            for name in excel_file.sheet_names:
                if name.strip().upper() in ['RESOLUCIONES_PRIMIGENIAS', 'RESOLUCIONES', 'DATOS', 'HOJA1', 'SHEET1']:
                    target_sheet = name
                    break
            df = pd.read_excel(excel_file, sheet_name=target_sheet)
        except Exception:
            archivo_buffer.seek(0)
            try:
                df = pd.read_csv(archivo_buffer, encoding='utf-8')
            except Exception:
                archivo_buffer.seek(0)
                df = pd.read_csv(archivo_buffer, encoding='latin1')
        
        # Limpiar nombres de columnas
        df.columns = [str(col).strip().upper() for col in df.columns]

        procesadas = 0
        creadas = 0
        errores = []
        registros_creados = []

        def clean_val(val: Any) -> str:
            if pd.isna(val) or val is None:
                return ''
            s = str(val).strip()
            if s.lower() == 'nan':
                return ''
            if s.endswith('.0'):
                s = s[:-2]
            return s

        def clean_ruc(val: Any) -> str:
            raw = clean_val(val)
            digits = ''.join(c for c in raw if c.isdigit())
            return digits

        def get_col_val(row, *aliases):
            for a in aliases:
                a_clean = a.strip().upper()
                a_underscore = a_clean.replace(' ', '_')
                for k in row.keys():
                    k_clean = str(k).strip().upper()
                    k_underscore = k_clean.replace(' ', '_')
                    if k_clean == a_clean or k_underscore == a_underscore:
                        val = row.get(k)
                        c_val = clean_val(val)
                        if c_val != '':
                            return c_val
            return ''

        for idx, row in df.iterrows():
            fila = idx + 2
            try:
                ruc_raw = get_col_val(
                    row,
                    'RUC_EMPRESA_ASOCIADA', 'RUC_EMPRESA', 'RUC', 
                    'RUC_TITULAR', 'RUC EMPRESA', 'RUC_ASOCIADA', 'RUC_ASOCIADO'
                )
                
                ruc = clean_ruc(ruc_raw)
                if not ruc or len(ruc) != 11:
                    errores.append(f"Fila {fila}: RUC inválido '{ruc_raw}'. Debe tener 11 dígitos numéricos.")
                    continue

                numero_raw = get_col_val(
                    row, 
                    'RESOLUCION_NUMERO', 'NRO_RESOLUCION', 'NUMERO_RESOLUCION', 
                    'RESOLUCION', 'RESOLUCION_NUM', 'RESOLUCION_PRIMIGENIA', 
                    'NRO_RES', 'NRO RESOLUCION', 'N° RESOLUCION', 'Nº RESOLUCION', 
                    'RESOLUCION PRIMIGENIA', 'RES_PRIMIGENIA', 'RES. PRIMIGENIA'
                )
                if not numero_raw:
                    errores.append(f"Fila {fila}: Número de resolución no proporcionado.")
                    continue
                from app.utils.resolucion_utils import normalizar_numero_resolucion
                numero = normalizar_numero_resolucion(numero_raw)

                # Parsear fechas
                fecha_res_raw = get_col_val(row, 'FECHA_RESOLUCION', 'FECHA_EMISION', 'FECHA RESOLUCION', 'FECHA EMISION')
                fecha_ini_raw = get_col_val(row, 'FECHA_INICIO_VIGENCIA', 'FECHA_INICIO', 'FECHA INICIO', 'INICIO_VIGENCIA')

                fecha_res = self._parse_fecha(fecha_res_raw, fila, 'FECHA_RESOLUCION')
                fecha_ini = self._parse_fecha(fecha_ini_raw, fila, 'FECHA_INICIO_VIGENCIA')

                # Fallback de fechas si una de las dos no está presente
                if not fecha_ini and fecha_res:
                    fecha_ini = fecha_res
                elif not fecha_res and fecha_ini:
                    fecha_res = fecha_ini

                # Solo es error si ninguna fecha fue proporcionada
                if not fecha_ini and not fecha_res:
                    errores.append(f"Fila {fila}: Se requiere al menos la fecha de inicio de vigencia.")
                    continue

                anios_val = get_col_val(row, 'ANIOS_VIGENCIA', 'AÑOS_VIGENCIA', 'VIGENCIA_ANIOS', 'VIGENCIA')
                anios = 10
                if anios_val.isdigit():
                    anios = int(anios_val)

                fecha_fin_raw = get_col_val(row, 'FECHA_FIN_VIGENCIA', 'FECHA_FIN', 'FECHA FIN', 'FIN_VIGENCIA')
                fecha_fin = self._parse_fecha(fecha_fin_raw, fila, 'FECHA_FIN_VIGENCIA')

                estado_str = get_col_val(row, 'ESTADO', 'ESTADO_LEGAL').upper() or 'VIGENTE'
                estado = EstadoResolucionPrimigenia.VIGENTE
                if estado_str in EstadoResolucionPrimigenia.__members__:
                    estado = EstadoResolucionPrimigenia[estado_str]

                tipo_aut = get_col_val(
                    row, 
                    'TIPO AUTORIZACION', 'TIPO_AUTORIZACION', 'TIPO_RESOLUCION', 
                    'MODALIDAD', 'TIPO_SERVICIO', 'MODALIDAD_SERVICIO'
                ).upper() or 'TURISMO'

                eficacia_raw = get_col_val(row, 'EFICACIA ANTICIPADA', 'EFICACIA_ANTICIPADA', 'EFICACIA').upper()
                tiene_eficacia = (eficacia_raw in ['SI', 'SÍ', 'TRUE', '1', 'VERDADERO']) if eficacia_raw else None

                link_doc = get_col_val(row, 'LINK', 'LINK_DOCUMENTO', 'DRIVE', 'DRIVE_LINK', 'URL') or None
                obs = get_col_val(row, 'OBSERVACIONES', 'OBSERVACION', 'NOTAS') or None
                siglas_val = get_col_val(row, 'SIGLAS', 'SIGLA', 'SIGLAS_RESOLUCION', 'SIGLA_RESOLUCION') or None

                expedientes_raw = get_col_val(row, 'EXPEDIENTE', 'EXPEDIENTES', 'EXPEDIENTE_NUMERO', 'NRO_EXPEDIENTE', 'CODIGOS_EXPEDIENTE')
                expedientes_list = [e.strip() for e in expedientes_raw.split(',') if e.strip()] if expedientes_raw else []

                # Verificar si ya existe por número de resolución
                existente = await self.service.get_resolucion_by_numero(numero)
                if existente:
                    if modo == 'crear':
                        errores.append(f"Fila {fila}: Ya existe la resolución primigenia {numero}")
                        continue
                    else:
                        from app.models.resolucion_primigenia import ResolucionPrimigeniaUpdate
                        update_dto = ResolucionPrimigeniaUpdate(
                            ruc_empresa=ruc,
                            siglas=siglas_val or existente.siglas,
                            fecha_resolucion=fecha_res,
                            fecha_inicio_vigencia=fecha_ini,
                            anios_vigencia=anios,
                            fecha_fin_vigencia=fecha_fin,
                            estado=estado,
                            tiene_eficacia_anticipada=tiene_eficacia if tiene_eficacia is not None else existente.tiene_eficacia_anticipada,
                            tipo_autorizacion=tipo_aut,
                            link_documento=link_doc or existente.link_documento,
                            expedientes_codigos=expedientes_list or existente.expedientes_codigos,
                            observaciones=obs or existente.observaciones
                        )
                        await self.service.update_resolucion_primigenia(existente.id, update_dto)
                        creadas += 1
                        registros_creados.append({
                            "nro_resolucion": numero,
                            "ruc_empresa": ruc,
                            "tipo_autorizacion": tipo_aut,
                            "estado": estado.value if hasattr(estado, 'value') else str(estado),
                            "accion": "ACTUALIZADO"
                        })
                else:
                    dto = ResolucionPrimigeniaCreate(
                        ruc_empresa=ruc,
                        nro_resolucion=numero,
                        siglas=siglas_val,
                        fecha_resolucion=fecha_res,
                        fecha_inicio_vigencia=fecha_ini,
                        anios_vigencia=anios,
                        fecha_fin_vigencia=fecha_fin,
                        estado=estado,
                        tiene_eficacia_anticipada=tiene_eficacia,
                        tipo_autorizacion=tipo_aut,
                        link_documento=link_doc,
                        expedientes_codigos=expedientes_list,
                        observaciones=obs
                    )
                    creado = await self.service.create_resolucion_primigenia(dto)
                    creadas += 1
                    registros_creados.append({
                        "nro_resolucion": creado.nro_resolucion,
                        "ruc_empresa": creado.ruc_empresa,
                        "tipo_autorizacion": creado.tipo_autorizacion,
                        "estado": creado.estado.value if hasattr(creado.estado, 'value') else str(creado.estado),
                        "accion": "CREADO"
                    })
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
        
        date_str = str(val).split('T')[0].split(' ')[0].strip()
        if date_str.endswith('.0'):
            date_str = date_str[:-2]

        formatos = ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%d/%m/%y', '%Y/%m/%d']
        for fmt in formatos:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        try:
            parsed = pd.to_datetime(val, dayfirst=True, errors='coerce')
            if pd.notna(parsed):
                return parsed.to_pydatetime()
        except Exception:
            pass
        return None

