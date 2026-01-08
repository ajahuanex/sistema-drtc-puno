#!/usr/bin/env python3
"""
Endpoint de login simplificado para debuggear
"""
from fastapi import FastAPI, HTTPException, Form
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import asyncio

app = FastAPI()

@app.post("/test-login")
async def test_login(username: str = Form(...), password: str = Form(...)):
    """Endpoint de login simplificado para debuggear"""
    try:
        print(f"Intentando login con DNI: {username}")
        
        # Conectar a MongoDB
        client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
        db = client.drtc_db
        usuarios_collection = db.usuarios
        
        # Buscar usuario
        usuario = await usuarios_collection.find_one({"dni": username})
        if not usuario:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        
        print(f"Usuario encontrado: {usuario['nombres']}")
        
        # Verificar contraseña
        if 'password_hash' not in usuario:
            raise HTTPException(status_code=401, detail="Usuario sin contraseña")
        
        password_bytes = password.encode('utf-8')
        hashed_bytes = usuario['password_hash'].encode('utf-8')
        
        if not bcrypt.checkpw(password_bytes, hashed_bytes):
            raise HTTPException(status_code=401, detail="Contraseña incorrecta")
        
        print("Autenticación exitosa")
        
        # Cerrar conexión
        client.close()
        
        return {
            "message": "Login exitoso",
            "user": {
                "dni": usuario['dni'],
                "nombres": usuario['nombres'],
                "email": usuario['email']
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error interno: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)