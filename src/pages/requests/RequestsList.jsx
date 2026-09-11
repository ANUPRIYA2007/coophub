import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { serviceRequestService } from '../../services/customer/serviceRequestService';
import { useAuth } from '../../context/AuthContext';
import {
    FileText, Navigation, Clock, CheckCircle2, XCircle, AlertCircle,
    ArrowLeft, MapPin, User, ChevronRight, Sparkles, ShieldCheck
} from 'lucide-react';
import OrderReceiptModal from '../../components/common/OrderReceiptModal';

// Clean service ID mapping for display
const resolveServiceCode = (req) => {
    if (req.service_code) return req.service_code;
    const rawId = String(req.service_id || req.services?.id || '').toLowerCase();
    if (rawId.includes('0001') || rawId.includes('elec') || rawId === 'srv-1') return 'SRV-ELEC-101';
    if (rawId.includes('0002') || rawId.includes('ac') || rawId === 'srv-2') return 'SRV-AC-202';
    if (rawId.includes('0003') || rawId.includes('plumb') || rawId === 'srv-3') return 'SRV-PLUMB-303';
    if (rawId.includes('0004') || rawId.includes('carp') || rawId === 'srv-4') return 'SRV-CARP-404';
    if (rawId.includes('0005') || rawId.includes('paint') || rawId === 'srv-5') return 'SRV-PAINT-505';
    if (rawId.includes('0006') || rawId.includes('clean') || rawId === 'srv-6') return 'SRV-CLEAN-606';
    if (rawId.startsWith('srv-')) return rawId.toUpperCase();
    if (rawId.length > 8) return `SRV-${rawId.slice(0, 4).toUpperCase()}`;
    return 'SRV-ELEC-101';
};

export default function RequestsList() {
    const { t, language } = useTranslation();
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const data = await serviceRequestService.getCustomerRequests();
                setRequests(data || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, [profile]);

    const activeStatuses = [...new Set(requests.map(r => r.status))].filter(Boolean);

    const filteredRequests = filter === 'all'
        ? requests
        : requests.filter(r => r.status === filter);

    const formatStatusLabel = (status) => {
        switch (status?.toLowerCase()) {
            case 'all': return t('All');
            case 'pending': return t('Pending');
            case 'assigned': return t('Assigned');
            case 'accepted': return t('Accepted');
            case 'on_the_way': return t('On The Way');
            case 'in_progress': return t('In Progress');
            case 'completed': return t('Completed');
            case 'cancelled': return t('Cancelled');
            default: return status ? status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
        }
    };

    const getStatusConfig = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return {
                    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80',
                    dotClass: 'bg-emerald-500',
                    icon: CheckCircle2,
                    label: t('Completed')
                };
            case 'cancelled':
                return {
                    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/80',
                    dotClass: 'bg-rose-500',
                    icon: XCircle,
                    label: t('Cancelled')
                };
            case 'on_the_way':
                return {
                    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/80',
                    dotClass: 'bg-sky-500 animate-ping',
                    icon: Navigation,
                    label: t('On The Way')
                };
            case 'in_progress':
                return {
                    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/80',
                    dotClass: 'bg-indigo-500',
                    icon: Sparkles,
                    label: t('In Progress')
                };
            case 'assigned':
            case 'accepted':
                return {
                    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/80',
                    dotClass: 'bg-amber-500',
                    icon: Clock,
                    label: t('Assigned')
                };
            default:
                return {
                    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                    dotClass: 'bg-slate-400',
                    icon: Clock,
                    label: t('Pending')
                };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/60 dark:bg-[#060B14] p-6 flex flex-col space-y-4 max-w-4xl mx-auto pt-10">
                <div className="h-10 bg-slate-200 dark:bg-slate-800/80 rounded-xl w-1/3 mb-4 animate-pulse"></div>
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full animate-pulse"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/60 dark:bg-[#060B14] pb-24 pt-6 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/90 pb-5">
                    <div className="flex items-center gap-3.5">
                        <button 
                            onClick={() => navigate('/home')} 
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-orange-500 hover:border-orange-300 dark:hover:border-orange-500/40 transition-all shadow-xs active:scale-95"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="font-extrabold text-slate-900 dark:text-white text-xl sm:text-2xl tracking-tight">
                                    {t('Bookings & Requests')}
                                </h1>
                                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/80 shadow-2xs">
                                    {requests.length} {requests.length === 1 ? t('Service') : t('Services')}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {t('Track ongoing dispatches, certified technician arrivals, and official cooperative receipts.')}
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/50 flex items-center gap-2.5">
                        <AlertCircle size={18} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {requests.length === 0 && !error ? (
                    <div className="text-center py-20 bg-white dark:bg-[#0B1322] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6">
                        <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100 dark:border-orange-900/50">
                            <Clock className="w-8 h-8 text-orange-500" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-2">{t('No active bookings')}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mt-1">
                            {t("You don't have any service requests tracked at the moment. Explore services to book a verified cooperative technician.")}
                        </p>
                        <button 
                            onClick={() => navigate('/services')} 
                            className="mt-6 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-sm transition-all active:scale-95"
                        >
                            {t('Explore Services')}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Status Filter Tabs */}
                        {activeStatuses.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide">
                                <button 
                                    onClick={() => setFilter('all')} 
                                    className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-all ${
                                        filter === 'all' 
                                            ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20' 
                                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-orange-200 dark:hover:bg-slate-800/70'
                                    }`}
                                >
                                    {t('All')} ({requests.length})
                                </button>
                                {activeStatuses.map(status => {
                                    const count = requests.filter(r => r.status === status).length;
                                    const isSelected = filter === status;
                                    return (
                                        <button 
                                            key={status} 
                                            onClick={() => setFilter(status)} 
                                            className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                isSelected 
                                                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20' 
                                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-orange-200 dark:hover:bg-slate-800/70'
                                            }`}
                                        >
                                            <span>{formatStatusLabel(status)}</span>
                                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Requests Cards List */}
                        <div className="space-y-4">
                            {filteredRequests.map(req => {
                                const serviceName = req.services?.name_translations?.[language] ||
                                    req.services?.name_translations?.['en'] ||
                                    req.services?.name ||
                                    req.service?.name ||
                                    req.service_name ||
                                    req.category ||
                                    t('Cooperative Service');

                                const subName = req.sub_services?.name_translations?.[language] ||
                                    req.sub_services?.name_translations?.['en'] ||
                                    req.sub_services?.name ||
                                    req.sub_service?.name ||
                                    req.sub_service_name ||
                                    '';

                                const isCompleted = req.status === 'completed';
                                const isCancelled = req.status === 'cancelled';
                                const statusConfig = getStatusConfig(req.status);
                                const StatusIcon = statusConfig.icon;

                                const orderCode = req.booking_code || req.order_code || (
                                    String(req.id).startsWith('REQ-') || String(req.id).startsWith('ORD-') 
                                        ? req.id 
                                        : `ORD-${String(req.id).substring(0, 8).toUpperCase()}`
                                );

                                const serviceCode = resolveServiceCode(req);
                                const pillarName = req.pillar?.full_name || req.pillar_name || null;
                                const totalAmount = req.final_amount || req.total_amount || req.amount || 450;
                                const formattedAddress = req.address_line || req.area || (req.city ? `${req.city}, ${req.state || 'Tamil Nadu'}` : 'Chennai');

                                return (
                                    <div 
                                        key={req.id} 
                                        onClick={() => {
                                            if (isCompleted) {
                                                setSelectedReceiptOrder(req);
                                            } else {
                                                navigate(`/requests/${req.id}`);
                                            }
                                        }} 
                                        className="bg-white dark:bg-[#0B1322] rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:hover:border-slate-700 transition-all duration-200 cursor-pointer relative overflow-hidden group"
                                    >
                                        {/* Top Header: Order Code, Service ID & Status Pill */}
                                        <div className="flex items-center justify-between gap-2 mb-3.5 flex-wrap">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-900/60 shadow-2xs">
                                                    Order: #{orderCode}
                                                </span>
                                                <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    Service ID: {serviceCode}
                                                </span>
                                            </div>
                                            
                                            {/* Status Badge */}
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${statusConfig.badgeClass}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                                                <StatusIcon size={12} />
                                                <span>{statusConfig.label}</span>
                                            </span>
                                        </div>

                                        {/* Main Service Title & Subtitle */}
                                        <div className="mb-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                                        {t(serviceName)}
                                                    </h3>
                                                    {subName && (
                                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                                            {t(subName)}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                                                        ₹{Number(totalAmount).toFixed(0)}
                                                    </span>
                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                        {isCompleted ? 'Paid' : 'Standard Rate'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Middle Info Row: Assigned Pillar & Address */}
                                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 dark:text-slate-400 my-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                                            {pillarName ? (
                                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
                                                    <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                                                    <span>Assigned Pillar: <strong className="text-slate-900 dark:text-white font-semibold">{pillarName}</strong></span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                                    <Clock size={13} />
                                                    <span>Awaiting Workforce Dispatch</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                                <MapPin size={13} className="text-slate-400 shrink-0" />
                                                <span className="truncate">{formattedAddress}</span>
                                            </div>
                                        </div>

                                        {/* Bottom Footer: Scheduled Time & Action Button */}
                                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex-wrap gap-2">
                                            <div className="flex items-center text-slate-500 dark:text-slate-400">
                                                <Clock size={14} className="mr-1.5 text-slate-400 dark:text-slate-500" />
                                                <span>
                                                    {req.flexible_timing
                                                        ? 'Flexible Schedule'
                                                        : (req.preferred_date ? `${req.preferred_date} at ${req.preferred_time || '10:30 AM'}` : 'Scheduled')}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isCompleted ? (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedReceiptOrder(req);
                                                        }}
                                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                                                    >
                                                        <FileText size={13} />
                                                        <span>View Receipt</span>
                                                    </button>
                                                ) : isCancelled ? (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/requests/${req.id}`);
                                                        }}
                                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                                                    >
                                                        <span>Order Details</span>
                                                        <ChevronRight size={12} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/requests/${req.id}`);
                                                        }}
                                                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-95"
                                                    >
                                                        <Navigation size={13} />
                                                        <span>Track Live</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Official Order Receipt Modal */}
            {selectedReceiptOrder && (
                <OrderReceiptModal
                    order={{
                        ...selectedReceiptOrder,
                        id: selectedReceiptOrder.id,
                        booking_code: selectedReceiptOrder.booking_code || selectedReceiptOrder.order_code || (String(selectedReceiptOrder.id).startsWith('REQ-') || String(selectedReceiptOrder.id).startsWith('ORD-') ? selectedReceiptOrder.id : `ORD-${String(selectedReceiptOrder.id).slice(0, 6).toUpperCase()}`),
                        service_name: selectedReceiptOrder.services?.name || selectedReceiptOrder.service_name || selectedReceiptOrder.category || 'Cooperative Service',
                        sub_service_name: selectedReceiptOrder.sub_services?.name || selectedReceiptOrder.sub_service_name || '',
                        service_id: resolveServiceCode(selectedReceiptOrder),
                        customer_name: profile?.full_name || 'Anupriya Sundaram',
                        customer_mobile: profile?.phone || '+91 98401 23456',
                        service_address: selectedReceiptOrder.address_line || 'Guindy, Chennai',
                        base_amount: selectedReceiptOrder.amount || 450,
                        extra_charge_amount: selectedReceiptOrder.extra_charge_amount || 0,
                        extra_charge_reason: selectedReceiptOrder.extra_charge_reason || '',
                        total_amount: selectedReceiptOrder.final_amount || selectedReceiptOrder.amount || 450,
                        final_amount: selectedReceiptOrder.final_amount || selectedReceiptOrder.amount || 450,
                        scheduled_date: selectedReceiptOrder.preferred_date || '09 Sep 2026',
                        scheduled_time: selectedReceiptOrder.preferred_time || '10:30 AM',
                        payment_method: 'Online Payment (UPI)',
                        payment_status: 'PAID',
                        pillar: selectedReceiptOrder.pillar
                    }}
                    onClose={() => setSelectedReceiptOrder(null)}
                />
            )}
        </div>
    );
}
