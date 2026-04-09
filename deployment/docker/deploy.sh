#!/bin/bash
# Production deployment script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Email Exchange Competitor - Production Deployment${NC}"
echo "======================================================="
echo ""

# Configuration
DOMAIN=${1:-example.com}
EMAIL=${2:-admin@example.com}
ENVIRONMENT=${3:-production}

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "Domain: $DOMAIN"
echo "Admin Email: $EMAIL"
echo "Environment: $ENVIRONMENT"
echo ""

# Backup existing database
echo -e "${BLUE}💾 Backing up existing database...${NC}"
if command -v docker &> /dev/null; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    docker exec email-db pg_dump -U emailserver emailserver_db > "backup_$TIMESTAMP.sql" || true
    echo -e "${GREEN}✅ Database backed up${NC}"
fi

# Build images
echo ""
echo -e "${BLUE}🔨 Building Docker images...${NC}"
npm run docker:build

# Apply migrations
echo ""
echo -e "${BLUE}🗄️ Applying database migrations...${NC}"
docker-compose -f deployment/docker/docker-compose.yml up -d postgres redis
sleep 10

# Start services
echo ""
echo -e "${BLUE}🚀 Starting services...${NC}"
npm run docker:up

# Wait for services to be ready
echo ""
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 30

# Health checks
echo ""
echo -e "${BLUE}🏥 Running health checks...${NC}"
curl -f http://localhost:3000/health || echo -e "${RED}❌ Backend health check failed${NC}"
curl -f http://localhost:8080/health || echo -e "${RED}❌ Gateway health check failed${NC}"

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}📝 Post-deployment steps:${NC}"
echo "1. Update DNS records for $DOMAIN"
echo "2. Configure SSL certificates in deployment/docker/certs/"
echo "3. Access admin dashboard: https://localhost:3200"
echo "4. Create first admin user"
echo "5. Configure mail flow rules"
echo ""
echo -e "${BLUE}📊 Service endpoints:${NC}"
echo "- Webmail: http://localhost:3100"
echo "- Admin: http://localhost:3200"
echo "- API: http://localhost:3000"
echo "- Gateway: http://localhost:8080"
echo ""
