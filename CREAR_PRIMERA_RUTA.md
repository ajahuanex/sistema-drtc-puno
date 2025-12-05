# 🚀 Cómo Crear tu Primera Ruta

## ❌ Problema Actual
No hay rutas en el sistema. Por eso no ves botones clickeables - ¡no hay filas en la tabla!

## ✅ Solución: Crear Rutas desde el Frontend

### Paso 1: Ir al Módulo de Rutas
```
http://localhost:4200/rutas
```

### Paso 2: Seleccionar Empresa
1. Haz clic en el dropdown "Empresa"
2. Selecciona una empresa (ej: "TRANSPORTES PUNO S.A.")

### Paso 3: Seleccionar Resolución
1. Haz clic en el dropdown "Resolución"
2. Selecciona una resolución VIGENTE
3. Solo aparecen resoluciones PADRE (sin padre)

### Paso 4: Crear Nueva Ruta
1. Haz clic en el botón azul "Nueva Ruta"
2. Se abrirá un modal
3. El código se genera automáticamente (01)

### Paso 5: Completar el Formulario
- **Origen**: Ej: "PUNO"
- **Destino**: Ej: "JULIACA"
- **Frecuencias**: Ej: "Diaria, cada 30 minutos"
- **Tipo de Ruta**: Selecciona "Interprovincial"
- **Itinerario** (opcional): Describe el recorrido
- **Observaciones** (opcional): Notas adicionales

### Paso 6: Guardar
1. Haz clic en "Guardar Ruta"
2. La ruta aparecerá en la tabla
3. Ahora SÍ podrás hacer clic en los botones

## 🎯 Crear Más Rutas

Una vez que tengas la primera ruta:
1. Mantén la misma empresa y resolución seleccionadas
2. Haz clic en "Nueva Ruta" nuevamente
3. El código será "02" (siguiente disponible)
4. Completa y guarda

## 📋 Ejemplo de Rutas

### Ruta 1:
- Código: 01
- Origen: PUNO
- Destino: JULIACA
- Frecuencias: Diaria, cada 30 minutos
- Tipo: Interurbana

### Ruta 2:
- Código: 02
- Origen: PUNO
- Destino: AREQUIPA
- Frecuencias: Diaria, 3 veces al día
- Tipo: Interprovincial

### Ruta 3:
- Código: 03
- Origen: JULIACA
- Destino: CUSCO
- Frecuencias: Diaria, 2 veces al día
- Tipo: Interprovincial

## ✅ Una Vez Creadas las Rutas

Podrás usar todos los botones:
- 👁️ Ver detalles
- ✏️ Editar
- ▶️/⏸️ Cambiar estado
- 🗑️ Eliminar

---

*El problema no era con los botones, ¡era que no había rutas!* 😊
