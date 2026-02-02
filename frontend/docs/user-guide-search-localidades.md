# Guía de Usuario: Búsqueda de Provincias y Distritos

## 🔍 Nueva Funcionalidad de Búsqueda

Los campos de **Provincia** y **Distrito** en el modal de localidades ahora incluyen funcionalidad de búsqueda para encontrar opciones más fácilmente.

## 📋 Cómo Usar la Búsqueda

### **Paso 1: Activar los Campos**
1. Abrir el modal "Nueva Localidad"
2. Seleccionar un tipo que requiera ubicación:
   - **Distrito** (muestra campo Provincia)
   - **Pueblo** (muestra campos Provincia y Distrito)
   - **Centro Poblado** (muestra campos Provincia y Distrito)

### **Paso 2: Buscar Provincia**
1. **Hacer clic** en el campo "Provincia"
2. **Escribir** las primeras letras de la provincia buscada
3. **Ver** cómo se filtran las opciones en tiempo real
4. **Seleccionar** la provincia deseada de la lista

### **Paso 3: Buscar Distrito (si aplica)**
1. **Hacer clic** en el campo "Distrito"
2. **Escribir** las primeras letras del distrito buscado
3. **Ver** cómo se filtran los distritos de la provincia seleccionada
4. **Seleccionar** el distrito deseado

## 💡 Ejemplos Prácticos

### **Buscar Provincia "AZÁNGARO":**
- Escribir: `aza` → Se muestra "AZÁNGARO"
- Escribir: `ang` → Se muestra "AZÁNGARO"
- Escribir: `azangaro` → Se muestra "AZÁNGARO"

### **Buscar Provincia "CARABAYA":**
- Escribir: `cara` → Se muestra "CARABAYA"
- Escribir: `bay` → Se muestra "CARABAYA"
- Escribir: `carabaya` → Se muestra "CARABAYA"

### **Buscar Distrito "MACUSANI":**
- Escribir: `mac` → Se muestra "MACUSANI"
- Escribir: `usa` → Se muestra "MACUSANI"
- Escribir: `sani` → Se muestra "MACUSANI"

## ⚡ Consejos de Uso

### **Búsqueda Eficiente:**
- ✅ **Escribir pocas letras** es suficiente (2-3 caracteres)
- ✅ **No importan mayúsculas/minúsculas** (aza = AZA = Aza)
- ✅ **Buscar por cualquier parte** del nombre (no solo el inicio)
- ✅ **Usar espacios** si el nombre tiene varias palabras

### **Navegación por Teclado:**
- ⬆️⬇️ **Flechas**: Navegar por las opciones
- **Enter**: Seleccionar la opción resaltada
- **Escape**: Cerrar la lista sin seleccionar
- **Tab**: Ir al siguiente campo

## 🚫 Qué Hacer Si No Encuentras Resultados

### **Mensaje: "No se encontraron provincias"**
1. **Verificar ortografía** del texto ingresado
2. **Probar con menos letras** (ej: "aza" en lugar de "azangaro")
3. **Probar con otra parte** del nombre (ej: "bay" para "CARABAYA")
4. **Borrar el texto** y ver todas las opciones disponibles

### **El campo está deshabilitado:**
- **Verificar** que se haya seleccionado el departamento primero
- **Esperar** a que termine de cargar las opciones (spinner)
- **Refrescar** la página si persiste el problema

## 🔄 Funcionalidad en Cascada

### **Orden de Selección:**
1. **Departamento** (por defecto: PUNO)
2. **Provincia** (se cargan las provincias del departamento)
3. **Distrito** (se cargan los distritos de la provincia seleccionada)

### **Comportamiento Automático:**
- Al cambiar **departamento** → Se limpian provincia y distrito
- Al cambiar **provincia** → Se limpia distrito y se cargan nuevos distritos
- Al cambiar **tipo de localidad** → Se muestran/ocultan campos según corresponda

## 📱 Uso en Dispositivos Móviles

### **Pantallas Pequeñas:**
- **Tocar** el campo para abrir el teclado virtual
- **Escribir** normalmente en el teclado
- **Tocar** la opción deseada en la lista
- **Usar scroll** si hay muchas opciones

### **Tablets:**
- **Funciona igual** que en desktop
- **Mejor experiencia** que hacer scroll en listas largas
- **Teclado virtual** se adapta automáticamente

## ❓ Preguntas Frecuentes

### **¿Puedo seguir usando el dropdown tradicional?**
- Los campos ahora son de búsqueda por defecto
- Si hay pocas opciones (1-2), se muestra como input simple
- La funcionalidad es más rápida y eficiente

### **¿Se guardan mis búsquedas anteriores?**
- Actualmente no se guardan búsquedas
- Cada vez que abres el modal, los campos están limpios
- Funcionalidad de historial puede agregarse en el futuro

### **¿Funciona sin conexión a internet?**
- Sí, la búsqueda funciona localmente
- Las opciones se cargan una vez al abrir el modal
- No requiere conexión adicional para filtrar

### **¿Puedo buscar por código o UBIGEO?**
- Actualmente solo busca por nombre de la localidad
- Búsqueda por código puede agregarse en futuras versiones
- El UBIGEO se maneja en un campo separado

## 🆘 Soporte

Si encuentras problemas con la funcionalidad de búsqueda:

1. **Verificar** que estés usando la versión más reciente
2. **Limpiar caché** del navegador
3. **Probar** en modo incógnito/privado
4. **Reportar** el problema con detalles específicos

---

**Última actualización**: 2026-01-31  
**Versión**: 1.0  
**Compatibilidad**: Todos los navegadores modernos