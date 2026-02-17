# Solución Urgente: Años de Vigencia No Se Actualizan

## Problema

Las resoluciones se están guardando con 4 años de vigencia cuando deberían tener 10 años.

## Causa Identificada

El Excel que está usando **NO tiene la columna "Años Vigencia"** o los valores están vacíos.

## Solución Inmediata

### Opción 1: Actualizar Manualmente en MongoDB (MÁS RÁPIDO)

Si necesita corregir resoluciones ya importadas:

```javascript
// Conectar a MongoDB
use drtc_puno

// Ver resoluciones con problema
db.resoluciones.find(
  { 
    tipoResolucion: "PADRE",
    aniosVigencia: 4,
    fechaVigenciaFin: { $regex: "203[4-9]" }  // Fecha fin después de 2034
  },
  { 
    nroResolucion: 1, 
    aniosVigencia: 1, 
    fechaVigenciaInicio: 1,
    fechaVigenciaFin: 1 
  }
)

// Actualizar una resolución específica a 10 años
// Ejemplo: R-0685-2021 con inicio 19/12/2022 debería terminar 18/12/2032
db.resoluciones.updateOne(
  { nroResolucion: "R-0685-2021" },
  { 
    $set: { 
      aniosVigencia: 10,
      fechaVigenciaFin: "2032-12-18",  // Calcular: inicio + 10 años - 1 día
      fechaActualizacion: new Date().toISOString()
    } 
  }
)

// Actualizar otra resolución
db.resoluciones.updateOne(
  { nroResolucion: "R-0685-2022" },
  { 
    $set: { 
      aniosVigencia: 10,
      fechaVigenciaFin: "2031-11-18",  // Calcular: inicio + 10 años - 1 día
      fechaActualizacion: new Date().toISOString()
    } 
  }
)
```

### Opción 2: Reimportar con Excel Correcto

#### Paso 1: Descargar Nueva Plantilla

1. Ir a: http://localhost:4200/resoluciones/carga-masiva
2. Hacer clic en **"Descargar Plantilla"**
3. Abrir el archivo descargado

#### Paso 2: Verificar Estructura

El Excel debe tener estas columnas EN ESTE ORDEN:

```
A. Resolución Padre
B. Número Resolución
C. RUC Empresa
D. Fecha Emisión
E. Fecha Vigencia Inicio
F. Años Vigencia          ← ESTA COLUMNA ES CRÍTICA
G. Fecha Vigencia Fin
H. Tipo Resolución
...
```

#### Paso 3: Llenar Correctamente

Para R-0685-2021 (ejemplo):

| Columna | Valor | Notas |
|---------|-------|-------|
| B. Número Resolución | 0685-2021 | Sin R- |
| C. RUC Empresa | 20123456789 | 11 dígitos |
| D. Fecha Emisión | 19/12/2022 | dd/mm/yyyy |
| E. Fecha Vigencia Inicio | 19/12/2022 | dd/mm/yyyy |
| **F. Años Vigencia** | **10** | **NÚMERO ENTERO** |
| G. Fecha Vigencia Fin | 18/12/2032 | Se calcula automáticamente |
| H. Tipo Resolución | PADRE | |

#### Paso 4: Procesar

1. Seleccionar el archivo
2. Marcar "Procesar y Crear" (no solo validar)
3. Hacer clic en "Procesar Archivo"
4. Revisar logs del backend

## Cálculo de Fecha Fin

Para calcular manualmente la fecha fin:

```
Fecha Fin = Fecha Inicio + Años - 1 día
```

### Ejemplos:

**R-0685-2021:**
- Fecha Inicio: 19/12/2022
- Años: 10
- Fecha Fin: 19/12/2022 + 10 años - 1 día = **18/12/2032**

**R-0685-2022:**
- Fecha Inicio: 19/11/2021
- Años: 10
- Fecha Fin: 19/11/2021 + 10 años - 1 día = **18/11/2031**

## Script de Actualización Masiva

Si tiene muchas resoluciones para actualizar:

```javascript
// Actualizar todas las resoluciones que tienen fecha fin después de 2030
// pero solo 4 años de vigencia

db.resoluciones.find({
  tipoResolucion: "PADRE",
  aniosVigencia: 4,
  fechaVigenciaFin: { $gte: "2030-01-01" }
}).forEach(function(res) {
  // Calcular nueva fecha fin (inicio + 10 años - 1 día)
  var fechaInicio = new Date(res.fechaVigenciaInicio);
  var fechaFin = new Date(fechaInicio);
  fechaFin.setFullYear(fechaFin.getFullYear() + 10);
  fechaFin.setDate(fechaFin.getDate() - 1);
  
  var fechaFinStr = fechaFin.toISOString().split('T')[0];
  
  print("Actualizando " + res.nroResolucion + " a 10 años");
  print("  Fecha Inicio: " + res.fechaVigenciaInicio);
  print("  Nueva Fecha Fin: " + fechaFinStr);
  
  db.resoluciones.updateOne(
    { _id: res._id },
    { 
      $set: { 
        aniosVigencia: 10,
        fechaVigenciaFin: fechaFinStr,
        fechaActualizacion: new Date().toISOString()
      } 
    }
  );
});
```

## Verificación

Después de actualizar, verificar:

```javascript
// Ver todas las resoluciones PADRE con sus años de vigencia
db.resoluciones.find(
  { tipoResolucion: "PADRE", estaActivo: true },
  { 
    nroResolucion: 1, 
    aniosVigencia: 1, 
    fechaVigenciaInicio: 1,
    fechaVigenciaFin: 1 
  }
).sort({ nroResolucion: 1 })

// Contar por años de vigencia
db.resoluciones.aggregate([
  { $match: { tipoResolucion: "PADRE", estaActivo: true } },
  { $group: { 
      _id: "$aniosVigencia", 
      count: { $sum: 1 } 
  }},
  { $sort: { _id: 1 } }
])
```

## Prevención Futura

Para evitar este problema en el futuro:

1. ✅ Siempre descargar plantilla nueva desde el frontend
2. ✅ Verificar que la columna F sea "Años Vigencia"
3. ✅ Llenar con valores numéricos (4 o 10)
4. ✅ NO dejar vacío en resoluciones PADRE
5. ✅ Validar primero antes de procesar
6. ✅ Revisar logs del backend

## Logs del Backend

Al procesar, debe ver:

```
[DEBUG] Resolución R-0685-2021: Años Vigencia leído del Excel = '10' (tipo original: int)
[DEBUG] Resolución R-0685-2021: Años Vigencia convertido = 10
[DEBUG] Guardando resolución R-0685-2021: aniosVigencia = 10
```

Si ve:

```
[DEBUG] Resolución R-0685-2021: Años Vigencia vacío o NaN, usando 4 por defecto
```

Significa que la columna está vacía o no existe.

## Contacto

Si después de seguir estos pasos el problema persiste:

1. Enviar captura del Excel (mostrar columnas)
2. Enviar logs del backend al procesar
3. Enviar resultado de la consulta MongoDB

## Resumen Rápido

```
PROBLEMA: Todo se guarda con 4 años
CAUSA: Excel sin columna "Años Vigencia" o valores vacíos
SOLUCIÓN RÁPIDA: Actualizar en MongoDB con script
SOLUCIÓN CORRECTA: Descargar nueva plantilla y reimportar
```
