import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';
import { Send, Mic, MicOff, X, Sparkles, MessageSquare, Bot, Volume2, VolumeX, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

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
        window.addEventListener('open-chat-agent', handleOpen);
        return () => {
            window.removeEventListener('open-customer-chat', handleOpen);
            window.removeEventListener('open-chat-agent', handleOpen);
        };
    }, []);

    // Initial greeting based on language
    useEffect(() => {
        const greetings = {
            ta: 'வணக்கம்! நான் உங்கள் CoopBot AI உதவியாளர். சேவைகளை முன்பதிவு செய்ய, பில்லர் சரிபார்ப்பு அல்லது உங்கள் கோரிக்கைகளைக் கண்காணிக்க என்னிடம் கேட்கலாம்.',
            hi: 'नमस्ते! मैं आपका CoopBot AI सहायक हूँ। सेवाएं बुक करने, पिलर सत्यापन या अनुरोध ट्रैक करने के लिए मुझसे पूछें।',
            te: 'నమస్కారం! నేను మీ CoopBot AI సహాయకుడిని. సేవలను బుక్ చేయడానికి లేదా మీ అభ్యర్థనలను ట్రాక్ చేయడానికి నన్ను అడగండి.',
            kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ CoopBot AI ಸಹಾಯಕ. ಸೇವೆಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲು ಅಥವಾ ನಿಮ್ಮ ವಿನಂತಿಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ನನ್ನನ್ನು ಕೇಳಿ.',
            en: 'Hello! I am CoopBot, your 24/7 AI Assistant. Ask me about booking verified home services, tracking requests, pricing, or technician verification.'
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
        const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`_]/g, ''));
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

    // ────── LOCAL CUSTOMER & PILLAR INTENT ROUTER ──────
    const routeCustomerIntent = (text) => {
        const q = text.toLowerCase();

        // 1. Pillar Verification & Onboarding inquiries
        if (q.includes('become a pillar') || q.includes('join as technician') || q.includes('pillar registration') || q.includes('pillar verify') || q.includes('verification process')) {
            return {
                reply: '🏛️ **How to Become a Verified COOP HUB Pillar**:\n\n1️⃣ **Register Online** at `/pillar/register`\n2️⃣ **Select Your Trade Skills** (Electrician, Plumber, AC Repair, etc.)\n3️⃣ **Step 3 KYC Verification**: Upload your Aadhaar, PAN, Voter ID, or Driving Licence\n4️⃣ **PaddleOCR Inspection & Admin Approval**: Once verified, you will receive your Unique Pillar ID (`PIL-CHE-XXX`) via official email\n\nWould you like to open the Pillar Registration portal?',
                action: { type: 'navigate', path: '/pillar/register', label: 'Go to Pillar Registration' }
            };
        }

        // 2. Check Track / status / request
        if (q.includes('track') || q.includes('status') || q.includes('request') || q.includes('order') || q.includes('where') || q.includes('eta') || q.includes('pillar coming')) {
            return {
                reply: '📦 **Track Your Service Request**:\n\n1️⃣ Go to **My Requests** in your navigation\n2️⃣ Select your active booking\n3️⃣ View live technician dispatch status, ETA, and arrival OTP\n\nWould you like me to take you to your active requests?',
                action: { type: 'navigate', path: '/requests', label: 'View My Requests' }
            };
        }

        // 3. Check Support / help / ticket
        if (q.includes('support') || q.includes('help') || q.includes('ticket') || q.includes('complaint') || q.includes('issue') || q.includes('problem with service')) {
            return {
                reply: '🆘 **COOP HUB Support Center**:\n\n• **24/7 Helpline**: Dedicated customer assistance\n• **Open a Support Ticket**: Guaranteed resolution within 2 hours\n• **Dispute Resolution**: Direct cooperative mediation for quality assurance\n\nGo to **Help & Support** in the menu to submit a ticket.',
                action: { type: 'navigate', path: '/support', label: 'Go to Support Center' }
            };
        }

        // 4. Check Payment / pricing / cost
        if (q.includes('price') || q.includes('cost') || q.includes('charge') || q.includes('payment') || q.includes('invoice') || q.includes('pay') || q.includes('how much')) {
            return {
                reply: '💰 **Cooperative Pricing & Standard Rates**:\n\n• **Transparent Base Rates**: Starting from ₹250–₹2,500 based on standard trade rate cards\n• **Zero Hidden Fees**: All extra materials require your explicit OTP/in-app approval\n• **Safe Payment Options**: UPI, Doorstep Cash, or Card post-completion\n• **Official GST Invoices**: Auto-generated in your dashboard.',
                action: null
            };
        }

        // 5. Plumbing
        if (q.includes('water') || q.includes('leak') || q.includes('plumb') || q.includes('pipe') || q.includes('tap') || q.includes('drainage')) {
            return {
                reply: language === 'ta'
                    ? '💧 நீர் கசிவு / பிளம்பிங் சிக்கலா? நான் உதவுகிறேன்!\n\n👉 "Find Services" → "Plumbing & Pipe Fixing" என்பதைத் தேர்ந்தெடுக்கவும்.\n\n🔧 சேவைகள்:\n• குழாய் கசிவு சரிசெய்தல் — ₹250 முதல்\n• டேப் மாற்றுதல் — ₹250 முதல்\n• மோட்டார் பழுது — ₹600 முதல்\n\nமுன்பதிவு செய்ய கீழே உள்ள பொத்தானை அழுத்தவும்!'
                    : '💧 **Plumbing & Pipe Repair**:\n\n• Tap & Mixer Replacement — from ₹250\n• Water Leakage & Clog Removal — from ₹400\n• Motor & Pump Installation — from ₹600\n\nAll technicians are background-verified and certified.',
                action: { type: 'navigate', path: '/services', label: 'Book Plumbing Service' }
            };
        }

        // 6. Electrical
        if (q.includes('electric') || q.includes('fan') || q.includes('switch') || q.includes('wiring') || q.includes('mcb') || q.includes('inverter') || q.includes('short circuit')) {
            return {
                reply: '⚡ **Electrical Repair & Maintenance**:\n\n• Ceiling Fan & Switchboard Wiring — from ₹350\n• MCB Tripping & Short Circuit Inspection — from ₹450\n• Inverter & Battery Wiring — from ₹800\n\nNearest verified electrician will be assigned upon booking.',
                action: { type: 'navigate', path: '/services', label: 'Book Electrical Service' }
            };
        }

        // 7. AC Repair
        if (/\bac\b/.test(q) || q.includes('air condition') || q.includes('cooling') || q.includes('gas') || q.includes('compressor')) {
            return {
                reply: '❄️ **AC Repair & Deep Cleaning**:\n\n• Jet Pump Cleaning & Filter Wash — from ₹600\n• Gas Leak Check & Refill — from ₹1,800\n• Compressor & PCB Diagnostics — from ₹2,500\n\nIncludes 30-day cooperative service warranty.',
                action: { type: 'navigate', path: '/services', label: 'Book AC Service' }
            };
        }

        // 8. Greetings
        if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('vanakkam') || q.includes('namaste')) {
            return {
                reply: language === 'ta'
                    ? 'வணக்கம்! 🙏 நான் CoopBot, உங்கள் 24/7 AI உதவியாளர். வீட்டு சேவைகளை முன்பதிவு செய்ய அல்லது சந்தேகங்களுக்கு உதவ நான் தயாராக உள்ளேன்!'
                    : 'Hello! 👋 I am CoopBot, your COOP HUB AI Guide. I can help you find verified technicians, track requests, calculate pricing, or guide Pillar verification.',
                action: null
            };
        }

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
                await new Promise(r => setTimeout(r, 500));
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
            setMessages(prev => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    role: 'assistant',
                    content: language === 'ta'
                        ? 'நான் உங்களுக்கு உதவ இங்கே இருக்கிறேன்! நீங்கள் கேட்கும் கேள்வியை வேறு விதமாக கூற முடியுமா? அல்லது மேலே உள்ள விரைவு பொத்தான்களைப் பயன்படுத்தவும்.'
                        : 'I\'m here to help! You can ask about:\n• ⚡ "Book Electrical Service"\n• 💧 "Fix plumbing leak"\n• 📦 "Track my request"\n• 🏛️ "How to become a Pillar technician"\n\nOr click one of the quick options above!',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Quick action chips
    const quickChips = [
        { label: '⚡ Electrician', query: 'I need to book an electrician' },
        { label: '💧 Plumbing', query: 'I need plumbing repair service' },
        { label: '📦 Track Request', query: 'How do I track my active booking?' },
        { label: '🏛️ Become a Pillar', query: 'How to become a verified Pillar technician?' }
    ];

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            <div className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-end">
                {/* ─── CHAT MODAL ─── */}
                {isOpen && (
                    <div 
                        style={{
                            width: "360px",
                            maxWidth: "calc(100vw - 32px)",
                            background: "#FFFFFF",
                            boxShadow: "0 25px 50px -12px rgba(5, 10, 18, 0.45)",
                            borderRadius: "24px",
                            border: "1px solid rgba(22, 34, 56, 0.15)",
                            overflow: "hidden",
                            marginBottom: "16px",
                            display: "flex",
                            flexDirection: "column"
                        }}
                        className="animate-fade-in-up transition-all duration-200"
                    >
                        {/* Header styled with Deep Navy #050A12 & Orange Highlights */}
                        <div 
                            style={{
                                background: "linear-gradient(135deg, #050A12 0%, #162238 100%)",
                                color: "white",
                                padding: "16px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderBottom: "1px solid rgba(255, 121, 0, 0.2)"
                            }}
                        >
                            <div className="flex items-center space-x-3">
                                <div 
                                    style={{
                                        width: "40px", height: "40px", borderRadius: "50%",
                                        background: "linear-gradient(135deg, #FF7900 0%, #E66A00 100%)",
                                        padding: "2px", display: "flex", alignItems: "center", justifyContent: "center",
                                        boxShadow: "0 4px 12px rgba(255, 121, 0, 0.3)"
                                    }}
                                >
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
                                        <span className="font-bold text-sm text-white">CoopBot Assistant</span>
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    </div>
                                    <p className="text-[11px] text-slate-300 font-medium">COOP HUB 24/7 AI Guide</p>
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
                        <div 
                            style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}
                            className="px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-none"
                        >
                            {quickChips.map((chip, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(null, chip.query)}
                                    style={{
                                        fontSize: "11.5px",
                                        fontWeight: "700",
                                        padding: "5px 12px",
                                        borderRadius: "9999px",
                                        background: "white",
                                        border: "1px solid #CBD5E1",
                                        color: "#0F172A",
                                        whiteSpace: "nowrap",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "#FF7900";
                                        e.currentTarget.style.color = "#FFFFFF";
                                        e.currentTarget.style.borderColor = "#FF7900";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "white";
                                        e.currentTarget.style.color = "#0F172A";
                                        e.currentTarget.style.borderColor = "#CBD5E1";
                                    }}
                                >
                                    {chip.label}
                                </button>
                            ))}
                        </div>

                        {/* Messages Feed */}
                        <div className="flex-1 p-4 overflow-y-auto max-h-[380px] min-h-[280px] space-y-3.5 bg-slate-50/60">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div
                                        style={{
                                            maxWidth: "85%",
                                            borderRadius: "16px",
                                            padding: "10px 14px",
                                            fontSize: "13px",
                                            lineHeight: "1.5",
                                            background: msg.role === 'user' ? "linear-gradient(135deg, #FF7900 0%, #E66A00 100%)" : "#FFFFFF",
                                            color: msg.role === 'user' ? "#FFFFFF" : "#0B1220",
                                            border: msg.role === 'user' ? "none" : "1px solid #E2E8F0",
                                            borderBottomRightRadius: msg.role === 'user' ? "4px" : "16px",
                                            borderBottomLeftRadius: msg.role === 'user' ? "16px" : "4px",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                                        }}
                                    >
                                        <p className="whitespace-pre-line m-0 font-medium">{msg.content}</p>
                                        
                                        {msg.action && (
                                            <div className="mt-3 pt-2 border-t border-slate-200">
                                                <button
                                                    onClick={() => {
                                                        if (msg.action.type === 'navigate') {
                                                            setIsOpen(false);
                                                            navigate(msg.action.path);
                                                        }
                                                    }}
                                                    style={{
                                                        width: "100%",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "6px",
                                                        background: "#FF7900",
                                                        color: "white",
                                                        padding: "8px 12px",
                                                        fontSize: "12px",
                                                        fontWeight: "800",
                                                        borderRadius: "10px",
                                                        border: "none",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    <span>{msg.action.label}</span>
                                                    <ArrowRight size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer / TTS Action */}
                                    <div className="flex items-center space-x-2 mt-1 px-1">
                                        <span className="text-[10px] text-slate-400 font-medium">{msg.timestamp}</span>
                                        {msg.role === 'assistant' && (
                                            <button
                                                onClick={() => speakText(msg.content, msg.id)}
                                                className={`p-1 rounded-full transition-colors ${
                                                    speakingMsgId === msg.id
                                                        ? 'text-orange-500 bg-orange-50 animate-pulse'
                                                        : 'text-slate-400 hover:text-orange-500'
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
                                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                                        <div className="w-2 h-2 bg-navy-800 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                                        <span className="text-xs text-slate-500 font-medium ml-2">CoopBot thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Box */}
                        <div className="p-3 bg-white border-t border-slate-200">
                            <form onSubmit={handleSend} className="flex relative items-center bg-slate-50 rounded-full border border-slate-300 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={
                                        isListening
                                            ? 'Listening... Speak now...'
                                            : language === 'ta'
                                            ? 'சேவைகள் அல்லது கேள்விகளைக் கேட்கவும்...'
                                            : 'Ask about any service, tracking, or pricing...'
                                    }
                                    className="flex-1 bg-transparent py-2.5 pl-4 pr-20 text-sm text-slate-800 focus:outline-none placeholder:text-slate-400"
                                />

                                <div className="absolute right-1.5 flex items-center space-x-1">
                                    {/* Mic STT Button */}
                                    <button
                                        type="button"
                                        onClick={toggleListening}
                                        className={`p-2 rounded-full transition-all ${
                                            isListening
                                                ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                                                : 'text-slate-500 hover:text-orange-500 hover:bg-orange-50'
                                        }`}
                                        title={isListening ? 'Listening active...' : 'Speak via Microphone'}
                                    >
                                        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                                    </button>

                                    {/* Send Button */}
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || loading}
                                        style={{ background: "#FF7900" }}
                                        className="p-2 rounded-full text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:shadow-orange-500/30 transition-all"
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
                            style={{ background: "rgba(255, 255, 255, 0.95)", border: "1px solid rgba(22, 34, 56, 0.15)" }}
                            className="backdrop-blur-md px-4 py-2 rounded-full shadow-xl cursor-pointer flex items-center space-x-2 text-xs font-bold text-slate-800 hover:text-orange-600 hover:border-orange-400 transition-all hover:scale-105"
                        >
                            <Sparkles size={15} color="#FF7900" />
                            <span>Ask CoopBot AI</span>
                        </div>

                        <button
                            onClick={() => setIsOpen(true)}
                            style={{
                                background: "linear-gradient(135deg, #FF7900 0%, #050A12 100%)",
                                border: "2px solid white",
                                boxShadow: "0 8px 24px rgba(255, 121, 0, 0.35)"
                            }}
                            className="w-14 h-14 rounded-full p-0.5 hover:scale-110 active:scale-95 transition-all text-white overflow-hidden flex items-center justify-center group"
                            title="Open AI Assistant"
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
