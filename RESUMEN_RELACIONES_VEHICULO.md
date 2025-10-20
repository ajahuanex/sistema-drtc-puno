# 🚗 Resumen Completo de Relaciones del Vehículo

## 📊 Modelo de Datos del Vehículo

### 🔑 **Campos Principales**

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| **id** | String | Identificador único del vehículo | ✅ |
| **placa** | String | Placa del vehículo (formato peruano) | ✅ |
| **categoria** | Enum | Categoría vehicular (M1-M3, N1-N3) | ✅ |
| **marca** | String | Marca del vehículo | ✅ |
| **modelo** | String | Modelo del vehículo | ✅ |
| **anioFabricacion** | Integer | Año de fabricación | ✅ |
| **estado** | Enum | Estado actual del vehículo | ✅ |
| **sedeRegistro** | Enum | Sede donde se registró el vehículo | ✅ |
| **color** | String | Color del vehículo | ❌ |
| **numeroSerie** | String | Número de serie del vehículo | ❌ |
| **observaciones** | String | Observaciones adicionales | ❌ |

### 🔗 **Relaciones Principales**

## 1️⃣ **EMPRESA** (Relación 1:N)
```
Vehículo.empresaActualId → Empresa.id
```
- **Descripción**: Empresa propietaria actual del vehículo
- **Cardinalidad**: Un vehículo pertenece a UNA empresa, una empresa puede tener MUCHOS vehículos
- **Campos relacionados**:
  - `empresaActualId`: ID de la empresa propietaria
- **Operaciones**:
  - Transferencia de vehículos entre empresas
  - Consulta de vehículos por empresa
  - Validación de pertenencia

## 2️⃣ **RESOLUCIÓN** (Relación N:1)
```
Vehículo.resolucionId → Resolucion.id
```
- **Descripción**: Resolución que autoriza la operación del vehículo
- **Cardinalidad**: Un vehículo puede tener UNA resolución, una resolución puede cubrir MUCHOS vehículos
- **Tipos de resolución**:
  - **Primigenia (PADRE)**: Resolución original
  - **Hija (derivada)**: Resolución que deriva de una primigenia
- **Campos relacionados**:
  - `resolucionId`: ID de la resolución asignada
- **Lógica de asignación**:
  - Si existe resolución hija → se asigna la hija
  - Si no existe hija → se asigna la primigenia
  - Puede ser null (vehículo sin resolución)

## 3️⃣ **RUTAS** (Relación N:N)
```
Vehículo.rutasAsignadasIds ↔ Ruta.id
```
- **Descripción**: Rutas autorizadas para operar el vehículo
- **Cardinalidad**: Un vehículo puede operar en MUCHAS rutas, una ruta puede tener MUCHOS vehículos
- **Campos relacionados**:
  - `rutasAsignadasIds`: Array de IDs de rutas asignadas
- **Operaciones**:
  - Asignación de rutas a vehículos
  - Remoción de rutas de vehículos
  - Consulta de vehículos por ruta

## 4️⃣ **TUC (Tarjeta Única de Circulación)** (Relación 1:1)
```
Vehículo.tuc ↔ TUC
```
- **Descripción**: Documento que autoriza la circulación del vehículo
- **Cardinalidad**: Un vehículo puede tener UN TUC, un TUC pertenece a UN vehículo
- **Campos relacionados**:
  - `tuc`: Objeto con datos del TUC (puede ser null)
- **Propiedades del TUC**:
  - Número de TUC
  - Fecha de emisión
  - Fecha de vencimiento
  - Estado de vigencia

## 5️⃣ **DOCUMENTOS** (Relación 1:N)
```
Vehículo.documentosIds → Documento.id
```
- **Descripción**: Documentos asociados al vehículo
- **Cardinalidad**: Un vehículo puede tener MUCHOS documentos
- **Campos relacionados**:
  - `documentosIds`: Array de IDs de documentos
- **Tipos de documentos**:
  - Tarjeta de propiedad
  - SOAT
  - Revisión técnica
  - Certificados diversos

## 6️⃣ **HISTORIAL** (Relación 1:N)
```
Vehículo.historialIds → HistorialVehiculo.id
```
- **Descripción**: Registro histórico de cambios y eventos del vehículo
- **Cardinalidad**: Un vehículo puede tener MUCHOS registros de historial
- **Campos relacionados**:
  - `historialIds`: Array de IDs de registros históricos
- **Eventos registrados**:
  - Cambios de empresa
  - Cambios de estado
  - Asignación/remoción de rutas
  - Mantenimientos
  - Infracciones

## 7️⃣ **SEDE DE REGISTRO** (Relación N:1)
```
Vehículo.sedeRegistro → Sede
```
- **Descripción**: Sede administrativa donde se registró el vehículo
- **Cardinalidad**: Un vehículo se registra en UNA sede, una sede puede registrar MUCHOS vehículos
- **Sedes disponibles**:
  - PUNO (por defecto)
  - AREQUIPA
  - JULIACA
  - CUSCO
  - TACNA
  - MOQUEGUA
  - LIMA
  - ICA
  - HUANCAYO
  - TRUJILLO
  - CHICLAYO
  - PIURA

### 🔧 **Datos Técnicos** (Relación 1:1 embebida)

## 8️⃣ **DATOS TÉCNICOS**
```
Vehículo.datosTecnicos (objeto embebido)
```
- **Descripción**: Especificaciones técnicas del vehículo
- **Campos incluidos**:
  - `motor`: Especificación del motor
  - `chasis`: Número de chasis
  - `ejes`: Número de ejes
  - `asientos`: Capacidad de asientos
  - `pesoNeto`: Peso neto en kg
  - `pesoBruto`: Peso bruto en kg
  - `medidas`: Dimensiones (largo, ancho, alto)
  - `tipoCombustible`: Tipo de combustible (DIESEL, GASOLINA, etc.)
  - `cilindrada`: Cilindrada del motor (opcional)
  - `potencia`: Potencia en HP (opcional)

### 📊 **Enumeraciones y Estados**

## 9️⃣ **CATEGORÍAS VEHICULARES**
```
enum CategoriaVehiculo {
  M1 = "Vehículos de pasajeros hasta 8 asientos"
  M2 = "Vehículos de pasajeros de 9 a 16 asientos"  
  M3 = "Vehículos de pasajeros de más de 16 asientos"
  N1 = "Vehículos de carga hasta 3.5 toneladas"
  N2 = "Vehículos de carga de 3.5 a 12 toneladas"
  N3 = "Vehículos de carga de más de 12 toneladas"
}
```

## 🔟 **ESTADOS DEL VEHÍCULO**
```
enum EstadoVehiculo {
  ACTIVO = "Vehículo operativo"
  INACTIVO = "Vehículo no operativo"
  EN_MANTENIMIENTO = "En proceso de mantenimiento"
  FUERA_DE_SERVICIO = "Fuera de servicio temporal"
  DADO_DE_BAJA = "Vehículo dado de baja definitiva"
}
```

## 1️⃣1️⃣ **TIPOS DE COMBUSTIBLE**
```
enum TipoCombustible {
  GASOLINA = "Gasolina"
  DIESEL = "Diésel"
  GAS_NATURAL = "Gas Natural Vehicular"
  ELECTRICO = "Eléctrico"
  HIBRIDO = "Híbrido"
}
```

## 1️⃣2️⃣ **SEDES DE REGISTRO**
```
enum SedeRegistro {
  LIMA, AREQUIPA, JULIACA, PUNO, CUSCO, TACNA,
  MOQUEGUA, ICA, HUANCAYO, TRUJILLO, CHICLAYO, PIURA
}
```

### 🔄 **Flujos de Negocio**

## 📋 **Proceso de Registro de Vehículo**
1. **Validación de datos básicos** (placa, empresa, categoría)
2. **Asignación de sede de registro** (por defecto PUNO)
3. **Validación de resoluciones** (primigenia/hija)
4. **Asignación de rutas** (opcional)
5. **Registro de datos técnicos**
6. **Generación de historial inicial**

## 🔄 **Proceso de Transferencia**
1. **Validación de empresa destino**
2. **Actualización de `empresaActualId`**
3. **Registro en historial**
4. **Notificación a partes involucradas**

## 📝 **Proceso de Asignación de Rutas**
1. **Validación de rutas existentes**
2. **Verificación de compatibilidad con resolución**
3. **Actualización de `rutasAsignadasIds`**
4. **Registro en historial**

## 🎯 **Proceso de Cambio de Estado**
1. **Validación de transición de estado**
2. **Actualización de `estado`**
3. **Registro en historial con motivo**
4. **Notificaciones automáticas**

### 📈 **Consultas y Reportes Comunes**

## 🔍 **Consultas por Relación**
- **Por Empresa**: `vehiculos.filter(v => v.empresaActualId === empresaId)`
- **Por Resolución**: `vehiculos.filter(v => v.resolucionId === resolucionId)`
- **Por Ruta**: `vehiculos.filter(v => v.rutasAsignadasIds.includes(rutaId))`
- **Por Sede**: `vehiculos.filter(v => v.sedeRegistro === sede)`
- **Por Estado**: `vehiculos.filter(v => v.estado === estado)`
- **Por Categoría**: `vehiculos.filter(v => v.categoria === categoria)`

## 📊 **Estadísticas Disponibles**
- Total de vehículos por empresa
- Distribución por categoría vehicular
- Vehículos por sede de registro
- Estados de vehículos (activos, inactivos, etc.)
- Vehículos con/sin TUC vigente
- Vehículos con/sin resolución asignada
- Promedio de vehículos por empresa

### 🔐 **Validaciones y Restricciones**

## ✅ **Validaciones de Integridad**
- **Placa única**: No pueden existir dos vehículos con la misma placa
- **Empresa válida**: La empresa debe existir y estar activa
- **Resolución válida**: Si se asigna, la resolución debe existir y estar vigente
- **Rutas válidas**: Todas las rutas asignadas deben existir
- **Sede válida**: La sede debe estar en el enum de sedes disponibles
- **Categoría válida**: Debe corresponder a una categoría vehicular oficial

## 🚫 **Restricciones de Negocio**
- Un vehículo no puede estar en estado DADO_DE_BAJA y tener rutas asignadas
- Un vehículo FUERA_DE_SERVICIO no puede operar rutas
- La transferencia entre empresas requiere que ambas estén activas
- La asignación de resolución hija requiere resolución primigenia

### 🎯 **Casos de Uso Principales**

## 1️⃣ **Registro Masivo desde Excel**
- Validación de formato de archivo
- Verificación de datos por fila
- Creación en lote con manejo de errores
- Reporte de resultados detallado

## 2️⃣ **Gestión de Flota por Empresa**
- Consulta de vehículos por empresa
- Transferencias entre empresas
- Asignación masiva de rutas
- Reportes de estado de flota

## 3️⃣ **Control de Resoluciones**
- Asignación de resoluciones a vehículos
- Seguimiento de vehículos por resolución
- Validación de vigencia de resoluciones
- Reportes de cumplimiento

## 4️⃣ **Administración de Rutas**
- Asignación de vehículos a rutas
- Control de capacidad por ruta
- Optimización de asignaciones
- Reportes de cobertura

---

## 🎯 **Resumen de Relaciones**

El modelo de **Vehículo** es el núcleo del sistema de transporte, con **12 tipos de relaciones principales**:

1. **Empresa** (1:N) - Propiedad actual
2. **Resolución** (N:1) - Autorización de operación  
3. **Rutas** (N:N) - Rutas autorizadas
4. **TUC** (1:1) - Documento de circulación
5. **Documentos** (1:N) - Documentación asociada
6. **Historial** (1:N) - Registro de cambios
7. **Sede de Registro** (N:1) - Sede administrativa
8. **Datos Técnicos** (1:1) - Especificaciones técnicas
9. **Categoría** (enum) - Clasificación vehicular
10. **Estado** (enum) - Estado operativo
11. **Combustible** (enum) - Tipo de combustible
12. **Sede** (enum) - Sede de registro

Esta estructura permite un **control integral** del parque vehicular con **trazabilidad completa**, **validaciones robustas** y **flexibilidad operativa** para todos los procesos del sistema de transporte.