import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../hooks/useTranslation';
import { Bell, ArrowLeft, CheckCheck, Clock, ShieldCheck, Wrench, FileText, CheckCircle2 } from 'lucide-react';

const DEMO_NOTIFICATIONS = [
    {
        id: "notif-1",
        title: "Pillar En Route 🚗",
        message: "Raj Kumar (Senior Electrician) is on the way to your location (ETA ~8 mins).",
        is_read: false,
        request_id: "REQ-8942",
        created_at: new Date(Date.now() - 300000).toISOString()
    },
    {
        id: "notif-2",
        title: "Pillar Assigned 👷",
        message: "Your Electrical Repair request #REQ-8942 has been accepted by Raj Kumar.",
        is_read: false,
        request_id: "REQ-8942",
        created_at: new Date(Date.now() - 900000).toISOString()
    },
    {
        id: "notif-3",
        title: "Service Completed ✔️",
        message: "Your AC Power Point & 16A Socket service #REQ-8890 has been completed.",
        is_read: true,
        request_id: "REQ-8890",
        created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: "notif-4",
        title: "Invoice Generated 🧾",
        message: "Invoice INV-8890 for ₹1500 is marked paid. Thank you!",
        is_read: true,
        request_id: "REQ-8890",
        created_at: new Date(Date.now() - 86400000).toISOString()
    }
];

export default function NotificationsList() {
    const { profile } = useAuth();
    const { t, language } = useTranslation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const isDemo = localStorage.getItem('coophub_demo_customer') === 'true';

    useEffect(() => {
        const fetchNotifications = async () => {
            if (isDemo) {
                setNotifications(DEMO_NOTIFICATIONS);
                setLoading(false);
                return;
            }

            if (!profile?.user_id) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('customer_id', profile.user_id)
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

        if (!isDemo && profile?.user_id) {
            const subscription = supabase
                .channel('notifications_channel')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `customer_id=eq.${profile.user_id}` }, (payload) => {
                    setNotifications(prev => [payload.new, ...prev]);
                })
                .subscribe();

            return () => supabase.removeChannel(subscription);
        }
    }, [profile, isDemo]);

    const markAsRead = async (id, isRead, e) => {
        e?.stopPropagation();
        if (isRead) return;

        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));

        if (!isDemo) {
            try {
                await supabase.from('notifications').update({ is_read: true }).eq('id', id);
            } catch (err) {
                console.error('Failed to mark read', err);
            }
        }
    };

    const handleNotificationClick = async (notif) => {
        await markAsRead(notif.id, notif.is_read);
        if (notif.request_id) {
            navigate(`/requests/${notif.request_id}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface p-6 flex flex-col space-y-4 max-w-xl mx-auto pt-10">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-2xl w-full animate-pulse"></div>)}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-24 pt-6 px-4">
            <div className="max-w-xl mx-auto space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-navy-100/60 pb-4">
                    <div className="flex items-center space-x-3">
                        <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-navy-50 rounded-xl transition-colors text-navy-600">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="font-bold text-navy-900 text-lg leading-tight">Notifications</h1>
                            <p className="text-xs text-navy-400">Order alerts and lifecycle updates</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
                    >
                        Mark all as read
                    </button>
                </div>

                {notifications.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-navy-100 shadow-sm mt-6">
                        <div className="w-16 h-16 bg-navy-50 text-navy-300 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Bell size={28} />
                        </div>
                        <h3 className="font-bold text-navy-800 text-base">All caught up!</h3>
                        <p className="text-navy-400 text-xs mt-1">You don't have any unread notifications.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3.5 relative overflow-hidden ${
                                    notif.is_read
                                        ? 'bg-white border-navy-100 text-navy-700 shadow-xs hover:border-orange-200'
                                        : 'bg-orange-50/50 border-orange-200/80 text-navy-900 shadow-sm hover:shadow-md'
                                }`}
                            >
                                {!notif.is_read && (
                                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-orange-500"></span>
                                )}

                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                    notif.is_read ? 'bg-navy-50 text-navy-500' : 'bg-orange-100 text-orange-600'
                                }`}>
                                    <Bell size={18} />
                                </div>

                                <div className="flex-1 pr-4">
                                    <h4 className="font-bold text-sm leading-snug">{notif.title}</h4>
                                    <p className="text-xs text-navy-600 mt-0.5 leading-relaxed">{notif.message}</p>
                                    <div className="flex items-center space-x-2 mt-2 text-[10px] text-navy-400 font-mono">
                                        <Clock size={11} />
                                        <span>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
