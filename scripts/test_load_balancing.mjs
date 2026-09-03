// ============================================================
// COOP HUB Load Balancer & High Availability Verification Suite
// Real Multi-Process Demonstration of Round-Robin & Failover
// ============================================================

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLoadBalancer } from './load_balancer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPath = path.resolve(__dirname, '../server/server.js');

const instances = [
    { id: 'api-1', port: 5001, proc: null },
    { id: 'api-2', port: 5002, proc: null },
    { id: 'api-3', port: 5003, proc: null }
];

function spawnInstance(config) {
    return new Promise((resolve) => {
        const proc = spawn('node', [serverPath], {
            env: {
                ...process.env,
                PORT: config.port,
                INSTANCE_ID: config.id,
                NODE_ENV: 'test'
            },
            stdio: ['ignore', 'pipe', 'pipe']
        });

        config.proc = proc;

        proc.stdout.on('data', (data) => {
            const str = data.toString();
            if (str.includes('Backend AI Relay Server running') || str.includes('running on port')) {
                resolve(proc);
            }
        });

        proc.on('error', (err) => {
            console.error(`Failed to start ${config.id}:`, err);
        });

        // Fallback resolve after 1500ms
        setTimeout(() => resolve(proc), 1500);
    });
}

function killInstance(config) {
    if (config.proc) {
        try {
            config.proc.kill('SIGTERM');
        } catch (e) {
            // Already dead
        }
        config.proc = null;
    }
}

async function fetchHealth(url = 'http://127.0.0.1:5000/api/health') {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

async function runDemo() {
    console.log('\n======================================================');
    console.log('   COOP HUB LOAD BALANCING & HIGH AVAILABILITY PROOF   ');
    console.log('======================================================\n');

    let lb = null;

    try {
        // 1. Start all three backend instances
        console.log('[Step 1] Spawning 3 horizontally scaled Express API instances...');
        for (const inst of instances) {
            process.stdout.write(`  • Launching ${inst.id} on port ${inst.port}... `);
            await spawnInstance(inst);
            console.log('READY');
        }

        // 2. Start the Load Balancer on port 5000
        console.log('\n[Step 2] Starting Reverse Proxy Load Balancer on port 5000...');
        lb = createLoadBalancer({
            port: 5000,
            targets: [
                { id: 'api-1', url: 'http://127.0.0.1:5001' },
                { id: 'api-2', url: 'http://127.0.0.1:5002' },
                { id: 'api-3', url: 'http://127.0.0.1:5003' }
            ],
            silent: true
        });
        await lb.listen();
        console.log('  ✓ Load Balancer active at http://127.0.0.1:5000');

        // Warm up and verify instances directly
        for (const inst of instances) {
            const h = await fetchHealth(`http://127.0.0.1:${inst.port}/api/health`);
            if (h.instance !== inst.id) throw new Error(`Mismatch on ${inst.id}: got ${h.instance}`);
        }
        console.log('  ✓ All 3 backend instances confirmed responsive.\n');

        // 3. Test Round-Robin Traffic Distribution
        console.log('[Step 3] Testing Round-Robin traffic distribution (9 requests)...');
        const distribution = {};
        for (let i = 1; i <= 9; i++) {
            const result = await fetchHealth('http://127.0.0.1:5000/api/health');
            distribution[result.instance] = (distribution[result.instance] || 0) + 1;
            console.log(`  Request #${i} -> Served by [${result.instance}] (Status: ${result.status}, Service: ${result.service})`);
            await new Promise(r => setTimeout(r, 80));
        }

        console.log('\n  Traffic Distribution Summary:');
        for (const [id, count] of Object.entries(distribution)) {
            console.log(`    - ${id}: ${count} requests (${Math.round(count / 9 * 100)}%)`);
        }

        const distinctNodes = Object.keys(distribution).length;
        if (distinctNodes < 3) {
            throw new Error(`Expected traffic across 3 nodes, but only saw ${distinctNodes}`);
        }
        console.log('  ✅ PASS: Round-Robin successfully distributed traffic across all 3 nodes!\n');

        // 4. Test Fault Tolerance / Node Failure
        console.log('[Step 4] Simulating outage: Force-stopping api-2 (port 5002)...');
        killInstance(instances[1]);
        console.log('  ❌ api-2 is now DOWN.\n');

        console.log('[Step 5] Sending 6 requests through Load Balancer during api-2 outage...');
        const failoverDist = {};
        for (let i = 1; i <= 6; i++) {
            const result = await fetchHealth('http://127.0.0.1:5000/api/health');
            failoverDist[result.instance] = (failoverDist[result.instance] || 0) + 1;
            console.log(`  Request #${i} -> Served by [${result.instance}] (Status: ${result.status})`);
            await new Promise(r => setTimeout(r, 80));
        }

        console.log('\n  Failover Distribution Summary:');
        for (const [id, count] of Object.entries(failoverDist)) {
            console.log(`    - ${id}: ${count} requests`);
        }

        if (failoverDist['api-2']) {
            throw new Error('api-2 should NOT have served any requests while down!');
        }
        if (!failoverDist['api-1'] || !failoverDist['api-3']) {
            throw new Error('Healthy instances api-1 and api-3 did not receive traffic during outage.');
        }
        console.log('  ✅ PASS: Seamless failover achieved! 100% request success rate with api-2 offline.\n');

        // 5. Test Node Recovery
        console.log('[Step 6] Simulating node recovery: Restarting api-2 (port 5002)...');
        await spawnInstance(instances[1]);
        console.log('  🔄 api-2 has been restored and rejoined the cluster.\n');

        console.log('[Step 7] Sending 6 requests to verify api-2 has re-entered rotation...');
        const recoveryDist = {};
        for (let i = 1; i <= 6; i++) {
            const result = await fetchHealth('http://127.0.0.1:5000/api/health');
            recoveryDist[result.instance] = (recoveryDist[result.instance] || 0) + 1;
            console.log(`  Request #${i} -> Served by [${result.instance}]`);
            await new Promise(r => setTimeout(r, 80));
        }

        console.log('\n  Post-Recovery Distribution Summary:');
        for (const [id, count] of Object.entries(recoveryDist)) {
            console.log(`    - ${id}: ${count} requests`);
        }

        if (!recoveryDist['api-2']) {
            throw new Error('api-2 did not receive traffic after being restored.');
        }
        console.log('  ✅ PASS: Node recovery verified! Cluster returned to full 3-node capacity.\n');

        console.log('======================================================');
        console.log('   RESULT: ALL 3 LOAD-BALANCING PROOFS PASSED (3/3)   ');
        console.log('======================================================\n');

    } catch (err) {
        console.error('\n❌ LOAD BALANCER TEST FAILED:', err.message);
        process.exitCode = 1;
    } finally {
        // Cleanup all child processes & load balancer
        for (const inst of instances) {
            killInstance(inst);
        }
        if (lb) {
            await lb.close();
        }
    }
}

runDemo();
