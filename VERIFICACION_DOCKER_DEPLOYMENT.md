# ✅ Verificación de Deployment en Docker

## Estado Actual

### Backend
- ✅ `main.py` - Actualizado con todos los routers
- ✅ `auth_router.py` - Actualizado con logging y manejo de DNI
- ✅ `settings.py` - Actualizado con variables de entorno
- ✅ Middleware CORS configurado
- ✅ Health check endpoint disponible

### Base de Datos
- ✅ MongoDB desplegada en Docker
- ✅ Credenciales: `admin:admin123`
- ✅ Base de datos: `drtc_db`

## Verificación Rápida

### 1. Verificar que Docker está corriendo
```bash
docker ps
# Debería mostrar MongoDB y Backend corriendo
```

### 2. Verificar Health Check
```bash
curl http://localhost:8000/health
# Debería retornar status: "healthy"
```

### 3. Verificar Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=12345678&password=admin123"
# Debería retornar token y datos del usuario
```

### 4. Verificar Debug Login
```bash
curl -X POST "http://localhost:8000/debug-login?username=12345678&password=admin123"
# Debería mostrar detalles del usuario y validación de contraseña
```

## Cambios Recientes

### Backend
1. **auth_router.py** - Agregado logging y manejo correcto de DNI
2. **settings.py** - Todas las configuraciones desde variables de entorno
3. **main.py** - Health check y debug endpoints

### Frontend
1. **carga-masiva-geojson.component.ts** - Limpiado de código basura
2. **.env.example** - Creado para configuración de ambiente

## Próximos Pasos

1. Verificar que el usuario de prueba existe en MongoDB
2. Si no existe, crear usuario de prueba:
   ```bash
   # Conectar a MongoDB
   docker exec -it <mongo-container> mongosh -u admin -p admin123
   
   # Usar base de datos
   use drtc_db
   
   # Crear usuario de prueba
   db.usuarios.insertOne({
     "dni": "12345678",
     "nombres": "Admin",
     "apellidos": "Test",
     "email": "admin@test.com",
     "password_hash": "$2b$12$...", // Hash de "admin123"
     "rolId": "admin",
     "estaActivo": true,
     "fechaCreacion": new Date()
   })
   ```

3. Probar login desde frontend
4. Verificar tokens y autenticación

## Logs Útiles

```bash
# Ver logs del backend
docker logs <backend-container> -f

# Ver logs de MongoDB
docker logs <mongo-container> -f
```

## Troubleshooting

### Login falla con "DNI o contraseña incorrectos"
- Verificar que el usuario existe en MongoDB
- Verificar que la contraseña está hasheada correctamente
- Revisar logs del backend

### Health check retorna "degraded"
- Verificar que MongoDB está corriendo
- Verificar credenciales de conexión
- Revisar logs de MongoDB

### CORS errors
- Verificar que frontend está en `http://localhost:4200`
- Revisar configuración de CORS en `main.py`
