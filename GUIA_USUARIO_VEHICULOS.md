# 📖 GUÍA DE USUARIO: MÓDULO DE VEHÍCULOS

**Versión:** 1.0  
**Fecha:** 17 de Mayo de 2026  
**Sistema:** SIRRET - Sistema Regional de Registros de Transporte

---

## 📋 TABLA DE CONTENIDOS

1. [Introducción](#introducción)
2. [Conceptos Clave](#conceptos-clave)
3. [Crear un Vehículo](#crear-un-vehículo)
4. [Ver Detalles](#ver-detalles)
5. [Editar Vehículos](#editar-vehículos)
6. [Buscar y Filtrar](#buscar-y-filtrar)
7. [Preguntas Frecuentes](#preguntas-frecuentes)
8. [Solución de Problemas](#solución-de-problemas)

---

## 🎯 INTRODUCCIÓN

El módulo de Vehículos permite registrar y gestionar todos los vehículos de transporte de la región de Puno. El sistema está dividido en dos partes:

- **Datos Técnicos:** Especificaciones del vehículo (marca, modelo, motor, etc.)
- **Datos Administrativos:** Asignación a empresa, resolución, rutas, etc.

### ¿Qué es nuevo?

El nuevo sistema integra ambas partes en un flujo único y claro:

✅ **Antes:** Tenías que crear datos en dos lugares diferentes  
✅ **Ahora:** Un único flujo guiado de 3 pasos

---

## 💡 CONCEPTOS CLAVE

### Datos Técnicos
Son las especificaciones del vehículo:
- Placa, VIN, Número de Serie
- Marca, Modelo, Año
- Categoría, Carrocería, Color
- Motor, Combustible, Cilindrada
- Capacidades (asientos, pasajeros, ejes)
- Pesos (seco, bruto)
- Dimensiones

### Datos Administrativos
Son la asignación operativa del vehículo:
- Empresa transportista
- Tipo de servicio (pasajeros, carga, mixto)
- Resolución
- Rutas asignadas
- Estado (activo, inactivo, mantenimiento, etc.)

### Validación de Integridad
El sistema verifica automáticamente que:
- Los datos técnicos existan
- La empresa esté registrada
- Las rutas sean válidas
- No haya inconsistencias

---

## 🚗 CREAR UN VEHÍCULO

### Paso 1: Acceder al Formulario

1. Haz clic en **"Nuevo Vehículo"** en la pantalla de vehículos
2. Se abrirá un formulario de 3 pasos

### Paso 2: Completar Datos Técnicos

**Sección 1: Identificación**
- **Placa:** Formato ABC-123 (obligatorio)
- **VIN:** Número de identificación del vehículo (obligatorio)
- **Número de Serie:** Del vehículo (obligatorio)
- **Número de Motor:** Del motor (obligatorio)

**Sección 2: Vehículo**
- **Marca:** Ej: TOYOTA (obligatorio)
- **Modelo:** Ej: HIACE (obligatorio)
- **Año de Fabricación:** Entre 1990 y 2027 (obligatorio)
- **Año Modelo:** Año del modelo (obligatorio)
- **Categoría:** Selecciona de la lista (obligatorio)
  - M1: Pasajeros hasta 8 asientos
  - M2: Pasajeros más de 8 asientos, peso ≤ 5 ton
  - M3: Pasajeros más de 8 asientos, peso > 5 ton
  - N1: Carga peso ≤ 3.5 ton
  - N2: Carga 3.5 ton < peso ≤ 12 ton
  - N3: Carga peso > 12 ton
- **Carrocería:** Tipo de carrocería (obligatorio)
- **Color:** Color del vehículo (obligatorio)

**Sección 3: Motor**
- **Combustible:** Gasolina, Diésel, GLP, GNV, etc. (obligatorio)
- **Cilindrada (cc):** Ej: 2400 (obligatorio)
- **Potencia (HP):** Ej: 150 (opcional)

**Sección 4: Capacidades**
- **Asientos:** Número de asientos (obligatorio)
- **Pasajeros:** Capacidad total de pasajeros (obligatorio)
- **Ejes:** Número de ejes (obligatorio)
- **Ruedas:** Número de ruedas (obligatorio)

**Sección 5: Pesos**
- **Peso Seco (kg):** Peso sin carga (obligatorio)
- **Peso Bruto (kg):** Peso máximo permitido (obligatorio)
- **País de Origen:** País de fabricación (obligatorio)

### Paso 3: Completar Datos Administrativos

**Sección 1: Asignación**
- **Empresa:** Selecciona la empresa transportista (obligatorio)
- **Tipo de Servicio:** Pasajeros, Carga o Mixto (obligatorio)
- **Resolución:** Número de resolución (opcional)
- **Sede de Registro:** Sede donde se registra (opcional)

**Sección 2: Observaciones**
- **Observaciones:** Notas adicionales (opcional)

### Paso 4: Confirmación

1. Revisa el resumen de datos técnicos
2. Revisa el resumen de datos administrativos
3. Haz clic en **"Crear Vehículo"**
4. El sistema validará los datos
5. Si todo es correcto, el vehículo se creará

### ✅ Vehículo Creado

Una vez creado, verás:
- Mensaje de confirmación
- Redirección al listado de vehículos
- El nuevo vehículo aparecerá en la lista

---

## 👁️ VER DETALLES

### Acceder a Detalles

1. En el listado de vehículos, haz clic en el botón **"Ver Detalle"** (ojo)
2. Se abrirá la pantalla de detalles completa

### Pantalla de Detalles

La pantalla tiene 3 tabs:

#### Tab 1: Datos Técnicos
Muestra todos los datos técnicos del vehículo:
- Identificación (Placa, VIN, Número de Serie, Motor)
- Vehículo (Marca, Modelo, Año, Categoría, Carrocería, Color)
- Motor (Combustible, Cilindrada, Potencia)
- Capacidades (Asientos, Pasajeros, Ejes, Ruedas)
- Pesos (Seco, Bruto, Carga Útil)
- Dimensiones (Largo, Ancho, Alto)
- Origen (País de Origen, País de Procedencia, Estado Físico)

#### Tab 2: Datos Administrativos
Muestra la información administrativa:
- Asignación (Empresa, Tipo de Servicio, Resolución)
- Estado (Estado actual, Si está activo)
- Información Adicional (Sede, Observaciones)
- Metadatos (Fechas de creación y actualización)

#### Tab 3: Validación
Muestra el estado de validación:
- ✅ Si todo es válido: "Todos los datos son válidos y consistentes"
- ❌ Si hay problemas: Lista de errores encontrados

### Acciones en Detalles

- **Editar:** Modifica el vehículo
- **Validar Integridad:** Verifica que todos los datos sean consistentes
- **Volver:** Regresa al listado

---

## ✏️ EDITAR VEHÍCULOS

### Acceder a Edición

1. En el listado, haz clic en el botón **"Editar"** (lápiz)
2. O en la pantalla de detalles, haz clic en **"Editar"**

### Qué Puedes Editar

Puedes modificar:
- Datos administrativos (empresa, resolución, rutas, etc.)
- Estado del vehículo
- Observaciones
- Información de sustitución (si aplica)

### Guardar Cambios

1. Modifica los campos que necesites
2. Haz clic en **"Guardar"**
3. El sistema validará los cambios
4. Si todo es correcto, se guardarán los cambios

---

## 🔍 BUSCAR Y FILTRAR

### Búsqueda Rápida

En el listado de vehículos, puedes buscar por:

**Placa:**
- Escribe la placa (ej: ABC-123)
- El sistema mostrará coincidencias

**Marca:**
- Escribe la marca (ej: TOYOTA)
- Filtra por marca

**Empresa:**
- Selecciona una empresa
- Muestra solo vehículos de esa empresa

**Estado:**
- Selecciona un estado (Activo, Inactivo, etc.)
- Filtra por estado

**Categoría:**
- Selecciona una categoría (M1, M2, etc.)
- Filtra por categoría

### Limpiar Filtros

Haz clic en **"Limpiar"** para resetear todos los filtros

### Configurar Columnas

1. Haz clic en el icono de **"Columnas"** (vista)
2. Selecciona qué columnas mostrar
3. Las columnas se guardarán automáticamente

---

## ❓ PREGUNTAS FRECUENTES

### ¿Cuál es la diferencia entre Datos Técnicos y Datos Administrativos?

**Datos Técnicos:** Son las características del vehículo (marca, modelo, motor, etc.)  
**Datos Administrativos:** Son la asignación operativa (empresa, resolución, rutas, etc.)

### ¿Puedo cambiar la placa después de crear el vehículo?

No, la placa es única y no se puede cambiar. Si necesitas cambiar la placa, debes crear un nuevo vehículo.

### ¿Qué significa "Validación de Integridad"?

El sistema verifica que:
- Los datos técnicos existan
- La empresa esté registrada
- Las rutas sean válidas
- No haya inconsistencias

### ¿Puedo crear un vehículo sin empresa?

No, la empresa es obligatoria. Debes asignar el vehículo a una empresa.

### ¿Qué es el "Tipo de Servicio"?

Es el tipo de transporte que realiza el vehículo:
- **Pasajeros:** Transporte de personas
- **Carga:** Transporte de mercancías
- **Mixto:** Ambos tipos

### ¿Puedo editar los datos técnicos después de crear el vehículo?

No, los datos técnicos no se pueden editar. Si necesitas cambiarlos, debes crear un nuevo vehículo.

### ¿Qué significa "Estado del Vehículo"?

Es la situación operativa del vehículo:
- **Activo:** En servicio
- **Inactivo:** Fuera de servicio
- **Mantenimiento:** En reparación
- **Suspendido:** Suspensión temporal
- **Fuera de Servicio:** No disponible
- **Dado de Baja:** Retirado del servicio

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Problema: No puedo crear un vehículo

**Posibles causas:**
1. Faltan campos obligatorios
2. La placa ya existe
3. La empresa no está registrada

**Solución:**
1. Verifica que todos los campos obligatorios estén completos
2. Usa una placa única
3. Registra la empresa primero

### Problema: No puedo ver los datos técnicos

**Posibles causas:**
1. El vehículo no tiene datos técnicos asignados
2. Hay un problema de conexión

**Solución:**
1. Verifica que el vehículo tenga `vehiculoDataId`
2. Recarga la página
3. Contacta al administrador

### Problema: La validación de integridad falla

**Posibles causas:**
1. La empresa no existe
2. Las rutas no existen
3. Hay inconsistencias en los datos

**Solución:**
1. Verifica que la empresa esté registrada
2. Verifica que las rutas sean válidas
3. Contacta al administrador

### Problema: No puedo editar el vehículo

**Posibles causas:**
1. No tienes permisos
2. El vehículo está bloqueado
3. Hay un problema de conexión

**Solución:**
1. Verifica tus permisos
2. Recarga la página
3. Contacta al administrador

### Problema: Los cambios no se guardan

**Posibles causas:**
1. Hay errores de validación
2. Hay un problema de conexión
3. La sesión expiró

**Solución:**
1. Verifica los errores mostrados
2. Verifica tu conexión a internet
3. Inicia sesión nuevamente

---

## 📞 CONTACTO Y SOPORTE

Si tienes problemas o preguntas:

- **Email:** soporte@sirret.gob.pe
- **Teléfono:** +51 (51) 123-4567
- **Horario:** Lunes a Viernes, 8:00 AM - 5:00 PM

---

## 📚 RECURSOS ADICIONALES

- [Manual Técnico](./MANUAL_TECNICO_VEHICULOS.md)
- [Preguntas Frecuentes Técnicas](./FAQ_TECNICO_VEHICULOS.md)
- [Guía de Validación](./GUIA_VALIDACION_VEHICULOS.md)

---

**Última actualización:** 17 de Mayo de 2026  
**Versión:** 1.0  
**Estado:** ✅ Publicado

