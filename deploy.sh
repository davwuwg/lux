#!/bin/bash

# Function for error handling and notifications
notify() {
    if command -v notify-send &> /dev/null; then
        notify-send "Deployment $1" "$2"
    fi
    echo "$1: $2"
}

# Domain configuration - CHANGE THIS TO YOUR DOMAIN
DOMAIN="cdm.velx.site"
EMAIL="admin@velx.site" # Used for Let's Encrypt SSL certificates
# Turnstile configuration
TURNSTILE_SITE_KEY="0x4AAAAAAA_nlAnnKt5Uo_bH"
TURNSTILE_SECRET_KEY="0x4AAAAAAA_nlG7R4LGuHqzKDw0vQthRPxA"

# Error handling
set -e
trap 'notify "Error" "Deployment failed at line $LINENO"' ERR

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    notify "Error" "Please run as root (use sudo)"
    exit 1
fi

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

# Skip npm update - use the version that comes with Node.js 18
echo "Using npm version that comes with Node.js 18..."
npm --version

# Verify Node.js and npm installation
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Create .env.local file with environment variables
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
EOF

# Install dependencies
echo "Installing dependencies..."
npm install || {
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

# Create directory if it doesn't exist
echo "Setting up development directory..."
mkdir -p /var/www/luxury-management || {
    notify "Error" "Failed to create directory"
    exit 1
}

# Copy project files
echo "Copying project files..."
cp -r . /var/www/luxury-management/ || {
    notify "Error" "Failed to copy project files"
    exit 1
}

# Copy environment variables to the deployment directory
cp .env.local /var/www/luxury-management/ || {
    notify "Warning" "Failed to copy environment variables, but continuing deployment"
}

# Create a modified Nginx config with the domain
echo "Creating Nginx configuration with domain $DOMAIN..."
cat > /etc/nginx/sites-available/luxury-management << EOF
server {
    listen 80;
    server_name $DOMAIN;

    root /var/www/luxury-management;
    index index.html;

    # Error log for debugging
    error_log /var/log/nginx/luxury-dev-error.log debug;
    access_log /var/log/nginx/luxury-dev-access.log;

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
if [ ! -f /etc/nginx/sites-enabled/luxury-management ]; then
    ln -s /etc/nginx/sites-available/luxury-management /etc/nginx/sites-enabled/ || {
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

# Setup SSL with Let's Encrypt if certbot is available
if command -v certbot &> /dev/null; then
    echo "Setting up SSL certificates for $DOMAIN..."
    # Non-interactive certificate generation
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL || {
        notify "Warning" "Failed to setup SSL certificates, but continuing with HTTP"
    }
else
    notify "Warning" "Certbot not available, skipping SSL setup"
fi

# Start development server with PM2
cd /var/www/luxury-management
echo "Installing PM2..."
npm install -g pm2@latest || {
    notify "Error" "Failed to install PM2"
    exit 1
}

# Kill existing PM2 process if it exists
pm2 delete luxury-management 2>/dev/null || true

# Start the development server
echo "Starting Next.js development server with proper environment..."
NODE_ENV=development pm2 start npm --name "luxury-management" -- run dev || {
    notify "Error" "Failed to start development server"
    exit 1
}

# Check if DNS is properly configured
echo "Checking if DNS for $DOMAIN is properly configured..."
if host $DOMAIN >/dev/null; then
    DOMAIN_READY=true
    echo "✓ DNS is properly configured for $DOMAIN"
else
    DOMAIN_READY=false
    echo "⚠ DNS check failed for $DOMAIN. You may need to configure DNS to point to this server's IP."
    echo "This server's IP address is: $(curl -s ifconfig.me)"
fi

# Display deployment information with both HTTP and HTTPS links
echo "=========================================="
echo "Deployment Successful!"
echo "Your application is now running at:"
if [ "$DOMAIN_READY" = true ] && command -v certbot &> /dev/null; then
    echo "🔒 https://$DOMAIN (with SSL)"
    echo "http://$DOMAIN (redirects to https)"
else
    echo "http://$DOMAIN"
    echo "Note: SSL setup was skipped or DNS not configured yet"
fi
echo "Localhost development URL: http://localhost:3000"
echo "=========================================="
echo "To view logs: pm2 logs luxury-management"
echo "To restart: pm2 restart luxury-management"
echo "To stop: pm2 stop luxury-management"
echo "=========================================="

# Monitor logs (reduced lines to prevent script hanging)
pm2 logs luxury-management --lines 20 || {
    notify "Warning" "Failed to display logs, but deployment was successful"
}

notify "Success" "Development environment is ready at http://$DOMAIN"