import requests
import json

print('🔍 Listando todas las configuraciones...\n')

try:
    response = requests.get('http://localhost:8000/api/v1/configuraciones')
    
    if response.status_code == 200:
        data = response.json()
        print(f'✅ Status: {response.status_code}')
        print(f'📦 Total: {len(data)}\n')
        
        for i, config in enumerate(data, 1):
            print(f'{i}. {config.get("nombre")}')
            print(f'   ID: {config.get("id")}')
            print(f'   Categoría: {config.get("categoria")}')
            print(f'   Activo: {config.get("activo")}')
            if len(config.get("valor", "")) < 100:
                print(f'   Valor: {config.get("valor")}')
            else:
                print(f'   Valor: {config.get("valor")[:100]}...')
            print()
    else:
        print(f'❌ Error: {response.status_code}')
        
except Exception as e:
    print(f'❌ Error: {e}')
