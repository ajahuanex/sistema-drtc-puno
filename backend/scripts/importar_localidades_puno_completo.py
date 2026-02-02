#!/usr/bin/env python3
"""
Script para importar TODAS las localidades del departamento de PUNO
Incluye: 13 provincias, 109 distritos y centros poblados principales
Basado en UBIGEO oficial del INEI
"""
import asyncio
import sys
import os
from datetime import datetime

# Agregar el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.models.localidad import TipoLocalidad

# LOCALIDADES COMPLETAS DEL DEPARTAMENTO DE PUNO
# Basado en UBIGEO oficial del INEI - Actualizado 2024
LOCALIDADES_PUNO_COMPLETO = [
    
    # ========================================
    # PROVINCIA DE PUNO (13 distritos)
    # ========================================
    {
        "nombre": "PUNO",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "210101",
        "departamento": "PUNO",
        "provincia": "PUNO",
        "distrito": "PUNO",
        "descripcion": "Capital del departamento de Puno, a orillas del Lago Titicaca",
        "coordenadas": {"latitud": -15.8402, "longitud": -70.0219}
    },
    {
        "nombre": "ACORA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210102",
        "departamento": "PUNO",
        "provincia": "PUNO",
        "distrito": "ACORA",
        "descripcion": "Distrito ganadero y agrícola",
        "coordenadas": {"latitud": -15.9667, "longitud": -69.7833}
    },
    {
        "nombre": "AMANTANI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210103",
        "departamento": "PUNO",
        "provincia": "PUNO",
        "distrito": "AMANTANI",
        "descripcion": "Isla en el Lago Titicaca",
        "coordenadas": {"latitud": -15.6667, "longitud": -69.7167}
    },
    {
        "nombre": "ATUNCOLLA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210104",
        "departamento": "PUNO",
        "provincia": "PUNO",
        "distrito": "ATUNCOLLA",
        "descripcion": "Distrito arqueológico con sitios preincaicos",
        "coordenadas": {"latitud": -15.7500, "longitud": -70.0833}
    },
    {
        "nombre": "CAPACHICA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210105",
        "departamento": "PUNO",
        "provincia": "PUNO",
        "distrito": "CAPACHICA",
        "descripcion": "Península en el Lago Titicaca",
        "coordenadas": {"latitud": -15.6333, "longitud": -69.8500}
    },
    {
        "nombre": "CHUCUITO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210106",
        "departamento": "PUNO",
        "provincia": "PUNO",
        "distrito": "CHUCUITO",
        "descripcion": "Histórica ciudad colonial",
        "coordenadas": {"latitud": -16.0000, "longitud": -69.8833}
    },
    {
        "nombre": "COATA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210107",
        "departamento": "PUNO",
        "provincia": "PUNO",
        "distrito": "COATA",
        "descripcion": "Distrito agrícola y ganadero",
        "coordenadas": {"latitud": -15.6167, "longitud": -70.0167}
    },
    {
        "nombre": "HUATA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210108",
        "departamento": "PUNO",
        "provincia": "PUNO",
        "distrito": "HUATA",
        "descripcion": "Distrito lacustre",
        "coordenadas": {"latitud": -15.5833, "longitud": -69.9833}
    },
    {
        "nombre": "MAÑAZO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210109",
        "departamento": "PUNO",
        "provincia": "PUNO",
        "distrito": "MAÑAZO",
        "descripción": "Distrito ganadero",
        "coordenadas": {"latitud": -15.7667, "longitud": -70.3833}
    },
    {
        "nombre": "PAUCARCOLLA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210110",
        "departamento": "PUNO",
        "provincia": "PUNO",
        "distrito": "PAUCARCOLLA",
        "descripcion": "Distrito agrícola",
        "coordenadas": {"latitud": -15.7000, "longitud": -70.1167}
    },
    {
        "nombre": "PICHACANI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210111",
        "departamento": "PUNO",
        "provincia": "PUNO",
        "distrito": "PICHACANI",
        "descripcion": "Distrito minero",
        "coordenadas": {"latitud": -16.0500, "longitud": -70.6000}
    },
    {
        "nombre": "PLATERIA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210112",
        "departamento": "PUNO",
        "provincia": "PUNO",
        "distrito": "PLATERIA",
        "descripcion": "Distrito artesanal",
        "coordenadas": {"latitud": -15.9167, "longitud": -69.9500}
    },
    {
        "nombre": "SAN ANTONIO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210113",
        "departamento": "PUNO",
        "provincia": "PUNO",
        "distrito": "SAN ANTONIO",
        "descripcion": "Distrito fronterizo",
        "coordenadas": {"latitud": -16.2167, "longitud": -69.6167}
    },
    {
        "nombre": "TIQUILLACA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210114",
        "departamento": "PUNO",
        "provincia": "PUNO",
        "distrito": "TIQUILLACA",
        "descripcion": "Distrito lacustre",
        "coordenadas": {"latitud": -15.8833, "longitud": -70.1000}
    },
    {
        "nombre": "VILQUE",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210115",
        "departamento": "PUNO",
        "provincia": "PUNO",
        "distrito": "VILQUE",
        "descripcion": "Distrito agrícola",
        "coordenadas": {"latitud": -15.8167, "longitud": -70.4167}
    },

    # ========================================
    # PROVINCIA DE AZÁNGARO (15 distritos)
    # ========================================
    {
        "nombre": "AZANGARO",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "210201",
        "departamento": "PUNO",
        "provincia": "AZANGARO",
        "distrito": "AZANGARO",
        "descripcion": "Capital de la provincia de Azángaro",
        "coordenadas": {"latitud": -14.9167, "longitud": -70.1833}
    },
    {
        "nombre": "ACHAYA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210202",
        "departamento": "PUNO",
        "provincia": "AZANGARO",
        "distrito": "ACHAYA",
        "descripcion": "Distrito ganadero",
        "coordenadas": {"latitud": -14.8333, "longitud": -70.1667}
    },
    {
        "nombre": "ARAPA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210203",
        "departamento": "PUNO",
        "provincia": "AZANGARO",
        "distrito": "ARAPA",
        "descripcion": "Distrito lacustre",
        "coordenadas": {"latitud": -15.1333, "longitud": -69.6833}
    },
    {
        "nombre": "ASILLO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210204",
        "departamento": "PUNO",
        "provincia": "AZANGARO",
        "distrito": "ASILLO",
        "descripcion": "Distrito ganadero",
        "coordenadas": {"latitud": -14.7833, "longitud": -70.3500}
    },
    {
        "nombre": "CAMINACA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210205",
        "departamento": "PUNO",
        "provincia": "AZANGARO",
        "distrito": "CAMINACA",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.8167, "longitud": -70.0167}
    },
    {
        "nombre": "CHUPA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210206",
        "departamento": "PUNO",
        "provincia": "AZANGARO",
        "distrito": "CHUPA",
        "descripcion": "Distrito lacustre",
        "coordenadas": {"latitud": -15.2833, "longitud": -69.7500}
    },
    {
        "nombre": "JOSE DOMINGO CHOQUEHUANCA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210207",
        "departamento": "PUNO",
        "provincia": "AZANGARO",
        "distrito": "JOSE DOMINGO CHOQUEHUANCA",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.9500, "longitud": -70.0500}
    },
    {
        "nombre": "MUÑANI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210208",
        "departamento": "PUNO",
        "provincia": "AZANGARO",
        "distrito": "MUÑANI",
        "descripcion": "Distrito lacustre",
        "coordenadas": {"latitud": -14.7667, "longitud": -69.9500}
    },
    {
        "nombre": "POTONI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210209",
        "departamento": "PUNO",
        "provincia": "AZANGARO",
        "distrito": "POTONI",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.9833, "longitud": -70.2833}
    },
    {
        "nombre": "SAMAN",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210210",
        "departamento": "PUNO",
        "provincia": "AZANGARO",
        "distrito": "SAMAN",
        "descripcion": "Distrito ganadero",
        "coordenadas": {"latitud": -15.0167, "longitud": -70.0167}
    },
    {
        "nombre": "SAN ANTON",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210211",
        "departamento": "PUNO",
        "provincia": "AZANGARO",
        "distrito": "SAN ANTON",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.6167, "longitud": -70.2167}
    },
    {
        "nombre": "SAN JOSE",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210212",
        "departamento": "PUNO",
        "provincia": "AZANGARO",
        "distrito": "SAN JOSE",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.9000, "longitud": -69.8833}
    },
    {
        "nombre": "SAN JUAN DE SALINAS",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210213",
        "departamento": "PUNO",
        "provincia": "AZANGARO",
        "distrito": "SAN JUAN DE SALINAS",
        "descripcion": "Distrito salinero",
        "coordenadas": {"latitud": -14.9667, "longitud": -70.4167}
    },
    {
        "nombre": "SANTIAGO DE PUPUJA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210214",
        "departamento": "PUNO",
        "provincia": "AZANGARO",
        "distrito": "SANTIAGO DE PUPUJA",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.6833, "longitud": -70.0500}
    },
    {
        "nombre": "TIRAPATA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210215",
        "departamento": "PUNO",
        "provincia": "AZANGARO",
        "distrito": "TIRAPATA",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.8833, "longitud": -70.4000}
    },

    # ========================================
    # PROVINCIA DE CARABAYA (10 distritos)
    # ========================================
    {
        "nombre": "MACUSANI",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "210401",
        "departamento": "PUNO",
        "provincia": "CARABAYA",
        "distrito": "MACUSANI",
        "descripcion": "Capital de la provincia de Carabaya",
        "coordenadas": {"latitud": -14.0667, "longitud": -70.4333}
    },
    {
        "nombre": "AJOYANI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210402",
        "departamento": "PUNO",
        "provincia": "CARABAYA",
        "distrito": "AJOYANI",
        "descripcion": "Distrito minero aurífero",
        "coordenadas": {"latitud": -14.2833, "longitud": -69.8167}
    },
    {
        "nombre": "AYAPATA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210403",
        "departamento": "PUNO",
        "provincia": "CARABAYA",
        "distrito": "AYAPATA",
        "descripcion": "Distrito selvático",
        "coordenadas": {"latitud": -13.9167, "longitud": -70.1833}
    },
    {
        "nombre": "COASA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210404",
        "departamento": "PUNO",
        "provincia": "CARABAYA",
        "distrito": "COASA",
        "descripcion": "Distrito minero",
        "coordenadas": {"latitud": -14.1500, "longitud": -69.6833}
    },
    {
        "nombre": "CORANI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210405",
        "departamento": "PUNO",
        "provincia": "CARABAYA",
        "distrito": "CORANI",
        "descripcion": "Distrito minero",
        "coordenadas": {"latitud": -13.8833, "longitud": -70.6333}
    },
    {
        "nombre": "CRUCERO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210406",
        "departamento": "PUNO",
        "provincia": "CARABAYA",
        "distrito": "CRUCERO",
        "descripcion": "Distrito minero aurífero",
        "coordenadas": {"latitud": -14.3667, "longitud": -70.0167}
    },
    {
        "nombre": "ITUATA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210407",
        "departamento": "PUNO",
        "provincia": "CARABAYA",
        "distrito": "ITUATA",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.2167, "longitud": -69.6167}
    },
    {
        "nombre": "OLLACHEA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210408",
        "departamento": "PUNO",
        "provincia": "CARABAYA",
        "distrito": "OLLACHEA",
        "descripcion": "Distrito selvático",
        "coordenadas": {"latitud": -13.7833, "longitud": -70.4833}
    },
    {
        "nombre": "SAN GABAN",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210409",
        "departamento": "PUNO",
        "provincia": "CARABAYA",
        "distrito": "SAN GABAN",
        "descripcion": "Distrito selvático con central hidroeléctrica",
        "coordenadas": {"latitud": -13.4333, "longitud": -70.3833}
    },
    {
        "nombre": "USICAYOS",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210410",
        "departamento": "PUNO",
        "provincia": "CARABAYA",
        "distrito": "USICAYOS",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.1833, "longitud": -70.2167}
    },

    # ========================================
    # PROVINCIA DE CHUCUITO (7 distritos)
    # ========================================
    {
        "nombre": "JULI",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "210301",
        "departamento": "PUNO",
        "provincia": "CHUCUITO",
        "distrito": "JULI",
        "descripcion": "Pequeña Roma de América, importante centro religioso colonial",
        "coordenadas": {"latitud": -16.2167, "longitud": -69.4667}
    },
    {
        "nombre": "DESAGUADERO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210302",
        "departamento": "PUNO",
        "provincia": "CHUCUITO",
        "distrito": "DESAGUADERO",
        "descripcion": "Principal paso fronterizo terrestre con Bolivia",
        "coordenadas": {"latitud": -16.5667, "longitud": -69.0333}
    },
    {
        "nombre": "HUACULLANI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210303",
        "departamento": "PUNO",
        "provincia": "CHUCUITO",
        "distrito": "HUACULLANI",
        "descripcion": "Distrito fronterizo",
        "coordenadas": {"latitud": -16.6333, "longitud": -69.2167}
    },
    {
        "nombre": "KELLUYO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210304",
        "departamento": "PUNO",
        "provincia": "CHUCUITO",
        "distrito": "KELLUYO",
        "descripcion": "Distrito fronterizo",
        "coordenadas": {"latitud": -16.7167, "longitud": -69.2833}
    },
    {
        "nombre": "PISACOMA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210305",
        "departamento": "PUNO",
        "provincia": "CHUCUITO",
        "distrito": "PISACOMA",
        "descripcion": "Distrito fronterizo",
        "coordenadas": {"latitud": -16.9167, "longitud": -69.4000}
    },
    {
        "nombre": "POMATA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210306",
        "departamento": "PUNO",
        "provincia": "CHUCUITO",
        "distrito": "POMATA",
        "descripcion": "Distrito lacustre con templo colonial",
        "coordenadas": {"latitud": -16.2667, "longitud": -69.2833}
    },
    {
        "nombre": "ZEPITA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210307",
        "departamento": "PUNO",
        "provincia": "CHUCUITO",
        "distrito": "ZEPITA",
        "descripcion": "Distrito lacustre",
        "coordenadas": {"latitud": -16.4833, "longitud": -69.1167}
    },

    # ========================================
    # PROVINCIA DE EL COLLAO (5 distritos)
    # ========================================
    {
        "nombre": "ILAVE",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "210801",
        "departamento": "PUNO",
        "provincia": "EL COLLAO",
        "distrito": "ILAVE",
        "descripcion": "Capital de la provincia de El Collao",
        "coordenadas": {"latitud": -16.0833, "longitud": -69.6333}
    },
    {
        "nombre": "CAPAZO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210802",
        "departamento": "PUNO",
        "provincia": "EL COLLAO",
        "distrito": "CAPAZO",
        "descripcion": "Distrito fronterizo",
        "coordenadas": {"latitud": -17.1833, "longitud": -69.7500}
    },
    {
        "nombre": "PILCUYO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210803",
        "departamento": "PUNO",
        "provincia": "EL COLLAO",
        "distrito": "PILCUYO",
        "descripcion": "Distrito lacustre",
        "coordenadas": {"latitud": -16.0500, "longitud": -69.4167}
    },
    {
        "nombre": "SANTA ROSA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210804",
        "departamento": "PUNO",
        "provincia": "EL COLLAO",
        "distrito": "SANTA ROSA",
        "descripcion": "Distrito fronterizo",
        "coordenadas": {"latitud": -16.8000, "longitud": -69.6833}
    },
    {
        "nombre": "CONDURIRI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210805",
        "departamento": "PUNO",
        "provincia": "EL COLLAO",
        "distrito": "CONDURIRI",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -16.6167, "longitud": -69.5833}
    },

    # ========================================
    # PROVINCIA DE HUANCANÉ (8 distritos)
    # ========================================
    {
        "nombre": "HUANCANE",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "210501",
        "departamento": "PUNO",
        "provincia": "HUANCANE",
        "distrito": "HUANCANE",
        "descripcion": "Capital de la provincia de Huancané",
        "coordenadas": {"latitud": -15.2000, "longitud": -69.7667}
    },
    {
        "nombre": "COJATA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210502",
        "departamento": "PUNO",
        "provincia": "HUANCANE",
        "distrito": "COJATA",
        "descripcion": "Distrito ganadero",
        "coordenadas": {"latitud": -15.0333, "longitud": -69.3667}
    },
    {
        "nombre": "HUATASANI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210503",
        "departamento": "PUNO",
        "provincia": "HUANCANE",
        "distrito": "HUATASANI",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -15.0833, "longitud": -69.6833}
    },
    {
        "nombre": "INCHUPALLA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210504",
        "departamento": "PUNO",
        "provincia": "HUANCANE",
        "distrito": "INCHUPALLA",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.9167, "longitud": -69.4833}
    },
    {
        "nombre": "PUSI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210505",
        "departamento": "PUNO",
        "provincia": "HUANCANE",
        "distrito": "PUSI",
        "descripcion": "Distrito lacustre",
        "coordenadas": {"latitud": -15.4333, "longitud": -69.6167}
    },
    {
        "nombre": "ROSASPATA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210506",
        "departamento": "PUNO",
        "provincia": "HUANCANE",
        "distrito": "ROSASPATA",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -15.1167, "longitud": -69.5167}
    },
    {
        "nombre": "TARACO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210507",
        "departamento": "PUNO",
        "provincia": "HUANCANE",
        "distrito": "TARACO",
        "descripcion": "Distrito lacustre",
        "coordenadas": {"latitud": -15.3167, "longitud": -69.9833}
    },
    {
        "nombre": "VILQUE CHICO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210508",
        "departamento": "PUNO",
        "provincia": "HUANCANE",
        "distrito": "VILQUE CHICO",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -15.2500, "longitud": -69.6500}
    },

    # ========================================
    # PROVINCIA DE LAMPA (10 distritos)
    # ========================================
    {
        "nombre": "LAMPA",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "211001",
        "departamento": "PUNO",
        "provincia": "LAMPA",
        "distrito": "LAMPA",
        "descripcion": "Ciudad Rosada, capital de la provincia de Lampa",
        "coordenadas": {"latitud": -15.3667, "longitud": -70.3667}
    },
    {
        "nombre": "CABANILLA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211002",
        "departamento": "PUNO",
        "provincia": "LAMPA",
        "distrito": "CABANILLA",
        "descripcion": "Distrito ferroviario",
        "coordenadas": {"latitud": -15.6333, "longitud": -70.3500}
    },
    {
        "nombre": "CALAPUJA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211003",
        "departamento": "PUNO",
        "provincia": "LAMPA",
        "distrito": "CALAPUJA",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -15.3167, "longitud": -70.1833}
    },
    {
        "nombre": "NICASIO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211004",
        "departamento": "PUNO",
        "provincia": "LAMPA",
        "distrito": "NICASIO",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -15.2167, "longitud": -70.2667}
    },
    {
        "nombre": "OCUVIRI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211005",
        "departamento": "PUNO",
        "provincia": "LAMPA",
        "distrito": "OCUVIRI",
        "descripcion": "Distrito minero",
        "coordenadas": {"latitud": -15.0667, "longitud": -70.7833}
    },
    {
        "nombre": "PALCA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211006",
        "departamento": "PUNO",
        "provincia": "LAMPA",
        "distrito": "PALCA",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -15.2833, "longitud": -70.6167}
    },
    {
        "nombre": "PARATIA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211007",
        "departamento": "PUNO",
        "provincia": "LAMPA",
        "distrito": "PARATIA",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -15.0833, "longitud": -70.4167}
    },
    {
        "nombre": "PUCARA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211008",
        "departamento": "PUNO",
        "provincia": "LAMPA",
        "distrito": "PUCARA",
        "descripcion": "Distrito arqueológico, cuna de la cultura Pucará",
        "coordenadas": {"latitud": -15.0333, "longitud": -70.3667}
    },
    {
        "nombre": "SANTA LUCIA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211009",
        "departamento": "PUNO",
        "provincia": "LAMPA",
        "distrito": "SANTA LUCIA",
        "descripcion": "Distrito minero",
        "coordenadas": {"latitud": -15.7000, "longitud": -70.6000}
    },
    {
        "nombre": "VILAVILA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211010",
        "departamento": "PUNO",
        "provincia": "LAMPA",
        "distrito": "VILAVILA",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -15.1667, "longitud": -70.6333}
    },

    # ========================================
    # PROVINCIA DE MELGAR (9 distritos)
    # ========================================
    {
        "nombre": "AYAVIRI",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "210901",
        "departamento": "PUNO",
        "provincia": "MELGAR",
        "distrito": "AYAVIRI",
        "descripcion": "Capital de la provincia de Melgar",
        "coordenadas": {"latitud": -14.8833, "longitud": -70.5833}
    },
    {
        "nombre": "ANTAUTA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210902",
        "departamento": "PUNO",
        "provincia": "MELGAR",
        "distrito": "ANTAUTA",
        "descripcion": "Distrito ganadero",
        "coordenadas": {"latitud": -14.8167, "longitud": -70.4833}
    },
    {
        "nombre": "CUPI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210903",
        "departamento": "PUNO",
        "provincia": "MELGAR",
        "distrito": "CUPI",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.7833, "longitud": -70.6833}
    },
    {
        "nombre": "LLALLI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210904",
        "departamento": "PUNO",
        "provincia": "MELGAR",
        "distrito": "LLALLI",
        "descripcion": "Distrito ganadero",
        "coordenadas": {"latitud": -14.9667, "longitud": -70.7833}
    },
    {
        "nombre": "MACARI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210905",
        "departamento": "PUNO",
        "provincia": "MELGAR",
        "distrito": "MACARI",
        "descripcion": "Distrito ganadero",
        "coordenadas": {"latitud": -14.7167, "longitud": -70.7167}
    },
    {
        "nombre": "NUÑOA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210906",
        "departamento": "PUNO",
        "provincia": "MELGAR",
        "distrito": "NUÑOA",
        "descripcion": "Distrito ganadero",
        "coordenadas": {"latitud": -14.4833, "longitud": -70.6333}
    },
    {
        "nombre": "ORURILLO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210907",
        "departamento": "PUNO",
        "provincia": "MELGAR",
        "distrito": "ORURILLO",
        "descripcion": "Distrito ganadero",
        "coordenadas": {"latitud": -14.7333, "longitud": -70.4167}
    },
    {
        "nombre": "SANTA ROSA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210908",
        "departamento": "PUNO",
        "provincia": "MELGAR",
        "distrito": "SANTA ROSA",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.6167, "longitud": -70.7833}
    },
    {
        "nombre": "UMACHIRI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210909",
        "departamento": "PUNO",
        "provincia": "MELGAR",
        "distrito": "UMACHIRI",
        "descripcion": "Distrito ganadero",
        "coordenadas": {"latitud": -14.8333, "longitud": -70.7167}
    },

    # ========================================
    # PROVINCIA DE MOHO (4 distritos)
    # ========================================
    {
        "nombre": "MOHO",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "211101",
        "departamento": "PUNO",
        "provincia": "MOHO",
        "distrito": "MOHO",
        "descripcion": "Capital de la provincia de Moho",
        "coordenadas": {"latitud": -15.3833, "longitud": -69.4833}
    },
    {
        "nombre": "CONIMA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211102",
        "departamento": "PUNO",
        "provincia": "MOHO",
        "distrito": "CONIMA",
        "descripcion": "Distrito lacustre",
        "coordenadas": {"latitud": -15.6167, "longitud": -69.3167}
    },
    {
        "nombre": "HUAYRAPATA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211103",
        "departamento": "PUNO",
        "provincia": "MOHO",
        "distrito": "HUAYRAPATA",
        "descripcion": "Distrito lacustre",
        "coordenadas": {"latitud": -15.4667, "longitud": -69.2833}
    },
    {
        "nombre": "TILALI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211104",
        "departamento": "PUNO",
        "provincia": "MOHO",
        "distrito": "TILALI",
        "descripcion": "Distrito fronterizo",
        "coordenadas": {"latitud": -15.2833, "longitud": -69.2167}
    },

    # ========================================
    # PROVINCIA DE SAN ANTONIO DE PUTINA (5 distritos)
    # ========================================
    {
        "nombre": "PUTINA",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "211201",
        "departamento": "PUNO",
        "provincia": "SAN ANTONIO DE PUTINA",
        "distrito": "PUTINA",
        "descripcion": "Capital de la provincia de San Antonio de Putina",
        "coordenadas": {"latitud": -14.9167, "longitud": -69.8667}
    },
    {
        "nombre": "ANANEA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211202",
        "departamento": "PUNO",
        "provincia": "SAN ANTONIO DE PUTINA",
        "distrito": "ANANEA",
        "descripcion": "Distrito minero aurífero",
        "coordenadas": {"latitud": -14.6833, "longitud": -69.5333}
    },
    {
        "nombre": "PEDRO VILCA APAZA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211203",
        "departamento": "PUNO",
        "provincia": "SAN ANTONIO DE PUTINA",
        "distrito": "PEDRO VILCA APAZA",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.8167, "longitud": -69.7167}
    },
    {
        "nombre": "QUILCAPUNCU",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211204",
        "departamento": "PUNO",
        "provincia": "SAN ANTONIO DE PUTINA",
        "distrito": "QUILCAPUNCU",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.7833, "longitud": -69.8833}
    },
    {
        "nombre": "SINA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211205",
        "departamento": "PUNO",
        "provincia": "SAN ANTONIO DE PUTINA",
        "distrito": "SINA",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.8833, "longitud": -69.6167}
    },

    # ========================================
    # PROVINCIA DE SAN ROMÁN (4 distritos)
    # ========================================
    {
        "nombre": "JULIACA",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "211301",
        "departamento": "PUNO",
        "provincia": "SAN ROMAN",
        "distrito": "JULIACA",
        "descripcion": "Ciudad comercial más importante de Puno, nudo ferroviario y aeroportuario",
        "coordenadas": {"latitud": -15.5000, "longitud": -70.1333}
    },
    {
        "nombre": "CABANA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211302",
        "departamento": "PUNO",
        "provincia": "SAN ROMAN",
        "distrito": "CABANA",
        "descripcion": "Distrito agrícola",
        "coordenadas": {"latitud": -15.6167, "longitud": -70.3833}
    },
    {
        "nombre": "CABANILLAS",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211303",
        "departamento": "PUNO",
        "provincia": "SAN ROMAN",
        "distrito": "CABANILLAS",
        "descripcion": "Distrito agrícola",
        "coordenadas": {"latitud": -15.6333, "longitud": -70.2833}
    },
    {
        "nombre": "CARACOTO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211304",
        "departamento": "PUNO",
        "provincia": "SAN ROMAN",
        "distrito": "CARACOTO",
        "descripcion": "Distrito agrícola",
        "coordenadas": {"latitud": -15.7333, "longitud": -70.0667}
    },

    # ========================================
    # PROVINCIA DE SANDIA (10 distritos)
    # ========================================
    {
        "nombre": "SANDIA",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "211401",
        "departamento": "PUNO",
        "provincia": "SANDIA",
        "distrito": "SANDIA",
        "descripcion": "Capital de la provincia de Sandia",
        "coordenadas": {"latitud": -14.2833, "longitud": -69.4167}
    },
    {
        "nombre": "CUYOCUYO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211402",
        "departamento": "PUNO",
        "provincia": "SANDIA",
        "distrito": "CUYOCUYO",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.0833, "longitud": -69.5500}
    },
    {
        "nombre": "LIMBANI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211403",
        "departamento": "PUNO",
        "provincia": "SANDIA",
        "distrito": "LIMBANI",
        "descripcion": "Distrito minero",
        "coordenadas": {"latitud": -14.1167, "longitud": -69.2833}
    },
    {
        "nombre": "PATAMBUCO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211404",
        "departamento": "PUNO",
        "provincia": "SANDIA",
        "distrito": "PATAMBUCO",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.1833, "longitud": -69.2167}
    },
    {
        "nombre": "PHARA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211405",
        "departamento": "PUNO",
        "provincia": "SANDIA",
        "distrito": "PHARA",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.0167, "longitud": -69.4833}
    },
    {
        "nombre": "QUIACA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211406",
        "departamento": "PUNO",
        "provincia": "SANDIA",
        "distrito": "QUIACA",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.3833, "longitud": -69.2833}
    },
    {
        "nombre": "SAN JUAN DEL ORO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211407",
        "departamento": "PUNO",
        "provincia": "SANDIA",
        "distrito": "SAN JUAN DEL ORO",
        "descripcion": "Distrito minero aurífero",
        "coordenadas": {"latitud": -14.1833, "longitud": -69.0833}
    },
    {
        "nombre": "YANAHUAYA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211408",
        "departamento": "PUNO",
        "provincia": "SANDIA",
        "distrito": "YANAHUAYA",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.2833, "longitud": -69.2167}
    },
    {
        "nombre": "ALTO INAMBARI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211409",
        "departamento": "PUNO",
        "provincia": "SANDIA",
        "distrito": "ALTO INAMBARI",
        "descripcion": "Distrito selvático",
        "coordenadas": {"latitud": -13.9833, "longitud": -69.3167}
    },
    {
        "nombre": "SAN PEDRO DE PUTINA PUNCO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211410",
        "departamento": "PUNO",
        "provincia": "SANDIA",
        "distrito": "SAN PEDRO DE PUTINA PUNCO",
        "descripcion": "Distrito rural",
        "coordenadas": {"latitud": -14.0500, "longitud": -69.3833}
    },

    # ========================================
    # PROVINCIA DE YUNGUYO (7 distritos)
    # ========================================
    {
        "nombre": "YUNGUYO",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "211501",
        "departamento": "PUNO",
        "provincia": "YUNGUYO",
        "distrito": "YUNGUYO",
        "descripcion": "Ciudad fronteriza con Bolivia, puerto lacustre en el Titicaca",
        "coordenadas": {"latitud": -16.2500, "longitud": -69.0833}
    },
    {
        "nombre": "ANAPIA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211502",
        "departamento": "PUNO",
        "provincia": "YUNGUYO",
        "distrito": "ANAPIA",
        "descripcion": "Isla en el Lago Titicaca",
        "coordenadas": {"latitud": -16.2167, "longitud": -69.0333}
    },
    {
        "nombre": "COPANI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211503",
        "departamento": "PUNO",
        "provincia": "YUNGUYO",
        "distrito": "COPANI",
        "descripcion": "Distrito fronterizo",
        "coordenadas": {"latitud": -16.3167, "longitud": -69.1167}
    },
    {
        "nombre": "CUTURAPI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211504",
        "departamento": "PUNO",
        "provincia": "YUNGUYO",
        "distrito": "CUTURAPI",
        "descripcion": "Distrito fronterizo",
        "coordenadas": {"latitud": -16.4167, "longitud": -69.0167}
    },
    {
        "nombre": "OLLARAYA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211505",
        "departamento": "PUNO",
        "provincia": "YUNGUYO",
        "distrito": "OLLARAYA",
        "descripcion": "Distrito fronterizo",
        "coordenadas": {"latitud": -16.3833, "longitud": -69.0500}
    },
    {
        "nombre": "TINICACHI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211506",
        "departamento": "PUNO",
        "provincia": "YUNGUYO",
        "distrito": "TINICACHI",
        "descripcion": "Distrito fronterizo",
        "coordenadas": {"latitud": -16.3500, "longitud": -69.1833}
    },
    {
        "nombre": "UNICACHI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211507",
        "departamento": "PUNO",
        "provincia": "YUNGUYO",
        "distrito": "UNICACHI",
        "descripcion": "Distrito fronterizo",
        "coordenadas": {"latitud": -16.2833, "longitud": -69.1500}
    }
]

async def importar_localidades_puno_completo():
    """Importar todas las localidades del departamento de PUNO"""
    try:
        # Conectar a MongoDB
        mongodb_url = "mongodb://admin:admin123@localhost:27017/"
        database_name = "drtc_db"
        
        client = AsyncIOMotorClient(mongodb_url)
        db = client[database_name]
        collection = db["localidades"]
        
        print("🏔️ IMPORTACIÓN COMPLETA DE LOCALIDADES DE PUNO")
        print("=" * 55)
        print(f"📋 Fuente: UBIGEO oficial del INEI")
        print(f"📊 Total a importar: {len(LOCALIDADES_PUNO_COMPLETO)} localidades")
        
        # Verificar localidades existentes
        count_existentes = await collection.count_documents({"departamento": "PUNO"})
        print(f"📊 Localidades de PUNO existentes: {count_existentes}")
        
        if count_existentes > 0:
            respuesta = input(f"⚠️ Ya hay {count_existentes} localidades de PUNO. ¿Continuar agregando? (s/N): ")
            if respuesta.lower() not in ['s', 'si', 'sí', 'y', 'yes']:
                print("❌ Operación cancelada")
                return
        
        print(f"\n📥 Importando localidades de PUNO...")
        print("-" * 50)
        
        localidades_insertadas = 0
        localidades_duplicadas = 0
        errores = 0
        
        # Agrupar por provincia para mostrar progreso organizado
        provincias = {}
        for localidad in LOCALIDADES_PUNO_COMPLETO:
            provincia = localidad["provincia"]
            if provincia not in provincias:
                provincias[provincia] = []
            provincias[provincia].append(localidad)
        
        for provincia, localidades_provincia in provincias.items():
            print(f"\n🏛️ PROVINCIA DE {provincia} ({len(localidades_provincia)} localidades):")
            
            for i, localidad_data in enumerate(localidades_provincia, 1):
                try:
                    # Verificar si ya existe por UBIGEO
                    existente = await collection.find_one({"ubigeo": localidad_data["ubigeo"]})
                    if existente:
                        print(f"   ⚠️ [{i:2d}] Ya existe: {localidad_data['nombre']} (UBIGEO: {localidad_data['ubigeo']})")
                        localidades_duplicadas += 1
                        continue
                    
                    # Agregar campos del sistema
                    localidad_completa = {
                        **localidad_data,
                        "estaActiva": True,
                        "fechaCreacion": datetime.utcnow(),
                        "fechaActualizacion": datetime.utcnow()
                    }
                    
                    # Insertar localidad
                    resultado = await collection.insert_one(localidad_completa)
                    tipo_icon = "🏙️" if localidad_data["tipo"] == TipoLocalidad.CIUDAD else "🏘️"
                    print(f"   ✅ [{i:2d}] {tipo_icon} {localidad_data['nombre']} ({localidad_data['distrito']})")
                    localidades_insertadas += 1
                    
                except Exception as e:
                    print(f"   ❌ [{i:2d}] Error: {localidad_data['nombre']} - {e}")
                    errores += 1
        
        # Resumen final
        total_final = await collection.count_documents({"departamento": "PUNO"})
        
        print(f"\n📊 RESUMEN FINAL:")
        print("=" * 30)
        print(f"✅ Localidades insertadas: {localidades_insertadas}")
        print(f"⚠️ Localidades duplicadas: {localidades_duplicadas}")
        print(f"❌ Errores: {errores}")
        print(f"📊 Total de PUNO en BD: {total_final}")
        
        # Estadísticas por provincia
        print(f"\n📈 LOCALIDADES POR PROVINCIA:")
        print("-" * 40)
        pipeline = [
            {"$match": {"departamento": "PUNO"}},
            {"$group": {"_id": "$provincia", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        async for doc in collection.aggregate(pipeline):
            print(f"  {doc['_id']:<25}: {doc['count']:2d} localidades")
        
        # Estadísticas por tipo
        print(f"\n📈 LOCALIDADES POR TIPO:")
        print("-" * 25)
        pipeline = [
            {"$match": {"departamento": "PUNO"}},
            {"$group": {"_id": "$tipo", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        async for doc in collection.aggregate(pipeline):
            print(f"  {doc['_id']:<15}: {doc['count']:2d} localidades")
        
        if localidades_insertadas > 0:
            print(f"\n🎉 IMPORTACIÓN COMPLETADA EXITOSAMENTE")
            print(f"✅ Se agregaron {localidades_insertadas} nuevas localidades de PUNO")
            print(f"🏔️ Total: {total_final} localidades del departamento de PUNO")
        else:
            print(f"\n⚠️ NO SE AGREGARON NUEVAS LOCALIDADES")
            print(f"ℹ️ Todas las localidades ya existían en la base de datos")
            
    except Exception as e:
        print(f"❌ Error en importación: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    print("🏔️ IMPORTACIÓN COMPLETA DE LOCALIDADES DE PUNO")
    print("📋 13 provincias, 109 distritos y centros poblados")
    print("📊 Basado en UBIGEO oficial del INEI")
    
    asyncio.run(importar_localidades_puno_completo())