# COOP HUB - Pillar Portal: Handoff Document

## Project Overview
The **Pillar Portal** is a specialized React-based progressive web application (PWA) designed for service technicians (Pillars) at COOP HUB. It allows technicians to receive job requests, manage their profiles, track earnings, and engage with customers securely.

## Core Features Implemented
1. **Live Hero AI Guidance System (CoopBot)**:
   - A contextual, route-aware, floating AI guide using real-time API integrations (NVIDIA/Gemini proxied through local Express backend).
   - Features mood-based animations (happy, excited, thinking, helpful), TTS voice feedback, and voice-to-text input.
   - Built with event-driven notifications (`hero-notification`) that automatically alert the user on-screen without obstructing the UI.

2. **Streamlined Authentication**:
   - Secure Login Flow restricted to **Pillar ID** entry as the primary identifier.
   - Seamless transition into a secondary OTP Verification step.
   - Intelligent fallback to Admin-approved password login if OTP fails or is not received.
   - Special `🧪 Demo Access` panel engineered into the UI for one-click demo logins.
   - Sign In and Register navigation completely corrected on the Landing/Flash screen.

3. **Dashboard & Navigation**:
   - fully responsive layout (`PillarLayout`) with a collapsible sidebar and contextual top bar.
   - Persistent language switcher using `i18n` for multilingual support (English, Tamil, Hindi, Kannada, Telugu).
   - Dynamic routing linking authentication, dashboard summaries, order lists, and live chat.

## Architecture
- **Frontend Framework**: React + Vite
- **Styling**: Vanilla CSS (`global.css`, `hero-animations.css`, `variables.css`) to ensure maximum customizability, avoiding framework constraints.
- **State Management**: React Context (`AuthContext`, `LanguageContext`).
- **Routing**: React Router (`react-router-dom`).
- **Backend/DB Sync**: Supabase (PostgreSQL + Auth), bridged with `authService.js`.
- **AI Proxy**: A Node.js/Express server in `server/index.js` safely manages proxy connections to the NVIDIA Nemo/Llama API.

## Code Map
- `/src/pages/pillar/auth/Login.jsx`: Core auth logic (Pillar ID -> OTP -> Password Fallback).
- `/src/components/pillar/layout/Sidebar.jsx`: The layout wrapper containing the active **Hero AI Mascot** and global navigation.
- `/src/components/pillar/ai/HeroInteractiveAgent.jsx`: AI state logic for registration forms.
- `/src/styles/hero-animations.css`: Keyframes for eye-blinks, mood auras, speech bubbles, and pop-up transitions.
- `/src/services/pillar/aiService.js` and `/src/services/pillar/ai/intentRouter.js`: API proxy service for real-time assistant responses.

## Remaining Considerations / Next Steps
1. **Twilio/MessageBird Integration**: Supabase SMS provider must be configured on the live database to send the real OTP codes for production.
2. **Production Domain**: The backend AI proxy uses `http://localhost:3000/api/ai/chat`. This URL must be updated to the live backend domain inside `src/services/pillar/ai/aiApi.js` upon deployment.
3. **Database Rules**: Supabase Row Level Security (RLS) rules need to be enforced for the `pillar_profiles` table to prevent cross-account modifications.
