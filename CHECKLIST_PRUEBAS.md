# ✅ Checklist de Pruebas - Sistema de Vehículos

## 📋 Instrucciones
Marca cada casilla con `[x]` cuando completes la prueba.

---

## 🚀 Preparación (5 min)

### Servicios
- [ ] MongoDB Compass abierto y conectado
- [ ] Backend corriendo en `http://localhost:8000`
- [ ] Frontend corriendo en `http://localhost:4200`
- [ ] Al menos 1 empresa creada en el sistema

### Verificación Rápida
```bash
# Ejecutar script automatizado
python test_sistema_vehiculos.py

# O en Windows
test_rapido.bat
```

---

## 🧪 Pruebas Automatizadas (10 min)

### API - VehiculoData
- [ ] ✅ Crear VehiculoData (POST /api/vehiculos-solo)
- [ ] ✅ Obtener VehiculoData por ID (GET /api/vehiculos-solo/{id})
- [ ] ✅ Buscar VehiculoData por placa (GET /api/vehiculos-solo?placa=XXX)
- [ ] ✅ Listar todos los VehiculoData (GET /api/vehiculos-solo)

### API - Vehiculo
- [ ] ✅ Crear Vehículo con vehiculoDataId (POST /api/vehiculos)
- [ ] ✅ Obtener Vehículo por ID (GET /api/vehiculos/{id})
- [ ] ✅ Verificar que incluye vehiculoDataId
- [ ] ✅ Listar todos los Vehículos (GET /api/vehiculos)

### Validaciones API
- [ ] ✅ Rechaza vehículo sin vehiculoDataId (o lo acepta por compatibilidad)
- [ ] ✅ Rechaza vehículo sin empresa
- [ ] ✅ Rechaza vehículo sin tipo de servicio

---

## 🖥️ Pruebas de Frontend (15 min)

### Módulo VehiculoData (Datos Técnicos)

#### Crear VehiculoData
- [ ] Abrir `http://localhost:4200/vehiculos-solo/nuevo`
- [ ] Llenar formulario con datos de prueba
- [ ] Click en "Guardar"
- [ ] ✅ Mensaje de éxito aparece
- [ ] ✅ Redirige a lista de vehículos-solo
- [ ] ✅ Nuevo vehículo aparece en la lista

#### Editar VehiculoData
- [ ] Click en "Editar" de un vehículo-solo
- [ ] Modificar algún campo (ej: marca)
- [ ] Click en "Guardar"
- [ ] ✅ Mensaje de éxito aparece
- [ ] ✅ Cambios se reflejan en la lista

#### Ver Detalle VehiculoData
- [ ] Click en "Ver" de un vehículo-solo
- [ ] ✅ Muestra todos los datos técnicos
- [ ] ✅ Muestra placa, marca, modelo
- [ ] ✅ Muestra motor, chasis, VIN
- [ ] ✅ Muestra dimensiones y pesos

### Módulo Vehiculo (Administrativo)

#### Crear Vehículo - Flujo Completo
- [ ] Abrir `http://localhost:4200/vehiculos/nuevo`
- [ ] Ingresar placa existente (de VehiculoData)
- [ ] ✅ Sistema busca automáticamente
- [ ] ✅ Muestra mensaje "Datos técnicos encontrados"
- [ ] ✅ Muestra resumen: MARCA MODELO (AÑO) - CATEGORÍA
- [ ] Seleccionar empresa
- [ ] Seleccionar tipo de servicio
- [ ] Seleccionar estado
- [ ] Agregar observaciones (opcional)
- [ ] Click en "Guardar"
- [ ] ✅ Mensaje de éxito aparece
- [ ] ✅ Redirige a lista de vehículos
- [ ] ✅ Nuevo vehículo aparece en la lista

#### Crear Vehículo - Placa No Existe
- [ ] Abrir `http://localhost:4200/vehiculos/nuevo`
- [ ] Ingresar placa que NO existe
- [ ] ✅ Muestra mensaje "Vehículo no encontrado en datos técnicos"
- [ ] ✅ Muestra botón "Crear Datos Técnicos"
- [ ] ✅ Botón "Guardar" está deshabilitado
- [ ] Click en "Crear Datos Técnicos"
- [ ] ✅ Redirige a formulario de VehiculoData
- [ ] ✅ Placa ya está pre-llenada

#### Editar Vehículo
- [ ] Click en "Editar" de un vehículo
- [ ] Cambiar estado (ej: ACTIVO → MANTENIMIENTO)
- [ ] Modificar observaciones
- [ ] Click en "Guardar"
- [ ] ✅ Mensaje de éxito aparece
- [ ] ✅ Cambios se reflejan en la lista

#### Ver Detalle Vehículo
- [ ] Click en "Ver" de un vehículo
- [ ] ✅ Muestra datos administrativos:
  - [ ] Placa
  - [ ] Empresa
  - [ ] Tipo de servicio
  - [ ] Estado
  - [ ] Resolución (si tiene)
  - [ ] Rutas asignadas (si tiene)
- [ ] ✅ Muestra datos técnicos (de VehiculoData):
  - [ ] Marca y modelo
  - [ ] Año de fabricación
  - [ ] Categoría
  - [ ] Motor y chasis
  - [ ] Capacidad de pasajeros
- [ ] ✅ No hay duplicación de datos

### Validaciones Frontend

#### Campos Requeridos
- [ ] Intentar crear vehículo sin placa
- [ ] ✅ Muestra error "La placa es requerida"
- [ ] Intentar crear vehículo sin empresa
- [ ] ✅ Muestra error "La empresa es requerida"
- [ ] Intentar crear vehículo sin tipo de servicio
- [ ] ✅ Muestra error "El tipo de servicio es requerido"

#### Formato de Placa
- [ ] Ingresar placa con formato inválido (ej: "ABC123")
- [ ] ✅ Muestra error de formato
- [ ] Ingresar placa con formato válido (ej: "ABC-123")
- [ ] ✅ Acepta la placa

---

## 🔄 Pruebas de Compatibilidad (10 min)

### Vehículos Legacy (Creados antes de la refactorización)

#### Listar Vehículos Legacy
- [ ] Abrir lista de vehículos
- [ ] ✅ Vehículos antiguos aparecen en la lista
- [ ] ✅ No hay errores en consola (F12)

#### Ver Detalle Vehículo Legacy
- [ ] Click en "Ver" de un vehículo antiguo
- [ ] ✅ Muestra datos correctamente
- [ ] ✅ Muestra datos técnicos (aunque estén duplicados)
- [ ] ✅ No hay errores en consola

#### Editar Vehículo Legacy
- [ ] Click en "Editar" de un vehículo antiguo
- [ ] Modificar algún campo
- [ ] Click en "Guardar"
- [ ] ✅ Guarda correctamente
- [ ] ✅ No hay errores en consola

---

## 🔍 Pruebas de Búsqueda y Filtros (5 min)

### Búsqueda de Vehículos
- [ ] Buscar por placa exacta
- [ ] ✅ Encuentra el vehículo
- [ ] Buscar por placa parcial
- [ ] ✅ Muestra resultados coincidentes
- [ ] Buscar por empresa
- [ ] ✅ Filtra correctamente

### Filtros
- [ ] Filtrar por estado (ACTIVO)
- [ ] ✅ Muestra solo vehículos activos
- [ ] Filtrar por tipo de servicio
- [ ] ✅ Muestra solo vehículos del tipo seleccionado
- [ ] Combinar múltiples filtros
- [ ] ✅ Aplica todos los filtros correctamente

---

## 📊 Pruebas de Datos (5 min)

### Integridad de Datos

#### Verificar en MongoDB Compass
- [ ] Abrir MongoDB Compass
- [ ] Conectar a `mongodb://localhost:27017`
- [ ] Abrir base de datos del proyecto
- [ ] Ver colección `vehiculo_solo` (VehiculoData)
  - [ ] ✅ Tiene documentos
  - [ ] ✅ Campos correctos (placa_actual, marca, modelo, etc.)
- [ ] Ver colección `vehiculos` (Vehiculo)
  - [ ] ✅ Tiene documentos
  - [ ] ✅ Campo `vehiculoDataId` presente
  - [ ] ✅ Campo `tipoServicio` presente
  - [ ] ✅ Campo `empresaActualId` presente

#### Verificar Relaciones
- [ ] Copiar un `vehiculoDataId` de un vehículo
- [ ] Buscar ese ID en la colección `vehiculo_solo`
- [ ] ✅ El documento existe
- [ ] ✅ La placa coincide

---

## 🐛 Pruebas de Errores (5 min)

### Manejo de Errores

#### Backend Caído
- [ ] Detener el backend (Ctrl+C)
- [ ] Intentar crear un vehículo desde el frontend
- [ ] ✅ Muestra mensaje de error apropiado
- [ ] ✅ No se cuelga la aplicación
- [ ] Reiniciar backend
- [ ] ✅ Sistema vuelve a funcionar

#### Datos Inválidos
- [ ] Intentar crear VehiculoData con año inválido (ej: 1800)
- [ ] ✅ Muestra error de validación
- [ ] Intentar crear VehiculoData con asientos negativos
- [ ] ✅ Muestra error de validación

---

## 📈 Pruebas de Rendimiento (Opcional)

### Carga de Datos
- [ ] Crear 10 VehiculoData
- [ ] ✅ Todos se crean correctamente
- [ ] Crear 10 Vehículos vinculados
- [ ] ✅ Todos se crean correctamente
- [ ] Listar todos los vehículos
- [ ] ✅ Carga en menos de 2 segundos

---

## ✅ Criterios de Éxito

### Mínimo Requerido (Sistema Funcional)
- [ ] ✅ Crear VehiculoData funciona
- [ ] ✅ Crear Vehículo con vehiculoDataId funciona
- [ ] ✅ Búsqueda automática por placa funciona
- [ ] ✅ Ver detalle muestra datos completos
- [ ] ✅ No hay duplicación de datos técnicos

### Deseable (Sistema Robusto)
- [ ] ✅ Validaciones funcionan correctamente
- [ ] ✅ Manejo de errores apropiado
- [ ] ✅ Compatibilidad con vehículos legacy
- [ ] ✅ Búsqueda y filtros funcionan
- [ ] ✅ Rendimiento aceptable

### Excelente (Sistema Completo)
- [ ] ✅ Todas las pruebas automatizadas pasan
- [ ] ✅ Todas las pruebas manuales pasan
- [ ] ✅ No hay errores en consola
- [ ] ✅ Experiencia de usuario fluida
- [ ] ✅ Documentación completa

---

## 📝 Notas y Observaciones

### Problemas Encontrados
```
[Anota aquí cualquier problema que encuentres]

Ejemplo:
- Problema: Búsqueda por placa no funciona con mayúsculas/minúsculas
- Solución: Convertir a mayúsculas antes de buscar
```

### Mejoras Sugeridas
```
[Anota aquí mejoras que se te ocurran]

Ejemplo:
- Agregar autocompletado en búsqueda de placas
- Mostrar foto del vehículo en el detalle
```

---

## 🎯 Resumen Final

### Estadísticas
- Total de pruebas: _____ / _____
- Pruebas exitosas: _____
- Pruebas fallidas: _____
- Porcentaje de éxito: _____%

### Estado del Sistema
- [ ] ✅ Sistema LISTO para producción
- [ ] ⚠️ Sistema FUNCIONAL pero necesita ajustes
- [ ] ❌ Sistema NO FUNCIONAL, requiere correcciones

### Próximos Pasos
- [ ] Migrar vehículos existentes (si aplica)
- [ ] Capacitar usuarios
- [ ] Monitorear en producción
- [ ] Documentar lecciones aprendidas

---

**Fecha de prueba:** _______________  
**Probado por:** _______________  
**Tiempo total:** _______________  
**Resultado:** _______________
