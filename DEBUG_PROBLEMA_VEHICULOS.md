# 🔍 Debug: Problema con Módulo de Vehículos

## 🐛 Síntomas

1. **Error 403 Forbidden** al cargar vehículos
2. **Error de CORS** en el endpoint `/api/v1/vehiculos/`
3. **Otros módulos funcionan** (rutas: 454 ✅, localidades ✅)

## 🔍 Análisis

### Error en Consola
```
Access to fetch at 'http://localhost:8000/api/v1/vehiculos/' 
(redirected from 'http://localhost:8000/api/v1/vehiculos') 
from origin 'http://localhost:4200' has been blocked by CORS policy
```

### Observaciones
- ✅ Rutas funcionan (454 rutas cargadas)
- ✅ Localidades funcionan
- ❌ Vehículos no funcionan (403 Forbidden)

## 🎯 Posibles Causas

### 1. Redirección de Barra Final
FastAPI está redirigiendo `/vehiculos/` → `/vehiculos`
- Primera petición: 403
- Redirección: Bloqueada por CORS

### 2. Problema de Autenticación
- Token inválido o expirado
- Pero otros módulos funcionan, así que no es esto

### 3. Endpoint Específico
- El endpoint de vehículos tiene alguna protección especial
- O está mal configurado

## ✅ Soluciones a Probar

### Solución 1: Verificar URL en el Servicio
```typescript
// Asegurar que NO tiene barra final
getVehiculos(): Observable<Vehiculo[]> {
  return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos`, {
    headers: this.getHeaders()
  });
}
```

### Solución 2: Verificar Backend
```bash
# Probar endpoint directamente
curl http://localhost:8000/api/v1/vehiculos
```

### Solución 3: Verificar Logs del Backend
Buscar en la consola del backend:
- ¿Hay errores al procesar la petición?
- ¿Qué status code retorna?
- ¿Hay algún middleware bloqueando?

### Solución 4: Agregar Endpoint Alternativo
```python
# En vehiculos_router.py
@router.get("", response_model=List[VehiculoResponse])  # Sin barra
@router.get("/", response_model=List[VehiculoResponse])  # Con barra
async def get_vehiculos(...):
    # ...
```

## 🧪 Pruebas a Realizar

### 1. Probar Endpoint Directamente
```bash
# Sin autenticación
curl http://localhost:8000/api/v1/vehiculos

# Con autenticación
curl -H "Authorization: Bearer TU_TOKEN" http://localhost:8000/api/v1/vehiculos
```

### 2. Verificar en Postman/Insomnia
- GET http://localhost:8000/api/v1/vehiculos
- Ver qué respuesta da

### 3. Revisar Logs del Backend
- Ver la consola donde corre uvicorn
- Buscar errores o warnings

## 📝 Información Adicional Necesaria

Para ayudarte mejor, necesito saber:

1. **¿Qué dice la consola del backend** cuando intentas cargar vehículos?
2. **¿Funciona el endpoint de debug?** 
   - http://localhost:8000/api/v1/vehiculos/debug
3. **¿Hay vehículos en la base de datos?**
   - Verificar en MongoDB

## 🚀 Próximos Pasos

1. Revisar logs del backend
2. Probar endpoint directamente
3. Verificar datos en MongoDB
4. Aplicar solución según el problema encontrado

---

**¿Qué ves en la consola del backend cuando intentas cargar vehículos?**
