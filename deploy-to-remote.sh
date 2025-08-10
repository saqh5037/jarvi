#!/bin/bash

# JARVI Deployment Script for Remote Mac
# Usage: ./deploy-to-remote.sh

set -e

echo "==================================="
echo "JARVI Remote Deployment Script"
echo "==================================="

# Remote configuration
REMOTE_USER="samuelquiroz"
REMOTE_HOST="192.168.1.141"
REMOTE_PATH="/Users/samuelquiroz/Documents/jarvis"

echo ""
echo "📦 Step 1: Preparing deployment package..."
echo "Creating tarball of the project..."

# Create a clean copy excluding node_modules and other unnecessary files
tar -czf jarvi-deploy.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=dist \
  --exclude=*.log \
  --exclude=.DS_Store \
  .

echo "✅ Package created: jarvi-deploy.tar.gz"

echo ""
echo "📤 Step 2: Copying files to remote Mac..."
echo "Target: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"

# Create remote directory if it doesn't exist
ssh ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_PATH}"

# Copy the tarball to remote
scp jarvi-deploy.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/

echo "✅ Files copied to remote"

echo ""
echo "🔧 Step 3: Extracting and setting up on remote..."

# Extract and setup on remote
ssh ${REMOTE_USER}@${REMOTE_HOST} << EOF
  cd ${REMOTE_PATH}
  echo "Extracting files..."
  tar -xzf jarvi-deploy.tar.gz
  rm jarvi-deploy.tar.gz
  
  echo "Setting permissions..."
  chmod +x start-all.sh
  chmod +x start-bot.sh
  chmod +x deploy-to-remote.sh
  
  echo "✅ Files extracted and permissions set"
EOF

# Clean up local tarball
rm jarvi-deploy.tar.gz

echo ""
echo "✅ Deployment package transferred successfully!"
echo ""
echo "==================================="
echo "Next steps on remote Mac:"
echo "==================================="
echo ""
echo "1. SSH into remote Mac:"
echo "   ssh ${REMOTE_USER}@${REMOTE_HOST}"
echo ""
echo "2. Navigate to project:"
echo "   cd ${REMOTE_PATH}"
echo ""
echo "3. Install Docker (if not installed):"
echo "   See instructions in DEPLOYMENT.md"
echo ""
echo "4. Install dependencies:"
echo "   npm install"
echo ""
echo "5. Start with Docker:"
echo "   docker-compose up -d"
echo ""
echo "Or run without Docker:"
echo "   npm run start:all"
echo ""
echo "==================================="