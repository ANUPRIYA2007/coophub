import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../hooks/useTranslation';

export default function HistoryList() {
    const { profile } = useAuth();
    const { t, language } = useTranslation();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!profile?.user_id) return;
            try {
                const { data, error } = await supabase
                    .from('service_requests')
                    .select('id, status, created_at, services(name_translations), sub_services(name_translations)')
                    .eq('customer_id', profile.user_id)
                    .in('status', ['completed', 'cancelled'])
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setHistory(data || []);
            } catch (err) {
                console.error('Error fetching history:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [profile]);

    if (loading) {
        return (
            <div className="min-h-screen bg-surface p-6 flex flex-col space-y-4 max-w-3xl mx-auto pt-20">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
                {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl w-full animate-pulse"></div>)}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-24 pt-6 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center mb-8">
                    <button onClick={() => navigate('/home')} className="mr-3 text-navy-500 hover:text-navy-800 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <h1 className="heading-3">{t('navigation.history') || 'Completed Services'}</h1>
                </div>

                {history.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-navy-100 shadow-sm mt-8">
                        <div className="w-20 h-20 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="font-semibold text-lg text-navy-800">{t('history.empty_title') || 'No service history'}</h3>
                        <p className="text-navy-500 mt-2 text-sm">{t('history.empty_desc') || "You don't have any completed or cancelled services yet."}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map(req => {
                            const serviceName = req.services?.name_translations?.[language] || req.services?.name_translations?.['en'];
                            const subName = req.sub_services?.name_translations?.[language] || req.sub_services?.name_translations?.['en'];
                            const isCompleted = req.status === 'completed';

                            return (
                                <div key={req.id} onClick={() => navigate(`/requests/${req.id}`)} className="bg-white rounded-2xl p-5 border border-navy-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none transition-colors" style={{ backgroundColor: isCompleted ? '#22c55e' : '#ef4444' }}></div>

                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <div>
                                            <h3 className="font-semibold text-navy-800 text-lg group-hover:text-navy-900 transition-colors flex items-center">
                                                {serviceName}
                                            </h3>
                                            {subName && <p className="text-sm text-navy-600">{subName}</p>}
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${isCompleted ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {req.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-navy-400 mt-4 pt-4 border-t border-navy-50 relative z-10">
                                        <span className="font-mono">REQ-{req.id.split('-')[0]}</span>
                                        <span>{new Date(req.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
