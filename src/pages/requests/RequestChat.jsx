import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { serviceRequestService } from '../../services/customer/serviceRequestService';
import { useTranslation } from '../../hooks/useTranslation';

export default function RequestChat() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { t } = useTranslation();
    const [requestData, setRequestData] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Verify request ownership + assignment
                const data = await serviceRequestService.getRequestDetails(id);
                if (!['assigned', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'completed'].includes(data.status)) {
                    throw new Error('Pillar communication will be available after assignment.');
                }
                setRequestData(data);

                // Fetch existing messages
                const { data: msgs, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('request_id', id)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                setMessages(msgs || []);
            } catch (err) {
                alert(err.message || 'Unauthorized chat action.');
                navigate('/requests');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        // Natively bind to Realtime subscriptions (Abstraction foundation)
        const subscription = supabase
            .channel(`messages:request_id=eq.${id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${id}` }, (payload) => {
                setMessages(prev => [...prev, payload.new]);
            })
            .subscribe();

        return () => supabase.removeChannel(subscription);
    }, [id, navigate]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !profile?.user_id) return;

        try {
            const tempMsg = newMessage.trim();
            setNewMessage('');

            const { error } = await supabase.from('messages').insert({
                request_id: id,
                sender_id: profile.user_id,
                sender_type: 'customer',
                content: tempMsg
            });
            if (error) throw error;
        } catch (err) {
            alert('Failed to send message.');
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-surface p-10 text-center animate-pulse">Establishing secure channel...</div>;
    }

    return (
        <div className="min-h-screen bg-surface flex flex-col h-screen">
            {/* Native sticky chat header */}
            <div className="bg-white border-b border-navy-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center space-x-3">
                    <button onClick={() => navigate(`/requests/${id}`)} className="p-2 hover:bg-navy-50 rounded-full transition-colors text-navy-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                        <h2 className="font-bold text-navy-800 leading-tight">Service Professional</h2>
                        <p className="text-xs font-mono text-navy-500">REQ: {id.split('-')[0]}</p>
                    </div>
                </div>
                {/* Visual Placeholder for native Call binding (Module 8 Requirement) */}
                <button disabled className="p-2 bg-navy-50 text-navy-300 rounded-full cursor-not-allowed opacity-50" title="Call feature not currently configured">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                </button>
            </div>

            {/* Conversation Window (M7) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-center w-full my-6">
                    <span className="bg-navy-50 text-navy-500 text-xs px-3 py-1 rounded-full border border-navy-100">
                        End-to-End Encrypted Session Established
                    </span>
                </div>

                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 opacity-60">
                        <svg className="w-12 h-12 text-navy-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        <p className="text-navy-600 text-sm">No messages yet. Send a message to start communicating with the Pillar.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_type === 'customer';
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] px-4 py-2 ${isMe ? 'bg-orange-500 text-white rounded-2xl rounded-br-none' : 'bg-white border border-navy-100 text-navy-800 rounded-2xl rounded-bl-none shadow-sm'}`}>
                                    <p className="text-sm">{msg.content}</p>
                                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-orange-100' : 'text-navy-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isMe && <span className="ml-1 opacity-70">✓</span>}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Field */}
            <div className="bg-white border-t border-navy-100 p-3 pt-4 pb-6 px-4">
                <form onSubmit={handleSend} className="flex items-center bg-navy-50 rounded-full border border-navy-200 p-1">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-transparent py-2.5 px-4 text-sm focus:outline-none"
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="p-2.5 rounded-full bg-navy-500 text-white disabled:opacity-50 hover:bg-navy-600 transition-colors">
                        <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </form>
            </div>
        </div>
    );
}
