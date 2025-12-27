# 📚 MANUAL DE USUARIO COMPLETO
## Sistema de Gestión DRTC Puno

**Versión:** 2.0  
**Fecha:** 26 de Diciembre, 2024  
**Estado:** Sistema Completamente Funcional

---

## 📋 ÍNDICE

1. [Introducción al Sistema](#introducción-al-sistema)
2. [Acceso y Autenticación](#acceso-y-autenticación)
3. [Navegación General](#navegación-general)
4. [Módulos del Sistema](#módulos-del-sistema)
5. [Funcionalidades Avanzadas](#funcionalidades-avanzadas)
6. [Solución de Problemas](#solución-de-problemas)
7. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## 🎯 INTRODUCCIÓN AL SISTEMA

### ¿Qué es el Sistema DRTC Puno?

El Sistema de Gestión DRTC Puno es una plataforma integral diseñada para la **Dirección Regional de Transportes y Comunicaciones de Puno**. Permite gestionar de manera eficiente:

- **Empresas de transporte** y su documentación
- **Vehículos** y sus autorizaciones (TUCs)
- **Conductores** y licencias
- **Rutas** autorizadas
- **Resoluciones** administrativas
- **Expedientes** y trámites
- **Fiscalizaciones** y control

### Características Principales

✅ **Interfaz moderna** - Diseño intuitivo y responsive  
✅ **Datos en tiempo real** - Información actualizada constantemente  
✅ **Búsqueda inteligente** - Filtros avanzados en todos los módulos  
✅ **Gestión completa** - CRUD completo para todas las entidades  
✅ **Reportes** - Exportación y análisis de datos  
✅ **Seguridad** - Autenticación y control de acceso

---

## 🔐 ACCESO Y AUTENTICACIÓN

### Requisitos del Sistema

**Navegadores Compatibles:**
- Google Chrome (recomendado)
- Mozilla Firefox
- Microsoft Edge
- Safari

**Resolución Mínima:** 1024x768 px  
**Conexión:** Internet estable

### Credenciales de Acceso

**Para Administradores:**
```
DNI: 12345678
Contraseña: admin123
Rol: Administrador
```

### Proceso de Login

1. **Abrir el navegador** y dirigirse a: `http://localhost:4200`
2. **Ingresar credenciales** en los campos correspondientes
3. **Hacer clic** en "Iniciar Sesión"
4. **Verificar acceso** - Serás redirigido al Dashboard principal

### Recuperación de Contraseña

Si olvidas tu contraseña:
1. Contactar al administrador del sistema
2. Proporcionar tu DNI y datos de identificación
3. El administrador generará una nueva contraseña temporal

---

## 🧭 NAVEGACIÓN GENERAL

### Estructura de la Interfaz

El sistema cuenta con una **barra lateral izquierda** que contiene todos los módulos organizados por categorías:

#### 📊 **Gestión Principal**
- **Dashboard** - Vista general del sistema
- **Empresas** - Gestión de empresas de transporte
- **Vehículos** - Control de flota vehicular
- **Conductores** - Gestión de personal conductor
- **TUCs** - Tarjetas Únicas de Circulación

#### 🚀 **Operaciones**
- **Fiscalizaciones** - Control y supervisión
- **Rutas** - Gestión de rutas autorizadas
- **Resoluciones** - Documentos administrativos
- **Expedientes** - Trámites y procesos
- **Mesa de Partes** - Recepción de documentos

#### 🏢 **Gestión de Oficinas**
- **Oficinas** - Administración de sedes
- **Flujo de Expedientes** - Seguimiento de trámites

#### 📈 **Reportes**
- **Reportes** - Análisis y exportación de datos

#### ⚙️ **Sistema**
- **Configuración** - Ajustes del sistema
- **Perfil** - Datos del usuario
- **Ayuda** - Documentación y soporte

### Navegación Básica

**Expandir/Contraer Menú:** Clic en el ícono de hamburguesa  
**Ir a un módulo:** Clic en el elemento del menú  
**Volver atrás:** Usar el botón "Volver" o navegador  
**Cerrar sesión:** Menú de perfil → "Cerrar Sesión"
---

## 🏢 MÓDULOS DEL SISTEMA

### 1. 📊 DASHBOARD

**Propósito:** Vista general del estado del sistema con métricas clave.

**Funcionalidades:**
- **Estadísticas generales** - Totales de empresas, vehículos, resoluciones
- **Gráficos dinámicos** - Visualización de datos en tiempo real
- **Alertas importantes** - Notificaciones de vencimientos y pendientes
- **Accesos rápidos** - Enlaces directos a funciones frecuentes

**Cómo usar:**
1. Al iniciar sesión, serás dirigido automáticamente al Dashboard
2. Revisa las métricas principales en las tarjetas superiores
3. Utiliza los gráficos para análisis visual
4. Haz clic en "Ver más" para acceder a módulos específicos

---

### 2. 🏢 GESTIÓN DE EMPRESAS

**Propósito:** Administrar empresas de transporte y su información completa.

#### Funcionalidades Principales

**✅ Crear Nueva Empresa**
1. Clic en "Nueva Empresa" (botón azul con ícono +)
2. Completar formulario con datos obligatorios:
   - **RUC** (11 dígitos)
   - **Razón Social**
   - **Dirección Fiscal**
   - **Representante Legal** (DNI, nombres, apellidos)
3. Agregar información opcional:
   - Email de contacto
   - Teléfono
   - Sitio web
4. Clic en "Guardar Empresa"

**✅ Buscar y Filtrar Empresas**
- **Búsqueda rápida:** Campo superior para buscar por RUC o razón social
- **Filtros avanzados:** Estado, tipo de empresa, fecha de registro
- **Ordenamiento:** Por nombre, fecha, estado

**✅ Ver Detalles de Empresa**
1. Clic en "Ver Detalles" en cualquier empresa de la lista
2. **Pestaña "Información General":**
   - Datos básicos de la empresa
   - Información del representante legal
   - Datos de contacto
   - Código de empresa (formato XXXXYYY)

3. **Pestaña "Gestión":**
   - **Resoluciones:** Crear y gestionar resoluciones (muestra cantidad actual)
   - **Vehículos:** Agregar y administrar flota (muestra **conteo correcto**)
   - **Conductores:** Gestionar personal conductor
   - **Rutas:** Administrar rutas autorizadas

4. **Pestaña "Documentos":**
   - Documentos legales de la empresa
   - Estados de vigencia
   - Fechas de vencimiento

**✅ Editar Empresa**
1. En los detalles de la empresa, clic en "Editar"
2. Modificar los campos necesarios
3. Guardar cambios

**✅ Gestión Avanzada**
- **Historial de Transferencias:** Ver movimientos de vehículos entre empresas
- **Bajas Vehiculares:** Gestionar vehículos dados de baja
- **Estadísticas:** Métricas específicas por empresa

#### Características Especiales

**🔍 Código de Empresa Visual**
- Formato: **XXXXYYY** (4 números + 3 letras)
- Ejemplo: **0123PRT**
- Colores por tipo:
  - **Verde:** Personas (P)
  - **Azul:** Regional (R)  
  - **Naranja:** Turismo (T)

**📊 Conteo Correcto de Vehículos**
- El sistema ahora muestra el **número real** de vehículos por empresa
- Suma vehículos de **todas las resoluciones** de la empresa
- Evita duplicados automáticamente

---

### 3. 🚗 GESTIÓN DE VEHÍCULOS

**Propósito:** Control completo de la flota vehicular autorizada.

#### Funcionalidades Principales

**✅ Registrar Nuevo Vehículo**
1. Clic en "Nuevo Vehículo"
2. Completar datos del vehículo:
   - **Placa** (formato XXX-123 o similar)
   - **Marca y Modelo**
   - **Año de fabricación**
   - **Número de motor**
   - **Número de chasis**
   - **Color**
   - **Capacidad de pasajeros**
3. Asociar a empresa y resolución
4. Subir documentos requeridos
5. Guardar registro

**✅ Búsqueda y Filtros**
- **Por placa:** Búsqueda exacta o parcial
- **Por empresa:** Filtrar vehículos de una empresa específica
- **Por estado:** Activo, suspendido, dado de baja
- **Por resolución:** Vehículos de una resolución específica

**✅ Gestión de TUCs**
- **Generar TUC:** Para vehículos autorizados
- **Renovar TUC:** Proceso de renovación
- **Consultar estado:** Verificar vigencia
- **Imprimir:** Generar documento físico

**✅ Estados del Vehículo**
- **🟢 Activo:** Operando normalmente
- **🟡 Suspendido:** Temporalmente inhabilitado
- **🔴 Dado de Baja:** Retirado del servicio
- **⚪ En Trámite:** Proceso de autorización pendiente

#### Operaciones Especiales

**🔄 Transferencia de Vehículos**
1. Seleccionar vehículo a transferir
2. Elegir empresa destino
3. Completar documentación
4. Confirmar transferencia

**📋 Carga Masiva**
1. Descargar plantilla Excel
2. Completar datos de múltiples vehículos
3. Subir archivo
4. Revisar y confirmar importación

---

### 4. 👥 GESTIÓN DE CONDUCTORES

**Propósito:** Administrar personal conductor autorizado.

#### Funcionalidades Principales

**✅ Registrar Conductor**
1. Datos personales (DNI, nombres, apellidos)
2. Información de licencia de conducir
3. Categorías autorizadas
4. Fecha de vencimiento
5. Asociación con empresa

**✅ Control de Licencias**
- **Verificar vigencia:** Alertas de vencimiento
- **Renovaciones:** Proceso de actualización
- **Categorías:** A1, A2a, A2b, A3a, A3b, A3c
- **Restricciones:** Limitaciones específicas

**✅ Asignación a Vehículos**
- Vincular conductores con vehículos específicos
- Control de horarios y turnos
- Historial de asignaciones

---

### 5. 🛣️ GESTIÓN DE RUTAS

**Propósito:** Administrar rutas autorizadas y permisos de circulación.

#### Funcionalidades Principales

**✅ Crear Nueva Ruta**
1. Clic en "Nueva Ruta"
2. Seleccionar **empresa** (obligatorio)
3. Seleccionar **resolución** (obligatorio)
4. Completar información de la ruta:
   - **Origen:** Ciudad/distrito de inicio
   - **Destino:** Ciudad/distrito de llegada
   - **Recorrido:** Descripción detallada del trayecto
   - **Distancia:** Kilómetros totales
   - **Tiempo estimado:** Duración del viaje
5. Guardar ruta

**✅ Filtros Mejorados** ⭐ *Funcionalidad Destacada*
- **Por Empresa:** Dropdown con todas las empresas disponibles
- **Por Resolución:** Dropdown que se actualiza según la empresa seleccionada
- **Búsqueda Inteligente:** Por origen, destino o descripción
- **Filtrado en Tiempo Real:** Resultados instantáneos

**Cómo usar los filtros:**
1. **Seleccionar Empresa:** El dropdown muestra todas las empresas registradas
2. **Seleccionar Resolución:** Se actualiza automáticamente con las resoluciones de la empresa
3. **Buscar:** Escribir en el campo de búsqueda para filtrar por origen/destino
4. **Limpiar:** Botón para resetear todos los filtros

**✅ Gestión de Rutas**
- **Ver detalles:** Información completa de la ruta
- **Editar ruta:** Modificar datos existentes
- **Eliminar ruta:** Dar de baja rutas no utilizadas
- **Duplicar ruta:** Crear ruta similar basada en una existente

#### Características Especiales

**🔍 Búsqueda Inteligente con Datos Reales**
- Conecta directamente con la base de datos
- Sin datos ficticios o de prueba
- Resultados actualizados en tiempo real
- Logging detallado para diagnóstico (F12 en navegador)

**📊 Estadísticas por Ruta**
- Número de vehículos asignados
- Frecuencia de servicios
- Empresas operadoras
- Estado de autorización

---

### 6. 📋 GESTIÓN DE RESOLUCIONES

**Propósito:** Administrar resoluciones administrativas y autorizaciones.

#### Funcionalidades Principales

**✅ Crear Nueva Resolución**
1. Clic en "Nueva Resolución"
2. **Seleccionar Empresa:** Usar el selector con búsqueda inteligente
3. **Seleccionar Expediente:** Elegir el expediente asociado
4. **Tipo de Resolución:** Se determina automáticamente según el expediente
5. **Completar datos:**
   - **Número de resolución:** Formato automático (R-XXXX-YYYY)
   - **Fecha de emisión**
   - **Descripción:** Puede generarse automáticamente
   - **Observaciones:** Opcional

**✅ Dropdown de Resoluciones Padre** ⭐ *Funcionalidad Destacada*

Para expedientes tipo **INCREMENTO**:
1. Al seleccionar un expediente INCREMENTO, aparece el campo "RESOLUCIÓN PADRE"
2. El dropdown muestra **todas las resoluciones padre disponibles** de la empresa
3. **Ejemplo:** Para empresa "21212121212 - VVVVVV" muestra 5 opciones:
   - R-0001-2025 (Vence: 2030-12-22)
   - R-0002-2025 (Vence: 2029-12-21)
   - R-0003-2025 (Vence: 2030-12-21)
   - R-0004-2025 (Vence: 2028-12-21)
   - R-0005-2025 (Vence: 2030-12-21)

**Criterios de filtrado automático:**
- Solo resoluciones de la empresa seleccionada
- Solo resoluciones tipo "PADRE"
- Solo resoluciones con estado "VIGENTE"
- Solo resoluciones activas
- Solo resoluciones no vencidas

**✅ Filtros Simplificados** ⭐ *Interfaz Optimizada*
- **Búsqueda:** Por número de resolución
- **Estado:** Vigente/Vencida
- **Botón Limpiar:** Reset completo
- **Búsqueda en tiempo real:** Resultados instantáneos (300ms debounce)

**✅ Vista Jerárquica**
- **Resoluciones Padre:** Mostradas como tarjetas principales
- **Resoluciones Hijas:** Agrupadas bajo su resolución padre
- **Estadísticas:** Número de vehículos y rutas por resolución
- **Estados visuales:** Chips de colores por estado

#### Tipos de Resoluciones

**🟢 PRIMIGENIA (PADRE)**
- Primera autorización de la empresa
- Establece fechas de vigencia propias
- Puede tener resoluciones hijas

**🟡 RENOVACIÓN (PADRE)**
- Renueva una autorización existente
- Nuevas fechas de vigencia
- Puede referenciar resolución anterior

**🔵 INCREMENTO (HIJA)**
- Agrega vehículos a una resolución padre
- Hereda fechas de vigencia del padre
- **Requiere seleccionar resolución padre** (opcional pero recomendado)

**🟠 SUSTITUCIÓN (HIJA)**
- Reemplaza vehículos en una resolución padre
- Hereda fechas de vigencia del padre
- Puede referenciar resolución primigenia

#### Características Especiales

**📅 Cálculo Automático de Fechas**
- Las resoluciones padre establecen sus propias fechas
- Las resoluciones hijas heredan fechas del padre
- Cálculo automático de fecha de vencimiento

**🔍 Logging Detallado**
- Información completa en consola del navegador (F12)
- Diagnóstico de filtrado paso a paso
- Identificación de problemas en tiempo real

---

### 7. 📁 GESTIÓN DE EXPEDIENTES

**Propósito:** Administrar trámites y procesos administrativos.

#### Funcionalidades Principales

**✅ Crear Nuevo Expediente**
1. Datos básicos del expediente
2. Tipo de trámite:
   - **AUTORIZACION_NUEVA:** Primera autorización
   - **RENOVACION:** Renovar autorización existente
   - **INCREMENTO:** Agregar vehículos
   - **SUSTITUCION:** Reemplazar vehículos
   - **OTROS:** Otros trámites
3. Asociación con empresa
4. Documentos requeridos
5. Estado del trámite

**✅ Seguimiento de Expedientes**
- **Estados:** En trámite, aprobado, observado, rechazado
- **Historial:** Registro de movimientos y cambios
- **Notificaciones:** Alertas de vencimientos y actualizaciones
- **Documentos:** Gestión de archivos adjuntos

**✅ Flujo de Trabajo**
- **Mesa de Partes:** Recepción inicial
- **Evaluación Técnica:** Revisión especializada
- **Aprobación:** Autorización final
- **Emisión:** Generación de resolución

---

### 8. 🔍 FISCALIZACIONES

**Propósito:** Control y supervisión del cumplimiento normativo.

#### Funcionalidades Principales

**✅ Programar Fiscalización**
- Selección de empresa/vehículo objetivo
- Fecha y hora programada
- Tipo de fiscalización
- Inspector asignado

**✅ Registro de Infracciones**
- Tipo de infracción
- Descripción detallada
- Evidencias fotográficas
- Medidas correctivas

**✅ Seguimiento de Sanciones**
- Estado de multas
- Pagos realizados
- Recursos de apelación
- Resoluciones finales

---

### 9. 📊 REPORTES Y ESTADÍSTICAS

**Propósito:** Análisis de datos y generación de informes.

#### Tipos de Reportes

**✅ Reportes de Empresas**
- Listado completo de empresas
- Empresas por estado
- Empresas por tipo de servicio
- Estadísticas de crecimiento

**✅ Reportes de Vehículos**
- Flota total por empresa
- Vehículos por estado
- Vencimientos de TUCs
- Antigüedad de flota

**✅ Reportes de Resoluciones**
- Resoluciones emitidas por período
- Resoluciones por tipo
- Resoluciones próximas a vencer
- Estadísticas de aprobación

**✅ Exportación de Datos**
- **Excel:** Para análisis detallado
- **PDF:** Para documentos oficiales
- **CSV:** Para integración con otros sistemas

#### Cómo Generar Reportes

1. Ir al módulo "Reportes"
2. Seleccionar tipo de reporte
3. Configurar filtros y parámetros
4. Elegir formato de exportación
5. Descargar archivo generado
---

## 🚀 FUNCIONALIDADES AVANZADAS

### 1. 🔍 Búsqueda Inteligente

**Disponible en todos los módulos principales**

#### Características:
- **Búsqueda en tiempo real:** Resultados mientras escribes
- **Múltiples campos:** Busca en varios campos simultáneamente
- **Autocompletado:** Sugerencias automáticas
- **Filtros combinados:** Múltiples criterios de búsqueda

#### Ejemplos de uso:
**En Empresas:**
- Buscar por RUC: "20123456789"
- Buscar por razón social: "Transportes San Martín"
- Buscar por código: "0123PRT"

**En Vehículos:**
- Buscar por placa: "ABC-123"
- Buscar por marca: "Toyota"
- Buscar por empresa: "Transportes"

**En Resoluciones:**
- Buscar por número: "R-0001-2025"
- Buscar por estado: "VIGENTE"
- Buscar combinado: "RD-2024 VIGENTE"

### 2. 📱 Interfaz Responsive

**El sistema se adapta a diferentes dispositivos:**

#### Escritorio (1200px+):
- Menú lateral expandido
- Tablas completas con todas las columnas
- Formularios en múltiples columnas

#### Tablet (768px - 1199px):
- Menú lateral colapsable
- Tablas adaptadas con scroll horizontal
- Formularios reorganizados

#### Móvil (< 768px):
- Menú lateral oculto (hamburguesa)
- Tablas en formato de tarjetas
- Formularios en una sola columna

### 3. 🎨 Personalización de Interfaz

#### Temas Disponibles:
- **Claro:** Fondo blanco, ideal para uso diurno
- **Oscuro:** Fondo oscuro, reduce fatiga visual

#### Configuración de Vista:
- **Densidad de tabla:** Compacta, normal, espaciosa
- **Tamaño de fuente:** Pequeña, normal, grande
- **Animaciones:** Activar/desactivar efectos

### 4. 🔔 Sistema de Notificaciones

#### Tipos de Notificaciones:
- **✅ Éxito:** Operaciones completadas correctamente
- **⚠️ Advertencia:** Situaciones que requieren atención
- **❌ Error:** Problemas que impiden la operación
- **ℹ️ Información:** Mensajes informativos generales

#### Configuración:
- **Duración:** Tiempo de visualización
- **Posición:** Esquina superior derecha (por defecto)
- **Sonido:** Activar/desactivar alertas sonoras

### 5. 📊 Dashboard Personalizable

#### Widgets Disponibles:
- **Métricas principales:** Totales de entidades
- **Gráficos de tendencias:** Evolución temporal
- **Alertas importantes:** Vencimientos próximos
- **Accesos rápidos:** Enlaces a funciones frecuentes

#### Personalización:
1. Clic en "Personalizar Dashboard"
2. Arrastrar y soltar widgets
3. Redimensionar elementos
4. Guardar configuración

### 6. 🔄 Sincronización en Tiempo Real

#### Características:
- **Actualizaciones automáticas:** Los datos se refrescan automáticamente
- **Notificaciones de cambios:** Alertas cuando otros usuarios modifican datos
- **Estado de conexión:** Indicador de conectividad
- **Modo offline:** Funcionalidad limitada sin conexión

### 7. 📋 Gestión de Formularios Inteligente

#### Validación en Tiempo Real:
- **Campos obligatorios:** Marcados con asterisco (*)
- **Formatos específicos:** RUC, DNI, placas, etc.
- **Validación cruzada:** Verificación entre campos relacionados
- **Mensajes de error:** Explicaciones claras de problemas

#### Autocompletado:
- **Datos SUNAT:** Información automática de empresas por RUC
- **Historial:** Sugerencias basadas en datos anteriores
- **Validación externa:** Verificación con bases de datos oficiales

### 8. 🔐 Control de Acceso Granular

#### Roles del Sistema:
- **Administrador:** Acceso completo a todas las funciones
- **Supervisor:** Gestión de módulos específicos
- **Operador:** Funciones básicas de consulta y registro
- **Consulta:** Solo lectura de información

#### Permisos por Módulo:
- **Crear:** Agregar nuevos registros
- **Leer:** Consultar información existente
- **Actualizar:** Modificar datos existentes
- **Eliminar:** Dar de baja registros

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

### Problemas Comunes y Soluciones

#### 1. 🚫 No puedo iniciar sesión

**Posibles causas y soluciones:**

**❌ Credenciales incorrectas:**
- Verificar DNI y contraseña
- Asegurarse de no tener Caps Lock activado
- Contactar al administrador para reset de contraseña

**❌ Problema de conexión:**
- Verificar conexión a internet
- Comprobar que el servidor esté funcionando
- Intentar desde otro navegador

**❌ Cuenta bloqueada:**
- Contactar al administrador del sistema
- Proporcionar DNI para desbloqueo

#### 2. 📊 Los datos no se cargan

**Posibles causas y soluciones:**

**❌ Problema de red:**
- Verificar conexión a internet
- Refrescar la página (F5)
- Limpiar caché del navegador

**❌ Filtros muy restrictivos:**
- Revisar filtros aplicados
- Usar el botón "Limpiar filtros"
- Ampliar criterios de búsqueda

**❌ Problema del servidor:**
- Esperar unos minutos y reintentar
- Contactar soporte técnico
- Verificar estado del sistema

#### 3. 🔄 El sistema está lento

**Posibles causas y soluciones:**

**❌ Muchas pestañas abiertas:**
- Cerrar pestañas innecesarias
- Reiniciar el navegador
- Usar solo una sesión del sistema

**❌ Caché del navegador:**
- Limpiar caché y cookies
- Usar modo incógnito para probar
- Actualizar el navegador

**❌ Conexión lenta:**
- Verificar velocidad de internet
- Cerrar otras aplicaciones que usen internet
- Contactar al proveedor de internet

#### 4. 📝 No puedo guardar cambios

**Posibles causas y soluciones:**

**❌ Campos obligatorios vacíos:**
- Revisar campos marcados con asterisco (*)
- Completar toda la información requerida
- Verificar formatos de datos (RUC, DNI, etc.)

**❌ Permisos insuficientes:**
- Verificar rol de usuario
- Contactar administrador para permisos
- Intentar con otro usuario autorizado

**❌ Datos duplicados:**
- Verificar que no exista información similar
- Revisar números de documento únicos
- Modificar datos para evitar duplicación

#### 5. 🖨️ Problemas de impresión/exportación

**Posibles causas y soluciones:**

**❌ Bloqueador de pop-ups:**
- Permitir pop-ups para el sitio
- Desactivar bloqueadores temporalmente
- Usar otro navegador

**❌ Problema de permisos:**
- Verificar permisos de descarga
- Cambiar carpeta de descargas
- Ejecutar navegador como administrador

### Códigos de Error Comunes

#### Error 401 - No autorizado
- **Causa:** Sesión expirada o credenciales inválidas
- **Solución:** Cerrar sesión y volver a iniciar

#### Error 403 - Acceso denegado
- **Causa:** Permisos insuficientes para la operación
- **Solución:** Contactar administrador para permisos

#### Error 404 - No encontrado
- **Causa:** Recurso eliminado o URL incorrecta
- **Solución:** Verificar navegación o refrescar página

#### Error 500 - Error del servidor
- **Causa:** Problema interno del sistema
- **Solución:** Contactar soporte técnico

### Herramientas de Diagnóstico

#### 1. 🔍 Consola del Navegador (F12)
- **Acceso:** Presionar F12 en el navegador
- **Pestaña Console:** Ver mensajes de error y logging
- **Pestaña Network:** Verificar llamadas al servidor
- **Pestaña Application:** Revisar datos almacenados

#### 2. 🏥 Health Check del Sistema
- **URL:** `http://localhost:8000/health`
- **Propósito:** Verificar estado del backend
- **Respuesta esperada:** Status 200 con mensaje de éxito

#### 3. 📚 Documentación de API
- **URL:** `http://localhost:8000/docs`
- **Propósito:** Probar endpoints directamente
- **Uso:** Para desarrolladores y soporte técnico

---

## ❓ PREGUNTAS FRECUENTES

### Generales

**❓ ¿Puedo usar el sistema desde mi celular?**
✅ Sí, el sistema es completamente responsive y funciona en dispositivos móviles.

**❓ ¿Se guardan automáticamente los cambios?**
❌ No, debes hacer clic en "Guardar" para confirmar los cambios.

**❓ ¿Puedo trabajar sin conexión a internet?**
❌ No, el sistema requiere conexión constante para funcionar correctamente.

**❓ ¿Cuánto tiempo dura mi sesión?**
⏰ Las sesiones duran 8 horas de inactividad, después debes volver a iniciar sesión.

### Empresas

**❓ ¿Cómo obtengo el código de empresa?**
📋 El código se genera automáticamente al registrar la empresa, formato XXXXYYY.

**❓ ¿Puedo cambiar el RUC de una empresa?**
❌ No, el RUC es inmutable. Debes crear una nueva empresa si hay error.

**❓ ¿Por qué no aparecen todos los vehículos de mi empresa?**
🔍 Verifica que los vehículos estén asociados a resoluciones vigentes de la empresa.

### Vehículos

**❓ ¿Qué formato debe tener la placa?**
🚗 Formatos aceptados: ABC-123, ABC-1234, XXX-123 (según normativa vigente).

**❓ ¿Puedo transferir un vehículo entre empresas?**
✅ Sí, usa la función "Transferir Vehículo" en el módulo de vehículos.

**❓ ¿Cómo renuevo un TUC vencido?**
📋 En el detalle del vehículo, clic en "Renovar TUC" y seguir el proceso.

### Resoluciones

**❓ ¿Por qué no aparecen resoluciones padre en el dropdown?**
🔍 Verifica que:
- La empresa tenga resoluciones tipo PADRE
- Las resoluciones estén en estado VIGENTE
- Las resoluciones no estén vencidas

**❓ ¿Puedo modificar una resolución ya emitida?**
⚠️ Solo ciertos campos pueden modificarse. Contacta al supervisor para cambios importantes.

**❓ ¿Qué diferencia hay entre resolución PADRE e HIJA?**
📋 PADRE establece fechas propias, HIJA hereda fechas de su resolución padre.

### Rutas

**❓ ¿Por qué no aparecen rutas al filtrar?**
🔍 Verifica que:
- La empresa seleccionada tenga rutas registradas
- La resolución seleccionada tenga rutas asociadas
- Los filtros no sean muy restrictivos

**❓ ¿Puedo crear rutas sin resolución?**
❌ No, toda ruta debe estar asociada a una resolución vigente.

### Técnicas

**❓ ¿Qué navegador es mejor para usar el sistema?**
🌐 Google Chrome es el recomendado, pero también funciona en Firefox y Edge.

**❓ ¿Cómo limpio la caché del navegador?**
🧹 Ctrl+Shift+Delete → Seleccionar "Caché" → Eliminar datos.

**❓ ¿Dónde encuentro los logs del sistema?**
🔍 Presiona F12 → Pestaña "Console" para ver logs detallados.

---

## 📞 SOPORTE TÉCNICO

### Información de Contacto

**🏢 Dirección Regional de Transportes y Comunicaciones - Puno**
- **Dirección:** [Dirección de la oficina]
- **Teléfono:** [Número de teléfono]
- **Email:** [Email de soporte]
- **Horario:** Lunes a Viernes, 8:00 AM - 5:00 PM

### Canales de Soporte

#### 1. 🎫 Mesa de Ayuda
- **Para:** Problemas técnicos generales
- **Tiempo de respuesta:** 2-4 horas hábiles
- **Información requerida:**
  - Descripción del problema
  - Pasos para reproducir el error
  - Capturas de pantalla (si aplica)
  - Navegador y versión utilizada

#### 2. 📧 Soporte por Email
- **Para:** Consultas detalladas y reportes de bugs
- **Tiempo de respuesta:** 24-48 horas hábiles
- **Incluir:**
  - Usuario afectado (DNI)
  - Módulo donde ocurre el problema
  - Logs de la consola (F12)

#### 3. 📞 Soporte Telefónico
- **Para:** Problemas urgentes que impiden el trabajo
- **Horario:** Lunes a Viernes, 9:00 AM - 4:00 PM
- **Tener a mano:**
  - Credenciales de acceso
  - Descripción clara del problema
  - Computadora con acceso al sistema

#### 4. 🏢 Soporte Presencial
- **Para:** Capacitación y problemas complejos
- **Modalidad:** Cita previa
- **Incluye:**
  - Capacitación personalizada
  - Configuración de equipos
  - Resolución de problemas complejos

### Información para Reportar Problemas

**Datos básicos requeridos:**
- **Usuario:** DNI del usuario afectado
- **Fecha y hora:** Cuándo ocurrió el problema
- **Módulo:** Dónde se presentó el error
- **Acción:** Qué estaba haciendo cuando ocurrió
- **Error:** Mensaje de error exacto (si existe)
- **Navegador:** Chrome, Firefox, Edge, etc.
- **Sistema operativo:** Windows, Mac, Linux

**Información adicional útil:**
- Capturas de pantalla del error
- Logs de la consola del navegador (F12)
- Pasos exactos para reproducir el problema
- Si el problema es recurrente o esporádico

---

## 📚 RECURSOS ADICIONALES

### Documentación Técnica

- **📋 API Documentation:** `http://localhost:8000/docs`
- **🔧 Health Check:** `http://localhost:8000/health`
- **📊 System Status:** Dashboard de estado del sistema

### Capacitación

#### 🎓 Cursos Disponibles:
1. **Introducción al Sistema** (2 horas)
2. **Gestión de Empresas Avanzada** (3 horas)
3. **Administración de Resoluciones** (4 horas)
4. **Reportes y Análisis** (2 horas)
5. **Administración del Sistema** (6 horas)

#### 📹 Videos Tutoriales:
- Acceso básico al sistema
- Creación de empresas paso a paso
- Gestión de vehículos y TUCs
- Uso de filtros avanzados
- Generación de reportes

### Actualizaciones del Sistema

#### 🔄 Historial de Versiones:
- **v2.0** (Diciembre 2024): Dropdown resoluciones padre, conteo vehículos corregido
- **v1.9** (Noviembre 2024): Filtros mejorados en rutas y resoluciones
- **v1.8** (Octubre 2024): Interfaz responsive y búsqueda inteligente

#### 📢 Próximas Mejoras:
- Integración con SUNAT en tiempo real
- Aplicación móvil nativa
- Notificaciones push
- Dashboard ejecutivo avanzado

---

## 📋 ANEXOS

### Anexo A: Formatos de Datos

#### RUC (Registro Único de Contribuyentes):
- **Formato:** 11 dígitos numéricos
- **Ejemplo:** 20123456789
- **Validación:** Algoritmo de dígito verificador

#### DNI (Documento Nacional de Identidad):
- **Formato:** 8 dígitos numéricos
- **Ejemplo:** 12345678
- **Validación:** Rango válido y formato

#### Placas de Vehículos:
- **Formato Antiguo:** ABC-123 (3 letras + 3 números)
- **Formato Nuevo:** ABC-123D (3 letras + 3 números + 1 letra)
- **Ejemplo:** PLT-456, XYZ-789A

#### Códigos de Empresa:
- **Formato:** XXXXYYY (4 números + 3 letras)
- **Ejemplo:** 0123PRT
- **Significado:** Número secuencial + Tipo de servicio

### Anexo B: Estados del Sistema

#### Estados de Empresa:
- **🟢 HABILITADA:** Operando normalmente
- **🟡 EN_TRAMITE:** Proceso de autorización
- **🔴 SUSPENDIDA:** Temporalmente inhabilitada
- **⚫ CANCELADA:** Definitivamente inhabilitada

#### Estados de Vehículo:
- **🟢 ACTIVO:** Operando normalmente
- **🟡 EN_TRAMITE:** Proceso de autorización
- **🔴 SUSPENDIDO:** Temporalmente inhabilitado
- **⚫ DADO_DE_BAJA:** Retirado del servicio

#### Estados de Resolución:
- **🟢 VIGENTE:** Válida y operativa
- **🟡 PROXIMA_A_VENCER:** Vence en menos de 30 días
- **🔴 VENCIDA:** Fuera de vigencia
- **⚫ ANULADA:** Cancelada oficialmente

### Anexo C: Atajos de Teclado

#### Navegación General:
- **Ctrl + H:** Ir al Dashboard
- **Ctrl + E:** Ir a Empresas
- **Ctrl + V:** Ir a Vehículos
- **Ctrl + R:** Ir a Resoluciones
- **Ctrl + U:** Ir a Rutas

#### Acciones Comunes:
- **Ctrl + N:** Nuevo registro
- **Ctrl + S:** Guardar cambios
- **Ctrl + F:** Buscar/Filtrar
- **Esc:** Cancelar/Cerrar modal
- **F5:** Refrescar página

#### Formularios:
- **Tab:** Siguiente campo
- **Shift + Tab:** Campo anterior
- **Enter:** Confirmar (en botones)
- **Ctrl + Enter:** Guardar formulario

---

**📅 Última actualización:** 26 de Diciembre, 2024  
**📖 Versión del manual:** 2.0  
**✅ Estado del sistema:** Completamente funcional

---

*Este manual cubre todas las funcionalidades principales del Sistema DRTC Puno. Para consultas específicas o problemas no cubiertos en este documento, contactar al equipo de soporte técnico.*