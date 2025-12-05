# 🔧 Arreglar Fondo Oscuro en Vehículos

## Problema
El módulo de vehículos se ve con fondo oscuro/negro.

## Solución Rápida (2 minutos)

### 1️⃣ Ejecutar Script
```bash
CAMBIAR_VEHICULOS_ESTILO.bat
```
Presiona **1** y Enter

### 2️⃣ Reiniciar Servidor
```bash
cd frontend
npm start
```

### 3️⃣ Verificar
Abre: `http://localhost:4200/vehiculos`

## ✅ Debe Verse Así

```
┌─────────────────────────────────────────┐
│ VEHÍCULOS REGISTRADOS      [BOTONES]    │ ← Fondo BLANCO
├─────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐       │
│ │   🚗   │ │   ✓    │ │   ⚠    │       │ ← Tarjetas con
│ │   150  │ │   120  │ │   10   │       │   COLORES
│ │ TOTAL  │ │ ACTIVOS│ │SUSPEND.│       │
│ └────────┘ └────────┘ └────────┘       │
├─────────────────────────────────────────┤
│ ▼ FILTROS AVANZADOS                     │ ← Fondo BLANCO
├─────────────────────────────────────────┤
│ TABLA DE VEHÍCULOS                      │ ← Fondo BLANCO
└─────────────────────────────────────────┘
```

## ❌ NO Debe Verse Así

```
┌─────────────────────────────────────────┐
│ ███████████████████████████████████████ │ ← Fondo OSCURO
│ ███████████████████████████████████████ │
│ ███████████████████████████████████████ │
└─────────────────────────────────────────┘
```

## 🔍 Verificar Archivos

```bash
VERIFICAR_FONDO_CLARO.bat
```

Este script verifica que todo esté correcto.

## 🆘 Si Sigue Oscuro

### Opción A: Limpiar Caché
```bash
# Detener servidor (Ctrl+C)
cd frontend
rm -rf .angular
npm start
# Refrescar navegador (Ctrl+F5)
```

### Opción B: Aplicar Manualmente
```bash
copy frontend\src\app\components\vehiculos\vehiculos-clean.component.scss frontend\src\app\components\vehiculos\vehiculos.component.scss
cd frontend
npm start
```

### Opción C: Verificar en Navegador
1. Presiona F12
2. Ve a "Elements" o "Elementos"
3. Busca el elemento con clase `page-header`
4. Verifica que tenga `background-color: #ffffff`
5. Si no lo tiene, hay un estilo global sobrescribiendo

## 📞 Ayuda Adicional

- **SOLUCION_FONDO_OSCURO_VEHICULOS.md** - Detalles técnicos
- **RESUMEN_SOLUCION_FONDO_CLARO.md** - Resumen completo
- **VEHICULOS_ESTILO_EMPRESAS.md** - Guía del diseño

## ✨ Resultado Esperado

Después de aplicar la solución:
- ✅ Fondo claro y limpio
- ✅ Idéntico al módulo de empresas
- ✅ Fácil de leer
- ✅ Profesional

---

**Tiempo**: 2 minutos
**Dificultad**: Fácil
**Reversible**: Sí
