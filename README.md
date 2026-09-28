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
