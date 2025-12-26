#!/usr/bin/env python3
"""
Script para interceptar y debuggear los datos que envía el frontend
"""
import requests
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import time

class DebugHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/v1/vehiculos/':
            # Leer el cuerpo de la petición
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                print("\n🔍 DATOS RECIBIDOS DEL FRONTEND:")
                print(json.dumps(data, indent=2, ensure_ascii=False))
                
                # Verificar campos requeridos
                print("\n📋 VERIFICACIÓN DE CAMPOS:")
                required_fields = ['placa', 'empresaActualId', 'categoria', 'marca', 'modelo', 'anioFabricacion', 'datosTecnicos']
                for field in required_fields:
                    if field in data:
                        print(f"  ✅ {field}: {data[field]}")
                    else:
                        print(f"  ❌ {field}: FALTANTE")
                
                # Verificar datosTecnicos
                if 'datosTecnicos' in data:
                    dt = data['datosTecnicos']
                    required_dt = ['motor', 'chasis', 'ejes', 'asientos', 'pesoNeto', 'pesoBruto', 'medidas', 'tipoCombustible']
                    print("\n📋 DATOS TÉCNICOS:")
                    for field in required_dt:
                        if field in dt:
                            print(f"  ✅ {field}: {dt[field]}")
                        else:
                            print(f"  ❌ {field}: FALTANTE")
                
                # Reenviar al backend real
                try:
                    response = requests.post(
                        "http://localhost:8000/api/v1/vehiculos/",
                        json=data,
                        headers={"Content-Type": "application/json"},
                        timeout=10
                    )
                    
                    print(f"\n📊 RESPUESTA DEL BACKEND: {response.status_code}")
                    
                    if response.status_code == 201:
                        result = response.json()
                        print("✅ VEHÍCULO CREADO EXITOSAMENTE")
                        
                        # Devolver respuesta exitosa al frontend
                        self.send_response(201)
                        self.send_header('Content-Type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(json.dumps(result).encode())
                    else:
                        print("❌ ERROR DEL BACKEND:")
                        try:
                            error_data = response.json()
                            print(json.dumps(error_data, indent=2))
                        except:
                            print(response.text)
                        
                        # Devolver error al frontend
                        self.send_response(response.status_code)
                        self.send_header('Content-Type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(response.content)
                        
                except Exception as e:
                    print(f"❌ Error conectando al backend: {e}")
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": str(e)}).encode())
                    
            except Exception as e:
                print(f"❌ Error procesando datos: {e}")
                self.send_response(400)
                self.end_headers()
        else:
            # Reenviar otras peticiones
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        # Manejar preflight CORS
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def log_message(self, format, *args):
        # Silenciar logs normales
        pass

def start_debug_server():
    """Iniciar servidor de debug en puerto 8001"""
    server = HTTPServer(('localhost', 8001), DebugHandler)
    print("🔍 Servidor de debug iniciado en http://localhost:8001")
    print("📝 Cambia la URL del frontend a http://localhost:8001/api/v1")
    print("🔄 Presiona Ctrl+C para detener")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido")
        server.shutdown()

if __name__ == "__main__":
    start_debug_server()