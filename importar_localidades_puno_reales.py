#!/usr/bin/env python3
"""
Script para importar localidades reales del departamento de PUNO
Datos oficiales del INEI
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import sys

# Configuración de MongoDB
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}✅ {text}{Colors.RESET}")

def print_error(text: str):
    print(f"{Colors.RED}❌ {text}{Colors.RESET}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.RESET}")

def print_info(text: str):
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.RESET}")

# Localidades reales de PUNO (Datos oficiales INEI)
LOCALIDADES_PUNO = [
    # PROVINCIA: PUNO
    {"nombre": "PUNO", "ubigeo": "210101", "tipo": "CIUDAD", "departamento": "PUNO", "provincia": "PUNO", "distrito": "PUNO", "capital": True},
    {"nombre": "ACORA", "ubigeo": "210102", "tipo": "CIUDAD", "departamento": "PUNO", "provincia": "PUNO", "distrito": "ACORA"},
    {"nombre": "AMANTANI", "ubigeo": "210103", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "PUNO", "distrito": "AMANTANI"},
    {"nombre": "ATUNCOLLA", "ubigeo": "210104", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "PUNO", "distrito": "ATUNCOLLA"},
    {"nombre": "CAPACHICA", "ubigeo": "210105", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "PUNO", "distrito": "CAPACHICA"},
    {"nombre": "CHUCUITO", "ubigeo": "210107", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "PUNO", "distrito": "CHUCUITO"},
    {"nombre": "COATA", "ubigeo": "210108", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "PUNO", "distrito": "COATA"},
    {"nombre": "HUATA", "ubigeo": "210109", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "PUNO", "distrito": "HUATA"},
    {"nombre": "MAÑAZO", "ubigeo": "210110", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "PUNO", "distrito": "MAÑAZO"},
    {"nombre": "PAUCARCOLLA", "ubigeo": "210111", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "PUNO", "distrito": "PAUCARCOLLA"},
    {"nombre": "PICHACANI", "ubigeo": "210112", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "PUNO", "distrito": "PICHACANI"},
    {"nombre": "PLATERIA", "ubigeo": "210113", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "PUNO", "distrito": "PLATERIA"},
    {"nombre": "SAN ANTONIO", "ubigeo": "210114", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "PUNO", "distrito": "SAN ANTONIO"},
    {"nombre": "TIQUILLACA", "ubigeo": "210115", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "PUNO", "distrito": "TIQUILLACA"},
    {"nombre": "VILQUE", "ubigeo": "210116", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "PUNO", "distrito": "VILQUE"},
    
    # PROVINCIA: AZANGARO
    {"nombre": "AZANGARO", "ubigeo": "210201", "tipo": "CIUDAD", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "AZANGARO", "capital": True},
    {"nombre": "ACHAYA", "ubigeo": "210202", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "ACHAYA"},
    {"nombre": "ARAPA", "ubigeo": "210203", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "ARAPA"},
    {"nombre": "ASILLO", "ubigeo": "210204", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "ASILLO"},
    {"nombre": "CAMINACA", "ubigeo": "210205", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "CAMINACA"},
    {"nombre": "CHUPA", "ubigeo": "210206", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "CHUPA"},
    {"nombre": "JOSE DOMINGO CHOQUEHUANCA", "ubigeo": "210207", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "JOSE DOMINGO CHOQUEHUANCA"},
    {"nombre": "MUÑANI", "ubigeo": "210208", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "MUÑANI"},
    {"nombre": "POTONI", "ubigeo": "210209", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "POTONI"},
    {"nombre": "SAMAN", "ubigeo": "210210", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "SAMAN"},
    {"nombre": "SAN ANTON", "ubigeo": "210211", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "SAN ANTON"},
    {"nombre": "SAN JOSE", "ubigeo": "210212", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "SAN JOSE"},
    {"nombre": "SAN JUAN DE SALINAS", "ubigeo": "210213", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "SAN JUAN DE SALINAS"},
    {"nombre": "SANTIAGO DE PUPUJA", "ubigeo": "210214", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "SANTIAGO DE PUPUJA"},
    {"nombre": "TIRAPATA", "ubigeo": "210215", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "TIRAPATA"},
    
    # PROVINCIA: CARABAYA
    {"nombre": "MACUSANI", "ubigeo": "210301", "tipo": "CIUDAD", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "MACUSANI", "capital": True},
    {"nombre": "AJOYANI", "ubigeo": "210302", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "AJOYANI"},
    {"nombre": "AYAPATA", "ubigeo": "210303", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "AYAPATA"},
    {"nombre": "COASA", "ubigeo": "210304", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "COASA"},
    {"nombre": "CORANI", "ubigeo": "210305", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "CORANI"},
    {"nombre": "CRUCERO", "ubigeo": "210306", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "CRUCERO"},
    {"nombre": "ITUATA", "ubigeo": "210307", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "ITUATA"},
    {"nombre": "OLLACHEA", "ubigeo": "210308", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "OLLACHEA"},
    {"nombre": "SAN GABAN", "ubigeo": "210309", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "SAN GABAN"},
    {"nombre": "USICAYOS", "ubigeo": "210310", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "USICAYOS"},
    
    # PROVINCIA: CHUCUITO
    {"nombre": "JULI", "ubigeo": "210401", "tipo": "CIUDAD", "departamento": "PUNO", "provincia": "CHUCUITO", "distrito": "JULI", "capital": True},
    {"nombre": "DESAGUADERO", "ubigeo": "210402", "tipo": "CIUDAD", "departamento": "PUNO", "provincia": "CHUCUITO", "distrito": "DESAGUADERO"},
    {"nombre": "HUACULLANI", "ubigeo": "210403", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "CHUCUITO", "distrito": "HUACULLANI"},
    {"nombre": "KELLUYO", "ubigeo": "210404", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "CHUCUITO", "distrito": "KELLUYO"},
    {"nombre": "PISACOMA", "ubigeo": "210405", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "CHUCUITO", "distrito": "PISACOMA"},
    {"nombre": "POMATA", "ubigeo": "210406", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "CHUCUITO", "distrito": "POMATA"},
    {"nombre": "ZEPITA", "ubigeo": "210407", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "CHUCUITO", "distrito": "ZEPITA"},
    
    # PROVINCIA: EL COLLAO
    {"nombre": "ILAVE", "ubigeo": "210501", "tipo": "CIUDAD", "departamento": "PUNO", "provincia": "EL COLLAO", "distrito": "ILAVE", "capital": True},
    {"nombre": "CAPAZO", "ubigeo": "210502", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "EL COLLAO", "distrito": "CAPAZO"},
    {"nombre": "PILCUYO", "ubigeo": "210503", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "EL COLLAO", "distrito": "PILCUYO"},
    {"nombre": "SANTA ROSA", "ubigeo": "210504", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "EL COLLAO", "distrito": "SANTA ROSA"},
    {"nombre": "CONDURIRI", "ubigeo": "210505", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "EL COLLAO", "distrito": "CONDURIRI"},
    
    # PROVINCIA: HUANCANE
    {"nombre": "HUANCANE", "ubigeo": "210601", "tipo": "CIUDAD", "departamento": "PUNO", "provincia": "HUANCANE", "distrito": "HUANCANE", "capital": True},
    {"nombre": "COJATA", "ubigeo": "210602", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "HUANCANE", "distrito": "COJATA"},
    {"nombre": "HUATASANI", "ubigeo": "210603", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "HUANCANE", "distrito": "HUATASANI"},
    {"nombre": "INCHUPALLA", "ubigeo": "210604", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "HUANCANE", "distrito": "INCHUPALLA"},
    {"nombre": "PUSI", "ubigeo": "210605", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "HUANCANE", "distrito": "PUSI"},
    {"nombre": "ROSASPATA", "ubigeo": "210606", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "HUANCANE", "distrito": "ROSASPATA"},
    {"nombre": "TARACO", "ubigeo": "210607", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "HUANCANE", "distrito": "TARACO"},
    {"nombre": "VILQUE CHICO", "ubigeo": "210608", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "HUANCANE", "distrito": "VILQUE CHICO"},
    
    # PROVINCIA: LAMPA
    {"nombre": "LAMPA", "ubigeo": "210701", "tipo": "CIUDAD", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "LAMPA", "capital": True},
    {"nombre": "CABANILLA", "ubigeo": "210702", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "CABANILLA"},
    {"nombre": "CALAPUJA", "ubigeo": "210703", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "CALAPUJA"},
    {"nombre": "NICASIO", "ubigeo": "210704", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "NICASIO"},
    {"nombre": "OCUVIRI", "ubigeo": "210705", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "OCUVIRI"},
    {"nombre": "PALCA", "ubigeo": "210706", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "PALCA"},
    {"nombre": "PARATIA", "ubigeo": "210707", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "PARATIA"},
    {"nombre": "PUCARA", "ubigeo": "210708", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "PUCARA"},
    {"nombre": "SANTA LUCIA", "ubigeo": "210709", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "SANTA LUCIA"},
    {"nombre": "VILAVILA", "ubigeo": "210710", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "VILAVILA"},
    
    # PROVINCIA: MELGAR
    {"nombre": "AYAVIRI", "ubigeo": "210801", "tipo": "CIUDAD", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "AYAVIRI", "capital": True},
    {"nombre": "ANTAUTA", "ubigeo": "210802", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "ANTAUTA"},
    {"nombre": "CUPI", "ubigeo": "210803", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "CUPI"},
    {"nombre": "LLALLI", "ubigeo": "210804", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "LLALLI"},
    {"nombre": "MACARI", "ubigeo": "210805", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "MACARI"},
    {"nombre": "NUÑOA", "ubigeo": "210806", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "NUÑOA"},
    {"nombre": "ORURILLO", "ubigeo": "210807", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "ORURILLO"},
    {"nombre": "SANTA ROSA", "ubigeo": "210808", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "SANTA ROSA"},
    {"nombre": "UMACHIRI", "ubigeo": "210809", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "UMACHIRI"},
    
    # PROVINCIA: MOHO
    {"nombre": "MOHO", "ubigeo": "210901", "tipo": "CIUDAD", "departamento": "PUNO", "provincia": "MOHO", "distrito": "MOHO", "capital": True},
    {"nombre": "CONIMA", "ubigeo": "210902", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "MOHO", "distrito": "CONIMA"},
    {"nombre": "HUAYRAPATA", "ubigeo": "210903", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "MOHO", "distrito": "HUAYRAPATA"},
    {"nombre": "TILALI", "ubigeo": "210904", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "MOHO", "distrito": "TILALI"},
    
    # PROVINCIA: SAN ANTONIO DE PUTINA
    {"nombre": "PUTINA", "ubigeo": "211001", "tipo": "CIUDAD", "departamento": "PUNO", "provincia": "SAN ANTONIO DE PUTINA", "distrito": "PUTINA", "capital": True},
    {"nombre": "ANANEA", "ubigeo": "211002", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "SAN ANTONIO DE PUTINA", "distrito": "ANANEA"},
    {"nombre": "PEDRO VILCA APAZA", "ubigeo": "211003", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "SAN ANTONIO DE PUTINA", "distrito": "PEDRO VILCA APAZA"},
    {"nombre": "QUILCAPUNCU", "ubigeo": "211004", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "SAN ANTONIO DE PUTINA", "distrito": "QUILCAPUNCU"},
    {"nombre": "SINA", "ubigeo": "211005", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "SAN ANTONIO DE PUTINA", "distrito": "SINA"},
    
    # PROVINCIA: SAN ROMAN
    {"nombre": "JULIACA", "ubigeo": "211101", "tipo": "CIUDAD", "departamento": "PUNO", "provincia": "SAN ROMAN", "distrito": "JULIACA", "capital": True},
    {"nombre": "CABANA", "ubigeo": "211102", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "SAN ROMAN", "distrito": "CABANA"},
    {"nombre": "CABANILLAS", "ubigeo": "211103", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "SAN ROMAN", "distrito": "CABANILLAS"},
    {"nombre": "CARACOTO", "ubigeo": "211104", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "SAN ROMAN", "distrito": "CARACOTO"},
    
    # PROVINCIA: SANDIA
    {"nombre": "SANDIA", "ubigeo": "211201", "tipo": "CIUDAD", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "SANDIA", "capital": True},
    {"nombre": "CUYOCUYO", "ubigeo": "211202", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "CUYOCUYO"},
    {"nombre": "LIMBANI", "ubigeo": "211203", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "LIMBANI"},
    {"nombre": "PATAMBUCO", "ubigeo": "211204", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "PATAMBUCO"},
    {"nombre": "PHARA", "ubigeo": "211205", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "PHARA"},
    {"nombre": "QUIACA", "ubigeo": "211206", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "QUIACA"},
    {"nombre": "SAN JUAN DEL ORO", "ubigeo": "211207", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "SAN JUAN DEL ORO"},
    {"nombre": "YANAHUAYA", "ubigeo": "211208", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "YANAHUAYA"},
    {"nombre": "ALTO INAMBARI", "ubigeo": "211209", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "ALTO INAMBARI"},
    {"nombre": "SAN PEDRO DE PUTINA PUNCO", "ubigeo": "211210", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "SAN PEDRO DE PUTINA PUNCO"},
    
    # PROVINCIA: YUNGUYO
    {"nombre": "YUNGUYO", "ubigeo": "211301", "tipo": "CIUDAD", "departamento": "PUNO", "provincia": "YUNGUYO", "distrito": "YUNGUYO", "capital": True},
    {"nombre": "ANAPIA", "ubigeo": "211302", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "YUNGUYO", "distrito": "ANAPIA"},
    {"nombre": "COPANI", "ubigeo": "211303", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "YUNGUYO", "distrito": "COPANI"},
    {"nombre": "CUTURAPI", "ubigeo": "211304", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "YUNGUYO", "distrito": "CUTURAPI"},
    {"nombre": "OLLARAYA", "ubigeo": "211305", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "YUNGUYO", "distrito": "OLLARAYA"},
    {"nombre": "TINICACHI", "ubigeo": "211306", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "YUNGUYO", "distrito": "TINICACHI"},
    {"nombre": "UNICACHI", "ubigeo": "211307", "tipo": "LOCALIDAD", "departamento": "PUNO", "provincia": "YUNGUYO", "distrito": "UNICACHI"},
]

async def importar_localidades():
    """Importar localidades reales de PUNO"""
    
    print_header("📥 IMPORTACIÓN DE LOCALIDADES DE PUNO")
    
    try:
        # Conectar a MongoDB
        print_info("Conectando a MongoDB...")
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        collection = db.localidades
        
        # Verificar si ya hay localidades
        total_existente = await collection.count_documents({})
        
        if total_existente > 0:
            print_warning(f"Ya existen {total_existente} localidades en la base de datos")
            respuesta = input("¿Deseas eliminarlas y volver a importar? (s/n): ")
            
            if respuesta.lower() == 's':
                print_info("Eliminando localidades existentes...")
                result = await collection.delete_many({})
                print_success(f"Eliminadas {result.deleted_count} localidades")
            else:
                print_info("Importación cancelada")
                client.close()
                return
        
        # Importar localidades
        print_header("📥 Importando Localidades")
        
        importadas = 0
        errores = 0
        
        for localidad in LOCALIDADES_PUNO:
            try:
                # Agregar campos adicionales
                localidad_completa = {
                    **localidad,
                    "estaActiva": True,
                    "fechaCreacion": datetime.utcnow(),
                    "fechaActualizacion": datetime.utcnow()
                }
                
                # Insertar
                await collection.insert_one(localidad_completa)
                importadas += 1
                
                if importadas % 20 == 0:
                    print_info(f"Importadas {importadas} localidades...")
                
            except Exception as e:
                print_error(f"Error importando {localidad.get('nombre', 'DESCONOCIDO')}: {e}")
                errores += 1
        
        print_success(f"\nTotal importadas: {importadas}")
        
        if errores > 0:
            print_warning(f"Errores: {errores}")
        
        # Estadísticas
        print_header("📊 Estadísticas de Importación")
        
        total = await collection.count_documents({})
        print_info(f"Total de localidades: {total}")
        
        # Por tipo
        print_info("\nPor tipo:")
        tipos = await collection.distinct("tipo")
        for tipo in sorted(tipos):
            count = await collection.count_documents({"tipo": tipo})
            porcentaje = (count / total * 100) if total > 0 else 0
            print_info(f"  - {tipo}: {count} ({porcentaje:.1f}%)")
        
        # Por provincia
        print_info("\nPor provincia:")
        provincias = await collection.distinct("provincia")
        for prov in sorted(provincias):
            count = await collection.count_documents({"provincia": prov})
            print_info(f"  - {prov}: {count}")
        
        # Capitales
        capitales = await collection.count_documents({"capital": True})
        print_info(f"\nCapitales provinciales: {capitales}")
        
        print_header("✅ IMPORTACIÓN COMPLETADA")
        print_success(f"Se importaron {importadas} localidades reales de PUNO")
        print_success("Base de datos lista para usar")
        
        # Cerrar conexión
        client.close()
        
    except Exception as e:
        print_error(f"Error durante la importación: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

async def main():
    """Función principal"""
    await importar_localidades()

if __name__ == "__main__":
    asyncio.run(main())
