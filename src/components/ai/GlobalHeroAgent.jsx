import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

export default function GlobalHeroAgent() {
    const { t, language } = useTranslation();
    const location = useLocation();
    const params = useParams();

    const currentContext = useMemo(() => {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const module = pathSegments[0] || 'home';
        const entityId = params.id || (pathSegments.length > 2 && pathSegments[1] !== 'new' ? pathSegments[1] : null);

        return {
            route: location.pathname,
            module: module,
            entityId: entityId,
            language: language
        };
    }, [location.pathname, params, language]);

    const [animState, setAnimState] = useState('idle'); // idle, thinking, speaking
    const [heroGreeting, setHeroGreeting] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Fetch dynamic context-aware greeting on route transition
    useEffect(() => {
        let isMounted = true;
        const announceContextChange = async () => {
            try {
                setAnimState('thinking');
                const res = await fetch('/api/ai/mascot-context', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentRoute: location.pathname,
                        language,
                        module: currentContext.module
                    })
                });

                const data = await res.json();
                if (!isMounted) return;

                if (res.ok && data.message) {
                    setHeroGreeting(data.message);
                } else {
                    const fallbackGreetings = {
                        ta: 'வணக்கம்! COOP HUB உங்களை அன்புடன் வரவேற்கிறது.',
                        hi: 'नमस्ते! COOP HUB में आपका स्वागत है।',
                        te: 'నమస్కారం! COOP HUB కి స్వాగతం.',
                        kn: 'ನಮಸ್ಕಾರ! COOP HUB ಗೆ ಸುಸ್ವಾಗತ.',
                        en: 'Welcome to COOP HUB! How can I assist your home today?'
                    };
                    setHeroGreeting(fallbackGreetings[language] || fallbackGreetings.en);
                }
                setAnimState('idle');
            } catch (err) {
                if (isMounted) {
                    setHeroGreeting('Welcome to COOP HUB!');
                    setAnimState('idle');
                }
            }
        };

        announceContextChange();
        return () => {
            isMounted = false;
        };
    }, [location.pathname, language, currentContext.module]);

    // Speak greeting aloud
    const speakGreeting = (e) => {
        e?.stopPropagation();
        if (!('speechSynthesis' in window) || !heroGreeting) return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(heroGreeting);
        const langCodeMap = {
            ta: 'ta-IN',
            hi: 'hi-IN',
            te: 'te-IN',
            kn: 'kn-IN',
            en: 'en-US'
        };
        utterance.lang = langCodeMap[language] || 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.05;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const handleOpenChat = () => {
        window.dispatchEvent(new CustomEvent('open-customer-chat'));
    };

    // Hide hero visual on login/register pages or small screens if desired to keep view clean
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    return (
        <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
            {/* HERO VISUAL: Bottom Left */}
            <div className={`absolute bottom-6 left-6 pointer-events-auto flex items-end space-x-3 transition-opacity duration-300 ${isAuthPage ? 'hidden sm:flex opacity-90' : 'flex'}`}>
                {/* Visual Mascot Avatar */}
                <div
                    onClick={handleOpenChat}
                    className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full shadow-2xl shadow-navy-900/20 border-[3px] border-orange-500 overflow-hidden shrink-0 filter drop-shadow-xl p-1 relative transition-all duration-300 hover:scale-110 cursor-pointer group"
                    title="Click to chat with CoopBot"
                >
                    <img
                        src="/assets/images/mascot-hero.png"
                        alt="Hero Mascot"
                        className="w-full h-full object-cover rounded-full group-hover:rotate-3 transition-transform"
                        onError={(e) => {
                            e.target.src = '/src/assets/branding/mascot-ai.png';
                        }}
                    />
                    {animState === 'thinking' && (
                        <div className="absolute inset-0 bg-orange-500/15 rounded-full animate-pulse"></div>
                    )}
                </div>

                {/* Contextual Speech Bubble */}
                <div
                    onClick={handleOpenChat}
                    className="bg-white/95 backdrop-blur-md px-4 py-2.5 text-xs sm:text-sm text-navy-800 shadow-xl shadow-navy-900/10 rounded-2xl rounded-bl-xs font-medium border border-navy-100 max-w-[210px] sm:max-w-xs transition-all duration-200 hover:border-orange-400 hover:shadow-2xl cursor-pointer group flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={11} /> CoopBot Guide
                        </span>
                        <button
                            onClick={speakGreeting}
                            className={`p-1 rounded-full text-navy-400 hover:text-orange-500 transition-colors ${isSpeaking ? 'text-orange-500 bg-orange-50 animate-pulse' : ''}`}
                            title={isSpeaking ? 'Stop Voice' : 'Listen to tip'}
                        >
                            {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                        </button>
                    </div>

                    {animState === 'thinking' ? (
                        <div className="flex space-x-1 items-center h-5 py-1">
                            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                            <div className="w-1.5 h-1.5 bg-navy-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                    ) : (
                        <p className="line-clamp-3 text-navy-700 leading-snug">
                            {heroGreeting || 'Tap here to chat with AI Assistant!'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
