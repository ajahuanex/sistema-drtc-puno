# Checklist - Actualización de Empresas

## ✅ Completado

### Modelo (empresa.model.ts)
- ✅ Agregado: `personasFacultadas: PersonaFacultada[]`
- ✅ Agregado: `datosContacto: DatosContactoEmpresa`
- ✅ Agregado: `estado: EstadoEmpresa`
- ✅ Agregado: `observaciones?: string`
- ✅ Interfaces: `PersonaFacultada`, `DatosContactoEmpresa`

### Componentes
- ✅ `empresas.component.ts` - Listado actualizado
- ✅ `empresa-form.component.ts` - Formulario con FormArray para personas

### Servicios
- ✅ `empresa.service.ts` - Servicio principal
- ✅ Eliminado: `empresa-consolidado.service.ts`

---

## ⚠️ FALTA POR HACER

### 1. **Modelo (empresa.model.ts)** - LIMPIAR
- ❌ Remover: `sitioWeb?: string;` (línea 189)
- ❌ Remover: `RepresentanteLegal` interface (ya no se usa)
- ❌ Remover: `CambioRepresentanteLegal` interface (ya no se usa)
- ❌ Remover: `EmpresaCambioRepresentante` interface (ya no se usa)
- ❌ Remover: `DatosSunat` interface (ya no se usa)
- ❌ Remover: `EmpresaReporte` interface (usa scoreRiesgo que no existe)

### 2. **Servicio empresa.service.ts** - REVISAR
- ❌ Verificar que no use `representanteLegal`
- ❌ Verificar que no use `sitioWeb`
- ❌ Verificar que no use `scoreRiesgo`
- ❌ Verificar que no use `codigoEmpresa`

### 3. **Componentes** - VERIFICAR
- ❌ Revisar si hay otros componentes que usen campos removidos
- ❌ Buscar referencias a `representanteLegal` en componentes
- ❌ Buscar referencias a `sitioWeb` en componentes

### 4. **Rutas** - CREAR/ACTUALIZAR
- ❌ Verificar que las rutas estén configuradas correctamente
- ❌ Verificar que apunten a los componentes correctos

---

## 🔍 Búsquedas Necesarias

```bash
# Buscar referencias a campos removidos
grep -r "representanteLegal" frontend/src/app --include="*.ts"
grep -r "sitioWeb" frontend/src/app --include="*.ts"
grep -r "scoreRiesgo" frontend/src/app --include="*.ts"
grep -r "codigoEmpresa" frontend/src/app --include="*.ts"
grep -r "datosSunat" frontend/src/app --include="*.ts"
```

---

## 📋 Prioridad

1. **CRÍTICO**: Limpiar modelo (remover campos obsoletos)
2. **ALTO**: Verificar servicio empresa.service.ts
3. **MEDIO**: Buscar referencias en componentes
4. **BAJO**: Verificar rutas

---

**Próximo paso**: Limpiar el modelo removiendo campos obsoletos
