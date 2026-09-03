// ==============================================================================
// COOP HUB — Local Runner for Staging Smoke Tests
// Spawns an isolated test instance, executes smoke checks, and shuts down cleanly
// ==============================================================================

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPath = path.resolve(__dirname, '../server/server.js');
const smokeScript = path.resolve(__dirname, 'smoke_test_staging.mjs');

const TEST_PORT = 5099;

console.log(`• Starting isolated test backend on port ${TEST_PORT}...`);
const serverProc = spawn('node', [serverPath], {
  env: {
    ...process.env,
    PORT: TEST_PORT.toString(),
    INSTANCE_ID: 'api-smoke-test',
    NODE_ENV: 'test'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverReady = false;

serverProc.stdout.on('data', (data) => {
  const msg = data.toString();
  if (msg.includes('running on port') || msg.includes('Backend AI Relay Server running')) {
    serverReady = true;
  }
});

serverProc.stderr.on('data', (data) => {
  // console.error('[Server Error]', data.toString());
});

// Wait up to 3 seconds for server to be responsive
let attempts = 0;
while (attempts < 15) {
  await new Promise(r => setTimeout(r, 200));
  try {
    const res = await fetch(`http://localhost:${TEST_PORT}/api/health`);
    if (res.ok) {
      serverReady = true;
      break;
    }
  } catch (e) {}
  attempts++;
}

if (!serverReady) {
  console.error('❌ Failed to start isolated test server on port ' + TEST_PORT);
  serverProc.kill('SIGTERM');
  process.exit(1);
}

console.log('✓ Isolated test backend ready. Running smoke checks...\n');

const smokeProc = spawn('node', [smokeScript, `--target=http://localhost:${TEST_PORT}`], {
  stdio: 'inherit'
});

smokeProc.on('exit', (code) => {
  serverProc.kill('SIGTERM');
  process.exit(code || 0);
});
