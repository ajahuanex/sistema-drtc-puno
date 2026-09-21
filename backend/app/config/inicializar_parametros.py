import logging
from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

# Semillas de parámetros por defecto requeridos por el sistema
PARAMETROS_DEFAULT = [
    {
        "clave": "ANIOS_VIGENCIA_DEFAULT",
        "nombre": "Años de Vigencia por Defecto (Resoluciones)",
        "descripcion": "Valor por defecto para los años de vigencia asignados a una nueva resolución.",
        "valor": 10,
        "tipo": "entero",
        "categoria": "resoluciones",
        "editable": True
    },
    {
        "clave": "MIN_ANIOS_VIGENCIA",
        "nombre": "Mínimo de Años de Vigencia permitidos",
        "descripcion": "Años mínimos que se pueden ingresar en el formulario de resoluciones.",
        "valor": 1,
        "tipo": "entero",
        "categoria": "resoluciones",
        "editable": True
    },
    {
        "clave": "MAX_ANIOS_VIGENCIA",
        "nombre": "Máximo de Años de Vigencia permitidos",
        "descripcion": "Años máximos permitidos en el formulario de resoluciones.",
        "valor": 10,
        "tipo": "entero",
        "categoria": "resoluciones",
        "editable": True
    },
    {
        "clave": "SUNAT_SYNC_ENABLED",
        "nombre": "Sincronización con SUNAT Habilitada",
        "descripcion": "Si está apagado, el sistema omitirá la validación con SUNAT para las empresas.",
        "valor": True,
        "tipo": "booleano",
        "categoria": "interoperabilidad",
        "editable": True
    },
    {
        "clave": "RENIEC_SYNC_ENABLED",
        "nombre": "Sincronización con RENIEC Habilitada",
        "descripcion": "Si está apagado, se permitirá el ingreso manual de datos sin validar con RENIEC.",
        "valor": True,
        "tipo": "booleano",
        "categoria": "interoperabilidad",
        "editable": True
    },
    {
        "clave": "INTEROPERABILIDAD_BASE_URL",
        "nombre": "Dominio / URL Base del Servicio de Interoperabilidad",
        "descripcion": "Servidor principal que provee los servicios web de consultas externas (PCM / SUNAT / SUNARP / RENIEC).",
        "valor": "https://pcm.guillermo.pe",
        "tipo": "texto",
        "categoria": "interoperabilidad",
        "editable": True
    },
    {
        "clave": "INTEROPERABILIDAD_API_KEY",
        "nombre": "Clave de API / Token de Interoperabilidad",
        "descripcion": "Token Bearer o credencial de autorización opcional para el servidor de interoperabilidad.",
        "valor": "",
        "tipo": "texto",
        "categoria": "interoperabilidad",
        "editable": True
    },
    {
        "clave": "INTEROPERABILIDAD_TIMEOUT",
        "nombre": "Tiempo Límite de Interoperabilidad (Segundos)",
        "descripcion": "Timeout máximo para esperar respuesta de servicios externos de interoperabilidad.",
        "valor": 15,
        "tipo": "entero",
        "categoria": "interoperabilidad",
        "editable": True
    },
    {
        "clave": "SESSION_TIMEOUT_MINUTES",
        "nombre": "Expiración de Sesión (Minutos)",
        "descripcion": "Tiempo máximo de inactividad antes de cerrar la sesión automáticamente.",
        "valor": 60,
        "tipo": "entero",
        "categoria": "sistema",
        "editable": True
    },
    {
        "clave": "MAX_EXPEDIENTES_OFICINA",
        "nombre": "Límite de Expedientes por Oficina",
        "descripcion": "Límite de prevención de sobrecarga para expedientes asignados a una oficina simultáneamente.",
        "valor": 1000,
        "tipo": "entero",
        "categoria": "expedientes",
        "editable": True
    },
    {
        "clave": "DIAS_ANTES_VENCIMIENTO_ALERTA",
        "nombre": "Alerta Preventiva de Vencimiento (Días)",
        "descripcion": "Días previos a un vencimiento en los que el sistema empezará a mostrar alertas.",
        "valor": 30,
        "tipo": "entero",
        "categoria": "notificaciones",
        "editable": True
    }
]

async def inicializar_parametros_db(db: AsyncIOMotorDatabase):
    """
    Verifica si los parámetros básicos del sistema existen en MongoDB.
    Si no existen, los crea. Se ejecuta al arrancar el backend.
    """
    try:
        col = db["parametros_sistema"]
        
        # Crear índice único para la clave si no existe
        await col.create_index("clave", unique=True, background=True)
        
        nuevos_insertados = 0
        for parametro in PARAMETROS_DEFAULT:
            existe = await col.find_one({"clave": parametro["clave"]})
            if not existe:
                nuevo_doc = {
                    "id": str(uuid.uuid4()),
                    "clave": parametro["clave"],
                    "nombre": parametro["nombre"],
                    "descripcion": parametro["descripcion"],
                    "valor": parametro["valor"],
                    "tipo": parametro["tipo"],
                    "categoria": parametro["categoria"],
                    "editable": parametro["editable"],
                    "fechaCreacion": datetime.utcnow(),
                    "fechaActualizacion": datetime.utcnow()
                }
                await col.insert_one(nuevo_doc)
                nuevos_insertados += 1
                
        if nuevos_insertados > 0:
            logger.info(f"✅ Se inicializaron {nuevos_insertados} parámetros de sistema por defecto.")
        else:
            logger.info("ℹ️ Parámetros de sistema ya inicializados.")
            
    except Exception as e:
        logger.error(f"❌ Error al inicializar parámetros en MongoDB: {e}")
