# 🧪 TEST: Verificar Resoluciones en el Frontend

## Problema Detectado

El frontend no está recibiendo las resoluciones cuando seleccionas la empresa "123465".

## Prueba Manual en la Consola del Navegador

Abre la consola del navegador (F12) y ejecuta estos comandos:

### 1. Verificar el ID de la empresa seleccionada

```javascript
// Copia el ID que aparece cuando seleccionas la empresa
const empresaId = '693227ace12a5bf6ec73d308'; // ID de empresa 123465
console.log('Empresa ID:', empresaId);
```

### 2. Hacer petición directa al backend

```javascript
// Obtener el token del localStorage
const token = localStorage.getItem('access_token');

// Hacer petición
fetch(`http://localhost:8000/api/v1/resoluciones/filtros?empresa_id=${empresaId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('📋 Resoluciones recibidas:', data);
  console.log('Total:', data.length);
  data.forEach(r => {
    console.log(`  - ${r.nroResolucion} (${r.tipoResolucion}, ${r.estado})`);
    console.log(`    Empresa ID: ${r.empresaId}`);
    console.log(`    Tipo Trámite: ${r.tipoTramite}`);
  });
});
```

### 3. Verificar el servicio de Angular

```javascript
// En la consola, después de seleccionar la empresa
// Verifica qué está devolviendo el servicio
```

## Solución Temporal

Si el backend devuelve las resoluciones correctamente pero el frontend no las muestra:

### Opción 1: Limpiar Caché del Navegador

1. Presiona **Ctrl + Shift + Delete**
2. Selecciona "Caché" y "Cookies"
3. Click en "Limpiar datos"
4. Refresca la página (F5)

### Opción 2: Modo Incógnito

1. Abre una ventana de incógnito (Ctrl + Shift + N)
2. Ve a http://localhost:4200
3. Inicia sesión
4. Prueba el módulo de rutas

### Opción 3: Hard Refresh

1. Presiona **Ctrl + F5** (Windows) o **Cmd + Shift + R** (Mac)
2. Esto forzará la recarga completa sin caché

## Verificación del Backend

El backend YA está devolviendo correctamente las resoluciones:

```bash
python probar_filtro_resoluciones.py
```

Resultado esperado:
```
📋 RESOLUCIONES DE: 123465
   Empresa ID: 693227ace12a5bf6ec73d308
   ✅ 1 resolución(es) encontrada(s)
      ✅ R-0002-2025
```

## Posibles Causas

1. **Caché del navegador**: El frontend tiene datos antiguos en caché
2. **Token expirado**: El token de autenticación puede haber expirado
3. **CORS**: Problema de CORS entre frontend y backend
4. **Servicio de Angular**: El servicio puede estar usando datos mock en lugar del backend

## Solución Definitiva

Si nada funciona, necesitamos verificar el servicio de resoluciones del frontend:

```typescript
// En frontend/src/app/services/resolucion.service.ts
// Verificar que getResolucionesPorEmpresa esté usando el backend correcto
```

## Siguiente Paso

Por favor, ejecuta el comando en la consola del navegador (paso 2) y dime qué resultado obtienes.
