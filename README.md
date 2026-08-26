# COOP HUB - Pillar Dashboard

## Deployment Summary

This repository contains the completely configured React (Vite) application for the COOP HUB Pillar Portal. It includes dynamic UI/UX, localized routing, live NVIDIA/Gemini API integrations (via Node.js proxy), and Supabase authentication layouts.

### 🚀 Local Development Setup

To run this project locally, you will need two terminals running simultaneously to support both the Vite Frontend and the Node/Express proxy server for the AI.

**Step 1: Install Dependencies**
```bash
npm install
```

**Step 2: Start the AI Proxy Server**
*Note: This server securely manages the API keys so they are not exposed to the browser.*
```bash
node server/index.js
```
*(Runs on port 3000 by default)*

**Step 3: Start the Frontend React App**
Open a new terminal window:
```bash
npm run dev
```
*(Runs on port 5173 by default)*

---

### 📦 Production Build & Deployment

To deploy the application to production environments like Vercel, Netlify, or an Nginx VPS:

**1. Build the Frontend:**
```bash
npm run build
```
This will compile the optimized application into the `/dist` folder. 

**2. Preview the Build:**
```bash
npm run preview
```

**3. Deployment Environment Variables:**
Ensure that your hosting provider has the following environment variables securely set:
- `VITE_SUPABASE_URL`: Your Supabase Project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase API Key
- `VITE_API_URL`: The production URL of where your Node/Express AI proxy is hosted (e.g., `https://api.coophub.in/ai`).

**4. Hosting the AI Server:**
Because the Hero AI depends on a proxy backend to hide the LLM tokens, the `server/index.js` file MUST be hosted independently (for example, on Render, Heroku, or AWS EC2).

---

### 🔑 Authentication Testing & Demo
A specific `Demo Access` bypass has been built into the `Login.jsx` interface.
- Clicking **"Auto-fill Demo Pillar"** bypasses the live Supabase OTP network requests, enabling immediate access to the `/dashboard` for presentation purposes.
- Live OTP via SMS requires configuring Twilio/Messagebird within the Supabase Dashboard.
