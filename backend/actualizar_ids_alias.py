import requests

url = "http://localhost:8000/api/v1/localidades-alias/actualizar-ids-antiguos"

print("Actualizando IDs de alias antiguos...")
response = requests.post(url)

if response.status_code == 200:
    resultado = response.json()
    print(f"\nTotal procesados: {resultado['total_procesados']}")
    print(f"Actualizados: {resultado['actualizados']}")
    print(f"Eliminados: {resultado.get('eliminados', 0)}")
    print(f"Errores: {resultado['errores']}")
    print("\nDetalles:")
    for detalle in resultado['detalles']:
        print(f"  - {detalle}")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
