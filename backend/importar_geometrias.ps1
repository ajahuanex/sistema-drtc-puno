# Script PowerShell para importar geometrías
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IMPORTAR GEOMETRIAS DESDE GEOJSON" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio del script
Set-Location $PSScriptRoot

Write-Host "Activando entorno virtual..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

Write-Host ""
Write-Host "Ejecutando script de importacion..." -ForegroundColor Yellow
python scripts\importar_geometrias_geojson.py

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
