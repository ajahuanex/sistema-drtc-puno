#!/usr/bin/env python3
"""
Script para importar datos oficiales de localidades del INEI
"""

import requests
import json
import pandas as pd
from io import StringIO

def importar_localidades_inei():
    """Importar localidades oficiales del INEI"""
    
    print("📊 IMPORTANDO DATOS OFICIALES DEL INEI")
    print("=" * 50)
    
    # Datos oficiales de Puno según INEI
    localidades_puno = [
        # PROVINCIAS
        {"nombre": "PUNO", "tipo": "PROVINCIA", "departamento": "PUNO", "provincia": "PUNO", "distrito": "", "ubigeo": "2101", "nivel_territorial": "PROVINCIA"},
        {"nombre": "AZANGARO", "tipo": "PROVINCIA", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "", "ubigeo": "2102", "nivel_territorial": "PROVINCIA"},
        {"nombre": "CARABAYA", "tipo": "PROVINCIA", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "", "ubigeo": "2104", "nivel_territorial": "PROVINCIA"},
        {"nombre": "CHUCUITO", "tipo": "PROVINCIA", "departamento": "PUNO", "provincia": "CHUCUITO", "distrito": "", "ubigeo": "2105", "nivel_territorial": "PROVINCIA"},
        {"nombre": "EL COLLAO", "tipo": "PROVINCIA", "departamento": "PUNO", "provincia": "EL COLLAO", "distrito": "", "ubigeo": "2106", "nivel_territorial": "PROVINCIA"},
        {"nombre": "HUANCANE", "tipo": "PROVINCIA", "departamento": "PUNO", "provincia": "HUANCANE", "distrito": "", "ubigeo": "2107", "nivel_territorial": "PROVINCIA"},
        {"nombre": "LAMPA", "tipo": "PROVINCIA", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "", "ubigeo": "2108", "nivel_territorial": "PROVINCIA"},
        {"nombre": "MELGAR", "tipo": "PROVINCIA", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "", "ubigeo": "2109", "nivel_territorial": "PROVINCIA"},
        {"nombre": "MOHO", "tipo": "PROVINCIA", "departamento": "PUNO", "provincia": "MOHO", "distrito": "", "ubigeo": "2110", "nivel_territorial": "PROVINCIA"},
        {"nombre": "SAN ANTONIO DE PUTINA", "tipo": "PROVINCIA", "departamento": "PUNO", "provincia": "SAN ANTONIO DE PUTINA", "distrito": "", "ubigeo": "2112", "nivel_territorial": "PROVINCIA"},
        {"nombre": "SAN ROMAN", "tipo": "PROVINCIA", "departamento": "PUNO", "provincia": "SAN ROMAN", "distrito": "", "ubigeo": "2113", "nivel_territorial": "PROVINCIA"},
        {"nombre": "SANDIA", "tipo": "PROVINCIA", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "", "ubigeo": "2114", "nivel_territorial": "PROVINCIA"},
        {"nombre": "YUNGUYO", "tipo": "PROVINCIA", "departamento": "PUNO", "provincia": "YUNGUYO", "distrito": "", "ubigeo": "2115", "nivel_territorial": "PROVINCIA"},
        
        # DISTRITOS PROVINCIA PUNO
        {"nombre": "PUNO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "PUNO", "distrito": "PUNO", "ubigeo": "210101", "nivel_territorial": "DISTRITO"},
        {"nombre": "ACORA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "PUNO", "distrito": "ACORA", "ubigeo": "210102", "nivel_territorial": "DISTRITO"},
        {"nombre": "AMANTANI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "PUNO", "distrito": "AMANTANI", "ubigeo": "210103", "nivel_territorial": "DISTRITO"},
        {"nombre": "ATUNCOLLA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "PUNO", "distrito": "ATUNCOLLA", "ubigeo": "210104", "nivel_territorial": "DISTRITO"},
        {"nombre": "CAPACHICA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "PUNO", "distrito": "CAPACHICA", "ubigeo": "210105", "nivel_territorial": "DISTRITO"},
        {"nombre": "CHUCUITO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "PUNO", "distrito": "CHUCUITO", "ubigeo": "210106", "nivel_territorial": "DISTRITO"},
        {"nombre": "COATA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "PUNO", "distrito": "COATA", "ubigeo": "210107", "nivel_territorial": "DISTRITO"},
        {"nombre": "HUATA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "PUNO", "distrito": "HUATA", "ubigeo": "210108", "nivel_territorial": "DISTRITO"},
        {"nombre": "MAÑAZO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "PUNO", "distrito": "MAÑAZO", "ubigeo": "210109", "nivel_territorial": "DISTRITO"},
        {"nombre": "PAUCARCOLLA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "PUNO", "distrito": "PAUCARCOLLA", "ubigeo": "210110", "nivel_territorial": "DISTRITO"},
        {"nombre": "PICHACANI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "PUNO", "distrito": "PICHACANI", "ubigeo": "210111", "nivel_territorial": "DISTRITO"},
        {"nombre": "PLATERIA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "PUNO", "distrito": "PLATERIA", "ubigeo": "210112", "nivel_territorial": "DISTRITO"},
        {"nombre": "SAN ANTONIO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "PUNO", "distrito": "SAN ANTONIO", "ubigeo": "210113", "nivel_territorial": "DISTRITO"},
        {"nombre": "TIQUILLACA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "PUNO", "distrito": "TIQUILLACA", "ubigeo": "210114", "nivel_territorial": "DISTRITO"},
        {"nombre": "VILQUE", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "PUNO", "distrito": "VILQUE", "ubigeo": "210115", "nivel_territorial": "DISTRITO"},
        
        # DISTRITOS PROVINCIA AZANGARO
        {"nombre": "AZANGARO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "AZANGARO", "ubigeo": "210201", "nivel_territorial": "DISTRITO"},
        {"nombre": "ACHAYA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "ACHAYA", "ubigeo": "210202", "nivel_territorial": "DISTRITO"},
        {"nombre": "ARAPA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "ARAPA", "ubigeo": "210203", "nivel_territorial": "DISTRITO"},
        {"nombre": "ASILLO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "ASILLO", "ubigeo": "210204", "nivel_territorial": "DISTRITO"},
        {"nombre": "CAMINACA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "CAMINACA", "ubigeo": "210205", "nivel_territorial": "DISTRITO"},
        {"nombre": "CHUPA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "CHUPA", "ubigeo": "210206", "nivel_territorial": "DISTRITO"},
        {"nombre": "JOSE DOMINGO CHOQUEHUANCA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "JOSE DOMINGO CHOQUEHUANCA", "ubigeo": "210207", "nivel_territorial": "DISTRITO"},
        {"nombre": "MUÑANI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "MUÑANI", "ubigeo": "210208", "nivel_territorial": "DISTRITO"},
        {"nombre": "POTONI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "POTONI", "ubigeo": "210209", "nivel_territorial": "DISTRITO"},
        {"nombre": "SAMAN", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "SAMAN", "ubigeo": "210210", "nivel_territorial": "DISTRITO"},
        {"nombre": "SAN ANTON", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "SAN ANTON", "ubigeo": "210211", "nivel_territorial": "DISTRITO"},
        {"nombre": "SAN JOSE", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "SAN JOSE", "ubigeo": "210212", "nivel_territorial": "DISTRITO"},
        {"nombre": "SAN JUAN DE SALINAS", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "SAN JUAN DE SALINAS", "ubigeo": "210213", "nivel_territorial": "DISTRITO"},
        {"nombre": "SANTIAGO DE PUPUJA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "SANTIAGO DE PUPUJA", "ubigeo": "210214", "nivel_territorial": "DISTRITO"},
        {"nombre": "TIRAPATA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "AZANGARO", "distrito": "TIRAPATA", "ubigeo": "210215", "nivel_territorial": "DISTRITO"},
        
        # DISTRITOS PROVINCIA CARABAYA
        {"nombre": "MACUSANI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "MACUSANI", "ubigeo": "210401", "nivel_territorial": "DISTRITO"},
        {"nombre": "AJOYANI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "AJOYANI", "ubigeo": "210402", "nivel_territorial": "DISTRITO"},
        {"nombre": "AYAPATA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "AYAPATA", "ubigeo": "210403", "nivel_territorial": "DISTRITO"},
        {"nombre": "COASA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "COASA", "ubigeo": "210404", "nivel_territorial": "DISTRITO"},
        {"nombre": "CORANI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "CORANI", "ubigeo": "210405", "nivel_territorial": "DISTRITO"},
        {"nombre": "CRUCERO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "CRUCERO", "ubigeo": "210406", "nivel_territorial": "DISTRITO"},
        {"nombre": "ITUATA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "ITUATA", "ubigeo": "210407", "nivel_territorial": "DISTRITO"},
        {"nombre": "OLLACHEA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "OLLACHEA", "ubigeo": "210408", "nivel_territorial": "DISTRITO"},
        {"nombre": "SAN GABAN", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "SAN GABAN", "ubigeo": "210409", "nivel_territorial": "DISTRITO"},
        {"nombre": "USICAYOS", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "CARABAYA", "distrito": "USICAYOS", "ubigeo": "210410", "nivel_territorial": "DISTRITO"},
        
        # DISTRITOS PROVINCIA CHUCUITO
        {"nombre": "JULI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "CHUCUITO", "distrito": "JULI", "ubigeo": "210501", "nivel_territorial": "DISTRITO"},
        {"nombre": "DESAGUADERO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "CHUCUITO", "distrito": "DESAGUADERO", "ubigeo": "210502", "nivel_territorial": "DISTRITO"},
        {"nombre": "HUACULLANI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "CHUCUITO", "distrito": "HUACULLANI", "ubigeo": "210503", "nivel_territorial": "DISTRITO"},
        {"nombre": "KELLUYO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "CHUCUITO", "distrito": "KELLUYO", "ubigeo": "210504", "nivel_territorial": "DISTRITO"},
        {"nombre": "PISACOMA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "CHUCUITO", "distrito": "PISACOMA", "ubigeo": "210505", "nivel_territorial": "DISTRITO"},
        {"nombre": "POMATA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "CHUCUITO", "distrito": "POMATA", "ubigeo": "210506", "nivel_territorial": "DISTRITO"},
        {"nombre": "ZEPITA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "CHUCUITO", "distrito": "ZEPITA", "ubigeo": "210507", "nivel_territorial": "DISTRITO"},
        
        # DISTRITOS PROVINCIA EL COLLAO
        {"nombre": "ILAVE", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "EL COLLAO", "distrito": "ILAVE", "ubigeo": "210601", "nivel_territorial": "DISTRITO"},
        {"nombre": "CAPAZO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "EL COLLAO", "distrito": "CAPAZO", "ubigeo": "210602", "nivel_territorial": "DISTRITO"},
        {"nombre": "PILCUYO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "EL COLLAO", "distrito": "PILCUYO", "ubigeo": "210603", "nivel_territorial": "DISTRITO"},
        {"nombre": "SANTA ROSA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "EL COLLAO", "distrito": "SANTA ROSA", "ubigeo": "210604", "nivel_territorial": "DISTRITO"},
        {"nombre": "CONDURIRI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "EL COLLAO", "distrito": "CONDURIRI", "ubigeo": "210605", "nivel_territorial": "DISTRITO"},
        
        # DISTRITOS PROVINCIA HUANCANE
        {"nombre": "HUANCANE", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "HUANCANE", "distrito": "HUANCANE", "ubigeo": "210701", "nivel_territorial": "DISTRITO"},
        {"nombre": "COJATA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "HUANCANE", "distrito": "COJATA", "ubigeo": "210702", "nivel_territorial": "DISTRITO"},
        {"nombre": "HUATASANI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "HUANCANE", "distrito": "HUATASANI", "ubigeo": "210703", "nivel_territorial": "DISTRITO"},
        {"nombre": "INCHUPALLA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "HUANCANE", "distrito": "INCHUPALLA", "ubigeo": "210704", "nivel_territorial": "DISTRITO"},
        {"nombre": "PUSI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "HUANCANE", "distrito": "PUSI", "ubigeo": "210705", "nivel_territorial": "DISTRITO"},
        {"nombre": "ROSASPATA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "HUANCANE", "distrito": "ROSASPATA", "ubigeo": "210706", "nivel_territorial": "DISTRITO"},
        {"nombre": "TARACO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "HUANCANE", "distrito": "TARACO", "ubigeo": "210707", "nivel_territorial": "DISTRITO"},
        {"nombre": "VILQUE CHICO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "HUANCANE", "distrito": "VILQUE CHICO", "ubigeo": "210708", "nivel_territorial": "DISTRITO"},
        
        # DISTRITOS PROVINCIA LAMPA
        {"nombre": "LAMPA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "LAMPA", "ubigeo": "210801", "nivel_territorial": "DISTRITO"},
        {"nombre": "CABANILLA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "CABANILLA", "ubigeo": "210802", "nivel_territorial": "DISTRITO"},
        {"nombre": "CALAPUJA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "CALAPUJA", "ubigeo": "210803", "nivel_territorial": "DISTRITO"},
        {"nombre": "NICASIO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "NICASIO", "ubigeo": "210804", "nivel_territorial": "DISTRITO"},
        {"nombre": "OCUVIRI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "OCUVIRI", "ubigeo": "210805", "nivel_territorial": "DISTRITO"},
        {"nombre": "PALCA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "PALCA", "ubigeo": "210806", "nivel_territorial": "DISTRITO"},
        {"nombre": "PARATIA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "PARATIA", "ubigeo": "210807", "nivel_territorial": "DISTRITO"},
        {"nombre": "PUCARA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "PUCARA", "ubigeo": "210808", "nivel_territorial": "DISTRITO"},
        {"nombre": "SANTA LUCIA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "SANTA LUCIA", "ubigeo": "210809", "nivel_territorial": "DISTRITO"},
        {"nombre": "VILAVILA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "LAMPA", "distrito": "VILAVILA", "ubigeo": "210810", "nivel_territorial": "DISTRITO"},
        
        # DISTRITOS PROVINCIA MELGAR
        {"nombre": "AYAVIRI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "AYAVIRI", "ubigeo": "210901", "nivel_territorial": "DISTRITO"},
        {"nombre": "ANTAUTA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "ANTAUTA", "ubigeo": "210902", "nivel_territorial": "DISTRITO"},
        {"nombre": "CUPI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "CUPI", "ubigeo": "210903", "nivel_territorial": "DISTRITO"},
        {"nombre": "LLALLI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "LLALLI", "ubigeo": "210904", "nivel_territorial": "DISTRITO"},
        {"nombre": "MACARI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "MACARI", "ubigeo": "210905", "nivel_territorial": "DISTRITO"},
        {"nombre": "NUÑOA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "NUÑOA", "ubigeo": "210906", "nivel_territorial": "DISTRITO"},
        {"nombre": "ORURILLO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "ORURILLO", "ubigeo": "210907", "nivel_territorial": "DISTRITO"},
        {"nombre": "SANTA ROSA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "SANTA ROSA", "ubigeo": "210908", "nivel_territorial": "DISTRITO"},
        {"nombre": "UMACHIRI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "MELGAR", "distrito": "UMACHIRI", "ubigeo": "210909", "nivel_territorial": "DISTRITO"},
        
        # DISTRITOS PROVINCIA MOHO
        {"nombre": "MOHO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "MOHO", "distrito": "MOHO", "ubigeo": "211001", "nivel_territorial": "DISTRITO"},
        {"nombre": "CONIMA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "MOHO", "distrito": "CONIMA", "ubigeo": "211002", "nivel_territorial": "DISTRITO"},
        {"nombre": "HUAYRAPATA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "MOHO", "distrito": "HUAYRAPATA", "ubigeo": "211003", "nivel_territorial": "DISTRITO"},
        {"nombre": "TILALI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "MOHO", "distrito": "TILALI", "ubigeo": "211004", "nivel_territorial": "DISTRITO"},
        
        # DISTRITOS PROVINCIA SAN ANTONIO DE PUTINA
        {"nombre": "PUTINA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SAN ANTONIO DE PUTINA", "distrito": "PUTINA", "ubigeo": "211201", "nivel_territorial": "DISTRITO"},
        {"nombre": "ANANEA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SAN ANTONIO DE PUTINA", "distrito": "ANANEA", "ubigeo": "211202", "nivel_territorial": "DISTRITO"},
        {"nombre": "PEDRO VILCA APAZA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SAN ANTONIO DE PUTINA", "distrito": "PEDRO VILCA APAZA", "ubigeo": "211203", "nivel_territorial": "DISTRITO"},
        {"nombre": "QUILCAPUNCU", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SAN ANTONIO DE PUTINA", "distrito": "QUILCAPUNCU", "ubigeo": "211204", "nivel_territorial": "DISTRITO"},
        {"nombre": "SINA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SAN ANTONIO DE PUTINA", "distrito": "SINA", "ubigeo": "211205", "nivel_territorial": "DISTRITO"},
        
        # DISTRITOS PROVINCIA SAN ROMAN
        {"nombre": "JULIACA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SAN ROMAN", "distrito": "JULIACA", "ubigeo": "211301", "nivel_territorial": "DISTRITO"},
        {"nombre": "CABANA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SAN ROMAN", "distrito": "CABANA", "ubigeo": "211302", "nivel_territorial": "DISTRITO"},
        {"nombre": "CABANILLAS", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SAN ROMAN", "distrito": "CABANILLAS", "ubigeo": "211303", "nivel_territorial": "DISTRITO"},
        {"nombre": "CARACOTO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SAN ROMAN", "distrito": "CARACOTO", "ubigeo": "211304", "nivel_territorial": "DISTRITO"},
        
        # DISTRITOS PROVINCIA SANDIA
        {"nombre": "SANDIA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "SANDIA", "ubigeo": "211401", "nivel_territorial": "DISTRITO"},
        {"nombre": "CUYOCUYO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "CUYOCUYO", "ubigeo": "211402", "nivel_territorial": "DISTRITO"},
        {"nombre": "LIMBANI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "LIMBANI", "ubigeo": "211403", "nivel_territorial": "DISTRITO"},
        {"nombre": "PATAMBUCO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "PATAMBUCO", "ubigeo": "211404", "nivel_territorial": "DISTRITO"},
        {"nombre": "PHARA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "PHARA", "ubigeo": "211405", "nivel_territorial": "DISTRITO"},
        {"nombre": "QUIACA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "QUIACA", "ubigeo": "211406", "nivel_territorial": "DISTRITO"},
        {"nombre": "SAN JUAN DEL ORO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "SAN JUAN DEL ORO", "ubigeo": "211407", "nivel_territorial": "DISTRITO"},
        {"nombre": "YANAHUAYA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "YANAHUAYA", "ubigeo": "211408", "nivel_territorial": "DISTRITO"},
        {"nombre": "ALTO INAMBARI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "ALTO INAMBARI", "ubigeo": "211409", "nivel_territorial": "DISTRITO"},
        {"nombre": "SAN PEDRO DE PUTINA PUNCO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "SANDIA", "distrito": "SAN PEDRO DE PUTINA PUNCO", "ubigeo": "211410", "nivel_territorial": "DISTRITO"},
        
        # DISTRITOS PROVINCIA YUNGUYO
        {"nombre": "YUNGUYO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "YUNGUYO", "distrito": "YUNGUYO", "ubigeo": "211501", "nivel_territorial": "DISTRITO"},
        {"nombre": "ANAPIA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "YUNGUYO", "distrito": "ANAPIA", "ubigeo": "211502", "nivel_territorial": "DISTRITO"},
        {"nombre": "COPANI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "YUNGUYO", "distrito": "COPANI", "ubigeo": "211503", "nivel_territorial": "DISTRITO"},
        {"nombre": "CUTURAPI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "YUNGUYO", "distrito": "CUTURAPI", "ubigeo": "211504", "nivel_territorial": "DISTRITO"},
        {"nombre": "OLLARAYA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "YUNGUYO", "distrito": "OLLARAYA", "ubigeo": "211505", "nivel_territorial": "DISTRITO"},
        {"nombre": "TINICACHI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "YUNGUYO", "distrito": "TINICACHI", "ubigeo": "211506", "nivel_territorial": "DISTRITO"},
        {"nombre": "UNICACHI", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "YUNGUYO", "distrito": "UNICACHI", "ubigeo": "211507", "nivel_territorial": "DISTRITO"}
    ]
    
    print(f"📋 Datos preparados: {len(localidades_puno)} localidades oficiales")
    
    # Estadísticas
    provincias = len([l for l in localidades_puno if l['tipo'] == 'PROVINCIA'])
    distritos = len([l for l in localidades_puno if l['tipo'] == 'DISTRITO'])
    
    print(f"   • {provincias} provincias")
    print(f"   • {distritos} distritos")
    
    # Importar al backend
    print(f"\n📤 Importando al backend...")
    
    base_url = "http://localhost:8000/api/v1"
    importadas = 0
    errores = 0
    
    for localidad in localidades_puno:
        try:
            response = requests.post(f"{base_url}/localidades", json=localidad, timeout=10)
            if response.status_code == 201:
                importadas += 1
                if importadas % 20 == 0:
                    print(f"   ✅ Importadas: {importadas}")
            else:
                errores += 1
                if errores <= 5:  # Mostrar solo los primeros 5 errores
                    print(f"   ❌ Error en {localidad['nombre']}: {response.status_code}")
        except Exception as e:
            errores += 1
            if errores <= 5:
                print(f"   ❌ Error en {localidad['nombre']}: {e}")
    
    print(f"\n📊 RESULTADO:")
    print(f"   ✅ Importadas: {importadas}")
    print(f"   ❌ Errores: {errores}")
    print(f"   📋 Total procesadas: {len(localidades_puno)}")
    
    if importadas > 0:
        print(f"\n🎉 IMPORTACIÓN EXITOSA")
        print(f"   • Datos oficiales del INEI")
        print(f"   • 13 provincias de Puno")
        print(f"   • {distritos} distritos oficiales")
        print(f"   • Códigos UBIGEO oficiales")
    
    return importadas > 0

if __name__ == "__main__":
    importar_localidades_inei()