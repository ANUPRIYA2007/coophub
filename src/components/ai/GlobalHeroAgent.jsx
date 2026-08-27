import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';

export default function GlobalHeroAgent() {
    const { t, language } = useTranslation();
    const location = useLocation();
    const params = useParams();

    // Context Evaluation logic directly mirroring React Router state
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

    // Chat States
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: t('home.mascot_default') || 'Hello! How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // Expressive States
    const [animState, setAnimState] = useState('idle'); // idle, listening, thinking, speaking, success, error
    const [heroGreeting, setHeroGreeting] = useState('');

    const messagesEndRef = useRef(null);

    // Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    // React to Context Changes automatically (Context Navigation Awareness)
    useEffect(() => {
        const announceContextChange = async () => {
            try {
                // Gentle pulse on nav
                setAnimState('thinking');
                const res = await fetch('http://localhost:3000/api/ai/mascot-context', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentRoute: location.pathname, language, module: currentContext.module })
                });
                const data = await res.json();

                if (res.ok && data.message) {
                    setHeroGreeting(data.message);
                } else {
                    setHeroGreeting('I am ready when you are!');
                }
                setTimeout(() => setAnimState('idle'), 1000);
            } catch (err) {
                setAnimState('idle');
            }
        };
        announceContextChange();
    }, [location.pathname, language, currentContext.module]);

    useEffect(() => {
        if (recognition) {
            recognition.continuous = false;
            recognition.lang = language === 'en' ? 'en-US' : (language === 'ta' ? 'ta-IN' : 'hi-IN');

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
                setAnimState('idle');
            };

            recognition.onerror = () => { setIsListening(false); setAnimState('error'); setTimeout(() => setAnimState('idle'), 1000); };
            recognition.onend = () => { setIsListening(false); if (animState === 'listening') setAnimState('idle'); };
        }
    }, [language, recognition, animState]);

    useEffect(() => {
        if (isChatOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isChatOpen]);

    const toggleListening = () => {
        if (!recognition) return alert('Speech Recognition not supported in this browser.');
        if (isListening) {
            recognition.stop();
            setIsListening(false);
            setAnimState('idle');
        } else {
            recognition.start();
            setIsListening(true);
            setAnimState('listening');
        }
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        const newHistory = [...messages, { role: 'user', content: userMsg }];
        setMessages(newHistory);

        setLoading(true);
        setAnimState('thinking');

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const res = await fetch('http://localhost:3000/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newHistory,
                    language,
                    token: session?.access_token,
                    contextData: currentContext
                })
            });
            const data = await res.json();

            if (data.message) {
                setMessages([...newHistory, { role: 'assistant', content: data.message }]);
                setAnimState('speaking');

                // Keep speaking state briefly for visual feedback
                setTimeout(() => setAnimState('idle'), 2500);

                const utterance = new SpeechSynthesisUtterance(data.message);
                utterance.lang = language === 'ta' ? 'ta-IN' : 'en-US';
                window.speechSynthesis.speak(utterance);
            }
        } catch (err) {
            setMessages([...newHistory, { role: 'assistant', content: 'Connection error. Please try again.' }]);
            setAnimState('error');
            setTimeout(() => setAnimState('idle'), 1200);
        } finally {
            setLoading(false);
        }
    };

    const getHeroAnimationClass = () => {
        switch (animState) {
            case 'listening': return 'anim-hero-listening';
            case 'thinking': return 'anim-hero-thinking';
            case 'speaking': return 'anim-hero-speaking';
            case 'success': return 'anim-hero-success';
            case 'error': return 'anim-hero-error';
            default: return 'anim-hero-idle';
        }
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">

            {/* HERO VISUAL: Bottom Left */}
            <div className="absolute bottom-6 left-6 pointer-events-auto flex items-end space-x-3">
                {/* Visual Mascot */}
                <div className={`w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full shadow-2xl shadow-navy-900/20 border-[3px] border-orange-500 overflow-hidden shrink-0 filter drop-shadow-xl p-1 relative transition-transform ${getHeroAnimationClass()}`}>
                    <img
                        src="/src/assets/branding/mascot-ai.jpg"
                        alt="Hero Mascot"
                        className="w-full h-full object-cover rounded-full"
                    />
                    {animState === 'listening' && (
                        <div className="absolute inset-0 bg-red-500/10 rounded-full animate-pulse"></div>
                    )}
                </div>

                {/* Contextual Bubble */}
                <div className="bg-white px-4 py-2 text-sm text-navy-800 shadow-xl rounded-2xl rounded-bl-sm font-medium border border-navy-100 max-w-[200px] sm:max-w-xs transition-opacity duration-300 opacity-90 hover:opacity-100">
                    {animState === 'thinking' ? (
                        <div className="flex space-x-1 items-center h-5">
                            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce delay-75"></div>
                            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce delay-150"></div>
                            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce delay-300"></div>
                        </div>
                    ) : (
                        heroGreeting || "Loading..."
                    )}
                </div>
            </div>



        </div>
    );
}
