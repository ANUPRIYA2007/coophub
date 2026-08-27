import { useState, useRef, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';

export default function ChatAgent({ contextData }) {
    const { t, language } = useTranslation();
    const location = useLocation();
    const params = useParams();
    const [messages, setMessages] = useState([
        { role: 'assistant', content: t('home.mascot_default') }
    ]);
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);

    // native speech recognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    useEffect(() => {
        if (recognition) {
            recognition.continuous = false;
            recognition.lang = language === 'en' ? 'en-US' : (language === 'ta' ? 'ta-IN' : 'hi-IN');

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };

            recognition.onerror = () => setIsListening(false);
            recognition.onend = () => setIsListening(false);
        }
    }, [language, recognition]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleListening = () => {
        if (!recognition) return alert('Speech Recognition not supported in this browser.');
        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            recognition.start();
            setIsListening(true);
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

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const currentContext = {
                currentModule: location.pathname.split('/')[1] || 'home',
                currentRequestId: params.id || null
            };

            const res = await fetch('http://localhost:3000/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newHistory,
                    language,
                    catalogContext: contextData,
                    token: session?.access_token,
                    contextData: currentContext
                })
            });
            const data = await res.json();

            if (data.message) {
                setMessages([...newHistory, { role: 'assistant', content: data.message }]);
                // Optional TTS
                const utterance = new SpeechSynthesisUtterance(data.message);
                utterance.lang = language === 'ta' ? 'ta-IN' : 'en-US';
                window.speechSynthesis.speak(utterance);
            }
        } catch (err) {
            setMessages([...newHistory, { role: 'assistant', content: 'Connection error. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            <div className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-end">
                {isOpen && (
                    <div className="w-80 sm:w-96 bg-surface shadow-2xl rounded-2xl border border-navy-100 flex flex-col overflow-hidden mb-4 animate-fade-in-up">
                        {/* Header */}
                        <div className="bg-navy-900 text-white p-4 py-3 flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center p-1">
                                    <img src="/src/assets/branding/mascot-ai.jpg" alt="Mascot" className="w-full h-full object-cover rounded-full" />
                                </div>
                                <span className="font-semibold text-sm">{t('ai_assistant.title')}</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-4 overflow-y-auto max-h-96 min-h-[300px] space-y-4 bg-surface/50">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-orange-500 text-white rounded-br-none' : 'bg-white border border-navy-100 text-navy-800 rounded-bl-none shadow-sm'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-navy-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex space-x-1">
                                        <div className="w-2 h-2 bg-navy-300 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-navy-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-navy-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Form */}
                        <div className="p-3 bg-white border-t border-navy-100">
                            <form onSubmit={handleSend} className="flex relative items-center bg-gray-50 rounded-full border border-gray-200">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={isListening ? t('ai_assistant.recording') : t('ai_assistant.input_placeholder')}
                                    className="flex-1 bg-transparent py-2.5 pl-4 pr-20 text-sm focus:outline-none"
                                />

                                <div className="absolute right-1 flex items-center space-x-1">
                                    <button
                                        type="button"
                                        onClick={toggleListening}
                                        className={`p-1.5 rounded-full transition-colors ${isListening ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-orange-500'}`}
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H6v1h8v-1h-3v-2.07z" clipRule="evenodd" />
                                        </svg>
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={!input.trim() || loading}
                                        className="p-1.5 rounded-full bg-navy-500 text-white disabled:opacity-50 hover:bg-navy-600 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-14 h-14 bg-navy-900 rounded-full shadow-2xl shadow-navy-900/40 flex items-center justify-center hover:bg-navy-800 hover:-translate-y-1 transition-all text-white border-2 border-white/10"
                    >
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </button>
                )}

            </div>
        </div>
    );
}
