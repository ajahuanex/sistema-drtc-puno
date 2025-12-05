# Solución Simple - Módulo de Rutas

## El Problema
El backend devuelve error 500 porque no se reinició después de los cambios en el modelo.

## La Solución

### 1. REINICIAR EL BACKEND
```bash
# Detén el backend (Ctrl+C en la terminal donde corre)
# Luego inícialo de nuevo:
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### 2. LIMPIAR RUTAS DUPLICADAS
```bash
python limpiar_rutas_duplicadas.py
```

### 3. RECARGAR EL FRONTEND
Presiona F5 en el navegador

## Lógica Simple de Rutas

**Código de ruta único por resolución:**
- Resolución X: 01, 02, 03 (3 rutas)
- Resolución Y: 01, 02 (2 rutas)
- El código 01 puede repetirse en diferentes resoluciones
- Pero NO puede repetirse dentro de la misma resolución

**Columnas de la tabla:**
1. Código (01, 02, 03...)
2. Origen
3. Destino
4. Frecuencias
5. Itinerario
6. Estado
7. Acciones

## ¿Por qué falló?
1. Backend devuelve error 500
2. Frontend usa fallback mock
3. Mock no valida códigos únicos
4. Se crean duplicados

## Solución: Reiniciar backend
Eso es todo. Solo reinicia el backend y funcionará.
