# COOP HUB — Infrastructure Demonstration & Judge Proof Guide

This document provides exact, runnable commands to demonstrate that **Horizontal Scaling**, **Load Balancing**, **Fault Tolerance**, and **CI/CD Automation** are real, functioning components of the COOP HUB platform.

---

## ⚡ Option A: Automated One-Command High Availability Proof

For instant evaluation on any workstation (macOS, Linux, or Windows without Docker):

```bash
npm run cluster:demo
```

### What this automated verification does:
1. Spawns 3 live Express backend processes on ports `5001`, `5002`, and `5003` with distinct `INSTANCE_ID`s (`api-1`, `api-2`, `api-3`).
2. Launches an active reverse-proxy load balancer on port `5000`.
3. Dispatches 9 consecutive requests to `http://localhost:5000/api/health` and shows balanced round-robin distribution (33% each across `api-1`, `api-2`, `api-3`).
4. Force-terminates `api-2` to simulate a critical process crash.
5. Sends 6 additional requests, proving 100% success rate with traffic dynamically routing exclusively between `api-1` and `api-3`.
6. Restarts `api-2` and verifies it automatically rejoins the active rotation.
7. Shuts down all processes cleanly.

---

## 🐳 Option B: Production Docker & Nginx Demonstration

For environments with Docker and Docker Compose installed:

### Step 1: Start the 3-Node Backend Cluster & Nginx Load Balancer
```bash
docker compose up -d --build
```

Verify that all 4 containers are healthy and running:
```bash
docker compose ps
```
*Output will display `coophub-load-balancer`, `coophub-api-1`, `coophub-api-2`, and `coophub-api-3` in `Up` status.*

---

### Step 2: Query the Health Check Endpoint Repeatedly
Execute several requests through the Nginx load balancer:

**PowerShell (Windows):**
```powershell
1..6 | ForEach-Object { (Invoke-RestMethod -Uri "http://localhost:5000/api/health").instance }
```

**Bash / Curl (Linux / macOS):**
```bash
for i in {1..6}; do curl -s http://localhost:5000/api/health | jq -r .instance; done
```

**Observed Output (Round-Robin in action):**
```text
api-1
api-2
api-3
api-1
api-2
api-3
```
*Each backend instance receives traffic in turn, proving load distribution.*

---

### Step 3: Test Fault Tolerance (Simulate Node Crash)
Simulate an unexpected outage by stopping container `api-2`:
```bash
docker compose stop api-2
```

Query the load balancer again:

**PowerShell (Windows):**
```powershell
1..4 | ForEach-Object { (Invoke-RestMethod -Uri "http://localhost:5000/api/health").instance }
```

**Bash / Curl (Linux / macOS):**
```bash
for i in {1..4}; do curl -s http://localhost:5000/api/health | jq -r .instance; done
```

**Observed Output:**
```text
api-1
api-3
api-1
api-3
```
*Notice: Zero dropped packets, zero 502 Bad Gateway errors. Traffic routes exclusively through healthy nodes.*

---

### Step 4: Test Node Recovery (Self-Healing Cluster)
Restart the stopped instance:
```bash
docker compose start api-2
```

Query the load balancer once more:

**PowerShell (Windows):**
```powershell
1..6 | ForEach-Object { (Invoke-RestMethod -Uri "http://localhost:5000/api/health").instance }
```

**Bash / Curl (Linux / macOS):**
```bash
for i in {1..6}; do curl -s http://localhost:5000/api/health | jq -r .instance; done
```

**Observed Output:**
```text
api-1
api-2
api-3
api-1
api-2
api-3
```
*`api-2` has automatically rejoined the cluster without reloading Nginx.*

---

### Step 5: Stop the Cluster
```bash
docker compose down
```

---

## 🚀 Option C: CI/CD Pipeline Proof

### 1. Run Complete CI Checks Locally
Before committing or pushing, you can execute the exact checks run by GitHub Actions:

```bash
# 1. Run Linter & Secret Audit
npm run lint

# 2. Run All Automated Test Suites (35+ assertions)
npm test

# 3. Compile Production Web Bundle
npm run build
```

### 2. Verify GitHub Actions in the Cloud
1. Push any commit to the `main` branch or open a Pull Request:
   ```bash
   git add .
   git commit -m "feat(infra): load balancing and CI/CD validation"
   git push origin main
   ```
2. In GitHub, navigate to the **Actions** tab of the repository (`https://github.com/ANUPRIYA2007/coophub/actions`).
3. Observe the **COOP HUB Continuous Integration (CI)** workflow:
   - ✅ **Lint, Test & Vite Build**: Executes `npm ci`, `npm run lint`, `npm test`, and `npm run build`.
   - ✅ **Docker & Load Balancer Validation**: Verifies `Dockerfile` build, checks `docker compose config`, starts a live test container, and confirms `/api/health`.
4. Inspect the **COOP HUB Continuous Deployment (CD)** workflow:
   - ✅ Builds and pushes release image to GitHub Container Registry (`ghcr.io`).
   - ✅ Performs automated deployment rollout when `DEPLOY_HOST` secrets are configured.
