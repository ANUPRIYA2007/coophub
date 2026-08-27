import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../hooks/useTranslation';

export default function SupportTickets() {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { t } = useTranslation();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTickets = async () => {
            if (!profile?.user_id) return;
            try {
                const { data, error } = await supabase
                    .from('support_tickets')
                    .select('*')
                    .eq('customer_id', profile.user_id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setTickets(data || []);
            } catch (err) {
                console.error("Failed to load tickets", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, [profile]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'open': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'in_progress': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'waiting_for_customer': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'resolved': return 'bg-green-50 text-green-700 border-green-200';
            case 'closed': return 'bg-navy-100 text-navy-600 border-navy-200';
            default: return 'bg-navy-50 text-navy-600';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface p-6 flex flex-col space-y-4 max-w-2xl mx-auto pt-20">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl w-full animate-pulse"></div>)}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-24 pt-6 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center mb-8">
                    <button onClick={() => navigate('/support')} className="mr-3 text-navy-500 hover:text-navy-800 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <h1 className="heading-3">{t('navigation.tickets') || 'My Support Tickets'}</h1>
                </div>

                {tickets.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-navy-100 shadow-sm mt-8 relative overflow-hidden">
                        <div className="w-20 h-20 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <h3 className="font-semibold text-lg text-navy-800">No Tickets Found</h3>
                        <p className="text-navy-500 mt-2 text-sm mb-6">You don't have any help & support cases active.</p>
                        <button onClick={() => navigate('/support/new')} className="btn-primary px-8">Open New Case</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tickets.map(ticket => (
                            <div key={ticket.id} className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-navy-800 text-lg">{ticket.subject}</h3>
                                    <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md border ${getStatusStyle(ticket.status)}`}>
                                        {ticket.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <p className="text-navy-500 text-sm mb-4 line-clamp-2">{ticket.description}</p>
                                <div className="flex justify-between items-center text-xs text-navy-400 font-mono">
                                    <span>TKT-{ticket.id.split('-')[0]}</span>
                                    <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
