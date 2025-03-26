#!/bin/bash

# Railway Deployment Test Script
# This script tests if your Railway deployment is working correctly

# Set the base URL for your API (update this with your Railway URL)
BASE_URL="https://personal-website-backend-production-0cc2.up.railway.app"

# Colors for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Railway Deployment Test ===${NC}"
echo -e "${BLUE}Testing deployment at: ${BASE_URL}${NC}"
echo -e "${BLUE}----------------------------------------${NC}"

# Test health endpoint
echo -e "\n${BLUE}Testing Health Endpoint${NC}"
response=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/health")
status_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo -e "${YELLOW}Status:${NC} ${status_code}"
if [[ $status_code -ge 200 && $status_code -lt 300 ]]; then
  echo -e "${GREEN}Health endpoint working!${NC}"
else
  echo -e "${RED}Health endpoint failed!${NC}"
fi
echo -e "${YELLOW}Response:${NC} ${body}"

# Test Supabase connection
echo -e "\n${BLUE}Testing Supabase Connection${NC}"
echo -e "${YELLOW}Checking logs for Supabase connection...${NC}"
echo -e "${GREEN}To check if Supabase is connected:${NC}"
echo -e "1. Go to your Railway project"
echo -e "2. Click on the 'Logs' tab"
echo -e "3. Look for: 'Supabase Service Debug: SUPABASE_URL defined: YES'"
echo -e "4. Look for: 'Supabase Service Debug: SUPABASE_SERVICE_KEY defined: YES'"

# Test profile endpoint (which uses Supabase)
echo -e "\n${BLUE}Testing Profile Endpoint (Supabase-dependent)${NC}"
response=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/profile")
status_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo -e "${YELLOW}Status:${NC} ${status_code}"
if [[ $status_code -ge 200 && $status_code -lt 300 ]]; then
  echo -e "${GREEN}Profile endpoint working! Supabase connection successful.${NC}"
else
  echo -e "${RED}Profile endpoint failed! Possible Supabase connection issue.${NC}"
fi
echo -e "${YELLOW}Response:${NC} ${body}"

echo -e "\n${BLUE}=== Deployment Test Complete ===${NC}"
echo -e "\n${YELLOW}If you're seeing errors, check:${NC}"
echo -e "1. Environment variables in Railway"
echo -e "2. Logs in Railway for specific error messages"
echo -e "3. Refer to RAILWAY_ENV_GUIDE.md for troubleshooting steps"