# REEMPLAZAR FILTRO COMPLEJO DE RESOLUCIONES

## 🎯 PROBLEMA IDENTIFICADO
El usuario sigue viendo el filtro complejo original en lugar del simplificado.

**Fecha:** 17 de Diciembre, 2025  
**Estado:** 🔧 Reemplazo necesario

---

## 🚨 SITUACIÓN ACTUAL

### ❌ **Lo que está pasando:**
- El sistema sigue usando el componente original complejo
- Los filtros simplificados creados no están siendo utilizados
- Se necesita reemplazar directamente en el routing/imports

---

## ✅ SOLUCIÓN INMEDIATA

### 1. **COMPONENTE MINIMALISTA CREADO**

#### Archivos nuevos:
- `frontend/src/app/shared/resoluciones-filters-minimal.component.ts`
- `frontend/src/app/components/resoluciones/resoluciones-minimal.component.ts`

#### Características del filtro minimalista:
```typescript
// Solo 2 filtros básicos:
- Búsqueda por número
- Estado (Vigente/Vencida)

// Sin complejidades:
- Sin panel de expansión
- Sin filtros múltiples
- Sin fechas
- Sin empresa selector
- Sin chips complejos
- Sin versión móvil separada
```

### 2. **PASOS PARA REEMPLAZAR**

#### Opción A: Cambiar en el routing
```typescript
// En app-routing.module.ts o routes.ts
{
  path: 'resoluciones',
  component: ResolucionesMinimalComponent  // ← Cambiar aquí
}
```

#### Opción B: Reemplazar el archivo original
```bash
# Hacer backup del original
mv frontend/src/app/components/resoluciones/resoluciones.component.ts frontend/src/app/components/resoluciones/resoluciones.component.backup.ts

# Copiar el minimalista
cp frontend/src/app/components/resoluciones/resoluciones-minimal.component.ts frontend/src/app/components/resoluciones/resoluciones.component.ts
```

#### Opción C: Modificar el componente actual
Reemplazar todo el contenido del archivo actual con la versión minimalista.

---

## 🔧 IMPLEMENTACIÓN INMEDIATA

### **Paso 1: Localizar el archivo de routing**

<function_calls>
<invoke name="fileSearch">
<parameter name="explanation">Buscando el archivo de routing para cambiar el componente de resoluciones