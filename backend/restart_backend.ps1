# Script para reiniciar el backend de FastAPI

Write-Host "🔄 Reiniciando backend..." -ForegroundColor Cyan

# Detener procesos de uvicorn
Write-Host "⏹️  Deteniendo procesos existentes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*uvicorn*"} | Stop-Process -Force
Start-Sleep -Seconds 2

# Verificar que se detuvo
$running = Get-Process | Where-Object {$_.ProcessName -like "*uvicorn*"}
if ($running) {
    Write-Host "❌ No se pudo detener el backend" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend detenido" -ForegroundColor Green

# Iniciar backend
Write-Host "🚀 Iniciando backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 3

# Verificar que inició
$running = Get-Process | Where-Object {$_.ProcessName -like "*uvicorn*"}
if ($running) {
    Write-Host "✅ Backend iniciado correctamente" -ForegroundColor Green
    Write-Host "📡 Disponible en: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "📚 Documentación: http://localhost:8000/docs" -ForegroundColor Cyan
} else {
    Write-Host "❌ No se pudo iniciar el backend" -ForegroundColor Red
    exit 1
}
