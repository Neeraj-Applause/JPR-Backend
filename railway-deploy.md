# Quick Railway Deployment Fix

## Issue Fixed ✅
Backend was generating localhost URLs for uploaded files instead of Railway URLs.

## What Changed
- Created smart URL detection in `src/utils/config.js`
- Updated all upload routes to use dynamic URLs
- Now automatically detects Railway environment

## Deploy to Railway

### 1. Push Changes to Git
```bash
git add .
git commit -m "Fix: Dynamic URL generation for Railway deployment"
git push origin main
```

### 2. Railway Will Auto-Deploy
Railway will automatically detect the changes and redeploy.

### 3. Test After Deployment
1. Go to your admin: `https://jpr-public.vercel.app/admin`
2. Add a news item with images
3. Check that image URLs now use: `https://jpr-backend-production.up.railway.app/uploads/...`

## Expected Results
- ❌ Before: `http://localhost:5000/uploads/news/image.jpg`
- ✅ After: `https://jpr-backend-production.up.railway.app/uploads/news/image.jpg`

The system now automatically detects Railway environment and generates correct URLs!