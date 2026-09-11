import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { serviceRequestService } from '../../services/customer/serviceRequestService';
import { jobCommunicationService, subscribeToMessages } from '../../services/communication/jobCommunicationService';
import { useTranslation } from '../../hooks/useTranslation';
import { ArrowLeft, Send, Phone, ShieldCheck, CheckCheck } from 'lucide-react';

export default function RequestChat() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { t, language } = useTranslation();
    const [requestData, setRequestData] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isPillarTyping, setIsPillarTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const isDemo = localStorage.getItem('coophub_demo_customer') === 'true';

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const data = await serviceRequestService.getRequestDetails(id);
                setRequestData(data);

                // Live Supabase Messages strictly for this service request / booking
                const { data: msgs } = await jobCommunicationService.getMessages(id);
                setMessages(msgs || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        // Subscribe to real-time updates via Supabase WebSockets
        const unsubscribe = subscribeToMessages(id, {
            onInsert: (newMsg) => {
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
            },
            onUpdate: (updatedMsg) => {
                setMessages(prev => {
                    const existingIdx = prev.findIndex(m => m.id === updatedMsg.id);
                    if (existingIdx !== -1) {
                        const clone = [...prev];
                        clone[existingIdx] = updatedMsg;
                        return clone;
                    }
                    return [...prev, updatedMsg];
                });
            }
        });

        return () => {
            unsubscribe();
        };
    }, [id, navigate, isDemo]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isPillarTyping]);

    const handleSend = async (e) => {
        e.preventDefault();
        const text = newMessage.trim();
        if (!text) return;
        setNewMessage('');

        const localId = `msg-${Date.now()}`;
        const userMsg = {
            id: localId,
            sender_type: 'customer',
            sender_name: 'You',
            message: text,
            content: text,
            request_id: id,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);

        // Live Supabase Insert (Strict Authoritative Persistence)
        try {
            const { data, error } = await jobCommunicationService.sendMessage({
                requestId: id,
                senderId: profile?.user_id,
                senderType: 'customer',
                content: text,
                messageType: 'TEXT'
            });
            if (error) {
                console.error('Failed to send message: ', error);
            } else if (data) {
                // Replace optimistic local ID with authoritative database record ID
                setMessages(prev => prev.map(m => m.id === localId ? data : m));
            }
        } catch (err) {
            console.error('Failed to send message exception: ', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface p-10 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-navy-600 font-medium text-sm">Opening secure chat channel...</p>
            </div>
        );
    }

    const pillarName = requestData?.pillar?.full_name || (requestData?.service_name?.includes('Plumb') ? 'Leo (Certified Plumber)' : 'Assigned Technician');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col h-screen">
            {/* Header */}
            <div className="bg-white border-b border-navy-100 px-4 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => navigate(`/requests/${id}`)}
                        className="p-1.5 hover:bg-navy-50 rounded-xl transition-colors text-navy-600"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center space-x-2">
                            <h2 className="font-bold text-navy-900 text-sm leading-tight">{pillarName}</h2>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                        <p className="text-[11px] font-mono text-navy-400">Order Ref: {String(id).startsWith('REQ-') || String(id).startsWith('ORD-') ? id : `ORD-${String(id).slice(0, 8).toUpperCase()}`}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => alert('Virtual Masked Call Bridge: Calling technician without revealing numbers.')}
                        className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-colors"
                        title="Masked Audio Call"
                    >
                        <Phone size={16} />
                    </button>
                </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-w-2xl w-full mx-auto">
                <div className="text-center my-2">
                    <span className="text-[11px] font-medium text-navy-400 bg-white/80 border border-navy-100 px-3 py-1 rounded-full shadow-xs">
                        🔒 End-to-end masked service communication
                    </span>
                </div>

                {messages.map((msg) => {
                    const isCustomer = msg.sender_type === 'customer' || msg.sender_id === profile?.user_id;

                    return (
                        <div
                            key={msg.id}
                            className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                        >
                            <div
                                className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                    isCustomer
                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-br-none shadow-md shadow-orange-500/10 font-medium'
                                        : 'bg-white border border-navy-100 text-navy-800 rounded-bl-none shadow-xs'
                                }`}
                            >
                                <p className="whitespace-pre-line">{msg.message || msg.content || msg.text}</p>
                            </div>
                            <div className="flex items-center space-x-1 mt-1 px-1 text-[10px] text-navy-400 font-mono">
                                <span>{new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {isCustomer && <CheckCheck size={12} className="text-orange-500" />}
                            </div>
                        </div>
                    );
                })}

                {isPillarTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-navy-100 rounded-2xl rounded-bl-none px-4 py-2.5 shadow-xs flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                            <div className="w-1.5 h-1.5 bg-navy-700 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                            <span className="text-xs text-navy-400 ml-1">Pillar typing...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="bg-white border-t border-navy-100 p-3 sticky bottom-0 z-10 shadow-lg">
                <form onSubmit={handleSend} className="max-w-2xl mx-auto flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message to your assigned technician..."
                        className="flex-1 bg-navy-50/70 border border-navy-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-full py-2.5 px-4 text-sm text-navy-800 focus:outline-none placeholder:text-navy-400 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:shadow-orange-500/20 transition-all shrink-0"
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
}
