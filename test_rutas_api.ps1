# Script de prueba para los endpoints de rutas
$baseUrl = "http://localhost:8000/api/v1"

Write-Host "=== PRUEBA DE ENDPOINTS DE RUTAS ===" -ForegroundColor Cyan
Write-Host ""

# 1. Obtener rutas por empresa (necesitamos una empresa existente)
Write-Host "1. Obteniendo empresas disponibles..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/empresas?limit=1" -Method GET -Headers @{"accept"="application/json"}
    $empresas = $response.Content | ConvertFrom-Json
    
    if ($empresas.Count -gt 0) {
        $empresaId = $empresas[0].id
        Write-Host "✓ Empresa encontrada: $($empresas[0].razonSocial.principal)" -ForegroundColor Green
        Write-Host "  ID: $empresaId" -ForegroundColor Cyan
        
        # Obtener rutas de esta empresa
        Write-Host ""
        Write-Host "2. Obteniendo rutas de la empresa..." -ForegroundColor Yellow
        $responseRutas = Invoke-WebRequest -Uri "$baseUrl/rutas/empresa/$empresaId" -Method GET -Headers @{"accept"="application/json"}
        $rutas = $responseRutas.Content | ConvertFrom-Json
        Write-Host "✓ Total de rutas: $($rutas.Count)" -ForegroundColor Green
        
        if ($rutas.Count -gt 0) {
            Write-Host "Primera ruta encontrada:" -ForegroundColor Cyan
            Write-Host "  Código: $($rutas[0].codigoRuta)" -ForegroundColor White
            Write-Host "  Nombre: $($rutas[0].nombre)" -ForegroundColor White
            Write-Host "  Frecuencia:" -ForegroundColor White
            $rutas[0].frecuencia | ConvertTo-Json -Depth 3
        }
    } else {
        Write-Host "✗ No hay empresas en el sistema" -ForegroundColor Red
        exit
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "3. Probando creación de ruta con frecuencia estructurada..." -ForegroundColor Yellow

# Obtener una resolución válida
try {
    $responseRes = Invoke-WebRequest -Uri "$baseUrl/rutas/empresa/$empresaId/resoluciones-primigenias" -Method GET -Headers @{"accept"="application/json"}
    $resData = $responseRes.Content | ConvertFrom-Json
    
    if ($resData.resoluciones.Count -eq 0) {
        Write-Host "✗ No hay resoluciones primigenias disponibles" -ForegroundColor Red
        exit
    }
    
    $resolucion = $resData.resoluciones[0]
    Write-Host "✓ Resolución encontrada: $($resolucion.nroResolucion)" -ForegroundColor Green
    
    # Obtener siguiente código
    $responseCode = Invoke-WebRequest -Uri "$baseUrl/rutas/resolucion/$($resolucion.id)/siguiente-codigo" -Method GET -Headers @{"accept"="application/json"}
    $codeData = $responseCode.Content | ConvertFrom-Json
    $siguienteCodigo = $codeData.siguienteCodigo
    Write-Host "✓ Siguiente código disponible: $siguienteCodigo" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Error obteniendo resolución: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Obtener localidades para origen y destino
try {
    $responseLocalidades = Invoke-WebRequest -Uri "$baseUrl/localidades?limit=2" -Method GET -Headers @{"accept"="application/json"}
    $localidades = $responseLocalidades.Content | ConvertFrom-Json
    
    if ($localidades.Count -lt 2) {
        Write-Host "✗ No hay suficientes localidades en el sistema" -ForegroundColor Red
        exit
    }
    
    $origen = $localidades[0]
    $destino = $localidades[1]
    Write-Host "✓ Localidades seleccionadas:" -ForegroundColor Green
    Write-Host "  Origen: $($origen.nombre)" -ForegroundColor Cyan
    Write-Host "  Destino: $($destino.nombre)" -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ Error obteniendo localidades: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 3. Crear una ruta de prueba con frecuencia estructurada
$nuevaRuta = @{
    codigoRuta = $siguienteCodigo
    nombre = "$($origen.nombre) - $($destino.nombre)"
    origen = @{
        id = $origen.id
        nombre = $origen.nombre
    }
    destino = @{
        id = $destino.id
        nombre = $destino.nombre
    }
    tipoRuta = "INTERREGIONAL"
    tipoServicio = "PASAJEROS"
    frecuencia = @{
        tipo = "SEMANAL"
        cantidad = 3
        dias = @("LUNES", "MIERCOLES", "VIERNES")
        descripcion = "03 SEMANALES (LUNES MIERCOLES VIERNES)"
    }
    estado = "ACTIVA"
    descripcion = "Ruta de prueba para validar frecuencias estructuradas"
    empresa = @{
        id = $empresas[0].id
        ruc = $empresas[0].ruc
        razonSocial = $empresas[0].razonSocial.principal
    }
    resolucion = @{
        id = $resolucion.id
        nroResolucion = $resolucion.nroResolucion
        tipoResolucion = $resolucion.tipoResolucion
        estado = $resolucion.estado
    }
    itinerario = @(
        @{
            id = $origen.id
            nombre = $origen.nombre
            orden = 1
        },
        @{
            id = $destino.id
            nombre = $destino.nombre
            orden = 2
        }
    )
}

try {
    $body = $nuevaRuta | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "Enviando ruta con frecuencia estructurada..." -ForegroundColor Cyan
    
    $response = Invoke-WebRequest -Uri "$baseUrl/rutas" -Method POST `
        -Headers @{"Content-Type"="application/json"; "accept"="application/json"} `
        -Body $body
    
    $rutaCreada = $response.Content | ConvertFrom-Json
    Write-Host "✓ Ruta creada exitosamente" -ForegroundColor Green
    Write-Host "  ID: $($rutaCreada.id)" -ForegroundColor Cyan
    Write-Host "  Código: $($rutaCreada.codigoRuta)" -ForegroundColor Cyan
    Write-Host "  Frecuencia:" -ForegroundColor Cyan
    $rutaCreada.frecuencia | ConvertTo-Json -Depth 3
    
    # 4. Actualizar la ruta con nueva frecuencia
    Write-Host ""
    Write-Host "4. Actualizando frecuencia de la ruta..." -ForegroundColor Yellow
    
    $actualizacion = @{
        frecuencia = @{
            tipo = "DIARIO"
            cantidad = 2
            dias = @()
            descripcion = "02 DIARIAS"
        }
        observaciones = "Frecuencia actualizada a diaria mediante API"
    }
    
    $bodyUpdate = $actualizacion | ConvertTo-Json -Depth 10
    $responseUpdate = Invoke-WebRequest -Uri "$baseUrl/rutas/$($rutaCreada.id)" -Method PUT `
        -Headers @{"Content-Type"="application/json"; "accept"="application/json"} `
        -Body $bodyUpdate
    
    $rutaActualizada = $responseUpdate.Content | ConvertFrom-Json
    Write-Host "✓ Ruta actualizada exitosamente" -ForegroundColor Green
    Write-Host "  Nueva frecuencia:" -ForegroundColor Cyan
    $rutaActualizada.frecuencia | ConvertTo-Json -Depth 3
    Write-Host "  Observaciones: $($rutaActualizada.observaciones)" -ForegroundColor Cyan
    
    # 5. Eliminar la ruta de prueba
    Write-Host ""
    Write-Host "5. Limpiando ruta de prueba..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "$baseUrl/rutas/$($rutaCreada.id)" -Method DELETE | Out-Null
    Write-Host "✓ Ruta de prueba eliminada" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== PRUEBA COMPLETADA ===" -ForegroundColor Cyan
