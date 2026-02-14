#!/usr/bin/env node

/**
 * Automated deployment script for Zalo Mini App
 * Handles validation, git operations, and deployment
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => {
        rl.question(question, answer => {
            resolve(answer);
        });
    });
}

function exec(command, options = {}) {
    try {
        console.log(`\n🔧 Executing: ${command}`);
        execSync(command, { stdio: 'inherit', ...options });
        return true;
    } catch (error) {
        console.error(`\n❌ Command failed: ${command}`);
        return false;
    }
}

async function main() {
    console.log('🚀 Zalo Mini App Automated Deployment\n');
    console.log('='.repeat(50));

    // Step 1: Validation
    console.log('\n📋 Step 1: Running validation checks...');
    if (!exec('node scripts/validate-zalo-config.js')) {
        console.error('\n❌ Validation failed. Please fix errors before deploying.');
        process.exit(1);
    }

    // Step 2: Git status
    console.log('\n📊 Step 2: Checking git status...');
    exec('git status --short');

    const confirmGit = await ask('\n❓ Do you want to commit and push changes? (y/n): ');

    if (confirmGit.toLowerCase() === 'y') {
        // Step 3: Git operations
        console.log('\n📦 Step 3: Committing changes...');

        const commitMessage = await ask('💬 Enter commit message (or press Enter for default): ');
        const message = commitMessage.trim() || 'fix: zalo mini app authentication and network errors';

        if (!exec('git add .')) {
            console.error('\n❌ Git add failed');
            process.exit(1);
        }

        if (!exec(`git commit -m "${message}"`)) {
            console.log('\n⚠️  No changes to commit or commit failed');
        }

        const confirmPush = await ask('\n❓ Push to remote? (y/n): ');
        if (confirmPush.toLowerCase() === 'y') {
            if (!exec('git push origin main')) {
                console.error('\n❌ Git push failed');
                process.exit(1);
            }

            console.log('\n✅ Code pushed successfully!');
            console.log('⏰ Waiting 30 seconds for backend deployment...');

            // Wait for backend deployment
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }

    // Step 4: Deploy Zalo Mini App
    console.log('\n🚀 Step 4: Deploying Zalo Mini App...');

    const deployEnv = await ask('\n❓ Deploy to Testing or Development? (t/d): ');

    const deployCommand = deployEnv.toLowerCase() === 'd'
        ? 'npm run zmp:deploy:dev'
        : 'npm run zmp:deploy';

    console.log(`\n📱 Deploying to ${deployEnv.toLowerCase() === 'd' ? 'Development' : 'Testing'}...`);

    if (!exec(deployCommand, { cwd: 'apps/zalo' })) {
        console.error('\n❌ Deployment failed');
        process.exit(1);
    }

    // Step 5: Success
    console.log('\n' + '='.repeat(50));
    console.log('\n🎉 Deployment completed successfully!\n');
    console.log('📱 Next steps:');
    console.log('1. Open Zalo app on your phone');
    console.log('2. Clear the Mini App from recent list');
    console.log('3. Scan the QR code shown above');
    console.log('4. Test the following:');
    console.log('   - View salon list');
    console.log('   - Login with Zalo');
    console.log('   - Make a booking');
    console.log('   - View bookings');
    console.log('\n📚 For troubleshooting, see: README_ZALO_FIX.md');
    console.log('='.repeat(50));

    rl.close();
}

main().catch(error => {
    console.error('\n❌ Deployment script failed:', error);
    rl.close();
    process.exit(1);
});
