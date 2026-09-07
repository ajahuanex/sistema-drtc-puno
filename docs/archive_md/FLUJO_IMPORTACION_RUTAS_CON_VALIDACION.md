# 📥 Flujo de Importación de Rutas con Validación Binaria

## 🔄 Proceso de Importación Masiva

### Paso 1: Carga del archivo
```
Usuario sube Excel/CSV con rutas
↓
Backend recibe archivo
↓
Parser extrae datos de cada fila
```

### Paso 2: Validación y marcado binario
Para cada ruta en el archivo:

```python
async def procesar_ruta_importada(fila: dict) -> dict:
    """
    Procesa una fila del archivo y establece validacionBinaria
    """
    validacion = ['0', '0', '0']  # [Localidades, Resolución, RUC]
    errores = []
    advertencias = []
    
    # 1️⃣ VALIDAR RUC (Bit 0)
    ruc_normalizado = normalizar_ruc(fila['ruc'])
    empresa = await buscar_empresa_por_ruc(ruc_normalizado)
    
    if empresa:
        validacion[2] = '1'  # ✅ RUC validado
        empresa_data = {
            "id": empresa.id,
            "ruc": empresa.ruc,
            "razonSocial": empresa.razonSocial
        }
    else:
        validacion[2] = '0'  # ❌ RUC NO encontrado
        advertencias.append(f"RUC {ruc_normalizado} no existe en módulo Empresas")
        # Crear empresa embebida con datos del Excel
        empresa_data = {
            "id": "",
            "ruc": ruc_normalizado,
            "razonSocial": {"principal": fila['razon_social']}
        }
    
    # 2️⃣ VALIDAR RESOLUCIÓN (Bit 1)
    nro_resolucion = fila['resolucion']
    resolucion = await buscar_resolucion_por_numero(nro_resolucion)
    
    if resolucion:
        validacion[1] = '1'  # ✅ Resolución validada
        resolucion_data = {
            "id": resolucion.id,
            "nroResolucion": resolucion.nroResolucion,
            "tipoResolucion": resolucion.tipoResolucion,
            "estado": resolucion.estado
        }
    else:
        validacion[1] = '0'  # ❌ Resolución NO encontrada
        advertencias.append(f"Resolución {nro_resolucion} no existe")
        # Crear resolución embebida con datos del Excel
        resolucion_data = {
            "id": "",
            "nroResolucion": nro_resolucion,
            "tipoResolucion": "PADRE",
            "estado": "VIGENTE"
        }
    
    # 3️⃣ VALIDAR LOCALIDADES (Bit 2)
    # Validar origen
    origen = await buscar_localidad_por_nombre(fila['origen'])
    origen_ok = origen is not None
    
    # Validar destino
    destino = await buscar_localidad_por_nombre(fila['destino'])
    destino_ok = destino is not None
    
    # Validar itinerario
    itinerario_ok = True
    itinerario_data = []
    if fila.get('itinerario'):
        paradas = fila['itinerario'].split(',')
        for orden, nombre_parada in enumerate(paradas, 1):
            localidad = await buscar_localidad_por_nombre(nombre_parada.strip())
            if localidad:
                itinerario_data.append({
                    "id": localidad.id,
                    "nombre": localidad.nombre,
                    "orden": orden
                })
            else:
                itinerario_ok = False
                advertencias.append(f"Localidad '{nombre_parada}' no encontrada")
    
    # Establecer bit de localidades
    if origen_ok and destino_ok and itinerario_ok:
        validacion[0] = '1'  # ✅ Todas las localidades validadas
    else:
        validacion[0] = '0'  # ❌ Alguna localidad falta
        if not origen_ok:
            errores.append(f"Origen '{fila['origen']}' no existe")
        if not destino_ok:
            errores.append(f"Destino '{fila['destino']}' no existe")
    
    # CONSTRUIR ESTADO BINARIO FINAL
    validacion_binaria = ''.join(validacion)
    
    # CREAR OBJETO RUTA
    ruta = {
        "codigoRuta": fila['codigo'],
        "nombre": f"{fila['origen']} - {fila['destino']}",
        "origen": {
            "id": origen.id if origen else "",
            "nombre": fila['origen']
        },
        "destino": {
            "id": destino.id if destino else "",
            "nombre": fila['destino']
        },
        "itinerario": itinerario_data,
        "empresa": empresa_data,
        "resolucion": resolucion_data,
        "frecuencia": procesar_frecuencia(fila),
        "tipoServicio": fila.get('tipo_servicio', 'PASAJEROS'),
        "estado": "ACTIVA",
        "validacionBinaria": validacion_binaria,  # 🔐 ESTADO DE SINCRONIZACIÓN
        "estaActivo": True
    }
    
    return {
        "ruta": ruta,
        "validacion_binaria": validacion_binaria,
        "errores": errores,
        "advertencias": advertencias
    }
```

### Paso 3: Reporte de importación

```json
{
  "resumen": {
    "total_filas": 50,
    "procesadas": 50,
    "exitosas": 42,
    "con_advertencias": 8,
    "rechazadas": 0
  },
  "detalle_validacion": {
    "completamente_sincronizadas": 42,  // "111"
    "parcialmente_sincronizadas": 8,
    "sin_sincronizar": 0,
    "distribucion": {
      "111": 42,  // ✅ Todo OK
      "011": 5,   // ❌ Localidades pendientes
      "101": 2,   // ❌ Resolución pendiente
      "110": 1    // ❌ RUC pendiente
    }
  },
  "rutas_con_advertencias": [
    {
      "fila": 15,
      "codigo": "R-015",
      "validacion_binaria": "011",
      "advertencias": [
        "Localidad 'Caracoto' no encontrada en el sistema",
        "Se creará referencia temporal hasta sincronizar"
      ]
    },
    {
      "fila": 23,
      "codigo": "R-023",
      "validacion_binaria": "101",
      "advertencias": [
        "Resolución '045-2023-DRTC' no existe",
        "Verificar datos de resolución"
      ]
    }
  ]
}
```

## 📊 Visualización en Frontend

### Tabla de rutas importadas con indicadores:

```
┌──────────┬─────────────────┬──────────┬────────────────────────┐
│ Código   │ Ruta            │ Estado   │ Sincronización         │
├──────────┼─────────────────┼──────────┼────────────────────────┤
│ R-001    │ Juliaca - Puno  │ ACTIVA   │ 🟢 111 (Sincronizado)  │
│ R-002    │ Puno - Ilave    │ ACTIVA   │ 🟢 111 (Sincronizado)  │
│ R-015    │ Juliaca - Azán  │ ACTIVA   │ 🟡 011 (Sin localidad) │
│ R-023    │ Puno - Juli     │ ACTIVA   │ 🟡 101 (Sin resolución)│
│ R-032    │ Ilave - Yunguyo │ ACTIVA   │ 🟡 110 (Sin empresa)   │
└──────────┴─────────────────┴──────────┴────────────────────────┘
```

### Componente de estado:

```typescript
getEstadoSincronizacion(validacionBinaria: string) {
  switch(validacionBinaria) {
    case '111':
      return {
        color: 'success',
        icon: 'check_circle',
        texto: 'Sincronizado',
        detalle: 'Todos los datos validados'
      };
    case '000':
      return {
        color: 'danger',
        icon: 'error',
        texto: 'Sin sincronizar',
        detalle: 'Ningún dato validado'
      };
    default:
      return {
        color: 'warning',
        icon: 'warning',
        texto: 'Parcial',
        detalle: this.getDetalleParcial(validacionBinaria)
      };
  }
}

getDetalleParcial(bits: string): string {
  const problemas = [];
  if (bits[2] === '0') problemas.push('Empresa no validada');
  if (bits[1] === '0') problemas.push('Resolución no validada');
  if (bits[0] === '0') problemas.push('Localidades no validadas');
  return problemas.join(', ');
}
```

## 🔧 Sincronización Posterior

### Opción 1: Sincronización manual individual
```typescript
async sincronizarRuta(rutaId: string) {
  // Llama al endpoint que re-valida todo
  const resultado = await this.http.post(
    `/api/rutas/${rutaId}/sincronizar`,
    {}
  ).toPromise();
  
  // resultado.validacionBinaria actualizado
  // "011" → "111" si ahora encuentra todos los datos
}
```

### Opción 2: Sincronización masiva
```typescript
async sincronizarTodasLasRutas() {
  const resultado = await this.http.post(
    '/api/rutas/sincronizar-todo',
    {
      validar_empresas: true,
      validar_resoluciones: true,
      validar_localidades: true
    }
  ).toPromise();
  
  console.log(resultado);
  // {
  //   "actualizadas": 8,
  //   "sin_cambios": 42,
  //   "nuevas_sincronizadas": 6,
  //   "aun_con_problemas": 2
  // }
}
```

### Opción 3: Sincronización automática programada
```python
@app.on_event("startup")
async def setup_periodic_sync():
    """
    Ejecuta sincronización cada 24 horas
    """
    scheduler.add_job(
        sincronizar_rutas_automatico,
        'interval',
        hours=24,
        id='sync_rutas'
    )
```

## 🎯 Estrategias de Importación

### Estrategia 1: Importación Optimista (Recomendada)
```python
# Importa TODO, marca lo que falta sincronizar
- Crea la ruta aunque falten datos relacionados
- Establece validacionBinaria según lo encontrado
- Usuario puede sincronizar después
- Ventaja: No bloquea la importación
```

**Ejemplo:**
```
Importar 100 rutas:
- 80 con "111" (todo OK)
- 15 con "011" (localidades pendientes)
- 5 con "101" (resoluciones pendientes)

✅ Se importan las 100
⚠️ Se marca cuáles necesitan sincronización
```

### Estrategia 2: Importación Estricta
```python
# Solo importa si TODO está validado
- Rechaza rutas que no tengan validacionBinaria = "111"
- Usuario debe corregir archivo y reimportar
- Ventaja: Solo datos 100% validados
```

**Ejemplo:**
```
Importar 100 rutas:
- 80 con "111" → ✅ Se importan
- 20 con problemas → ❌ Se rechazan

Usuario debe:
1. Revisar las 20 rechazadas
2. Corregir datos (agregar localidades faltantes, etc.)
3. Reimportar solo esas 20
```

### Estrategia 3: Importación por Lotes con Auto-corrección
```python
# Intenta corregir automáticamente
- Busca coincidencias aproximadas (fuzzy matching)
- Crea entidades faltantes automáticamente
- Marca para revisión manual
```

**Ejemplo:**
```
Ruta con origen "JULIAKA" (typo):
1. Busca "JULIAKA" → No existe
2. Fuzzy match → Encuentra "JULIACA" (95% similar)
3. Sugiere corrección automática
4. Importa con advertencia: "Origen corregido: JULIAKA → JULIACA"
5. validacionBinaria = "111" (corregido automáticamente)
```

## 📋 Ejemplo Completo de Importación

### Archivo Excel:
```
codigo    | origen   | destino | ruc         | resolucion      | frecuencia
----------|----------|---------|-------------|-----------------|------------
R-001     | Juliaca  | Puno    | 20123456789 | 001-2024-DRTC  | 3 diarios
R-002     | Puno     | Ilave   | 20987654321 | 002-2024-DRTC  | 2 diarios
R-003     | Juliaca  | Azán    | 20123456789 | 003-2024-DRTC  | 1 diario
```

### Resultado de Importación:
```json
{
  "rutas_importadas": [
    {
      "codigo": "R-001",
      "validacion_binaria": "111",
      "estado": "✅ Sincronizado",
      "detalles": "Todos los datos validados correctamente"
    },
    {
      "codigo": "R-002",
      "validacion_binaria": "111",
      "estado": "✅ Sincronizado",
      "detalles": "Todos los datos validados correctamente"
    },
    {
      "codigo": "R-003",
      "validacion_binaria": "011",
      "estado": "⚠️ Parcial",
      "detalles": "Localidad 'Azán' no encontrada en el sistema",
      "acciones_sugeridas": [
        "Agregar localidad 'Azán' al módulo de Localidades",
        "Luego ejecutar sincronización de rutas"
      ]
    }
  ]
}
```

## 🚀 Mejora Continua

### Dashboard de Sincronización:
```
╔══════════════════════════════════════════════╗
║  📊 Estado de Sincronización de Rutas        ║
╠══════════════════════════════════════════════╣
║  Total de rutas: 150                         ║
║                                              ║
║  🟢 Sincronizadas (111):     142 (94.7%)    ║
║  🟡 Parciales:                  8 (5.3%)     ║
║  🔴 Sin sincronizar (000):     0 (0%)        ║
║                                              ║
║  Problemas detectados:                       ║
║  • 5 rutas sin localidades validadas         ║
║  • 2 rutas sin resolución validada           ║
║  • 1 ruta sin empresa validada               ║
║                                              ║
║  [Sincronizar Todo] [Ver Detalles]          ║
╚══════════════════════════════════════════════╝
```

Este sistema te permite:
✅ Importar datos aunque no estén 100% limpios
✅ Saber exactamente qué falta por validar
✅ Sincronizar después cuando los datos relacionados estén disponibles
✅ Mantener integridad referencial sin bloquear operaciones
