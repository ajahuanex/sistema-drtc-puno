#!/usr/bin/env python3
"""
Script para importar localidades oficiales de Puno desde datos del INEI
"""

import requests
import json
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Datos oficiales de Puno según INEI
LOCALIDADES_PUNO_INEI = [
    # PROVINCIA PUNO
    {"nombre": "PUNO", "tipo": "PROVINCIA", "departamento": "PUNO", "provincia": "PUNO", "distrito": "PUNO", "ubigeo": "210100", "nivel_territorial": "PROVINCIA"},
    {"nombre": "PUNO", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "PUNO", "distrito": "PUNO", "ubigeo": "210101", "nivel_territorial": "DISTRITO"},
    {"nombre": "ACORA", "tipo": "DISTRITO", "departamento": "PUNO", "provincia": "PUNO", "distrito": "ACORA", "ubigeo": "210102", "nivel_territorial": "DISTRITO"},
    {"nombre": "AMANTANI",