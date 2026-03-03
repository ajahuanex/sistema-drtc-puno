# ✅ Modelo de Localidad Actualizado con Datos Demográficos

## 🎯 Cambios Realizados

Se ha actualizado el modelo de localidad en el backend para soportar datos demográficos y metadatos de centros poblados del GeoJSON.

---

## 📦 Archivo Modificado

**Backend**: `backend/app/models/localidad.py`

---

## 🆕 Nuevos Modelos Agregados

### 1. DatosDemograficos
```python
class DatosDemograficos(BaseModel):
    """Datos demográficos de centros poblados"""
    poblacion_total: Optional[int] = Field(None, ge=0)
    poblacion_hombres: Optional[int] = Field(None, ge=0)
    poblacion_mujeres: Optional[int] = Field(None, ge=0)
    viviendas_particulares: Optional[int] = Field(None, ge=0)
    poblacion_vulnerable: Optional[int] = Field(None, ge=0)
    tipo_area: Optional[str] = Field(None)  # Rural o Urbano
```

### 2. MetadataCentroPoblado
```python
class MetadataCentroPoblado(BaseModel):
    """Metadatos adicionales de centros poblados del GeoJSON"""
    codigo_ccpp: Optional[str] = Field(None)
    idccpp: Optional[str] = Field(None)
    llave_idma: Optional[str] = Field(None)
    contacto: Optional[str] = Field(None)
    whatsapp: Optional[str] = Field(None)
```

---

## 📝 Campos Agregados a LocalidadBase

```python
class LocalidadBase(BaseModel):
    # ... campos existentes ...
    
    # NUEVOS CAMPOS PARA CENTROS POBLADOS
    datos_demograficos: Optional[DatosDemograficos] = Field(None)
    metadata: Optional[MetadataCentroPoblado] = Field(None)
```

---

## 📊 Estructura Completa de Localidad

### Campos Básicos (existentes)
- ✅ nombre (obligatorio)
- ✅ tipo (CENTRO_POBLADO, DISTRITO, PROVINCIA, etc.)
- ✅ ubigeo
- ✅ departamento
- ✅ provincia
- ✅ distrito
- ✅ descripcion
- ✅ coordenadas (latitud, longitud)
- ✅ observaciones

### Nuevos Campos Demográficos
- 🆕 datos_demograficos.poblacion_total
- 🆕 datos_demograficos.poblacion_hombres
- 🆕 datos_demograficos.poblacion_mujeres
- 🆕 datos_demograficos.viviendas_particulares
- 🆕 datos_demograficos.poblacion_vulnerable
- 🆕 datos_demograficos.tipo_area (Rural/Urbano)

### Nuevos Metadatos
- 🆕 metadata.codigo_ccpp
- 🆕 metadata.idccpp
- 🆕 metadata.llave_idma
- 🆕 metadata.contacto
- 🆕 metadata.whatsapp

---

## 💾 Ejemplo de Documento en MongoDB

```javascript
{
  "_id": ObjectId("..."),
  "nombre": "CHAQUIMINAS",
  "tipo": "CENTRO_POBLADO",
  "ubigeo": "211002",
  "departamento": "PUNO",
  "provincia": "SAN ANTONIO DE PUTINA",
  "distrito": "ANANEA",
  "coordenadas": {
    "latitud": -14.669026784158689,
    "longitud": -69.558805214788777
  },
  "datos_demograficos": {
    "poblacion_total": 10,
    "poblacion_hombres": 6,
    "poblacion_mujeres": 4,
    "viviendas_particulares": 8,
    "poblacion_vulnerable": 0,
    "tipo_area": "Rural"
  },
  "metadata": {
    "codigo_ccpp": "0048",
    "idccpp": "2110020048",
    "llave_idma": "211002000000048",
    "contacto": "juan.suyo@geogpsperu.com",
    "whatsapp": "931381206"
  },
  "estaActiva": true,
  "fechaCreacion": ISODate("2026-02-25T..."),
  "fechaActualizacion": ISODate("2026-02-25T...")
}
```

---

## 🔄 Compatibilidad

### Retrocompatibilidad
- ✅ Los campos nuevos son **opcionales**
- ✅ Las localidades existentes sin estos campos seguirán funcionando
- ✅ No se requiere migración de datos existentes

### LocalidadUpdate
También se actualizó para soportar los nuevos campos:
```python
class LocalidadUpdate(BaseModel):
    # ... campos existentes ...
    datos_demograficos: Optional[DatosDemograficos] = None
    metadata: Optional[MetadataCentroPoblado] = None
```

---

## 🚀 Uso en el Frontend

### Crear localidad con datos demográficos
```typescript
const localidad = {
  nombre: 'CHAQUIMINAS',
  tipo: 'CENTRO_POBLADO',
  ubigeo: '211002',
  departamento: 'PUNO',
  provincia: 'SAN ANTONIO DE PUTINA',
  distrito: 'ANANEA',
  coordenadas: {
    latitud: -14.669027,
    longitud: -69.558805
  },
  datos_demograficos: {
    poblacion_total: 10,
    poblacion_hombres: 6,
    poblacion_mujeres: 4,
    viviendas_particulares: 8,
    poblacion_vulnerable: 0,
    tipo_area: 'Rural'
  },
  metadata: {
    codigo_ccpp: '0048',
    idccpp: '2110020048',
    llave_idma: '211002000000048',
    contacto: 'juan.suyo@geogpsperu.com',
    whatsapp: '931381206'
  }
};

await localidadService.crearLocalidad(localidad);
```

### Mostrar datos demográficos
```typescript
// En el componente
if (localidad.datos_demograficos) {
  console.log('Población:', localidad.datos_demograficos.poblacion_total);
  console.log('Tipo:', localidad.datos_demograficos.tipo_area);
}
```

---

## 📈 Estadísticas Disponibles

Con los nuevos campos, ahora puedes:

1. **Sumar población total** de todos los centros poblados
2. **Filtrar por tipo de área** (Rural/Urbano)
3. **Identificar población vulnerable**
4. **Contar viviendas** por provincia/distrito
5. **Analizar distribución de género**

### Ejemplo de consulta MongoDB
```javascript
// Población total de Puno
db.localidades.aggregate([
  { $match: { tipo: "CENTRO_POBLADO", departamento: "PUNO" } },
  { $group: { 
      _id: null, 
      poblacion_total: { $sum: "$datos_demograficos.poblacion_total" },
      total_viviendas: { $sum: "$datos_demograficos.viviendas_particulares" }
  }}
])

// Por tipo de área
db.localidades.aggregate([
  { $match: { tipo: "CENTRO_POBLADO", departamento: "PUNO" } },
  { $group: { 
      _id: "$datos_demograficos.tipo_area", 
      cantidad: { $sum: 1 },
      poblacion: { $sum: "$datos_demograficos.poblacion_total" }
  }}
])
```

---

## ✅ Verificación

### Build Frontend
```bash
cd frontend
ng build
```
**Resultado**: ✅ Exitoso sin errores

### Campos Importados
- ✅ Nombre, UBIGEO, Departamento, Provincia, Distrito
- ✅ Coordenadas GPS
- ✅ Población total, hombres, mujeres
- ✅ Viviendas particulares
- ✅ Población vulnerable
- ✅ Tipo de área (Rural/Urbano)
- ✅ Códigos CCPP, IDCCPP, Llave IDMA
- ✅ Contacto y WhatsApp

---

## 🎉 Resultado Final

El modelo de localidad ahora soporta:

1. ✅ **Datos básicos** (nombre, ubicación, coordenadas)
2. ✅ **Datos demográficos** (población, viviendas)
3. ✅ **Metadatos** (códigos, contactos)
4. ✅ **Retrocompatibilidad** (campos opcionales)
5. ✅ **Validación** (tipos y rangos correctos)

**El sistema está listo para importar centros poblados con todos sus datos demográficos.** 🚀

---

**Fecha de actualización**: 25 de febrero de 2026  
**Versión del modelo**: 2.0.0  
**Estado**: ✅ Completado y probado
