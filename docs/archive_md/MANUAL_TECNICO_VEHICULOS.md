# 🔧 MANUAL TÉCNICO: MÓDULO DE VEHÍCULOS

**Versión:** 1.0  
**Fecha:** 17 de Mayo de 2026  
**Audiencia:** Administradores, Técnicos, Desarrolladores

---

## 📋 TABLA DE CONTENIDOS

1. [Arquitectura](#arquitectura)
2. [Componentes](#componentes)
3. [Servicios](#servicios)
4. [Modelos de Datos](#modelos-de-datos)
5. [Flujos de Datos](#flujos-de-datos)
6. [Validaciones](#validaciones)
7. [Mantenimiento](#mantenimiento)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ ARQUITECTURA

### Estructura General

```
┌─────────────────────────────────────────┐
│         INTERFAZ DE USUARIO             │
│  (Componentes Angular Standalone)       │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌──────────────────┐  ┌──────────────────┐
│ Componentes      │  │ Pipes            │
├──────────────────┤  ├──────────────────┤
│ vehiculos        │  │ categoriaDesc    │
│ crear-unificado  │  │ carroceriaDesc   │
│ detalle-mejorado │  │ combustibleDesc  │
└────────┬─────────┘  │ estadoFisicoDesc │
         │            │ edadDescripcion  │
         │            └──────────────────┘
         │
        ▼
┌──────────────────────────────────────────┐
│         SERVICIOS (RxJS)                 │
├──────────────────────────────────────────┤
│ VehiculoService                          │
│ VehiculoSoloService                      │
│ VehiculoIntegrationService               │
│ VehiculoHelperService                    │
└────────┬─────────────────────────────────┘
         │
        ▼
┌──────────────────────────────────────────┐
│         API REST (Backend)               │
├──────────────────────────────────────────┤
│ GET    /vehiculos                        │
│ GET    /vehiculos/{id}                   │
│ POST   /vehiculos                        │
│ PUT    /vehiculos/{id}                   │
│ DELETE /vehiculos/{id}                   │
│ GET    /vehiculos-solo                   │
│ POST   /vehiculos-solo                   │
│ ...                                      │
└──────────────────────────────────────────┘
         │
        ▼
┌──────────────────────────────────────────┐
│         BASE DE DATOS                    │
├──────────────────────────────────────────┤
│ Colecciones:                             │
│ - vehiculos                              │
│ - vehiculos_solo                         │
│ - empresas                               │
│ - rutas                                  │
└──────────────────────────────────────────┘
```

### Separación de Responsabilidades

```
VehiculoSolo (Datos Técnicos Puros)
├─ Especificaciones técnicas
├─ Dimensiones y capacidades
├─ Motor y combustible
├─ Origen e importación
└─ Historial de placas

Vehiculo (Datos Administrativos)
├─ Asignación a empresa
├─ Resolución
├─ Rutas asignadas
├─ Estado operativo
└─ Información de baja
```

---

## 🧩 COMPONENTES

### 1. VehiculosComponent
**Ubicación:** `frontend/src/app/components/vehiculos/vehiculos.component.ts`

**Responsabilidades:**
- Listar vehículos
- Filtrar y buscar
- Paginar resultados
- Seleccionar múltiples vehículos
- Cambiar estado en bloque

**Signals:**
- `vehiculos` - Array de vehículos
- `empresas` - Array de empresas
- `rutas` - Array de rutas
- `cargando` - Estado de carga
- `vehiculosSeleccionados` - Set de IDs seleccionados

### 2. CrearVehiculoUnificadoComponent
**Ubicación:** `frontend/src/app/components/vehiculos/crear-vehiculo-unificado.component.ts`

**Responsabilidades:**
- Guiar creación de vehículos
- Validar datos técnicos
- Validar datos administrativos
- Crear vehículo completo

**Flujo:**
1. Paso 1: Datos Técnicos
2. Paso 2: Datos Administrativos
3. Paso 3: Confirmación

### 3. VehiculoDetalleMejoradoComponent
**Ubicación:** `frontend/src/app/components/vehiculos/vehiculo-detalle-mejorado.component.ts`

**Responsabilidades:**
- Mostrar detalles completos
- Mostrar datos técnicos
- Mostrar datos administrativos
- Validar integridad

**Tabs:**
1. Datos Técnicos
2. Datos Administrativos
3. Validación

---

## 🔌 SERVICIOS

### VehiculoIntegrationService
**Ubicación:** `frontend/src/app/services/vehiculo-integration.service.ts`

**Métodos principales:**

```typescript
// Crear vehículo completo (transacción)
crearVehiculoCompleto(datosTecnicos, datosAdmin): Observable<{vehiculoSolo, vehiculo}>

// Obtener vehículo con datos técnicos
obtenerVehiculoCompleto(vehiculoId): Observable<VehiculoConDatos>

// Validar integridad referencial
validarIntegridad(vehiculoId): Observable<ValidationResult>

// Detectar inconsistencias
detectarInconsistencias(): Observable<Inconsistencia[]>

// Sincronizar datos
sincronizarDatos(vehiculoId): Observable<SyncResult>
```

### VehiculoHelperService
**Ubicación:** `frontend/src/app/services/vehiculo-helper.service.ts`

**Métodos principales:**

```typescript
// Obtener datos técnicos
obtenerMarca(vehiculo): Observable<string>
obtenerModelo(vehiculo): Observable<string>
obtenerMarcaModelo(vehiculo): Observable<string>
obtenerDatosTecnicos(vehiculo): Observable<VehiculoSolo>
obtenerInfoFormateada(vehiculo): Observable<VehiculoInfoFormateada>

// Descripciones
getDescripcionCategoria(categoria): string
getDescripcionCarroceria(carroceria): string
getDescripcionCombustible(combustible): string
getDescripcionEstadoFisico(estado): string
getDescripcionEdad(anioFabricacion): string

// Utilidades
tieneDatosTecnicos(vehiculo): boolean
calcularEdad(anioFabricacion): number
```

---

## 📊 MODELOS DE DATOS

### Vehiculo
```typescript
interface Vehiculo {
  id: string;
  placa: string;
  vehiculoDataId: string; // Referencia a VehiculoSolo
  empresaActualId: string;
  resolucionId?: string;
  tipoServicio: string;
  rutasAsignadasIds: string[];
  estado: EstadoVehiculo;
  estaActivo: boolean;
  sedeRegistro?: string;
  observaciones?: string;
  fechaRegistro?: Date;
  fechaActualizacion?: Date;
  // ... otros campos
}
```

### VehiculoSolo
```typescript
interface VehiculoSolo {
  id: string;
  placaActual: string;
  vin: string;
  numeroSerie: string;
  numeroMotor: string;
  marca: string;
  modelo: string;
  anioFabricacion: number;
  categoria: CategoriaVehiculo;
  carroceria: TipoCarroceria;
  color: string;
  combustible: TipoCombustible;
  numeroAsientos: number;
  numeroPasajeros: number;
  numeroEjes: number;
  pesoSeco: number;
  pesoBruto: number;
  cilindrada: number;
  potencia?: number;
  paisOrigen: string;
  estadoFisico: EstadoFisicoVehiculo;
  // ... otros campos
}
```

---

## 🔄 FLUJOS DE DATOS

### Flujo de Creación

```
Usuario inicia creación
    ↓
Paso 1: Completa datos técnicos
    ↓
Validar datos técnicos
    ↓
Crear VehiculoSolo
    ↓
Paso 2: Completa datos administrativos
    ↓
Validar datos administrativos
    ↓
Crear Vehiculo con referencia a VehiculoSolo
    ↓
Paso 3: Confirmación
    ↓
Validar integridad final
    ↓
Vehículo creado exitosamente
```

### Flujo de Obtención de Datos

```
Usuario solicita detalles
    ↓
Obtener Vehiculo por ID
    ↓
Obtener VehiculoSolo usando vehiculoDataId
    ↓
Combinar datos
    ↓
Mostrar en UI
```

### Flujo de Validación

```
Usuario solicita validación
    ↓
Validar que VehiculoSolo existe
    ↓
Validar que Empresa existe
    ↓
Validar que Rutas existen
    ↓
Validar consistencia de datos
    ↓
Retornar resultado
```

---

## ✅ VALIDACIONES

### Validaciones de Datos Técnicos

```typescript
// Campos obligatorios
- placaActual: string (formato ABC-123)
- vin: string
- numeroSerie: string
- numeroMotor: string
- marca: string
- modelo: string
- anioFabricacion: number (1990-2027)
- anioModelo: number
- categoria: CategoriaVehiculo
- clase: string
- carroceria: TipoCarroceria
- color: string
- combustible: TipoCombustible
- numeroAsientos: number (1-100)
- numeroPasajeros: number (1-200)
- numeroEjes: number (1-10)
- numeroRuedas: number
- pesoSeco: number (kg)
- pesoBruto: number (kg)
- cilindrada: number (cc)
- paisOrigen: string
- paisProcedencia: string
- estadoFisico: EstadoFisicoVehiculo
```

### Validaciones de Datos Administrativos

```typescript
// Campos obligatorios
- placa: string (debe coincidir con VehiculoSolo)
- vehiculoDataId: string (debe existir)
- empresaActualId: string (debe existir)
- tipoServicio: string (PASAJEROS, CARGA, MIXTO)

// Campos opcionales
- resolucionId?: string (si existe, debe ser válida)
- rutasAsignadasIds?: string[] (si existen, deben ser válidas)
- estado?: string (debe ser EstadoVehiculo válido)
```

### Validaciones de Integridad

```typescript
// Verificar que:
1. VehiculoSolo existe
2. Empresa existe
3. Resolución existe (si se proporciona)
4. Rutas existen (si se proporcionan)
5. Placa es consistente entre Vehiculo y VehiculoSolo
6. No hay duplicados de placa
7. Datos administrativos son válidos
```

---

## 🛠️ MANTENIMIENTO

### Monitoreo

**Métricas a monitorear:**
- Tiempo de carga de listado
- Tiempo de creación de vehículos
- Errores de validación
- Inconsistencias detectadas
- Uso de memoria

### Limpieza de Datos

**Tareas periódicas:**
1. Detectar inconsistencias
2. Sincronizar datos
3. Limpiar registros huérfanos
4. Validar integridad

**Script de mantenimiento:**
```typescript
// Ejecutar diariamente
this.integrationService.detectarInconsistencias().subscribe(inconsistencias => {
  if (inconsistencias.length > 0) {
    console.warn('Inconsistencias detectadas:', inconsistencias);
    // Notificar administrador
  }
});
```

### Backup y Recuperación

**Backup:**
- Realizar backup diario de BD
- Incluir colecciones: vehiculos, vehiculos_solo

**Recuperación:**
- Restaurar desde backup más reciente
- Validar integridad después de restaurar

---

## 🔍 TROUBLESHOOTING

### Problema: Vehículo sin datos técnicos

**Síntomas:**
- Campo `vehiculoDataId` es null o vacío
- No se pueden ver datos técnicos

**Solución:**
```typescript
// Detectar
const vehiculosSinDatos = vehiculos.filter(v => !v.vehiculoDataId);

// Corregir
// Opción 1: Crear VehiculoSolo y actualizar referencia
// Opción 2: Eliminar Vehiculo y recrear
```

### Problema: Inconsistencias de placa

**Síntomas:**
- Placa diferente en Vehiculo vs VehiculoSolo
- Errores de validación

**Solución:**
```typescript
// Detectar
this.integrationService.validarIntegridad(vehiculoId).subscribe(resultado => {
  if (!resultado.valido) {
    console.log('Errores:', resultado.errores);
  }
});

// Corregir
// Sincronizar placa desde VehiculoSolo
this.integrationService.sincronizarDatos(vehiculoId).subscribe();
```

### Problema: Empresa no encontrada

**Síntomas:**
- Error al validar integridad
- Mensaje: "Empresa no encontrada"

**Solución:**
1. Verificar que empresa existe en BD
2. Verificar que `empresaActualId` es correcto
3. Recrear Vehiculo con empresa válida

### Problema: Rutas no encontradas

**Síntomas:**
- Error al validar integridad
- Mensaje: "Ruta X no encontrada"

**Solución:**
1. Verificar que rutas existen en BD
2. Verificar que `rutasAsignadasIds` son correctos
3. Actualizar Vehiculo con rutas válidas

---

## 📞 CONTACTO TÉCNICO

Para problemas técnicos:
- **Email:** tech-support@sirret.gob.pe
- **Slack:** #vehiculos-tech
- **Jira:** Proyecto VEHICULOS

---

**Última actualización:** 17 de Mayo de 2026  
**Versión:** 1.0  
**Estado:** ✅ Publicado

