import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { translateDynamic } from '../../i18n/centralEngine.js';
import { getLanguageMetadata } from '../../i18n/languages.js';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { aiService } from '../../services/pillar/aiService';
import { Send, Mic, MicOff, X, Sparkles, MessageSquare, Bot, Volume2, VolumeX, ArrowRight, ShieldCheck, Zap, Paperclip, Check, User, FileText } from 'lucide-react';

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
    const [attachment, setAttachment] = useState(null);
    const [isInputFocused, setIsInputFocused] = useState(false);

    const { user, profile } = useAuth();
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const fileInputRef = useRef(null);

    // Dynamic user identity from existing auth session (zero fake data)
    const userAvatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
    const userDisplayName = profile?.full_name || profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
    const userInitial = userDisplayName ? userDisplayName.charAt(0).toUpperCase() : null;

    // Listen for custom event to open customer chat (from hero bubble or other triggers)
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-customer-chat', handleOpen);
        window.addEventListener('open-chat-agent', handleOpen);
        window.addEventListener('open-coopbot-chat', handleOpen);
        return () => {
            window.removeEventListener('open-customer-chat', handleOpen);
            window.removeEventListener('open-chat-agent', handleOpen);
            window.removeEventListener('open-coopbot-chat', handleOpen);
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

    // Intelligent auto-scroll: smoothly scroll only when near bottom, preserving user reading position if scrolled up
    const scrollToBottomIfNeeded = () => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 140;
        if (isNearBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottomIfNeeded();
        }
    }, [messages, loading, isOpen]);

    // Attachment handlers (Restores existing attachment UI control without modifying backend)
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAttachment({
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            file: file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        });
        e.target.value = '';
    };

    const handleRemoveAttachment = () => {
        if (attachment?.preview) {
            URL.revokeObjectURL(attachment.preview);
        }
        setAttachment(null);
    };

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

        try {
            window.speechSynthesis.speak(utterance);
        } catch (err) {
            console.warn("Speech synthesis error:", err.message);
            setSpeakingMsgId(null);
        }
    };

    // Speech-To-Text (Voice input)
    const toggleListening = () => {
        if (typeof window === 'undefined') return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Voice speech recognition is not supported in this browser.');
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
                const transcript = event.results?.[0]?.[0]?.transcript;
                if (transcript) {
                    setInput(transcript);
                }
            };

            recognition.start();
        } catch (err) {
            console.warn('STT error:', err);
            setIsListening(false);
        }
    };

    const handleSend = async (e, directText = null) => {
        e?.preventDefault();
        const textToSend = (directText || input).trim();
        if ((!textToSend && !attachment) || loading) return;

        const currentAttachment = attachment;
        const attachedMeta = currentAttachment ? `\n[Attached File: ${currentAttachment.name} (${currentAttachment.size})]` : '';
        const combinedText = (textToSend || `Shared file: ${currentAttachment?.name}`) + attachedMeta;

        setInput('');
        setAttachment(null);
        setIsInputFocused(false);

        const userMsg = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: combinedText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setLoading(true);

        try {
            // All messages go directly to the real AI pipeline (NVIDIA NIM / Gemini)
            const { data: { session } } = await supabase.auth.getSession();
            const currentContext = {
                route: location.pathname,
                module: location.pathname.split('/')[1] || 'home',
                currentRequestId: params.id || null,
                language,
                session,
                catalogContext: contextData
            };

            const response = await aiService.chatWithMascot({
                message: combinedText,
                context: currentContext
            });

            if (response && response.reply) {
                let action = response.action || null;
                if (!action && response.route && response.route !== location.pathname) {
                    action = {
                        type: 'navigate',
                        path: response.route,
                        label: `Go to ${response.route.replace('/', '').replace('dashboard/', '') || 'Page'} →`
                    };
                }
                setMessages(prev => [
                    ...prev,
                    {
                        id: `bot-${Date.now()}`,
                        role: 'assistant',
                        content: response.reply,
                        action: action,
                        yesNoAction: response.yesNoAction || null,
                        provider: response.provider || 'CoopBot AI',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
                return;
            } else {
                throw new Error('No reply from AI service');
            }
        } catch (err) {
            console.error('Chat error:', err);
            const baseErrMsg = "⚠️ AI service could not process your request right now. Please try again shortly. If this persists, visit Help & Support for assistance.";
            const errMsg = language !== 'en' ? await translateDynamic(baseErrMsg, language, 'en') : baseErrMsg;
            setMessages(prev => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    role: 'assistant',
                    content: errMsg,
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

    // Do not render floating ChatAgent on Admin or Dashboard routes to prevent overlapping with MascotFloating
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/pillar')) {
        return null;
    }

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            <div className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-end">
                {/* ─── CHAT MODAL ─── */}
                {isOpen && (
                    <div 
                        role="dialog"
                        aria-label="CoopBot AI Assistant"
                        className="coopbot-window-enter mb-4 flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl transition-all duration-200 w-[390px] max-w-[calc(100vw-32px)] h-[560px] max-h-[calc(100vh-96px)]"
                        style={{
                            boxShadow: "0 25px 50px -12px rgba(5, 10, 18, 0.45)"
                        }}
                    >
                        {/* ─── CHAT HEADER ─── */}
                        <div 
                            style={{
                                background: "linear-gradient(135deg, #050A12 0%, #162238 100%)",
                                borderBottom: "1px solid rgba(255, 121, 0, 0.25)"
                            }}
                            className="flex items-center justify-between px-4 py-3.5 text-white flex-shrink-0"
                        >
                            <div className="flex items-center space-x-3">
                                <div 
                                    style={{
                                        width: "38px", 
                                        height: "38px", 
                                        borderRadius: "50%",
                                        background: "linear-gradient(135deg, #FF7900 0%, #E66A00 100%)",
                                        padding: "2px", 
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center",
                                        boxShadow: "0 4px 12px rgba(255, 121, 0, 0.35)"
                                    }}
                                    className="flex-shrink-0"
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
                                        <span className="font-bold text-sm text-white tracking-wide">CoopBot Assistant</span>
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Online" />
                                    </div>
                                    <p className="text-[11px] text-slate-300 font-medium leading-tight">COOP HUB 24/7 AI Guide</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        window.speechSynthesis?.cancel();
                                        setSpeakingMsgId(null);
                                        setIsOpen(false);
                                    }}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all"
                                    aria-label="Close chat"
                                    title="Close chat"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* ─── QUICK CHIPS BAR ─── */}
                        <div 
                            style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}
                            className="px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0"
                        >
                            {quickChips.map((chip, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSend(null, chip.query)}
                                    style={{
                                        fontSize: "11.5px",
                                        fontWeight: "700",
                                        padding: "4px 12px",
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

                        {/* ─── MESSAGES FEED ─── */}
                        <div 
                            ref={scrollContainerRef}
                            className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 bg-slate-50/70"
                        >
                            {messages.map((msg) => {
                                const isUser = msg.role === 'user';
                                return (
                                    <div
                                        key={msg.id}
                                        className={`coopbot-msg-in flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {/* Assistant Message Profile / Avatar */}
                                        {!isUser && (
                                            <div 
                                                className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden flex items-center justify-center border border-orange-500/30 bg-navy-900 shadow-sm mb-1"
                                                style={{ background: "linear-gradient(135deg, #050A12 0%, #162238 100%)" }}
                                                title="CoopBot"
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
                                                <Bot size={15} className="text-orange-400 hidden" />
                                            </div>
                                        )}

                                        {/* Message Bubble + Action & Timestamp */}
                                        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[82%]`}>
                                            <div
                                                style={{
                                                    borderRadius: "18px",
                                                    padding: "10px 14px",
                                                    fontSize: "13px",
                                                    lineHeight: "1.5",
                                                    background: isUser ? "linear-gradient(135deg, #FF7900 0%, #E66A00 100%)" : "#FFFFFF",
                                                    color: isUser ? "#FFFFFF" : "#0B1220",
                                                    border: isUser ? "none" : "1px solid #E2E8F0",
                                                    borderBottomRightRadius: isUser ? "4px" : "18px",
                                                    borderBottomLeftRadius: isUser ? "18px" : "4px",
                                                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                                                }}
                                            >
                                                <p className="whitespace-pre-line m-0 font-medium select-text">{msg.content}</p>
                                                
                                                {/* Actionable YES / NO Buttons */}
                                                {msg.yesNoAction && (
                                                    <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (msg.yesNoAction.yes?.path) {
                                                                    setIsOpen(false);
                                                                    navigate(msg.yesNoAction.yes.path);
                                                                }
                                                            }}
                                                            style={{
                                                                flex: 1,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                gap: "6px",
                                                                background: "linear-gradient(135deg, #FF7900 0%, #E66A00 100%)",
                                                                color: "white",
                                                                padding: "8px 12px",
                                                                fontSize: "12px",
                                                                fontWeight: "800",
                                                                borderRadius: "10px",
                                                                border: "none",
                                                                cursor: "pointer",
                                                                boxShadow: "0 2px 6px rgba(255, 121, 0, 0.3)"
                                                            }}
                                                            className="hover:brightness-105 active:scale-98 transition-all"
                                                        >
                                                            <span>{msg.yesNoAction.yes.label}</span>
                                                            <ArrowRight size={13} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, yesNoAction: null } : m));
                                                            }}
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                background: "#F1F5F9",
                                                                color: "#64748B",
                                                                padding: "8px 12px",
                                                                fontSize: "12px",
                                                                fontWeight: "600",
                                                                borderRadius: "10px",
                                                                border: "1px solid #CBD5E1",
                                                                cursor: "pointer"
                                                            }}
                                                            className="hover:bg-slate-200 transition-colors"
                                                        >
                                                            <span>{msg.yesNoAction.no.label}</span>
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Single Action Button (if no Yes/No choice) */}
                                                {msg.action && !msg.yesNoAction && (
                                                    <div className="mt-2.5 pt-2 border-t border-slate-200">
                                                        <button
                                                            type="button"
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
                                                                padding: "7px 12px",
                                                                fontSize: "12px",
                                                                fontWeight: "800",
                                                                borderRadius: "10px",
                                                                border: "none",
                                                                cursor: "pointer"
                                                            }}
                                                            className="hover:brightness-105 active:scale-98 transition-all"
                                                        >
                                                            <span>{msg.action.label}</span>
                                                            <ArrowRight size={13} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Footer / TTS Action / Tick Indicator */}
                                            <div className="flex items-center space-x-1.5 mt-1 px-1">
                                                <span className="text-[10px] text-slate-400 font-medium">{msg.timestamp}</span>

                                                {/* User Real Message Tick (subtle check near timestamp) */}
                                                {isUser && (
                                                    <Check size={11} className="text-orange-500/80 stroke-[2.5]" aria-label="Sent" />
                                                )}

                                                {/* Assistant Voice Reader (TTS) */}
                                                {!isUser && (
                                                    <button
                                                        type="button"
                                                        onClick={() => speakText(msg.content, msg.id)}
                                                        className={`p-1 rounded-full transition-colors ${
                                                            speakingMsgId === msg.id
                                                                ? 'text-orange-500 bg-orange-50 animate-pulse'
                                                                : 'text-slate-400 hover:text-orange-500'
                                                        }`}
                                                        title={speakingMsgId === msg.id ? 'Stop Voice' : 'Read Aloud'}
                                                        aria-label={speakingMsgId === msg.id ? 'Stop voice readout' : 'Read message aloud'}
                                                    >
                                                        {speakingMsgId === msg.id ? <VolumeX size={12} /> : <Volume2 size={12} />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* User Message Profile / Avatar */}
                                        {isUser && (
                                            <div 
                                                className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden flex items-center justify-center border border-slate-300 shadow-sm mb-1"
                                                style={{ background: "linear-gradient(135deg, #162238 0%, #050A12 100%)" }}
                                                title={userDisplayName || "User"}
                                            >
                                                {userAvatarUrl ? (
                                                    <img
                                                        src={userAvatarUrl}
                                                        alt={userDisplayName || "User"}
                                                        className="w-full h-full object-cover rounded-full"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <span className={`text-white font-bold text-xs ${userAvatarUrl ? 'hidden' : 'flex'}`}>
                                                    {userInitial ? userInitial : <User size={13} className="text-slate-200" />}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* AI Thinking Animation (Visible only when real AI is processing) */}
                            {loading && (
                                <div className="coopbot-msg-in flex items-end gap-2 justify-start">
                                    <div 
                                        className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden flex items-center justify-center border border-orange-500/30 bg-navy-900 shadow-sm mb-1"
                                        style={{ background: "linear-gradient(135deg, #050A12 0%, #162238 100%)" }}
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
                                        <Bot size={15} className="text-orange-400 hidden" />
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-orange-500 coopbot-dot-1" />
                                        <span className="w-2 h-2 rounded-full bg-orange-400 coopbot-dot-2" />
                                        <span className="w-2 h-2 rounded-full bg-navy-800 coopbot-dot-3" />
                                        <span className="text-xs text-slate-400 font-medium ml-1.5">CoopBot is thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* ─── ATTACHMENT PREVIEW PILL ─── */}
                        {attachment && (
                            <div className="px-3 py-1.5 bg-orange-50/80 border-t border-orange-200 flex items-center justify-between text-xs text-slate-700">
                                <div className="flex items-center space-x-2 truncate">
                                    {attachment.preview ? (
                                        <img src={attachment.preview} alt="Attachment" className="w-6 h-6 object-cover rounded border border-orange-300 flex-shrink-0" />
                                    ) : (
                                        <FileText size={15} className="text-orange-600 flex-shrink-0" />
                                    )}
                                    <span className="font-semibold truncate max-w-[200px]">{attachment.name}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">({attachment.size})</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveAttachment}
                                    className="p-1 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                                    aria-label="Remove attached file"
                                    title="Remove file"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {/* ─── COMPOSER LAYOUT ─── */}
                        {/* Structure: [ ATTACHMENT ] [ ASK ME ANYTHING... ] [ MICROPHONE ] [ SEND ] */}
                        <div 
                            className={`p-2.5 sm:p-3 bg-white border-t border-slate-200 flex-shrink-0 transition-all duration-200 ease-out ${
                                isInputFocused ? 'bg-slate-50/60' : ''
                            }`}
                        >
                            <form 
                                onSubmit={handleSend} 
                                className={`flex items-center gap-1.5 bg-slate-50 rounded-2xl border transition-all duration-200 ease-out px-2 ${
                                    isInputFocused 
                                        ? 'border-orange-500 ring-2 ring-orange-500/20 bg-white py-1.5 shadow-sm' 
                                        : 'border-slate-300 py-1'
                                }`}
                            >
                                {/* LEFT SIDE: Restored Attachment Control */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 active:scale-95 rounded-full transition-colors flex-shrink-0"
                                    title="Attach image or document"
                                    aria-label="Attach file or image"
                                >
                                    <Paperclip size={17} />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />

                                {/* MIDDLE: Chat Input Field (expands smoothly on focus) */}
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onFocus={() => setIsInputFocused(true)}
                                    onBlur={() => setIsInputFocused(false)}
                                    placeholder={
                                        isListening
                                            ? 'Listening... Speak now...'
                                            : t('ask_anything', 'Ask me anything...')
                                    }
                                    className="flex-1 bg-transparent py-2 px-1 text-sm text-slate-800 focus:outline-none placeholder:text-slate-400 min-w-0"
                                    aria-label="Message CoopBot"
                                />

                                {/* Waveform Indicator during real STT listening */}
                                {isListening && (
                                    <div className="flex items-center gap-0.5 px-1 flex-shrink-0" aria-hidden="true" title="Listening to voice input">
                                        <span className="w-0.5 bg-red-500 rounded-full coopbot-wave-1" />
                                        <span className="w-0.5 bg-red-500 rounded-full coopbot-wave-2" />
                                        <span className="w-0.5 bg-red-500 rounded-full coopbot-wave-3" />
                                        <span className="w-0.5 bg-red-500 rounded-full coopbot-wave-4" />
                                    </div>
                                )}

                                {/* RIGHT SIDE: Microphone Control with dynamic STT listening pulse */}
                                <div className="relative flex items-center justify-center flex-shrink-0">
                                    {isListening && <div className="coopbot-mic-ring" />}
                                    <button
                                        type="button"
                                        onClick={toggleListening}
                                        className={`p-2 rounded-full transition-all duration-200 relative z-10 ${
                                            isListening
                                                ? 'bg-red-500 text-white shadow-md shadow-red-500/30 scale-105'
                                                : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50'
                                        }`}
                                        title={isListening ? 'Listening active... Click to stop' : 'Speak via Microphone'}
                                        aria-label={isListening ? 'Stop voice recording' : 'Speak via Microphone'}
                                    >
                                        {isListening ? <MicOff size={16} /> : <Mic size={17} />}
                                    </button>
                                </div>

                                {/* RIGHT SIDE: Send Button */}
                                <button
                                    type="submit"
                                    disabled={(!input.trim() && !attachment) || loading}
                                    style={{ background: "#FF7900" }}
                                    className="p-2 rounded-full text-white disabled:opacity-35 disabled:cursor-not-allowed hover:brightness-105 active:scale-95 transition-all flex-shrink-0 shadow-sm"
                                    title="Send message"
                                    aria-label="Send message"
                                >
                                    <Send size={15} />
                                </button>
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
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsOpen(true); }}
                            aria-label="Open CoopBot AI Assistant"
                        >
                            <Sparkles size={15} color="#FF7900" />
                            <span>{t("Ask CoopBot AI")}</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsOpen(true)}
                            style={{
                                background: "linear-gradient(135deg, #FF7900 0%, #050A12 100%)",
                                border: "2px solid white",
                                boxShadow: "0 8px 24px rgba(255, 121, 0, 0.35)"
                            }}
                            className="w-14 h-14 rounded-full p-0.5 hover:scale-110 active:scale-95 transition-all text-white overflow-hidden flex items-center justify-center group"
                            title="Open AI Assistant"
                            aria-label="Open AI Assistant"
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
