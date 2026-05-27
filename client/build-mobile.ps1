#!/usr/bin/env pwsh
# EventHub — Smart Mobile Dev Script
# Auto-detects your LAN IP, updates config, and starts everything

Write-Host "EventHub Mobile Dev Setup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Auto-detect the correct LAN IP
$IP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notlike "*Loopback*" -and
    $_.InterfaceAlias -notlike "*Bluetooth*" -and
    $_.InterfaceAlias -notlike "*vEthernet*" -and
    $_.IPAddress -notlike "169.*" -and
    $_.IPAddress -notlike "192.168.137.*"   # skip Windows hotspot adapter
} | Sort-Object -Property PrefixLength | Select-Object -First 1).IPAddress

if (-not $IP) {
    Write-Host "Could not detect LAN IP. Are you connected to WiFi?" -ForegroundColor Red
    exit 1
}

Write-Host "Detected LAN IP: $IP" -ForegroundColor Green

# Update capacitor.config.json
$capConfig = Get-Content "capacitor.config.json" | ConvertFrom-Json
$capConfig.server.url = "http://${IP}:5173"
$capConfig.server.allowNavigation = @($IP)
$capConfig | ConvertTo-Json -Depth 10 | Set-Content "capacitor.config.json"
Write-Host "Updated capacitor.config.json" -ForegroundColor Green

# Update api.js
$apiFile = "src\api\api.js"
$content = Get-Content $apiFile -Raw
$content = $content -replace "const SERVER_IP = '[^']*';", "const SERVER_IP = '$IP';"
Set-Content $apiFile $content
Write-Host "Updated api.js" -ForegroundColor Green

# Build and sync
Write-Host "`nBuilding React app..." -ForegroundColor Cyan
npm run build

Write-Host "Syncing to Android..." -ForegroundColor Cyan
npx cap sync android

Write-Host "`n[DONE] Now press Run in Android Studio!" -ForegroundColor Green
Write-Host "Your app will load from: http://${IP}:5173" -ForegroundColor Yellow
Write-Host "`nKeep these running in separate terminals:" -ForegroundColor Cyan
Write-Host "  1. cd server && npm run dev" -ForegroundColor White
Write-Host "  2. cd ml-service && python -m uvicorn main:app --reload --port 8000" -ForegroundColor White
Write-Host "  3. cd client && npm run dev   (already done by this script if started)" -ForegroundColor White
