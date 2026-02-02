#!/usr/bin/env pwsh
# Script PowerShell para resetear localidades

Write-Host "🇵🇪 RESETEO COMPLETO DE LOCALIDADES DEL PERU" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Este script eliminará TODAS las localidades existentes" -ForegroundColor Yellow
Write-Host "e importará 40 localidades reales basadas en UBIGEO oficial del INEI" -ForegroundColor Yellow
Write-Host ""

$respuesta = Read-Host "¿Continuar? (s/N)"

if ($respuesta -match "^(s|si|sí|y|yes)$") {
    Write-Host ""
    Write-Host "🔄 Ejecutando reseteo..." -ForegroundColor Cyan
    
    # Cambiar al directorio backend
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $backendDir = Split-Path -Parent $scriptDir
    Set-Location $backendDir
    
    # Ejecutar script Python
    python scripts/resetear_localidades.py
    
    Write-Host ""
    Write-Host "✅ Proceso completado" -ForegroundColor Green
    Read-Host "Presiona Enter para continuar"
} else {
    Write-Host "❌ Operación cancelada" -ForegroundColor Red
    Read-Host "Presiona Enter para continuar"
}