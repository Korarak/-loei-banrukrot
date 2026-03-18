#!/bin/bash

# Professional Docker Deployment Script
# Usage: ./deploy.sh

# 1. Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting Deployment: $(date) ===${NC}"

# 2. Pull the latest images from the registry
echo -e "${YELLOW}Pulling latest images...${NC}"
docker compose pull

# 3. Update the containers
echo -e "${YELLOW}Updating containers...${NC}"
docker compose up -d

# 4. Cleanup old/dangling images
# This is the "Professional" way to keep the server clean automatically
echo -e "${YELLOW}Cleaning up old images...${NC}"
docker image prune -f

# 5. Verify the deployment
echo -e "${YELLOW}Verifying service status...${NC}"
sleep 5
docker compose ps

echo -e "${GREEN}=== Deployment Completed Successfully! ===${NC}"
