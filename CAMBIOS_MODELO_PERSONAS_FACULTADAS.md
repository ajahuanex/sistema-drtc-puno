# Cambios en Modelo de Empresa - Personas Facultadas

## 🎯 Objetivo
Permitir que cualquier persona autorizada (representante legal, gerente, administrador, o con carta poder) pueda administrar la empresa y realizar trámites.

## 📋 Cambios Realizados

### Antes
```typescript
representanteLegal: RepresentanteLegal;  // Solo una persona específica
```

### Después
```typescript
personasFacultadas: PersonaFacultada[];  // Array de personas autorizadas
```

## 🆕 Nueva Interface: PersonaFacultada

```typescript
interface PersonaFacultada {
  dni: string;                            // Identificador único
  nombres: string;                        // Nombres de la persona
  apellidos: string;                      // Apellidos de la persona
  cargo: string;                          // Gerente, Administrador, Representante Legal, etc.
  tipoFacultad: string;                   // Representante Legal, Carta Poder, Poder Notarial, etc.
  email?: string;                         // Email de contacto
  telefono?: string;                      // Teléfono de contacto
  direccion?: string;                     // Dirección de la persona
  fechaVigenciaDesde?: Date;              // Fecha desde la cual es válida la facultad
  fechaVigenciaHasta?: Date;              // Fecha hasta la cual es válida la facultad
  documentoFacultad?: string;             // Número de documento que acredita la facultad
  estaActivo: boolean;                    // Activo/Inactivo
}
```

## 📊 Campos Explicados

| Campo | Tipo | Descripción |
|-------|------|-------------|
| dni | string | DNI de la persona (requerido) |
| nombres | string | Nombres (requerido) |
| apellidos | string | Apellidos (requerido) |
| cargo | string | Posición en la empresa (Gerente, Administrador, etc.) |
| tipoFacultad | string | Tipo de autorización (Representante Legal, Carta Poder, etc.) |
| email | string? | Email de contacto |
| telefono | string? | Teléfono de contacto |
| direccion | string? | Dirección de la persona |
| fechaVigenciaDesde | Date? | Fecha de inicio de la facultad |
| fechaVigenciaHasta | Date? | Fecha de fin de la facultad |
| documentoFacultad | string? | Número de documento que acredita (Resolución, Poder, etc.) |
| estaActivo | boolean | Si la persona está activa o no |

## 🔄 Cambios en Interfaces Relacionadas

### EmpresaCreate
```typescript
// Antes
representanteLegal: RepresentanteLegal;

// Después
personasFacultadas: PersonaFacultada[];
```

### EmpresaUpdate
```typescript
// Antes
representanteLegal?: RepresentanteLegal;

// Después
personasFacultadas?: PersonaFacultada[];
```

### Empresa
```typescript
// Antes
representanteLegal: RepresentanteLegal;

// Después
personasFacultadas: PersonaFacultada[];  // Personas autorizadas para realizar trámites
```

## 💡 Casos de Uso

### Caso 1: Representante Legal
```typescript
{
  dni: "12345678",
  nombres: "Juan",
  apellidos: "Pérez",
  cargo: "Representante Legal",
  tipoFacultad: "Representante Legal",
  email: "juan@empresa.com",
  telefono: "987654321",
  estaActivo: true
}
```

### Caso 2: Gerente con Carta Poder
```typescript
{
  dni: "87654321",
  nombres: "María",
  apellidos: "García",
  cargo: "Gerente General",
  tipoFacultad: "Carta Poder",
  documentoFacultad: "CP-2024-001",
  fechaVigenciaDesde: "2024-01-01",
  fechaVigenciaHasta: "2025-12-31",
  email: "maria@empresa.com",
  estaActivo: true
}
```

### Caso 3: Administrador con Poder Notarial
```typescript
{
  dni: "11223344",
  nombres: "Carlos",
  apellidos: "López",
  cargo: "Administrador",
  tipoFacultad: "Poder Notarial",
  documentoFacultad: "PN-2024-5678",
  fechaVigenciaDesde: "2024-03-15",
  email: "carlos@empresa.com",
  telefono: "912345678",
  estaActivo: true
}
```

## 🎯 Ventajas

✅ **Flexibilidad**: Permite múltiples personas autorizadas
✅ **Claridad**: Define cargo y tipo de facultad
✅ **Vigencia**: Control de fechas de validez
✅ **Trazabilidad**: Documento que acredita la facultad
✅ **Escalabilidad**: Fácil agregar o remover personas
✅ **Auditoría**: Historial de cambios en personas facultadas

## 📝 Validaciones Necesarias

- DNI: Único por empresa
- Cargo: No vacío
- Tipo Facultad: No vacío
- Fecha Vigencia: Desde <= Hasta (si ambas existen)
- Email: Formato válido (si existe)
- Teléfono: Formato válido (si existe)

## 🔗 Relaciones

```
Empresa
├── PersonaFacultada[] (1:N)
│   ├── dni
│   ├── cargo
│   ├── tipoFacultad
│   └── vigencia
└── RepresentanteLegal (1:1) - Mantener para compatibilidad
```

## 📌 Próximos Pasos

1. ✅ Modelo actualizado
2. ⏳ Actualizar componentes (tabla, detalle, formulario)
3. ⏳ Agregar gestión de personas facultadas
4. ⏳ Implementar validación de vigencia
5. ⏳ Agregar historial de cambios en personas

---

**Estado**: ✅ COMPLETADO
**Fecha**: 21/04/2026
**Cambio**: RepresentanteLegal → PersonasFacultadas[]
**Beneficio**: Mayor flexibilidad y control administrativo
