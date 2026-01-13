# Identificación de Niveles Territoriales en Rutas

## 📋 Resumen de Funcionalidad Implementada

Se ha implementado un sistema completo para identificar y analizar los niveles territoriales de las localidades que forman parte de las rutas (origen, destino e itinerario), permitiendo determinar si cada componente corresponde a un centro poblado, distrito, provincia o departamento.

## 🎯 Problema Resuelto

**Necesidad**: Identificar a qué nivel territorial llega cada componente de una ruta, ya que las localidades pueden ser:
- **Centros Poblados** (nivel más específico)
- **Distritos** (nivel distrital)
- **Provincias** (nivel provincial)  
- **Departamentos** (nivel departamental)

## 🆕 Nuevas Funcionalidades Implementadas

### 1. Enum de Nivel Territorial
```python
class NivelTerritorial(str, Enum):
    CENTRO_POBLADO = "CENTRO_POBLADO"  # Nivel más específico
    DISTRITO = "DISTRITO"              # Nivel distrital
    PROVINCIA = "PROVINCIA"            # Nivel provincial
    DEPARTAMENTO = "DEPARTAMENTO"      # Nivel departamental
```

### 2. Campo Obligatorio en Localidades
- **`nivel_territorial`**: Campo obligatorio que identifica automáticamente el nivel jerárquico

### 3. Modelos Especializados

#### LocalidadEnRuta
Representa una localidad dentro de una ruta con información territorial completa:
```python
{
  "localidad_id": "...",
  "ubigeo": "150101",
  "nombre": "Lima",
  "nivel_territorial": "DISTRITO",
  "departamento": "LIMA",
  "provincia": "LIMA", 
  "distrito": "LIMA",
  "tipo_en_ruta": "ORIGEN",  # ORIGEN, ESCALA, DESTINO
  "orden": 0,
  "distancia_desde_origen": 0.0
}
```

#### AnalisisNivelTerritorial
Análisis completo de una ruta con todos sus niveles territoriales:
```python
{
  "ruta_id": "...",
  "codigo_ruta": "R001",
  "origen": {...},  # LocalidadEnRuta
  "destino": {...}, # LocalidadEnRuta
  "itinerario": [...], # Lista de LocalidadEnRuta
  "niveles_involucrados": ["DISTRITO", "PROVINCIA"],
  "nivel_maximo": "PROVINCIA",  # Menos específico
  "nivel_minimo": "DISTRITO",   # Más específico
  "clasificacion_territorial": "INTERPROVINCIAL"
}
```

## 🔧 Archivos Implementados

### 1. Modelo Actualizado
- **`backend/app/models/localidad.py`**
  - Agregado `NivelTerritorial` enum
  - Campo `nivel_territorial` obligatorio
  - Modelos especializados para rutas

### 2. Servicio de Análisis
- **`backend/app/services/nivel_territorial_service.py`**
  - Determinación automática de nivel territorial
  - Análisis completo de rutas
  - Búsqueda y filtrado por niveles
  - Generación de estadísticas territoriales

### 3. API Endpoints
- **`backend/app/routers/nivel_territorial_router.py`**
  - 15+ endpoints especializados
  - Filtros avanzados por nivel territorial
  - Estadísticas y reportes

### 4. Scripts de Migración y Pruebas
- **`actualizar_niveles_territoriales.py`** - Actualiza localidades existentes
- **`test_niveles_territoriales.py`** - Suite completa de pruebas

## 🚀 Endpoints Disponibles

### Análisis de Rutas
```
GET /nivel-territorial/analizar-ruta/{ruta_id}
GET /nivel-territorial/resumen-ruta/{ruta_id}
```

### Búsqueda y Filtrado
```
POST /nivel-territorial/buscar-rutas
GET /nivel-territorial/rutas-interdepartamentales
GET /nivel-territorial/rutas-interprovinciales
GET /nivel-territorial/rutas-locales
GET /nivel-territorial/rutas-por-departamento/{departamento}
```

### Información de Localidades
```
GET /nivel-territorial/localidad/{localidad_id}
GET /nivel-territorial/jerarquia/{localidad_id}
GET /nivel-territorial/validar-nivel/{localidad_id}
```

### Estadísticas
```
GET /nivel-territorial/estadisticas
GET /nivel-territorial/niveles-disponibles
GET /nivel-territorial/clasificaciones-disponibles
```

## 📊 Determinación Automática de Nivel

### Algoritmo de Determinación
El sistema determina automáticamente el nivel territorial basándose en:

1. **Análisis del UBIGEO**:
   - `DDPPDD` (Departamento-Provincia-Distrito)
   - Si distrito = `00` → Nivel Provincial o Departamental
   - Si provincia = `00` → Nivel Departamental

2. **Análisis del Tipo de Municipalidad**:
   - Contiene "Distrital" → `DISTRITO`
   - Contiene "Provincial" → `PROVINCIA`
   - Otros casos → `CENTRO_POBLADO`

### Ejemplos de Determinación
```python
# UBIGEO: 150000 + "Gobierno Regional" → DEPARTAMENTO
# UBIGEO: 150100 + "Municipalidad Provincial" → PROVINCIA  
# UBIGEO: 150101 + "Municipalidad Distrital" → DISTRITO
# UBIGEO: 150101 + "Centro Poblado" → CENTRO_POBLADO
```

## 🎯 Clasificación de Rutas

### Tipos de Clasificación Territorial
- **INTERDEPARTAMENTAL**: Cruza departamentos
- **INTERPROVINCIAL**: Cruza provincias (mismo departamento)
- **INTERDISTRITAL**: Cruza distritos (misma provincia)
- **LOCAL**: Dentro del mismo distrito

### Ejemplo de Análisis
```json
{
  "ruta_id": "...",
  "codigo_ruta": "LIMA-AREQUIPA-001",
  "clasificacion_territorial": "INTERDEPARTAMENTAL",
  "origen": {
    "nombre": "Lima",
    "nivel_territorial": "DISTRITO",
    "departamento": "LIMA"
  },
  "destino": {
    "nombre": "Arequipa", 
    "nivel_territorial": "DISTRITO",
    "departamento": "AREQUIPA"
  },
  "cruza_departamentos": true,
  "cruza_provincias": true,
  "cruza_distritos": true
}
```

## 📈 Filtros Avanzados

### FiltroRutasPorNivel
```python
{
  "nivel_origen": "DISTRITO",
  "nivel_destino": "PROVINCIA",
  "departamento_origen": "LIMA",
  "departamento_destino": "AREQUIPA",
  "incluye_nivel": "CENTRO_POBLADO",
  "nivel_minimo_requerido": "DISTRITO",
  "nivel_maximo_permitido": "PROVINCIA"
}
```

### Casos de Uso de Filtros
1. **Rutas que conectan distritos con provincias**
2. **Rutas que incluyen centros poblados en su itinerario**
3. **Rutas interdepartamentales específicas**
4. **Rutas locales dentro de un departamento**

## 📊 Estadísticas Territoriales

### EstadisticasNivelTerritorial
```json
{
  "total_rutas_analizadas": 150,
  "distribucion_por_nivel_origen": {
    "DISTRITO": 85,
    "PROVINCIA": 45,
    "CENTRO_POBLADO": 20
  },
  "distribucion_por_nivel_destino": {
    "DISTRITO": 90,
    "PROVINCIA": 40,
    "CENTRO_POBLADO": 20
  },
  "combinaciones_mas_comunes": [
    {"combinacion": "DISTRITO → DISTRITO", "cantidad": 75},
    {"combinacion": "DISTRITO → PROVINCIA", "cantidad": 35}
  ],
  "rutas_por_clasificacion": {
    "INTERDEPARTAMENTAL": 45,
    "INTERPROVINCIAL": 35,
    "INTERDISTRITAL": 40,
    "LOCAL": 30
  }
}
```

## 🏗️ Jerarquía Territorial

### LocalidadConJerarquia
Proporciona información completa de la jerarquía territorial:
```json
{
  "localidad": {...},
  "jerarquia_territorial": {
    "departamento": {"nombre": "LIMA", "ubigeo": "150000"},
    "provincia": {"nombre": "LIMA", "ubigeo": "150100"},
    "distrito": {"nombre": "LIMA", "ubigeo": "150101"}
  },
  "localidades_padre": ["dept_id", "prov_id"],
  "localidades_hijas": ["centro1_id", "centro2_id"],
  "rutas_como_origen": 25,
  "rutas_como_destino": 30,
  "rutas_en_itinerario": 15
}
```

## 🚀 Instrucciones de Implementación

### 1. Actualizar Base de Datos
```bash
python actualizar_niveles_territoriales.py
```

### 2. Ejecutar Pruebas
```bash
python test_niveles_territoriales.py
```

### 3. Agregar Router al Main
```python
from app.routers.nivel_territorial_router import router as nivel_territorial_router
app.include_router(nivel_territorial_router, prefix="/api/v1")
```

## 💡 Casos de Uso Prácticos

### 1. Análisis de Cobertura Territorial
```python
# Obtener todas las rutas que llegan a nivel de centro poblado
filtros = FiltroRutasPorNivel(nivel_destino=NivelTerritorial.CENTRO_POBLADO)
rutas_centros = await buscar_rutas_por_nivel(filtros)
```

### 2. Rutas Interdepartamentales
```python
# Obtener estadísticas de conectividad interdepartamental
estadisticas = await generar_estadisticas_territoriales()
interdepartamentales = estadisticas.rutas_por_clasificacion["INTERDEPARTAMENTAL"]
```

### 3. Análisis de Localidad Específica
```python
# Analizar el rol territorial de una localidad
jerarquia = await obtener_jerarquia_localidad(localidad_id)
print(f"Rutas como origen: {jerarquia.rutas_como_origen}")
print(f"Rutas como destino: {jerarquia.rutas_como_destino}")
```

### 4. Filtrado por Departamento
```python
# Rutas que tienen origen O destino en Lima
rutas_lima = await obtener_rutas_por_departamento("LIMA", como_origen=True, como_destino=True)
```

## 📋 Beneficios Implementados

### Para Análisis de Rutas
- ✅ Identificación automática del nivel territorial de cada localidad
- ✅ Clasificación automática de rutas por alcance territorial
- ✅ Análisis de cobertura territorial por nivel
- ✅ Estadísticas detalladas de conectividad

### Para Filtrado y Búsqueda
- ✅ Filtros avanzados por nivel territorial
- ✅ Búsqueda de rutas interdepartamentales/interprovinciales
- ✅ Identificación de rutas locales vs. de larga distancia
- ✅ Análisis de conectividad por departamento/provincia

### Para Planificación
- ✅ Identificación de gaps en cobertura territorial
- ✅ Análisis de centralización vs. descentralización
- ✅ Planificación de nuevas rutas por nivel territorial
- ✅ Optimización de itinerarios según niveles

## 🎉 Resultado Final

El sistema ahora puede:

1. **Identificar automáticamente** el nivel territorial de cada localidad
2. **Clasificar rutas** según su alcance territorial
3. **Filtrar y buscar** rutas por criterios territoriales específicos
4. **Generar estadísticas** detalladas de conectividad territorial
5. **Analizar jerarquías** territoriales completas
6. **Proporcionar insights** para planificación territorial

---

**Fecha de implementación**: 8 de enero de 2025  
**Versión**: 1.0  
**Estado**: ✅ Implementado y probado