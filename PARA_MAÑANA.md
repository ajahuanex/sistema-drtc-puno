# 🌅 PARA MAÑANA - 5 de Diciembre 2024

## 🎯 Objetivo
Solucionar el problema de guardar rutas en el módulo de Rutas.

---

## 🚀 Inicio Rápido

### 1. Verificar Sistema
```bash
python verificar_sistema_completo.py
```

Deberías ver:
```
✅ MongoDB: CONECTADO
✅ Backend: CORRIENDO
✅ Frontend: CORRIENDO
✅ Login: FUNCIONANDO
```

### 2. Credenciales
```
URL:        http://localhost:4200
DNI:        12345678
Contraseña: admin123
```

### 3. Empresas con Resoluciones
- **e.t. diez gatos** (RUC: 10123465798) → R-0001-2025
- **123465** (RUC: 20132465798) → R-0002-2025

---

## 🔍 Problema a Resolver

### Síntoma
Al intentar crear una ruta:
1. ✅ Modal se abre correctamente
2. ✅ Resoluciones aparecen en el selector
3. ✅ Formulario se puede llenar
4. ❌ Al hacer click en "Guardar Ruta" no se guarda

### Diagnóstico Inicial
- Backend NO recibe petición POST
- Probablemente validación del formulario falla
- O servicio de rutas del frontend tiene error

---

## 📋 Pasos para Depurar

### Paso 1: Abrir Consola del Navegador
1. Presiona **F12**
2. Ve a la pestaña **Console**
3. Limpia la consola (icono 🚫)

### Paso 2: Intentar Crear Ruta
1. Ve a módulo de **Rutas**
2. Selecciona empresa: **"e.t. diez gatos"**
3. Selecciona resolución: **"R-0001-2025"**
4. Click en **"Nueva Ruta"**
5. Llena el formulario:
   - Código: `01`
   - Origen: `Puno`
   - Destino: `Juliaca`
   - Frecuencias: `Diaria`
   - Tipo: `Interprovincial`
6. Click en **"Guardar Ruta"**

### Paso 3: Revisar Errores
En la consola del navegador, busca:
- ❌ Errores en rojo
- ⚠️ Advertencias en amarillo
- 🔵 Peticiones HTTP (pestaña Network)

**Copia el error completo y compártelo**

---

## 🔧 Archivos a Revisar

### Frontend
1. **Modal de Crear Ruta**:
   - `frontend/src/app/components/rutas/agregar-ruta-modal.component.ts`
   - Revisar método `onSubmit()`
   - Revisar validaciones del formulario

2. **Servicio de Rutas**:
   - `frontend/src/app/services/ruta.service.ts`
   - Revisar método `createRuta()`
   - Verificar URL del endpoint

3. **Componente de Rutas**:
   - `frontend/src/app/components/rutas/rutas.component.ts`
   - Revisar método `nuevaRuta()`
   - Revisar cómo se cierra el modal

### Backend
1. **Router de Rutas**:
   - `backend/app/routers/rutas_router.py`
   - Verificar endpoint POST `/rutas`

2. **Servicio de Rutas**:
   - `backend/app/services/ruta_service.py`
   - Revisar método `create_ruta()`
   - Revisar validaciones

---

## 🐛 Posibles Causas

### 1. Validación del Formulario
```typescript
// Verificar en agregar-ruta-modal.component.ts
if (this.rutaForm.invalid) {
  console.log('Formulario inválido:', this.rutaForm.errors);
  return;
}
```

### 2. Campos Faltantes
```typescript
// Verificar que todos los campos requeridos estén en el formulario
codigoRuta: ['', Validators.required],
origen: ['', Validators.required],
destino: ['', Validators.required],
// etc.
```

### 3. Servicio No Conectado
```typescript
// Verificar en ruta.service.ts
createRuta(ruta: RutaCreate): Observable<Ruta> {
  const url = `${this.apiUrl}/rutas`; // ¿URL correcta?
  return this.http.post<Ruta>(url, ruta, { headers: this.getHeaders() });
}
```

### 4. Error en el Backend
```python
# Verificar en ruta_service.py
# ¿Hay alguna validación que falla?
# ¿Los campos están correctos?
```

---

## 🔍 Comandos de Diagnóstico

### Ver Logs del Backend
```bash
# Los logs aparecen en la consola donde corre el backend
# Busca errores cuando intentas crear la ruta
```

### Probar Endpoint Directamente
```bash
# Crear archivo test_crear_ruta.py
python test_crear_ruta.py
```

### Verificar Resoluciones
```bash
python mostrar_empresa_correcta.py
```

---

## 📝 Información para Compartir

Cuando encuentres el error, comparte:

1. **Error de la consola del navegador**:
   ```
   [Copia el error completo aquí]
   ```

2. **Pestaña Network**:
   - ¿Hay alguna petición POST a `/api/v1/rutas`?
   - ¿Qué status code devuelve? (200, 400, 500, etc.)
   - ¿Qué dice la respuesta?

3. **Logs del backend**:
   - ¿Aparece algún error cuando intentas guardar?

---

## ✅ Checklist de Verificación

Antes de empezar:
- [ ] MongoDB corriendo
- [ ] Backend corriendo (localhost:8000)
- [ ] Frontend corriendo (localhost:4200)
- [ ] Login funcionando
- [ ] Resoluciones aparecen en selector

Durante la depuración:
- [ ] Consola del navegador abierta (F12)
- [ ] Pestaña Network abierta
- [ ] Logs del backend visibles
- [ ] Intentar crear ruta
- [ ] Capturar error completo

---

## 🎓 Tips

1. **No te frustres**: Este tipo de problemas son comunes y se resuelven rápido una vez identificamos el error exacto.

2. **Logs son tus amigos**: La consola del navegador y los logs del backend te dirán exactamente qué está fallando.

3. **Prueba paso a paso**: Si no funciona, prueba cada parte por separado (formulario, servicio, backend).

4. **Comparte el error completo**: Cuanto más información compartas, más rápido lo resolvemos.

---

## 📞 Cuando Estés Listo

Simplemente di:
- "Aquí está el error: [error]"
- "La consola muestra: [mensaje]"
- "El backend dice: [log]"

Y continuaremos desde ahí.

---

**¡Nos vemos mañana!** 🚀
