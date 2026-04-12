# 🔍 Errores Encontrados - Revisión Sistemática

## 1. CORS Error
**Ubicación:** Frontend intentando acceder a `/api/v1/empresas`
**Problema:** CORS policy bloqueando acceso desde `http://localhost:4200` a `http://localhost:8000`
**Estado:** ⚠️ Requiere revisión

---

## 2. HTTP 500 - Internal Server Error (CRÍTICO)
**Ubicación:** GET `/api/v1/empresas?skip=0&limit=10`
**Problema:** El backend está devolviendo error 500
**Estado:** ❌ Crítico

### Causa Raíz Identificada:
Los documentos en la colección 'empresas' NO coinciden con el modelo `EmpresaInDB`:

**Estructura en BD:**
```json
{
  "ruc": "20123456789",
  "razonSocial": { "principal": "...", "comercial": "..." },
  "estado": "ACTIVO",
  "representanteLegal": { "nombres": "...", "apellidos": "...", "dni": "..." },
  "tipoEmpresa": "PERSONAS",
  "modalidadServicio": "REGULAR"
}
```

**Estructura esperada por modelo:**
```json
{
  "ruc": "20123456789",
  "razonSocial": { "principal": "...", "sunat": "...", "minimo": "..." },
  "estado": "AUTORIZADA|EN_TRAMITE|SUSPENDIDA|CANCELADA|DADA_DE_BAJA",
  "representanteLegal": { "nombres": "...", "apellidos": "...", "dni": "...", "email": "...", "telefono": "...", "direccion": "..." },
  "tiposServicio": ["PERSONAS", "TURISMO", ...],
  "documentos": [],
  "auditoria": [],
  "historialEventos": [],
  "historialEstados": [],
  "historialRepresentantes": [],
  "resolucionesPrimigeniasIds": [],
  "vehiculosHabilitadosIds": [],
  "conductoresHabilitadosIds": [],
  "rutasAutorizadasIds": []
}
```

### Diferencias Clave:
1. ❌ `estado` en BD es "ACTIVO" pero modelo espera enum específico
2. ❌ `razonSocial.comercial` en BD pero modelo espera `sunat` y `minimo`
3. ❌ Faltan campos complejos: `documentos`, `auditoria`, `historialEventos`, etc.
4. ❌ `tipoEmpresa` en BD pero modelo espera `tiposServicio` (lista)
5. ❌ Campos adicionales en BD: `codigoEmpresa`, `modalidadServicio`, `ambitoServicio`

---

## 3. HTTP Error 0 - Unknown Error
**Ubicación:** Múltiples endpoints
**Problema:** Error de conexión desconocido
**Estado:** ⚠️ Requiere investigación

---

## Soluciones Propuestas

### Opción A: Actualizar Modelo (Recomendado)
Hacer el modelo más flexible para aceptar datos existentes:
- Hacer campos opcionales
- Agregar validadores para mapear datos antiguos
- Usar `populate_by_name=True` en Pydantic

### Opción B: Migrar Datos
Actualizar todos los documentos en la BD para que coincidan con el modelo

### Opción C: Crear Servicio de Mapeo
Crear un servicio que mapee datos antiguos al nuevo modelo

---

## Plan de Acción Inmediato

1. **Hacer campos opcionales en Empresa**
2. **Agregar validadores para mapear datos**
3. **Crear script de migración de datos**
4. **Probar endpoint de empresas**

---

## Comandos Útiles

```bash
# Ver estructura de documentos en BD
docker exec sirret-mongodb-dev mongosh -u admin -p admin123 --authenticationDatabase admin drtc_db --eval "db.empresas.findOne()"

# Contar documentos
docker exec sirret-mongodb-dev mongosh -u admin -p admin123 --authenticationDatabase admin drtc_db --eval "db.empresas.countDocuments()"
```
