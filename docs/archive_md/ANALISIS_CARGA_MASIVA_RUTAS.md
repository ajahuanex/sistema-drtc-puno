# Análisis del Componente: Carga Masiva de Rutas

## 📋 Descripción General

El componente `CargaMasivaRutasComponent` es un asistente paso a paso para importar múltiples rutas desde archivos Excel. Utiliza un stepper de Material Design con 4 pasos principales.

---

## 🎯 Pasos del Proceso

### Paso 1: Descargar Plantilla
- **Objetivo**: Obtener la plantilla Excel oficial
- **Acciones**:
  - Descargar plantilla con validaciones automáticas
  - Información sobre manejo de localidades
  - Las localidades nuevas se crean automáticamente como tipo "OTROS"

### Paso 2: Subir Archivo
- **Objetivo**: Seleccionar el archivo Excel a procesar
- **Características**:
  - Zona de arrastrar y soltar (drag & drop)
  - Soporte para archivos .xlsx y .xls
  - Visualización del nombre y tamaño del archivo
  - Opción para cambiar archivo

### Paso 3: Configurar y Procesar
- **Objetivo**: Configurar opciones de procesamiento
- **Opciones Disponibles**:
  - **Modo de Validación**:
    - Solo validar (recomendado primero)
    - Validar y procesar
  
  - **Modo de Procesamiento** (cuando no es solo validación):
    - Solo Crear: Crear solo rutas nuevas (error si existe)
    - Crear o Actualizar (UPSERT): Crear si no existe, actualizar si existe
  
  - **Procesamiento en Lotes**:
    - Procesar en lotes para archivos grandes
    - Tamaños disponibles: 25, 50, 100 rutas por lote
    - Indicador de progreso por lote

### Paso 4: Resultados
- **Objetivo**: Mostrar resultados del procesamiento
- **Información Mostrada**:
  - Resumen de estadísticas
  - Rutas creadas exitosamente
  - Rutas actualizadas (en modo UPSERT)
  - Errores encontrados
  - Advertencias
  - Acciones finales

---

## 📊 Estadísticas Disponibles

### Validación
- `total_filas`: Total de filas en el archivo
- `validos`: Filas válidas
- `invalidos`: Filas inválidas
- `con_advertencias`: Filas con advertencias

### Procesamiento
- `total_procesadas`: Total de rutas procesadas
- `exitosas`: Rutas procesadas exitosamente
- `fallidas`: Rutas que fallaron
- `total_creadas`: Total de rutas creadas

---

## 🔄 Modo UPSERT (Crear o Actualizar)

### Identificación Única de Rutas
Las rutas se identifican por: **RUC + Resolución + Código**

Ejemplo: `20448048242 + R-0921-2023 + 01`

### Comportamiento
- Si la ruta existe: Se actualiza con los nuevos datos
- Si la ruta no existe: Se crea una nueva
- Se registran los cambios realizados

---

## 📍 Manejo de Localidades

### Localidades Existentes
- Se vinculan automáticamente con la base de datos principal
- No requieren validación adicional

### Localidades Nuevas
- Se crean automáticamente como tipo "OTROS"
- Se asignan al nivel "OTROS"
- No generan errores de validación

---

## 📈 Procesamiento en Lotes

### Configuración
- **Tamaño del Lote**: 25, 50 o 100 rutas
- **Recomendación**: 50 rutas por lote (balance entre velocidad y seguridad)

### Ventajas
- Mayor estabilidad para archivos grandes
- Mejor manejo de memoria
- Indicador de progreso visual
- Recuperación ante fallos parciales

### Indicador de Progreso
- Muestra lote actual vs total de lotes
- Porcentaje de completitud
- Descripción del proceso

---

## 🎨 Interfaz de Usuario

### Componentes Material Design
- `MatStepper`: Navegación paso a paso
- `MatCard`: Contenedores de contenido
- `MatRadioButton`: Selección de opciones
- `MatSlideToggle`: Activar/desactivar opciones
- `MatSelect`: Selección de tamaño de lote
- `MatTable`: Visualización de resultados
- `MatChips`: Indicadores de estado
- `MatProgressBar`: Indicador de progreso

### Zonas Interactivas
- Zona de arrastrar y soltar para archivos
- Botones de acción contextuales
- Tablas con scroll horizontal
- Indicadores de estado con colores

---

## 📋 Estructura de Resultados

### Rutas Creadas
```typescript
{
  codigo: string;
  codigo_ruta: string;
  nombre: string;
  id: string;
  tipo_ruta?: string;
  estado?: string;
}
```

### Rutas Actualizadas
```typescript
{
  codigo: string;
  nombre: string;
  cambios: string[];
  estado: string;
}
```

### Errores
```typescript
{
  fila?: number;
  codigo_ruta?: string;
  error?: string;
  errores?: string[];
}
```

### Advertencias
```typescript
{
  fila?: number;
  codigo_ruta?: string;
  advertencias?: string[];
}
```

---

## 🔧 Métodos Principales

### Carga de Archivo
- `onFileSelected(event)`: Procesar archivo seleccionado
- `onDragOver(event)`: Manejar arrastrar sobre zona
- `onDragLeave(event)`: Manejar salida de zona
- `onDrop(event)`: Procesar archivo soltado
- `limpiarArchivo()`: Limpiar archivo seleccionado

### Procesamiento
- `procesarArchivo()`: Iniciar validación o procesamiento
- `procesarEnLotes()`: Procesar en lotes
- `procesarDespuesDeValidar()`: Procesar después de validación

### Resultados
- `getEstadistica(tipo)`: Obtener estadística específica
- `getRutasCreadas()`: Obtener rutas creadas
- `getRutasActualizadas()`: Obtener rutas actualizadas
- `getErrores()`: Obtener errores
- `getAdvertencias()`: Obtener advertencias

### Navegación
- `irAListaRutas()`: Navegar a lista de rutas
- `reiniciarProceso()`: Reiniciar el proceso

---

## 💾 Persistencia

### LocalStorage
- Preferencias de configuración
- Historial de archivos procesados
- Configuración de lotes

---

## 🚀 Flujo de Uso Típico

1. **Descargar Plantilla**: Usuario descarga la plantilla Excel
2. **Preparar Datos**: Usuario completa la plantilla con datos de rutas
3. **Subir Archivo**: Usuario sube el archivo Excel
4. **Validar**: Usuario valida el archivo primero
5. **Revisar Errores**: Usuario revisa errores y advertencias
6. **Procesar**: Usuario procesa las rutas válidas
7. **Revisar Resultados**: Usuario revisa rutas creadas/actualizadas
8. **Finalizar**: Usuario navega a la lista de rutas o inicia nuevo proceso

---

## ⚠️ Validaciones

### Archivo
- Formato: .xlsx o .xls
- Tamaño: Sin límite especificado
- Contenido: Debe cumplir estructura de plantilla

### Rutas
- RUC: Requerido, 11 dígitos
- Resolución: Requerida
- Código: Requerido
- Nombre: Requerido
- Localidades: Validadas o creadas automáticamente

---

## 🎯 Casos de Uso

### Caso 1: Importación Inicial
- Modo: Solo Crear
- Validación: Primero validar, luego procesar
- Resultado: Todas las rutas se crean nuevas

### Caso 2: Actualización de Datos
- Modo: UPSERT
- Validación: Validar y procesar
- Resultado: Rutas nuevas se crean, existentes se actualizan

### Caso 3: Archivo Grande
- Procesamiento: En lotes
- Tamaño: 50 rutas por lote
- Resultado: Procesamiento estable y monitoreable

---

## 📱 Responsividad

- Diseño adaptable a diferentes tamaños de pantalla
- Tablas con scroll horizontal en pantallas pequeñas
- Botones y controles accesibles en móvil

