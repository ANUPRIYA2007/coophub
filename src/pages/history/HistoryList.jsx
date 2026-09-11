import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { serviceRequestService } from '../../services/customer/serviceRequestService';
import { useTranslation } from '../../hooks/useTranslation';
import {
    ArrowLeft, Clock, CheckCircle2, XCircle, ShieldCheck,
    Search, RotateCcw, Calendar, MapPin, Zap, Wind, Wrench,
    Hammer, Sparkles, Paintbrush, UserCheck, Receipt
} from 'lucide-react';
import OrderReceiptModal from '../../components/common/OrderReceiptModal';

// Clean service ID mapping for display
const resolveServiceCode = (req) => {
    if (req.service_code) return req.service_code;
    const rawId = String(req.service_id || req.services?.id || req.service?.id || '').toLowerCase();
    if (rawId.includes('0001') || rawId.includes('elec') || rawId === 'srv-1' || rawId.includes('a0a000')) return 'SRV-ELEC-101';
    if (rawId.includes('0002') || rawId.includes('ac') || rawId === 'srv-2') return 'SRV-AC-202';
    if (rawId.includes('0003') || rawId.includes('plumb') || rawId === 'srv-3') return 'SRV-PLUMB-303';
    if (rawId.includes('0004') || rawId.includes('carp') || rawId === 'srv-4') return 'SRV-CARP-404';
    if (rawId.includes('0005') || rawId.includes('paint') || rawId === 'srv-5') return 'SRV-PAINT-505';
    if (rawId.includes('0006') || rawId.includes('clean') || rawId === 'srv-6') return 'SRV-CLEAN-606';
    if (rawId.startsWith('srv-') && !rawId.includes('a0a000')) return rawId.toUpperCase();
    return 'SRV-ELEC-101';
};

// Clean service name resolver
const resolveServiceName = (req, language = 'en') => {
    const rawName = req.services?.name_translations?.[language] ||
        req.services?.name_translations?.['en'] ||
        req.services?.name ||
        req.service?.name ||
        req.service_name;

    if (rawName && rawName.trim() && rawName.trim().toLowerCase() !== 'service') {
        return rawName.trim();
    }

    // Derive from description or service ID if missing or generic
    const desc = String(req.customer_description || req.description || '').toLowerCase();
    const sid = String(req.service_id || req.services?.id || '').toLowerCase();

    if (desc.includes('fan') || desc.includes('switch') || desc.includes('wiring') || desc.includes('spark') || sid.includes('elec') || sid === 'srv-1' || sid.includes('a0a000')) {
        return 'Electrical Repair & Installation';
    }
    if (desc.includes('ac') || desc.includes('cooling') || desc.includes('filter') || sid.includes('ac') || sid === 'srv-2') {
        return 'AC Repair & Servicing';
    }
    if (desc.includes('pipe') || desc.includes('leak') || desc.includes('tap') || sid.includes('plumb') || sid === 'srv-3') {
        return 'Plumbing & Sanitary Service';
    }
    if (desc.includes('wood') || desc.includes('door') || desc.includes('carpenter') || sid.includes('carp') || sid === 'srv-4') {
        return 'Carpentry & Woodwork';
    }
    if (desc.includes('paint') || desc.includes('wall') || sid.includes('paint') || sid === 'srv-5') {
        return 'Home Painting & Waterproofing';
    }
    if (desc.includes('clean') || sid.includes('clean') || sid === 'srv-6') {
        return 'Deep Cleaning & Sanitation';
    }

    return 'Home Cooperative Service';
};

// Clean sub-service name resolver
const resolveSubServiceName = (req, language = 'en') => {
    const rawSub = req.sub_services?.name_translations?.[language] ||
        req.sub_services?.name_translations?.['en'] ||
        req.sub_services?.name ||
        req.sub_service?.name ||
        req.sub_service_name;

    if (rawSub && rawSub.trim()) return rawSub.trim();

    // Clean customer description from customer phone wrapper
    if (req.customer_description) {
        const cleaned = req.customer_description.replace(/\[Customer:[^\]]+\]\s*/i, '').trim();
        if (cleaned && cleaned.length > 3) {
            return cleaned.length > 55 ? `${cleaned.slice(0, 52)}...` : cleaned;
        }
    }

    return 'Standard Inspection & Repair';
};

// Category icon helper
const getServiceIcon = (serviceName) => {
    const s = String(serviceName).toLowerCase();
    if (s.includes('elec') || s.includes('fan') || s.includes('switch') || s.includes('power')) {
        return { icon: Zap, bg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/50' };
    }
    if (s.includes('ac') || s.includes('cool') || s.includes('air')) {
        return { icon: Wind, bg: 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800/50' };
    }
    if (s.includes('plumb') || s.includes('pipe') || s.includes('leak') || s.includes('tap')) {
        return { icon: Wrench, bg: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/50' };
    }
    if (s.includes('carp') || s.includes('wood') || s.includes('door') || s.includes('furniture')) {
        return { icon: Hammer, bg: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800/50' };
    }
    if (s.includes('paint') || s.includes('wall')) {
        return { icon: Paintbrush, bg: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800/50' };
    }
    if (s.includes('clean') || s.includes('sanitize') || s.includes('pest')) {
        return { icon: Sparkles, bg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/50' };
    }
    return { icon: Wrench, bg: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800/50' };
};

export default function HistoryList() {
    const { profile } = useAuth();
    const { t, language } = useTranslation();
    const navigate = useNavigate();

    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
    const [filterTab, setFilterTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await serviceRequestService.getCustomerRequests();
                const past = (data || []).filter(r => r.status === 'completed' || r.status === 'cancelled');
                setHistory(past);
            } catch (err) {
                console.error('Error fetching history:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [profile]);

    const completedCount = history.filter(r => r.status === 'completed').length;
    const cancelledCount = history.filter(r => r.status === 'cancelled').length;

    // Filter & Search
    const filteredHistory = useMemo(() => {
        return history.filter(item => {
            if (filterTab === 'completed' && item.status !== 'completed') return false;
            if (filterTab === 'cancelled' && item.status !== 'cancelled') return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const sName = resolveServiceName(item, language).toLowerCase();
                const subName = resolveSubServiceName(item, language).toLowerCase();
                const code = (item.booking_code || item.order_code || String(item.id)).toLowerCase();
                const pillar = String(item.pillar?.full_name || item.pillar_name || '').toLowerCase();
                return sName.includes(q) || subName.includes(q) || code.includes(q) || pillar.includes(q);
            }

            return true;
        });
    }, [history, filterTab, searchQuery, language]);

    if (loading) {
        return (
            <div className="min-h-screen bg-surface p-6 flex flex-col space-y-4 max-w-4xl mx-auto pt-16">
                <div className="h-9 bg-gray-200 dark:bg-slate-800 rounded-xl w-1/3 mb-6 animate-pulse"></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>)}
                </div>
                {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-200 dark:bg-slate-800 rounded-3xl w-full animate-pulse"></div>)}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-24 pt-6 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* ─── HEADER BAR ─── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-100 dark:border-slate-800 pb-5">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate('/home')} 
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-navy-100 dark:border-slate-800 text-navy-600 dark:text-slate-300 hover:text-orange-600 hover:border-orange-300 dark:hover:border-orange-500 transition-all shadow-xs"
                            title="Back to Home"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="font-extrabold text-navy-950 dark:text-white text-2xl tracking-tight">
                                    {t('Service History')}
                                </h1>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/60">
                                    {history.length} {history.length === 1 ? 'Booking' : 'Bookings'}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-navy-500 dark:text-slate-400 mt-1">
                                Review your completed dispatches, verify charges, and download official tax receipts.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/services')}
                        className="self-start sm:self-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                    >
                        <RotateCcw size={14} />
                        <span>Book New Service</span>
                    </button>
                </div>

                {/* ─── METRIC STATS CARDS ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* Total Services */}
                    <div className="bg-white dark:bg-slate-900/90 border border-navy-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                            <Calendar size={22} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-navy-900 dark:text-white font-mono leading-none">
                                {history.length}
                            </div>
                            <div className="text-xs font-bold text-navy-700 dark:text-slate-300 mt-1">
                                Total Bookings
                            </div>
                            <div className="text-[11px] text-navy-400 dark:text-slate-400 mt-0.5">
                                Lifetime service requests
                            </div>
                        </div>
                    </div>

                    {/* Completed Jobs */}
                    <div className="bg-white dark:bg-slate-900/90 border border-navy-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={22} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono leading-none">
                                {completedCount}
                            </div>
                            <div className="text-xs font-bold text-navy-700 dark:text-slate-300 mt-1">
                                Completed Jobs
                            </div>
                            <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 font-medium">
                                Official receipts generated
                            </div>
                        </div>
                    </div>

                    {/* 100% Protected Guarantee */}
                    <div className="bg-white dark:bg-slate-900/90 border border-navy-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/50 flex items-center justify-center shrink-0">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <div className="text-sm font-extrabold text-orange-600 dark:text-orange-400">
                                100% Protected
                            </div>
                            <div className="text-xs font-bold text-navy-700 dark:text-slate-300 mt-0.5">
                                Cooperative Guarantee
                            </div>
                            <div className="text-[11px] text-navy-400 dark:text-slate-400 mt-0.5">
                                0% Surge • 30-Day Warranty
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── FILTER TABS & SEARCH ROW ─── */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                    {/* Tabs */}
                    <div className="inline-flex p-1 bg-navy-50/80 dark:bg-slate-800/60 rounded-xl border border-navy-100/80 dark:border-slate-800 self-start">
                        <button
                            onClick={() => setFilterTab('all')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                filterTab === 'all'
                                    ? 'bg-white dark:bg-slate-900 text-navy-900 dark:text-white shadow-xs'
                                    : 'text-navy-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                            }`}
                        >
                            All ({history.length})
                        </button>
                        <button
                            onClick={() => setFilterTab('completed')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                filterTab === 'completed'
                                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                                    : 'text-navy-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                            }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Completed ({completedCount})
                        </button>
                        <button
                            onClick={() => setFilterTab('cancelled')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                filterTab === 'cancelled'
                                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                                    : 'text-navy-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                            }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Cancelled ({cancelledCount})
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 dark:text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by order ID or service..."
                            className="w-full pl-9 pr-3.5 py-1.5 bg-white dark:bg-slate-900 text-xs font-medium text-navy-900 dark:text-white placeholder-navy-400 dark:placeholder-slate-500 border border-navy-100 dark:border-slate-800 rounded-xl focus:outline-none focus:border-orange-500 shadow-2xs"
                        />
                    </div>
                </div>

                {/* ─── LIST CONTENT ─── */}
                {filteredHistory.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-navy-100 dark:border-slate-800 shadow-xs mt-2">
                        <div className="w-16 h-16 bg-navy-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3.5">
                            <Clock size={28} className="text-navy-400 dark:text-slate-500" />
                        </div>
                        <h3 className="font-bold text-base text-navy-900 dark:text-white">
                            {searchQuery ? 'No matching service records' : 'No service history found'}
                        </h3>
                        <p className="text-xs text-navy-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                            {searchQuery ? 'Try clearing your search terms or choosing a different filter tab.' : "You don't have any past completed or cancelled bookings yet."}
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mt-3 px-3.5 py-1.5 bg-navy-100 dark:bg-slate-800 text-navy-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-navy-200 transition-colors"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3.5">
                        {filteredHistory.map(req => {
                            const isCompleted = req.status === 'completed';
                            const serviceName = resolveServiceName(req, language);
                            const subName = resolveSubServiceName(req, language);
                            const serviceCode = resolveServiceCode(req);
                            const categoryIcon = getServiceIcon(serviceName);
                            const CategoryIconComponent = categoryIcon.icon;

                            // Formatted Order ID
                            const rawCode = req.booking_code || req.order_code || req.id;
                            const orderCode = String(rawCode).startsWith('REQ-') || String(rawCode).startsWith('ORD-')
                                ? rawCode
                                : `ORD-${String(rawCode).slice(0, 6).toUpperCase()}`;

                            // Formatted Date
                            const dateObj = new Date(req.completed_at || req.cancelled_at || req.created_at || Date.now());
                            const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

                            // Formatted Amount
                            const totalAmount = Number(req.final_amount || req.total_amount || req.amount || 450);

                            // Pillar Info
                            const pillarName = req.pillar?.full_name || req.pillar_name || 'Verified Cooperative Pillar';
                            const pillarRating = req.pillar?.rating || '★ 4.9';

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
                                    className="bg-white dark:bg-slate-900 border border-navy-100 dark:border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-navy-200 dark:hover:border-slate-700 transition-all cursor-pointer relative group"
                                >
                                    {/* Top Row: Service Category Icon, Order Code, Service ID & Status Pill */}
                                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            {/* Icon */}
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${categoryIcon.bg} ${categoryIcon.border} shrink-0`}>
                                                <CategoryIconComponent size={18} />
                                            </div>

                                            {/* Order Code Badge */}
                                            <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-50/80 dark:bg-orange-950/50 px-2.5 py-1 rounded-lg border border-orange-200/80 dark:border-orange-900/60 shadow-2xs">
                                                Order: #{orderCode}
                                            </span>

                                            {/* Service ID Badge */}
                                            <span className="text-xs font-mono font-semibold text-navy-600 dark:text-slate-400 bg-navy-50/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-navy-100 dark:border-slate-700">
                                                {serviceCode}
                                            </span>
                                        </div>

                                        {/* Status Badge */}
                                        <div>
                                            {isCompleted ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
                                                    <CheckCircle2 size={13} />
                                                    <span>COMPLETED</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800">
                                                    <XCircle size={13} />
                                                    <span>CANCELLED</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Middle: Title & Subtitle */}
                                    <div className="mb-3">
                                        <h3 className="font-extrabold text-navy-950 dark:text-white text-base sm:text-lg group-hover:text-orange-600 transition-colors">
                                            {serviceName}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-navy-500 dark:text-slate-400 mt-0.5">
                                            {subName}
                                        </p>
                                    </div>

                                    {/* Info Strip: Date, Location & Technician */}
                                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-navy-500 dark:text-slate-400 py-2.5 border-y border-navy-50 dark:border-slate-800/80">
                                        {/* Date */}
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={13} className="text-navy-400 dark:text-slate-500" />
                                            <span>
                                                {isCompleted ? 'Completed on' : 'Cancelled on'} <strong>{formattedDate}</strong>
                                            </span>
                                        </div>

                                        {/* Address */}
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={13} className="text-navy-400 dark:text-slate-500" />
                                            <span>{req.address_line || req.area || (req.city ? `${req.city}, Tamil Nadu` : 'Chennai')}</span>
                                        </div>

                                        {/* Technician */}
                                        {req.pillar_id && (
                                            <div className="flex items-center gap-1.5">
                                                <UserCheck size={13} className="text-navy-400 dark:text-slate-500" />
                                                <span>Pillar: <strong>{pillarName}</strong> ({pillarRating})</span>
                                            </div>
                                        )}

                                        {/* Cancellation Reason if cancelled */}
                                        {!isCompleted && req.cancel_reason && (
                                            <div className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded text-[11px] font-medium border border-rose-200 dark:border-rose-900/40">
                                                Reason: {req.cancel_reason}
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer: Price Amount on Left, Actions on Right */}
                                    <div className="flex items-center justify-between gap-3 mt-3.5 pt-1 flex-wrap">
                                        {/* Amount */}
                                        <div className="flex items-baseline gap-2">
                                            {isCompleted ? (
                                                <>
                                                    <span className="text-xs text-navy-400 dark:text-slate-500 font-medium">Total Paid:</span>
                                                    <span className="text-base font-black text-navy-950 dark:text-white font-mono">
                                                        ₹{totalAmount.toFixed(2)}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                                        {req.payment_method === 'HAND CASH' ? 'Hand Cash' : 'Paid'}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-xs text-navy-400 dark:text-slate-500 font-medium">Charge:</span>
                                                    <span className="text-sm font-bold text-navy-500 dark:text-slate-400">
                                                        ₹0.00 (No fee)
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            {isCompleted ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/requests/${req.id}`);
                                                        }}
                                                        className="px-3 py-1.5 rounded-xl border border-navy-200 dark:border-slate-700 text-navy-700 dark:text-slate-300 hover:bg-navy-50 dark:hover:bg-slate-800 text-xs font-bold transition-all"
                                                    >
                                                        Details
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedReceiptOrder(req);
                                                        }}
                                                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                                                    >
                                                        <Receipt size={13} />
                                                        <span>View Receipt</span>
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/requests/${req.id}`);
                                                        }}
                                                        className="px-3 py-1.5 rounded-xl border border-navy-200 dark:border-slate-700 text-navy-700 dark:text-slate-300 hover:bg-navy-50 dark:hover:bg-slate-800 text-xs font-bold transition-all"
                                                    >
                                                        Details
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate('/services');
                                                        }}
                                                        className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                                                    >
                                                        <RotateCcw size={13} />
                                                        <span>Rebook Service</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ─── OFFICIAL ORDER RECEIPT MODAL (CUSTOMER VIEW: WITHOUT COMMISSIONS) ─── */}
            {selectedReceiptOrder && (
                <OrderReceiptModal
                    isPillarView={false}
                    order={{
                        ...selectedReceiptOrder,
                        id: selectedReceiptOrder.id,
                        booking_code: selectedReceiptOrder.booking_code || selectedReceiptOrder.order_code || (String(selectedReceiptOrder.id).startsWith('REQ-') || String(selectedReceiptOrder.id).startsWith('ORD-') ? selectedReceiptOrder.id : `ORD-${String(selectedReceiptOrder.id).slice(0, 6).toUpperCase()}`),
                        service_name: resolveServiceName(selectedReceiptOrder, language),
                        sub_service_name: resolveSubServiceName(selectedReceiptOrder, language),
                        service_id: resolveServiceCode(selectedReceiptOrder),
                        customer_name: profile?.full_name || 'Coop Customer',
                        customer_mobile: profile?.phone || '+91 98401 23456',
                        service_address: selectedReceiptOrder.address_line || 'Velachery, Chennai',
                        base_amount: selectedReceiptOrder.amount || 450,
                        service_charge: selectedReceiptOrder.service_charge || selectedReceiptOrder.amount || 450,
                        materials_parts: selectedReceiptOrder.materials_parts != null ? selectedReceiptOrder.materials_parts : (selectedReceiptOrder.extra_charge_amount || 0),
                        additional_charges: selectedReceiptOrder.additional_charges || 0,
                        subtotal: selectedReceiptOrder.subtotal || (Number(selectedReceiptOrder.amount || 450) + Number(selectedReceiptOrder.extra_charge_amount || 0)),
                        gst_amount: selectedReceiptOrder.gst_amount || Math.round((Number(selectedReceiptOrder.subtotal || selectedReceiptOrder.amount || 450)) * 0.18 * 100) / 100,
                        total_amount: selectedReceiptOrder.final_amount || Math.round(((Number(selectedReceiptOrder.amount || 450) + Number(selectedReceiptOrder.extra_charge_amount || 0)) * 1.18) * 100) / 100,
                        final_amount: selectedReceiptOrder.final_amount || Math.round(((Number(selectedReceiptOrder.amount || 450) + Number(selectedReceiptOrder.extra_charge_amount || 0)) * 1.18) * 100) / 100,
                        scheduled_date: selectedReceiptOrder.preferred_date || new Date().toISOString().split('T')[0],
                        scheduled_time: selectedReceiptOrder.preferred_time || '10:00 AM',
                        payment_method: selectedReceiptOrder.payment_method || 'HAND CASH',
                        payment_gateway_ref: selectedReceiptOrder.payment_gateway_ref || 'CASH-VERIFIED',
                        payment_status: 'PAID',
                        pillar: selectedReceiptOrder.pillar
                    }}
                    onClose={() => setSelectedReceiptOrder(null)}
                />
            )}
        </div>
    );
}
