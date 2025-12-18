# Railway Deployment Fix ✅

## Issues Fixed

### 1. Main Entry Point Error
- **Problem**: Railway was looking for `/app/index.js` but main file is `server.js`
- **Fix**: Updated `package.json` main field from `"index.js"` to `"server.js"`
- **Added**: `"start": "node server.js"` script for production

### 2. Module Import Optimization
- **Problem**: Inline `require()` statements in route handlers
- **Fix**: Moved all config imports to top of files for better performance
- **Benefit**: Faster route execution and cleaner code

### 3. Railway Configuration
- **Added**: `railway.toml` for deployment configuration
- **Configured**: Proper start command and restart policies

## Files Changed
- `package.json` - Fixed main entry point and added start script
- `src/routes/news.js` - Moved config import to top
- `src/routes/admin/news.js` - Moved config import to top  
- `src/routes/admin/publications.js` - Moved config import to top
- `railway.toml` - Added Railway deployment config

## Deploy to Railway
1. Commit and push these changes
2. Railway will auto-deploy with the new configuration
3. URLs will now correctly use Railway domain instead of localhost

## Expected Result
✅ Images: `https://jpr-backend-production.up.railway.app/uploads/news/image.jpg`
✅ PDFs: `https://jpr-backend-production.up.railway.app/uploads/publications/file.pdf`