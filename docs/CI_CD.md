# COOP HUB — CI/CD Pipeline Documentation

This document provides complete engineering and operational documentation for the **GitHub Actions Continuous Integration (CI)** and **Continuous Deployment (CD)** pipelines configured for COOP HUB.

---

## 1. Continuous Integration (CI) Pipeline

The CI pipeline is defined in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

### CI Triggers
The CI workflow automatically executes on:
- Every `push` to the `main` branch.
- Every `pull_request` targeting the `main` branch.

Automatic concurrency control is enforced (`cancel-in-progress: true`), preventing redundant build queue buildup when rapid commits are pushed.

```mermaid
graph TD
    Trigger[Push or Pull Request to main] --> Job1[Job 1: Lint, Test & Production Build]
    Job1 --> Step1[1. Checkout Repository]
    Step1 --> Step2[2. Setup Node.js 20 LTS with npm cache]
    Step2 --> Step3[3. Install Dependencies: npm ci]
    Step3 --> Step4[4. Linter: npm run lint]
    Step4 --> Step5[5. Backend Syntax Check: npm run syntax:check]
    Step5 --> Step6[6. Security Audit: npm run security:check]
    Step6 --> Step7[7. Automated Test Suites: npm test]
    Step7 --> Step8[8. Vite Frontend Build: npm run build]
    Job1 --> Job2[Job 2: Docker & Compose Validation]
    Job2 --> DStep1[1. Build Docker Image: docker build]
    DStep1 --> DStep2[2. Validate Compose: docker compose config]
    DStep2 --> DStep3[3. Live Container Healthcheck: GET /api/health]
```

---

### Step-by-Step CI Stages

#### 1. Dependency Installation
- Command: `npm ci`
- Executes a clean, deterministic install using `package-lock.json` with dependency caching enabled.

#### 2. Linter & Static Analysis
- Command: `npm run lint`
- Inspects code structure, ensures required scripts and schemas in `package.json` are intact, and runs AST checks.

#### 3. Backend Syntax Validation
- Command: `npm run syntax:check` (`node --check server/server.js && node --check server/index.js`)
- Runs Node's native compiler syntax verification on Express entrypoints to catch runtime syntax errors before containerization.

#### 4. Security Audit & Secrets Scan
- Command: `npm run security:check`
- Analyzes `.env.example` to confirm zero real credentials or production keys are committed.
- Confirms `.gitignore` prevents `.env`, `.env.local`, and sensitive patterns from entering git tracking.

#### 5. Automated Test Suites
- Command: `npm test`
- Runs 4 test suites with 35+ test assertions across all subsystems:
  1. **Advanced Production Features**: Haversine distance, matching index scoring, and GST 18% financial splits (91.5% pillar / 8.5% platform).
  2. **Chronos-2 Demand Forecast Suite**: 13 unit tests verifying time-series quantiles (p10, p50, p90), peak evening windows, shortage classification, and deterministic fallbacks.
  3. **Google Maps Platform Suite**: Proximity calculations, address component extraction, and user GPS consent policy enforcement.
  4. **Modular Monolith Wiring Audit**: 40 verification checks confirming all domain services, routers, AI agents, and Supabase interfaces are wired correctly.

#### 6. Production Frontend Build
- Command: `npm run build`
- Builds the client bundle with Vite (`vite build`). Verifies that JSX compiles, CSS tree-shaking succeeds, and all chunk sizes are bounded.

#### 7. Docker Build Validation
- Command: `docker build -t coop-hub-api:ci-test .`
- Compiles the multi-stage production Dockerfile (`node:20-bookworm-slim`), ensuring native bindings for `sharp` and `tesseract.js` compile cleanly without development dependencies.

#### 8. Docker Compose Configuration Check
- Command: `docker compose config --quiet`
- Validates syntax and dependency relationships between `nginx`, `api-1`, `api-2`, and `api-3`.

#### 9. Live Container Startup & Health Probing
- Starts the container in isolation on port 5000 (`docker run -d --name test-api -p 5000:5000 coop-hub-api:ci-test`).
- Polls `GET http://localhost:5000/api/health` up to 25 seconds.
- Fails the build immediately if the container fails to return HTTP 200 with `{ "status": "ok" }`.
- Ensures zero `|| true` masking; all failures result in an immediate pipeline failure.

---

## 2. Continuous Deployment (CD) Pipeline

The CD pipeline is defined in [`.github/workflows/cd.yml`](../.github/workflows/cd.yml).

### CD Triggers
- Automatic: `push` to `main` (after CI passes) or on git release tags (`v*.*.*`).
- Manual: `workflow_dispatch` with environment selection (`staging` or `production`).

### CD Stages:
1. **Container Image Publication**:
   - Builds the production image via Docker Buildx with GitHub Actions layer cache.
   - Pushes the image to **GitHub Container Registry (GHCR)**:
     - Tag: `ghcr.io/<owner>/coophub/backend:latest`
     - Tag: `ghcr.io/<owner>/coophub/backend:<short-sha>`
2. **Conditional Target Rollout**:
   - Inspects whether `DEPLOY_HOST` is configured in GitHub Repository Secrets.
   - If not configured, outputs a clear notice and pauses rollout safely without failing the image build.
   - If configured, connects securely via SSH action (`appleboy/ssh-action@v1.0.3`) and issues zero-downtime rolling update:
     ```bash
     docker compose pull
     docker compose up -d --remove-orphans
     docker system prune -f
     ```
3. **Automated Deployment Health Check**:
   - Connects to the live target URL (`${PRODUCTION_URL}/api/health`).
   - Polls every 5 seconds (up to 12 attempts).
   - Confirms HTTP 200 and healthy JSON response. Fails pipeline if unreachable.

---

## 3. Required Secrets & Environment Configuration

To enable remote automated deployment, add these secrets under **Settings > Secrets and variables > Actions**:

| Secret Name | Required By | Description | Example Value |
| :--- | :--- | :--- | :--- |
| `DEPLOY_HOST` | CD | Target server IP address or hostname | `203.0.113.45` |
| `DEPLOY_USER` | CD | SSH deployment username | `deploy` or `ubuntu` |
| `DEPLOY_SSH_KEY` | CD | Private SSH key (PEM / OpenSSH format) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DEPLOY_PORT` | CD (Optional) | SSH port (defaults to 22) | `22` |
| `PRODUCTION_URL` | CD | Public URL to verify health post-deployment | `https://api.coophub.org` |

*Note: GitHub automatically provides `GITHUB_TOKEN` with write permissions to `ghcr.io` for image publication.*

---

## 4. Rollback Strategy

If a deployment fails the automated health check or an unexpected runtime issue is detected in production:

### Instant Container Rollback (SSH / Server)
To roll back to the previously stable image tag:
```bash
# Set image to specific prior git commit SHA
export BACKEND_IMAGE_TAG=abc1234
docker compose pull
docker compose up -d --remove-orphans
```

### Git-Based Rollback (via GitHub Actions)
Revert the breaking commit on `main` and push:
```bash
git revert HEAD --no-edit
git push origin main
```
The CI/CD pipeline will automatically build the reverted commit, publish the image, and roll it out with zero manual server access required.

---

## 5. Local Verification Commands

You can run the entire pipeline's validation steps on your local machine:

```bash
# 1. Run lint check
npm run lint

# 2. Check server syntax
npm run syntax:check

# 3. Check secrets isolation
npm run security:check

# 4. Run automated test suites
npm test

# 5. Build production frontend
npm run build
```
