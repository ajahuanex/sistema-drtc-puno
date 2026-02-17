import requests
import json

print('🧪 Probando endpoint de configuraciones...\n')

try:
    response = requests.get('http://localhost:8000/api/v1/configuraciones')
    
    if response.status_code == 200:
        data = response.json()
        print(f'✅ Status: {response.status_code}')
        print(f'📦 Total configuraciones: {len(data)}\n')
        
        # Buscar TIPOS_RUTA_CONFIG
        tipos_ruta_config = None
        for config in data:
            if config.get('nombre') == 'TIPOS_RUTA_CONFIG':
                tipos_ruta_config = config
                break
        
        if tipos_ruta_config:
            print('✅ TIPOS_RUTA_CONFIG encontrado:')
            print(f'  - ID: {tipos_ruta_config.get("id")}')
            print(f'  - Activo: {tipos_ruta_config.get("activo")}')
            
            valor = tipos_ruta_config.get('valor')
            if valor:
                tipos = json.loads(valor)
                print(f'\n📋 Tipos de ruta ({len(tipos)}):')
                for tipo in tipos:
                    estado = '✅' if tipo.get('estaActivo') else '❌'
                    print(f'  {estado} {tipo.get("codigo")} - {tipo.get("nombre")}')
        else:
            print('❌ TIPOS_RUTA_CONFIG no encontrado')
    else:
        print(f'❌ Error: {response.status_code}')
        print(f'Respuesta: {response.text}')
        
except Exception as e:
    print(f'❌ Error: {e}')
