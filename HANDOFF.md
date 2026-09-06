# 🏛️ COOP HUB — Master Production Engineering Handoff & Technical Baseline

> **Official Master Platform Architecture & Operational Handoff Document**  
> **Deployment Status:** LIVE & OPERATIONAL ON RENDER + RAILWAY  
> **Audited Baseline Date:** 2026-09-06  
> **Target Launch Hub:** Chennai Metro & Tamil Nadu (Initial Operational Zone: South Zone - SZ)  

---

## 1. Project Overview

### 1.1 Purpose & Vision
**COOP HUB** is an enterprise-grade cooperative home and commercial service ecosystem built to eliminate the systemic exploitation, steep commissions (25%–35%), and lack of social safety nets characteristic of traditional gig-economy platforms (e.g., Urban Company, TaskRabbit).

### 1.2 The Problem Being Solved
* **Fair Technician Compensation:** Traditional aggregator platforms siphon away a significant percentage of earnings from skilled blue-collar workers. COOP HUB enforces a cooperative dividend structure: **Technicians ("Pillars") retain 91.5%** of base customer fees. Only **8.5%** is retained by the cooperative for administrative operations and the collective welfare pool.
* **Statutory Social Security & Welfare:** Technicians receive automated social security on every settled invoice: a **2.5% technician contribution + 2.5% cooperative matching** is deposited into a dedicated Provident Fund (PF) and emergency welfare fund (`pf_contributions`, `welfare_fund_ledger`).
* **Authoritative Identity & Quality Assurance:** Eliminates unverified contractors through government-grade document verification (UIDAI Secure QR, DigiLocker, OCR) and mandatory skill certification checks.

### 1.3 Current Deployment State
The complete unified web platform is **live and deployed on production cloud infrastructure**:
* **Frontend SPA:** Deployed on **Render** as a high-performance static web service.
* **Backend API:** Containerized and deployed on **Railway** as an Express REST & WebSocket service.
* **Database & Auth:** Backed by **Supabase PostgreSQL** with automated migrations and Row-Level Security.

### 1.4 Target Launch Geography
* **Primary Launch Market:** **Chennai Metropolitan Area, Tamil Nadu** (covering North, Central, and South Chennai regional cooperative hubs).
* **National Expansion Architecture:** Seeded with the 4 National Operational Zones (SZ, NZ, WZ, EZ) and all 36 Indian States and Union Territories.

---

## 2. Technology Stack

| Layer | Technologies & Versions | Verified Implementation Details |
| :--- | :--- | :--- |
| **Frontend Web Framework** | React `19.1.0`, Vite `6.4.3`, React Router DOM `7.6.0` | Single-Page Application (SPA) serving 4 specialized portals across 76 application routes and 86 JSX page components. |
| **Styling & Design Tokens** | Tailwind CSS `3.4.17`, Vanilla CSS Design Tokens | HSL harmonious palettes, responsive layouts, government-grade dark & light modes. |
| **3D Graphics & Motion** | Three.js `0.185.1`, GSAP `3.15.0` | Interactive 3D mascot (`Hero3DCanvas`) with automatic try/catch fallback to 2D image in headless/non-WebGL environments. |
| **Backend Runtime** | Node.js (ES Modules), Express `4.21.2` | Stateless REST API service; includes correlation ID middleware (`X-Request-Id`), JSON body parsing, and security headers. |
| **Containerization** | Docker (`node:22-bookworm-slim`) | Deterministic multi-stage build; Node 22 ensures native built-in `WebSocket` support required by `@supabase/supabase-js`. |
| **Database & Realtime** | Supabase (`@supabase/supabase-js` `2.49.0`), PostgreSQL | 29 database migrations; stored procedures, foreign key constraints, Row-Level Security (RLS), and WebSocket change feeds. |
| **AI Inference & LLM** | NVIDIA NIM, Google Gemini Flash | **Primary:** NVIDIA NIM (`meta/llama-3.2-11b-vision-instruct`, `nvidia/nemotron-parse`) — *Live & Verified*. **Secondary:** Google Gemini Flash (`gemini-3.6-flash`). |
| **Document Intelligence & OCR** | PaddleOCR, EasyOCR, NVIDIA Vision | Server-side document analysis pipeline prioritizing specialized OCR microservices with fallback to multimodal vision AI. |
| **Forecasting Engine** | Amazon Chronos-2, Holt-Winters fallback | Demand forecasting with local statistical model fallback active when external Chronos inference endpoint is idle. |
| **Payment Gateway** | Razorpay SDK, Hand-Cash Adapter | Client checkout SDK integration (Sandbox mode) + dual-party verified offline hand-cash settlement workflow. |
| **Maps & Geolocation** | Google Maps JavaScript API | Places Autocomplete, Geocoding, Admin Radar Map, and real-time technician dispatch tracking. |
| **Multilingual Engine** | Central Language Engine (`src/i18n/centralEngine.js`) | 23 registered Indian national languages (22 Eighth Schedule languages + English); runtime verified for English, Tamil, and Hindi. |
| **Speech & Audio** | Browser Web Speech API | Native `SpeechRecognition` and `speechSynthesis` for voice-enabled interactive assistant. |

---

## 3. Architecture

```
                                  ===========================================================
                                                COOP HUB PRODUCTION ARCHITECTURE
                                  ===========================================================

       [ Consumer Web Portal ]        [ Pillar Technician Portal ]     [ Cooperative Admin Portal ]     [ Super Admin Apex Command ]
         (coophub-frontend.               (coophub-frontend.               (coophub-frontend.               (coophub-frontend.
          onrender.com/)                  onrender.com/pillar)             onrender.com/admin)              onrender.com/admin/super-admin)
                  │                                │                                │                                │
                  └────────────────────────────────┴────────────────────────────────┴────────────────────────────────┘
                                                                   │
                                                   HTTPS / TLS (Port 443)
                                                                   ▼
                                            ┌──────────────────────────────────────────────┐
                                            │            Render Static Site                │
                                            │         (Vite Build Artifacts)               │
                                            │  • SPA Routing Fallback (/* -> index.html)   │
                                            │  • Proxy Rewrites (/api/* -> Railway)        │
                                            └──────────────────────┬───────────────────────┘
                                                                   │
                                                 Direct Cross-Origin & Proxied API Calls
                                                 (CORS Authorized: coophub-frontend)
                                                                   ▼
                                            ┌──────────────────────────────────────────────┐
                                            │             Railway Backend                  │
                                            │        (Docker: node:22-bookworm-slim)       │
                                            │  • Express REST API (:5000)                  │
                                            │  • Request Correlation ID Telemetry          │
                                            │  • Strict CORS Whitelist Enforcer            │
                                            │  • Authoritative RBAC Role Resolver          │
                                            │  • NVIDIA NIM / AI Proxy Pipeline            │
                                            │  • Payment & Settlement Engine               │
                                            │  • UIDAI QR Binary Decompressor              │
                                            └──────────────────────┬───────────────────────┘
                                                                   │
                                       ┌───────────────────────────┴───────────────────────────┐
                                       │                                                       │
                                       ▼                                                       ▼
                        ┌──────────────────────────────┐                        ┌──────────────────────────────┐
                        │      External Providers      │                        │     Supabase Cloud (BaaS)    │
                        │  • NVIDIA NIM Cloud API      │                        │  • PostgreSQL Database       │
                        │  • Google Gemini API         │                        │  • 29 Structured Migrations  │
                        │  • Razorpay Payment Gateway  │                        │  • Auth / JWT Verification   │
                        │  • DigiLocker / Sandbox TSP  │                        │  • Private Storage Buckets   │
                        │  • Google Maps Services      │                        │  • Realtime WebSocket Feeds  │
                        └──────────────────────────────┘                        └──────────────────────────────┘
```

### Local Cluster Architecture (Docker / Nginx)
In addition to the cloud deployment, the repository contains a multi-instance local cluster definition:
* `docker-compose.yml`: Launches 3 horizontal Express instances (`api-1`: 5001, `api-2`: 5002, `api-3`: 5003).
* `nginx/nginx.conf`: Round-robin load balancer with automated healthchecks distributing traffic to the local instances.

---

## 4. Live Production Deployment

### 4.1 Production Endpoints
* **Production Frontend:** [https://coophub-frontend.onrender.com](https://coophub-frontend.onrender.com)
* **Production Backend:** [https://coophub-backend-production-60ba.up.railway.app](https://coophub-backend-production-60ba.up.railway.app)
* **Backend Health Check:** [https://coophub-backend-production-60ba.up.railway.app/api/health](https://coophub-backend-production-60ba.up.railway.app/api/health)

### 4.2 Deployment Specifications
* **GitHub Repository:** `ANUPRIYA2007/coophub`
* **Production Branch:** `main`
* **Render Deployment:** Static Site connected via GitHub App; Build command: `npm run build`; Publish directory: `dist`. Single-page application rewrites and `/api/*` proxies handled via `public/_redirects` and `render.yaml`.
* **Railway Deployment:** Containerized web service running Dockerfile on `node:22-bookworm-slim`; Exposes port `5000`; Start command: `node server/server.js`.
* **CORS Policy:** Express `cors` middleware explicitly restricts origins to `https://coophub-frontend.onrender.com`, `process.env.FRONTEND_URL`, and local dev hosts (`localhost:5173`, `localhost:3000`). Preflight requests return `HTTP 204`.
* **Database Connection:** Backend connects to Supabase PostgreSQL using connection pooling and validates JWT bearer tokens via the Supabase Auth API.

---

## 5. Four Operational Portals

COOP HUB isolates its four user groups into dedicated portals with strictly partitioned access control:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       FOUR DEDICATED PORTALS                                           │
├────────────────────────────┬────────────────────────────┬────────────────────────────┬─────────────────┤
│ 🛒 Customer Portal         │ 👥 Pillar Technician Portal│ 🏛️ Cooperative Admin Portal │ 🇮🇳 Super Admin   │
│ Routes: /, /services,      │ Routes: /pillar,           │ Routes: /admin,            │ Routes: /admin/ │
│ /requests, /history        │ /dashboard/*               │ /admin/operations, /finance│ super-admin/*   │
│ Target: Homeowners,        │ Target: Certified          │ Target: District & Zonal   │ Target: National│
│ Businesses, Consumers      │ Electricians, Plumbers, AC │ Society Administrators     │ Apex Command    │
└────────────────────────────┴────────────────────────────┴────────────────────────────┴─────────────────┘
```

### 5.1 Customer Portal
* **Target Audience:** Residential homeowners, renters, and commercial clients seeking vetted services.
* **Core Routes:**
  * `/` & `/home`: Consumer landing page, trade discovery, CoopBot 24/7 AI companion.
  * `/services`: Full category catalog (Electrical, Plumbing, AC & Appliance, Carpentry, Painting, Cleaning).
  * `/requests`: Active bookings, real-time live map tracking, arrival OTP verification display.
  * `/history`: Settled invoices, completed work records, and digital receipts.
  * `/profile` & `/settings`: User preferences, saved addresses, and notification controls.

### 5.2 Pillar Technician Portal
* **Target Audience:** Certified independent cooperative service technicians ("Pillars").
* **Core Routes:**
  * `/pillar`: Portal landing page highlighting 91.5% payout retainage and cooperative benefits.
  * `/pillar/register`: 4-step onboarding (Personal Details, Trade Selection, KYC Identity Verification, Final Submission).
  * `/pillar/login`: Technician credential authentication (email, mobile, or Pillar ID).
  * `/dashboard`: Active dispatch radar, daily earnings summary, and performance metrics.
  * `/dashboard/orders`: Accepted orders, navigation, and customer job management.
  * `/dashboard/earnings`: Gross payouts, 8.5% coop deduction, and 5% total PF contribution ledger.
  * `/dashboard/welfare`: Cooperative emergency assistance claims and Provident Fund statements.
  * `/dashboard/chat`: Direct in-app communication with assigned customers and zonal dispatchers.

### 5.3 Normal Admin Portal (Cooperative Administration)
* **Target Audience:** Zonal, district, and local cooperative managers responsible for day-to-day operations.
* **Access Boundary:** Authenticated via `/admin/login`. Access is strictly constrained to regional cooperative scopes. **Normal Admins cannot access Super Admin functionality; any attempt to navigate to `/admin/super-admin` is stopped with a `403 Forbidden` security block.**
* **Core Routes:**
  * `/admin`: Cooperative overview, active dispatches, and emergency service requests.
  * `/admin/services`: Service catalogue management, baseline rate card configurations.
  * `/admin/requests`: Live request dispatch queue, technician allocation engine.
  * `/admin/tracking`: Live radar map of technicians within regional cooperative jurisdiction.
  * `/admin/operations`: Operational dispute resolution and capacity monitoring.
  * `/admin/finance`: Regional payout batches, coop fee retainage, and ledger audits.
  * `/admin/welfare`: Technician welfare claims verification.

### 5.4 Super Admin Apex Command Center
* **Target Audience:** National Governing Board, State Registrar of Cooperative Societies, Apex Command.
* **Access Boundary:** Enforces Level 5 Apex clearance. Validated authoritatively on the backend via Supabase database role checks (`resolveAdminRole`).
* **Core Routes:**
  * `/admin/super-admin`: National command dashboard, pan-India cooperative health indicators.
  * `/admin/geography`: Geographic hierarchy management (4 Zones, 36 States/UTs, Districts, Societies).
  * `/admin/admins`: Full administrator directory, role assignments, and credential provisioning.
  * `/admin/access-permissions`: Granular RBAC matrix configuration by role and tier.
  * `/admin/enforcement`: Policy violation audits, technician suspensions, and compliance logs.
  * `/admin/system-health`: Live infrastructure monitoring (Railway backend uptime, database latency, AI pipeline).
  * `/admin/security-audit`: Immutable audit log trail capturing administrative operations.

---

## 6. Customer → Pillar Lifecycle

```
Customer              Matching Engine           Pillar               Customer / Pillar
───────               ───────────────           ──────               ─────────────────
   │                         │                     │                         │
   │ 1. Select Service       │                     │                         │
   │ 2. Set Address / Time   │                     │                         │
   │ 3. Submit Request       │                     │                         │
   │────────────────────────>│                     │                         │
   │                         │ 4. Proximity Match  │                         │
   │                         │ 5. Generate OTP     │                         │
   │                         │────────────────────>│                         │
   │                         │                     │ 6. Accept Dispatch      │
   │                         │<────────────────────│                         │
   │ 7. Real-Time Tracking   │                     │                         │
   │<──────────────────────────────────────────────│ 8. Travel to Location   │
   │                         │                     │                         │
   │ 9. Provide 6-digit OTP  │                     │                         │
   │──────────────────────────────────────────────>│ 10. Verify OTP         │
   │                         │                     │     (Status: In Progress)
   │                         │                     │                         │
   │                         │                     │ 11. Complete Service    │
   │                         │                     │ 12. Submit Extra Charge │
   │ 13. Approve Charges     │                     │     (if materials added)│
   │<──────────────────────────────────────────────│                         │
   │                         │                     │                         │
   │ 14. Pay via Hand Cash   │                     │                         │
   │     or Razorpay Online  │                     │                         │
   │────────────────────────>│                     │ 15. Confirm Cash        │
   │                         │                     │     Receipt (if cash)   │
   │ 16. Digital Invoice &   │                     │                         │
   │     PF Deduction Split  │                     │                         │
   │<────────────────────────┴─────────────────────┴─────────────────────────┘
```

| Step | Lifecycle Stage | Implementation Reality & Verification Status |
| :---: | :--- | :--- |
| **1** | Service Selection & Address | 🟢 **Verified Live:** Service catalog selectable on frontend; address capture operational. |
| **2** | Request Submission | 🟢 **Verified Live:** Dispatches persist to `service_requests` table in Supabase. |
| **3** | Dispatch & Matching | 🟢 **Verified Live:** Matching engine evaluates technician availability and trade tags. |
| **4** | Doorstep Arrival OTP | 🟡 **Structurally Verified:** 6-digit OTP generated upon dispatch and validated on arrival. *(See Section 10 for limitations)*. |
| **5** | Extra Material Charges | 🟢 **Verified Live:** Transparent UI for additional parts; requires customer approval before invoice finalization. |
| **6** | Invoice Generation | 🟢 **Verified Live:** Calculates 91.5% pillar base, 8.5% coop fee, and 5% total PF split. |
| **7** | Payment & Settlement | 🟢 **Verified Live (Sandbox/Hand-Cash):** Dual-party hand-cash confirmation verified; Razorpay live in Sandbox mode. |

---

## 7. AI & Document Intelligence Systems

### 7.1 Multi-Model AI Hierarchy
1. **Primary Vision & Chat Inference (NVIDIA NIM):**
   * Target Models: `meta/llama-3.2-11b-vision-instruct`, `nvidia/nemotron-parse`.
   * **Status:** 🟢 **Live & Verified in Production.** Tested during live verification with real-world Chennai electrical query; returned structured, context-aware cooperative recommendations via Railway API.
2. **Secondary Reasoning (Google Gemini):**
   * Target Model: `gemini-3.6-flash` configured in `server/server.js`.
   * **Status:** 🟡 Configured as a secondary provider. Active when `GEMINI_API_KEY` is present.
3. **Time-Series Demand Forecasting (Chronos-2):**
   * Primary Engine: Amazon Chronos-2 (`src/services/ai/chronosForecastService.js`).
   * **Status:** 🟡 **Statistical Fallback Active.** The code supports external Chronos microservice inference. When the specialized Python microservice is not connected, a robust client-side statistical engine (Holt-Winters exponential smoothing + weighted moving averages) deterministically calculates 7-day demand forecasts.

### 7.2 Interactive 3D Mascot & Voice Assistant
* **Mascot Rendering (`Hero3DCanvas.jsx`):** Rendered using Three.js with ambient, directional, and hemisphere lighting. **Fail-safe protection:** If WebGL context creation fails (e.g. headless runners, low-end mobile devices), the canvas catches the error and gracefully mounts a 2D mascot graphic without crashing the React application tree.
* **Voice Engine:** Integrated with browser native `webkitSpeechRecognition` / `SpeechRecognition` and `speechSynthesis` for spoken voice interaction in customer portals.

---

## 8. KYC Verification & Government Integrations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GOVERNMENT KYC WORKFLOW                           │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ 1. UIDAI Secure QR Decompression     │ 2. DigiLocker OAuth2 Gateway         │
│    • Raw byte Deflate decompression  │    • Sandbox TSP: SANDBOX.CO.IN      │
│    • Null-delimited demographic parse│    • CSRF timingSafeEqual validation │
│    • RSA-2048 signature verification │    • User consent tracking           │
│    • 100% Client-side privacy mask   │    • Status: Sandbox integration     │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### 8.1 UIDAI Secure QR Decoding
* **Decompression:** Binary QR payloads are decompressed server-side using raw RFC 1951 Deflate (`zlib.inflateRawSync`).
* **Demographic Parsing:** Decodes Name, DOB, Gender, and first-8-masked Aadhaar number (`XXXX-XXXX-1234`).
* **Signature Verification:** Cryptographically validates RSA-2048 SHA-256 digital signature against UIDAI public key certificate (`UIDAI_DSC_PUBLIC_KEY`). If the public key is not configured, the endpoint truthfully reports `signature_verification: "UNVERIFIED"`.

### 8.2 DigiLocker & Sandbox TSP Integration
* **Status:** 🟢 **Live in Sandbox Mode.** Connected via Technology Service Provider (TSP) `SANDBOX.CO.IN`.
* **Critical Distinction:** **SANDBOX INTEGRATION ≠ PRODUCTION GOVERNMENT KYC VERIFICATION.**
  * The current sandbox validates API handshakes, redirect callbacks, consent records, and structured JSON parsing.
  * Moving to live legal verification requires signing an official AUA/KUA agreement with UIDAI and obtaining production MeriPehchaan DigiLocker credentials backed by Hardware Security Modules (HSM).

---

## 9. Payments & Settlement Architecture

### 9.1 Financial Split Mechanics
On every service invoice, the platform executes a mathematical distribution:
* **Pillar Net Payout:** **91.5%** of the base service fee.
* **Cooperative Retainage:** **8.5%** retained for platform maintenance and administrative reserves.
* **Social Security / PF Contribution:** **5.0% total statutory deduction** (2.5% deducted from technician earnings + 2.5% matched by cooperative reserve) deposited into the technician's Provident Fund ledger (`pf_contributions`).

### 9.2 Payment Methods
1. **Razorpay Digital Gateway:**
   * Integrated via `src/services/payment/paymentGatewayAdapter.js`.
   * **Status:** 🟡 Configured with **Razorpay Test Credentials** (`rzp_test_...`). Real bank settlements require inserting live production merchant keys (`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`).
2. **Offline Hand-Cash Workflow:**
   * Customer selects Hand Cash at checkout. The invoice is marked `pending_cash_confirmation`.
   * Upon job completion, the technician physically collects the cash and clicks **Confirm Cash Received** in the Pillar Portal.
   * The server validates the technician's ID and updates the invoice to `settled`, crediting the cooperative retainage to the technician's balance deduction queue.

---

## 10. Doorstep Arrival OTP System

### 10.1 Implementation Reality
* **Generation:** When a service request transitions to `dispatched`, a cryptographically pseudo-random 6-digit numeric OTP is generated and stored in `service_requests.arrival_otp`.
* **Customer Presentation:** Displayed on the Customer Portal active tracking card.
* **Verification:** The technician enters the OTP upon doorstep arrival. The backend endpoint `/api/requests/:id/verify-arrival-otp` validates the input.
* **Status Transition:** On success, the service state transitions from `dispatched`/`arrived` to `in_progress`.
* **Single-Use Behavior:** The OTP is immediately cleared (`arrival_otp = null`) to prevent replay attacks.

### 10.2 Known Limitations & Required Hardening
* **Attempt Rate-Limiting:** The current database tracks attempts up to 3 tries, but lacks automated Redis IP/device rate-limiting to throttle brute-force attacks across distributed proxies.
* **Plaintext Storage:** `arrival_otp` is currently stored in plaintext within the database for easy retrieval by customer subscriptions. Production hardening should hash the OTP with HMAC using a server secret.

---

## 11. Multilingual Support & Translation Engine

* **Central Engine:** Managed by `src/i18n/centralEngine.js`.
* **Registered Languages:** 23 languages (English + 22 Scheduled Indian Languages: Assamese, Bengali, Bodo, Dogri, Gujarati, Hindi, Kannada, Kashmiri, Konkani, Maithili, Malayalam, Manipuri, Marathi, Nepali, Odia, Punjabi, Sanskrit, Santali, Sindhi, Tamil, Telugu, Urdu).
* **Runtime Verified Languages:** 🟢 **English (`en`), Tamil (`ta`), and Hindi (`hi`)** were verified during live production testing; switching languages dynamically mutates the DOM with correct Unicode glyphs without page reload.
* **Honest Scope Boundary:** While 23 languages are registered in the dictionary schema, full UI localization is currently populated for English, Tamil, and Hindi. Other languages fall back to English for unlocalized keys.

---

## 12. Administrative Hierarchy & RBAC

The system enforces a 6-tier administrative hierarchy with downward scope inheritance:

```
┌───────────────────────────────┐
│     1. SUPER_ADMIN            │ Level 5 Apex: Full national governance, security, and global finance.
└───────────────┬───────────────┘
                ▼
┌───────────────────────────────┐
│     2. ZONE_ADMIN             │ Level 4 Zonal: Oversees an entire operational zone (SZ, NZ, WZ, EZ).
└───────────────┬───────────────┘
                ▼
┌───────────────────────────────┐
│     3. STATE_ADMIN            │ Level 3 State: Oversees single state/UT cooperative federations.
└───────────────┬───────────────┘
                ▼
┌───────────────────────────────┐
│     4. DISTRICT_ADMIN         │ Level 2 District: Oversees district-level cooperative operations.
└───────────────┬───────────────┘
                ▼
┌───────────────────────────────┐
│     5. COOPERATIVE_ADMIN      │ Level 1 Society: Local primary cooperative society management.
└───────────────┬───────────────┘
                ▼
┌───────────────────────────────┐
│     6. OPERATIONS_ADMIN       │ Level 0 Tactical: Day-to-day dispatch queues and customer support.
└───────────────────────────────┘
```

* **Backend Enforcement:** The backend middleware `requireSuperAdmin` and helper `resolveAdminRole` authenticate JWTs and header identities against Supabase, rejecting unauthorized access with `HTTP 401/403`.

---

## 13. Geographic Hierarchy

* **Operational Zones:** 4 Primary Operational Zones seeded in the database:
  * **SZ (South Zone):** Headquarters & Initial Launch Market (Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana).
  * **NZ (North Zone):** Delhi NCR, Punjab, Haryana, Uttar Pradesh, Rajasthan, etc.
  * **WZ (West Zone):** Maharashtra, Gujarat, Goa, Madhya Pradesh.
  * **EZ (East Zone):** West Bengal, Odisha, Bihar, North-East states.
* **States & UTs:** All 36 official Indian States and Union Territories are seeded in `states`.
* **Granular District & Society Records:** Chennai districts (North, Central, South) and associated local cooperatives are seeded; secondary national districts are dynamically loaded via Supabase migrations.

---

## 14. Database Architecture & Migrations

* **Engine:** Supabase Managed PostgreSQL.
* **Migration Baseline:** 29 sequential SQL migrations in `supabase/migrations/` covering:
  1. Base schemas (`profiles`, `customer_profiles`, `pillar_profiles`).
  2. Core transactions (`service_requests`, `invoices`, `payments`).
  3. Cooperative social security (`pf_contributions`, `welfare_fund_ledger`).
  4. Governance & Geographic hierarchy (`zones`, `states`, `districts`, `cooperatives`, `admins`).
  5. Document storage & KYC records (`pillar_aadhaar_documents`).
  6. Audit logging (`audit_logs`).
* **Row-Level Security (RLS):** Enabled across user and transaction tables. Public client queries cannot read unauthorized records. Administrative operations use the Supabase Service-Role key server-side.

---

## 15. Security Architecture

* **Client/Server Secret Partitioning:**
  * **Browser-Safe Public Variables:** Only variables prefixed with `VITE_*` (Supabase URL, Anon Key, Google Maps Key, Razorpay Key ID) are packaged into the frontend bundle.
  * **Protected Server Secrets:** `RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `NVIDIA_API_KEY`, and DigiLocker client secrets are stored **strictly within Railway environment variables** and are never sent to the client.
* **CORS Protection:** Express CORS rejects unauthorized cross-origin requests; browser preflights return `HTTP 204` strictly matching `https://coophub-frontend.onrender.com`.
* **Session Integrity:** Super Admin Apex routes verify role claims against database records, preventing localStorage tampering from escalating privileges.

---

## 16. Testing & Verification Summary

The platform was subjected to automated production testing across 12 operational areas:

| Area | Verified Result | Evidence & Test Mechanism |
| :--- | :---: | :--- |
| **1. Cloud Deployment** | 🟢 **PASS** | Render static frontend loads `HTTP 200`. Railway backend healthcheck returns `HTTP 200 OK` (`uptime: 450+s`). `0` localhost calls. |
| **2. Customer Portal** | 🟢 **PASS** | Renders 20,080 bytes of React DOM. Category selection, service discovery, and CoopBot AI mount cleanly. |
| **3. Pillar Portal** | 🟢 **PASS** | `/pillar/register` 4-step onboarding and `/pillar/login` credential authentication mount without errors. |
| **4. Normal Admin RBAC** | 🟢 **PASS** | Normal admin login mounts. Navigating to Super Admin Apex is strictly blocked with a `403 Forbidden` security card. |
| **5. Super Admin Apex** | 🟢 **PASS** | Authenticated Super Admin session validated; loads Global Command Dashboard and System Health telemetry. |
| **6. AI Pipeline** | 🟢 **PASS** | Tested unseen prompt against Railway API. **NVIDIA NIM** executed the request in real time returning `HTTP 200 OK` (324 chars). |
| **7. Booking & Tracking** | 🟡 **PARTIAL** | UI cards and route subpaths verified; live continuous GPS tracking requires authentic technician mobile location feed. |
| **8. Billing & Payments** | 🟢 **PASS** | Payment order API responds; hand-cash settlement logic intact; Razorpay sandbox active. Zero real charges processed. |
| **9. KYC & DigiLocker** | 🟢 **PASS** | DigiLocker TSP gateway configured via `SANDBOX.CO.IN`; UIDAI Secure QR decoder endpoint active. |
| **10. Multilingual Engine**| 🟢 **PASS** | English, Tamil (`\u0B80-\u0BFF`), and Hindi (`\u0900-\u097F`) Unicode glyphs dynamically rendered and verified. |
| **11. Security & RBAC** | 🟢 **PASS** | Unauthorized requests to `/api/admin/super-admin/test` rejected (`HTTP 403`). Zero server secrets leaked in client assets. |
| **12. Supabase Integration**| 🟢 **PASS** | Backend authenticated administrative requests and resolved roles directly against Supabase database. |

---

## 17. Current Production Status Classification

### 🟢 LIVE / TECHNICALLY VERIFIED
* Render Frontend Deployment & SPA Routing.
* Railway Backend Web Service & Native WebSocket Support.
* Supabase PostgreSQL Database Connectivity (29 Migrations).
* Frontend $\rightarrow$ Backend Cross-Origin Communication & Proxies.
* NVIDIA NIM AI Multi-Model Vision & Chat Pipeline.
* Administrative RBAC & Super Admin Apex Isolation.
* Multilingual Engine for English, Tamil, and Hindi.

### 🟡 PARTIAL / SANDBOX (READY FOR FIELD TESTING)
* **Razorpay Payment Gateway:** Operational in Sandbox mode; pending live production merchant credentials.
* **DigiLocker / KYC Verification:** Operational in Sandbox mode; pending government AUA/KUA agreement.
* **Live GPS Tracking:** Code exists; requires field testing with mobile devices sending live coordinates.
* **Chronos-2 Forecasting:** Statistical fallback engine active; external Python Chronos microservice optional.
* **Full 23-Language Localization:** Translation dictionary fully populated for EN, TA, HI; remaining 20 languages fall back gracefully to English.

---

## 18. Remaining Work for General Public Release

### A. Required Before Real Public Production
1. **Production Merchant Gateway:** Insert live Razorpay API keys into Railway environment variables.
2. **Government KYC Credentials:** Transition from DigiLocker Sandbox to official MeriPehchaan production OAuth and configure official UIDAI public key certificate (`UIDAI_DSC_PUBLIC_KEY`).
3. **SMS & OTP Gateway:** Connect production SMS gateway (Twilio, Gupshup, or MSG91) for mobile OTP verification.

### B. Recommended Hardening
1. **Redis Rate-Limiting:** Introduce Redis-backed rate limiting on `/api/kyc/*` and `/api/payment/*`.
2. **Arrival OTP Hashing:** Hash arrival OTPs in database using HMAC-SHA256 rather than plaintext storage.
3. **Custom Domain Names:** Bind custom domains (e.g. `coophub.in` and `api.coophub.in`) with SSL managed via Cloudflare.

### C. Future Roadmap Features
1. **Pillar Mobile Applications:** Wrap Pillar and Customer interfaces in React Native / Flutter for background push notifications and continuous GPS location streaming.
2. **Automated Bank Payouts:** Integrate RazorpayX or Cashfree for automated bank account payouts to cooperative technicians.

---

## 19. Environment Variables Reference (Names Only)

### Render Frontend (Client-Safe `VITE_*` Variables)
* `VITE_SERVER_URL`
* `VITE_SUPABASE_URL`
* `VITE_SUPABASE_ANON_KEY`
* `VITE_GOOGLE_MAPS_API_KEY`
* `VITE_NVIDIA_API_KEY`
* `VITE_NVIDIA_MODEL`
* `VITE_NVIDIA_OCR_MODEL`
* `VITE_GEMINI_API_KEY`
* `VITE_RAZORPAY_KEY_ID`

### Railway Backend (Server-Side Secrets)
* `NODE_ENV`
* `PORT`
* `INSTANCE_ID`
* `BACKEND_URL`
* `FRONTEND_URL`
* `VITE_FRONTEND_URL`
* `SUPABASE_URL`
* `SUPABASE_SERVICE_ROLE_KEY`
* `VITE_SUPABASE_URL`
* `VITE_SUPABASE_ANON_KEY`
* `NVIDIA_API_KEY`
* `NVIDIA_MODEL`
* `NVIDIA_OCR_MODEL`
* `GEMINI_API_KEY`
* `RAZORPAY_KEY_ID`
* `RAZORPAY_KEY_SECRET`
* `DIGILOCKER_TSP_PROVIDER`
* `SANDBOX_API_KEY`
* `SANDBOX_API_SECRET`
* `DIGILOCKER_CLIENT_ID`
* `DIGILOCKER_CLIENT_SECRET`
* `DIGILOCKER_REDIRECT_URI`
* `UIDAI_DSC_PUBLIC_KEY`
* `EASY_OCR_SERVICE_URL`
* `PADDLE_OCR_SERVICE_URL`

---

## 20. Deployment & Build Procedure

### Deploying Changes to GitHub Main
```bash
# Verify working tree is clean
git status

# Stage and commit your changes
git add <modified-files>
git commit -m "feat: description of change"

# Push to GitHub main branch
git push origin main
```

### Deployment Triggers
1. **Render Frontend:** Automatically detects pushes to `main`. Rebuilds via `npm run build` and deploys static files from `dist/` within ~30 seconds.
2. **Railway Backend:** Can be deployed automatically from GitHub or triggered via Railway CLI:
```bash
railway up --service coophub-backend --environment production -d
```

### Post-Deployment Verification
```bash
# Check Railway backend health
curl -I https://coophub-backend-production-60ba.up.railway.app/api/health

# Check Render frontend response
curl -I https://coophub-frontend.onrender.com
```

---

## 21. Operational Troubleshooting Guide

| Issue / Symptom | Probable Cause | Corrective Action |
| :--- | :--- | :--- |
| **Railway Container Fails to Start** | Node version lacks native WebSocket support. | Ensure [Dockerfile](file:///d:/coophub%20pillar%20dashboard/Dockerfile) uses `node:22-bookworm-slim`. Node 20 or earlier will throw `Error: native WebSocket not found`. |
| **Browser Throws CORS Error** | Origin mismatch between Render and Railway. | Verify [server/server.js](file:///d:/coophub%20pillar%20dashboard/server/server.js) includes `https://coophub-frontend.onrender.com` in `allowedOrigins`. |
| **Render Shows 404 on Direct Route Refresh** | Static server lacks SPA routing fallback. | Ensure [public/_redirects](file:///d:/coophub%20pillar%20dashboard/public/_redirects) contains `/* /index.html 200`. |
| **3D Mascot Crashes Page** | WebGL context unavailable in browser/device. | [Hero3DCanvas.jsx](file:///d:/coophub%20pillar%20dashboard/src/components/hero3d/Hero3DCanvas.jsx) contains a try/catch wrapper that automatically activates a 2D image fallback. |
| **Supabase Authentication Fails** | Expired or incorrect `VITE_SUPABASE_ANON_KEY`. | Verify public keys in Render Environment Settings match your Supabase project API settings. |
| **AI Responses Fall Back to Default** | Rate limit or quota exhaustion on NVIDIA NIM. | Check Railway backend logs (`deploymentLogs`); verify `NVIDIA_API_KEY` status on build.nvidia.com. |

---

## 22. Inviolable Architectural Rules — DO NOT BREAK THESE

1. **Do NOT collapse Super Admin into Normal Admin:** Normal Admin (`/admin`) and Super Admin (`/admin/super-admin`) are intentionally partitioned. Normal admins must NEVER have access to national governance, security logs, or global financial ledgers.
2. **Do NOT hardcode backend URLs in business components:** Always resolve endpoints using `VITE_SERVER_URL` via [src/config/api.js](file:///d:/coophub%20pillar%20dashboard/src/config/api.js).
3. **Do NOT store private keys in client assets:** Never prefix private secrets (`RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) with `VITE_`.
4. **Do NOT alter the cooperative financial split without board authorization:** The **91.5% pillar / 8.5% cooperative / 5% total PF deduction** model is foundational to the platform's mission.
5. **Do NOT replace authentic government KYC with mock records:** Maintain strict separation between Sandbox mode and Production AUA verification.

---

## 23. Next Developer Onboarding Checklist

- [ ] Obtain repository write access to `ANUPRIYA2007/coophub` on GitHub.
- [ ] Obtain administrative access to the Render project workspace (`coophub-frontend`).
- [ ] Obtain access to the Railway project workspace (`coophub`).
- [ ] Obtain access to the Supabase organization dashboard hosting the PostgreSQL database.
- [ ] Verify local Node.js environment is version 22+ (`node -v`).
- [ ] Review all 29 database migrations in `supabase/migrations/`.
- [ ] Confirm access to NVIDIA NIM developer portal (`build.nvidia.com`).
- [ ] Secure production credentials for Razorpay merchant gateway before enabling live billing.
- [ ] Secure official MeriPehchaan / UIDAI production credentials before launching public KYC.
- [ ] Set up continuous uptime monitoring (e.g. BetterStack, UptimeRobot) for the Railway health endpoint.

---

## 24. Final Platform Status

**COOP HUB is technically deployed on Render + Railway with Supabase connectivity verified. The platform is suitable for staging, demonstration, and controlled user testing. Full public production requires the remaining sandbox/credential/security items documented above.**
