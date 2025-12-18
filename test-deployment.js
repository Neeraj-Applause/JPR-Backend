#!/usr/bin/env node

/**
 * Railway Deployment Test Script
 * Run this after setting environment variables in Railway dashboard
 */

const https = require('https');

const BASE_URL = 'https://jpr-backend-production.up.railway.app';

const testEndpoints = [
  { path: '/api', description: 'Health Check' },
  { path: '/api/news', description: 'News API' },
  { path: '/api/publications', description: 'Publications API' }
];

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${path}`;
    console.log(`Testing ${description}: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const status = res.statusCode;
        const success = status >= 200 && status < 300;
        console.log(`  ✅ Status: ${status} ${success ? '(Success)' : '(Error)'}`);
        if (!success) {
          console.log(`  ❌ Response: ${data.substring(0, 200)}...`);
        }
        resolve({ success, status, path });
      });
    }).on('error', (err) => {
      console.log(`  ❌ Error: ${err.message}`);
      resolve({ success: false, error: err.message, path });
    });
  });
}

async function runTests() {
  console.log('🚀 Testing Railway Deployment...\n');
  
  const results = [];
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(endpoint.path, endpoint.description);
    results.push(result);
    console.log('');
  }
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log('📊 Test Results:');
  console.log(`  ✅ Successful: ${successful}/${total}`);
  console.log(`  ❌ Failed: ${total - successful}/${total}`);
  
  if (successful === total) {
    console.log('\n🎉 All tests passed! Railway deployment is working correctly.');
    console.log('\n📝 Next steps:');
    console.log('  1. Test image upload in admin panel');
    console.log('  2. Verify images display correctly in frontend');
    console.log('  3. Test PDF upload for publications');
  } else {
    console.log('\n⚠️  Some tests failed. Check Railway environment variables:');
    console.log('  1. DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    console.log('  2. BASE_URL=https://jpr-backend-production.up.railway.app');
    console.log('  3. Check Railway deployment logs for errors');
  }
}

// Run tests
runTests().catch(console.error);