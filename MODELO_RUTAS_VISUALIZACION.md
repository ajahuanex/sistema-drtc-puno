# 📍 MODELO DE DATOS - MÓDULO RUTAS

## 🎯 Estructura Principal

El módulo de rutas maneja el transporte de pasajeros/carga entre localidades, vinculando empresas, resoluciones y localidades.

---

## 📊 MODELO PRINCIPAL: Ruta

### Campos Core (Obligatorios)

```typescript
{
  id: string,                    // ID único de MongoDB
  codigoRuta: string,            // Código único (ej: "R-001", "R-002")
  nombre: string,                // Nombre descriptivo (ej: "Juliaca - Puno")
  
  // LOCALIDADES EMBEBIDAS
  origen: LocalidadEmbebida,
  destino: LocalidadEmbebida,
  itinerario: LocalidadItinerario[],  // Paradas intermedias con orden
  
  // EMPRESA Y RESOLUCIÓN EMBEBIDAS
  empresa: EmpresaEmbebida,
  resolucion: ResolucionEmbebida,
  
  // FRECUENCIA Y HORARIOS
  frecuencia: FrecuenciaServicio,
  horarios: HorarioServicio[],
  
  // TIPO Y ESTADO
  tipoServicio: "PASAJEROS" | "CARGA" | "MIXTO",
  estado: EstadoRuta
}
```

---

## 🏢 Estructuras Embebidas

### 1️⃣ LocalidadEmbebida

```typescript
{
  id: string,                    // ID de la localidad (referencia)
  nombre: string,                // Nombre (ej: "Juliaca", "Puno")
  
  // OPCIONALES (compatibilidad con modelo completo)
  tipo?: string,                 // "CIUDAD", "DISTRITO", "CENTRO_POBLADO"
  ubigeo?: string,              // Código UBIGEO
  departamento?: string,         // "PUNO"
  provincia?: string,            // "SAN ROMÁN", "PUNO"
  distrito?: string,             // "JULIACA", "PUNO"
  coordenadas?: {
    latitud: number,
    longitud: number
  },
  
  // ✅ NUEVO: Metadata flexible
  metadata?: {
    es_alias?: boolean,          // Si es un alias de otra localidad
    nombre_oficial?: string,     // Nombre oficial si es alias
    alias_id?: string,           // ID del alias
    fecha_sincronizacion?: string,
    [key: string]: any           // Extensible para futuros campos
  }
}
```

**Ejemplo real:**
```json
{
  "id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "nombre": "Juliaca",
  "tipo": "CIUDAD",
  "ubigeo": "210101",
  "departamento": "PUNO",
  "provincia": "SAN ROMÁN",
  "distrito": "JULIACA",
  "coordenadas": {
    "latitud": -15.5,
    "longitud": -70.13
  }
}
```

---

### 2️⃣ LocalidadItinerario

Extiende `LocalidadEmbebida` + campo `orden`:

```typescript
{
  ...LocalidadEmbebida,
  orden: number                  // Posición en el itinerario (1, 2, 3...)
}
```

**Ejemplo de itinerario:**
```json
[
  { "id": "...", "nombre": "Juliaca", "orden": 1 },
  { "id": "...", "nombre": "Caracoto", "orden": 2 },
  { "id": "...", "nombre": "Cabana", "orden": 3 },
  { "id": "...", "nombre": "Puno", "orden": 4 }
]
```

---

### 3️⃣ EmpresaEmbebida

```typescript
{
  id: string,                    // ID de la empresa
  ruc: string,                   // RUC de 11 dígitos
  razonSocial: string | {        // Puede ser string o objeto
    principal: string
  }
}
```

**Ejemplo:**
```json
{
  "id": "65b2c3d4e5f6g7h8i9j0k1l2",
  "ruc": "20123456789",
  "razonSocial": {
    "principal": "TRANSPORTES JULIACA S.A.C."
  }
}
```

---

### 4️⃣ ResolucionEmbebida

```typescript
{
  id: string,                    // ID de la resolución
  nroResolucion: string,         // Número (ej: "001-2024-DRTC")
  tipoResolucion: "PADRE" | "HIJO",
  estado: string                 // "VIGENTE", "VENCIDA", etc.
}
```

**Ejemplo:**
```json
{
  "id": "65c3d4e5f6g7h8i9j0k1l2m3",
  "nroResolucion": "001-2024-DRTC-PUNO",
  "tipoResolucion": "PADRE",
  "estado": "VIGENTE"
}
```

---

### 5️⃣ FrecuenciaServicio

```typescript
{
  tipo: "DIARIO" | "SEMANAL" | "QUINCENAL" | "MENSUAL" | "ESPECIAL",
  cantidad: number,              // Número de servicios
  dias: string[],                // ["LUNES", "MARTES", ...]
  descripcion: string            // Descripción legible
}
```

**Ejemplos:**
```json
// 1 servicio diario
{
  "tipo": "DIARIO",
  "cantidad": 1,
  "dias": [],
  "descripcion": "1 servicio diario"
}

// 3 servicios semanales
{
  "tipo": "SEMANAL",
  "cantidad": 3,
  "dias": ["LUNES", "MIERCOLES", "VIERNES"],
  "descripcion": "3 servicios semanales (Lun-Mie-Vie)"
}
```

---

### 6️⃣ HorarioServicio

```typescript
{
  hora: string,                  // Formato "HH:MM" (ej: "06:30")
  tipo?: string                  // Opcional: "SALIDA", "LLEGADA"
}
```

**Ejemplo:**
```json
[
  { "hora": "06:30", "tipo": "SALIDA" },
  { "hora": "14:00", "tipo": "SALIDA" },
  { "hora": "18:30", "tipo": "SALIDA" }
]
```

---

## 🎨 Enums y Tipos

### EstadoRuta
```typescript
type EstadoRuta = 
  | "ACTIVA"              // Operando normalmente
  | "INACTIVA"            // Temporalmente sin operar
  | "SUSPENDIDA"          // Suspendida por autoridad
  | "EN_MANTENIMIENTO"    // En mantenimiento temporal
  | "ARCHIVADA"           // Archivada (histórico)
  | "DADA_DE_BAJA"        // Dada de baja permanente
  | "CANCELADA";          // Cancelada
```

### TipoRuta
```typescript
type TipoRuta = 
  | "URBANA"              // Dentro de ciudad
  | "INTERURBANA"         // Entre ciudades cercanas
  | "INTERPROVINCIAL"     // Entre provincias
  | "INTERREGIONAL"       // Entre regiones
  | "RURAL";              // Zonas rurales
```

### TipoServicio
```typescript
type TipoServicio = 
  | "PASAJEROS"           // Solo pasajeros
  | "CARGA"               // Solo carga
  | "MIXTO";              // Pasajeros y carga
```

---

## 📦 Ejemplo Completo de Ruta

```json
{
  "id": "65d4e5f6g7h8i9j0k1l2m3n4",
  "codigoRuta": "R-001-2024",
  "nombre": "Juliaca - Puno",
  
  "origen": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "nombre": "Juliaca",
    "tipo": "CIUDAD",
    "ubigeo": "210101",
    "departamento": "PUNO",
    "provincia": "SAN ROMÁN",
    "distrito": "JULIACA",
    "coordenadas": {
      "latitud": -15.5,
      "longitud": -70.13
    }
  },
  
  "destino": {
    "id": "65a2b3c4d5e6f7g8h9i0j1k2",
    "nombre": "Puno",
    "tipo": "CIUDAD",
    "ubigeo": "210102",
    "departamento": "PUNO",
    "provincia": "PUNO",
    "distrito": "PUNO",
    "coordenadas": {
      "latitud": -15.84,
      "longitud": -70.02
    }
  },
  
  "itinerario": [
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "nombre": "Juliaca",
      "orden": 1
    },
    {
      "id": "65a3b4c5d6e7f8g9h0i1j2k3",
      "nombre": "Caracoto",
      "orden": 2
    },
    {
      "id": "65a4b5c6d7e8f9g0h1i2j3k4",
      "nombre": "Cabana",
      "orden": 3
    },
    {
      "id": "65a2b3c4d5e6f7g8h9i0j1k2",
      "nombre": "Puno",
      "orden": 4
    }
  ],
  
  "empresa": {
    "id": "65b2c3d4e5f6g7h8i9j0k1l2",
    "ruc": "20123456789",
    "razonSocial": {
      "principal": "TRANSPORTES JULIACA S.A.C."
    }
  },
  
  "resolucion": {
    "id": "65c3d4e5f6g7h8i9j0k1l2m3",
    "nroResolucion": "001-2024-DRTC-PUNO",
    "tipoResolucion": "PADRE",
    "estado": "VIGENTE"
  },
  
  "frecuencia": {
    "tipo": "DIARIO",
    "cantidad": 3,
    "dias": [],
    "descripcion": "3 servicios diarios"
  },
  
  "horarios": [
    { "hora": "06:30", "tipo": "SALIDA" },
    { "hora": "12:00", "tipo": "SALIDA" },
    { "hora": "17:30", "tipo": "SALIDA" }
  ],
  
  "tipoRuta": "INTERPROVINCIAL",
  "tipoServicio": "PASAJEROS",
  "estado": "ACTIVA",
  
  "distancia": 45.5,
  "tiempoEstimado": "1h 30min",
  "tarifaBase": 5.50,
  "capacidadMaxima": 45,
  
  "restricciones": [
    "No permitido sobrepasar capacidad máxima",
    "Horarios deben respetarse ±15 minutos"
  ],
  
  "observaciones": "Ruta principal entre Juliaca y Puno",
  "descripcion": "Ruta interprovincial de pasajeros con paradas intermedias",
  
  "validacionBinaria": "111",
  
  "estaActivo": true,
  "fechaRegistro": "2024-01-15T10:30:00Z",
  "fechaActualizacion": "2024-03-20T14:15:00Z"
}
```

---

## 🔄 Operaciones CRUD

### Crear Ruta (RutaCreate)
```typescript
interface RutaCreate {
  codigoRuta: string;
  nombre: string;
  origen: LocalidadEmbebida;
  destino: LocalidadEmbebida;
  itinerario: LocalidadItinerario[];
  empresa: EmpresaEmbebida;
  resolucion: ResolucionEmbebida;
  frecuencia: FrecuenciaServicio;
  tipoServicio: TipoServicio;
  // ... campos opcionales
}
```

### Actualizar Ruta (RutaUpdate)
Todos los campos son opcionales:
```typescript
interface RutaUpdate {
  codigoRuta?: string;
  nombre?: string;
  origen?: LocalidadEmbebida;
  destino?: LocalidadEmbebida;
  // ... todos los campos opcionales
}
```

---

## 🔍 Estado de Sincronización con Datos Relacionados

### 🔐 Campo: `validacionBinaria`

Sistema de flags binarios de 3 bits que indica el estado de sincronización con los módulos relacionados.

```typescript
validacionBinaria: string  // Formato: "000" a "111"
```

### Estructura de Bits:

| Bit | Posición | Valor | Módulo | Descripción |
|-----|----------|-------|--------|-------------|
| 0 | Derecha | 001 | **Empresas** | RUC validado contra módulo de empresas |
| 1 | Centro | 010 | **Resoluciones** | Resolución validada contra módulo de resoluciones |
| 2 | Izquierda | 100 | **Localidades** | Localidades (origen, destino, itinerario) validadas |

### Estados Posibles:

```
┌─────────────┬───────┬─────────────────────────────────────────┐
│ Binario     │ Dec   │ Estado de Sincronización                │
├─────────────┼───────┼─────────────────────────────────────────┤
│ "000"       │   0   │ ❌ Nada validado (recién creada)        │
│ "001"       │   1   │ ✅ Solo RUC validado                    │
│ "010"       │   2   │ ✅ Solo Resolución validada             │
│ "011"       │   3   │ ✅ RUC + Resolución validados           │
│ "100"       │   4   │ ✅ Solo Localidades validadas           │
│ "101"       │   5   │ ✅ RUC + Localidades validados          │
│ "110"       │   6   │ ✅ Resolución + Localidades validados   │
│ "111"       │   7   │ ✅ TODO validado (sincronizado 100%)    │
└─────────────┴───────┴─────────────────────────────────────────┘
```

### Interpretación Visual:

```
validacionBinaria: "101"
                    ↑↑↑
                    │││
                    ││└─→ Bit 0: RUC validado ✅
                    │└──→ Bit 1: Resolución NO validada ❌
                    └───→ Bit 2: Localidades validadas ✅
```

### Ejemplo en una Ruta:

```json
{
  "id": "65d4e5f6g7h8i9j0k1l2m3n4",
  "codigoRuta": "R-001-2024",
  "nombre": "Juliaca - Puno",
  
  "empresa": {
    "id": "65b2c3d4e5f6g7h8i9j0k1l2",
    "ruc": "20123456789",
    "razonSocial": { "principal": "TRANSPORTES JULIACA S.A.C." }
  },
  
  "resolucion": {
    "id": "65c3d4e5f6g7h8i9j0k1l2m3",
    "nroResolucion": "001-2024-DRTC-PUNO",
    "tipoResolucion": "PADRE",
    "estado": "VIGENTE"
  },
  
  "origen": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "nombre": "Juliaca"
  },
  
  "destino": {
    "id": "65a2b3c4d5e6f7g8h9i0j1k2",
    "nombre": "Puno"
  },
  
  // 🔐 ESTADO DE SINCRONIZACIÓN
  "validacionBinaria": "111",
  // ✅ RUC existe en módulo Empresas
  // ✅ Resolución existe en módulo Resoluciones  
  // ✅ Localidades existen en módulo Localidades
}
```

### ¿Cómo se actualiza?

#### 1. Al crear una ruta:
```typescript
// Por defecto empieza sin validar
validacionBinaria: "000"
```

#### 2. Al sincronizar con Empresas:
```typescript
// Si RUC existe en módulo de empresas
validacionBinaria = setBit(validacionBinaria, 0, true)
// "000" → "001"
```

#### 3. Al sincronizar con Resoluciones:
```typescript
// Si resolución existe en módulo de resoluciones
validacionBinaria = setBit(validacionBinaria, 1, true)
// "001" → "011"
```

#### 4. Al sincronizar con Localidades:
```typescript
// Si todas las localidades existen
validacionBinaria = setBit(validacionBinaria, 2, true)
// "011" → "111" ✅ COMPLETAMENTE SINCRONIZADA
```

### Operaciones de Verificación:

```typescript
// Verificar si RUC está validado
const rucValidado = validacionBinaria[2] === '1'

// Verificar si Resolución está validada
const resolucionValidada = validacionBinaria[1] === '1'

// Verificar si Localidades están validadas
const localidadesValidadas = validacionBinaria[0] === '1'

// Verificar sincronización completa
const totalmenteSincronizada = validacionBinaria === "111"
```

### Casos de Uso:

#### 🔴 Ruta con problemas de sincronización:
```json
{
  "codigoRuta": "R-999-2024",
  "validacionBinaria": "001",
  // ✅ Empresa existe
  // ❌ Resolución NO encontrada (puede estar eliminada)
  // ❌ Localidades NO validadas
}
```

**Acción:** Revisar resolución y localidades

#### 🟡 Ruta parcialmente sincronizada:
```json
{
  "codigoRuta": "R-002-2024",
  "validacionBinaria": "110",
  // ❌ Empresa NO validada (RUC puede ser incorrecto)
  // ✅ Resolución existe
  // ✅ Localidades existen
}
```

**Acción:** Corregir datos de empresa

#### 🟢 Ruta completamente sincronizada:
```json
{
  "codigoRuta": "R-001-2024",
  "validacionBinaria": "111",
  // ✅ Todos los datos relacionados validados
}
```

**Acción:** Ninguna, ruta en óptimas condiciones

### Funciones de Sincronización (Backend):

```python
def validar_sincronizacion_ruta(ruta: Ruta) -> str:
    """
    Valida la sincronización de una ruta con módulos relacionados
    y retorna el estado binario actualizado
    """
    bits = ['0', '0', '0']
    
    # Bit 0: Validar RUC en módulo Empresas
    if empresa_existe(ruta.empresa.ruc):
        bits[2] = '1'
    
    # Bit 1: Validar Resolución
    if resolucion_existe(ruta.resolucion.id):
        bits[1] = '1'
    
    # Bit 2: Validar Localidades
    origen_ok = localidad_existe(ruta.origen.id)
    destino_ok = localidad_existe(ruta.destino.id)
    itinerario_ok = all(localidad_existe(loc.id) for loc in ruta.itinerario)
    
    if origen_ok and destino_ok and itinerario_ok:
        bits[0] = '1'
    
    return ''.join(bits)
```

### Endpoints de Sincronización:

```
POST /api/rutas/sincronizar-localidades
- Actualiza validacionBinaria para todas las rutas
- Verifica localidades contra módulo de Localidades

POST /api/rutas/sincronizar-empresas
- Valida RUCs contra módulo de Empresas
- Actualiza datos de empresa embebidos

POST /api/rutas/sincronizar-resoluciones
- Valida resoluciones contra módulo de Resoluciones
- Actualiza datos de resolución embebidos

POST /api/rutas/{id}/forzar-sincronizacion
- Fuerza la sincronización completa de una ruta específica

GET /api/rutas/verificar-sincronizacion
- Retorna reporte de estado de sincronización de todas las rutas
```

### Respuesta de Verificación:

```json
{
  "total_rutas": 150,
  "completamente_sincronizadas": 142,  // "111"
  "con_problemas": 8,
  "detalle": {
    "sin_validar": 2,                  // "000"
    "solo_ruc": 1,                     // "001"
    "sin_localidades": 3,              // "011"
    "sin_resolucion": 2                // "101"
  },
  "rutas_problematicas": [
    {
      "id": "...",
      "codigoRuta": "R-999",
      "validacionBinaria": "001",
      "problemas": [
        "Resolución no encontrada",
        "Localidades no validadas"
      ]
    }
  ]
}
```

### Beneficios del Sistema:

✅ **Compacto**: Un solo campo string de 3 caracteres
✅ **Rápido**: Operaciones bitwise muy eficientes
✅ **Claro**: Estado visible de inmediato
✅ **Escalable**: Fácil agregar más bits si se necesita
✅ **Diagnóstico**: Identifica problemas específicos rápidamente

---

## 📈 Estadísticas y Filtros

### Filtros disponibles:
- Por código de ruta
- Por nombre
- Por origen/destino (ID o nombre)
- Por empresa (ID, RUC, razón social)
- Por resolución (ID, número)
- Por estado, tipo, servicio
- Por rango de distancia
- Paginación (page, limit)

---

## 🔗 Relaciones con Otros Módulos

```
Ruta
├── Localidades (origen, destino, itinerario)
│   └── Módulo Localidades (referencia por ID)
├── Empresa
│   └── Módulo Empresas (referencia por ID y RUC)
└── Resolución
    └── Módulo Resoluciones (referencia por ID)
```

---

## 💡 Características Especiales

1. **Datos Embebidos**: Ruta almacena datos esenciales embebidos para evitar múltiples consultas
2. **Sincronización**: Sistema de validación binaria para tracking de sincronización
3. **Normalización**: Normalización automática de RUCs y datos de empresa
4. **Flexibilidad**: Campo metadata permite extensión sin cambios en modelo
5. **Validación**: Validación de códigos únicos por resolución
6. **Carga Masiva**: Soporte para importación masiva desde Excel/CSV

---

## 📝 Notas Importantes

- Los campos embebidos (empresa, localidades, resolución) mantienen datos básicos para consultas rápidas
- Los IDs permiten hacer lookup completo cuando se necesita información detallada
- La validación binaria ayuda a identificar qué sincronizaciones están pendientes
- El itinerario mantiene el orden de las paradas intermedias
- Las frecuencias son flexibles y descriptivas
