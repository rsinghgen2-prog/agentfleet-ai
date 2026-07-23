#!/bin/bash

# Script to create GitHub repository and push code
# Usage: ./create-github-repo.sh [your-github-token]

set -e

echo "================================================"
echo "  AgentFleet AI - GitHub Repository Setup"
echo "================================================"
echo ""

# Check if token is provided
if [ -z "$1" ]; then
    echo "❌ Error: GitHub Personal Access Token required"
    echo ""
    echo "Usage: ./create-github-repo.sh <your-github-token>"
    echo ""
    echo "To create a token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Select scopes: 'repo' (all sub-scopes)"
    echo "4. Generate and copy the token"
    echo "5. Run: ./create-github-repo.sh <your-token>"
    echo ""
    exit 1
fi

GITHUB_TOKEN="$1"
REPO_OWNER="rsinghgen2-prog"
REPO_NAME="agentfleet-ai"
REPO_DESC="AgentFleet AI - Modern Multi-Tenant SaaS Platform for WhatsApp/SMS Automation with AI-powered messaging, multi-language support, and industry-specific dashboards"

echo "📋 Repository Details:"
echo "  Owner: $REPO_OWNER"
echo "  Name: $REPO_NAME"
echo "  Visibility: Public"
echo ""

# Check if repository already exists
echo "🔍 Checking if repository exists..."
REPO_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME")

if [ "$REPO_CHECK" = "200" ]; then
    echo "✅ Repository already exists!"
    echo "   URL: https://github.com/$REPO_OWNER/$REPO_NAME"
    echo ""
    SKIP_CREATE=true
elif [ "$REPO_CHECK" = "404" ]; then
    echo "📦 Repository does not exist. Creating..."
    SKIP_CREATE=false
else
    echo "❌ Error checking repository (HTTP $REPO_CHECK)"
    echo "   Please check your token and try again."
    exit 1
fi

# Create repository if it doesn't exist
if [ "$SKIP_CREATE" = "false" ]; then
    CREATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        https://api.github.com/user/repos \
        -d "{\"name\":\"$REPO_NAME\",\"description\":\"$REPO_DESC\",\"private\":false,\"has_issues\":true,\"has_projects\":true,\"has_wiki\":true}")
    
    HTTP_CODE=$(echo "$CREATE_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
    
    if [ "$HTTP_CODE" = "201" ]; then
        echo "✅ Repository created successfully!"
        echo "   URL: https://github.com/$REPO_OWNER/$REPO_NAME"
    else
        echo "❌ Failed to create repository (HTTP $HTTP_CODE)"
        echo "$CREATE_RESPONSE" | grep -v "HTTP_CODE"
        exit 1
    fi
fi

echo ""
echo "🔧 Configuring git remote..."

# Check if remote already exists
if git remote | grep -q "^origin$"; then
    echo "   Remote 'origin' already configured"
    CURRENT_URL=$(git remote get-url origin)
    EXPECTED_URL="https://github.com/$REPO_OWNER/$REPO_NAME.git"
    
    if [ "$CURRENT_URL" != "$EXPECTED_URL" ]; then
        echo "   Updating remote URL..."
        git remote set-url origin "$EXPECTED_URL"
    fi
else
    echo "   Adding remote 'origin'..."
    git remote add origin "https://github.com/$REPO_OWNER/$REPO_NAME.git"
fi

echo ""
echo "📤 Pushing code to GitHub..."
echo ""

# Configure git credential helper to use the token
git config credential.helper '!f() { echo "username=token"; echo "password='$GITHUB_TOKEN'"; }; f'

# Push to GitHub
if git push -u origin main; then
    echo ""
    echo "================================================"
    echo "  ✅ SUCCESS!"
    echo "================================================"
    echo ""
    echo "🎉 Your repository is now live at:"
    echo "   https://github.com/$REPO_OWNER/$REPO_NAME"
    echo ""
    echo "📊 Repository Stats:"
    echo "   - Files: 80+"
    echo "   - Lines of code: 18,000+"
    echo "   - Documentation: 20+ MD files"
    echo ""
    echo "🔗 Next Steps:"
    echo "   1. Visit your repository"
    echo "   2. Star it ⭐"
    echo "   3. Share with others!"
    echo "   4. Consider deploying to Vercel or Netlify"
    echo ""
else
    echo ""
    echo "❌ Failed to push code"
    echo "   Please check your internet connection and token permissions"
    exit 1
fi

# Clean up credential helper
git config --unset credential.helper

echo "================================================"
