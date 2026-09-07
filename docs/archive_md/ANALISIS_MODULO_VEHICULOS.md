# Análisis del Módulo de Vehículos

## 📊 Estructura de Datos

### 1. **Modelo Principal: Vehiculo**

#### Campos Administrativos
- `id`: Identificador único del vehículo
- `placa`: Placa del vehículo (identificador visual)
- `empresaActualId`: Empresa propietaria actual
- `resolucionId`: Resolución que autoriza el vehículo
- `tipoServicio`: Tipo de servicio (PASAJEROS, CARGA, MIXTO, etc.)
- `estado`: Estado administrativo (ACTIVO, INACTIVO, MANTENIMIENTO, SUSPENDIDO, FUERA_DE_SERVICIO, DADO_DE_BAJA)
- `estaActivo`: Booleano para activación/desactivación

#### Datos Técnicos (DatosTecnicos)
```typescript
{
  motor: string;
  chasis: string;
  cilindros?: number;
  ejes: number;
  ruedas?: number;
  asientos: number;
  numeroPasajeros?: number;
  pesoNeto: number;
  pesoBruto: number;
  cargaUtil?: number;
  tipoCombustible: string;
  medidas: { largo, ancho, alto };
  cilindrada?: number;
  potencia?: number;
}
```

#### Información Técnica Adicional
- `marca`: Marca del vehículo
- `modelo`: Modelo del vehículo
- `categoria`: Categoría (bus, camión, etc.)
- `carroceria`: Tipo de carrocería
- `anioFabricacion`: Año de fabricación
- `color`: Color del vehículo
- `numeroSerie`: Número de serie
- `vehiculoDataId`: Referencia a datos técnicos puros

#### Rutas
- `rutasAsignadasIds`: Array de IDs de rutas generales (de resoluciones padre)
- `rutasEspecificas`: Array de rutas específicas del vehículo

#### TUC (Tarjeta de Circulación)
- `numeroTuc`: Número de TUC
- `tuc`: Objeto con `nroTuc` y `fechaEmision`

#### Campos de Sustitución
- `placaSustituida`: Placa anterior (en caso de sustitución)
- `placaBaja`: Alias de placaSustituida
- `fechaSustitucion`: Fecha de sustitución
- `motivoSustitucion`: Motivo de la sustitución
- `resolucionSustitucion`: Resolución de sustitución

#### Campos de Baja
- `fechaBaja`: Fecha de baja
- `motivoBaja`: Motivo de la baja
- `observacionesBaja`: Observaciones sobre la baja

#### Metadatos
- `sedeRegistro`: Sede de registro
- `observaciones`: Observaciones generales
- `fechaRegistro`: Fecha de registro
- `fechaActualizacion`: Fecha de última actualización
- `documentosIds`: Array de IDs de documentos
- `historialIds`: Array de IDs de historial

---

## 🎯 Estados del Vehículo

| Estado | Descripción | Habilitado |
|--------|-------------|-----------|
| ACTIVO | Vehículo en operación | ✅ Sí |
| INACTIVO | Vehículo inactivo | ❌ No |
| MANTENIMIENTO | En mantenimiento | ❌ No |
| SUSPENDIDO | Suspendido administrativamente | ❌ No |
| FUERA_DE_SERVICIO | Fuera de servicio | ❌ No |
| DADO_DE_BAJA | Dado de baja | ❌ No |

---

## 📋 Columnas Disponibles en la Tabla

### Columnas Requeridas (No se pueden ocultar)
1. **select** - Selección múltiple
2. **acciones** - Botones de acción

### Columnas Opcionales (Se pueden mostrar/ocultar)
1. **placa** - Placa del vehículo
2. **marca** - Marca/Modelo
3. **empresa** - Empresa propietaria
4. **categoria** - Categoría del vehículo
5. **estado** - Estado administrativo
6. **tipo-servicio** - Tipo de servicio
7. **anio** - Año de fabricación
8. **tuc** - Número de TUC
9. **resolucion** - Resolución
10. **sede-registro** - Sede de registro
11. **color** - Color
12. **numero-serie** - Número de serie
13. **motor** - Motor
14. **chasis** - Chasis
15. **ejes** - Número de ejes
16. **asientos** - Número de asientos
17. **peso-neto** - Peso neto
18. **peso-bruto** - Peso bruto
19. **combustible** - Tipo de combustible
20. **cilindrada** - Cilindrada
21. **potencia** - Potencia
22. **medidas** - Medidas (largo x ancho x alto)
23. **fecha-registro** - Fecha de registro
24. **fecha-actualizacion** - Última actualización
25. **observaciones** - Observaciones
26. **rutas-especificas** - Rutas asignadas

---

## 🔄 Operaciones Principales

### Filtros Disponibles
- **Placa**: Búsqueda por placa
- **Marca**: Búsqueda por marca
- **Empresa**: Filtro por empresa propietaria
- **Estado**: Filtro por estado administrativo
- **Categoría**: Filtro por categoría
- **Mostrar Sin Resolución**: Mostrar solo vehículos sin resolución asignada

### Acciones en Bloque
- **Cambiar Estado**: Cambiar estado de múltiples vehículos
- **Cambiar Tipo de Servicio**: Cambiar tipo de servicio
- **Editar en Bloque**: Editar múltiples campos

### Acciones Individuales
- **Ver Detalle**: Ver información completa del vehículo
- **Editar**: Editar vehículo
- **Ver Historial**: Ver historial de cambios
- **Transferir**: Transferir a otra empresa
- **Solicitar Baja**: Solicitar baja del vehículo
- **Gestionar Rutas**: Asignar/desasignar rutas

---

## 📊 Estadísticas Disponibles

- **Vehículos Activos**: Conteo de vehículos en estado ACTIVO
- **Vehículos por Estado**: Desglose por cada estado
- **Vehículos Filtrados**: Conteo según filtros aplicados
- **Vehículos Seleccionados**: Conteo de vehículos seleccionados

---

## 🔗 Relaciones con Otros Módulos

### Empresas
- Cada vehículo pertenece a una empresa (`empresaActualId`)
- Se puede transferir entre empresas

### Resoluciones
- Cada vehículo puede tener una resolución (`resolucionId`)
- La resolución autoriza el tipo de servicio

### Rutas
- Vehículos pueden tener rutas generales (`rutasAsignadasIds`)
- Vehículos pueden tener rutas específicas (`rutasEspecificas`)

### TUC
- Cada vehículo puede tener un TUC asignado
- El TUC es la tarjeta de circulación

---

## 💾 Persistencia de Preferencias

- **Columnas Visibles**: Se guardan en localStorage
- **Clave**: `vehiculos-columnas-preferences`
- **Contenido**: Array de columnas visibles + timestamp

---

## 🎨 Características de UI

### Paginación
- Tamaño de página configurable (por defecto 25)
- Navegación entre páginas

### Ordenamiento
- Ordenamiento automático por fecha más reciente
- Prioridad: fechaActualizacion > fechaRegistro

### Selección Múltiple
- Seleccionar/deseleccionar individual
- Seleccionar/deseleccionar todos en la página actual
- Contador de seleccionados

### Configuración de Columnas
- Mostrar/ocultar columnas
- Resetear a configuración por defecto
- Guardar preferencias en localStorage

---

## 🚀 Funcionalidades Avanzadas

### Carga Masiva
- Importar vehículos desde Excel
- Validación de datos
- Actualización de datos existentes

### Historial Vehicular
- Ver historial completo de cambios
- Rastrear transferencias entre empresas
- Registrar cambios de estado

### Gestión de Rutas
- Asignar rutas generales
- Asignar rutas específicas
- Gestionar rutas por vehículo

### Solicitud de Baja
- Solicitar baja de vehículos
- Registrar motivo de baja
- Seguimiento de solicitudes

---

## ⚠️ Campos Deprecados (Legacy)

Los siguientes campos están marcados como deprecados y se recomienda usar `vehiculoDataId` en su lugar:
- `vehiculoSoloId`
- `categoria`
- `carroceria`
- `marca`
- `modelo`
- `anioFabricacion`
- `datosTecnicos`
- `color`
- `numeroSerie`

---

## 📈 Volumen de Datos Esperado

- **Columnas**: 26 columnas disponibles
- **Filas**: Depende del volumen de vehículos en la base de datos
- **Paginación**: 25 registros por página (configurable)
- **Filtros**: 6 filtros disponibles

---

## 🔐 Validaciones

- **Placa**: Requerida, única
- **Empresa**: Requerida
- **Tipo de Servicio**: Requerido, un solo valor
- **Estado**: Requerido, valores predefinidos
- **Datos Técnicos**: Validación según tipo de vehículo

