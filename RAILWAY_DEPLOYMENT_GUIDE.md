# Railway Deployment Configuration Guide

## Current Issue
Railway deployment is failing with database connection error: `ECONNREFUSED ::1:3306`

This happens because Railway is using the local `.env` file values instead of Railway-specific environment variables.

## ✅ Solution: Configure Railway Environment Variables

### Step 1: Access Railway Dashboard
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your `jpr-backend-production` project
3. Click on the **Variables** tab

### Step 2: Set Required Environment Variables

**CRITICAL**: You must set these variables in Railway dashboard (NOT in .env file):

#### Database Configuration
```
DB_HOST=<your-railway-mysql-host>
DB_USER=<your-railway-mysql-user>
DB_PASSWORD=<your-railway-mysql-password>
DB_NAME=<your-railway-mysql-database>
DB_PORT=3306
```

#### Application Configuration
```
BASE_URL=https://jpr-backend-production.up.railway.app
PORT=5000
JWT_SECRET=3ALW2xS8W2tx3HXagezU42GjAyR2DBPNsBDw6nScX3N
```

#### Email Configuration (Optional)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=applauseitdev@gmail.com
SMTP_PASS=okyc smgd vhdk vyah
CONTACT_RECEIVER=neeraj.codeverge@gmail.com
```

### Step 3: Get Railway MySQL Credentials

#### Option A: If you have Railway MySQL service
1. In Railway dashboard, click on your MySQL service
2. Go to **Variables** tab
3. Copy the connection details:
   - `MYSQL_HOST` → use as `DB_HOST`
   - `MYSQL_USER` → use as `DB_USER`
   - `MYSQL_PASSWORD` → use as `DB_PASSWORD`
   - `MYSQL_DATABASE` → use as `DB_NAME`

#### Option B: If you need to add MySQL service
1. In Railway dashboard, click **+ New**
2. Select **Database** → **MySQL**
3. Wait for deployment
4. Copy the generated credentials to your backend service

### Step 4: Verify Configuration
After setting environment variables:
1. Railway will automatically redeploy
2. Check deployment logs for success
3. Test API endpoints:
   - `https://jpr-backend-production.up.railway.app/api/health`
   - `https://jpr-backend-production.up.railway.app/api/news`

## ✅ Expected Results After Fix

### Image URLs will be correct:
```
Before: http://localhost:5000/uploads/news/image.jpg
After:  https://jpr-backend-production.up.railway.app/uploads/news/image.jpg
```

### PDF URLs will be correct:
```
Before: http://localhost:5000/uploads/publications/file.pdf
After:  https://jpr-backend-production.up.railway.app/uploads/publications/file.pdf
```

## 🔧 Technical Details

The `src/utils/config.js` file automatically detects Railway environment:
- Uses `BASE_URL` if set
- Falls back to `RAILWAY_STATIC_URL` if available
- Defaults to localhost for development

## 🚨 Important Notes

1. **Never commit database credentials to .env file**
2. **Always use Railway dashboard for production variables**
3. **The .env file is only for local development**
4. **Railway ignores .env file in production**

## 🎯 Action Plan (Do This Now)

### Immediate Steps:
1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Select your project**: `jpr-backend-production`
3. **Click Variables tab**
4. **Add these variables** (get DB credentials from your Railway MySQL service):
   ```
   DB_HOST=<your-railway-mysql-host>
   DB_USER=<your-railway-mysql-user>  
   DB_PASSWORD=<your-railway-mysql-password>
   DB_NAME=<your-railway-mysql-database>
   BASE_URL=https://jpr-backend-production.up.railway.app
   ```
5. **Save and wait** for automatic redeployment (2-3 minutes)

### Test Deployment:
```bash
# Run this test script after setting variables
node test-deployment.js
```

### Verify Frontend Integration:
1. Open admin panel: https://jpr-public.vercel.app/admin
2. Try adding news with images
3. Check that image URLs show: `https://jpr-backend-production.up.railway.app/uploads/...`
4. Verify images display correctly in frontend

## 🔍 Troubleshooting

### If deployment still fails:
1. Check Railway logs for specific error messages
2. Verify MySQL service is running in Railway
3. Ensure all environment variables are set correctly
4. Contact Railway support if database connection issues persist

### If images still show localhost URLs:
1. Verify `BASE_URL` is set in Railway variables
2. Check that Railway deployment completed successfully
3. Clear browser cache and test again