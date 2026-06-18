#!/bin/bash
# 🚀 Deploy Helper Script
# Usage: bash deploy.sh
# Ini script untuk push code ke GitHub sebelum deploy ke Vercel

echo "🚀 E-Computer - Prepare for Vercel Deployment"
echo "=============================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git repository not found!"
    echo "Please run: git init"
    exit 1
fi

echo "📝 Checking git status..."
git status

echo ""
echo "========== DEPLOYMENT STEPS =========="
echo ""
echo "1️⃣  Update Environment Files"
echo "   Backend:  Copy backend/.env.example to backend/.env"
echo "   Frontend: Copy frontend/.env.example to frontend/.env"
echo ""

echo "2️⃣  Add and commit changes:"
echo "   git add ."
echo "   git commit -m 'Prepare: Vercel & Supabase deployment'"
echo "   git push"
echo ""

echo "3️⃣  Then go to:"
echo "   https://vercel.com/dashboard"
echo ""

echo "4️⃣  Follow the deployment guide:"
echo "   📄 VERCEL_SUPABASE_DEPLOYMENT.md"
echo "   📄 DEPLOYMENT_CHECKLIST.md"
echo ""

echo "Ready? Execute these commands:"
echo ""
echo "  git add ."
echo "  git commit -m 'feat: Vercel and Supabase deployment configuration'"
echo "  git push"
echo ""
echo "After push, Vercel will auto-deploy if connected to GitHub!"
echo ""
