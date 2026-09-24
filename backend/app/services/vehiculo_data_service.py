"""
Servicio para gestión de VehiculoData (Datos Técnicos Puros)
Separado de la lógica administrativa de vehículos
"""
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
import re
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.vehiculo_solo import (
    VehiculoSolo, CategoriaVehiculo, TipoCarroceria, 
    TipoCombustible, EstadoFisicoVehiculo
)
from app.utils.exceptions import ValidationErrorException

logger = logging.getLogger(__name__)


class VehiculoDataService:
    """Servicio para operaciones CRUD de datos técnicos de vehículos"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db["vehiculos_data"]
    
    async def create_vehiculo_data(self, vehiculo_data: dict) -> dict:
        """Crear registro de datos técnicos"""
        
        # Verificar que la placa no exista
        existing = await self.collection.find_one({"placa_actual": vehiculo_data["placa_actual"]})
        if existing:
            raise ValidationErrorException("placa_actual", f"La placa {vehiculo_data['placa_actual']} ya existe")
        
        # Verificar que el VIN no exista
        if vehiculo_data.get("vin"):
            existing_vin = await self.collection.find_one({"vin": vehiculo_data["vin"]})
            if existing_vin:
                raise ValidationErrorException("vin", f"El VIN {vehiculo_data['vin']} ya existe")
        
        # Preparar datos
        vehiculo_data["fecha_creacion"] = datetime.utcnow()
        vehiculo_data["fecha_actualizacion"] = datetime.utcnow()
        
        # Insertar
        result = await self.collection.insert_one(vehiculo_data)
        vehiculo_id = str(result.inserted_id)
        
        # Obtener el registro creado
        created = await self.collection.find_one({"_id": result.inserted_id})
        created["id"] = str(created.pop("_id"))
        
        return created
    
    async def upsert_vehiculo_data(self, vehiculo_data: dict) -> dict:
        """Crear o actualizar registro de ficha técnica vehicular (vehiculos_data) por placa"""
        clean_placa = (vehiculo_data.get("placa_actual") or vehiculo_data.get("placa") or "").replace("-", "").strip().upper()
        if not clean_placa or len(clean_placa) < 6:
            raise ValidationErrorException("placa_actual", "Placa vehicular inválida")
        
        formatted_placa = f"{clean_placa[:3]}-{clean_placa[3:]}" if len(clean_placa) == 6 else clean_placa
        vehiculo_data["placa_actual"] = formatted_placa
        vehiculo_data["placa"] = formatted_placa
        vehiculo_data["fecha_actualizacion"] = datetime.utcnow()

        # Normalizar categoría si incluye C3
        cat = str(vehiculo_data.get("categoria") or "M2").strip().upper().replace(" ", "")
        vehiculo_data["categoria"] = cat
        if "C3" in cat and not vehiculo_data.get("clase"):
            vehiculo_data["clase"] = "C3"

        # Remover IDs para evitar colisión de clave inmutable en MongoDB
        vehiculo_data.pop("_id", None)
        vehiculo_data.pop("id", None)

        query = {"$or": [
            {"placa_actual": formatted_placa},
            {"placa_actual": clean_placa},
            {"placa": formatted_placa},
            {"placa": clean_placa}
        ]}

        await self.collection.update_one(
            query,
            {
                "$set": vehiculo_data,
                "$setOnInsert": {"fecha_creacion": datetime.utcnow()}
            },
            upsert=True
        )

        saved = await self.collection.find_one(query)
        if saved:
            saved["id"] = str(saved.pop("_id"))
        return saved
    
    @staticmethod
    def normalizar_combustible(comb: Optional[str]) -> str:
        """Normalizar combustible: el 99% en DRTC Puno es DIESEL (petróleo -> diesel)"""
        if not comb:
            return "DIESEL"
        c = str(comb).upper().strip()
        if any(k in c for k in ["PETROL", "DIESEL", "GASOIL", "D2", "B5"]):
            return "DIESEL"
        if any(k in c for k in ["GASOLINA", "GASOHOL"]):
            return "GASOLINA"
        if "GNV" in c:
            return "GNV"
        if "GLP" in c:
            return "GLP"
        if "ELEC" in c:
            return "ELECTRICO"
        if "HIBRI" in c:
            return "HIBRIDO"
        return "DIESEL"

    async def consultar_placa_pcm(self, placa: str) -> Optional[dict]:
        """Consulta placa en el servicio externo de SUNARP PCM guillermo.pe y cachea en MongoDB"""
        import httpx
        import logging
        logger = logging.getLogger("api.vehiculo_data")

        clean_placa = placa.replace("-", "").strip().upper()
        if not clean_placa or len(clean_placa) < 6:
            return None
        
        param_col = self.db["parametros_sistema"]
        param_doc = await param_col.find_one({"clave": "INTEROPERABILIDAD_BASE_URL"})
        base_url = (param_doc.get("valor") if param_doc else "https://pcm.guillermo.pe").rstrip("/")
        url = f"{base_url}/api/v1/sunarp/vehiculo/{clean_placa}"
        try:
            async with httpx.AsyncClient(verify=False, timeout=12.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("found") and data.get("vehiculo"):
                        v = data["vehiculo"]
                        
                        formatted_placa = f"{clean_placa[:3]}-{clean_placa[3:]}" if len(clean_placa) == 6 else clean_placa
                        
                        anio_val = None
                        if v.get("anoFabricacion") and str(v.get("anoFabricacion")).isdigit():
                            ano_int = int(v.get("anoFabricacion"))
                            if ano_int > 1900:
                                anio_val = ano_int
                        
                        # Categoría y Clase
                        cat_pcm = (v.get("codCategoria") or "M2").strip().upper()
                        # Clase: No es 'MICROBUS' (eso es carrocería). Si la categoría contiene C3, clase = 'C3', de lo contrario vacío.
                        clase_pcm = "C3" if "C3" in cat_pcm else ""
                        carroceria_pcm = v.get("carroceria") or ""

                        veh_dict = {
                            "placa_actual": formatted_placa,
                            "placa": formatted_placa,
                            "marca": v.get("marca"),
                            "modelo": v.get("modelo"),
                            "anio_fabricacion": anio_val,
                            "anio_modelo": anio_val,
                            "anio_fabricacion_pcm": anio_val,
                            "color": v.get("color"),
                            "categoria": cat_pcm,
                            "carroceria": carroceria_pcm,
                            "clase": clase_pcm,
                            "combustible": self.normalizar_combustible(v.get("combustible")),
                            "numero_motor": v.get("nro_motor"),
                            "numero_serie": v.get("serie"),
                            "vin": v.get("vin") or v.get("serie"),
                            "sede": v.get("sede"),
                            "propietario": v.get("propietarios", {}).get("nombre") if isinstance(v.get("propietarios"), dict) else None,
                            "fuente_datos": "PCM_SUNARP_API",
                            "fecha_actualizacion": datetime.utcnow().isoformat(),
                            "origen": "PCM_API"
                        }

                        # Solo agregar campos técnicos numéricos si realmente vienen en la respuesta de PCM
                        for pcm_key, target_key, caster in [
                            ("pasajeros", "numero_pasajeros", int),
                            ("nroPasajeros", "numero_pasajeros", int),
                            ("asientos", "numero_asientos", int),
                            ("nroAsientos", "numero_asientos", int),
                            ("cilindros", "numero_cilindros", int),
                            ("nroCilindros", "numero_cilindros", int),
                            ("cilindrada", "cilindrada", int),
                            ("ejes", "numero_ejes", int),
                            ("nroEjes", "numero_ejes", int),
                            ("ruedas", "numero_ruedas", int),
                            ("nroRuedas", "numero_ruedas", int),
                            ("pesoBruto", "peso_bruto", float),
                            ("peso_bruto", "peso_bruto", float),
                            ("pesoNeto", "peso_seco", float),
                            ("peso_neto", "peso_seco", float),
                            ("pesoSeco", "peso_seco", float),
                            ("cargaUtil", "carga_util", float),
                            ("carga_util", "carga_util", float),
                            ("longitud", "longitud", float),
                            ("largo", "longitud", float),
                            ("ancho", "ancho", float),
                            ("altura", "altura", float),
                            ("alto", "altura", float),
                        ]:
                            val = v.get(pcm_key)
                            if val is not None and str(val).strip() != "":
                                try:
                                    num_v = caster(val)
                                    if caster == float:
                                        num_v = round(num_v, 3)
                                    veh_dict[target_key] = num_v
                                except Exception:
                                    pass

                        # Cachear en MongoDB vehiculos_data preservando datos técnicos existentes
                        try:
                            existing_v = await self.collection.find_one({"$or": [{"placa_actual": formatted_placa}, {"placa_actual": clean_placa}]})
                            if existing_v:
                                if existing_v.get("anio_fabricacion") and existing_v["anio_fabricacion"] > 1900:
                                    veh_dict["anio_fabricacion"] = existing_v["anio_fabricacion"]
                                if existing_v.get("anio_modelo") and existing_v["anio_modelo"] > 1900:
                                    veh_dict["anio_modelo"] = existing_v["anio_modelo"]
                                veh_dict["anio_fabricacion_pcm"] = anio_val
                                if existing_v.get("categoria"):
                                    veh_dict["categoria"] = existing_v["categoria"]
                                if existing_v.get("clase") and existing_v["clase"] != "MICROBUS":
                                    veh_dict["clase"] = existing_v["clase"]
                                elif "C3" in str(veh_dict.get("categoria", "")).upper():
                                    veh_dict["clase"] = "C3"
                                if existing_v.get("combustible"):
                                    veh_dict["combustible"] = self.normalizar_combustible(existing_v["combustible"])

                                # Preservar pesos, dimensiones y capacidades si PCM no las trajo
                                for pres_key in [
                                    "peso_bruto", "peso_seco", "peso_neto", "carga_util", 
                                    "longitud", "ancho", "altura", 
                                    "numero_asientos", "numero_pasajeros", "numero_ejes", 
                                    "numero_ruedas", "numero_cilindros", "cilindros"
                                ]:
                                    if pres_key not in veh_dict and existing_v.get(pres_key) is not None:
                                        veh_dict[pres_key] = existing_v[pres_key]

                            await self.collection.update_one(
                                {"$or": [{"placa_actual": formatted_placa}, {"placa_actual": clean_placa}]},
                                {"$set": veh_dict, "$setOnInsert": {"fecha_creacion": datetime.utcnow().isoformat()}},
                                upsert=True
                            )
                        except Exception as cache_err:
                            logger.warning(f"No se pudo cachear vehiculo en vehiculos_data: {cache_err}")
                            
                        return veh_dict
        except Exception as e:
            logger.warning(f"Error consultando PCM para placa {placa}: {e}")
        return None

    CATALOGO_TECNICO_ESTANDAR = [
        {
            "patron": r"415",
            "marca": "MERCEDES BENZ",
            "peso_bruto": 3.88,
            "peso_seco": 2.65,
            "carga_util": 1.23,
            "longitud": 5.91,
            "ancho": 1.99,
            "altura": 2.86,
            "numero_asientos": 16,
            "numero_pasajeros": 15,
            "numero_cilindros": 4,
            "numero_ejes": 2,
            "numero_ruedas": 4
        },
        {
            "patron": r"413",
            "marca": "MERCEDES BENZ",
            "peso_bruto": 4.60,
            "peso_seco": 2.89,
            "carga_util": 1.71,
            "longitud": 6.99,
            "ancho": 1.99,
            "altura": 2.76,
            "numero_asientos": 20,
            "numero_pasajeros": 19,
            "numero_cilindros": 4,
            "numero_ejes": 2,
            "numero_ruedas": 6
        },
        {
            "patron": r"313|314|311",
            "marca": "MERCEDES BENZ",
            "peso_bruto": 3.88,
            "peso_seco": 2.35,
            "carga_util": 1.53,
            "longitud": 5.64,
            "ancho": 1.92,
            "altura": 2.76,
            "numero_asientos": 16,
            "numero_pasajeros": 15,
            "numero_cilindros": 4,
            "numero_ejes": 2,
            "numero_ruedas": 4
        },
        {
            "patron": r"515|516|519",
            "marca": "MERCEDES BENZ",
            "peso_bruto": 5.00,
            "peso_seco": 2.95,
            "carga_util": 2.05,
            "longitud": 7.34,
            "ancho": 1.99,
            "altura": 2.86,
            "numero_asientos": 20,
            "numero_pasajeros": 19,
            "numero_cilindros": 4,
            "numero_ejes": 2,
            "numero_ruedas": 6
        },
        {
            "patron": r"HIACE|COMMUTER",
            "marca": "TOYOTA",
            "peso_bruto": 3.25,
            "peso_seco": 2.06,
            "carga_util": 1.13,
            "longitud": 5.38,
            "ancho": 1.88,
            "altura": 2.28,
            "numero_asientos": 16,
            "numero_pasajeros": 15,
            "numero_cilindros": 4,
            "numero_ejes": 2,
            "numero_ruedas": 4
        },
        {
            "patron": r"MASTER",
            "marca": "RENAULT",
            "peso_bruto": 3.90,
            "peso_seco": 2.35,
            "carga_util": 1.55,
            "longitud": 6.20,
            "ancho": 2.07,
            "altura": 2.49,
            "numero_asientos": 16,
            "numero_pasajeros": 15,
            "numero_cilindros": 4,
            "numero_ejes": 2,
            "numero_ruedas": 4
        },
        {
            "patron": r"CRAFTER",
            "marca": "VOLKSWAGEN",
            "peso_bruto": 4.00,
            "peso_seco": 2.60,
            "carga_util": 1.40,
            "longitud": 6.84,
            "ancho": 2.04,
            "altura": 2.59,
            "numero_asientos": 16,
            "numero_pasajeros": 15,
            "numero_cilindros": 4,
            "numero_ejes": 2,
            "numero_ruedas": 4
        },
        {
            "patron": r"H350",
            "marca": "HYUNDAI",
            "peso_bruto": 4.00,
            "peso_seco": 2.65,
            "carga_util": 1.35,
            "longitud": 6.20,
            "ancho": 2.04,
            "altura": 2.69,
            "numero_asientos": 16,
            "numero_pasajeros": 15,
            "numero_cilindros": 4,
            "numero_ejes": 2,
            "numero_ruedas": 4
        },
        {
            "patron": r"TRANSIT",
            "marca": "FORD",
            "peso_bruto": 4.00,
            "peso_seco": 2.50,
            "carga_util": 1.50,
            "longitud": 5.98,
            "ancho": 2.06,
            "altura": 2.78,
            "numero_asientos": 16,
            "numero_pasajeros": 15,
            "numero_cilindros": 4,
            "numero_ejes": 2,
            "numero_ruedas": 4
        }
    ]

    async def enriquecer_especificaciones_tecnicas(self, vehiculo_data: Optional[dict]) -> Optional[dict]:
        """Enriquece datos técnicos de medidas y pesos a través de homologación en BD local o catálogo oficial"""
        if not vehiculo_data:
            return vehiculo_data

        tiene_pesos = vehiculo_data.get("peso_bruto") is not None and vehiculo_data.get("peso_bruto") > 0
        tiene_medidas = vehiculo_data.get("longitud") is not None and vehiculo_data.get("longitud") > 0
        if tiene_pesos and tiene_medidas:
            return vehiculo_data

        modelo = str(vehiculo_data.get("modelo") or "").upper().strip()
        marca = str(vehiculo_data.get("marca") or "").upper().strip()

        # 1. Buscar en BD local vehiculos_data un vehículo homólogo del mismo modelo con pesos y medidas válidos
        homologo = None
        if modelo:
            tokens = [t for t in re.split(r'[\s/,-]+', modelo) if len(t) >= 2]
            busquedas = []
            if len(tokens) >= 2:
                busquedas.append(f"{tokens[0]} {tokens[1]}")
            if tokens:
                busquedas.append(tokens[0])
                if len(tokens) > 1 and tokens[1].isdigit():
                    busquedas.append(tokens[1])

            for term in busquedas:
                filtro = {
                    "modelo": {"$regex": re.escape(term), "$options": "i"},
                    "peso_bruto": {"$gt": 0},
                    "longitud": {"$gt": 0}
                }
                if marca and marca not in ("OTRO", "DESCONOCIDA", ""):
                    filtro["marca"] = {"$regex": re.escape(marca.split()[0]), "$options": "i"}
                homologo = await self.collection.find_one(filtro)
                if homologo:
                    break

        campos_tecnicos = [
            "peso_bruto", "peso_seco", "peso_neto", "carga_util",
            "longitud", "ancho", "altura",
            "numero_asientos", "numero_pasajeros", "numero_cilindros",
            "numero_ejes", "numero_ruedas"
        ]

        if homologo:
            logger.info(f"Enriqueciendo datos técnicos para {vehiculo_data.get('placa_actual')} desde homólogo {homologo.get('placa_actual')} ({homologo.get('modelo')})")
            for c in campos_tecnicos:
                val = homologo.get(c)
                if (not vehiculo_data.get(c) or vehiculo_data.get(c) == 0) and val is not None and val > 0:
                    vehiculo_data[c] = val

        # 2. Catálogo técnico estándar regional si aún faltan pesos o medidas
        if not vehiculo_data.get("peso_bruto") or not vehiculo_data.get("longitud"):
            for item_cat in self.CATALOGO_TECNICO_ESTANDAR:
                if re.search(item_cat["patron"], modelo, re.IGNORECASE):
                    logger.info(f"Aplicando especificaciones de catálogo para {vehiculo_data.get('placa_actual')} modelo {modelo}")
                    for k, val in item_cat.items():
                        if k != "patron" and (not vehiculo_data.get(k) or vehiculo_data.get(k) == 0):
                            vehiculo_data[k] = val
                    if not vehiculo_data.get("peso_neto") and item_cat.get("peso_seco"):
                        vehiculo_data["peso_neto"] = item_cat["peso_seco"]
                    break

        # Defaults de rodaje y cilindros si siguen vacíos
        if not vehiculo_data.get("numero_cilindros"):
            vehiculo_data["numero_cilindros"] = 4
        if not vehiculo_data.get("numero_ejes"):
            vehiculo_data["numero_ejes"] = 2
        if not vehiculo_data.get("numero_ruedas"):
            vehiculo_data["numero_ruedas"] = 4
        if not vehiculo_data.get("numero_asientos"):
            vehiculo_data["numero_asientos"] = 16
        # Normalizar medidas y pesos a 3 decimales estrictos
        campos_medidas_pesos = [
            "peso_bruto", "peso_seco", "peso_neto", "carga_util",
            "longitud", "ancho", "altura"
        ]
        for campo in campos_medidas_pesos:
            if vehiculo_data.get(campo) is not None:
                try:
                    val = float(vehiculo_data[campo])
                    if val > 0:
                        vehiculo_data[campo] = round(val, 3)
                except Exception:
                    pass

        # Asegurar combustible normalizado (99% DIESEL)
        vehiculo_data["combustible"] = self.normalizar_combustible(vehiculo_data.get("combustible"))

        return vehiculo_data

    async def get_vehiculo_data(self, vehiculo_data_id: str) -> Optional[dict]:
        """Obtener datos técnicos por ID"""
        try:
            vehiculo_data = await self.collection.find_one({"_id": ObjectId(vehiculo_data_id)})
            if vehiculo_data:
                vehiculo_data["id"] = str(vehiculo_data.pop("_id"))
                return await self.enriquecer_especificaciones_tecnicas(vehiculo_data)
            return None
        except Exception:
            return None
    
    async def get_vehiculo_data_by_placa(self, placa: str, consultar_pcm: bool = True) -> Optional[dict]:
        """Buscar datos técnicos por placa (PCM tiene prioridad para specs excepto año fab, categoría y clase)"""
        clean_placa = placa.replace("-", "").strip().upper()
        formatted_placa = f"{clean_placa[:3]}-{clean_placa[3:]}" if len(clean_placa) == 6 else clean_placa
        
        # 1. Buscar en BD local
        vehiculo_data = await self.collection.find_one({
            "$or": [
                {"placa_actual": formatted_placa},
                {"placa_actual": clean_placa},
                {"placa": formatted_placa},
                {"placa": clean_placa}
            ]
        })
        if vehiculo_data:
            vehiculo_data["id"] = str(vehiculo_data.pop("_id"))
            # Limpiar clase si tenía erróneamente 'MICROBUS'
            if vehiculo_data.get("clase") == "MICROBUS":
                cat = str(vehiculo_data.get("categoria", "")).upper()
                vehiculo_data["clase"] = "C3" if "C3" in cat else ""
            vehiculo_data["origen"] = "DB_LOCAL"

        # 2. Si consultar_pcm es True, consultar API PCM externa
        resultado = None
        if consultar_pcm:
            pcm_data = await self.consultar_placa_pcm(placa)
            if pcm_data:
                if vehiculo_data:
                    merged = {**vehiculo_data}
                    if pcm_data.get("anio_fabricacion"):
                        merged["anio_fabricacion_pcm"] = pcm_data["anio_fabricacion"]
                    for k, val in pcm_data.items():
                        if val is not None and val != "":
                            if k in ["anio_fabricacion", "anio_modelo"]:
                                # Solo actualizar año si la BD local NO tenía año (> 1900)
                                if not merged.get(k) or merged[k] <= 1900:
                                    merged[k] = val
                            elif k in ["categoria", "clase"]:
                                if not merged.get(k):
                                    merged[k] = val
                            elif k == "combustible":
                                merged[k] = self.normalizar_combustible(merged.get(k) or val)
                            else:
                                merged[k] = val
                    merged["origen"] = "PCM_API"
                    resultado = merged
                else:
                    resultado = pcm_data
            else:
                resultado = vehiculo_data
        else:
            resultado = vehiculo_data
                
        if resultado:
            resultado = await self.enriquecer_especificaciones_tecnicas(resultado)
        return resultado
    
    async def get_vehiculo_data_by_vin(self, vin: str) -> Optional[dict]:
        """Buscar datos técnicos por VIN"""
        vehiculo_data = await self.collection.find_one({"vin": vin.upper()})
        if vehiculo_data:
            vehiculo_data["id"] = str(vehiculo_data.pop("_id"))
            return vehiculo_data
        return None
    
    async def update_vehiculo_data(self, vehiculo_data_id: str, update_data: dict) -> Optional[dict]:
        """Actualizar datos técnicos"""
        
        # Validar que existe
        existing = await self.get_vehiculo_data(vehiculo_data_id)
        if not existing:
            return None
        
        # Si se actualiza la placa, verificar que no exista
        if "placa_actual" in update_data:
            placa_existente = await self.collection.find_one({
                "placa_actual": update_data["placa_actual"],
                "_id": {"$ne": ObjectId(vehiculo_data_id)}
            })
            if placa_existente:
                raise ValidationErrorException("placa_actual", "La placa ya existe")
        
        # Si se actualiza el VIN, verificar que no exista
        if "vin" in update_data:
            vin_existente = await self.collection.find_one({
                "vin": update_data["vin"],
                "_id": {"$ne": ObjectId(vehiculo_data_id)}
            })
            if vin_existente:
                raise ValidationErrorException("vin", "El VIN ya existe")
        
        # Actualizar
        update_data["fecha_actualizacion"] = datetime.utcnow()
        
        await self.collection.update_one(
            {"_id": ObjectId(vehiculo_data_id)},
            {"$set": update_data}
        )
        
        return await self.get_vehiculo_data(vehiculo_data_id)
    
    async def delete_vehiculo_data(self, vehiculo_data_id: str) -> bool:
        """Eliminar datos técnicos (físicamente)"""
        result = await self.collection.delete_one({"_id": ObjectId(vehiculo_data_id)})
        return result.deleted_count > 0
    
    async def list_vehiculos_data(
        self,
        skip: int = 0,
        limit: int = 1000,
        marca: Optional[str] = None,
        categoria: Optional[str] = None,
        q: Optional[str] = None
    ) -> List[dict]:
        """Listar datos técnicos con filtros y búsqueda de texto libre"""
        
        query = self._build_query(q, marca, categoria)
        
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("placa_actual", 1)
        vehiculos_data = []
        
        async for vehiculo_data in cursor:
            vehiculo_data["id"] = str(vehiculo_data.pop("_id"))
            vehiculos_data.append(vehiculo_data)
        
        return vehiculos_data
    
    def _build_query(self, q: Optional[str] = None, marca: Optional[str] = None, categoria: Optional[str] = None) -> dict:
        """Construir query de MongoDB a partir de los filtros"""
        query: dict = {}
        
        if q and q.strip():
            texto = q.strip()
            query["$or"] = [
                {"placa_actual": {"$regex": texto, "$options": "i"}},
                {"marca": {"$regex": texto, "$options": "i"}},
                {"modelo": {"$regex": texto, "$options": "i"}},
                {"numero_motor": {"$regex": texto, "$options": "i"}},
                {"vin": {"$regex": texto, "$options": "i"}},
                {"pcmMetadata.pcm_propietario": {"$regex": texto, "$options": "i"}},
            ]
        
        if marca:
            query["marca"] = {"$regex": marca, "$options": "i"}
        
        if categoria:
            query["categoria"] = categoria
        
        return query
    
    async def count_vehiculos_data(self, q: Optional[str] = None, marca: Optional[str] = None, categoria: Optional[str] = None) -> int:
        """Contar total de registros con los mismos filtros"""
        query = self._build_query(q, marca, categoria)
        return await self.collection.count_documents(query)
