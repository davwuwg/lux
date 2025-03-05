#!/bin/bash

# Function for error handling and notifications
notify() {
    if command -v notify-send &> /dev/null; then
        notify-send "Deployment $1" "$2"
    fi
    echo "$1: $2"
}

# -----------------------------------------------------
# Configuration Section
# -----------------------------------------------------
# Get environment variables from .env.local if it exists
if [ -f .env.local ]; then
    echo "Loading environment variables from .env.local..."
    # Extract values from .env file
    TURNSTILE_SITE_KEY=$(grep NEXT_PUBLIC_TURNSTILE_SITE_KEY .env.local | cut -d '=' -f2)
    TURNSTILE_SECRET_KEY=$(grep TURNSTILE_SECRET_KEY .env.local | cut -d '=' -f2)
    DOMAIN=$(grep NEXT_PUBLIC_DOMAIN .env.local | cut -d '=' -f2)
else
    # Default configuration - CHANGE THIS TO YOUR DOMAIN
    DOMAIN="cdm.velx.site"
    TURNSTILE_SITE_KEY="0x4AAAAAAA_nlAnnKt5Uo_bH"
    TURNSTILE_SECRET_KEY="0x4AAAAAAA_nlG7R4LGuHqzKDw0vQthRPxA"
fi

# Email for Let's Encrypt SSL certificates
EMAIL="admin@velx.site"

# App configuration
APP_NAME="luxury-management"
DEPLOY_DIR="/var/www/${APP_NAME}"

# -----------------------------------------------------
# Error handling
# -----------------------------------------------------
set -e
trap 'notify "Error" "Deployment failed at line $LINENO"' ERR

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    notify "Error" "Please run as root (use sudo)"
    exit 1
fi

# -----------------------------------------------------
# Kill existing PM2 processes
# -----------------------------------------------------
echo "Checking for existing processes..."
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "${APP_NAME}"; then
        echo "🔄 Stopping existing application..."
        pm2 delete ${APP_NAME} || notify "Warning" "Failed to stop existing application, but continuing"
    fi
fi

# Kill any process using port 3000 (Next.js default port)
if lsof -i:3000 &> /dev/null; then
    echo "🔄 Killing processes on port 3000..."
    kill $(lsof -t -i:3000) 2>/dev/null || notify "Warning" "Failed to kill processes on port 3000, but continuing"
fi

# -----------------------------------------------------
# Dependencies Installation
# -----------------------------------------------------
# Check and install curl if not present
if ! command -v curl &> /dev/null; then
    echo "Installing curl..."
    apt-get update && apt-get install -y curl || {
        notify "Error" "Failed to install curl"
        exit 1
    }
fi

# Check and install Nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt-get update && apt-get install -y nginx || {
        notify "Error" "Failed to install Nginx"
        exit 1
    }
fi

# Install dnsutils for host command
if ! command -v host &> /dev/null; then
    echo "Installing dnsutils..."
    apt-get update && apt-get install -y dnsutils || {
        notify "Warning" "Failed to install dnsutils, DNS checks will be skipped"
    }
fi

# Check QEMU hypervisor status
echo "Checking QEMU hypervisor status..."
if command -v qemu-system-x86_64 &> /dev/null; then
    echo "QEMU is installed. Checking for updates..."
    apt-get update && apt-get install -y qemu-system-x86 || {
        notify "Warning" "Failed to update QEMU, but continuing deployment"
    }
fi

# Install Certbot for SSL certificates
echo "Installing Certbot for SSL certificates..."
apt-get update && apt-get install -y certbot python3-certbot-nginx || {
    notify "Warning" "Failed to install Certbot, will continue without SSL"
}

# Create Nginx directories if they don't exist
echo "Setting up Nginx directories..."
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled || {
    notify "Error" "Failed to create Nginx directories"
    exit 1
}

# Check and install Node.js and npm if not present
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo "Installing Node.js and npm..."
    # Add NodeSource repository for Node.js 18 LTS
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - || {
        notify "Error" "Failed to add NodeSource repository"
        exit 1
    }
    apt-get install -y nodejs || {
        notify "Error" "Failed to install Node.js"
        exit 1
    }
fi

# Verify Node.js and npm installation
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# -----------------------------------------------------
# Application Setup
# -----------------------------------------------------
# Create or update .env.local file with environment variables
echo "Setting up environment variables..."
cat > .env.local << EOF
# Cloudflare Turnstile configuration
NEXT_PUBLIC_TURNSTILE_SITE_KEY=${TURNSTILE_SITE_KEY}
TURNSTILE_SECRET_KEY=${TURNSTILE_SECRET_KEY}

# Domain configuration
NEXT_PUBLIC_DOMAIN=${DOMAIN}
NEXT_PUBLIC_BASE_URL=https://${DOMAIN}

# Set this to false in production
NEXT_PUBLIC_DISABLE_TURNSTILE_IN_DEV=false

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# Install dependencies
echo "Installing dependencies..."
npm ci || npm install || {
    notify "Error" "Failed to install dependencies"
    exit 1
}

# Run npm audit fix (with --no-audit flag to prevent audit issues)
echo "Running npm audit fix..."
npm audit fix --force --no-audit || {
    notify "Warning" "npm audit fix completed with warnings"
}

# Setup development environment variables
export NODE_ENV=development

# -----------------------------------------------------
# Deployment
# -----------------------------------------------------
# Check if deployment directory exists, if not create it
if [ -d "$DEPLOY_DIR" ]; then
    echo "Cleaning existing deployment directory..."
    # Keep the node_modules folder to avoid reinstalling dependencies
    find $DEPLOY_DIR -mindepth 1 -maxdepth 1 ! -name "node_modules" -exec rm -rf {} \;
else
    echo "Creating deployment directory..."
    mkdir -p $DEPLOY_DIR || {
        notify "Error" "Failed to create deployment directory"
        exit 1
    }
fi

# Copy project files
echo "Copying project files..."
cp -r . $DEPLOY_DIR/ || {
    notify "Error" "Failed to copy project files"
    exit 1
}

# Copy environment variables to the deployment directory
cp .env.local $DEPLOY_DIR/ || {
    notify "Warning" "Failed to copy environment variables, creating new one"
    cat > $DEPLOY_DIR/.env.local << EOF
# Cloudflare Turnstile configuration
NEXT_PUBLIC_TURNSTILE_SITE_KEY=${TURNSTILE_SITE_KEY}
TURNSTILE_SECRET_KEY=${TURNSTILE_SECRET_KEY}

# Domain configuration
NEXT_PUBLIC_DOMAIN=${DOMAIN}
NEXT_PUBLIC_BASE_URL=https://${DOMAIN}

# Set this to false in production
NEXT_PUBLIC_DISABLE_TURNSTILE_IN_DEV=false

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
}

# -----------------------------------------------------
# Nginx Configuration
# -----------------------------------------------------
# Create a modified Nginx config with the domain
echo "Creating Nginx configuration with domain $DOMAIN..."
cat > /etc/nginx/sites-available/${APP_NAME} << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    root ${DEPLOY_DIR};
    index index.html;

    # Error log for debugging
    error_log /var/log/nginx/${APP_NAME}-error.log debug;
    access_log /var/log/nginx/${APP_NAME}-access.log;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        
        # Development-specific headers
        add_header X-Development-Mode "true" always;
        
        # Increased timeouts for development
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;

        # Forward real client IP for Turnstile verification
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # Development websocket support for hot reloading
    location /_next/webpack-hmr {
        proxy_pass http://localhost:3000/_next/webpack-hmr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /_next/static {
        proxy_pass http://localhost:3000/_next/static;
        proxy_cache_bypass \$http_upgrade;
    }

    location /static {
        proxy_pass http://localhost:3000/static;
        proxy_cache_bypass \$http_upgrade;
    }

    # Explicitly allow Cloudflare Turnstile API
    location /turnstile/ {
        proxy_pass https://challenges.cloudflare.com/turnstile/;
        proxy_ssl_server_name on;
        proxy_set_header Host challenges.cloudflare.com;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# Create symlink if it doesn't exist
if [ ! -f /etc/nginx/sites-enabled/${APP_NAME} ]; then
    ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/ || {
        notify "Error" "Failed to create nginx symlink"
        exit 1
    }
fi

# Remove default nginx site if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
nginx -t || {
    notify "Error" "Nginx configuration test failed"
    exit 1
}

# Restart Nginx
systemctl restart nginx || {
    notify "Error" "Failed to restart Nginx"
    exit 1
}

# -----------------------------------------------------
# SSL Configuration
# -----------------------------------------------------
# Setup SSL with Let's Encrypt if certbot is available
if command -v certbot &> /dev/null; then
    echo "Setting up SSL certificates for $DOMAIN..."
    # Non-interactive certificate generation
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --keep-until-expiring -m $EMAIL || {
        notify "Warning" "Failed to setup SSL certificates, but continuing with HTTP"
    }
else
    notify "Warning" "Certbot not available, skipping SSL setup"
fi

# -----------------------------------------------------
# Start Application
# -----------------------------------------------------
cd $DEPLOY_DIR
echo "Installing PM2..."
npm install -g pm2@latest || {
    notify "Error" "Failed to install PM2"
    exit 1
}

# Start the development server with environment variables
echo "Starting Next.js development server with proper environment..."
NODE_ENV=development pm2 start npm --name "${APP_NAME}" -- run dev || {
    notify "Error" "Failed to start development server"
    exit 1
}

# Ensure PM2 startup on reboot
pm2 save || notify "Warning" "Failed to save PM2 process list"
if ! pm2 startup | grep -q "already configured"; then
    pm2 startup | tail -n 1 | bash || notify "Warning" "Failed to setup PM2 startup"
    pm2 save || notify "Warning" "Failed to save PM2 process list after startup"
fi

# -----------------------------------------------------
# Post-Deployment Tasks
# -----------------------------------------------------
# Check if DNS is properly configured
echo "Checking if DNS for $DOMAIN is properly configured..."
if host $DOMAIN > /dev/null 2>&1; then
    DOMAIN_READY=true
    echo "✓ DNS is properly configured for $DOMAIN"
else
    DOMAIN_READY=false
    echo "⚠ DNS check failed for $DOMAIN. You may need to configure DNS to point to this server's IP."
    echo "This server's IP address is: $(curl -s ifconfig.me)"
fi

# Display deployment information with both HTTP and HTTPS links
echo "=========================================="
echo "✅ Deployment Successful!"
echo "Your application is now running at:"
if [ "$DOMAIN_READY" = true ] && command -v certbot &> /dev/null && [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "🔒 https://$DOMAIN (with SSL)"
    echo "http://$DOMAIN (redirects to https)"
else
    echo "http://$DOMAIN"
    echo "Note: SSL setup was skipped or DNS not configured yet"
fi
echo "Localhost development URL: http://localhost:3000"
echo "=========================================="
echo "To view logs: pm2 logs ${APP_NAME}"
echo "To restart: pm2 restart ${APP_NAME}"
echo "To stop: pm2 stop ${APP_NAME}"
echo "To update after code changes: simply run this deploy script again"
echo "=========================================="

# Monitor logs (reduced lines to prevent script hanging)
pm2 logs ${APP_NAME} --lines 20 || {
    notify "Warning" "Failed to display logs, but deployment was successful"
}

notify "Success" "Development environment is ready at http://$DOMAIN"