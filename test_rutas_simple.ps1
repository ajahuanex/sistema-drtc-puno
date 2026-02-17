# Script simplificado de prueba para rutas
$baseUrl = "http://localhost:8000/api/v1"

Write-Host "=== PRUEBA DE FRECUENCIAS EN RUTAS ===" -ForegroundColor Cyan

# Crear JSON directamente
$jsonRuta = @"
{
  "codigoRuta": "99",
  "nombre": "PUNO - JULIACA TEST",
  "origen": {
    "id": "test-id-1",
    "nombre": "PUNO"
  },
  "destino": {
    "id": "test-id-2",
    "nombre": "JULIACA"
  },
  "tipoRuta": "INTERREGIONAL",
  "tipoServicio": "PASAJEROS",
  "frecuencia": {
    "tipo": "SEMANAL",
    "cantidad": 3,
    "dias": ["LUNES", "MIERCOLES", "VIERNES"],
    "descripcion": "03 SEMANALES (LUNES MIERCOLES VIERNES)"
  },
  "estado": "ACTIVA",
  "descripcion": "Ruta de prueba",
  "empresa": {
    "id": "695a4f016d7224c405d694e2",
    "ruc": "20123456789",
    "razonSocial": "EMPRESA TEST"
  },
  "resolucion": {
    "id": "695e36b615f0704220feaf17",
    "nroResolucion": "R-0856-2023",
    "tipoResolucion": "PADRE",
    "estado": "VIGENTE"
  },
  "itinerario": [
    {
      "id": "test-id-1",
      "nombre": "PUNO",
      "orden": 1
    },
    {
      "id": "test-id-2",
      "nombre": "JULIACA",
      "orden": 2
    }
  ]
}
"@

Write-Host "1. Creando ruta con frecuencia SEMANAL..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/rutas" -Method POST `
        -ContentType "application/json" -Body $jsonRuta
    
    Write-Host "✓ Ruta creada:" -ForegroundColor Green
    Write-Host "  ID: $($response.id)"
    Write-Host "  Código: $($response.codigoRuta)"
    Write-Host "  Frecuencia tipo: $($response.frecuencia.tipo)"
    Write-Host "  Frecuencia cantidad: $($response.frecuencia.cantidad)"
    Write-Host "  Frecuencia días: $($response.frecuencia.dias -join ', ')"
    Write-Host "  Frecuencia descripción: $($response.frecuencia.descripcion)"
    
    $rutaId = $response.id
    
    # Actualizar a frecuencia DIARIA
    Write-Host ""
    Write-Host "2. Actualizando a frecuencia DIARIA..." -ForegroundColor Yellow
    
    $jsonUpdate = @"
{
  "frecuencia": {
    "tipo": "DIARIO",
    "cantidad": 2,
    "dias": [],
    "descripcion": "02 DIARIAS"
  },
  "observaciones": "Actualizado mediante API"
}
"@
    
    $responseUpdate = Invoke-RestMethod -Uri "$baseUrl/rutas/$rutaId" -Method PUT `
        -ContentType "application/json" -Body $jsonUpdate
    
    Write-Host "✓ Ruta actualizada:" -ForegroundColor Green
    Write-Host "  Frecuencia tipo: $($responseUpdate.frecuencia.tipo)"
    Write-Host "  Frecuencia cantidad: $($responseUpdate.frecuencia.cantidad)"
    Write-Host "  Frecuencia descripción: $($responseUpdate.frecuencia.descripcion)"
    Write-Host "  Observaciones: $($responseUpdate.observaciones)"
    
    # Limpiar
    Write-Host ""
    Write-Host "3. Eliminando ruta de prueba..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$baseUrl/rutas/$rutaId" -Method DELETE | Out-Null
    Write-Host "✓ Ruta eliminada" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== PRUEBA COMPLETADA ===" -ForegroundColor Cyan
