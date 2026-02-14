#!/usr/bin/env node

/**
 * Pre-deployment validation script for Zalo Mini App
 * Checks all configuration files and common issues before deployment
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_APP_ID = '2917748007370695388';
const REQUIRED_API_URL = 'https://barber-api.paduy.tech/api';

let errors = [];
let warnings = [];
let passed = [];

console.log('🔍 Zalo Mini App Pre-Deployment Validation\n');
console.log('='.repeat(50));

// Check 1: Verify app ID in all config files
function checkAppId() {
    console.log('\n📋 Checking App ID configuration...');

    const configFiles = [
        { path: 'apps/zalo/app.json', key: 'app.id' },
        { path: 'apps/zalo/app-config.json', key: 'app.id' },
        { path: 'apps/zalo/zmp.json', key: 'appId' },
        { path: 'apps/zalo/zmp.config.cjs', key: 'app.id' }
    ];

    configFiles.forEach(({ path: filePath, key }) => {
        try {
            const fullPath = path.join(process.cwd(), filePath);

            if (filePath.endsWith('.cjs')) {
                // For .cjs files, read as text and check
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.includes(`id: '${REQUIRED_APP_ID}'`) || content.includes(`id: "${REQUIRED_APP_ID}"`)) {
                    passed.push(`✅ ${filePath}: App ID found`);
                } else {
                    errors.push(`❌ ${filePath}: App ID missing or incorrect`);
                }
            } else {
                // For JSON files
                const config = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                const keys = key.split('.');
                let value = config;

                for (const k of keys) {
                    value = value?.[k];
                }

                if (value === REQUIRED_APP_ID) {
                    passed.push(`✅ ${filePath}: App ID correct`);
                } else {
                    errors.push(`❌ ${filePath}: App ID missing or incorrect (found: ${value})`);
                }
            }
        } catch (error) {
            errors.push(`❌ ${filePath}: Error reading file - ${error.message}`);
        }
    });
}

// Check 2: Verify API URL configuration
function checkApiUrl() {
    console.log('\n🌐 Checking API URL configuration...');

    try {
        const constantsPath = path.join(process.cwd(), 'apps/zalo/src/config/constants.ts');
        const content = fs.readFileSync(constantsPath, 'utf8');

        if (content.includes(REQUIRED_API_URL)) {
            passed.push(`✅ API URL is correctly set to production`);
        } else if (content.includes('localhost')) {
            errors.push(`❌ API URL still points to localhost - will not work on mobile`);
        } else {
            warnings.push(`⚠️  API URL may not be correct - please verify`);
        }
    } catch (error) {
        errors.push(`❌ Error checking API URL: ${error.message}`);
    }
}

// Check 3: Verify routing configuration
function checkRouting() {
    console.log('\n🔀 Checking routing configuration...');

    try {
        const appPath = path.join(process.cwd(), 'apps/zalo/src/app.tsx');
        const content = fs.readFileSync(appPath, 'utf8');

        if (content.includes('HashRouter')) {
            passed.push(`✅ Using HashRouter (correct for Zalo Mini App)`);
        } else if (content.includes('BrowserRouter')) {
            errors.push(`❌ Still using BrowserRouter - will cause white screen on mobile`);
        } else {
            warnings.push(`⚠️  Could not detect router type`);
        }
    } catch (error) {
        errors.push(`❌ Error checking routing: ${error.message}`);
    }
}

// Check 4: Verify vite base configuration
function checkViteBase() {
    console.log('\n⚙️  Checking Vite base configuration...');

    try {
        const vitePath = path.join(process.cwd(), 'apps/zalo/vite.config.mjs');
        const content = fs.readFileSync(vitePath, 'utf8');

        if (content.includes("base: './'")) {
            passed.push(`✅ Vite base is set to './' (correct)`);
        } else if (content.includes("base: '/'")) {
            errors.push(`❌ Vite base is '/' - assets may not load on mobile`);
        } else {
            warnings.push(`⚠️  Could not detect Vite base configuration`);
        }
    } catch (error) {
        errors.push(`❌ Error checking Vite config: ${error.message}`);
    }
}

// Check 5: Verify deploy script
function checkDeployScript() {
    console.log('\n🚀 Checking deploy script...');

    try {
        const deployPath = path.join(process.cwd(), 'apps/zalo/deploy.cjs');
        const content = fs.readFileSync(deployPath, 'utf8');

        if (content.includes('npx zmp-cli deploy')) {
            passed.push(`✅ Deploy script uses 'zmp-cli' (correct)`);
        } else if (content.includes('npx zmp deploy')) {
            errors.push(`❌ Deploy script uses 'zmp' instead of 'zmp-cli' - will fail on Windows`);
        } else {
            warnings.push(`⚠️  Could not detect deploy command`);
        }
    } catch (error) {
        errors.push(`❌ Error checking deploy script: ${error.message}`);
    }
}

// Check 6: Verify backend CORS configuration
function checkCors() {
    console.log('\n🔒 Checking backend CORS configuration...');

    try {
        const mainPath = path.join(process.cwd(), 'apps/api/src/main.ts');
        const content = fs.readFileSync(mainPath, 'utf8');

        if (content.includes('zbrowser://') || content.includes('h5.zalo.me')) {
            passed.push(`✅ CORS configured for Zalo domains`);
        } else {
            warnings.push(`⚠️  CORS may not include Zalo domains - check manually`);
        }
    } catch (error) {
        warnings.push(`⚠️  Could not check CORS config: ${error.message}`);
    }
}

// Check 7: Verify auth fallback
function checkAuthFallback() {
    console.log('\n🔐 Checking authentication fallback...');

    try {
        const authServicePath = path.join(process.cwd(), 'apps/zalo/src/services/auth.service.ts');
        const content = fs.readFileSync(authServicePath, 'utf8');

        if (content.includes('Failed to get Zalo token')) {
            passed.push(`✅ Auth service has fallback for -1401 error`);
        } else {
            warnings.push(`⚠️  Auth service may not handle -1401 error gracefully`);
        }

        const strategyPath = path.join(process.cwd(), 'apps/api/src/auth/strategies/zalo.strategy.ts');
        const strategyContent = fs.readFileSync(strategyPath, 'utf8');

        if (strategyContent.includes('fallback authentication')) {
            passed.push(`✅ Backend supports fallback authentication`);
        } else {
            warnings.push(`⚠️  Backend may not support zaloId-only authentication`);
        }
    } catch (error) {
        warnings.push(`⚠️  Could not check auth fallback: ${error.message}`);
    }
}

// Run all checks
checkAppId();
checkApiUrl();
checkRouting();
checkViteBase();
checkDeployScript();
checkCors();
checkAuthFallback();

// Print results
console.log('\n' + '='.repeat(50));
console.log('\n📊 Validation Results:\n');

if (passed.length > 0) {
    console.log('✅ PASSED:');
    passed.forEach(msg => console.log(`   ${msg}`));
}

if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(msg => console.log(`   ${msg}`));
}

if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach(msg => console.log(`   ${msg}`));
}

console.log('\n' + '='.repeat(50));

if (errors.length === 0) {
    console.log('\n✅ All critical checks passed! Ready to deploy.');
    console.log('\nNext steps:');
    console.log('1. git add . && git commit -m "fix: zalo mini app issues" && git push');
    console.log('2. Wait 2-3 minutes for backend deployment');
    console.log('3. cd apps/zalo && npm run zmp:deploy');
    process.exit(0);
} else {
    console.log('\n❌ Please fix the errors above before deploying.');
    console.log('\nRefer to ZALO_DEPLOYMENT_GUIDE.md for detailed instructions.');
    process.exit(1);
}
