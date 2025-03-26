#!/bin/bash

# API Testing Script
# This script tests various endpoints of your Railway-deployed API

# Set the base URL for your API
BASE_URL="https://personal-website-backend-production-ad66.up.railway.app"

# Colors for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to make a GET request and display the result
test_get_endpoint() {
  local endpoint=$1
  local description=$2
  
  echo -e "\n${BLUE}Testing ${description} (GET ${endpoint})${NC}"
  echo -e "${YELLOW}Request:${NC} GET ${BASE_URL}${endpoint}"
  
  # Make the request
  response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${endpoint}")
  
  # Extract status code (last line) and response body
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  # Display results
  echo -e "${YELLOW}Status:${NC} ${status_code}"
  
  if [[ $status_code -ge 200 && $status_code -lt 300 ]]; then
    echo -e "${GREEN}Success!${NC}"
  else
    echo -e "${RED}Failed!${NC}"
  fi
  
  echo -e "${YELLOW}Response:${NC}"
  echo "$body" | json_pp 2>/dev/null || echo "$body"
  echo -e "${BLUE}----------------------------------------${NC}"
}

# Function to make a POST request and display the result
test_post_endpoint() {
  local endpoint=$1
  local description=$2
  local data=$3
  
  echo -e "\n${BLUE}Testing ${description} (POST ${endpoint})${NC}"
  echo -e "${YELLOW}Request:${NC} POST ${BASE_URL}${endpoint}"
  echo -e "${YELLOW}Data:${NC} ${data}"
  
  # Make the request
  response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "${data}" "${BASE_URL}${endpoint}")
  
  # Extract status code (last line) and response body
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  # Display results
  echo -e "${YELLOW}Status:${NC} ${status_code}"
  
  if [[ $status_code -ge 200 && $status_code -lt 300 ]]; then
    echo -e "${GREEN}Success!${NC}"
  else
    echo -e "${RED}Failed!${NC}"
  fi
  
  echo -e "${YELLOW}Response:${NC}"
  echo "$body" | json_pp 2>/dev/null || echo "$body"
  echo -e "${BLUE}----------------------------------------${NC}"
}

# Main testing sequence
echo -e "${BLUE}=== API Testing Script ===${NC}"
echo -e "${BLUE}Base URL: ${BASE_URL}${NC}"
echo -e "${BLUE}----------------------------------------${NC}"

# Test health endpoint
test_get_endpoint "/api/health" "Health Check Endpoint"

# Test profile endpoint
test_get_endpoint "/api/profile" "Profile Endpoint"

# Test blog posts endpoint
test_get_endpoint "/api/blog-posts" "Blog Posts Endpoint"

# Test case studies endpoint
test_get_endpoint "/api/case-studies" "Case Studies Endpoint"

# Test contact endpoint with sample data
test_post_endpoint "/api/contact" "Contact Endpoint" '{"name":"Test User","email":"test@example.com","message":"This is a test message"}'

echo -e "\n${BLUE}=== Testing Complete ===${NC}"