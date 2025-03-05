#!/bin/bash

# Build the Next.js application
echo "Building Next.js application..."
npm run build

# Create directory if it doesn't exist
echo "Setting up deployment directory..."
sudo mkdir -p /var/www/luxury-management

# Copy build files
echo "Copying build files..."
sudo cp -r .next /var/www/luxury-management/
sudo cp -r public /var/www/luxury-management/
sudo cp package.json /var/www/luxury-management/

# Install production dependencies
echo "Installing production dependencies..."
cd /var/www/luxury-management
sudo npm install --production

# Setup PM2 for process management
echo "Setting up PM2..."
sudo npm install -g pm2
pm2 start npm --name "luxury-management" -- start

# Setup Nginx
echo "Setting up Nginx..."
sudo cp nginx.test.conf /etc/nginx/sites-available/luxury-management
sudo ln -s /etc/nginx/sites-available/luxury-management /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

echo "Deployment complete! Application should be running on your domain."