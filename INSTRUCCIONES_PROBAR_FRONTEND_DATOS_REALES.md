# INSTRUCCIONES PARA PROBAR FRONTEND CON DATOS REALES

## 🎯 OBJETIVO
Verificar que el buscador inteligente del frontend esté usando **datos reales** de la base de datos.

---

## 🚀 PASO 1: INICIAR EL FRONTEND

### Opción A: Desde la carpeta frontend
```bash
cd frontend
ng serve
```

### Opción B: Desde la raíz del proyecto
```bash
npm start
```

### Opción C: Si tienes script personalizado
```bash
start-frontend.bat
```

**Esperar a que aparezca:**
```
✔ Browser application bundle generation complete.
Local:   http://localhost:4200/
```

---

## 🔍 PASO 2: ABRIR EL SISTEMA

1. **Abrir navegador**
2. **Ir a:** http://localhost:4200/rutas
3. **Esperar** a que cargue completamente

---

## 🔧 PASO 3: ABRIR DEVTOOLS

1. **Presionar F12** (o Ctrl+Shift+I)
2. **Ir a la pestaña 'Console'**
3. **Limpiar la consola** (Ctrl+L)

---

## 📊 PASO 4: ACTIVAR EL BUSCADOR

1. En la página, buscar **"Filtros Avanzados por Origen y Destino"**
2. **Hacer clic para expandir**
3. **Observar los logs en Console**

---

## ✅ PASO 5: VERIFICAR LOGS CORRECTOS

**Buscar estos mensajes en Console:**

```
✅ 🔄 CARGANDO COMBINACIONES DIRECTAMENTE DEL ENDPOINT DE BACKEND...
✅ 🌐 URL ENDPOINT DIRECTO: http://localhost:8000/api/v1/rutas/combinaciones-rutas
✅ 📊 RESPUESTA DIRECTA DEL ENDPOINT COMBINACIONES: {combinaciones: [...]}
✅ ✅ COMBINACIONES DIRECTAS DEL BACKEND (DATOS REALES): {total: 6, ...}
✅ 🎯 VERIFICACIÓN DE DATOS REALES:
   1. Cusco → Arequipa - 1 ruta(s)
   2. Juliaca → Arequipa - 3 ruta(s)
   3. Juliaca → Cusco - 2 ruta(s)
   4. Puno → Arequipa - 1 ruta(s)
   5. Puno → Cusco - 1 ruta(s)
   6. Puno → Juliaca - 5 ruta(s)
```

---

## ❌ PASO 6: VERIFICAR QUE NO APAREZCAN ESTOS LOGS

```
❌ Error al cargar combinaciones del backend
❌ Usando datos de ejemplo
❌ Error - Verificar Backend
❌ combinaciones cargadas desde el backend (sin "DIRECTAMENTE")
```

---

## 🔍 PASO 7: VERIFICAR NETWORK TAB

1. **Ir a la pestaña 'Network'** en DevTools
2. **Expandir filtros avanzados** (si no lo hiciste ya)
3. **Buscar llamada HTTP a:** `combinaciones-rutas`
4. **Verificar:**
   - ✅ Status: 200
   - ✅ Response size > 0
   - ✅ Response contiene 6 combinaciones

---

## 🎯 PASO 8: PROBAR EL BUSCADOR

En el campo **"Buscador Inteligente de Rutas":**

### Escribir "Puno":
**Debería mostrar 3 opciones:**
- Puno → Arequipa (1 ruta)
- Puno → Cusco (1 ruta)  
- Puno → Juliaca (5 rutas)

### Escribir "Juliaca":
**Debería mostrar 3 opciones:**
- Juliaca → Arequipa (3 rutas)
- Juliaca → Cusco (2 rutas)
- Puno → Juliaca (5 rutas)

### Escribir "Arequipa":
**Debería mostrar 3 opciones:**
- Cusco → Arequipa (1 ruta)
- Juliaca → Arequipa (3 rutas)
- Puno → Arequipa (1 ruta)

### Escribir "Cusco":
**Debería mostrar 3 opciones:**
- Cusco → Arequipa (1 ruta)
- Juliaca → Cusco (2 rutas)
- Puno → Cusco (1 ruta)

---

## 🎉 PASO 9: VERIFICAR FUNCIONALIDAD COMPLETA

1. **Escribir "Puno"** en el buscador
2. **Hacer clic en "Puno → Juliaca (5 rutas)"**
3. **Verificar** que aparece como chip azul
4. **Hacer clic en "Filtrar Rutas Seleccionadas"**
5. **Verificar** que se muestran las rutas filtradas

---

## ✅ SEÑALES DE ÉXITO

### 🟢 En Console:
- Logs con "DATOS REALES" y "DIRECTAMENTE del backend"
- URL del endpoint mostrada correctamente
- Estructura de 6 combinaciones mostrada

### 🟢 En Network:
- Llamada a 'combinaciones-rutas' con status 200
- Response con 6 combinaciones en JSON

### 🟢 En Buscador:
- Aparecen opciones al escribir
- Combinaciones como "Puno → Juliaca (5 rutas)"

### 🟢 En Snackbar:
- Mensaje "6 combinaciones cargadas DIRECTAMENTE del backend (DATOS REALES)"

### 🟢 Funcionalidad:
- Selección y filtrado funcionan correctamente

---

## ❌ SEÑALES DE PROBLEMAS

### 🔴 En Console:
- Errores de CORS o conexión
- Mensajes de "datos de ejemplo" o "fallback"
- Error "Failed to fetch" o similar

### 🔴 En Network:
- Llamadas fallidas (status 404, 500, etc.)
- No aparece llamada a 'combinaciones-rutas'

### 🔴 En Buscador:
- No aparecen opciones o aparecen datos incorrectos
- Opciones como "Error - Verificar Backend"

### 🔴 En Snackbar:
- Mensajes de error

---

## 🔧 SOLUCIONES A PROBLEMAS COMUNES

### Si NO aparecen logs en Console:
1. Verificar que expandiste los filtros avanzados
2. Refrescar la página (F5)
3. Limpiar caché del navegador (Ctrl+Shift+R)

### Si aparecen errores de CORS:
1. Verificar que el backend esté corriendo
2. Verificar configuración de CORS en el backend
3. Probar en modo incógnito

### Si NO aparecen opciones en el buscador:
1. Verificar logs en Console
2. Verificar Network tab para llamadas HTTP
3. Verificar que el backend devuelve datos

### Si aparecen datos de ejemplo:
1. Verificar que el código del frontend esté actualizado
2. Verificar que no hay errores en Console
3. Verificar que el endpoint del backend funciona

---

## 📊 DATOS ESPERADOS

**El backend tiene estas 6 combinaciones reales:**

1. **Cusco → Arequipa** (1 ruta)
2. **Juliaca → Arequipa** (3 rutas)
3. **Juliaca → Cusco** (2 rutas)
4. **Puno → Arequipa** (1 ruta)
5. **Puno → Cusco** (1 ruta)
6. **Puno → Juliaca** (5 rutas)

**Total: 13 rutas reales en 6 combinaciones**

---

## 🎯 RESULTADO ESPERADO

Si todo funciona correctamente, deberías ver:

1. ✅ **Logs claros** con "DATOS REALES"
2. ✅ **6 combinaciones** disponibles
3. ✅ **Búsqueda funcionando** en tiempo real
4. ✅ **Selección múltiple** con chips
5. ✅ **Filtrado específico** funcionando
6. ✅ **Sin datos de ejemplo** o fallback

---

## 🎉 ¡LISTO!

**El buscador inteligente debería estar funcionando perfectamente con datos reales de la base de datos.**

Si tienes algún problema, revisa los logs en Console y Network tab para identificar el issue específico.

---

*Instrucciones actualizadas el 16/12/2025 21:30*