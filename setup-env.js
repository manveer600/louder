/**
 * Environment Setup Script
 * Creates .env files for backend and frontend
 * Run: node setup-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment files...\n');

// Backend .env
const backendEnvPath = path.join(__dirname, 'backend', '.env');
const backendEnvContent = `NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DATABASE
FRONTEND_URL=http://localhost:3000
API_VERSION=v1
SCRAPING_INTERVAL_HOURS=6
LOG_LEVEL=info

# Gmail Configuration (for sending confirmation emails)
# Get App Password: https://myaccount.google.com/apppasswords
USER=singhmanveer645@gmail.com
APP_PASSWORD=wcqdsknnrhimbaez

# ⚠️ SECURITY WARNING: Replace all placeholders with your actual credentials
# Never commit this file to version control
`;

if (!fs.existsSync(backendEnvPath)) {
  fs.writeFileSync(backendEnvPath, backendEnvContent);
  console.log('✅ Created backend/.env');
} else {
  console.log('⚠️  backend/.env already exists (skipped)');
}

// Frontend .env
const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
const frontendEnvContent = `REACT_APP_API_BASE_URL=http://localhost:5000/api/v1
`;

if (!fs.existsSync(frontendEnvPath)) {
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  console.log('✅ Created frontend/.env');
} else {
  console.log('⚠️  frontend/.env already exists (skipped)');
}

console.log('\n✨ Environment setup complete!');
console.log('\n📋 Next steps:');
console.log('  1. Start backend: cd backend && npm run dev');
console.log('  2. Start frontend (in new terminal): cd frontend && npm start');
console.log('  3. Trigger scraping: curl -X POST http://localhost:5000/api/v1/events/scrape');
console.log('\n');
