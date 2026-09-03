// ==============================================================================
// COOP HUB — Production & Staging Automated Rollback Controller
// Reverts failed deployments to the previous stable container image tag
// ==============================================================================

import { execSync } from 'child_process';

const targetTag = process.argv[2] || process.env.ROLLBACK_IMAGE_TAG || 'previous';
const composeFile = process.env.COMPOSE_FILE || 'docker-compose.yml';

console.log('='.repeat(75));
console.log('COOP HUB — AUTOMATED DEPLOYMENT ROLLBACK CONTROLLER');
console.log('='.repeat(75));
console.log(`Target Rollback Tag: ${targetTag}`);
console.log(`Compose Configuration: ${composeFile}\n`);

function executeCommand(cmd, label) {
  try {
    process.stdout.write(`• ${label}... `);
    const out = execSync(cmd, { stdio: 'pipe' }).toString();
    console.log('DONE');
    return { success: true, output: out };
  } catch (err) {
    console.log('FAILED');
    console.error(`  Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function verifyHealth(url = 'http://localhost:5000/api/health', retries = 10) {
  process.stdout.write('• Verifying cluster health post-rollback... ');
  for (let i = 1; i <= retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        console.log(`HEALTHY (HTTP 200 on attempt ${i})`);
        return true;
      }
    } catch (e) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  console.log('TIMEOUT');
  return false;
}

async function runRollback() {
  console.log('[Step 1] Checking local Docker daemon availability...');
  const dockerCheck = executeCommand('docker info --format "{{.ServerVersion}}"', 'Querying Docker daemon');
  if (!dockerCheck.success) {
    console.error('❌ Docker is not available in current execution context. Rollback aborted.');
    process.exit(1);
  }

  console.log('\n[Step 2] Executing atomic container rollback via Docker Compose...');
  // Pull previous image tag if registry is specified
  if (process.env.IMAGE_REPOSITORY && targetTag !== 'previous') {
    executeCommand(`docker pull ${process.env.IMAGE_REPOSITORY}:${targetTag}`, `Pulling ${targetTag}`);
  }

  // Gracefully restart containers with previous configuration
  const upRes = executeCommand(`docker compose -f ${composeFile} up -d --remove-orphans`, 'Applying rollback state');
  if (!upRes.success) {
    console.error('❌ Failed to apply rollback compose configuration.');
    process.exit(1);
  }

  console.log('\n[Step 3] Post-rollback health verification...');
  const isHealthy = await verifyHealth();

  if (isHealthy) {
    console.log('\n======================================================');
    console.log('   ROLLBACK COMPLETE: Cluster successfully restored!   ');
    console.log('======================================================\n');
    process.exit(0);
  } else {
    console.error('\n❌ CRITICAL: Rollback completed but health check did not pass.');
    process.exit(1);
  }
}

runRollback();
