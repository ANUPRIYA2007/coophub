# 🏛️ Cooperative Admin Dashboard — Technical & Operational Handoff

**Project**: CoopHub Cooperative Admin Dashboard Module  
**Repository Branch**: `feature/cooperative-admin-dashboard`  
**Architecture**: React 19 + Vite + Supabase Realtime + Vanilla CSS Design Tokens + GSAP Animations  
**Version**: 1.0.0 Production Ready  

---

## 📌 Executive Summary
The **Cooperative Admin Dashboard** is a standalone, executive control tower built within the CoopHub ecosystem to manage workforce telemetry, customer service requests, rate tariffs, geospatial radar, customer CSAT reviews, broadcast announcements, and platform commission settings. It connects seamlessly with the **Customer Portal** and **Pillar Portal** via Supabase Realtime and automatic database triggers.

---

## 🗺️ Portal Sitemap & Route Architecture

| Route | Module Name | Primary Functions |
|---|---|---|
| `/admin` | **Executive Overview** | Live KPI metric cards (GMV, Pillars, Requests, CSAT), monthly booking bar chart, category distribution progress meters, live settlement table, and real-time operations toggle. |
| `/admin/pillars` | **Pillars Directory** | Searchable directory of verified and pending technicians, status filter badges, contact info, and profile drawer navigation. |
| `/admin/pillars/:id` | **Pillar Detail Profile** | In-depth profile with KYC verification status, skill categories, coverage area, rating breakdown, and direct status update actions. |
| `/admin/services` | **Service Tariff Master** | Service catalog tariff manager with base rate editor, status toggle, duration, and new service category registration modal. |
| `/admin/requests` | **Control Tower / Requests** | Service request queue with status filters (`all`, `pending`, `in_progress`, `completed`, `cancelled`), technician assignment, and resolution modal. |
| `/admin/tracking` | **Geospatial Telemetry Radar** | Live GPS tracking console showing active technician locations, hub coverage, battery telemetry, and field signal stream. |
| `/admin/feedback` | **Customer CSAT & Reviews** | Customer review cards with 5-star rating distribution, feedback sentiments, and verified booking links. |
| `/admin/messages` | **Broadcast Center** | Cooperative announcement composer with target audience selection (`all_pillars`, `electricians`, `plumbers`), priority flags, and broadcast history. |
| `/admin/support` | **Dispute & Support Desk** | Support ticket resolution center with issue classification, status tabs, and direct admin response composer. |
| `/admin/settings` | **Platform Configuration** | Cooperative commission rate (%), emergency hotline, auto-dispatch toggle, service radius slider, and payout cycles. |

---

## 🤖 CoopBot AI Admin Intelligence
- **Admin Context Awareness**:
  - The Mascot and Floating AI Drawer dynamically switch to **Cooperative Admin Intelligence** mode on `/admin/*` routes.
  - Dedicated agent [`adminAgent.js`](file:///d:/coophub%20pillar%20dashboard/src/services/pillar/ai/adminAgent.js) executes live database analytics for workforce numbers, pending dispatch queues, monthly GMV, and field telemetry.
- **Interactive Action Chips**:
  - `👥 All Pillars` ➔ Immediate workforce summary + link to `/admin/pillars`
  - `📦 Active Requests` ➔ Live service requests status + link to `/admin/requests`
  - `📍 Live Tracking` ➔ Geospatial radar status + link to `/admin/tracking`
  - `💰 Total GMV` ➔ Financial performance & cooperative share summary.

---

## ⚡ Supabase Realtime & 3-Portal Interconnection

### SQL Migration Files
1. `supabase/migrations/01_pillar_portal_schema.sql` — Pillar workforce core schema.
2. `supabase/migrations/02_admin_portal_schema.sql` — Admin portal schema and permissions.
3. `supabase/migrations/03_unified_coophub_realtime_schema.sql` — Realtime publication across all 3 portals with automated bidirectional sync triggers between `bookings` and `service_requests`.

### Live Subscriptions Active
- `adminService.subscribeToLiveRequests(callback)`
- `adminService.subscribeToLivePillars(callback)`
- `adminService.subscribeToLiveTickets(callback)`
- `pillarOrderService.subscribeToPillarOrders(pillarId, callback)`
- `pillarNotificationService.subscribeToBroadcasts(callback)`

---

## 🧪 Demo Mode vs. Real Admin Mode
- **Real Admin Mode**:
  - Triggered by real Supabase authentication.
  - Strictly queries live Supabase tables with **zero mock data**.
  - All real-time insertions from Customer Portal display instantaneously.
- **Demo Mode (`PIL-CHE-042` / `coophub_demo_admin`)**:
  - Injects rich demo data (126 pillars, 18 requests, ₹2,38,500 GMV, CSAT reviews) for offline presentations and feature demonstrations.

---

## 🚀 Running Locally
```bash
# Install dependencies
npm install

# Start Vite Development Server (Port 5174 / 5173)
npm run dev

# Production Build Verification
npm run build
```
