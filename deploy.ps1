# -----------------------------------------------------
# Luxury Management System - Windows Deployment Script
# -----------------------------------------------------

# Function for notifications
function Notify-Deployment {
    param (
        [string]$Status,
        [string]$Message
    )
    Write-Host "$Status`: $Message" -ForegroundColor $(if ($Status -eq "Error") { "Red" } elseif ($Status -eq "Warning") { "Yellow" } else { "Green" })
}

# -----------------------------------------------------
# Configuration Section
# -----------------------------------------------------

# App configuration
$APP_NAME = "luxury-management"
$DEPLOY_DIR = "C:\inetpub\wwwroot\$APP_NAME"

# Load environment variables from .env.local if it exists
if (Test-Path ".\.env.local") {
    Notify-Deployment "Info" "Loading environment variables from .env.local..."
    $envContent = Get-Content ".\.env.local"
    
    $TURNSTILE_SITE_KEY = ($envContent | Select-String "NEXT_PUBLIC_TURNSTILE_SITE_KEY=(.*)").Matches.Groups[1].Value
    $TURNSTILE_SECRET_KEY = ($envContent | Select-String "TURNSTILE_SECRET_KEY=(.*)").Matches.Groups[1].Value
    $DOMAIN = ($envContent | Select-String "NEXT_PUBLIC_DOMAIN=(.*)").Matches.Groups[1].Value
} else {
    # Default configuration
    $DOMAIN = "localhost"
    $TURNSTILE_SITE_KEY = "0x4AAAAAAA_nlAnnKt5Uo_bH"
    $TURNSTILE_SECRET_KEY = "0x4AAAAAAA_nlG7R4LGuHqzKDw0vQthRPxA"
}

# -----------------------------------------------------
# Error handling
# -----------------------------------------------------
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

# -----------------------------------------------------
# Kill existing processes
# -----------------------------------------------------
Notify-Deployment "Info" "Checking for existing processes..."

# Check if PM2 is installed and stop any existing instances
if (Get-Command "pm2" -ErrorAction SilentlyContinue) {
    Notify-Deployment "Info" "Stopping existing PM2 processes..."
    pm2 delete $APP_NAME -s
}

# Stop any processes using port 3000 (Next.js default)
try {
    $processingPort = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($processingPort) {
        Notify-Deployment "Info" "Killing processes on port 3000..."
        foreach ($process in $processingPort) {
            Stop-Process -Id $process -Force
        }
    }
} catch {
    Notify-Deployment "Warning" "No processes found using port 3000 or unable to check"
}

# -----------------------------------------------------
# Application Setup
# -----------------------------------------------------

# Create or update .env.local file with environment variables
Notify-Deployment "Info" "Setting up environment variables..."
@"
# Cloudflare Turnstile configuration
NEXT_PUBLIC_TURNSTILE_SITE_KEY=$TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY=$TURNSTILE_SECRET_KEY

# Domain configuration
NEXT_PUBLIC_DOMAIN=$DOMAIN
NEXT_PUBLIC_BASE_URL=http://$DOMAIN

# Set this to false in production
NEXT_PUBLIC_DISABLE_TURNSTILE_IN_DEV=false

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
"@ | Out-File -FilePath ".\.env.local" -Encoding utf8

# Install dependencies
Notify-Deployment "Info" "Installing dependencies..."
try {
    npm ci
} catch {
    try {
        npm install
    } catch {
        Notify-Deployment "Error" "Failed to install dependencies"
        throw
    }
}

# Run npm audit fix
Notify-Deployment "Info" "Running npm audit fix..."
try {
    npm audit fix --force
} catch {
    Notify-Deployment "Warning" "npm audit fix completed with warnings"
}

# Setup development environment variables
$env:NODE_ENV = "development"

# -----------------------------------------------------
# Deployment
# -----------------------------------------------------

# Create directory if it doesn't exist
Notify-Deployment "Info" "Setting up deployment directory..."
if (Test-Path $DEPLOY_DIR) {
    # Clean the directory but preserve node_modules
    Get-ChildItem -Path $DEPLOY_DIR -Exclude "node_modules" | Remove-Item -Recurse -Force
} else {
    New-Item -ItemType Directory -Path $DEPLOY_DIR -Force
}

# Copy project files
Notify-Deployment "Info" "Copying project files..."
Copy-Item -Path ".\*" -Destination $DEPLOY_DIR -Recurse -Force -Exclude "node_modules"

# Copy environment variables to the deployment directory
Copy-Item -Path ".\.env.local" -Destination $DEPLOY_DIR -Force

# -----------------------------------------------------
# IIS Configuration
# -----------------------------------------------------

# Setup IIS if it's installed
Notify-Deployment "Info" "Setting up IIS if available..."
if (Get-Module -ListAvailable -Name WebAdministration) {
    Import-Module WebAdministration
    
    # Check if website exists, if not create it
    if (!(Get-Website -Name $APP_NAME -ErrorAction SilentlyContinue)) {
        Notify-Deployment "Info" "Creating new IIS website: $APP_NAME"
        New-Website -Name $APP_NAME -PhysicalPath $DEPLOY_DIR -Port 80 -Force
    } else {
        # Update website settings
        Set-ItemProperty "IIS:\Sites\$APP_NAME" -Name physicalPath -Value $DEPLOY_DIR
        Notify-Deployment "Info" "Updated existing IIS website: $APP_NAME"
    }
    
    # Start the website if it's stopped
    if ((Get-WebsiteState -Name $APP_NAME).Value -ne "Started") {
        Start-Website -Name $APP_NAME
    }
} else {
    Notify-Deployment "Warning" "IIS management module not found. Skipping IIS configuration."
}

# -----------------------------------------------------
# Start Application
# -----------------------------------------------------

try {
    # Install PM2 if not already installed
    if (-not (Get-Command "pm2" -ErrorAction SilentlyContinue)) {
        Notify-Deployment "Info" "Installing PM2..."
        npm install -g pm2 --force
    }
    
    # Change to deployment directory
    Set-Location $DEPLOY_DIR
    
    # Start the application with PM2
    Notify-Deployment "Info" "Starting Next.js development server..."
    $env:NODE_ENV = "development"
    pm2 start npm --name $APP_NAME -- run dev
    
    # Save PM2 process list so it persists on system reboot
    pm2 save
    
    # Set up PM2 to start on boot if not already configured
    $startupOutput = pm2 startup
    if ($startupOutput -match "Run the following command") {
        Notify-Deployment "Warning" "PM2 startup needs manual configuration. Run the command suggested by PM2."
    }
    
    # Show PM2 status
    Notify-Deployment "Info" "Checking application status..."
    pm2 status
} catch {
    Notify-Deployment "Error" "Failed to start application"
    throw
}

# -----------------------------------------------------
# Post-Deployment
# -----------------------------------------------------

# Display deployment information
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Successful!" -ForegroundColor Green
Write-Host "Your application is now running at:" -ForegroundColor White
Write-Host "http://localhost:3000 (development server)" -ForegroundColor Yellow
if ($DOMAIN -ne "localhost") {
    Write-Host "http://$DOMAIN (if DNS is configured)" -ForegroundColor Yellow
}
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "To view logs: pm2 logs $APP_NAME" -ForegroundColor White
Write-Host "To restart: pm2 restart $APP_NAME" -ForegroundColor White
Write-Host "To stop: pm2 stop $APP_NAME" -ForegroundColor White
Write-Host "To update after code changes: simply run this deploy script again" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan

Notify-Deployment "Success" "Development environment is ready at http://localhost:3000"