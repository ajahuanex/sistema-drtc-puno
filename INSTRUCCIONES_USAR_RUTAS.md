# 📋 INSTRUCCIONES: Cómo Usar el Módulo de Rutas

## ⚠️ IMPORTANTE

Actualmente solo hay **1 empresa con resoluciones** en el sistema:

### ✅ Empresa con Resoluciones

**Nombre**: e.t. diez gatos  
**RUC**: 10123465798  
**ID**: 6932280be12a5bf6ec73d309  
**Resolución**: R-0001-2025 (PADRE, VIGENTE)

### ❌ Empresas SIN Resoluciones

1. **Transportes San Martín S.A.C.** (RUC: 20123456789)
2. **Empresa de Transportes Los Andes E.I.R.L.** (RUC: 20987654321)
3. **Transportes Titicaca S.R.L.** (RUC: 20456789123)
4. **123465** (RUC: 20132465798) ← **Esta es la que estás seleccionando**

---

## 🚀 Pasos para Crear Rutas

### Opción 1: Usar la Empresa Existente

1. **Refresca el navegador** (F5 o Ctrl+R)
2. Ve al módulo de **Rutas**
3. En el filtro de empresa, busca: **"e.t. diez gatos"** o **"10123465798"**
4. Selecciona la empresa
5. Deberías ver la resolución **"R-0001-2025"**
6. Selecciona la resolución
7. Click en **"Nueva Ruta"**
8. Completa los datos y guarda

### Opción 2: Crear Resolución para Otra Empresa

Si quieres usar una de las otras empresas, primero debes crear una resolución:

#### Paso 1: Crear Resolución

1. Ve al módulo de **Resoluciones**
2. Click en **"Nueva Resolución"**
3. Completa los datos:
   - **Empresa**: Selecciona la empresa deseada (ej: "123465")
   - **Tipo**: PADRE
   - **Número**: R-0002-2025
   - **Tipo Trámite**: AUTORIZACION_NUEVA
   - **Fecha de Emisión**: Hoy
   - **Fecha de Vigencia**: 1 año desde hoy
   - **Descripción**: Autorización de rutas
4. Click en **"Guardar"**

#### Paso 2: Crear Rutas

1. Ve al módulo de **Rutas**
2. Selecciona la empresa para la que creaste la resolución
3. Deberías ver la nueva resolución
4. Selecciona la resolución
5. Click en **"Nueva Ruta"**
6. Completa y guarda

---

## 🔍 Verificar Estado Actual

Ejecuta este comando para ver qué empresas tienen resoluciones:

```bash
python diagnosticar_problema_rutas.py
```

---

## 💡 Solución Rápida

Si quieres probar el sistema inmediatamente:

1. **Refresca el navegador** (F5)
2. En el módulo de Rutas, busca: **"10123465798"**
3. Selecciona **"e.t. diez gatos"**
4. Verás la resolución **"R-0001-2025"**
5. ¡Listo para crear rutas!

---

## 📝 Nota

El problema no es del sistema, sino que estás seleccionando una empresa que no tiene resoluciones. El sistema está funcionando correctamente.
