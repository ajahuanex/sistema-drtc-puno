# Instrucciones para Debuggear el Frontend

## 🎯 Problema
El filtro de resolución no funciona en el frontend, aunque el backend está funcionando correctamente.

## 🔍 Pasos para Debuggear

### 1. Abrir el Frontend
1. Abrir el navegador y ir a la aplicación
2. Navegar al módulo de Rutas
3. Abrir las **Developer Tools** (F12)
4. Ir a la pestaña **Console**

### 2. Seleccionar una Empresa
1. En el filtro "Filtrar por Empresa", buscar **"Paputec"**
2. Seleccionar la empresa **Paputec**
3. **OBSERVAR LOS LOGS EN LA CONSOLE**

### 3. Logs Esperados
Deberías ver estos logs en la console:

```
🏢 EVENTO EMPRESA SELECCIONADA - INICIANDO PROCESO...
📊 DATOS DE LA EMPRESA: {empresa: "PAPUTEC S.A.C.", empresaId: "694186fec6302fb8566ba09e", ruc: "20123456789"}
✅ SIGNALS ACTUALIZADOS - EMPRESA SELECCIONADA
🧹 RESOLUCIÓN SELECCIONADA LIMPIADA
🔄 INICIANDO CARGA DE RESOLUCIONES...
📋 CARGANDO RESOLUCIONES DE LA EMPRESA CON RUTAS: 694186fec6302fb8566ba09e
🔄 INICIANDO PROCESO DE CARGA DE RESOLUCIONES...
✅ RUTAS DE LA EMPRESA OBTENIDAS: {total: 5, rutas: [...]}
📋 RESOLUCIONES CON RUTAS IDENTIFICADAS: {total: 2, ids: ["694187b1c6302fb8566ba0a0", "6941bb5d5e0d9aefe5627d84"]}
🔄 INICIANDO CARGA DE INFORMACIÓN DE RESOLUCIONES...
📋 Preparando carga de resolución: 694187b1c6302fb8566ba0a0
📋 Preparando carga de resolución: 6941bb5d5e0d9aefe5627d84
🔄 EJECUTANDO FORKJOIN CON 2 PROMESAS...
🎯 FORKJOIN COMPLETADO - PROCESANDO RESULTADOS...
✅ RESOLUCIONES CON RUTAS CARGADAS: {total: 2, resoluciones: [...]}
🔄 ACTUALIZANDO SIGNAL resolucionesEmpresa...
✅ SIGNAL ACTUALIZADO - VALOR ACTUAL: {total: 2, resoluciones: ["R-0003-2025", "R-0005-2025"]}
```

### 4. Verificar el Dropdown
Después de seleccionar la empresa, deberías ver:
- **Dropdown de resolución aparece** (antes estaba oculto)
- **2 resoluciones en el dropdown**:
  - R-0003-2025 (RENOVACION - PADRE)
  - R-0005-2025 (PRIMIGENIA - PADRE)

### 5. Probar el Filtro
1. Seleccionar **"R-0003-2025"** en el dropdown
2. Debería mostrar **4 rutas**
3. Seleccionar **"R-0005-2025"** en el dropdown  
4. Debería mostrar **1 ruta**

## 🚨 Posibles Problemas

### Problema 1: No aparecen logs
**Causa**: El método no se está ejecutando
**Solución**: Verificar que el evento `(optionSelected)` esté funcionando

### Problema 2: Error en forkJoin
**Causa**: Problema con RxJS o imports
**Verificar**: 
- Que `forkJoin` esté importado correctamente
- Que no haya errores de TypeScript

### Problema 3: Dropdown no aparece
**Causa**: El signal `resolucionesEmpresa` no se está actualizando
**Verificar**:
- Que el log "SIGNAL ACTUALIZADO" aparezca
- Que `this.resolucionesEmpresa().length > 0`

### Problema 4: Llamadas HTTP fallan
**Verificar en Network Tab**:
- `GET /empresas/{id}/rutas` → Debe devolver 5 rutas
- `GET /resoluciones/{id}` → Debe devolver información de resolución

## 🔧 Soluciones Rápidas

### Si no aparecen logs:
```typescript
// Agregar en onEmpresaSelected al inicio:
console.log('DEBUG: Método onEmpresaSelected ejecutado');
```

### Si forkJoin falla:
```typescript
// Reemplazar forkJoin con Promise.all:
Promise.all(resolucionesPromises.map(p => p.toPromise()))
  .then(resoluciones => {
    // ... resto del código
  });
```

### Si el dropdown no aparece:
```typescript
// Verificar en template que la condición sea correcta:
@if (empresaSeleccionada() && resolucionesEmpresa().length > 0) {
  // ... dropdown
}
```

## 📊 Datos de Prueba

**Empresa**: Paputec  
**ID**: `694186fec6302fb8566ba09e`  
**Resoluciones esperadas**:
- R-0003-2025 (4 rutas)
- R-0005-2025 (1 ruta)

## 🎯 Resultado Esperado

Al final del proceso:
1. ✅ Dropdown de resolución visible
2. ✅ 2 resoluciones en el dropdown
3. ✅ Filtro por resolución funciona
4. ✅ Se muestran las rutas correctas

---

**Si sigues estos pasos y encuentras el problema, documenta aquí la solución encontrada.**