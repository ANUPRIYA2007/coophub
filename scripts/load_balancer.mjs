// ============================================================
// COOP HUB Node.js Native Load Balancer (Reverse Proxy)
// Zero-dependency local load balancer mirroring Nginx architecture
// ============================================================

import http from 'http';

export function createLoadBalancer({
    port = 5000,
    targets = [
        { id: 'api-1', url: 'http://127.0.0.1:5001', healthy: true },
        { id: 'api-2', url: 'http://127.0.0.1:5002', healthy: true },
        { id: 'api-3', url: 'http://127.0.0.1:5003', healthy: true },
    ],
    silent = false
} = {}) {
    let currentIndex = 0;

    const log = (...args) => {
        if (!silent) console.log('[LoadBalancer]', ...args);
    };

    const server = http.createServer((clientReq, clientRes) => {
        const availableTargets = targets;
        if (availableTargets.length === 0) {
            clientRes.writeHead(503, { 'Content-Type': 'application/json' });
            clientRes.end(JSON.stringify({ error: 'No upstream backend instances available' }));
            return;
        }

        // Buffer body if needed for POST/PUT
        const chunks = [];
        clientReq.on('data', chunk => chunks.push(chunk));
        clientReq.on('end', () => {
            const bodyBuffer = Buffer.concat(chunks);
            forwardRequest(0);

            function forwardRequest(attempt) {
                if (attempt >= availableTargets.length) {
                    clientRes.writeHead(502, { 'Content-Type': 'application/json' });
                    clientRes.end(JSON.stringify({ error: 'All upstream backend instances failed' }));
                    return;
                }

                // Round-robin selection
                const targetIndex = (currentIndex + attempt) % availableTargets.length;
                const target = availableTargets[targetIndex];

                const targetUrl = new URL(clientReq.url, target.url);

                const proxyReq = http.request(
                    targetUrl,
                    {
                        method: clientReq.method,
                        headers: {
                            ...clientReq.headers,
                            host: targetUrl.host,
                            'x-forwarded-for': clientReq.socket.remoteAddress,
                            'x-forwarded-proto': 'http',
                            'x-forwarded-host': clientReq.headers.host || 'localhost'
                        },
                        timeout: 5000
                    },
                    (proxyRes) => {
                        // Success - update round-robin pointer for NEXT independent request
                        currentIndex = (targetIndex + 1) % availableTargets.length;

                        clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
                        proxyRes.pipe(clientRes);
                    }
                );

                proxyReq.on('error', (err) => {
                    log(`Upstream ${target.id} (${target.url}) failed: ${err.message}. Failing over to next node...`);
                    // Failover to next instance
                    forwardRequest(attempt + 1);
                });

                proxyReq.on('timeout', () => {
                    proxyReq.destroy();
                    log(`Upstream ${target.id} timed out. Failing over to next node...`);
                    forwardRequest(attempt + 1);
                });

                if (bodyBuffer.length > 0) {
                    proxyReq.write(bodyBuffer);
                }
                proxyReq.end();
            }
        });
    });

    return {
        server,
        listen: () => new Promise((resolve) => server.listen(port, resolve)),
        close: () => new Promise((resolve) => server.close(resolve))
    };
}

// If executed directly from CLI
if (process.argv[1] && process.argv[1].endsWith('load_balancer.mjs')) {
    const lb = createLoadBalancer({ port: process.env.PORT || 5000 });
    lb.listen().then(() => {
        console.log(`COOP HUB Reverse Proxy Load Balancer running on http://127.0.0.1:5000`);
        console.log(`Balancing traffic across api-1 (5001), api-2 (5002), and api-3 (5003)`);
    });
}
