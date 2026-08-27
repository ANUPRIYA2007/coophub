import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function RequestsList() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchRequests = async () => {
            if (!profile?.user_id) return;
            try {
                // Fetch requests and dynamically join translations natively
                const { data, error: dbErr } = await supabase
                    .from('service_requests')
                    .select('id, status, created_at, preferred_date, preferred_time, flexible_timing, services(name_translations), sub_services(name_translations)')
                    .eq('customer_id', profile.user_id)
                    .order('created_at', { ascending: false });

                if (dbErr) throw dbErr;
                setRequests(data || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, [profile]);

    const activeStatuses = [...new Set(requests.map(r => r.status))];

    const filteredRequests = filter === 'all'
        ? requests
        : requests.filter(r => r.status === filter);

    if (loading) {
        return (
            <div className="min-h-screen bg-surface p-6 flex flex-col space-y-4 max-w-3xl mx-auto pt-20">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
                {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl w-full animate-pulse"></div>)}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-24 pt-6 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Unified Sticky Header */}
                <header className="bg-white sticky top-0 z-40 border-b border-navy-100/50 shadow-sm px-4 py-3 flex items-center -mx-4 -mt-6 mb-6">
                    <button onClick={() => navigate('/home')} className="mr-3 text-navy-500 hover:text-orange-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="font-bold text-navy-800 text-lg">{t('navigation.my_requests') || 'My Requests'}</h1>
                </header>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl mb-4 border border-red-100">{error}</div>
                )}

                {requests.length === 0 && !error ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-navy-100 shadow-sm mt-8">
                        <div className="w-20 h-20 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <h3 className="font-semibold text-lg text-navy-800 mt-2">{t('requests.empty_title') || 'No active requests'}</h3>
                        <p className="text-navy-500 mt-2">{t('requests.empty_desc') || "You don't have any service requests tracked at the moment."}</p>
                        <button onClick={() => navigate('/home')} className="btn-primary mt-6">{t('navigation.home') || 'Explore Services'}</button>
                    </div>
                ) : (
                    <>
                        {/* Dynamic Filters based ONLY on existing database records */}
                        {activeStatuses.length > 1 && (
                            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                                <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${filter === 'all' ? 'bg-navy-800 text-white' : 'bg-white border border-navy-200 text-navy-600 hover:bg-navy-50'}`}>All</button>
                                {activeStatuses.map(status => (
                                    <button key={status} onClick={() => setFilter(status)} className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium capitalize transition-colors ${filter === status ? 'bg-orange-500 text-white border-transparent' : 'bg-white border border-navy-200 text-navy-600 hover:bg-orange-50'}`}>
                                        {status.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="space-y-4">
                            {filteredRequests.map(req => {
                                const serviceName = req.services?.name_translations?.[t('language_code')] || req.services?.name_translations?.['en'];
                                const subName = req.sub_services?.name_translations?.[t('language_code')] || req.sub_services?.name_translations?.['en'];

                                return (
                                    <div key={req.id} onClick={() => navigate(`/requests/${req.id}`)} className="bg-white rounded-2xl p-5 border border-navy-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-semibold text-navy-800 text-lg group-hover:text-orange-600 transition-colors">{serviceName}</h3>
                                                {subName && <p className="text-sm text-navy-600">{subName}</p>}
                                            </div>
                                            <span className="px-3 py-1 bg-navy-50 text-navy-700 text-xs font-bold uppercase tracking-wide rounded-full border border-navy-100">
                                                {req.status}
                                            </span>
                                        </div>

                                        <div className="flex items-center text-xs text-navy-400 mt-4 pt-4 border-t border-navy-50">
                                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <span>
                                                {req.flexible_timing
                                                    ? 'Flexible Schedule'
                                                    : (req.preferred_date ? `${req.preferred_date} at ${req.preferred_time || 'Anytime'}` : 'Not scheduled')}
                                            </span>
                                            <span className="ml-auto flex items-center text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                                View Details <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
