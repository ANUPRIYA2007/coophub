import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { Volume2, VolumeX, Sparkles, AlertCircle, CheckCircle2, Bot, MessageSquare } from 'lucide-react';

export default function GlobalHeroAgent({ inline = false }) {
    const { t, language } = useTranslation();
    const location = useLocation();
    const params = useParams();

    const [animState, setAnimState] = useState('idle'); // idle, listening, speaking, thinking, success, error, greeting
    const [heroGreeting, setHeroGreeting] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [activeInputName, setActiveInputName] = useState(null);

    // Initial greeting on route change
    useEffect(() => {
        let isMounted = true;
        setAnimState('greeting');

        const announceContextChange = async () => {
            try {
                const res = await fetch('/api/ai/mascot-context', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentRoute: location.pathname,
                        language,
                        module: location.pathname.split('/')[1] || 'home'
                    })
                });

                const data = await res.json();
                if (!isMounted) return;

                if (res.ok && data.message) {
                    setHeroGreeting(data.message);
                } else {
                    const fallbackGreetings = {
                        ta: 'வணக்கம்! நான் உங்கள் COOP HUB வழிகாட்டி. உங்களுக்கு உதவ நான் எப்போதும் தயார்!',
                        hi: 'नमस्ते! मैं आपका COOP HUB सहायक हूँ। मैं आपकी कैसे मदद कर सकता हूँ?',
                        te: 'నమస్కారం! నేను మీ COOP HUB గైడ్. మీకు ఎలా సహాయపడగలను?',
                        kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ COOP HUB ಮಾರ್ಗದರ್ಶಿ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
                        en: 'Hello! I am CoopBot, your live service guide. How can I assist your home today?'
                    };
                    setHeroGreeting(fallbackGreetings[language] || fallbackGreetings.en);
                }

                setTimeout(() => {
                    if (isMounted) setAnimState('idle');
                }, 1400);
            } catch (err) {
                if (isMounted) {
                    setHeroGreeting('Welcome to COOP HUB! I am right here to help.');
                    setAnimState('idle');
                }
            }
        };

        announceContextChange();
        return () => {
            isMounted = false;
        };
    }, [location.pathname, language]);

    // Global Interactive Live Focus & Error Tracking (Lively like Pillar Portal)
    useEffect(() => {
        const handleFocusIn = (e) => {
            const target = e.target;
            if (!target || !['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;

            const name = (target.name || target.id || target.placeholder || '').toLowerCase();
            setActiveInputName(name);
            setAnimState('speaking');

            // Contextual dynamic speech guidance per field
            if (name.includes('fullname') || name.includes('name')) {
                setHeroGreeting(
                    language === 'ta'
                        ? 'உங்கள் முழு பெயரை உள்ளிடவும். இது தொழில்நுட்ப வல்லுநருக்கு அடையாளம் காண உதவும்.'
                        : 'Enter your full legal name so your technician can identify you.'
                );
            } else if (name.includes('email')) {
                setHeroGreeting(
                    language === 'ta'
                        ? 'உங்கள் சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும். முன்பதிவு உறுதிப்படுத்தல் இங்கே அனுப்பப்படும்.'
                        : 'Enter your email address to receive real-time booking updates and invoices.'
                );
            } else if (name.includes('mobile') || name.includes('phone')) {
                setHeroGreeting(
                    language === 'ta'
                        ? 'உங்கள் 10 இலக்க மொபைல் எண்ணை உள்ளிடவும். வீட்டு வருகை OTP இதற்கே அனுப்பப்படும்.'
                        : 'Enter your 10-digit mobile number for arrival verification and OTP.'
                );
            } else if (name.includes('password')) {
                setHeroGreeting(
                    language === 'ta'
                        ? 'குறைந்தது 8 எழுத்துக்கள், ஒரு பெரிய எழுத்து மற்றும் எண்களுடன் பாதுகாப்பான கடவுச்சொல்லை உருவாக்கவும்.'
                        : 'Create a secure password with 8+ characters, including numbers and uppercase letters.'
                );
            } else if (name.includes('address') || name.includes('city') || name.includes('area')) {
                setHeroGreeting(
                    language === 'ta'
                        ? 'உங்கள் சரியான வீட்டு முகவரியை உள்ளிடவும் அல்லது தானியங்கி GPS இருப்பிடத்தைத் தேர்ந்தெடுக்கவும்.'
                        : 'Enter your exact street address or use Current GPS Location for accurate doorstep arrival.'
                );
            } else if (name.includes('date') || name.includes('time')) {
                setHeroGreeting(
                    language === 'ta'
                        ? 'சேவைக்கான உங்கள் விருப்பமான தேதி மற்றும் நேரத்தைத் தேர்ந்தெடுக்கவும்.'
                        : 'Pick your preferred service date and time slot, or enable flexible timing.'
                );
            } else if (name.includes('description') || name.includes('tell_us_more')) {
                setHeroGreeting(
                    language === 'ta'
                        ? 'உங்கள் சாதனத்தின் சிக்கலை சுருக்கமாக விவரிக்கவும், இதனால் வல்லுநர் தேவையான கருவிகளை எடுத்து வருவார்.'
                        : 'Describe your issue clearly so your Pillar arrives prepared with the right spare parts.'
                );
            } else if (name.includes('search')) {
                setHeroGreeting(
                    language === 'ta'
                        ? 'மின்சாரம், பிளம்பிங், ஏசி பழுது போன்ற உங்களுக்குத் தேவையான சேவையைத் தேடுங்கள்.'
                        : 'Search any home service (Electrician, AC Repair, Plumber) to see verified nearby Pillars.'
                );
            } else {
                setHeroGreeting(
                    language === 'ta'
                        ? 'நான் உங்கள் பதிவை கவனித்து வருகிறேன்! அடுத்த விவரத்தை நிரப்பவும்.'
                        : "I'm watching your progress! Fill in the highlighted field."
                );
            }
        };

        const handleFocusOut = () => {
            setActiveInputName(null);
            setTimeout(() => {
                setAnimState('idle');
            }, 600);
        };

        // Custom live event dispatch listener for validation errors / successes
        const handleHeroEvent = (e) => {
            if (e.detail?.type === 'error') {
                setAnimState('error');
                setHeroGreeting(`⚠️ ${e.detail.message || 'Please check the highlighted field!'}`);
            } else if (e.detail?.type === 'success') {
                setAnimState('success');
                setHeroGreeting(`🎉 ${e.detail.message || 'Action completed successfully!'}`);
            } else if (e.detail?.message) {
                setHeroGreeting(e.detail.message);
                setAnimState(e.detail.state || 'speaking');
            }
        };

        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);
        window.addEventListener('coophub-hero-event', handleHeroEvent);

        return () => {
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
            window.removeEventListener('coophub-hero-event', handleHeroEvent);
        };
    }, [language]);

    // Voice Speech Synthesis
    const speakGreeting = (e) => {
        e?.stopPropagation();
        if (!('speechSynthesis' in window) || !heroGreeting) return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(heroGreeting.replace(/[^\w\s\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0C80-\u0CFF]/gi, ''));
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
        window.dispatchEvent(new CustomEvent('open-chat-agent'));
    };

    const getAnimationClass = () => {
        switch (animState) {
            case 'thinking': return 'anim-hero-thinking';
            case 'speaking': return 'anim-hero-speaking';
            case 'success': return 'anim-hero-success scale-110';
            case 'error': return 'anim-hero-error';
            case 'greeting': return 'animate-bounce';
            case 'listening': return 'anim-hero-listening';
            default: return 'anim-hero-idle';
        }
    };

    const publicRoutes = ['/', '/login', '/register', '/verify-otp', '/forgot-password', '/reset-password'];
    const hasSidebar = !publicRoutes.includes(location.pathname);

    if (inline) {
        return (
            <div 
                onClick={handleOpenChat}
                className="mx-3 my-3 bg-navy-800/65 border border-navy-700/50 rounded-2xl p-3 relative cursor-pointer hover:bg-navy-800 transition-all select-none group"
                title="Click to talk with CoopBot"
            >
                <div className="flex items-center space-x-3">
                    {/* Compact Avatar */}
                    <div className="relative shrink-0">
                        <div className={`absolute -inset-1 rounded-full blur-sm transition-all duration-500 opacity-60 group-hover:opacity-100 ${
                            animState === 'error' ? 'bg-red-500' :
                            animState === 'success' ? 'bg-green-500' :
                            animState === 'speaking' ? 'bg-orange-500 animate-pulse' :
                            'bg-orange-400'
                        }`} />
                        <div className={`relative w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-orange-400 p-0.5 flex items-center justify-center ${getAnimationClass()}`}>
                            <img
                                src="/assets/images/mascot-hero.png"
                                alt="CoopBot"
                                className="w-full h-full object-contain rounded-full"
                                onError={(e) => {
                                    e.target.src = '/src/assets/branding/mascot-ai.png';
                                }}
                            />
                        </div>
                    </div>

                    {/* Speech Text */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-0.5">
                                <Sparkles size={10} /> CoopBot
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    speakGreeting();
                                }}
                                className={`p-0.5 rounded transition-colors ${isSpeaking ? 'bg-orange-500 text-white animate-pulse' : 'text-navy-400 hover:text-orange-400'}`}
                                title={isSpeaking ? "Mute speech" : "Read aloud"}
                            >
                                {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                            </button>
                        </div>
                        <p className="text-[11px] text-navy-200 font-medium leading-normal line-clamp-2 mt-0.5">
                            "{heroGreeting || 'I am right here to help.'}"
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!inline && hasSidebar) {
        return null;
    }

    return (
        <div className="fixed bottom-6 left-6 z-40 flex items-end space-x-3 pointer-events-none select-none transition-all duration-300">
            
            {/* Mascot Avatar Trigger */}
            <div 
                onClick={handleOpenChat}
                className="relative group pointer-events-auto cursor-pointer"
                title="Click to talk with CoopBot"
            >
                {/* Status Indicator Glow */}
                <div className={`absolute -inset-1.5 rounded-full blur-md transition-all duration-500 opacity-60 group-hover:opacity-100 ${
                    animState === 'error' ? 'bg-red-500' :
                    animState === 'success' ? 'bg-green-500' :
                    animState === 'speaking' ? 'bg-orange-500 animate-pulse' :
                    'bg-orange-400'
                }`} />

                <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white dark:bg-slate-900 border-2 border-orange-400 p-1 shadow-2xl flex items-center justify-center transition-transform transform group-hover:scale-105 ${getAnimationClass()}`}>
                    <img
                        src="/assets/images/mascot-hero.png"
                        alt="COOP HUB Hero Mascot"
                        className="w-full h-full object-contain rounded-full drop-shadow-md"
                        onError={(e) => {
                            e.target.src = '/src/assets/branding/mascot-ai.png';
                        }}
                    />

                    {/* Active State Mini Badge */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-sm">
                        {animState === 'error' ? <AlertCircle size={12} className="text-white" /> :
                         animState === 'success' ? <CheckCircle2 size={12} className="text-white" /> :
                         <Sparkles size={11} className="text-white animate-spin" style={{ animationDuration: '4s' }} />}
                    </div>
                </div>
            </div>

            {/* Lively Reactive Speech Bubble */}
            {heroGreeting && (
                <div
                    onClick={handleOpenChat}
                    style={{ backgroundColor: 'var(--color-surface, #FFFFFF)' }}
                    className="pointer-events-auto cursor-pointer max-w-xs sm:max-w-sm border-2 border-orange-400 dark:border-orange-500 shadow-2xl rounded-2xl rounded-bl-none p-3.5 transition-all duration-300 transform group hover:-translate-y-1 relative"
                >
                    <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-orange-200 dark:border-slate-700 pb-1">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1">
                            <Sparkles size={12} /> CoopBot Live Guide
                        </span>

                        <div className="flex items-center space-x-1.5">
                            <button
                                onClick={speakGreeting}
                                className={`p-1 rounded-md transition-colors ${isSpeaking ? 'bg-orange-500 text-white animate-pulse' : 'text-slate-600 dark:text-slate-300 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-800'}`}
                                title={isSpeaking ? "Mute speech" : "Read aloud"}
                            >
                                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            </button>
                        </div>
                    </div>

                    <p 
                        style={{ color: 'var(--color-text, #0F172A)' }}
                        className="text-xs font-semibold leading-relaxed"
                    >
                        "{heroGreeting}"
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="italic flex items-center gap-1">
                            <MessageSquare size={12} /> Tap to chat with AI
                        </span>
                        <span className="text-orange-500 font-bold">Ask anything →</span>
                    </div>
                </div>
            )}

        </div>
    );
}
