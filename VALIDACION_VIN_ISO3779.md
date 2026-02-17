# Validación VIN según ISO 3779

## ✅ IMPLEMENTACIÓN COMPLETA

### 📋 Norma ISO 3779

La norma **ISO 3779** establece que el carácter en la **posición 10** del VIN representa el año del modelo, pero este carácter se **repite cada 30 años**.

### 🔄 Ciclo de 30 Años

Cada letra o número representa **DOS años posibles**:

| Carácter | Año 1 | Año 2 | Carácter | Año 1 | Año 2 |
|----------|-------|-------|----------|-------|-------|
| A | 1980 | 2010 | Y | 2000 | 2030 |
| B | 1981 | 2011 | 1 | 2001 | 2031 |
| C | 1982 | 2012 | 2 | 2002 | 2032 |
| D | 1983 | 2013 | 3 | 2003 | 2033 |
| E | 1984 | 2014 | 4 | 2004 | 2034 |
| F | 1985 | 2015 | 5 | 2005 | 2035 |
| G | 1986 | 2016 | 6 | 2006 | 2036 |
| H | 1987 | 2017 | 7 | 2007 | 2037 |
| J | 1988 | 2018 | 8 | 2008 | 2038 |
| K | 1989 | 2019 | 9 | 2009 | 2039 |
| L | 1990 | 2020 | | | |
| M | 1991 | 2021 | | | |
| N | 1992 | 2022 | | | |
| P | 1993 | 2023 | | | |
| R | 1994 | 2024 | | | |
| S | 1995 | 2025 | | | |
| T | 1996 | 2026 | | | |
| V | 1997 | 2027 | | | |
| W | 1998 | 2028 | | | |
| X | 1999 | 2029 | | | |

**NOTA:** Las letras I, O, Q no se usan para evitar confusión con 1, 0.

---

## 🎯 Funcionalidad Implementada

### 1. Decodificación del VIN

Cuando el usuario ingresa un VIN de 17 caracteres:

✅ **Valida formato** (sin I, O, Q)  
✅ **Decodifica país** (posición 1)  
✅ **Decodifica fabricante** (posiciones 1-3)  
✅ **Decodifica AMBOS años posibles** (posición 10)

### 2. Validación Cruzada con Año de Fabricación

El sistema compara el año ingresado manualmente con los dos años posibles del VIN:

**Si coincide con alguno:**
- ✅ No muestra advertencia
- ✅ No agrega observación

**Si NO coincide con ninguno:**
- ⚠️ Muestra advertencia naranja
- 📝 Agrega observación automática para revisión manual

---

## 📝 Ejemplos de Uso

### Ejemplo 1: VIN con año 1981 o 2011

```
VIN: JTFSK22P5B0013653
     │││││││││││││││││
     │││└─────────────── Posición 10: B
     ││└──────────────── Fabricante: Toyota
     │└───────────────── País: Japón
     └────────────────── WMI: JTF

Decodificación:
- País: Japón
- Fabricante: Toyota
- Años posibles: 1981 o 2011
```

**Caso A: Usuario ingresa año 2011**
```
✅ VÁLIDO - Coincide con uno de los años posibles
No se genera advertencia ni observación
```

**Caso B: Usuario ingresa año 1981**
```
✅ VÁLIDO - Coincide con uno de los años posibles
No se genera advertencia ni observación
```

**Caso C: Usuario ingresa año 2015**
```
⚠️ ADVERTENCIA
Mensaje: "El año ingresado (2015) no coincide con los años posibles 
del VIN según ISO 3779: 1981 o 2011. Diferencia mínima: 4 años."

Observación automática:
[VALIDACIÓN AUTOMÁTICA - AÑO VIN] REVISAR: Año de fabricación 
ingresado (2015) NO coincide con los años posibles según VIN ISO 3779 
(1981 o 2011). Verificar tarjeta de propiedad y documentación del 
vehículo para confirmar el año correcto.
```

---

### Ejemplo 2: VIN con año 2012

```
VIN: JTFSK22P8C0017049
     │││││││││││││││││
     │││└─────────────── Posición 10: C
     ││└──────────────── Fabricante: Toyota
     │└───────────────── País: Japón
     └────────────────── WMI: JTF

Decodificación:
- País: Japón
- Fabricante: Toyota
- Años posibles: 1982 o 2012
```

**Usuario ingresa año 2012**
```
✅ VÁLIDO - Coincide con uno de los años posibles
```

---

## 🔍 Interfaz de Usuario

### Campo VIN
```
┌─────────────────────────────────────────┐
│ VIN / Número de Serie              ✓    │
│ JTFSK22P5B0013653                       │
│ Toyota - Japón (1981 o 2011)            │
└─────────────────────────────────────────┘
```

### Campo Año de Fabricación (con advertencia)
```
┌─────────────────────────────────────────┐
│ Año de Fabricación                      │
│ 2015                                    │
│ ⚠️ El año ingresado (2015) no coincide │
│ con los años posibles del VIN según     │
│ ISO 3779: 1981 o 2011.                  │
│ Diferencia mínima: 4 años.              │
└─────────────────────────────────────────┘
```

### Campo Observaciones (automático)
```
┌─────────────────────────────────────────┐
│ Observaciones                           │
│                                         │
│ [VALIDACIÓN AUTOMÁTICA - AÑO VIN]       │
│ REVISAR: Año de fabricación ingresado   │
│ (2015) NO coincide con los años         │
│ posibles según VIN ISO 3779 (1981 o     │
│ 2011). Verificar tarjeta de propiedad   │
│ y documentación del vehículo para       │
│ confirmar el año correcto.              │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎨 Indicadores Visuales

### Colores

- **Verde** (#4caf50): VIN válido (17 caracteres)
- **Azul** (#2196f3): Años posibles del VIN
- **Naranja** (#ff9800): Advertencia de inconsistencia
- **Rojo**: Error de validación

### Iconos

- ✓ (check_circle): VIN válido
- ⚠️: Advertencia de año inconsistente

---

## 🔧 Archivos Modificados

1. **frontend/src/app/validators/vin.validator.ts**
   - Actualizado para ISO 3779
   - Retorna ambos años posibles
   - Interface VINInfo con anioAlternativo

2. **frontend/src/app/components/vehiculos-solo/vehiculo-solo-form.component.ts**
   - Validación cruzada con ambos años
   - Observaciones automáticas mejoradas
   - Hint con ambos años posibles

---

## ✅ Ventajas de la Implementación

1. **Cumple con ISO 3779** - Reconoce el ciclo de 30 años
2. **No bloquea el guardado** - Solo advierte al usuario
3. **Observaciones automáticas** - Para revisión posterior
4. **Marcador especial** - Fácil identificación de validaciones automáticas
5. **Actualización en tiempo real** - Mientras el usuario escribe
6. **Información completa** - Muestra ambos años posibles
7. **Cálculo de diferencia** - Indica qué tan lejos está del año más cercano

---

## 🧪 Casos de Prueba

### Prueba 1: VIN válido con año coincidente
```
VIN: JTFSK22P5B0013653
Año ingresado: 2011
Resultado esperado: ✅ Sin advertencia
```

### Prueba 2: VIN válido con año alternativo coincidente
```
VIN: JTFSK22P5B0013653
Año ingresado: 1981
Resultado esperado: ✅ Sin advertencia
```

### Prueba 3: VIN válido con año NO coincidente
```
VIN: JTFSK22P5B0013653
Año ingresado: 2015
Resultado esperado: ⚠️ Advertencia + Observación automática
```

### Prueba 4: VIN incompleto
```
VIN: JTFSK22P5B
Año ingresado: 2011
Resultado esperado: Sin validación (VIN incompleto)
```

### Prueba 5: Sin VIN
```
VIN: (vacío)
Año ingresado: 2011
Resultado esperado: Sin validación
```

---

## 📚 Referencias

- **ISO 3779**: Road vehicles — Vehicle identification number (VIN) — Content and structure
- Posición 10 del VIN: Año del modelo
- Ciclo de repetición: 30 años
- Caracteres excluidos: I, O, Q (para evitar confusión)

---

## 🎯 Conclusión

La implementación ahora cumple **completamente** con la norma ISO 3779, mostrando ambos años posibles y validando correctamente contra cualquiera de ellos. Esto evita falsos positivos y proporciona información precisa al usuario para que pueda verificar con la documentación del vehículo.
