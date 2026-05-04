# Plan Completo - Módulo de Empresas

## 📊 Estado Actual

### ✅ Completado
- Modelo actualizado (empresa.model.ts)
- Componente listado (empresas.component.ts)
- Componente formulario (empresa-form.component.ts)
- Componente detalle (empresa-detail.component.ts)
- Servicio CRUD básico (empresa.service.ts)

### ❌ Falta Completar
1. **CRUD Completo** - Métodos faltantes en servicio
2. **Carga Masiva** - Importar empresas desde Excel
3. **Validaciones** - SUNAT, RUC, DNI
4. **Búsqueda Avanzada** - Filtros complejos
5. **Reportes** - Exportar datos
6. **Historial** - Auditoría de cambios
7. **Gestión de Personas** - CRUD de personas facultadas
8. **Gestión de Documentos** - CRUD de documentos

---

## 🎯 Plan de Implementación

### FASE 1: CRUD Completo (Prioridad: CRÍTICA)
**Objetivo:** Completar operaciones básicas

#### 1.1 Servicio (empresa.service.ts)
- ✅ getEmpresas() - Listado
- ✅ getEmpresa(id) - Detalle
- ✅ createEmpresa() - Crear
- ✅ updateEmpresa() - Actualizar
- ✅ deleteEmpresa() - Eliminar
- ❌ getEmpresasPaginadas() - Paginación
- ❌ filtrarEmpresas() - Filtros
- ❌ buscarEmpresas() - Búsqueda

#### 1.2 Componentes
- ✅ empresas.component.ts - Listado
- ✅ empresa-form.component.ts - Crear/Editar
- ✅ empresa-detail.component.ts - Detalle
- ❌ empresa-delete-modal.component.ts - Confirmación eliminar
- ❌ empresa-filtros.component.ts - Filtros avanzados

---

### FASE 2: Carga Masiva (Prioridad: ALTA)
**Objetivo:** Importar empresas desde Excel

#### 2.1 Servicio
- ❌ descargarPlantilla() - Descargar template Excel
- ❌ importarEmpresas() - Importar desde archivo
- ❌ validarCargaMasiva() - Validar datos
- ❌ procesarCargaMasiva() - Procesar importación

#### 2.2 Componentes
- ❌ carga-masiva-empresas.component.ts - Interfaz de carga
- ❌ preview-carga-masiva.component.ts - Vista previa
- ❌ resultado-carga-masiva.component.ts - Resultados

#### 2.3 Modelos
- ❌ CargaMasivaEmpresa interface
- ❌ ResultadoCargaMasiva interface
- ❌ ErrorCargaMasiva interface

---

### FASE 3: Validaciones (Prioridad: ALTA)
**Objetivo:** Validar datos de entrada

#### 3.1 Servicio
- ❌ validarRuc() - Validar RUC
- ❌ validarRucSunat() - Consultar SUNAT
- ❌ validarDni() - Validar DNI
- ❌ validarEmail() - Validar email
- ❌ validarTelefono() - Validar teléfono

#### 3.2 Validadores
- ❌ ruc.validator.ts
- ❌ dni.validator.ts
- ❌ email.validator.ts

---

### FASE 4: Búsqueda Avanzada (Prioridad: MEDIA)
**Objetivo:** Búsqueda y filtros complejos

#### 4.1 Servicio
- ❌ buscarGlobal() - Búsqueda en múltiples campos
- ❌ filtrarPorEstado() - Filtrar por estado
- ❌ filtrarPorFecha() - Filtrar por rango de fechas
- ❌ filtrarPorTipoServicio() - Filtrar por tipo

#### 4.2 Componentes
- ❌ empresa-busqueda-avanzada.component.ts
- ❌ empresa-filtros-sidebar.component.ts

---

### FASE 5: Reportes (Prioridad: MEDIA)
**Objetivo:** Exportar y generar reportes

#### 5.1 Servicio
- ❌ exportarExcel() - Exportar a Excel
- ❌ exportarPdf() - Exportar a PDF
- ❌ generarReporte() - Generar reporte

#### 5.2 Componentes
- ❌ empresa-exportar.component.ts
- ❌ empresa-reporte.component.ts

---

### FASE 6: Historial y Auditoría (Prioridad: MEDIA)
**Objetivo:** Registrar cambios

#### 6.1 Servicio
- ❌ getHistorialEmpresa() - Obtener historial
- ❌ registrarCambio() - Registrar cambio
- ❌ obtenerAuditoria() - Obtener auditoría

#### 6.2 Componentes
- ❌ empresa-historial.component.ts
- ❌ empresa-auditoria.component.ts

---

### FASE 7: Gestión de Personas (Prioridad: MEDIA)
**Objetivo:** CRUD de personas facultadas

#### 7.1 Servicio
- ❌ agregarPersona() - Agregar persona
- ❌ actualizarPersona() - Actualizar persona
- ❌ eliminarPersona() - Eliminar persona
- ❌ obtenerPersonas() - Listar personas

#### 7.2 Componentes
- ❌ empresa-personas.component.ts
- ❌ persona-form-modal.component.ts

---

### FASE 8: Gestión de Documentos (Prioridad: BAJA)
**Objetivo:** CRUD de documentos

#### 8.1 Servicio
- ❌ agregarDocumento() - Agregar documento
- ❌ actualizarDocumento() - Actualizar documento
- ❌ eliminarDocumento() - Eliminar documento
- ❌ obtenerDocumentos() - Listar documentos
- ❌ subirDocumento() - Subir archivo

#### 8.2 Componentes
- ❌ empresa-documentos.component.ts
- ❌ documento-form-modal.component.ts

---

## 📋 Checklist por Fase

### FASE 1: CRUD Completo
- [ ] Implementar getEmpresasPaginadas()
- [ ] Implementar filtrarEmpresas()
- [ ] Implementar buscarEmpresas()
- [ ] Crear empresa-delete-modal.component.ts
- [ ] Crear empresa-filtros.component.ts
- [ ] Pruebas unitarias

### FASE 2: Carga Masiva
- [ ] Crear plantilla Excel
- [ ] Implementar descargarPlantilla()
- [ ] Implementar importarEmpresas()
- [ ] Crear carga-masiva-empresas.component.ts
- [ ] Crear preview-carga-masiva.component.ts
- [ ] Pruebas de importación

### FASE 3: Validaciones
- [ ] Implementar validarRuc()
- [ ] Implementar validarRucSunat()
- [ ] Implementar validarDni()
- [ ] Crear validadores personalizados
- [ ] Integrar en formularios

### FASE 4: Búsqueda Avanzada
- [ ] Implementar buscarGlobal()
- [ ] Crear empresa-busqueda-avanzada.component.ts
- [ ] Integrar filtros en listado

### FASE 5: Reportes
- [ ] Implementar exportarExcel()
- [ ] Implementar exportarPdf()
- [ ] Crear empresa-exportar.component.ts

### FASE 6: Historial
- [ ] Implementar getHistorialEmpresa()
- [ ] Crear empresa-historial.component.ts
- [ ] Integrar en detalle

### FASE 7: Gestión de Personas
- [ ] Implementar CRUD de personas
- [ ] Crear empresa-personas.component.ts
- [ ] Integrar en formulario

### FASE 8: Gestión de Documentos
- [ ] Implementar CRUD de documentos
- [ ] Crear empresa-documentos.component.ts
- [ ] Integrar en detalle

---

## 🚀 Recomendación

**Empezar por FASE 1 (CRUD Completo)** porque:
1. Es crítica para el funcionamiento básico
2. Otras fases dependen de ella
3. Proporciona base sólida
4. Rápida de implementar

**Tiempo estimado:**
- FASE 1: 2-3 horas
- FASE 2: 3-4 horas
- FASE 3: 2-3 horas
- FASE 4: 2 horas
- FASE 5: 2 horas
- FASE 6: 2 horas
- FASE 7: 2 horas
- FASE 8: 2 horas

**Total: 17-23 horas**

---

**¿Por dónde empezamos?**
