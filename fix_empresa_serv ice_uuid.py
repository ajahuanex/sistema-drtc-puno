"""
Script para modificar get_empresa_by_id en empresa_service.py
para soportar tanto UUIDs como ObjectIds
"""

import re

# Leer el archivo
with open(r'd:\2025\KIRO3\sistema-drtc-puno\backend\app\services\empresa_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Buscar y reemplazar el método get_empresa_by_id
old_method = '''    async def get_empresa_by_id(self, empresa_id: str) -> Optional[EmpresaInDB]:
        """Obtener empresa por ID"""
        empresa = await self.collection.find_one({"_id": ObjectId(empresa_id)})
        return EmpresaInDB(**empresa) if empresa else None'''

new_method = '''    async def get_empresa_by_id(self, empresa_id: str) -> Optional[EmpresaInDB]:
        """Obtener empresa por ID (soporta tanto UUID como ObjectId)"""
        empresa = None
        
        # Primero intentar buscar por campo 'id' (UUID)
        empresa = await self.collection.find_one({"id": empresa_id})
        
        # Si no se encuentra, intentar por '_id' (ObjectId de MongoDB)
        if not empresa:
            try:
                empresa = await self.collection.find_one({"_id": ObjectId(empresa_id)})
            except Exception:
                # Si empresa_id no es un ObjectId válido, simplemente retornar None
                pass
        
        return EmpresaInDB(**empresa) if empresa else None'''

# Reemplazar
if old_method in content:
    content = content.replace(old_method, new_method)
    print("✅ Método actualizado correctamente")
    
    # Escribir el archivo
    with open(r'd:\2025\KIRO3\sistema-drtc-puno\backend\app\services\empresa_service.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Archivo guardado")
else:
    print("❌ No se encontró el método original")
    print("Buscando variaciones...")
