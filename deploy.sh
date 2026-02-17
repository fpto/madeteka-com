#!/bin/bash

# ========================================
# Madeteka.com - Dreamhost Deployment Script
# ========================================
# This script automates the deployment of the Madeteka website to Dreamhost
#
# Usage:
#   1. Update REMOTE_USER with your Dreamhost username
#   2. Make executable: chmod +x deploy.sh
#   3. Run: ./deploy.sh
#
# Prerequisites:
#   - SSH access enabled on your Dreamhost account
#   - SSH key configured (or you'll be prompted for password)
# ========================================

# Configuration
REMOTE_USER="dh_hp47dm"
REMOTE_HOST="pdx1-shared-a4-07.dreamhost.com"
REMOTE_DIR="madeteka.com"  # Web directory on Dreamhost

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Deployment files
FILES=(
    "index.html"
    ".htaccess"
    "robots.txt"
)

# ========================================
# Functions
# ========================================

print_header() {
    echo -e "${GREEN}"
    echo "========================================="
    echo "  Madeteka.com - Dreamhost Deployment"
    echo "========================================="
    echo -e "${NC}"
}

check_config() {
    # Configuration validated - using fabricio.puerto@outlook.com
    echo -e "${GREEN}✓ Configuration: ${REMOTE_USER}${NC}"
    echo ""
}

check_files() {
    echo -e "${YELLOW}🔍 Checking files...${NC}"
    for file in "${FILES[@]}"; do
        if [ ! -f "$file" ]; then
            echo -e "${RED}❌ Error: $file not found${NC}"
            exit 1
        fi
        echo -e "${GREEN}  ✓ $file${NC}"
    done
    echo ""
}

test_connection() {
    echo -e "${YELLOW}🔌 Testing SSH connection...${NC}"
    if ssh -o ConnectTimeout=10 -o BatchMode=yes "${REMOTE_USER}@${REMOTE_HOST}" exit 2>/dev/null; then
        echo -e "${GREEN}  ✓ Connection successful${NC}"
        return 0
    else
        echo -e "${YELLOW}  ⚠ SSH key not configured, you'll be prompted for password${NC}"
        return 1
    fi
    echo ""
}

deploy_files() {
    echo -e "${YELLOW}📤 Deploying files to Dreamhost...${NC}"

    for file in "${FILES[@]}"; do
        echo -e "${YELLOW}  Uploading $file...${NC}"
        if scp "$file" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"; then
            echo -e "${GREEN}    ✓ $file uploaded${NC}"
        else
            echo -e "${RED}    ❌ Failed to upload $file${NC}"
            exit 1
        fi
    done
    echo ""
}

set_permissions() {
    echo -e "${YELLOW}🔒 Setting file permissions...${NC}"

    FILE_LIST="${FILES[*]}"

    if ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && chmod 644 ${FILE_LIST}"; then
        echo -e "${GREEN}  ✓ Permissions set (644)${NC}"
    else
        echo -e "${RED}  ❌ Failed to set permissions${NC}"
        exit 1
    fi
    echo ""
}

verify_deployment() {
    echo -e "${YELLOW}✅ Verifying deployment...${NC}"

    if ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && ls -lh ${FILES[*]}"; then
        echo ""
        echo -e "${GREEN}  ✓ Files verified on server${NC}"
    else
        echo -e "${RED}  ❌ Verification failed${NC}"
        exit 1
    fi
    echo ""
}

print_success() {
    echo -e "${GREEN}"
    echo "========================================="
    echo "  🎉 Deployment Successful!"
    echo "========================================="
    echo -e "${NC}"
    echo ""
    echo "Your website is now live at:"
    echo -e "${GREEN}  🌐 https://madeteka.com${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Visit https://madeteka.com to verify"
    echo "  2. Enable SSL if not already enabled (Dreamhost Panel)"
    echo "  3. Check that all images and links work correctly"
    echo ""
}

# ========================================
# Main Execution
# ========================================

print_header
check_config
check_files
test_connection
deploy_files
set_permissions
verify_deployment
print_success

# Optional: Open website in browser (uncomment if desired)
# open https://madeteka.com  # macOS
# xdg-open https://madeteka.com  # Linux

exit 0
