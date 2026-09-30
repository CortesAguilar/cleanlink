# dev.ps1 - Levanta el ambiente de desarrollo de CleanLink
# Ubicacion: <repo>\scripts\dev.ps1
$root = Split-Path $PSScriptRoot -Parent

# 1. Docker Desktop (se inicia si el motor no esta activo)
docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Iniciando Docker Desktop..."
  Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep 3
    docker info *> $null
    if ($LASTEXITCODE -eq 0) { break }
  }
  if ($LASTEXITCODE -ne 0) { Write-Host "Docker no arranco a tiempo."; return }
}

# 2. Base de datos (SQL Server en contenedor)
docker start sql-cleanlink
if ($LASTEXITCODE -ne 0) {
  Write-Host "No existe el contenedor sql-cleanlink. Crearlo con docker run (ver manual)."
  return
}

# 3. Backend y frontend, cada uno en su propia terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; node index.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

# 4. Navegador
Start-Sleep 8
Start-Process "http://localhost:5173"
