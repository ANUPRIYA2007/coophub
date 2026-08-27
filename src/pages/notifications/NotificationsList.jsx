import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../hooks/useTranslation';

export default function NotificationsList() {
    const { profile } = useAuth();
    const { t, language } = useTranslation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!profile?.user_id) return;
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setNotifications(data || []);
            } catch (err) {
                console.error('Error fetching notifications:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        // Optional realtime subscription
        const subscription = supabase
            .channel('notifications_channel')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `customer_id=eq.${profile?.user_id}` }, (payload) => {
                setNotifications(prev => [payload.new, ...prev]);
            })
            .subscribe();

        return () => supabase.removeChannel(subscription);
    }, [profile]);

    const markAsRead = async (id, isRead, e) => {
        e.stopPropagation();
        if (isRead) return;

        try {
            const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
            if (!error) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            }
        } catch (err) {
            console.error('Failed to mark read', err);
        }
    };

    const handleNotificationClick = async (notif) => {
        await markAsRead(notif.id, notif.is_read, { stopPropagation: () => { } });
        if (notif.request_id) {
            navigate(`/requests/${notif.request_id}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface p-6 flex flex-col space-y-4 max-w-xl mx-auto pt-20">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-2xl w-full animate-pulse"></div>)}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-24 pt-6 px-4">
            <div className="max-w-xl mx-auto">
                {/* Unified Sticky Header */}
                <header className="bg-white sticky top-0 z-40 border-b border-navy-100/50 shadow-sm px-4 py-3 flex items-center -mx-4 -mt-6 mb-8">
                    <button onClick={() => navigate('/home')} className="mr-3 text-navy-500 hover:text-orange-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="font-bold text-navy-800 text-lg">{t('navigation.notifications') || 'Notifications'}</h1>
                </header>

                {notifications.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-navy-100 shadow-sm mt-8 relative overflow-hidden">
                        <div className="w-20 h-20 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </div>
                        <h3 className="font-semibold text-lg text-navy-800">{t('notifications.empty_title') || 'All caught up!'}</h3>
                        <p className="text-navy-500 mt-2 text-sm">{t('notifications.empty_desc') || "You don't have any recent notifications."}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map(notif => {
                            const message = notif.message_translations?.[language] || notif.message_translations?.['en'];
                            const isRead = notif.is_read;

                            return (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${isRead ? 'bg-white border-navy-100 opacity-75 hover:bg-navy-50' : 'bg-orange-50/50 border-orange-100 hover:bg-orange-50 shadow-sm'}`}
                                >
                                    {!isRead && <div className="absolute top-4 left-4 w-2.5 h-2.5 bg-orange-500 rounded-full"></div>}
                                    <div className={`pl-6 ${!isRead && 'pr-6'}`}>
                                        <p className={`text-sm ${isRead ? 'text-navy-700' : 'text-navy-900 font-medium'}`}>{message}</p>
                                        <p className="text-xs text-navy-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                                    </div>
                                    {!isRead && (
                                        <button
                                            onClick={(e) => markAsRead(notif.id, isRead, e)}
                                            className="absolute top-1/2 -translate-y-1/2 right-4 p-2 text-orange-400 hover:text-orange-600 hover:bg-orange-100 rounded-full transition-colors"
                                            title="Mark as read"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
