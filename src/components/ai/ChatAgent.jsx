import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';
import { Send, Mic, MicOff, X, Sparkles, MessageSquare, Bot, Volume2, VolumeX, ArrowRight } from 'lucide-react';

export default function ChatAgent({ contextData }) {
    const { t, language } = useTranslation();
    const location = useLocation();
    const params = useParams();
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speakingMsgId, setSpeakingMsgId] = useState(null);
    const messagesEndRef = useRef(null);

    // Listen for custom event to open customer chat (from hero bubble or other triggers)
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-customer-chat', handleOpen);
        return () => window.removeEventListener('open-customer-chat', handleOpen);
    }, []);

    // Initial greeting based on language
    useEffect(() => {
        const greetings = {
            ta: 'வணக்கம்! நான் உங்கள் CoopBot AI உதவியாளர். சேவைகளைத் தேட, உங்கள் கோரிக்கைகளைக் கண்காணிக்க அல்லது உதவி பெற என்னிடம் கேட்கலாம்.',
            hi: 'नमस्ते! मैं आपका CoopBot AI सहायक हूँ। सेवाएं खोजने, अनुरोध ट्रैक करने या सहायता के लिए मुझसे पूछें।',
            te: 'నమస్కారం! నేను మీ CoopBot AI సహాయకుడిని. సేవలను శోధించడానికి లేదా మీ అభ్యర్థనలను ట్రాక్ చేయడానికి నన్ను అడగండి.',
            kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ CoopBot AI ಸಹಾಯಕ. ಸೇವೆಗಳನ್ನು ಹುಡುಕಲು ಅಥವಾ ನಿಮ್ಮ ವಿನಂತಿಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ನನ್ನನ್ನು ಕೇಳಿ.',
            en: 'Hello! I am CoopBot, your 24/7 AI Customer Assistant. Ask me about booking home services, tracking requests, pricing, or support.'
        };

        setMessages([
            {
                id: 'welcome-1',
                role: 'assistant',
                content: greetings[language] || greetings.en,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
    }, [language]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Native Speech Synthesis (TTS Voice output)
    const speakText = (text, msgId) => {
        if (!('speechSynthesis' in window)) {
            alert('Text-to-speech is not supported in this browser.');
            return;
        }

        if (speakingMsgId === msgId) {
            window.speechSynthesis.cancel();
            setSpeakingMsgId(null);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
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

        utterance.onstart = () => setSpeakingMsgId(msgId);
        utterance.onend = () => setSpeakingMsgId(null);
        utterance.onerror = () => setSpeakingMsgId(null);

        window.speechSynthesis.speak(utterance);
    };

    // Speech-To-Text (Voice input)
    const toggleListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice speech recognition is not supported in this browser.');
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            const langCodeMap = {
                ta: 'ta-IN',
                hi: 'hi-IN',
                te: 'te-IN',
                kn: 'kn-IN',
                en: 'en-US'
            };
            recognition.lang = langCodeMap[language] || 'en-US';
            recognition.interimResults = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = () => setIsListening(false);
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (transcript) {
                    setInput(transcript);
                }
            };

            recognition.start();
        } catch (err) {
            console.error('STT error:', err);
            setIsListening(false);
        }
    };

    // ────── LOCAL CUSTOMER INTENT ROUTER ──────
    // Handles common customer queries locally with rich answers.
    // Only falls back to the backend /api/ai/chat for unrecognized queries.
    const routeCustomerIntent = (text) => {
        const q = text.toLowerCase();

        // 1. Check Track / status / request first to avoid collisions
        if (q.includes('track') || q.includes('status') || q.includes('request') || q.includes('order') || q.includes('where') || q.includes('eta') || q.includes('pillar coming')) {
            return {
                reply: '📦 To track your active request:\n\n1️⃣ Go to **My Requests** in the sidebar\n2️⃣ Click on any active request card\n3️⃣ View real-time GPS tracking, Pillar ETA, and live status updates\n\n📋 Your active request **#REQ-8942** (Electrical Repair) — Pillar Raj Kumar is en route (ETA ~8 mins).\n\nWould you like me to take you to the tracking page?',
                action: { type: 'navigate', path: '/requests', label: 'View My Requests' }
            };
        }

        // 2. Check Support / help / ticket
        if (q.includes('support') || q.includes('help') || q.includes('ticket') || q.includes('complaint') || q.includes('issue') || q.includes('problem with service')) {
            return {
                reply: '🆘 Need help? Here\'s what you can do:\n\n1️⃣ **Browse FAQ** — Common answers at /support\n2️⃣ **Open a Support Ticket** — Describe your issue and our team responds within 2 hours\n3️⃣ **Chat with me** — I\'m here 24/7!\n\n👉 Go to **Help & Support** in the sidebar to get started.',
                action: { type: 'navigate', path: '/support', label: 'Go to Support Center' }
            };
        }

        // 3. Check Payment / invoice / pricing / cost
        if (q.includes('price') || q.includes('cost') || q.includes('charge') || q.includes('payment') || q.includes('invoice') || q.includes('pay') || q.includes('amount') || q.includes('how much')) {
            return {
                reply: '💰 **Pricing & Payments**:\n\n• Base service charges start from ₹250–₹2,500 depending on the service\n• Any extra charges require your explicit approval before the Pillar proceeds\n• Invoices are auto-generated after service completion\n• Payments: UPI, Cash, or Card at doorstep\n\n📄 View past invoices in **My Requests** → Click any completed request → Invoice tab.',
                action: null
            };
        }

        // 4. Service-related queries with strict word-boundary matching for "ac" to avoid matching "track"/"package"
        if (q.includes('water') || q.includes('leak') || q.includes('plumb') || q.includes('pipe') || q.includes('tap') || q.includes('drainage')) {
            return {
                reply: language === 'ta'
                    ? '💧 நீர் கசிவு / பிளம்பிங் சிக்கலா? நான் உதவுகிறேன்!\n\n👉 "Find Services" → "Plumbing & Pipe Fixing" என்பதைத் தேர்ந்தெடுக்கவும்.\n\n🔧 சேவைகள்:\n• குழாய் கசிவு சரிசெய்தல் — ₹250 முதல்\n• டேப் மாற்றுதல் — ₹250 முதல்\n• டிரைனேஜ் அடைப்பு நீக்கம் — ₹400 முதல்\n\nஇப்போது முன்பதிவு செய்ய கீழே உள்ள "Book Plumbing Service" பொத்தானை அழுத்தவும்!'
                    : '💧 Water leakage / plumbing issue? I can help!\n\n👉 Go to **Find Services** → **Plumbing & Pipe Fixing**\n\n🔧 Available services:\n• Tap & Mixer Replacement — from ₹250\n• Water Leakage & Clog Removal — from ₹400\n• Motor & Pump Installation — from ₹600\n\nWould you like me to navigate you to the booking page?',
                action: { type: 'navigate', path: '/services', label: 'Book Plumbing Service' }
            };
        }

        if (q.includes('electric') || q.includes('fan') || q.includes('switch') || q.includes('wiring') || q.includes('mcb') || q.includes('inverter') || q.includes('short circuit')) {
            return {
                reply: '⚡ Electrical issue? Here\'s what we offer:\n\n🔧 **Electrical Repair** services:\n• Ceiling Fan & Switchboard Wiring — from ₹350\n• MCB Trip & Short Circuit Inspection — from ₹450\n• Inverter & Battery Setup — from ₹800\n\n👉 Go to **Find Services** → **Electrical Repair** to book instantly.\n\nYour nearest verified Pillar technician will be assigned within minutes!',
                action: { type: 'navigate', path: '/services', label: 'Book Electrical Service' }
            };
        }

        // Use regex test with word boundaries for \bac\b to avoid matching "track", "package"
        if (/\bac\b/.test(q) || q.includes('air condition') || q.includes('cooling') || q.includes('gas') || q.includes('compressor')) {
            return {
                reply: '❄️ AC trouble? We\'ve got you covered!\n\n🔧 **AC Repair & Service**:\n• AC Jet Cleaning & Filter Wash — from ₹600\n• AC Gas Leak Refill & Check — from ₹1,800\n• PCB Board & Compressor Service — from ₹2,500\n\n👉 Go to **Find Services** → **AC Repair & Service**\n\nAll our Pillar technicians are certified and background-verified!',
                action: { type: 'navigate', path: '/services', label: 'Book AC Service' }
            };
        }

        if (q.includes('paint') || q.includes('polish') || q.includes('wall') || q.includes('waterproof')) {
            return {
                reply: '🎨 Home painting or polish work?\n\n🔧 **House Painting & Polish**:\n• Single Room Wall Painting & Primer — from ₹2,400\n• Wood Furniture Polish — from ₹1,200\n• Exterior Waterproofing — from ₹3,500\n\n👉 Go to **Find Services** → **House Painting & Polish**',
                action: { type: 'navigate', path: '/services', label: 'Book Painting Service' }
            };
        }

        if (q.includes('washing machine') || q.includes('fridge') || q.includes('refrigerator') || q.includes('microwave') || q.includes('appliance') || q.includes('purifier')) {
            return {
                reply: '🧺 Appliance issue? We repair all major brands!\n\n🔧 **Appliance Repair**:\n• Washing Machine Drum & Motor — from ₹650\n• Refrigerator Gas & Thermostat — from ₹800\n• Microwave & Oven Repair — from ₹500\n• RO Water Purifier Service — from ₹350\n\n👉 Go to **Find Services** → **Appliance Repair**',
                action: { type: 'navigate', path: '/services', label: 'Book Appliance Repair' }
            };
        }

        // Greeting
        if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('good morning') || q.includes('good evening') || q.includes('vanakkam') || q.includes('namaste')) {
            return {
                reply: language === 'ta'
                    ? 'வணக்கம்! 🙏 நான் CoopBot, உங்கள் 24/7 AI உதவியாளர். வீட்டு சேவைகளை முன்பதிவு செய்ய, கோரிக்கைகளைக் கண்காணிக்க அல்லது ஏதேனும் உதவி பெற என்னிடம் கேளுங்கள்!'
                    : 'Hello! 👋 I\'m CoopBot, your 24/7 AI assistant. I can help you:\n\n• 🔍 Find & book home services\n• 📦 Track your service requests\n• 💬 Chat with your assigned Pillar\n• 🆘 Create support tickets\n\nWhat would you like to do today?',
                action: null
            };
        }

        // Thank you
        if (q.includes('thank') || q.includes('thanks') || q.includes('nandri') || q.includes('dhanyavad')) {
            return {
                reply: 'You\'re welcome! 😊 I\'m always here to help. If you need anything else, just ask!',
                action: null
            };
        }

        // Cancel
        if (q.includes('cancel') || q.includes('refund')) {
            return {
                reply: '❌ **Cancellation & Refund**:\n\n• You can cancel a pending request from **My Requests** → Click the request → Cancel\n• Cancellation before Pillar dispatch: Full refund\n• Cancellation after Pillar en route: ₹50 convenience fee may apply\n• Refunds are processed within 3-5 business days\n\nNeed help cancelling a specific request?',
                action: { type: 'navigate', path: '/requests', label: 'View My Requests' }
            };
        }

        // OTP / arrival
        if (q.includes('otp') || q.includes('arrival') || q.includes('verify') || q.includes('pin')) {
            return {
                reply: '🔐 **Arrival OTP Verification**:\n\nWhen your Pillar technician arrives at your doorstep, they will ask for a 6-digit OTP.\n\n📱 Find your OTP in:\n• **My Requests** → Click the active request → "Arrival OTP" section\n• Push notification on your phone\n\nThis ensures only verified Pillars can begin work at your location.',
                action: null
            };
        }

        // Fallback: no match
        return null;
    };

    const handleSend = async (e, directText = null) => {
        e?.preventDefault();
        const textToSend = (directText || input).trim();
        if (!textToSend || loading) return;

        setInput('');
        const userMsg = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: textToSend,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setLoading(true);

        try {
            // 1. Try local intent router first
            const localResult = routeCustomerIntent(textToSend);

            if (localResult) {
                const botReply = {
                    id: `bot-${Date.now()}`,
                    role: 'assistant',
                    content: localResult.reply,
                    action: localResult.action,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                // Simulate a brief "thinking" delay for natural feel
                await new Promise(r => setTimeout(r, 600));
                setMessages(prev => [...prev, botReply]);
                return;
            }

            // 2. Fallback to backend API for unrecognized queries
            const { data: { session } } = await supabase.auth.getSession();
            const currentContext = {
                currentModule: location.pathname.split('/')[1] || 'home',
                currentRequestId: params.id || null
            };

            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newHistory.map(m => ({ role: m.role, content: m.content })),
                    language,
                    catalogContext: contextData,
                    token: session?.access_token,
                    contextData: currentContext
                })
            });

            const data = await res.json();

            if (data.message || data.text) {
                const botReply = data.message || data.text;
                setMessages(prev => [
                    ...prev,
                    {
                        id: `bot-${Date.now()}`,
                        role: 'assistant',
                        content: botReply,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
            } else {
                throw new Error(data.error || 'Empty response');
            }
        } catch (err) {
            console.error('Chat error:', err);
            // Friendly fallback instead of error
            setMessages(prev => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    role: 'assistant',
                    content: language === 'ta'
                        ? 'நான் உங்களுக்கு உதவ இங்கே இருக்கிறேன்! நீங்கள் கேட்பதை வேறு வகையில் சொல்ல முடியுமா? அல்லது மேலே உள்ள விரைவு பொத்தான்களை முயற்சிக்கவும்.'
                        : 'I\'m here to help! Try asking about:\n• 🔍 "Find plumbing service"\n• 📦 "Track my request"\n• ⚡ "Book electrical repair"\n• 🆘 "Open support ticket"\n\nOr tap the quick action buttons above!',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Quick action chips for customer
    const quickChips = [
        { label: '🛠️ Find Services', query: 'What services are available in COOP HUB?' },
        { label: '📦 My Bookings', query: 'Can you check my active service requests?' },
        { label: '📍 Live Tracking', query: 'How do I track my assigned technician?' },
        { label: '❓ Customer Support', query: 'How can I create a support ticket?' }
    ];

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            <div className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-end">
                {/* ─── CHAT DRAWER MODAL ─── */}
                {isOpen && (
                    <div className="w-[340px] sm:w-[400px] bg-white shadow-2xl rounded-3xl border border-navy-100 flex flex-col overflow-hidden mb-4 animate-fade-in-up transition-all duration-200">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white p-4 flex justify-between items-center border-b border-navy-700/50">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center p-0.5 shadow-md">
                                    <img
                                        src="/assets/images/mascot-hero.png"
                                        alt="CoopBot"
                                        className="w-full h-full object-cover rounded-full"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                    <Bot size={20} className="text-white hidden" />
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold text-sm tracking-wide">CoopBot Assistant</span>
                                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                    </div>
                                    <p className="text-[11px] text-navy-300 font-medium">Customer AI Intelligence</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    window.speechSynthesis?.cancel();
                                    setSpeakingMsgId(null);
                                    setIsOpen(false);
                                }}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Quick Chips Bar */}
                        <div className="bg-navy-50/70 border-b border-navy-100 px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-none">
                            {quickChips.map((chip, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(null, chip.query)}
                                    className="whitespace-nowrap text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-navy-200/80 text-navy-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-xs shrink-0"
                                >
                                    {chip.label}
                                </button>
                            ))}
                        </div>

                        {/* Messages Feed */}
                        <div className="flex-1 p-4 overflow-y-auto max-h-[380px] min-h-[280px] space-y-3.5 bg-slate-50/50">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                            msg.role === 'user'
                                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-br-none shadow-md shadow-orange-500/15 font-medium'
                                                : 'bg-white border border-navy-100 text-navy-800 rounded-bl-none shadow-sm'
                                        }`}
                                    >
                                        <p className="whitespace-pre-line">{msg.content}</p>
                                        
                                        {msg.action && (
                                            <div className="mt-3 pt-2.5 border-t border-navy-100/50">
                                                <button
                                                    onClick={() => {
                                                        if (msg.action.type === 'navigate') {
                                                            setIsOpen(false); // close chat window
                                                            navigate(msg.action.path);
                                                        }
                                                    }}
                                                    className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded-xl shadow-sm hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] transition-all"
                                                >
                                                    <span>{msg.action.label}</span>
                                                    <ArrowRight size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer / TTS Action */}
                                    <div className="flex items-center space-x-2 mt-1 px-1">
                                        <span className="text-[10px] text-navy-400 font-medium">{msg.timestamp}</span>
                                        {msg.role === 'assistant' && (
                                            <button
                                                onClick={() => speakText(msg.content, msg.id)}
                                                className={`p-1 rounded-full transition-colors ${
                                                    speakingMsgId === msg.id
                                                        ? 'text-orange-500 bg-orange-50 animate-pulse'
                                                        : 'text-navy-400 hover:text-orange-500'
                                                }`}
                                                title={speakingMsgId === msg.id ? 'Stop Voice' : 'Read Aloud'}
                                            >
                                                {speakingMsgId === msg.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-navy-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center space-x-1.5">
                                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                        <div className="w-2 h-2 bg-navy-700 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                        <span className="text-xs text-navy-400 font-medium ml-2">CoopBot thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Box with STT Voice & Send */}
                        <div className="p-3 bg-white border-t border-navy-100">
                            <form onSubmit={handleSend} className="flex relative items-center bg-navy-50/70 rounded-full border border-navy-200 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={
                                        isListening
                                            ? 'Listening... Speak now...'
                                            : language === 'ta'
                                            ? 'சேவைகள் அல்லது கேள்விகளைக் கேட்கவும்...'
                                            : 'Ask about any service or booking...'
                                    }
                                    className="flex-1 bg-transparent py-2.5 pl-4 pr-20 text-sm text-navy-800 focus:outline-none placeholder:text-navy-400"
                                />

                                <div className="absolute right-1.5 flex items-center space-x-1">
                                    {/* Mic STT Button */}
                                    <button
                                        type="button"
                                        onClick={toggleListening}
                                        className={`p-2 rounded-full transition-all ${
                                            isListening
                                                ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                                                : 'text-navy-500 hover:text-orange-500 hover:bg-orange-50'
                                        }`}
                                        title={isListening ? 'Listening active...' : 'Speak via Microphone'}
                                    >
                                        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                                    </button>

                                    {/* Send Button */}
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || loading}
                                        className="p-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:shadow-orange-500/30 transition-all"
                                    >
                                        <Send size={15} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ─── FLOATING LAUNCHER PILL & MASCOT ─── */}
                {!isOpen && (
                    <div className="flex items-center space-x-3">
                        <div
                            onClick={() => setIsOpen(true)}
                            className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-xl shadow-navy-900/10 border border-navy-200/80 cursor-pointer flex items-center space-x-2 text-xs font-bold text-navy-800 hover:text-orange-600 hover:border-orange-400 transition-all hover:scale-105"
                        >
                            <Sparkles size={15} className="text-orange-500" />
                            <span>Ask CoopBot AI</span>
                        </div>

                        <button
                            onClick={() => setIsOpen(true)}
                            className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 via-orange-600 to-navy-900 p-0.5 shadow-2xl shadow-orange-500/30 hover:scale-110 active:scale-95 transition-all text-white border-2 border-white overflow-hidden flex items-center justify-center group"
                            title="Open Customer AI Assistant"
                        >
                            <img
                                src="/assets/images/mascot-hero.png"
                                alt="CoopBot"
                                className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                }}
                            />
                            <MessageSquare size={24} className="text-white hidden" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
