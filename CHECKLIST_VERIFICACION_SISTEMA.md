# ✅ Checklist de Verificación: Sistema Localidades ↔ Rutas

## 🎯 Objetivo
Verificar que todas las funcionalidades del sistema funcionan correctamente.

---

## 📋 Módulo de Localidades

### Funcionalidades Básicas
- [ ] **Listar localidades**
  - Abrir módulo de localidades
  - Verificar que se muestran todas las localidades
  - Verificar estadísticas (provincias, distritos, centros poblados)

- [ ] **Crear localidad**
  - Click en "Nueva Localidad"
  - Llenar formulario con datos válidos
  - Guardar
  - Verificar que aparece en la lista

- [ ] **Editar localidad**
  - Click en botón de editar (✏️)
  - Modificar nombre (ej: "PUNO" → "PUNO CIUDAD")
  - Guardar
  - Verificar que el cambio se refleja

- [ ] **Activar/Desactivar localidad**
  - Click en botón de estado (👁️)
  - Verificar que cambia el estado
  - Verificar que el chip muestra el estado correcto

### Búsqueda y Filtros
- [ ] **Búsqueda por texto**
  - Escribir "PUNO" en el buscador
  - Verificar que filtra correctamente
  - Limpiar búsqueda
  - Verificar que muestra todas las localidades

- [ ] **Filtro por departamento**
  - Seleccionar "PUNO"
  - Verificar que solo muestra localidades de Puno
  - Seleccionar "OTROS"
  - Verificar que muestra localidades con datos incompletos

- [ ] **Filtro por tipo**
  - Seleccionar "PROVINCIA"
  - Verificar que solo muestra provincias
  - Seleccionar "DISTRITO"
  - Verificar que solo muestra distritos

- [ ] **Limpiar filtros**
  - Aplicar varios filtros
  - Click en "Limpiar Filtros"
  - Verificar que muestra todas las localidades

### Protección de Eliminación
- [ ] **Intentar eliminar localidad EN USO**
  - Identificar una localidad que esté en rutas (ej: "PUNO")
  - Click en botón de eliminar (🗑️)
  - **Resultado esperado:**
    ```
    ❌ NO SE PUEDE ELIMINAR
    
    La localidad "PUNO" está siendo utilizada en:
    • X ruta(s) como ORIGEN
    • Y ruta(s) como DESTINO
    • Z ruta(s) en ITINERARIO
    
    📋 Rutas afectadas:
       - Ruta 1
       - Ruta 2
       ...
    
    💡 Primero debes actualizar o eliminar estas rutas.
    ```
  - Verificar que NO se elimina

- [ ] **Eliminar localidad SIN USO**
  - Crear localidad de prueba "TEST_LOCALIDAD"
  - Verificar que NO está en ninguna ruta
  - Click en botón de eliminar (🗑️)
  - Confirmar eliminación (2 veces)
  - Verificar que se elimina correctamente

---

## 📋 Módulo de Rutas

### Funcionalidades Básicas
- [ ] **Listar rutas**
  - Abrir módulo de rutas
  - Verificar que se muestran todas las rutas
  - Verificar que se muestran los nombres de localidades

- [ ] **Crear ruta**
  - Click en "Nueva Ruta"
  - Seleccionar origen (ej: "PUNO")
  - Seleccionar destino (ej: "JULIACA")
  - Llenar datos requeridos
  - Guardar
  - Verificar que aparece en la lista

- [ ] **Editar ruta**
  - Click en botón de editar
  - Modificar datos
  - Guardar
  - Verificar que los cambios se reflejan

- [ ] **Ver detalle de ruta**
  - Click en una ruta
  - Verificar que muestra todos los datos
  - Verificar que muestra localidades correctamente

- [ ] **Eliminar ruta**
  - Crear ruta de prueba
  - Click en botón de eliminar
  - Confirmar eliminación
  - Verificar que se elimina

### Búsqueda y Filtros
- [ ] **Búsqueda por texto**
  - Escribir nombre de localidad (ej: "PUNO")
  - Verificar que filtra rutas que contienen esa localidad
  - Limpiar búsqueda

- [ ] **Filtros avanzados por origen**
  - Click en "Filtros Avanzados"
  - Ingresar origen: "PUNO"
  - Aplicar
  - Verificar que muestra rutas donde PUNO es origen O destino

- [ ] **Filtros avanzados por origen y destino**
  - Click en "Filtros Avanzados"
  - Ingresar origen: "PUNO"
  - Ingresar destino: "JULIACA"
  - Aplicar
  - Verificar que muestra rutas PUNO→JULIACA y JULIACA→PUNO

- [ ] **Limpiar filtros avanzados**
  - Aplicar filtros
  - Click en "Limpiar Filtros"
  - Verificar que muestra todas las rutas

### Validaciones
- [ ] **Crear ruta con localidad inválida**
  - Intentar crear ruta con localidad que no existe
  - **Resultado esperado:** Error de validación

- [ ] **Crear ruta con origen = destino**
  - Intentar crear ruta con mismo origen y destino
  - **Resultado esperado:** Error "Origen y destino no pueden ser iguales"

- [ ] **Crear ruta con localidad inactiva**
  - Desactivar una localidad
  - Intentar crear ruta con esa localidad
  - **Resultado esperado:** Error "Localidad no está activa"

### Exportación
- [ ] **Exportar rutas a Excel**
  - Seleccionar algunas rutas
  - Click en "Exportar Seleccionadas"
  - Verificar que descarga archivo Excel
  - Abrir archivo y verificar datos

- [ ] **Exportar todas las rutas**
  - Click en menú de exportación
  - Seleccionar "Exportar Todas"
  - Verificar que descarga archivo
  - Verificar que contiene todas las rutas filtradas

---

## 🔄 Sincronización Automática

### Escenario 1: Actualizar Nombre de Localidad
- [ ] **Preparación**
  - Identificar una localidad usada en rutas (ej: "PUNO")
  - Anotar las rutas que la usan
  - Anotar el nombre actual

- [ ] **Actualización**
  - Editar la localidad
  - Cambiar nombre: "PUNO" → "PUNO CIUDAD"
  - Guardar

- [ ] **Verificación**
  - Ir al módulo de rutas
  - Buscar las rutas anotadas
  - **Resultado esperado:** Todas las rutas muestran "PUNO CIUDAD"
  - Verificar en:
    - Rutas donde es origen
    - Rutas donde es destino
    - Rutas donde está en itinerario

### Escenario 2: Crear Ruta y Actualizar Localidad
- [ ] **Crear ruta**
  - Crear ruta: "LOCALIDAD_A" → "LOCALIDAD_B"
  - Verificar que se crea correctamente

- [ ] **Actualizar localidad**
  - Editar "LOCALIDAD_A"
  - Cambiar nombre a "LOCALIDAD_A_MODIFICADA"
  - Guardar

- [ ] **Verificar sincronización**
  - Ir a la ruta creada
  - **Resultado esperado:** Muestra "LOCALIDAD_A_MODIFICADA"

---

## 🛡️ Protección de Integridad

### Escenario 1: Protección Básica
- [ ] **Crear localidad y ruta**
  - Crear localidad "LOC_TEST_1"
  - Crear ruta usando "LOC_TEST_1" como origen
  - Intentar eliminar "LOC_TEST_1"
  - **Resultado esperado:** Bloqueado con mensaje detallado

### Escenario 2: Protección en Itinerario
- [ ] **Crear ruta con itinerario**
  - Crear localidad "LOC_TEST_2"
  - Crear ruta con "LOC_TEST_2" en el itinerario
  - Intentar eliminar "LOC_TEST_2"
  - **Resultado esperado:** Bloqueado, indica que está en itinerario

### Escenario 3: Eliminar Después de Quitar de Rutas
- [ ] **Preparación**
  - Crear localidad "LOC_TEST_3"
  - Crear ruta usando "LOC_TEST_3"
  - Verificar que no se puede eliminar

- [ ] **Liberar localidad**
  - Eliminar la ruta que usa "LOC_TEST_3"
  - Intentar eliminar "LOC_TEST_3"
  - **Resultado esperado:** Ahora SÍ se puede eliminar

---

## 🎨 Interfaz de Usuario

### Localidades
- [ ] **Estadísticas visibles**
  - Verificar que se muestran las 4 tarjetas de estadísticas
  - Verificar que los números son correctos

- [ ] **Tabla responsive**
  - Verificar que la tabla se adapta al tamaño de pantalla
  - Verificar que el paginador funciona

- [ ] **Chips visuales**
  - Verificar que los chips de tipo tienen colores diferentes
  - Verificar que los chips de estado son claros

- [ ] **Botones de acción**
  - Verificar que todos los botones tienen tooltips
  - Verificar que los iconos son claros

### Rutas
- [ ] **Columnas configurables**
  - Click en menú de columnas
  - Ocultar/mostrar columnas
  - Verificar que se guarda la configuración
  - Recargar página
  - Verificar que mantiene la configuración

- [ ] **Selección múltiple**
  - Seleccionar varias rutas
  - Verificar que el contador es correcto
  - Verificar que los botones de acción múltiple funcionan

- [ ] **Filtros visuales**
  - Aplicar filtros
  - Verificar que se muestran chips de filtros activos
  - Click en X de un chip
  - Verificar que se remueve ese filtro

---

## 🧪 Pruebas de Estrés (Opcional)

### Volumen de Datos
- [ ] **Muchas localidades**
  - Crear 100+ localidades
  - Verificar que la paginación funciona
  - Verificar que la búsqueda es rápida

- [ ] **Muchas rutas**
  - Crear 100+ rutas
  - Verificar que la tabla carga rápido
  - Verificar que los filtros funcionan

### Sincronización Masiva
- [ ] **Actualizar localidad muy usada**
  - Identificar localidad usada en 10+ rutas
  - Actualizar su nombre
  - Verificar que todas las rutas se actualizan
  - Verificar que no hay errores

---

## 📊 Resultados

### Resumen
- **Total de pruebas:** ___
- **Pruebas exitosas:** ___
- **Pruebas fallidas:** ___
- **Pruebas pendientes:** ___

### Problemas Encontrados
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Observaciones
_______________________________________________
_______________________________________________
_______________________________________________

---

## ✅ Aprobación

- [ ] Todas las funcionalidades básicas funcionan
- [ ] La protección de eliminación funciona correctamente
- [ ] La sincronización automática funciona
- [ ] La interfaz es clara y usable
- [ ] No hay errores críticos

**Fecha de verificación:** _______________
**Verificado por:** _______________
**Estado:** [ ] APROBADO  [ ] REQUIERE CORRECCIONES

---

## 📝 Notas Adicionales

_______________________________________________
_______________________________________________
_______________________________________________
