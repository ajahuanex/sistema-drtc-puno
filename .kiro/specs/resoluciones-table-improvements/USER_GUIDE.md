# Guía de Usuario - Tabla de Resoluciones

## 📖 Introducción

Esta guía te ayudará a utilizar todas las funcionalidades avanzadas de la tabla de gestión de resoluciones, incluyendo filtros, ordenamiento, personalización de columnas y exportación de datos.

## 🎯 Acceso al Módulo

1. Inicia sesión en el sistema DRTC Puno
2. En el menú lateral, haz clic en **"Resoluciones"**
3. Verás la tabla principal de resoluciones

## 🔍 Filtrado de Resoluciones

### Abrir Panel de Filtros

1. Haz clic en el panel **"Filtros Avanzados"** en la parte superior
2. El panel se expandirá mostrando todos los filtros disponibles

### Filtrar por Número de Resolución

1. En el campo **"Número de Resolución"**, escribe el número que buscas
2. Puedes escribir solo una parte del número (ej: "0001")
3. Los resultados se actualizarán automáticamente

**Ejemplo**: 
- Buscar "R-0001" mostrará todas las resoluciones que contengan "0001"

### Filtrar por Empresa

1. Haz clic en el campo **"Empresa"**
2. Comienza a escribir el RUC, razón social o código de empresa
3. Selecciona la empresa de la lista desplegable
4. La tabla mostrará solo las resoluciones de esa empresa

**Tip**: Puedes buscar por:
- RUC: "20123456789"
- Razón Social: "Transportes ABC"
- Código: "0123PRT"

### Filtrar por Tipo de Trámite

1. Haz clic en el campo **"Tipo de Trámite"**
2. Selecciona uno o varios tipos de trámite
3. Puedes seleccionar múltiples opciones

**Tipos disponibles**:
- PRIMIGENIA
- RENOVACION
- INCREMENTO_FLOTA
- SUSTITUCION_VEHICULOS
- MODIFICACION
- OTROS

### Filtrar por Estado

1. Haz clic en el campo **"Estado"**
2. Selecciona uno o varios estados
3. Puedes seleccionar múltiples opciones

**Estados disponibles**:
- APROBADA
- EN_PROCESO
- RECHAZADA
- ANULADA
- PENDIENTE

### Filtrar por Rango de Fechas

1. Haz clic en el campo **"Rango de Fechas"**
2. Selecciona la fecha de inicio en el calendario
3. Selecciona la fecha de fin en el calendario
4. La tabla mostrará solo las resoluciones dentro del rango

**Tip**: Puedes dejar una fecha vacía para filtrar desde el inicio o hasta el final.

### Combinar Múltiples Filtros

Puedes aplicar varios filtros al mismo tiempo:

**Ejemplo**:
- Empresa: "Transportes ABC"
- Tipo: "PRIMIGENIA"
- Estado: "APROBADA"
- Fechas: Del 01/01/2025 al 31/12/2025

Esto mostrará solo las resoluciones primigenias aprobadas de Transportes ABC en 2025.

### Ver Filtros Activos

Los filtros aplicados se muestran como **chips** debajo del panel de filtros:

```
[Número: R-0001 ✕] [Empresa: Transportes ABC ✕] [Tipo: PRIMIGENIA ✕]
```

### Remover Filtros

**Remover un filtro individual**:
- Haz clic en la **✕** del chip del filtro que deseas remover

**Remover todos los filtros**:
- Haz clic en el botón **"Limpiar Todo"**

## 📊 Personalización de Columnas

### Abrir Selector de Columnas

1. En la esquina superior derecha de la tabla, haz clic en el icono de columnas (⋮)
2. Se abrirá un menú con todas las columnas disponibles

### Mostrar/Ocultar Columnas

1. En el menú de columnas, marca o desmarca las columnas que deseas ver
2. Las columnas se actualizarán inmediatamente en la tabla

**Columnas disponibles**:
- ✓ Número (obligatoria)
- ☐ Fecha de Emisión
- ☐ Empresa
- ☐ Tipo de Trámite
- ☐ Estado
- ☐ Expediente
- ✓ Acciones (obligatoria)

**Nota**: Las columnas marcadas con ✓ son obligatorias y no se pueden ocultar.

### Reordenar Columnas

1. En el menú de columnas, arrastra las columnas para cambiar su orden
2. El orden se actualizará inmediatamente en la tabla

**Ejemplo**:
- Arrastra "Empresa" antes de "Fecha" para verla primero

### Restaurar Configuración por Defecto

1. En el menú de columnas, haz clic en **"Restaurar por Defecto"**
2. Todas las columnas volverán a su configuración original

## 🔄 Ordenamiento de Datos

### Ordenar por una Columna

1. Haz clic en el **encabezado** de la columna que deseas ordenar
2. La primera vez ordenará de forma **ascendente** (↑)
3. La segunda vez ordenará de forma **descendente** (↓)
4. La tercera vez quitará el ordenamiento

**Indicadores visuales**:
- ↑ = Orden ascendente (A-Z, 0-9, más antiguo primero)
- ↓ = Orden descendente (Z-A, 9-0, más reciente primero)
- Sin flecha = Sin ordenamiento

### Ordenar por Múltiples Columnas

1. Mantén presionada la tecla **Ctrl** (Windows) o **Cmd** (Mac)
2. Haz clic en los encabezados de las columnas que deseas ordenar
3. Los números junto a las flechas indican la prioridad

**Ejemplo**:
- Fecha ↓¹ (primero por fecha descendente)
- Número ↑² (luego por número ascendente)

### Limpiar Ordenamiento

1. Haz clic en el encabezado de la columna ordenada hasta que desaparezca la flecha
2. O aplica un nuevo ordenamiento

## 📄 Paginación

### Navegar entre Páginas

**Controles de paginación** (parte inferior de la tabla):
- **◀** = Página anterior
- **▶** = Página siguiente
- **◀◀** = Primera página
- **▶▶** = Última página

### Cambiar Tamaño de Página

1. En el selector de tamaño de página, elige cuántos registros ver
2. Opciones: 10, 25, 50, 100

**Ejemplo**:
- Selecciona "50" para ver 50 resoluciones por página

### Información de Paginación

En la parte inferior verás:
```
Mostrando 1-10 de 45 resoluciones
```

Esto indica:
- Registros actuales: 1-10
- Total de registros: 45

## 📤 Exportación de Datos

### Exportar a Excel

1. Haz clic en el botón **"Exportar"** en la parte superior derecha
2. Selecciona **"Excel"** del menú
3. El archivo se descargará automáticamente

**Contenido del archivo**:
- Todas las columnas visibles
- Solo los registros filtrados
- Respeta el ordenamiento aplicado

**Nombre del archivo**: `resoluciones_YYYY-MM-DD.xlsx`

### Exportar a PDF

1. Haz clic en el botón **"Exportar"** en la parte superior derecha
2. Selecciona **"PDF"** del menú
3. El archivo se descargará automáticamente

**Contenido del archivo**:
- Todas las columnas visibles
- Solo los registros filtrados
- Formato profesional con encabezados

**Nombre del archivo**: `resoluciones_YYYY-MM-DD.pdf`

### Exportar con Filtros

**Importante**: La exportación respeta los filtros aplicados.

**Ejemplo**:
1. Filtra por empresa "Transportes ABC"
2. Filtra por estado "APROBADA"
3. Exporta a Excel
4. El archivo contendrá solo las resoluciones aprobadas de Transportes ABC

## 🎯 Acciones sobre Resoluciones

### Ver Detalle

1. En la columna **"Acciones"**, haz clic en el icono de ojo (👁)
2. Se abrirá una vista detallada de la resolución

### Editar Resolución

1. En la columna **"Acciones"**, haz clic en el icono de editar (✏)
2. Se abrirá el formulario de edición
3. Modifica los campos necesarios
4. Haz clic en **"Guardar"**

**Nota**: Solo puedes editar resoluciones en estado "EN_PROCESO" o "PENDIENTE".

### Eliminar Resolución

1. En la columna **"Acciones"**, haz clic en el icono de eliminar (🗑)
2. Confirma la eliminación en el diálogo
3. La resolución se eliminará permanentemente

**Advertencia**: Esta acción no se puede deshacer.

## 📱 Uso en Dispositivos Móviles

### Vista de Cards (Móviles)

En dispositivos móviles, la tabla se convierte en **cards** para mejor visualización:

```
┌─────────────────────────┐
│ R-0001-2025            │
│ Transportes ABC        │
│ PRIMIGENIA             │
│ APROBADA               │
│ [Ver] [Editar]         │
└─────────────────────────┘
```

### Filtros en Móviles

1. Los filtros se abren en un **modal** de pantalla completa
2. Aplica los filtros necesarios
3. Haz clic en **"Aplicar"** para cerrar el modal

### Ordenamiento en Móviles

1. Toca el icono de ordenamiento (⇅) en la parte superior
2. Selecciona la columna y dirección
3. Toca **"Aplicar"**

## ⌨️ Atajos de Teclado

### Navegación

- **Tab**: Navegar entre campos
- **Shift + Tab**: Navegar hacia atrás
- **Enter**: Activar botón o selección
- **Escape**: Cerrar menús o modales

### Filtros

- **Ctrl + F**: Enfocar campo de búsqueda
- **Ctrl + L**: Limpiar todos los filtros

### Tabla

- **↑ ↓**: Navegar entre filas
- **Enter**: Ver detalle de fila seleccionada
- **Ctrl + E**: Exportar a Excel
- **Ctrl + P**: Exportar a PDF

## 💡 Consejos y Trucos

### Búsqueda Rápida

Para encontrar una resolución específica rápidamente:
1. Usa el filtro de número de resolución
2. Escribe solo los últimos dígitos (ej: "0001")
3. Los resultados se filtrarán automáticamente

### Filtros Frecuentes

Guarda tus filtros más usados:
1. Aplica los filtros deseados
2. La configuración se guarda automáticamente
3. La próxima vez que entres, los filtros estarán aplicados

### Columnas Personalizadas

Personaliza las columnas según tu trabajo:
- **Administrativo**: Número, Fecha, Empresa, Estado
- **Técnico**: Número, Tipo, Expediente, Acciones
- **Gerencial**: Empresa, Tipo, Estado, Fecha

### Exportación Eficiente

Para exportar datos específicos:
1. Aplica los filtros necesarios
2. Ordena los datos como los necesitas
3. Oculta las columnas que no necesitas
4. Exporta a Excel o PDF

### Ordenamiento Inteligente

Para análisis de datos:
1. Ordena por fecha (descendente) para ver lo más reciente
2. Luego ordena por estado para agrupar por estado
3. Usa Ctrl + Click para ordenamiento múltiple

## ❓ Preguntas Frecuentes

### ¿Por qué no veo algunas resoluciones?

**Respuesta**: Verifica que no tengas filtros activos. Haz clic en "Limpiar Todo" para ver todas las resoluciones.

### ¿Cómo busco por empresa?

**Respuesta**: Usa el filtro de empresa y escribe el RUC, razón social o código de empresa.

### ¿Se guardan mis preferencias?

**Respuesta**: Sí, la configuración de columnas y filtros se guarda automáticamente en tu navegador.

### ¿Puedo exportar todas las resoluciones?

**Respuesta**: Sí, limpia todos los filtros y luego exporta. Se exportarán todas las resoluciones.

### ¿Qué significa el número junto a la flecha de ordenamiento?

**Respuesta**: Indica la prioridad cuando ordenas por múltiples columnas. 1 es la prioridad más alta.

### ¿Puedo ordenar por empresa?

**Respuesta**: Sí, haz clic en el encabezado "Empresa". Se ordenará alfabéticamente por razón social.

### ¿Cómo veo más resoluciones por página?

**Respuesta**: En el selector de tamaño de página (parte inferior), selecciona 50 o 100.

### ¿Los filtros afectan la exportación?

**Respuesta**: Sí, solo se exportan las resoluciones que cumplen con los filtros aplicados.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. **Ayuda en línea**: Haz clic en el icono de ayuda (?) en la esquina superior derecha
2. **Soporte técnico**: Contacta al equipo de TI de DRTC Puno
3. **Documentación**: Consulta la documentación completa en el sistema

## 📚 Recursos Adicionales

- [Manual Completo del Sistema](../README.md)
- [Guía de Expedientes](../expedientes/USER_GUIDE.md)
- [Guía de Empresas](../empresas/USER_GUIDE.md)
- [Preguntas Frecuentes](../FAQ.md)

---

**Última actualización**: Noviembre 2025  
**Versión**: 1.0.0
