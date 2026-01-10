/**
 * Setup Checker Script
 * Run this to verify your setup is correct
 * Usage: node check-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking LOUDER Setup...\n');

// Check backend .env
console.log('📁 Backend Configuration:');
const backendEnvPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(backendEnvPath)) {
  console.log('  ✅ backend/.env exists');
  const envContent = fs.readFileSync(backendEnvPath, 'utf8');
  const requiredVars = ['MONGODB_URI', 'PORT', 'FRONTEND_URL'];
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`  ✅ ${varName} is set`);
    } else {
      console.log(`  ❌ ${varName} is missing`);
    }
  });
} else {
  console.log('  ❌ backend/.env NOT FOUND');
  console.log('  📝 Create it with:');
  console.log('     NODE_ENV=development');
  console.log('     PORT=5000');
  console.log('     MONGODB_URI=mongodb+srv://singhmanveer645:waheguru@cluster0.uk9srd7.mongodb.net/louder');
  console.log('     FRONTEND_URL=http://localhost:3000');
  console.log('     API_VERSION=v1');
  console.log('     SCRAPING_INTERVAL_HOURS=6');
  console.log('     LOG_LEVEL=info');
}

// Check frontend .env
console.log('\n📁 Frontend Configuration:');
const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
if (fs.existsSync(frontendEnvPath)) {
  console.log('  ✅ frontend/.env exists');
  const envContent = fs.readFileSync(frontendEnvPath, 'utf8');
  if (envContent.includes('REACT_APP_API_BASE_URL')) {
    console.log('  ✅ REACT_APP_API_BASE_URL is set');
  } else {
    console.log('  ❌ REACT_APP_API_BASE_URL is missing');
  }
} else {
  console.log('  ❌ frontend/.env NOT FOUND');
  console.log('  📝 Create it with:');
  console.log('     REACT_APP_API_BASE_URL=http://localhost:5000/api/v1');
}

// Check node_modules
console.log('\n📦 Dependencies:');
const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
const frontendNodeModules = path.join(__dirname, 'frontend', 'node_modules');

if (fs.existsSync(backendNodeModules)) {
  console.log('  ✅ backend/node_modules exists');
} else {
  console.log('  ❌ backend/node_modules NOT FOUND');
  console.log('  📝 Run: cd backend && npm install');
}

if (fs.existsSync(frontendNodeModules)) {
  console.log('  ✅ frontend/node_modules exists');
} else {
  console.log('  ❌ frontend/node_modules NOT FOUND');
  console.log('  📝 Run: cd frontend && npm install');
}

console.log('\n📋 Next Steps:');
console.log('  1. Ensure backend/.env exists with correct values');
console.log('  2. Ensure frontend/.env exists with REACT_APP_API_BASE_URL');
console.log('  3. Install dependencies: npm install (in both directories)');
console.log('  4. Start backend: cd backend && npm run dev');
console.log('  5. Start frontend: cd frontend && npm start');
console.log('  6. Trigger scraping: curl -X POST http://localhost:5000/api/v1/events/scrape');
console.log('\n✨ Check complete!\n');
