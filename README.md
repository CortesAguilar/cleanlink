# CleanLink

Plataforma que conecta empresas con proveedores de limpieza.

## Configuración del entorno de desarrollo (Windows 11)

Todos los comandos se ejecutan en **PowerShell**.

### 1. Instalar WSL 2

Docker Desktop corre sobre WSL 2, por lo que se instala primero. Ejecutar PowerShell **como administrador**:

```powershell
wsl --install --no-distribution
```

Reiniciar el equipo al terminar.

### 2. Instalar herramientas con winget

```powershell
$apps = @(
  "OpenJS.NodeJS.LTS",          # Node.js + npm
  "Git.Git",                    # Control de versiones
  "Microsoft.VisualStudioCode", # IDE
  "Docker.DockerDesktop",       # Contenedores (SQL Server en desarrollo)
  "Microsoft.AzureCLI"          # Recursos de Azure desde terminal
)

foreach ($app in $apps) {
  winget install --id $app -e --accept-package-agreements --accept-source-agreements
}
```

### 3. Verificar la instalación

Cerrar y volver a abrir PowerShell, y ejecutar:

```powershell
node -v; npm -v; git --version; docker --version; az --version; wsl --version
```

Abrir Docker Desktop y esperar el indicador **Engine running**. Después, comprobar que el motor ejecuta contenedores:

```powershell
docker run hello-world
```

### 4. Configurar Git

Reemplazar los valores con tu nombre y el correo de tu cuenta de GitHub:

```powershell
git config --global user.name "your_name_here"
git config --global user.email "your_email_here"
git config --global init.defaultBranch main
git config --global core.autocrlf true
```

Verificar:

```powershell
git config --global --list
```

### 5. Clonar el repositorio

```powershell
mkdir C:\dev
cd C:\dev
git clone https://github.com/CortesAguilar/cleanlink.git
cd cleanlink
```

Verificar y abrir en VS Code:

```powershell
git status
git log --oneline
code .
```

### 6. Permitir la ejecución de scripts en PowerShell

Por defecto, PowerShell bloquea scripts como `npm.ps1` y `npm install` falla con el error *running scripts is disabled on this system*. Se soluciona una sola vez, solo para el usuario actual:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
Get-ExecutionPolicy -List
```

En la fila `CurrentUser` debe aparecer `RemoteSigned`.

## Ambiente de desarrollo

### Base de datos: SQL Server en Docker

Reemplazar `your_secure_password_here` por una contraseña propia (mínimo 8 caracteres, con mayúsculas, minúsculas, números y símbolos). No subirla al repositorio.

```powershell
docker run -d --name sql-cleanlink `
  -e "ACCEPT_EULA=Y" `
  -e "MSSQL_SA_PASSWORD=your_secure_password_here" `
  -p 1433:1433 `
  -v sqldata:/var/opt/mssql `
  mcr.microsoft.com/mssql/server:2022-latest
```

Verificar que el contenedor está en ejecución (estado `Up`):

```powershell
docker ps
```

Si no aparece, revisar los logs:

```powershell
docker logs sql-cleanlink
```

### Backend (API Express)

Crear el archivo `.env` a partir de la plantilla y editarlo:

```powershell
cd C:\dev\cleanlink
copy backend\.env.example backend\.env
code backend\.env
```

Valores para desarrollo (`DB_PASSWORD` debe coincidir con `MSSQL_SA_PASSWORD`):

```
PORT=3000
DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=your_secure_password_here
DB_NAME=master
DB_TRUST_CERT=true
```

Instalar dependencias y arrancar la API:

```powershell
cd backend
npm install
node index.js
```

Verificar los endpoints en el navegador:

| Endpoint | Respuesta esperada |
|---|---|
| `http://localhost:3000/api/health` | `{"status":"ok","app":"CleanLink API"}` |
| `http://localhost:3000/api/db-health` | `{"status":"ok","database":"connected","name":"master"}` |

### Frontend (React + Vite)

En una **segunda terminal**, para no detener la API:

```powershell
cd C:\dev\cleanlink
copy frontend\.env.example frontend\.env
code frontend\.env
```

Contenido del `.env` del frontend:

```
VITE_API_URL=http://localhost:3000
```

Instalar dependencias y arrancar el servidor de desarrollo:

```powershell
cd frontend
npm install
npm run dev
```

Abrir `http://localhost:5173`. La aplicación debe mostrar **API: Conectada** y **Base de datos: Conectada**.

Para trabajar deben estar activos a la vez el contenedor de SQL Server, la API y el servidor de Vite.

## Extensiones recomendadas de VS Code

| Extensión | Identificador |
|---|---|
| ESLint | `dbaeumer.vscode-eslint` |
| Prettier | `esbenp.prettier-vscode` |
| Docker | `ms-azuretools.vscode-docker` |
| SQL Server (mssql) | `ms-mssql.mssql` |
| Azure App Service | `ms-azuretools.vscode-azureappservice` |
| GitHub Actions | `github.vscode-github-actions` |

## Seguridad

Los archivos `.env` contienen credenciales y **nunca** se suben al repositorio (están en `.gitignore`). Usar siempre marcadores de posición en la documentación, por ejemplo `DB_PASSWORD=your_secure_password_here`.
