# Manual Testing Guide - Integrate Unused Components

Este documento proporciona una guía completa para realizar pruebas manuales de todos los componentes integrados.

## Fecha de Prueba
**Fecha:** [Completar durante la prueba]  
**Tester:** [Nombre del tester]  
**Versión:** 1.0.0

---

## 10.1 Probar Vista de Detalle de Empresa

### Objetivo
Verificar que CodigoEmpresaInfoComponent se muestra correctamente en la vista de detalle de empresa.

### Pre-requisitos
- Aplicación corriendo en modo desarrollo (`ng serve`)
- Base de datos con al menos 2 empresas:
  - Una empresa CON código asignado (ej: "0123PRT")
  - Una empresa SIN código asignado

### Pasos de Prueba

#### Test 1.1: Navegar a detalle de empresa
- [ ] **Paso 1:** Abrir navegador en `http://localhost:4200`
- [ ] **Paso 2:** Iniciar sesión con credenciales válidas
- [ ] **Paso 3:** Navegar al módulo de "Empresas"
- [ ] **Paso 4:** Hacer clic en una empresa de la lista
- [ ] **Resultado Esperado:** Se abre la vista de detalle de empresa
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 1.2: Verificar que CodigoEmpresaInfoComponent se muestra
- [ ] **Paso 1:** En la vista de detalle, ir al tab "Información General"
- [ ] **Paso 2:** Scroll hacia abajo hasta la sección de código de empresa
- [ ] **Resultado Esperado:** 
  - Se muestra una card con título "Información del Código de Empresa"
  - La card tiene un icono de QR code
  - Se muestra el subtítulo "Formato: 4 dígitos + 3 letras (ej: 0123PRT)"
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 1.3: Verificar chips de tipos de empresa (con código válido)
- [ ] **Paso 1:** Seleccionar una empresa con código "0123PRT" o similar
- [ ] **Paso 2:** Observar la sección "Tipos de Empresa"
- [ ] **Resultado Esperado:**
  - Se muestran chips de colores para cada letra del código
  - Chip "P: Personas" con color azul (primary) e icono de personas
  - Chip "R: Regional" con color accent e icono de ubicación
  - Chip "T: Turismo" con color warn e icono de avión
  - Al pasar el mouse sobre cada chip, se muestra un tooltip con la descripción
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 1.4: Verificar visualización del código
- [ ] **Paso 1:** Observar la sección de "Código Display"
- [ ] **Resultado Esperado:**
  - El código se muestra dividido en dos partes con fondo blanco
  - Parte izquierda: 4 dígitos en azul (ej: "0123")
  - Parte derecha: 3 letras en verde (ej: "PRT")
  - Ambas partes tienen sombra y están centradas
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 1.5: Probar con empresa sin código
- [ ] **Paso 1:** Navegar a una empresa sin código asignado
- [ ] **Paso 2:** Ir al tab "Información General"
- [ ] **Paso 3:** Observar la sección de código de empresa
- [ ] **Resultado Esperado:**
  - Se muestra un icono de información grande en gris
  - Se muestra el mensaje "No se ha asignado un código de empresa"
  - NO se muestran chips de tipos de empresa
  - Se sigue mostrando la información del formato
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 1.6: Verificar información del formato
- [ ] **Paso 1:** Scroll hasta la sección "Formato del Código"
- [ ] **Resultado Esperado:**
  - Se muestra una caja con fondo azul claro y borde azul a la izquierda
  - Lista con 3 items explicando el formato
  - Ejemplo claro: "0123PRT = Empresa #123 que maneja Personas, Regional y Turismo"
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

### Resumen Test 10.1
- **Total Tests:** 6
- **Passed:** _____
- **Failed:** _____
- **Observaciones Generales:** _______________________

---

## 10.2 Probar Creación de Resolución con Nuevo Selector

### Objetivo
Verificar que EmpresaSelectorComponent funciona correctamente en el modal de crear resolución.

### Pre-requisitos
- Aplicación corriendo en modo desarrollo
- Base de datos con al menos 5 empresas con diferentes RUCs, razones sociales y códigos

### Pasos de Prueba

#### Test 2.1: Abrir modal de crear resolución
- [ ] **Paso 1:** Navegar al módulo de "Resoluciones"
- [ ] **Paso 2:** Hacer clic en el botón "Nueva Resolución" o similar
- [ ] **Resultado Esperado:**
  - Se abre un modal/dialog con el formulario de crear resolución
  - El campo de empresa es un input de búsqueda (no un select dropdown)
  - El campo tiene placeholder descriptivo
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 2.2: Probar búsqueda por RUC
- [ ] **Paso 1:** Hacer clic en el campo de empresa
- [ ] **Paso 2:** Escribir los primeros dígitos de un RUC (ej: "2012")
- [ ] **Resultado Esperado:**
  - Se muestra un panel de autocompletado debajo del campo
  - Las opciones se filtran en tiempo real mientras se escribe
  - Cada opción muestra: RUC en negrita + razón social
  - Solo se muestran empresas cuyo RUC contiene "2012"
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 2.3: Probar búsqueda por razón social
- [ ] **Paso 1:** Borrar el campo de empresa
- [ ] **Paso 2:** Escribir parte de una razón social (ej: "Transportes")
- [ ] **Resultado Esperado:**
  - El autocompletado filtra empresas por razón social
  - Se muestran todas las empresas cuya razón social contiene "Transportes"
  - La búsqueda es case-insensitive
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 2.4: Probar búsqueda por código de empresa
- [ ] **Paso 1:** Borrar el campo de empresa
- [ ] **Paso 2:** Escribir un código de empresa (ej: "0123")
- [ ] **Resultado Esperado:**
  - El autocompletado filtra empresas por código
  - Se muestran empresas cuyo código contiene "0123"
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 2.5: Verificar autocompletado
- [ ] **Paso 1:** Escribir en el campo de empresa
- [ ] **Paso 2:** Hacer clic en una opción del autocompletado
- [ ] **Resultado Esperado:**
  - El campo se completa con la empresa seleccionada
  - El panel de autocompletado se cierra
  - El formulario se actualiza con el empresaId
  - Si hay un campo de expedientes, se filtran por la empresa seleccionada
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 2.6: Verificar mensaje "sin resultados"
- [ ] **Paso 1:** Escribir texto que no coincide con ninguna empresa (ej: "XYZABC123")
- [ ] **Resultado Esperado:**
  - Se muestra una opción "No se encontraron empresas"
  - La opción está deshabilitada (no se puede seleccionar)
  - El campo permanece habilitado para seguir buscando
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 2.7: Crear resolución completa
- [ ] **Paso 1:** Seleccionar una empresa usando el buscador
- [ ] **Paso 2:** Completar todos los campos requeridos del formulario
- [ ] **Paso 3:** Hacer clic en "Guardar" o "Crear"
- [ ] **Resultado Esperado:**
  - La resolución se crea exitosamente
  - Se muestra un mensaje de éxito (snackbar)
  - El modal se cierra
  - La nueva resolución aparece en la lista
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 2.8: Verificar campo requerido
- [ ] **Paso 1:** Abrir modal de crear resolución
- [ ] **Paso 2:** Intentar guardar sin seleccionar empresa
- [ ] **Resultado Esperado:**
  - El formulario muestra error de validación
  - El campo de empresa muestra indicador de requerido
  - No se permite guardar hasta seleccionar una empresa
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

### Resumen Test 10.2
- **Total Tests:** 8
- **Passed:** _____
- **Failed:** _____
- **Observaciones Generales:** _______________________

---

## 10.3 Probar SmartIconComponent en Diferentes Escenarios

### Objetivo
Verificar que SmartIconComponent funciona correctamente con Material Icons y con fallbacks.

### Pre-requisitos
- Aplicación corriendo en modo desarrollo
- DevTools del navegador abierto (F12)

### Pasos de Prueba

#### Test 3.1: Verificar iconos en navegación
- [ ] **Paso 1:** Observar el menú de navegación lateral (sidebar)
- [ ] **Paso 2:** Identificar iconos en los items del menú
- [ ] **Resultado Esperado:**
  - Los iconos se muestran correctamente
  - Los iconos son de Material Icons (no emojis)
  - Los iconos tienen el tamaño correcto
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 3.2: Verificar iconos en botones
- [ ] **Paso 1:** Navegar a diferentes vistas (empresas, resoluciones, etc.)
- [ ] **Paso 2:** Observar los botones de acción
- [ ] **Resultado Esperado:**
  - Los botones muestran iconos correctamente
  - Los iconos están alineados con el texto
  - Los iconos responden a estados hover/disabled
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 3.3: Verificar tooltips
- [ ] **Paso 1:** Pasar el mouse sobre iconos que usan SmartIconComponent
- [ ] **Resultado Esperado:**
  - Se muestra un tooltip con la descripción del icono
  - El tooltip aparece después de ~500ms
  - El tooltip desaparece al quitar el mouse
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 3.4: Probar con Material Icons deshabilitado
- [ ] **Paso 1:** Abrir DevTools (F12)
- [ ] **Paso 2:** Ir a la pestaña "Network"
- [ ] **Paso 3:** Buscar la petición de Material Icons (fonts.googleapis.com)
- [ ] **Paso 4:** Click derecho > "Block request URL" o similar
- [ ] **Paso 5:** Recargar la página (F5)
- [ ] **Resultado Esperado:**
  - La página carga sin errores
  - Los iconos se muestran como emojis en lugar de Material Icons
  - La funcionalidad no se rompe
  - Se agrega clase `material-icons-fallback` al body
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 3.5: Verificar fallbacks específicos
- [ ] **Paso 1:** Con Material Icons bloqueado, observar iconos comunes:
  - home → 🏠
  - business → 🏢
  - person → 👤
  - settings → ⚙️
  - search → 🔍
- [ ] **Resultado Esperado:**
  - Cada icono muestra el emoji correcto
  - Los emojis son legibles y del tamaño apropiado
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 3.6: Verificar consola del navegador
- [ ] **Paso 1:** Abrir consola de DevTools
- [ ] **Paso 2:** Recargar la página con Material Icons bloqueado
- [ ] **Resultado Esperado:**
  - Se muestra un warning: "⚠️ Material Icons no disponibles, usando fallbacks"
  - No hay errores de JavaScript
  - No hay warnings de componentes rotos
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 3.7: Restaurar Material Icons
- [ ] **Paso 1:** En DevTools Network, desbloquear Material Icons
- [ ] **Paso 2:** Recargar la página
- [ ] **Resultado Esperado:**
  - Los iconos vuelven a mostrarse como Material Icons
  - Se remueve la clase `material-icons-fallback` del body
  - Todo funciona normalmente
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

### Resumen Test 10.3
- **Total Tests:** 7
- **Passed:** _____
- **Failed:** _____
- **Observaciones Generales:** _______________________

---

## 10.4 Verificar que No Hay Regresiones

### Objetivo
Asegurar que las integraciones no han roto funcionalidad existente.

### Pre-requisitos
- Aplicación corriendo en modo desarrollo
- Conocimiento de los flujos principales de la aplicación

### Pasos de Prueba

#### Test 4.1: Probar flujo de gestión de empresas
- [ ] **Paso 1:** Navegar al módulo de Empresas
- [ ] **Paso 2:** Listar empresas
- [ ] **Paso 3:** Crear una nueva empresa
- [ ] **Paso 4:** Editar una empresa existente
- [ ] **Paso 5:** Ver detalle de empresa
- [ ] **Resultado Esperado:**
  - Todas las operaciones funcionan correctamente
  - No hay errores en consola
  - La UI responde normalmente
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 4.2: Probar flujo de gestión de resoluciones
- [ ] **Paso 1:** Navegar al módulo de Resoluciones
- [ ] **Paso 2:** Listar resoluciones
- [ ] **Paso 3:** Crear una nueva resolución
- [ ] **Paso 4:** Ver detalle de resolución
- [ ] **Paso 5:** Editar una resolución
- [ ] **Resultado Esperado:**
  - Todas las operaciones funcionan correctamente
  - El nuevo selector de empresas funciona
  - No hay errores en consola
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 4.3: Probar flujo de gestión de vehículos
- [ ] **Paso 1:** Navegar al módulo de Vehículos
- [ ] **Paso 2:** Listar vehículos
- [ ] **Paso 3:** Crear un nuevo vehículo
- [ ] **Paso 4:** Ver detalle de vehículo
- [ ] **Resultado Esperado:**
  - Todas las operaciones funcionan correctamente
  - No hay errores en consola
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 4.4: Probar flujo de gestión de expedientes
- [ ] **Paso 1:** Navegar al módulo de Expedientes
- [ ] **Paso 2:** Listar expedientes
- [ ] **Paso 3:** Crear un nuevo expediente
- [ ] **Paso 4:** Ver detalle de expediente
- [ ] **Resultado Esperado:**
  - Todas las operaciones funcionan correctamente
  - No hay errores en consola
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 4.5: Verificar navegación general
- [ ] **Paso 1:** Navegar entre diferentes módulos usando el menú
- [ ] **Paso 2:** Usar el botón "Volver" en diferentes vistas
- [ ] **Paso 3:** Usar breadcrumbs si existen
- [ ] **Resultado Esperado:**
  - La navegación funciona correctamente
  - No hay rutas rotas
  - Los iconos de navegación se muestran correctamente
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 4.6: Verificar que no hay errores en consola
- [ ] **Paso 1:** Abrir DevTools > Console
- [ ] **Paso 2:** Navegar por toda la aplicación
- [ ] **Paso 3:** Realizar operaciones CRUD en diferentes módulos
- [ ] **Resultado Esperado:**
  - No hay errores de JavaScript
  - No hay warnings de Angular
  - No hay errores de HTTP (excepto los esperados como 404, 401)
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 4.7: Verificar compilación
- [ ] **Paso 1:** Detener el servidor de desarrollo
- [ ] **Paso 2:** Ejecutar `ng build --configuration production`
- [ ] **Resultado Esperado:**
  - La compilación se completa sin errores
  - No hay warnings de archivos no utilizados
  - El bundle size es razonable
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

#### Test 4.8: Verificar tests unitarios
- [ ] **Paso 1:** Ejecutar `ng test --watch=false`
- [ ] **Resultado Esperado:**
  - Todos los tests pasan
  - No hay tests fallidos
  - No hay regresiones en tests existentes
- [ ] **Estado:** ✅ PASS / ❌ FAIL
- [ ] **Notas:** _______________________

### Resumen Test 10.4
- **Total Tests:** 8
- **Passed:** _____
- **Failed:** _____
- **Observaciones Generales:** _______________________

---

## Resumen General de Pruebas

### Estadísticas Totales
- **Total de Tests Ejecutados:** 29
- **Tests Passed:** _____
- **Tests Failed:** _____
- **Porcentaje de Éxito:** _____%

### Problemas Encontrados
1. _______________________
2. _______________________
3. _______________________

### Recomendaciones
1. _______________________
2. _______________________
3. _______________________

### Conclusión
[ ] ✅ Todas las pruebas pasaron - Listo para producción  
[ ] ⚠️ Algunas pruebas fallaron - Requiere correcciones  
[ ] ❌ Muchas pruebas fallaron - Requiere revisión completa

### Firma del Tester
**Nombre:** _______________________  
**Fecha:** _______________________  
**Firma:** _______________________

---

## Anexo: Comandos Útiles

### Iniciar aplicación en desarrollo
```bash
cd frontend
ng serve
```

### Compilar para producción
```bash
cd frontend
ng build --configuration production
```

### Ejecutar tests unitarios
```bash
cd frontend
ng test --watch=false
```

### Ver bundle size
```bash
cd frontend
ng build --configuration production --stats-json
npx webpack-bundle-analyzer dist/frontend/stats.json
```

### Limpiar y reinstalar dependencias
```bash
cd frontend
rm -rf node_modules
rm package-lock.json
npm install
```
