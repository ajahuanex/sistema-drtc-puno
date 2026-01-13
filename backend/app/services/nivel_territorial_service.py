#!/usr/bin/env python3
"""
Servicio para análisis de niveles territoriales en rutas
Identifica el nivel jerárquico de cada localidad en las rutas
"""

from typing import List, Dict, Optional, Tuple
from datetime import datetime
import asyncio

from ..dependencies.db import get_database
from ..models.localidad import (
    NivelTerritorial, 
    LocalidadEnRuta, 
    AnalisisNivelTerritorial,
    FiltroRutasPorNivel,
    EstadisticasNivelTerritorial,
    LocalidadConJerarquia
)

class NivelTerritorialService:
    """Servicio para análisis de niveles territoriales"""
    
    def __init__(self):
        self.db = None
    
    async def _get_db(self):
        """Obtener conexión a la base de datos"""
        if not self.db:
            self.db = await get_database()
        return self.db
    
    def determinar_nivel_territorial(self, localidad: dict) -> NivelTerritorial:
        """
        Determina el nivel territorial de una localidad basado en su UBIGEO y datos
        """
        ubigeo = localidad.get('ubigeo', '')
        
        if len(ubigeo) != 6:
            return NivelTerritorial.CENTRO_POBLADO  # Por defecto
        
        # Analizar UBIGEO: DDPPDD (Departamento-Provincia-Distrito)
        dept_code = ubigeo[:2]
        prov_code = ubigeo[2:4]
        dist_code = ubigeo[4:6]
        
        # Si el código de distrito es 00, es nivel provincial
        if dist_code == "00":
            # Si el código de provincia es 00, es nivel departamental
            if prov_code == "00":
                return NivelTerritorial.DEPARTAMENTO
            else:
                return NivelTerritorial.PROVINCIA
        else:
            # Verificar si es distrito o centro poblado
            # Si tiene municipalidad distrital, es distrito
            municipalidad = localidad.get('municipalidad_centro_poblado', '').lower()
            if 'distrital' in municipalidad:
                return NivelTerritorial.DISTRITO
            elif 'provincial' in municipalidad:
                return NivelTerritorial.PROVINCIA
            else:
                return NivelTerritorial.CENTRO_POBLADO
    
    async def obtener_localidad_con_nivel(self, localidad_id: str) -> Optional[LocalidadEnRuta]:
        """Obtiene una localidad con su nivel territorial determinado"""
        
        db = await self._get_db()
        localidades_collection = db.localidades
        
        # Buscar por ID o por UBIGEO si es un código
        if len(localidad_id) == 6 and localidad_id.isdigit():
            localidad = await localidades_collection.find_one({"ubigeo": localidad_id})
        else:
            from bson import ObjectId
            try:
                localidad = await localidades_collection.find_one({"_id": ObjectId(localidad_id)})
            except:
                localidad = await localidades_collection.find_one({"codigo": localidad_id})
        
        if not localidad:
            return None
        
        # Determinar nivel territorial
        nivel = self.determinar_nivel_territorial(localidad)
        
        return LocalidadEnRuta(
            localidad_id=str(localidad.get('_id')),
            ubigeo=localidad.get('ubigeo', ''),
            nombre=localidad.get('nombre', localidad.get('distrito', '')),
            nivel_territorial=nivel,
            departamento=localidad.get('departamento', ''),
            provincia=localidad.get('provincia', ''),
            distrito=localidad.get('distrito', ''),
            municipalidad_centro_poblado=localidad.get('municipalidad_centro_poblado', ''),
            coordenadas=localidad.get('coordenadas'),
            tipo_en_ruta="",  # Se asignará según el contexto
            orden=None,
            distancia_desde_origen=None,
            tiempo_estimado=None
        )
    
    async def analizar_ruta_completa(self, ruta_id: str) -> Optional[AnalisisNivelTerritorial]:
        """Analiza una ruta completa y determina los niveles territoriales involucrados"""
        
        db = await self._get_db()
        rutas_collection = db.rutas
        itinerarios_collection = db.itinerarios
        
        # Obtener la ruta
        from bson import ObjectId
        ruta = await rutas_collection.find_one({"_id": ObjectId(ruta_id)})
        if not ruta:
            return None
        
        # Obtener origen
        origen = await self.obtener_localidad_con_nivel(ruta.get('origenId'))
        if not origen:
            return None
        origen.tipo_en_ruta = "ORIGEN"
        origen.orden = 0
        origen.distancia_desde_origen = 0.0
        
        # Obtener destino
        destino = await self.obtener_localidad_con_nivel(ruta.get('destinoId'))
        if not destino:
            return None
        destino.tipo_en_ruta = "DESTINO"
        
        # Obtener itinerario
        itinerario_localidades = []
        itinerarios = await itinerarios_collection.find({
            "rutaId": ruta_id,
            "estaActivo": True
        }).sort("orden", 1).to_list(length=None)
        
        for i, itinerario in enumerate(itinerarios):
            localidad = await self.obtener_localidad_con_nivel(itinerario.get('localidadId'))
            if localidad:
                localidad.tipo_en_ruta = itinerario.get('tipo', 'ESCALA')
                localidad.orden = itinerario.get('orden', i + 1)
                localidad.distancia_desde_origen = itinerario.get('distanciaDesdeOrigen')
                localidad.tiempo_estimado = itinerario.get('tiempoEstimado')
                itinerario_localidades.append(localidad)
        
        # Analizar niveles involucrados
        todas_localidades = [origen] + itinerario_localidades + [destino]
        niveles_involucrados = list(set([loc.nivel_territorial for loc in todas_localidades]))
        
        # Determinar nivel máximo y mínimo
        jerarquia_niveles = [
            NivelTerritorial.DEPARTAMENTO,
            NivelTerritorial.PROVINCIA, 
            NivelTerritorial.DISTRITO,
            NivelTerritorial.CENTRO_POBLADO
        ]
        
        niveles_indices = [jerarquia_niveles.index(nivel) for nivel in niveles_involucrados]
        nivel_maximo = jerarquia_niveles[min(niveles_indices)]  # Menos específico
        nivel_minimo = jerarquia_niveles[max(niveles_indices)]  # Más específico
        
        # Contar por nivel
        por_nivel = {}
        for nivel in NivelTerritorial:
            por_nivel[nivel.value] = sum(1 for loc in todas_localidades if loc.nivel_territorial == nivel)
        
        # Clasificar la ruta
        clasificacion = self._clasificar_ruta_territorial(origen, destino, itinerario_localidades)
        
        return AnalisisNivelTerritorial(
            ruta_id=ruta_id,
            codigo_ruta=ruta.get('codigoRuta', ''),
            nombre_ruta=ruta.get('nombre', ''),
            origen=origen,
            destino=destino,
            itinerario=itinerario_localidades,
            niveles_involucrados=niveles_involucrados,
            nivel_maximo=nivel_maximo,
            nivel_minimo=nivel_minimo,
            total_localidades=len(todas_localidades),
            por_nivel=por_nivel,
            clasificacion_territorial=clasificacion
        )
    
    def _clasificar_ruta_territorial(self, origen: LocalidadEnRuta, destino: LocalidadEnRuta, 
                                   itinerario: List[LocalidadEnRuta]) -> str:
        """Clasifica una ruta según sus niveles territoriales"""
        
        # Verificar si cruza departamentos
        if origen.departamento != destino.departamento:
            return "INTERDEPARTAMENTAL"
        
        # Verificar si cruza provincias
        if origen.provincia != destino.provincia:
            return "INTERPROVINCIAL"
        
        # Verificar si cruza distritos
        if origen.distrito != destino.distrito:
            return "INTERDISTRITAL"
        
        # Si hay itinerario, verificar niveles
        if itinerario:
            departamentos = set([origen.departamento, destino.departamento] + 
                              [loc.departamento for loc in itinerario])
            provincias = set([origen.provincia, destino.provincia] + 
                           [loc.provincia for loc in itinerario])
            distritos = set([origen.distrito, destino.distrito] + 
                          [loc.distrito for loc in itinerario])
            
            if len(departamentos) > 1:
                return "INTERDEPARTAMENTAL"
            elif len(provincias) > 1:
                return "INTERPROVINCIAL"
            elif len(distritos) > 1:
                return "INTERDISTRITAL"
        
        return "LOCAL"
    
    async def buscar_rutas_por_nivel(self, filtros: FiltroRutasPorNivel) -> List[AnalisisNivelTerritorial]:
        """Busca rutas que cumplan con criterios de nivel territorial"""
        
        db = await self._get_db()
        rutas_collection = db.rutas
        
        # Construir filtro de MongoDB
        mongo_filter = {"estaActivo": True}
        
        # Obtener todas las rutas activas
        rutas = await rutas_collection.find(mongo_filter).to_list(length=None)
        
        # Analizar cada ruta y filtrar
        resultados = []
        for ruta in rutas:
            analisis = await self.analizar_ruta_completa(str(ruta['_id']))
            if analisis and self._cumple_filtros_nivel(analisis, filtros):
                resultados.append(analisis)
        
        return resultados
    
    def _cumple_filtros_nivel(self, analisis: AnalisisNivelTerritorial, 
                             filtros: FiltroRutasPorNivel) -> bool:
        """Verifica si un análisis cumple con los filtros de nivel"""
        
        if filtros.nivel_origen and analisis.origen.nivel_territorial != filtros.nivel_origen:
            return False
        
        if filtros.nivel_destino and analisis.destino.nivel_territorial != filtros.nivel_destino:
            return False
        
        if filtros.departamento_origen and analisis.origen.departamento != filtros.departamento_origen:
            return False
        
        if filtros.departamento_destino and analisis.destino.departamento != filtros.departamento_destino:
            return False
        
        if filtros.provincia_origen and analisis.origen.provincia != filtros.provincia_origen:
            return False
        
        if filtros.provincia_destino and analisis.destino.provincia != filtros.provincia_destino:
            return False
        
        if filtros.incluye_nivel and filtros.incluye_nivel not in analisis.niveles_involucrados:
            return False
        
        # Verificar nivel mínimo requerido
        if filtros.nivel_minimo_requerido:
            jerarquia = [NivelTerritorial.DEPARTAMENTO, NivelTerritorial.PROVINCIA, 
                        NivelTerritorial.DISTRITO, NivelTerritorial.CENTRO_POBLADO]
            indice_minimo = jerarquia.index(filtros.nivel_minimo_requerido)
            indice_actual = jerarquia.index(analisis.nivel_minimo)
            if indice_actual < indice_minimo:
                return False
        
        # Verificar nivel máximo permitido
        if filtros.nivel_maximo_permitido:
            jerarquia = [NivelTerritorial.DEPARTAMENTO, NivelTerritorial.PROVINCIA, 
                        NivelTerritorial.DISTRITO, NivelTerritorial.CENTRO_POBLADO]
            indice_maximo = jerarquia.index(filtros.nivel_maximo_permitido)
            indice_actual = jerarquia.index(analisis.nivel_maximo)
            if indice_actual > indice_maximo:
                return False
        
        return True
    
    async def generar_estadisticas_territoriales(self) -> EstadisticasNivelTerritorial:
        """Genera estadísticas completas de niveles territoriales"""
        
        db = await self._get_db()
        rutas_collection = db.rutas
        
        # Obtener todas las rutas activas
        rutas = await rutas_collection.find({"estaActivo": True}).to_list(length=None)
        
        # Contadores
        total_rutas = len(rutas)
        dist_origen = {}
        dist_destino = {}
        combinaciones = {}
        clasificaciones = {}
        departamentos_origen = {}
        departamentos_destino = {}
        provincias_origen = {}
        provincias_destino = {}
        
        # Analizar cada ruta
        for ruta in rutas:
            analisis = await self.analizar_ruta_completa(str(ruta['_id']))
            if not analisis:
                continue
            
            # Distribución por nivel de origen
            nivel_origen = analisis.origen.nivel_territorial.value
            dist_origen[nivel_origen] = dist_origen.get(nivel_origen, 0) + 1
            
            # Distribución por nivel de destino
            nivel_destino = analisis.destino.nivel_territorial.value
            dist_destino[nivel_destino] = dist_destino.get(nivel_destino, 0) + 1
            
            # Combinaciones más comunes
            combinacion = f"{nivel_origen} → {nivel_destino}"
            combinaciones[combinacion] = combinaciones.get(combinacion, 0) + 1
            
            # Clasificaciones territoriales
            clasificacion = analisis.clasificacion_territorial
            clasificaciones[clasificacion] = clasificaciones.get(clasificacion, 0) + 1
            
            # Departamentos más conectados
            dept_origen = analisis.origen.departamento
            dept_destino = analisis.destino.departamento
            departamentos_origen[dept_origen] = departamentos_origen.get(dept_origen, 0) + 1
            departamentos_destino[dept_destino] = departamentos_destino.get(dept_destino, 0) + 1
            
            # Provincias más conectadas
            prov_origen = f"{dept_origen} - {analisis.origen.provincia}"
            prov_destino = f"{dept_destino} - {analisis.destino.provincia}"
            provincias_origen[prov_origen] = provincias_origen.get(prov_origen, 0) + 1
            provincias_destino[prov_destino] = provincias_destino.get(prov_destino, 0) + 1
        
        # Preparar listas ordenadas
        combinaciones_ordenadas = [
            {"combinacion": k, "cantidad": v} 
            for k, v in sorted(combinaciones.items(), key=lambda x: x[1], reverse=True)
        ][:10]
        
        departamentos_ordenados = [
            {"departamento": k, "como_origen": departamentos_origen.get(k, 0), 
             "como_destino": departamentos_destino.get(k, 0)}
            for k in set(list(departamentos_origen.keys()) + list(departamentos_destino.keys()))
        ]
        departamentos_ordenados.sort(key=lambda x: x["como_origen"] + x["como_destino"], reverse=True)
        
        provincias_ordenadas = [
            {"provincia": k, "como_origen": provincias_origen.get(k, 0),
             "como_destino": provincias_destino.get(k, 0)}
            for k in set(list(provincias_origen.keys()) + list(provincias_destino.keys()))
        ]
        provincias_ordenadas.sort(key=lambda x: x["como_origen"] + x["como_destino"], reverse=True)
        
        return EstadisticasNivelTerritorial(
            total_rutas_analizadas=total_rutas,
            distribucion_por_nivel_origen=dist_origen,
            distribucion_por_nivel_destino=dist_destino,
            combinaciones_mas_comunes=combinaciones_ordenadas,
            rutas_por_clasificacion=clasificaciones,
            departamentos_mas_conectados=departamentos_ordenados[:15],
            provincias_mas_conectadas=provincias_ordenadas[:20]
        )
    
    async def obtener_jerarquia_localidad(self, localidad_id: str) -> Optional[LocalidadConJerarquia]:
        """Obtiene la jerarquía territorial completa de una localidad"""
        
        db = await self._get_db()
        localidades_collection = db.localidades
        rutas_collection = db.rutas
        itinerarios_collection = db.itinerarios
        
        # Obtener la localidad
        from bson import ObjectId
        localidad = await localidades_collection.find_one({"_id": ObjectId(localidad_id)})
        if not localidad:
            return None
        
        # Construir jerarquía territorial
        jerarquia = {
            "departamento": {
                "nombre": localidad.get('departamento'),
                "ubigeo": localidad.get('ubigeo')[:2] + "0000"
            },
            "provincia": {
                "nombre": localidad.get('provincia'),
                "ubigeo": localidad.get('ubigeo')[:4] + "00"
            },
            "distrito": {
                "nombre": localidad.get('distrito'),
                "ubigeo": localidad.get('ubigeo')
            }
        }
        
        # Buscar localidades padre e hijas
        ubigeo = localidad.get('ubigeo', '')
        localidades_padre = []
        localidades_hijas = []
        
        if len(ubigeo) == 6:
            # Buscar departamento padre
            dept_ubigeo = ubigeo[:2] + "0000"
            dept = await localidades_collection.find_one({"ubigeo": dept_ubigeo})
            if dept:
                localidades_padre.append(str(dept['_id']))
            
            # Buscar provincia padre
            prov_ubigeo = ubigeo[:4] + "00"
            prov = await localidades_collection.find_one({"ubigeo": prov_ubigeo})
            if prov:
                localidades_padre.append(str(prov['_id']))
            
            # Buscar localidades hijas (mismo departamento/provincia/distrito)
            hijas = await localidades_collection.find({
                "departamento": localidad.get('departamento'),
                "provincia": localidad.get('provincia'),
                "distrito": localidad.get('distrito'),
                "_id": {"$ne": localidad['_id']}
            }).to_list(length=None)
            
            localidades_hijas = [str(h['_id']) for h in hijas]
        
        # Contar rutas donde aparece
        rutas_origen = await rutas_collection.count_documents({"origenId": localidad_id})
        rutas_destino = await rutas_collection.count_documents({"destinoId": localidad_id})
        rutas_itinerario = await itinerarios_collection.count_documents({"localidadId": localidad_id})
        
        # Crear respuesta de localidad
        from ..models.localidad import LocalidadResponse
        localidad_response = LocalidadResponse(
            id=str(localidad['_id']),
            **{k: v for k, v in localidad.items() if k != '_id'}
        )
        
        return LocalidadConJerarquia(
            localidad=localidad_response,
            jerarquia_territorial=jerarquia,
            localidades_padre=localidades_padre,
            localidades_hijas=localidades_hijas,
            rutas_como_origen=rutas_origen,
            rutas_como_destino=rutas_destino,
            rutas_en_itinerario=rutas_itinerario
        )

# Instancia global del servicio
nivel_territorial_service = NivelTerritorialService()