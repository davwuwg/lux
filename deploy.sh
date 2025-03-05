#!/bin/bash

# Function for error handling and notifications
notify() {
    if command -v notify-send &> /dev/null; then
        notify-send "Deployment $1" "$2"
    fi
    echo "$1: $2"
}

# Error handling
set -e
trap 'notify "Error" "Deployment failed at line $LINENO"' ERR

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    notify "Error" "Please run as root (use sudo)"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install || {
    notify "Error" "Failed to install dependencies"
    exit 1
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

# Setup Nginx for development
echo "Setting up Nginx..."
cp nginx.test.conf /etc/nginx/sites-available/luxury-management || {
    notify "Error" "Failed to copy nginx config"
    exit 1
}

# Create symlink if it doesn't exist
if [ ! -f /etc/nginx/sites-enabled/luxury-management ]; then
    ln -s /etc/nginx/sites-available/luxury-management /etc/nginx/sites-enabled/ || {
        notify "Error" "Failed to create nginx symlink"
        exit 1
    }
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

# Start development server with PM2
cd /var/www/luxury-management
npm install -g pm2 || {
    notify "Error" "Failed to install PM2"
    exit 1
}

# Kill existing PM2 process if it exists
pm2 delete luxury-management 2>/dev/null || true

# Start the development server
pm2 start npm --name "luxury-management" -- run dev || {
    notify "Error" "Failed to start development server"
    exit 1
}

# Monitor logs
pm2 logs luxury-management --lines 100 || {
    notify "Error" "Failed to display logs"
    exit 1
}

notify "Success" "Development environment is ready at http://localhost"
echo "Development server is running. View logs with: pm2 logs luxury-management"