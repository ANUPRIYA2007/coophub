import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Direct navigation to Pillar Dashboard without login barrier
    navigate('/dashboard');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #FFFFFF 0%, #F8FAFC 55%, #EDF2F7 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Subtle Ambient Background Lighting Elements */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '650px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(245, 124, 32, 0.04) 0%, rgba(27, 42, 74, 0.02) 60%, transparent 80%)',
          pointerEvents: 'none',
          filter: 'blur(40px)',
        }}
      />

      {/* Main Center Content Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 2,
          padding: '24px',
          maxWidth: '680px',
          width: '100%',
        }}
      >
        {/* Exact CoopHub Logo */}
        <div
          style={{
            marginBottom: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'default',
            userSelect: 'none',
          }}
        >
          {/* Logo Emblem (Gear + House + Tools + Workers) */}
          <svg
            width="130"
            height="130"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ marginBottom: '16px', filter: 'drop-shadow(0 4px 12px rgba(27, 42, 74, 0.08))' }}
          >
            {/* Outer Hex/Gear Ring */}
            <circle cx="100" cy="100" r="82" stroke="#F57C20" strokeWidth="10" strokeDasharray="14 10" strokeLinecap="round" />
            <circle cx="100" cy="100" r="68" stroke="#1B2A4A" strokeWidth="8" strokeDasharray="28 14" strokeLinecap="round" />

            {/* Inner Background */}
            <circle cx="100" cy="100" r="54" fill="#FFFFFF" />

            {/* House Silhouette Outline */}
            <path
              d="M100 48L132 74V124H68V74L100 48Z"
              fill="none"
              stroke="#F57C20"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            {/* Little window inside roof */}
            <rect x="94" y="62" width="12" height="12" rx="2" fill="#F57C20" />

            {/* Crossed Hammer & Wrench */}
            <path
              d="M80 72L116 108M80 72L74 78L82 86L88 80L80 72Z"
              stroke="#1B2A4A"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="#1B2A4A"
            />
            <path
              d="M120 72L84 108M120 72L126 78L118 86L112 80L120 72Z"
              stroke="#1B2A4A"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="#1B2A4A"
            />

            {/* 3 Pillars / Workers Base */}
            {/* Center Worker */}
            <circle cx="100" cy="120" r="7" fill="#F57C20" />
            <path d="M91 144C91 133 94 130 100 130C106 130 109 133 109 144H91Z" fill="#F57C20" />
            
            {/* Left Worker */}
            <circle cx="80" cy="126" r="6" fill="#1B2A4A" />
            <path d="M72 144C72 136 75 134 80 134C85 134 88 136 88 144H72Z" fill="#1B2A4A" />

            {/* Right Worker */}
            <circle cx="120" cy="126" r="6" fill="#1B2A4A" />
            <path d="M112 144C112 136 115 134 120 134C125 134 128 136 128 144H112Z" fill="#1B2A4A" />
          </svg>

          {/* COOPHUB Typography */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
            <span
              style={{
                fontSize: '44px',
                fontWeight: '900',
                color: '#1B2A4A',
                letterSpacing: '-0.5px',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              COOP
            </span>
            <span
              style={{
                fontSize: '44px',
                fontWeight: '900',
                color: '#F57C20',
                letterSpacing: '-0.5px',
                fontFamily: "'Inter', sans-serif",
                marginLeft: '1px',
              }}
            >
              HUB
            </span>
          </div>

          {/* Subtitle Under Logo */}
          <div
            style={{
              fontSize: '8.5px',
              fontWeight: '700',
              color: '#64748B',
              letterSpacing: '3px',
              marginTop: '4px',
              textTransform: 'uppercase',
            }}
          >
            CONNECT <span style={{ color: '#F57C20' }}>|</span> SERVE <span style={{ color: '#F57C20' }}>|</span> EMPOWER
          </div>
        </div>

        {/* Spaced Tagline */}
        <div
          style={{
            fontSize: '15px',
            fontWeight: '600',
            color: '#4B6B94',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            marginBottom: '40px',
            userSelect: 'none',
          }}
        >
          CONNECT &nbsp;|&nbsp; SERVE &nbsp;|&nbsp; EMPOWER
        </div>

        {/* Auth CTA Buttons: Sign In + Register */}
        <div style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {/* Primary: Sign In */}
          <button
            onClick={() => navigate('/pillar/login')}
            id="hero-sign-in-btn"
            style={{
              background: 'linear-gradient(180deg, #F57C20 0%, #E66A0D 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '15px 40px',
              fontSize: '16px',
              fontWeight: '700',
              letterSpacing: '0.3px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(245, 124, 32, 0.35), 0 2px 6px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              outline: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(245, 124, 32, 0.45), 0 4px 10px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 124, 32, 0.35), 0 2px 6px rgba(0, 0, 0, 0.08)';
            }}
          >
            Sign In
          </button>

          {/* Secondary: Register / Sign Up */}
          <button
            onClick={() => navigate('/pillar/register')}
            id="hero-register-btn"
            style={{
              background: 'transparent',
              color: '#1B2A4A',
              border: '2.5px solid #1B2A4A',
              borderRadius: '12px',
              padding: '13px 36px',
              fontSize: '16px',
              fontWeight: '700',
              letterSpacing: '0.3px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(27, 42, 74, 0.08)',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              outline: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
              e.currentTarget.style.background = '#1B2A4A';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(27, 42, 74, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#1B2A4A';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(27, 42, 74, 0.08)';
            }}
          >
            Register as Pillar
          </button>
        </div>
      </div>

      {/* Responsive adjustments */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 640px) {
              .hero-tagline {
                font-size: 12px !important;
                letter-spacing: 0.2em !important;
              }
            }
          `,
        }}
      />
    </div>
  );
}
