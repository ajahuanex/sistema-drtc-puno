# 📋 SCRIPT DE MIGRACIÓN - VEHICULO SOLO

## 🎯 OBJETIVO
Migrar datos existentes del módulo `Vehiculo` (administrativo) al nuevo módulo `VehiculoSolo` (técnico) y establecer las referencias entre ambos.

---

## 📊 ANÁLISIS DE DATOS A MIGRAR

### Datos en Vehiculo (Actual)
```typescript
interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anioFabricacion: number;
  categoria: string;
  carroceria?: string;
  color?: string;
  numeroSerie?: string;
  datosTecnicos: {
    motor: string;
    chasis: string;
    ejes: number;
    asientos: number;
    pesoNeto: number;
    pesoBruto: number;
    tipoCombustible: string;
    cilindrada?: number;
    // ...
  };
}
```

### Mapeo a VehiculoSolo
```typescript
Vehiculo → VehiculoSolo
{
  placa → placaActual
  numeroSerie → numeroSerie
  datosTecnicos.motor → numeroMotor
  datosTecnicos.chasis → vin (si tiene 17 dígitos) o numeroSerie
  marca → marca
  modelo → modelo
  anioFabricacion → anioFabricacion, anioModelo
  categoria → categoria
  carroceria → carroceria
  color → color
  datosTecnicos.tipoCombustible → combustible
  datosTecnicos.asientos → numeroAsientos, numeroPasajeros
  datosTecnicos.ejes → numeroEjes
  datosTecnicos.pesoNeto → pesoSeco
  datosTecnicos.pesoBruto → pesoBruto
  datosTecnicos.cilindrada → cilindrada
}
```

---

## 🔧 SCRIPT DE MIGRACIÓN (Python)

### 1. Script Backend
