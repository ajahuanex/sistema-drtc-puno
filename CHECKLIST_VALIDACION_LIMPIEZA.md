# ✅ Checklist de Validación - Limpieza SIRRET

## 🔍 Validación Frontend

### Compilación
- [ ] `npm run build` sin errores
- [ ] No hay warnings de TypeScript
- [ ] No hay warnings de Angular
- [ ] Archivos generados correctamente

### Funcionalidad de Localidades
- [ ] Página de localidades carga correctamente
- [ ] Tabla de localidades se muestra
- [ ] Paginación funciona
- [ ] Ordenamiento funciona
- [ ] Búsqueda funciona
- [ ] Filtros funcionan
- [ ] Crear localidad funciona
- [ ] Editar localidad funciona
- [ ] Eliminar localidad funciona (con protección)
- [ ] Toggle estado funciona
- [ ] Mapa de localidades funciona
- [ ] Importación de GeoJSON funciona
- [ ] Exportación de localidades funciona

### Rendimiento
- [ ] Carga de página < 2 segundos
- [ ] Búsqueda responde rápidamente
- [ ] Filtros responden rápidamente
- [ ] No hay memory leaks
- [ ] No hay console errors

### Integración
- [ ] Localidades se usan en rutas
- [ ] Localidades se usan en vehículos
- [ ] Localidades se usan en resoluciones
- [ ] Aliases funcionan correctamente
- [ ] Centros poblados funcionan

---

## 🔍 Validación Backend

### Compilación
- [ ] `python -m py_compile app/main.py` sin errores
- [ ] Imports correctos
- [ ] No hay módulos faltantes
- [ ] No hay conflictos de nombres

### Routers
- [ ] `localidades_router` registrado
- [ ] `localidades_alias_router` registrado
- [ ] `geometrias_router` registrado
- [ ] `nivel_territorial_router` registrado
- [ ] NO hay `importar_geojson_router`
- [ ] NO hay `localidades_import_geojson_router`
- [ ] NO hay `localidades_geojson_router`

### Endpoints CRUD
- [ ] POST /api/v1/localidades (crear)
- [ ] GET /api/v1/localidades (obtener)
- [ ] GET /api/v1/localidades/{id} (obtener por ID)
- [ ] PUT /api/v1/localidades/{id} (actualizar)
- [ ] DELETE /api/v1/localidades/{id} (eliminar)
- [ ] PATCH /api/v1/localidades/{id}/toggle-estado (toggle)

### Endpoints de Búsqueda
- [ ] GET /api/v1/localidades/buscar (búsqueda)
- [ ] GET /api/v1/localidades/activas (activas)
- [ ] GET /api/v1/localidades/paginadas (paginadas)

### Endpoints de Importación
- [ ] POST /api/v1/localidades/importar (importar archivo)
- [ ] POST /api/v1/localidades/importar-desde-geojson (importar GeoJSON)
- [ ] GET /api/v1/localidades/exportar (exportar)

### Endpoints de Operaciones
- [ ] POST /api/v1/localidades/operaciones-masivas (operaciones masivas)
- [ ] POST /api/v1/localidades/validar-ubigeo (validar UBIGEO)
- [ ] GET /api/v1/localidades/{id}/verificar-uso (verificar uso)
- [ ] GET /api/v1/localidades/{id}/distancia/{destino_id} (distancia)

### Endpoints de Centros Poblados
- [ ] GET /api/v1/localidades/distrito/{id} (por distrito)
- [ ] GET /api/v1/localidades/estadisticas (estadísticas)
- [ ] POST /api/v1/localidades/validar-limpiar (validar y limpiar)

### Endpoints de Aliases
- [ ] POST /api/v1/localidades-alias (crear alias)
- [ ] GET /api/v1/localidades-alias (obtener aliases)
- [ ] GET /api/v1/localidades-alias/{id} (obtener por ID)
- [ ] PUT /api/v1/localidades-alias/{id} (actualizar)
- [ ] DELETE /api/v1/localidades-alias/{id} (eliminar)

### Funcionalidad
- [ ] Crear localidad funciona
- [ ] Actualizar localidad funciona
- [ ] Eliminar localidad funciona
- [ ] Búsqueda funciona
- [ ] Filtros funcionan
- [ ] Paginación funciona
- [ ] Importación de GeoJSON funciona
- [ ] Exportación funciona
- [ ] Operaciones masivas funcionan
- [ ] Validación de UBIGEO funciona
- [ ] Verificación de uso funciona
- [ ] Cálculo de distancia funciona
- [ ] Aliases funcionan
- [ ] Centros poblados funcionan

### Rendimiento
- [ ] Respuesta < 500ms para búsqueda
- [ ] Respuesta < 1s para importación
- [ ] Respuesta < 500ms para filtros
- [ ] No hay timeouts
- [ ] No hay memory leaks

### Integración
- [ ] Localidades se usan en rutas
- [ ] Localidades se usan en vehículos
- [ ] Localidades se usan en resoluciones
- [ ] Sincronización de nombres funciona
- [ ] Protección de eliminación funciona

---

## 📊 Validación de Cambios

### Frontend
- [ ] Métodos eliminados: 12
- [ ] Métodos consolidados: 3
- [ ] Métodos simplificados: 8
- [ ] Líneas eliminadas: ~300
- [ ] Reducción de complejidad: ~35%

### Backend
- [ ] Routers eliminados: 2
- [ ] Endpoints consolidados: 4+
- [ ] Scripts eliminados: 10+
- [ ] Líneas eliminadas: ~500+
- [ ] Reducción de complejidad: ~40%

---

## 🧪 Testing

### Pruebas Unitarias
- [ ] Servicio de localidades
- [ ] Componente base
- [ ] Componente principal
- [ ] Modelos

### Pruebas de Integración
- [ ] Frontend ↔ Backend
- [ ] Localidades ↔ Rutas
- [ ] Localidades ↔ Vehículos
- [ ] Localidades ↔ Resoluciones

### Pruebas End-to-End
- [ ] Crear localidad completa
- [ ] Editar localidad completa
- [ ] Eliminar localidad completa
- [ ] Importar localidades
- [ ] Exportar localidades
- [ ] Buscar localidades
- [ ] Filtrar localidades

---

## 📝 Documentación

- [ ] README actualizado
- [ ] Cambios documentados
- [ ] Guías actualizadas
- [ ] Comentarios en código
- [ ] Docstrings actualizados

---

## 🚀 Deployment

- [ ] Cambios en git
- [ ] Commit message claro
- [ ] Pull request creado
- [ ] Code review completado
- [ ] Tests pasados
- [ ] Merge a main
- [ ] Deploy a staging
- [ ] Deploy a producción

---

## 📋 Resumen Final

### Completado
- [x] Análisis de código
- [x] Identificación de duplicados
- [x] Limpieza de frontend
- [x] Documentación de cambios

### Pendiente
- [ ] Limpieza de backend
- [ ] Testing completo
- [ ] Deployment
- [ ] Monitoreo

---

## ⚠️ Notas Importantes

1. **Backup**: Asegurar que hay backup antes de cambios
2. **Testing**: Probar todos los endpoints
3. **Documentación**: Mantener documentación actualizada
4. **Comunicación**: Informar al equipo de cambios
5. **Monitoreo**: Monitorear después de deployment

---

## 📞 Contacto

Para preguntas o problemas:
1. Revisar documentación generada
2. Revisar logs del sistema
3. Contactar al equipo de desarrollo

---

## ✨ Conclusión

Cuando todos los checkboxes estén marcados, la limpieza estará completa y lista para producción.

**Fecha de inicio**: 2026-03-15
**Fecha de finalización**: [Pendiente]
**Estado**: En progreso ⏳
