# Function for notifications
function Notify-Deployment {
    param (
        [string]$Status,
        [string]$Message
    )
    Write-Host "$Status`: $Message"
    # You can add Windows notification using PowerShell if needed
}

# Error handling
$ErrorActionPreference = "Stop"
trap {
    Notify-Deployment "Error" "Deployment failed: $_"
    exit 1
}

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Notify-Deployment "Error" "Please run as Administrator"
    exit 1
}

# Install dependencies
Write-Host "Installing dependencies..."
try {
    npm install
} catch {
    Notify-Deployment "Error" "Failed to install dependencies"
    throw
}

# Setup development environment variables
$env:NODE_ENV = "development"

# Create directory if it doesn't exist
$targetPath = "C:\inetpub\wwwroot\luxury-management"
Write-Host "Setting up development directory..."
if (-not (Test-Path $targetPath)) {
    New-Item -ItemType Directory -Path $targetPath -Force
}

# Copy project files
Write-Host "Copying project files..."
Copy-Item -Path ".\*" -Destination $targetPath -Recurse -Force

# Setup IIS if needed (assumes IIS is installed)
Write-Host "Setting up IIS..."
Import-Module WebAdministration
if (!(Get-Website -Name "luxury-management")) {
    New-Website -Name "luxury-management" -PhysicalPath $targetPath -Port 80
}

# Install and setup PM2 for Windows
Write-Host "Setting up PM2..."
try {
    npm install -g pm2 --force
    pm2 delete luxury-management 2>$null
    Set-Location $targetPath
    pm2 start npm --name "luxury-management" -- run dev
} catch {
    Notify-Deployment "Error" "Failed to start PM2"
    throw
}

# Show status
Write-Host "Checking PM2 status..."
pm2 status

Notify-Deployment "Success" "Development environment is ready at http://localhost"
Write-Host "Development server is running. View logs with: pm2 logs luxury-management"