# COOP HUB — Multi-Tier Environment & Configuration Architecture

This document defines the strict separation of runtime configurations, security boundaries, and KYC operational states across all deployment environments in COOP HUB.

---

## 1. Environment Tier Matrix

| Dimension | LOCAL | TEST (CI Runner) | STAGING | PRODUCTION |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Purpose** | Local feature development & debugging | Automated GitHub Actions CI/CD validation | Pre-production testing, smoke checks, and client QA | Live cooperative technician dispatch & welfare operations |
| **Node Environment** | `NODE_ENV=development` | `NODE_ENV=test` | `NODE_ENV=production` | `NODE_ENV=production` |
| **Host Configuration** | `localhost:5000` / `localhost:5173` | Isolated ephemeral Docker container | `staging.coophub.org` | `coophub.org` / `api.coophub.org` |
| **UIDAI Secure QR** | Payload decoded; signature reported as `SIGNATURE_KEY_NOT_CONFIGURED` | Synthetic RFC 1951 Deflate fixtures tested | Staging public key validation | Live UIDAI DSC Public Certificate (`UIDAI_DSC_PUBLIC_KEY`) |
| **DigiLocker Integration** | `NOT_CONFIGURED` (truthful fallback to OCR) | Synthetic boundary test (mock tokens prohibited) | DigiLocker Sandbox Partner API | Production MeriPehchaan OAuth2 Credentials |
| **OCR Engines** | PaddleOCR / NVIDIA Vision (Tesseract strictly isolated to diagnostic) | OCR boundary adapter tests | PaddleOCR + EasyOCR staging microservices | PaddleOCR (primary) + EasyOCR (secondary) + NVIDIA Vision |
| **AI LLM Engine** | NVIDIA NIM / Gemini Flash fallback | Provider abstraction test harness (no live keys) | Staging API Keys | Production Dedicated Enterprise Keys |
| **Database** | Local / Development Supabase Project | Ephemeral or Test Supabase Schema | Staging Supabase DB | Production Supabase DB (Strict RLS Enabled) |
| **Load Balancer** | Standalone Express instance | Multi-instance port test (5001, 5002, 5003) | Nginx Reverse Proxy (3 API nodes) | Nginx Load Balancer with round-robin failover |

---

## 2. Security Quarantine Rules

1. **Never Commit Secrets**:
   - `UIDAI_DSC_PUBLIC_KEY`
   - `DIGILOCKER_CLIENT_SECRET`
   - `NVIDIA_API_KEY`
   - `GEMINI_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Real citizen Aadhaar, PAN, DL, or Voter data
2. **Frontend vs. Backend Isolation**:
   - Variables prefixed with `VITE_` are bundled into client-side JavaScript assets.
   - **NEVER** expose backend secrets (e.g. `DIGILOCKER_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) with the `VITE_` prefix.
3. **Truthful Degradation**:
   - If an external government service key is missing in any environment:
     - Return `{ status: 'NOT_CONFIGURED', authoritative_verified: false, verification_status: 'manual_review' }`.
     - **NEVER** simulate success, fabricate a token, or mark the document as `OFFICIALLY_VERIFIED`.

---

## 3. GitHub Actions Secrets Configuration

| Secret Name | Scope | Description |
| :--- | :--- | :--- |
| `DEPLOY_HOST` | Staging / Production | SSH target server IP / hostname |
| `DEPLOY_USER` | Staging / Production | SSH deployment username (e.g. `deploy`) |
| `DEPLOY_SSH_KEY` | Staging / Production | Ed25519 / RSA private key for server deployment |
| `DEPLOY_PORT` | Staging / Production | SSH port (default: `22`) |
| `STAGING_URL` | Staging | Base URL of staging deployment (e.g. `https://staging-api.coophub.org`) |
| `PRODUCTION_URL` | Production | Base URL of production deployment (e.g. `https://api.coophub.org`) |
| `GHCR_TOKEN` | Global | GitHub Container Registry deployment token |
