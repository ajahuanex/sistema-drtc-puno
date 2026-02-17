# 📋 CAMPOS DE VEHÍCULOS - CONSOLIDACIÓN FINAL

## ✅ Cambios Realizados

### 1. Categoría y Clase → Unificados

**Antes:**
- Campo 1: `categoria` (M2, M3, N1)
- Campo 2: `clase` (C3, C2)

**Ahora:**
- Campo único: `categoria` (M2-C3, M3-C3, N1-C2)

**Justificación:**
- En la práctica, categoría y clase siempre van juntas
- Formato real de los datos: "M2-C3", "M3-C3"
- Simplifica el formulario
- Evita inconsistencias entre campos separados
- Más flexible para diferentes combinaciones

**Ejemplos válidos:**
- M2-C3
- M3-C3
- N1-C2
- M2
- N1

### 2. Cilindrada - Aclaración

**Campo:** `cilindrada`
**Unidad:** Centímetros cúbicos (cc)
**Descripción:** Capacidad del motor, NO número de cilindros

**Ejemplos:**
- 5L = 5000 cc
- 611981 cc (Mercedes Benz Sprinter)

## 📊 Estructura Final del Formulario

### Sección 1: Identificación (3 campos)
1. **Placa** * (requerido)
2. VIN / Número de Serie
3. Número de Motor

### Sección 2: Datos Técnicos (7 campos)
4. Marca
5. Modelo
6. Año de Fabricación
7. Color
8. **Categoría** (formato: M2-C3, M3-C3, etc.)
9. Carrocería
10. Combustible

### Sección 3: Capacidades y Motor (5 campos)
11. Número de Asientos
12. Número de Pasajeros
13. **Cilindrada (cc)** - Capacidad del motor
14. Número de Ejes
15. Número de Ruedas

### Sección 4: Pesos y Dimensiones (6 campos)
16. Peso Bruto (kg)
17. Peso Neto (kg)
18. Carga Útil (kg)
19. Largo (m)
20. Ancho (m)
21. Alto (m)

### Sección 5: Observaciones (1 campo)
22. Observaciones

**Total: 22 campos** (reducido de 23 por la consolidación)

## 🔄 Mapeo con Datos Reales

| Dato Real | Campo en Sistema | Notas |
|-----------|------------------|-------|
| PLACA | placaActual | ✅ |
| MARCA | marca | ✅ |
| MODELO | modelo | ✅ |
| ANIO_FABRICACION | anioFabricacion | ✅ |
| COLOR | color | ✅ |
| CATEGORIA + CLASE | categoria | ✅ Consolidado (M2-C3) |
| CARROCERIA | carroceria | ✅ |
| COMBUSTIBLE | combustible | ✅ |
| NUMERO_MOTOR | numeroMotor | ✅ |
| NUMERO_SERIE_VIN | vin | ✅ |
| NUM_PASAJEROS | numeroPasajeros | ✅ |
| NUM_ASIENTOS | numeroAsientos | ✅ |
| CILINDROS | cilindrada | ✅ Capacidad en cc |
| EJES | numeroEjes | ✅ |
| RUEDAS | numeroRuedas | ✅ |
| PESO_BRUTO | pesoBruto | ✅ |
| PESO_NETO | pesoSeco | ✅ |
| CARGA_UTIL | cargaUtil | ✅ |
| LARGO | longitud | ✅ |
| ANCHO | ancho | ✅ |
| ALTO | altura | ✅ |
| OBSERVACIONES | observaciones | ✅ |

## 💡 Ventajas de la Consolidación

1. ✅ **Simplicidad**: Un campo menos en el formulario
2. ✅ **Claridad**: Refleja exactamente cómo se usan los datos
3. ✅ **Flexibilidad**: Acepta cualquier combinación (M2-C3, M3-C3, etc.)
4. ✅ **Consistencia**: Evita errores de combinaciones inválidas
5. ✅ **Mantenibilidad**: Más fácil de mantener y validar

## 🎯 Ejemplo de Uso

### Vehículo 1: Toyota Hiace
```json
{
  "placaActual": "002ZR-315",
  "marca": "TOYOTA",
  "modelo": "HIACE",
  "anioFabricacion": 2012,
  "color": "BLANCO",
  "categoria": "M2",
  "carroceria": "Microbus",
  "combustible": "Diesel",
  "numeroMotor": "5L6197498",
  "vin": "JTFSK22P8C0017049",
  "numeroPasajeros": 15,
  "numeroAsientos": 16,
  "cilindrada": 4243,
  "numeroEjes": 2,
  "numeroRuedas": 4,
  "pesoBruto": 3.25,
  "pesoSeco": 2.059,
  "cargaUtil": 1.191,
  "longitud": 5.38,
  "ancho": 1.88,
  "altura": 2.28
}
```

### Vehículo 2: Mercedes Benz Sprinter
```json
{
  "placaActual": "100A0A-952",
  "marca": "MERCEDES BENZ",
  "modelo": "SPRINTER",
  "anioFabricacion": 2010,
  "color": "BLANCO",
  "categoria": "M2-C3",
  "carroceria": "Minibus",
  "combustible": "Diesel",
  "numeroMotor": "611981701",
  "vin": "152398AC904663BE038811",
  "numeroPasajeros": 19,
  "numeroAsientos": 20,
  "cilindrada": 4244,
  "numeroEjes": 2,
  "numeroRuedas": 4,
  "pesoBruto": 4.6,
  "pesoSeco": 2.891,
  "cargaUtil": 1.71,
  "longitud": 6.99,
  "ancho": 1.99,
  "altura": 2.76
}
```

## ✅ Conclusión

La consolidación de Categoría y Clase en un solo campo hace el sistema:
- Más simple
- Más claro
- Más fácil de usar
- Más alineado con la realidad de los datos

El formulario ahora tiene **22 campos bien organizados** que cubren todos los datos técnicos necesarios.
