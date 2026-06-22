# RushBasket — open 3 terminals: API, customer app, admin
$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }

$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$admin = Join-Path $root "admin"

Write-Host "Starting backend (port 4000), frontend (Vite), admin (Vite :5174)..." -ForegroundColor Cyan

Start-Process powershell -WorkingDirectory $backend -ArgumentList @(
    "-NoExit", "-Command", "npm start"
)
Start-Sleep -Seconds 2
Start-Process powershell -WorkingDirectory $frontend -ArgumentList @(
    "-NoExit", "-Command", "npm run dev"
)
Start-Sleep -Seconds 1
Start-Process powershell -WorkingDirectory $admin -ArgumentList @(
    "-NoExit", "-Command", "npm run dev -- --port 5174"
)

Write-Host "Done. Check each window for Local URLs (often http://localhost:5173 shop, :5174 admin)." -ForegroundColor Green
Write-Host "API: http://localhost:4000" -ForegroundColor Green
