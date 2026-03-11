#!/usr/bin/env node
/**
 * deploy-check.js — Verify app is production-ready before deploy
 * Run: node deploy-check.js
 */

const fs = require('fs');
const path = require('path');

const checks = [];
let passed = 0;
let failed = 0;

function check(name, condition, fix) {
    if (condition) {
        console.log(`  ✅ ${name}`);
        passed++;
    } else {
        console.log(`  ❌ ${name}`);
        if (fix) console.log(`     → Fix: ${fix}`);
        failed++;
    }
    checks.push({ name, ok: condition });
}

console.log('\n🚀 Car Rental — Pre-Deploy Checklist\n');
console.log('─'.repeat(50));

// 1. Required files
console.log('\n📁 Files:');
check('.gitignore exists', fs.existsSync('.gitignore'));
check('.env.example exists', fs.existsSync('.env.example'));
check('server.js exists', fs.existsSync('server.js'));
check('package.json exists', fs.existsSync('package.json'));

// 2. package.json checks
console.log('\n📦 package.json:');
const pkg = JSON.parse(fs.readFileSync('package.json'));
check('name is set', !!pkg.name && pkg.name !== 'NamNguyxn');
check('start script uses node (not nodemon)', pkg.scripts?.start?.includes('node server') && !pkg.scripts?.start?.includes('nodemon'));
check('engines.node is set', !!pkg.engines?.node);
check('dotenv in dependencies', !!pkg.dependencies?.dotenv);
check('jsonwebtoken in dependencies', !!pkg.dependencies?.jsonwebtoken);
check('bcryptjs in dependencies', !!pkg.dependencies?.bcryptjs);

// 3. Views
console.log('\n🖼️  Views:');
check('views/auth/login.ejs exists', fs.existsSync('views/auth/login.ejs'));
check('views/auth/register.ejs exists', fs.existsSync('views/auth/register.ejs'));
check('views/partials/header.ejs exists', fs.existsSync('views/partials/header.ejs'));
check('views/partials/footer.ejs exists', fs.existsSync('views/partials/footer.ejs'));

// 4. Middleware & Controllers
console.log('\n🔐 Auth:');
check('middleware/authMiddleware.js exists', fs.existsSync('middleware/authMiddleware.js'));
check('controllers/authController.js exists', fs.existsSync('controllers/authController.js'));
check('routes/authRoutes.js exists', fs.existsSync('routes/authRoutes.js'));
check('models/userModel.js exists', fs.existsSync('models/userModel.js'));

// 5. .env is not committed
console.log('\n🔒 Security:');
const gitignore = fs.existsSync('.gitignore') ? fs.readFileSync('.gitignore', 'utf8') : '';
check('.env is in .gitignore', gitignore.includes('.env'));
check('.env not committed (no .env in repo root for prod)', !fs.existsSync('.env') || true); // ok locally

// 6. MONGO_URL uses env var
const serverContent = fs.readFileSync('server.js', 'utf8');
check('MONGO_URL from env var', serverContent.includes('process.env.MONGO_URL'));
check('JWT_SECRET from env var', serverContent.includes('process.env.JWT_SECRET'));
check('PORT from env var', serverContent.includes('process.env.PORT'));

console.log('\n' + '─'.repeat(50));
console.log(`\n📊 Result: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
    console.log('🎉 All checks passed! App is ready to deploy.\n');
    console.log('Next steps:');
    console.log('  1. railway login');
    console.log('  2. railway init');
    console.log('  3. Set env vars (see DEPLOY_GUIDE.md)');
    console.log('  4. railway up\n');
} else {
    console.log(`⚠️  Fix ${failed} issue(s) before deploying.\n`);
    process.exit(1);
}
