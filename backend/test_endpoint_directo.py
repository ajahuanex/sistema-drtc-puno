import requests
import json

print('🧪 Probando endpoint directamente...\n')

url = 'http://localhost:8000/api/v1/configuraciones'

try:
    response = requests.get(url)
    print(f'Status: {response.status_code}')
    
    if response.status_code == 200:
        data = response.json()
        print(f'Total configuraciones: {len(data)}\n')
        
        print('Configuraciones disponibles:')
        for i, config in enumerate(data, 1):
            nombre = config.get('nombre')
            categoria = config.get('categoria')
            print(f'{i}. {nombre} (Categoría: {categoria})')
        
        # Buscar TIPOS_RUTA_CONFIG
        tipos_ruta = next((c for c in data if c.get('nombre') == 'TIPOS_RUTA_CONFIG'), None)
        
        if tipos_ruta:
            print(f'\n✅ TIPOS_RUTA_CONFIG encontrado!')
            print(f'   ID: {tipos_ruta.get("id")}')
            print(f'   Categoría: {tipos_ruta.get("categoria")}')
            
            valor = tipos_ruta.get('valor')
            if valor:
                tipos = json.loads(valor)
                print(f'\n   Tipos ({len(tipos)}):')
                for tipo in tipos:
                    print(f'   - {tipo.get("codigo")}: {tipo.get("nombre")}')
        else:
            print(f'\n❌ TIPOS_RUTA_CONFIG NO encontrado')
    else:
        print(f'Error: {response.text}')
        
except Exception as e:
    print(f'❌ Error: {e}')
