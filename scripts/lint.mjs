// ============================================================
// COOP HUB Repository Linter & Security Audit Suite
// Validates syntax integrity, packaging rules, and secrets isolation
// ============================================================

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('\n======================================================');
console.log('         COOP HUB CI LINT & SECURITY AUDIT            ');
console.log('======================================================\n');

let errors = 0;

function pass(message) {
    console.log(`  ✓ ${message}`);
}

function fail(message) {
    console.error(`  ✗ FAIL: ${message}`);
    errors++;
}

// 1. Syntax Check on Core Server Files
console.log('[Check 1] Validating syntax on server and script files...');
const filesToCheck = [
    'server/server.js',
    'server/index.js',
    'scripts/load_balancer.mjs',
    'scripts/test_load_balancing.mjs',
    'scripts/test-advanced-features.cjs',
    'scripts/test-demand-forecast.cjs',
    'scripts/test-google-maps.cjs',
    'scripts/test_complete_application_wiring.mjs',
    'scripts/test_customer_pillar_journey.cjs',
    'scripts/test_admin_integration.cjs',
    'scripts/test_kyc_authoritative_verification.cjs',
    'scripts/test_demand_forecasting_and_allocation.cjs',
    'scripts/test_kyc_document_intelligence.cjs',
    'scripts/test_emergency_dispatch_operations.cjs',
    'scripts/test_smart_communication.cjs',
    'scripts/test_financial_completion.cjs',
    'scripts/test_welfare_completion.cjs'
];

for (const relPath of filesToCheck) {
    const fullPath = path.join(rootDir, relPath);
    if (fs.existsSync(fullPath)) {
        try {
            execSync(`node --check "${fullPath}"`, { stdio: 'pipe' });
            pass(`Syntax valid: ${relPath}`);
        } catch (e) {
            fail(`Syntax error in ${relPath}: ${e.message}`);
        }
    } else {
        fail(`File not found: ${relPath}`);
    }
}

// 2. Package.json Validation
console.log('\n[Check 2] Validating package.json schema and required scripts...');
try {
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (!pkg.name || !pkg.scripts) {
        fail('package.json missing name or scripts section');
    } else {
        pass('package.json is valid JSON with scripts configured');
    }
    const requiredScripts = ['build', 'dev'];
    for (const s of requiredScripts) {
        if (!pkg.scripts[s]) {
            fail(`package.json missing required script: "${s}"`);
        } else {
            pass(`Required script present: "${s}"`);
        }
    }
} catch (e) {
    fail(`Failed to parse package.json: ${e.message}`);
}

// 3. Security Audit: .env.example Secrets Audit
console.log('\n[Check 3] Auditing .env.example for exposed secrets...');
try {
    const envExamplePath = path.join(rootDir, '.env.example');
    if (!fs.existsSync(envExamplePath)) {
        fail('.env.example missing!');
    } else {
        const content = fs.readFileSync(envExamplePath, 'utf8');
        const isSensitiveKey = (k) => /KEY|SECRET|PASSWORD|TOKEN|CREDENTIAL|AUTH/i.test(k);
        let leaked = false;
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, val] = trimmed.split('=');
                if (key && isSensitiveKey(key.trim()) && val) {
                    const cleanVal = val.trim();
                    if (!cleanVal.startsWith('your-') && !cleanVal.startsWith('https://your-') && cleanVal.length > 20) {
                        fail(`Potential real secret detected in .env.example on key: ${key}`);
                        leaked = true;
                    }
                }
            }
        }
        if (!leaked) {
            pass('.env.example is sanitized (contains only placeholder names)');
        }
    }
} catch (e) {
    fail(`Security check failed: ${e.message}`);
}

// 4. Gitignore Audit: Ensure sensitive files are ignored
console.log('\n[Check 4] Auditing .gitignore configuration...');
try {
    const gitignorePath = path.join(rootDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
        fail('.gitignore file missing!');
    } else {
        const gi = fs.readFileSync(gitignorePath, 'utf8');
        if (gi.includes('.env') && gi.includes('node_modules')) {
            pass('.gitignore properly ignores .env and node_modules');
        } else {
            fail('.gitignore missing rules for .env or node_modules');
        }
    }
} catch (e) {
    fail(`Gitignore check error: ${e.message}`);
}

console.log('\n======================================================');
if (errors === 0) {
    console.log('         LINT & SECURITY AUDIT PASSED (0 ERRORS)      ');
    console.log('======================================================\n');
    process.exit(0);
} else {
    console.error(`         LINT & SECURITY AUDIT FAILED (${errors} ERRORS)    `);
    console.log('======================================================\n');
    process.exit(1);
}
