#!/bin/bash
# Setup script for production deployment

set -e

echo "🚀 Email Exchange Competitor - Setup Script"
echo "==========================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }
echo "✅ Node.js and npm found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Generate SSL certificates if not present
echo ""
echo "🔐 Checking SSL certificates..."
if [ ! -d "deployment/docker/certs" ]; then
    mkdir -p deployment/docker/certs
    cd deployment/docker/certs
    openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes -subj "/CN=mail.example.com"
    cd ../../..
    echo "✅ Generated self-signed certificates"
else
    echo "✅ SSL certificates found"
fi

# Setup environment
echo ""
echo "⚙️ Setting up environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file (update with your settings)"
else
    echo "✅ .env file exists"
fi

# Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p data/postgres
mkdir -p data/redis

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env with your configuration"
echo "2. Update DNS records for your domain"
echo "3. Run: npm run docker:up"
echo "4. Access:"
echo "   - Webmail: http://localhost:3100"
echo "   - Admin: http://localhost:3200"
echo ""
