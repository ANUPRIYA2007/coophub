import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../hooks/useTranslation';
import { Bell, ArrowLeft, CheckCheck, Clock, ShieldCheck, Wrench, FileText, CheckCircle2, Navigation, AlertCircle, Trash2, X } from 'lucide-react';

export default function NotificationsList() {
    const { profile, user } = useAuth();
    const { t, language } = useTranslation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const isDemo = localStorage.getItem('coophub_demo_customer') === 'true';

    const getDismissedIds = () => {
        try {
            return JSON.parse(localStorage.getItem('coophub_dismissed_notifs') || '[]');
        } catch {
            return [];
        }
    };

    const addDismissedId = (id) => {
        try {
            const current = getDismissedIds();
            if (!current.includes(id)) {
                current.push(id);
                localStorage.setItem('coophub_dismissed_notifs', JSON.stringify(current));
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const customerId = profile?.user_id || user?.id;
                const dismissedIds = new Set(getDismissedIds());
                let notifList = [];

                // 1. Fetch from Supabase notifications table if available
                if (customerId) {
                    const { data: dbNotifs } = await supabase
                        .from('notifications')
                        .select('*')
                        .or(`customer_id.eq.${customerId},user_id.eq.${customerId}`)
                        .order('created_at', { ascending: false });

                    if (dbNotifs && dbNotifs.length > 0) {
                        notifList.push(...dbNotifs);
                    }
                }

                // 2. Fetch customer's real service_requests to generate live lifecycle alerts
                let sReqQuery = supabase
                    .from('service_requests')
                    .select('*, services(name, category), sub_services(name)')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (customerId) {
                    sReqQuery = sReqQuery.or(`customer_id.eq.${customerId},customer_id.is.null`);
                }

                const { data: reqs } = await sReqQuery;

                if (reqs && reqs.length > 0) {
                    reqs.forEach((r) => {
                        const sName = r.services?.name || r.service_name || 'Home Service';
                        const reqCode = 'REQ-' + r.id.substring(0, 6).toUpperCase();

                        // Current Status Lifecycle Alert
                        let statusTitle = `Service Request ${reqCode} Updated`;
                        let statusMsg = `Your ${sName} is currently in progress.`;
                        let iconType = 'order';

                        if (r.status === 'pending' || r.status === 'assigned') {
                            statusTitle = `Pillar Assigned • ${sName}`;
                            statusMsg = `Technician has been matched for Order #${reqCode}. Stand by for arrival.`;
                            iconType = 'assigned';
                        } else if (r.status === 'on_the_way') {
                            statusTitle = `Technician En Route 🚗 • ${sName}`;
                            statusMsg = `Your technician is navigating to your address. Provide Arrival PIN ${r.arrival_otp || '687452'} upon arrival.`;
                            iconType = 'en_route';
                        } else if (r.status === 'arrived') {
                            statusTitle = `🎉 Technician Arrived at Doorstep! • ${sName}`;
                            statusMsg = `Share your 6-digit Arrival PIN ${r.arrival_otp || '687452'} with Pillar to verify and start the job.`;
                            iconType = 'arrived';
                        } else if (r.status === 'completed') {
                            statusTitle = `✓ Service Completed • ${sName}`;
                            statusMsg = `Job finished successfully! Total amount due: ₹${r.final_amount || r.amount || 450}. Click to pay or view invoice.`;
                            iconType = 'completed';
                        }

                        notifList.push({
                            id: `req-status-${r.id}`,
                            request_id: r.id,
                            title: statusTitle,
                            message: statusMsg,
                            type: iconType,
                            is_read: false,
                            created_at: r.updated_at || r.created_at
                        });

                        // Order Booking Confirmation
                        notifList.push({
                            id: `req-created-${r.id}`,
                            request_id: r.id,
                            title: `Order Placed • ${sName} (${reqCode})`,
                            message: `Your booking for ${sName} has been recorded. Estimated Base Rate: ₹${r.amount || 450}.`,
                            type: 'booked',
                            is_read: true,
                            created_at: r.created_at
                        });
                    });
                }

                // Deduplicate by ID, filter out dismissed, and sort newest first
                const uniqueMap = new Map();
                notifList.forEach(n => {
                    if (!uniqueMap.has(n.id) && !dismissedIds.has(n.id)) {
                        uniqueMap.set(n.id, n);
                    }
                });

                const sorted = Array.from(uniqueMap.values()).sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                );

                setNotifications(sorted);
            } catch (err) {
                console.error('Error fetching notifications:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        const channel = supabase
            .channel(`notifs_live_${Date.now()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [profile, user]);

    const markAsRead = (id, e) => {
        e?.stopPropagation();
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const handleRemoveNotification = async (id, e) => {
        e?.stopPropagation();
        addDismissedId(id);
        setNotifications(prev => prev.filter(n => n.id !== id));

        // If UUID format from Supabase notifications table, delete directly
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
            try {
                await supabase.from('notifications').delete().eq('id', id);
            } catch (err) {
                console.warn("Delete notif note:", err.message);
            }
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm("Are you sure you want to clear all notifications?")) return;
        
        notifications.forEach(n => addDismissedId(n.id));
        setNotifications([]);

        const customerId = profile?.user_id || user?.id;
        if (customerId) {
            try {
                await supabase.from('notifications').delete().or(`customer_id.eq.${customerId},user_id.eq.${customerId}`);
            } catch (err) {
                console.warn("Clear all note:", err.message);
            }
        }
    };

    const handleNotificationClick = (notif) => {
        markAsRead(notif.id);
        if (notif.request_id) {
            navigate(`/requests/${notif.request_id}`);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'en_route':
                return <Navigation size={18} className="text-orange-500" />;
            case 'arrived':
                return <ShieldCheck size={18} className="text-emerald-500" />;
            case 'completed':
                return <CheckCircle2 size={18} className="text-green-500" />;
            case 'assigned':
                return <Wrench size={18} className="text-blue-500" />;
            default:
                return <Bell size={18} className="text-orange-500" />;
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
                        <button onClick={() => navigate('/home')} title="Back to Home Dashboard" className="p-1.5 hover:bg-navy-50 rounded-xl transition-colors text-navy-600">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="font-bold text-navy-900 text-lg leading-tight">Notifications</h1>
                            <p className="text-xs text-navy-400">Order alerts and lifecycle updates</p>
                        </div>
                    </div>

                    {notifications.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))}
                                className="text-xs font-bold text-navy-600 hover:text-navy-800 transition-colors px-2 py-1 rounded-lg hover:bg-navy-50"
                            >
                                Mark read
                            </button>
                            <button
                                onClick={handleClearAll}
                                className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-red-50"
                            >
                                <Trash2 size={13} />
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-navy-100 shadow-sm mt-6">
                        <div className="w-16 h-16 bg-navy-50 text-navy-300 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Bell size={28} />
                        </div>
                        <h3 className="font-bold text-navy-800 text-base">All caught up!</h3>
                        <p className="text-navy-400 text-xs mt-1">You don't have any notifications.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3.5 relative overflow-hidden group ${
                                    notif.is_read
                                        ? 'bg-white border-navy-100 text-navy-700 shadow-xs hover:border-orange-200'
                                        : 'bg-orange-50/50 border-orange-200/80 text-navy-900 shadow-sm hover:shadow-md'
                                }`}
                            >
                                {!notif.is_read && (
                                    <span className="absolute top-4 right-9 w-2 h-2 rounded-full bg-orange-500"></span>
                                )}

                                {/* Remove single notification button */}
                                <button
                                    onClick={(e) => handleRemoveNotification(notif.id, e)}
                                    title="Delete notification"
                                    className="absolute top-3 right-3 p-1 text-navy-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <X size={15} />
                                </button>

                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                    notif.is_read ? 'bg-navy-50' : 'bg-orange-100'
                                }`}>
                                    {getIcon(notif.type)}
                                </div>

                                <div className="flex-1 pr-6">
                                    <h4 className="font-bold text-sm leading-snug">{notif.title || notif.subject || notif.header || "Order Update"}</h4>
                                    <p className="text-xs text-navy-600 mt-1 leading-relaxed">{notif.message || notif.content || notif.body || "Click to view service details."}</p>
                                    <div className="flex items-center space-x-2 mt-2 text-[10px] text-navy-400 font-mono">
                                        <Clock size={11} />
                                        <span>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
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
