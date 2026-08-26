// ===========================
// COOP HUB — Brand Configuration
// ===========================
// Single source of truth for the COOP HUB brand identity.
// Used by all three portals: Customer, Worker, Cooperative.

// Brand Assets
import coopHubLogo from '../assets/branding/coop-hub-logo.png';
import coopHubFavicon from '../assets/branding/coop-hub-favicon.png';
import coopHubSplash from '../assets/branding/coop-hub-splash.png';

export const BRAND = {
    name: 'COOP HUB',
    tagline: 'CONNECT  |  SERVE  |  EMPOWER',
    description: 'Cooperative Service Platform connecting customers with skilled workers through local cooperatives.',

    // Logo assets
    logo: coopHubLogo,
    favicon: coopHubFavicon,
    splash: coopHubSplash,

    // Color System — derived from the official logo
    colors: {
        // Primary — Navy / Dark Blue
        primary: {
            50: '#eef2f7',
            100: '#d5dde8',
            200: '#aabbcf',
            300: '#7f99b6',
            400: '#547698',
            500: '#1e3a5f',  // Main navy
            600: '#0f2a4a',
            700: '#0a1f38',
            800: '#071628',
            900: '#040d18',
            950: '#020710',
        },

        // Accent — Orange
        accent: {
            50: '#fff7ed',
            100: '#ffeed4',
            200: '#fdd8a8',
            300: '#fbc071',
            400: '#f9a03c',
            500: '#f58220',  // Main orange (from logo)
            600: '#e06b0a',
            700: '#b8520b',
            800: '#934110',
            900: '#783711',
            950: '#411a06',
        },

        // Neutral — for backgrounds, borders, muted text
        neutral: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
        },

        // Semantic
        white: '#ffffff',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f2a4a',
        muted: '#64748b',
        border: '#e2e8f0',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
    },

    // Typography
    typography: {
        fontDisplay: "'Outfit', system-ui, sans-serif",
        fontBody: "'Inter', system-ui, sans-serif",
    },

    // Portals — all share this same branding
    portals: {
        customer: { label: 'Customer Portal' },
        worker: { label: 'Worker Portal' },
        cooperative: { label: 'Cooperative Portal' },
    },
};

export default BRAND;
