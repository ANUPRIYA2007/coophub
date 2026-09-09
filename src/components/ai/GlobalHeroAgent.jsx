import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation.js';
import { translateDynamic } from '../../i18n/centralEngine.js';
import { getLanguageMetadata } from '../../i18n/languages.js';
import { Volume2, VolumeX, Sparkles, AlertCircle, CheckCircle2, Bot, MessageSquare, Send, Mic, MicOff, ChevronUp, ChevronDown, Bell, X } from 'lucide-react';
import Hero3D from '../hero3d/Hero3D';
import { aiService } from '../../services/pillar/aiService';
import { heroNotificationHub } from '../../services/ai/heroNotificationHub';

export default function GlobalHeroAgent({ inline = false }) {
    const { t, language } = useTranslation();
    const location = useLocation();
    const params = useParams();
    const navigate = useNavigate();

    const [animState, setAnimState] = useState('idle'); // idle, listening, speaking, thinking, success, error, greeting
    const [heroGreeting, setHeroGreeting] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [activeInputName, setActiveInputName] = useState(null);
    const [isBubbleOpen, setIsBubbleOpen] = useState(false);
    const [isFloatingBubbleOpen, setIsFloatingBubbleOpen] = useState(true);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

    // Interactive Sidebar Chat State
    const [heroMessages, setHeroMessages] = useState([]);
    const [heroInput, setHeroInput] = useState('');
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const heroMsgEndRef = useRef(null);
    const heroInputRef = useRef(null);

    // Realtime Hero AI Notification Subscription
    useEffect(() => {
        const unsubscribe = heroNotificationHub.subscribe(({ latest, unreadCount }) => {
            setUnreadNotifCount(unreadCount);
            if (latest) {
                setIsFloatingBubbleOpen(true);
                setAnimState('speaking');
                setHeroGreeting(`🔔 ${latest.title}: ${latest.message}`);
                setHeroMessages((prev) => [
                    ...prev,
                    {
                        id: `notif-${latest.id}`,
                        sender: 'bot',
                        isNotification: true,
                        text: `🔔 **${latest.title}**\n${latest.message}`,
                        timestamp: latest.timestamp
                    }
                ]);
                setTimeout(() => setAnimState('idle'), 5000);
            }
        });

        return () => unsubscribe();
    }, []);

    // Dynamic Context & Route Tracking per page
    const routeGuidanceMap = useMemo(() => ({
        '/': {
            en: 'Welcome to COOP HUB! Choose your dedicated portal to access services, assignments, or administration.',
            hi: 'कॉप हब में आपका स्वागत है! सेवाओं, कार्यों या प्रशासन तक पहुँचने के लिए अपना समर्पित पोर्टल चुनें।',
            ta: 'கூட்டுறவு தளத்திற்கு உங்களை வரவேற்கிறோம்! சேவைகள், பணிகள் அல்லது நிர்வாகத்தை அணுக உங்கள் போர்ட்டலைத் தேர்வுசெய்யவும்.',
            te: 'కూప్ హబ్ కు స్వాగతం! సేవలు, పనులు లేదా పరిపాలనను యాక్సెస్ చేయడానికి మీ పోర్టల్‌ను ఎంచుకోండి.',
            kn: 'ಕೂಪ್ ಹಬ್‌ಗೆ ಸುಸ್ವಾಗತ! ಸೇವೆಗಳು, ನಿಯೋಜನೆಗಳು ಅಥವಾ ಆಡಳಿತವನ್ನು ಪ್ರವೇಶಿಸಲು ನಿಮ್ಮ ಮೀಸಲಾದ ಪೋರ್ಟಲ್ ಆಯ್ಕೆಮಾಡಿ.',
            ml: 'കൂപ് ഹബിലേക്ക് സ്വാഗതം! സേവനങ്ങളും ഭരണനിർവ്വഹണവും ലഭ്യമാക്കാൻ നിങ്ങളുടെ പോർട്ടൽ തിരഞ്ഞെടുക്കുക.',
            bn: 'কোপ হাবে স্বাগতম! পরিষেবা, কার্যাবলী বা প্রশাসনের জন্য আপনার নির্ধারিত পোর্টালটি নির্বাচন করুন।',
            mr: 'कॉप हबमध्ये आपले स्वागत आहे! सेवा किंवा प्रशासनामध्ये प्रवेश करण्यासाठी आपले समर्पित पोर्टल निवडा.',
            gu: 'કૂપ હબમાં આપનું સ્વાગત છે! સેવાઓ અથવા વહીવટ માટે તમારું સમર્પિત પોર્ટલ પસંદ કરો.',
            mood: 'happy'
        },
        '/home': {
            en: 'Welcome to your Dashboard! Browse top-rated services or track active technicians.',
            ta: 'உங்கள் முகப்புப் பக்கத்திற்கு வருக! சிறந்த சேவைகளை ஆராயலாம் அல்லது தொழில்நுட்ப வல்லுநர்களைக் கண்காணிக்கலாம்.',
            mood: 'happy'
        },
        '/services': {
            en: 'Find verified electricians, plumbers, AC specialists, and home repair experts across Chennai.',
            ta: 'மின்சாரம், பிளம்பிங், ஏசி பழுது உள்ளிட்ட சிறந்த தொழில்நுட்ப வல்லுநர்களைத் தேர்ந்தெடுக்கவும்.',
            mood: 'excited'
        },
        '/requests': {
            en: 'Your live bookings queue. View technician dispatch progress, arrival time, and job status.',
            ta: 'உங்கள் முன்பதிவுகளின் நேரடி நிலையை இங்கே கண்காணிக்கலாம் மற்றும் வருகை OTP-யை அறியலாம்.',
            mood: 'helpful'
        },
        '/messages': {
            en: 'Live direct chat with your assigned technicians and COOP HUB support.',
            ta: 'உங்கள் தொழில்நுட்ப வல்லுநருடன் நேரடியாக செய்தி பரிமாறலாம்.',
            mood: 'helpful'
        },
        '/history': {
            en: 'Your completed service history, official invoices, and verified technician ratings.',
            ta: 'உங்கள் முந்தைய சேவைகள், கட்டண ரசீதுகள் மற்றும் மதிப்பீடுகளை இங்கே காணலாம்.',
            mood: 'happy'
        },
        '/support': {
            en: 'COOP HUB Help & Support center. I am here 24/7 to solve any service or booking questions.',
            ta: 'உதவி மையம்: உங்கள் சேவை அல்லது கட்டணம் தொடர்பான கேள்விகளுக்கு உதவ நான் தயாராக உள்ளேன்.',
            mood: 'helpful'
        },
        '/settings': {
            en: 'Settings: Manage your profile, language preferences, notification alerts, and security.',
            ta: 'அமைப்புகள்: உங்கள் மொழி, அறிவிப்புகள் மற்றும் கணக்கு பாதுகாப்பை நிர்வகிக்கவும்.',
            mood: 'thinking'
        },
        '/profile': {
            en: 'Customer Profile: Update your contact information and saved service delivery addresses.',
            ta: 'சுயவிவரம்: உங்கள் தொடர்பு எண்கள் மற்றும் முகவரி தகவல்களை இங்கே சரிபார்க்கலாம்.',
            mood: 'happy'
        },
        '/admin/pillars': {
            en: 'Workforce Registry: Review the Pending Verification queue to approve new technician applicants.',
            ta: 'தொழில்நுட்ப வல்லுநர் பதிவுப் பட்டியல்: நிலுவையில் உள்ள புதிய விண்ணப்பங்களைச் சரிபார்த்து ஒப்புதல் அளிக்கவும்!',
            mood: 'thinking'
        },
        '/pillar/register': {
            en: 'Pillar Registration: Select your trade skills and upload your Government ID for verification!',
            ta: 'பில்லர் பதிவு: உங்கள் தொழில் திறன்கள் மற்றும் அரசு அடையாள அட்டையை பதிவேற்றி இணையுங்கள்!',
            mood: 'excited'
        },
        '/pillar/login': {
            en: 'Pillar Portal: Sign in with your assigned Unique Pillar ID, Password, or Mobile OTP!',
            ta: 'பில்லர் போர்ட்டல்: உங்கள் பில்லர் ஐடி அல்லது கடவுச்சொல் மூலம் உள்நுழையவும்!',
            mood: 'happy'
        },
    }), []);

    // Live AI navigation & context tracking on every route change
    useEffect(() => {
        let isMounted = true;
        const currentPath = location.pathname;

        setIsFloatingBubbleOpen(true);
        // Immediate visual cue that CoopBot is active & processing new page
        setAnimState('speaking');

        // Look up route guidance
        let matched = routeGuidanceMap[currentPath];
        if (!matched) {
            for (const [routeKey, val] of Object.entries(routeGuidanceMap)) {
                if (currentPath.startsWith(routeKey) && routeKey !== '/') {
                    matched = val;
                    break;
                }
            }
        }

        const baseFallback = matched?.[language] || (matched?.en ? t(matched.en) : null) || t('How Can I Assist Your Home Today?');
        
        const resolveInitial = async () => {
            let initial = baseFallback;
            if (language !== 'en' && !matched?.[language]) {
                const syncTrans = t(baseFallback);
                if (syncTrans && syncTrans !== baseFallback) {
                    initial = syncTrans;
                } else {
                    initial = await translateDynamic(baseFallback, language, 'en');
                }
            }
            if (isMounted) setHeroGreeting(initial);
        };
        resolveInitial();

        // Query Live AI intelligence asynchronously for smart contextual guidance
        aiService.chatWithMascot({
            message: `Customer just navigated to ${currentPath}. Give a concise, friendly 1-sentence tip.`,
            context: {
                route: currentPath,
                language,
                module: currentPath.split('/')[1] || 'home'
            }
        }).then((res) => {
            if (isMounted && res?.reply) {
                const clean = res.reply.split('\n')[0].replace(/[*#_]/g, '').trim();
                if (clean.length > 15) {
                    setHeroGreeting(clean);
                }
            }
        }).catch(() => {
            // Keep instant contextual fallback
        }).finally(() => {
            if (isMounted) {
                setTimeout(() => {
                    if (isMounted) setAnimState('idle');
                }, 2200);
            }
        });

        return () => {
            isMounted = false;
        };
    }, [location.pathname, language, routeGuidanceMap]);

    // Global Interactive Live Focus & Error Tracking
    useEffect(() => {
        const handleFocusIn = async (e) => {
            const target = e.target;
            if (!target || !['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;

            const name = (target.name || target.id || target.placeholder || '').toLowerCase();
            setActiveInputName(name);
            setAnimState('speaking');

            let baseFocusMsg = "I'm watching your progress! Fill in the highlighted field.";

            // Contextual dynamic speech guidance per field
            if (name.includes('documenttype') || name.includes('document_type')) {
                baseFocusMsg = 'Select your preferred government document: Aadhaar, PAN Card, Voter ID, or Driving Licence.';
            } else if (name.includes('documentnumber') || name.includes('document_number')) {
                baseFocusMsg = 'Enter your official government document number. Sensitive digits are securely masked.';
            } else if (name.includes('fullname') || name.includes('name')) {
                baseFocusMsg = 'Enter your full legal name so your technician can identify you.';
            } else if (name.includes('email')) {
                baseFocusMsg = 'Enter your email address to receive real-time booking updates and invoices.';
            } else if (name.includes('mobile') || name.includes('phone')) {
                baseFocusMsg = 'Enter your 10-digit mobile number for arrival verification and OTP.';
            } else if (name.includes('password')) {
                baseFocusMsg = 'Create a secure password with 8+ characters, including numbers and uppercase letters.';
            } else if (name.includes('address') || name.includes('city') || name.includes('area')) {
                baseFocusMsg = 'Enter your exact street address or use Current GPS Location for accurate doorstep arrival.';
            } else if (name.includes('date') || name.includes('time')) {
                baseFocusMsg = 'Pick your preferred service date and time slot, or enable flexible timing.';
            } else if (name.includes('description') || name.includes('tell_us_more')) {
                baseFocusMsg = 'Describe your issue clearly so your Pillar arrives prepared with the right spare parts.';
            } else if (name.includes('search')) {
                baseFocusMsg = 'Search any home service (Electrician, AC Repair, Plumber) to see verified nearby Pillars.';
            }

            const promptText = language !== 'en' ? await translateDynamic(baseFocusMsg, language, 'en') : baseFocusMsg;
            setHeroGreeting(promptText);
        };

        const handleFocusOut = (e) => {
            const target = e.target;
            if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
                const name = (target.name || target.id || target.placeholder || '').toLowerCase();
                const val = (target.value || '').trim();

                // Dynamic contextual validation on blur
                if (name.includes('email') && val && (!val.includes('@') || !val.includes('.'))) {
                    setAnimState('error');
                    const baseMsg = "Oops! That email address looks incomplete. Please include a valid '@' and domain!";
                    translateDynamic(baseMsg, language, 'en').then(msg => setHeroGreeting(msg));
                    return;
                } else if ((name.includes('mobile') || name.includes('phone')) && val && val.replace(/\D/g, '').length < 10) {
                    setAnimState('warning');
                    const baseMsg = "Oops! Mobile number needs to be 10 digits. Please double-check your number!";
                    translateDynamic(baseMsg, language, 'en').then(msg => setHeroGreeting(msg));
                    return;
                } else if (name.includes('password') && val && val.length < 6) {
                    setAnimState('warning');
                    const baseMsg = "Oops! Password is a bit too short. Please use at least 6 characters for security!";
                    translateDynamic(baseMsg, language, 'en').then(msg => setHeroGreeting(msg));
                    return;
                }
            }

            setActiveInputName(null);
            setTimeout(() => {
                setAnimState('idle');
            }, 1200);
        };

        // Form Invalid Event Capture (detects when user attempts submit with empty required fields)
        const handleInvalidCapture = (e) => {
            const target = e.target;
            const fieldLabel = target.name || target.id || target.placeholder || 'required field';
            setAnimState('error');
            const baseMsg = `Oops! It looks like ${fieldLabel} is missing or incorrect. Please fill it in to continue!`;
            translateDynamic(baseMsg, language, 'en').then(msg => setHeroGreeting(msg));
        };

        // Custom live event dispatch listener for validation errors / successes
        const handleHeroEvent = (e) => {
            if (e.detail?.type === 'error') {
                setAnimState('error');
                setHeroGreeting(`Oops! ${e.detail.message || 'Please check the highlighted field!'}`);
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
        document.addEventListener('invalid', handleInvalidCapture, true);
        window.addEventListener('coophub-hero-event', handleHeroEvent);

        return () => {
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
            document.removeEventListener('invalid', handleInvalidCapture, true);
            window.removeEventListener('coophub-hero-event', handleHeroEvent);
        };
    }, [language]);

    // Voice Speech Synthesis
    const speakGreeting = (e, overrideText) => {
        e?.stopPropagation();
        const textToSpeak = overrideText || heroGreeting;
        if (typeof window === 'undefined' || !('speechSynthesis' in window) || !window.speechSynthesis || !textToSpeak) return;

        try {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
                return;
            }

            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(textToSpeak.replace(/[^\w\s\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0C80-\u0CFF\u0980-\u09FF\u0A80-\u0AFF\u0B00-\u0B7F\u0A00-\u0A7F\u0D00-\u0D7F\u0600-\u06FF]/gi, ''));
            const meta = getLanguageMetadata(language);
            utterance.lang = meta?.bcp47 || 'en-IN';
            utterance.rate = 1.0;
            utterance.pitch = 1.05;

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            window.speechSynthesis.speak(utterance);
        } catch (err) {
            console.warn("Speech synthesis unavailable:", err.message);
            setIsSpeaking(false);
        }
    };

    const handleDismissHeroBubble = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setIsFloatingBubbleOpen(false);
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        setAnimState('idle');
    };

    const handleHeroClick = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (heroGreeting && isFloatingBubbleOpen) {
            // Close the hero AI conversation bubble
            handleDismissHeroBubble(e);
        } else {
            // Re-open guidance conversation bubble
            setIsFloatingBubbleOpen(true);
        }
    };

    const handleOpenChat = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        window.dispatchEvent(new CustomEvent('open-customer-chat'));
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

    // Voice recognition toggle
    const toggleVoice = () => {
        if (typeof window === 'undefined') return;
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;
        if (isListening) { setIsListening(false); return; }
        try {
            const recognition = new SR();
            const meta = getLanguageMetadata(language);
            recognition.lang = meta?.bcp47 || 'en-IN';
            recognition.interimResults = false;
            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = () => setIsListening(false);
            recognition.onresult = (e) => {
                const transcript = e.results?.[0]?.[0]?.transcript;
                if (transcript) {
                    setHeroInput(transcript);
                    setIsBubbleOpen(true);
                }
            };
            recognition.start();
        } catch {
            setIsListening(false);
        }
    };

    // Send chat to Live AI
    const handleHeroSend = async (e) => {
        e?.preventDefault();
        const text = heroInput.trim();
        if (!text || isLoadingAi) return;

        setHeroInput('');
        const userMsg = {
            id: `user-${Date.now()}`,
            sender: 'user',
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setHeroMessages(prev => [...prev, userMsg]);
        setAnimState('thinking');
        setIsLoadingAi(true);

        try {
            const res = await aiService.chatWithMascot({
                message: text,
                context: {
                    route: location.pathname,
                    language,
                    module: location.pathname.split('/')[1] || 'home'
                }
            });

            const reply = res?.reply || "I am right here to help you!";
            // Preserve full AI response for chat history; use first line for greeting bubble only
            const bubbleText = reply.split('\n')[0].replace(/[*#_]/g, '').trim();

            setHeroMessages(prev => [...prev, {
                id: `hero-${Date.now()}`,
                sender: 'hero',
                text: reply,
                route: res?.route,
                action: res?.action,
                yesNoAction: res?.yesNoAction,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
            setHeroGreeting(bubbleText);
            setAnimState('idle');
            speakGreeting(null, bubbleText);
        } catch (err) {
            setHeroMessages(prev => [...prev, {
                id: `err-${Date.now()}`,
                sender: 'hero',
                text: "⚠️ AI service could not respond right now. Please try again.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
            setAnimState('idle');
        } finally {
            setIsLoadingAi(false);
        }
    };

    const sendQuickAction = (query) => {
        setHeroInput(query);
        setIsBubbleOpen(true);
        setTimeout(() => {
            const fakeEvent = { preventDefault: () => {} };
            // send directly
            setHeroInput('');
            const userMsg = {
                id: `user-${Date.now()}`,
                sender: 'user',
                text: query,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setHeroMessages(prev => [...prev, userMsg]);
            setAnimState('thinking');
            setIsLoadingAi(true);
            aiService.chatWithMascot({
                message: query,
                context: { route: location.pathname, language, module: 'home' }
            }).then(res => {
                const fullReply = res?.reply || "I can help with that!";
                const bubbleText = fullReply.split('\n')[0].replace(/[*#_]/g, '').trim();
                setHeroMessages(prev => [...prev, {
                    id: `hero-${Date.now()}`,
                    sender: 'hero',
                    text: fullReply,
                    route: res?.route,
                    action: res?.action,
                    yesNoAction: res?.yesNoAction,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
                setHeroGreeting(bubbleText);
                setAnimState('idle');
                speakGreeting(null, bubbleText);
            }).catch(() => {
                setAnimState('idle');
            }).finally(() => {
                setIsLoadingAi(false);
            });
        }, 100);
    };

    if (inline) {
        return (
            <div className="mx-3 my-2 relative select-none flex flex-col items-center">
                {/* Expandable Interactive Chat Drawer */}
                {isBubbleOpen && (
                    <div 
                        style={{ background: "rgba(15, 23, 42, 0.95)", borderColor: "rgba(255, 121, 0, 0.35)" }}
                        className="w-full border rounded-2xl p-2.5 mb-2 relative shadow-2xl backdrop-blur-md animate-fadeIn flex flex-col gap-2 max-h-[300px]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5 px-1">
                            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles size={12} /> CoopBot Assistant
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); speakGreeting(e); }}
                                    className={`p-1 rounded transition-colors ${isSpeaking ? 'bg-orange-500 text-white animate-pulse' : 'text-slate-400 hover:text-orange-400'}`}
                                    title={isSpeaking ? "Mute speech" : "Read aloud"}
                                >
                                    {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsBubbleOpen(false); }}
                                    className="text-slate-400 hover:text-white p-0.5 text-xs font-bold"
                                    title="Close"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Message list */}
                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[140px] text-[11px]">
                            {heroMessages.length === 0 ? (
                                <p className="text-slate-200 font-medium leading-relaxed p-1">
                                    "{heroGreeting || 'Hello! I am CoopBot, your live service guide. How may I assist your home today?'}"
                                </p>
                            ) : (
                                heroMessages.map(m => (
                                    <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`p-1.5 px-2.5 rounded-xl max-w-[92%] leading-relaxed ${
                                            m.sender === 'user'
                                                ? 'bg-orange-500 text-white rounded-br-none'
                                                : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                                        }`}>
                                            <div>{m.text}</div>

                                            {/* Actionable YES / NO Buttons */}
                                            {m.sender === 'hero' && m.yesNoAction && (
                                                <div className="mt-2 pt-1.5 border-t border-slate-700/70 flex items-center gap-1.5 w-full">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (m.yesNoAction.yes?.path) {
                                                                setIsBubbleOpen(false);
                                                                navigate(m.yesNoAction.yes.path);
                                                            }
                                                        }}
                                                        className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-[10px] py-1 px-2 rounded shadow transition-all active:scale-95 text-center flex items-center justify-center gap-1 cursor-pointer"
                                                    >
                                                        <CheckCircle2 size={11} />
                                                        <span>{m.yesNoAction.yes.label}</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setHeroMessages(prev => prev.map(msg => msg.id === m.id ? { ...msg, yesNoAction: null } : msg));
                                                        }}
                                                        className="bg-slate-700/80 hover:bg-slate-600 text-slate-300 text-[10px] py-1 px-2 rounded font-medium transition-colors cursor-pointer"
                                                    >
                                                        {m.yesNoAction.no?.label || 'Dismiss'}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Single Action Pill Button */}
                                            {m.sender === 'hero' && m.action && !m.yesNoAction && (
                                                <div className="mt-2 pt-1.5 border-t border-slate-700/70 w-full">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (m.action.path) {
                                                                setIsBubbleOpen(false);
                                                                navigate(m.action.path);
                                                            }
                                                        }}
                                                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] py-1 px-2 rounded shadow transition-all active:scale-95 text-center cursor-pointer"
                                                    >
                                                        {m.action.label}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            {isLoadingAi && (
                                <div className="text-[10px] text-orange-300 italic flex items-center gap-1">
                                    <Sparkles size={10} className="animate-spin" /> Thinking...
                                </div>
                            )}
                            <div ref={heroMsgEndRef} />
                        </div>

                        {/* Quick Action Chips */}
                        <div className="flex gap-1 overflow-x-auto py-1 no-scrollbar border-t border-slate-700/50">
                            {[
                                { label: '⚡ Electrician', q: 'I need an electrician' },
                                { label: '💧 Plumbing', q: 'I need plumbing repair' },
                                { label: '📦 Orders', q: 'Show my bookings' },
                                { label: '🆘 Support', q: 'Help with service' },
                            ].map(chip => (
                                <button
                                    key={chip.label}
                                    onClick={() => sendQuickAction(chip.q)}
                                    className="text-[10px] whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-colors"
                                >
                                    {chip.label}
                                </button>
                            ))}
                        </div>

                        {/* Mini Input Box */}
                        <form onSubmit={handleHeroSend} className="flex items-center gap-1 pt-1 border-t border-slate-700/50">
                            <button
                                type="button"
                                onClick={toggleVoice}
                                className={`p-1 rounded-md transition-colors ${isListening ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white'}`}
                                title="Voice speech recognition"
                            >
                                {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                            </button>
                            <input
                                ref={heroInputRef}
                                type="text"
                                value={heroInput}
                                onChange={(e) => setHeroInput(e.target.value)}
                                placeholder="Ask CoopBot anything..."
                                className="flex-1 bg-slate-800/90 text-white placeholder-slate-400 text-[11px] px-2 py-1 rounded-md border border-slate-700 focus:outline-none focus:border-orange-500"
                            />
                            <button
                                type="submit"
                                disabled={isLoadingAi || !heroInput.trim()}
                                className="p-1 rounded-md bg-orange-500 text-white disabled:opacity-40 hover:bg-orange-600 transition-colors"
                            >
                                <Send size={12} />
                            </button>
                        </form>

                        {/* Link to Full Chat Drawer */}
                        <div className="pt-1 text-center">
                            <button
                                onClick={handleOpenChat}
                                className="text-[10px] text-orange-400 hover:text-orange-300 font-bold flex items-center justify-center gap-1 w-full py-0.5"
                            >
                                <MessageSquare size={10} /> Open Full AI Chat Window →
                            </button>
                        </div>
                    </div>
                )}

                {/* Full 3D Hero Mascot Character (Standing freely uncropped) */}
                <div 
                    onClick={() => {
                        setIsBubbleOpen(prev => !prev);
                        if (!isBubbleOpen) {
                            setTimeout(() => heroInputRef.current?.focus(), 300);
                        }
                    }}
                    className="w-full h-48 sm:h-52 relative flex items-center justify-center cursor-pointer group transition-transform transform hover:scale-105"
                    title={isBubbleOpen ? "Click to collapse" : "Click to chat with CoopBot"}
                >
                    <Hero3D mode="card" state={isSpeaking ? 'speaking' : isLoadingAi ? 'thinking' : animState} style={{ width: "100%", height: "100%" }} />

                    {/* Live Active Status Aura Pill */}
                    <div 
                        style={{
                            position: "absolute",
                            bottom: "2px",
                            background: "rgba(5, 10, 18, 0.9)",
                            color: "white",
                            padding: "4px 12px",
                            borderRadius: "9999px",
                            fontSize: "10px",
                            fontWeight: "700",
                            backdropFilter: "blur(8px)",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            border: "1px solid rgba(255, 121, 0, 0.35)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
                        }}
                    >
                        <span className="status-dot available" style={{ width: "6px", height: "6px", background: "#10B981", borderRadius: "50%" }}></span>
                        <span style={{ textTransform: "capitalize", color: "#F1F5F9" }}>CoopBot: {isLoadingAi ? t('Thinking') : t(animState)}</span>
                        <span className="text-[9px] text-orange-400 font-normal ml-1">
                            {isBubbleOpen ? `• ${t("Close")}` : `• ${t("Tap to chat with AI")}`}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    const authPages = ['/login', '/register', '/pillar/login', '/pillar/register'];
    if (!inline && authPages.includes(location.pathname)) {
        return null;
    }

    if (!inline && hasSidebar) {
        return null;
    }

    return (
        <div className="fixed bottom-6 left-6 z-40 flex items-end space-x-3 pointer-events-none select-none transition-all duration-300">
            
            {/* Big Uncaged 3D Mascot Character Trigger */}
            <div 
                onClick={handleHeroClick}
                className="relative group pointer-events-auto cursor-pointer flex flex-col items-center"
                title={heroGreeting && isFloatingBubbleOpen ? "Click to close conversation" : "Click to view CoopBot guidance"}
            >
                <div className="relative w-48 h-60 sm:w-56 sm:h-72 flex items-center justify-center transition-transform transform group-hover:scale-105">
                    <Hero3D mode="card" state={animState} onClick={handleHeroClick} style={{ width: "100%", height: "100%" }} />

                    {/* Status Pill Aura */}
                    <div 
                        onClick={handleHeroClick}
                        style={{
                            position: "absolute",
                            bottom: "8px",
                            background: "rgba(5, 10, 18, 0.88)",
                            color: "white",
                            padding: "4px 12px",
                            borderRadius: "9999px",
                            fontSize: "11px",
                            fontWeight: "700",
                            backdropFilter: "blur(8px)",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            border: "1px solid rgba(255, 121, 0, 0.3)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                            cursor: "pointer",
                            pointerEvents: "auto"
                        }}
                    >
                        <span className="status-dot available" style={{ width: "7px", height: "7px", background: "#10B981", borderRadius: "50%" }}></span>
                        <span style={{ textTransform: "capitalize", color: "#F1F5F9" }}>CoopBot: {t(animState)}</span>
                        {heroGreeting && isFloatingBubbleOpen && (
                            <span className="text-[10px] text-orange-400 font-semibold ml-1 hover:underline">
                                • {t("Close")}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Lively Reactive Speech Bubble */}
            {heroGreeting && isFloatingBubbleOpen && (
                <div
                    style={{ backgroundColor: 'var(--color-surface, #FFFFFF)', borderColor: '#FF7900' }}
                    className="pointer-events-auto max-w-xs sm:max-w-sm border-2 shadow-2xl rounded-2xl rounded-bl-none p-3.5 transition-all duration-300 transform group hover:-translate-y-1 relative mb-6"
                >
                    <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-orange-200 dark:border-slate-700 pb-1">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1">
                            <Sparkles size={12} /> {t("CoopBot Live Guide")}
                        </span>

                        <div className="flex items-center space-x-1.5">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    speakGreeting();
                                }}
                                className={`p-1 rounded-md transition-colors ${isSpeaking ? 'bg-orange-500 text-white animate-pulse' : 'text-slate-600 dark:text-slate-300 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-800'}`}
                                title={isSpeaking ? "Mute speech" : "Read aloud"}
                            >
                                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            </button>

                            <button
                                onClick={handleDismissHeroBubble}
                                className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 transition-colors"
                                title="Close conversation"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    <p 
                        style={{ color: 'var(--color-text, #0F172A)' }}
                        className="text-xs font-semibold leading-relaxed"
                    >
                        "{heroGreeting}"
                    </p>

                    <div 
                        onClick={handleOpenChat}
                        className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer hover:opacity-80 transition-opacity"
                        title="Click to open AI Chat"
                    >
                        <span className="italic flex items-center gap-1">
                            <MessageSquare size={12} /> {t("Tap to chat with AI")}
                        </span>
                        <span style={{ color: '#FF7900' }} className="font-bold">{t("Ask anything →")}</span>
                    </div>
                </div>
            )}

        </div>
    );
}
