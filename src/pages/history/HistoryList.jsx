import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { serviceRequestService } from '../../services/customer/serviceRequestService';
import { useTranslation } from '../../hooks/useTranslation';
import { ArrowLeft, Clock, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import OrderReceiptModal from '../../components/common/OrderReceiptModal';

export default function HistoryList() {
    const { profile } = useAuth();
    const { t, language } = useTranslation();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

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

    if (loading) {
        return (
            <div className="min-h-screen bg-surface p-6 flex flex-col space-y-4 max-w-3xl mx-auto pt-20">
                <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-1/3 mb-6 animate-pulse"></div>
                {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-200 dark:bg-slate-800 rounded-2xl w-full animate-pulse"></div>)}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-24 pt-6 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Header with Total Services Badge */}
                <div className="flex items-center justify-between border-b border-navy-100/60 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate('/home')} 
                            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-navy-100 dark:border-slate-800 text-navy-500 hover:text-orange-500 transition-colors shadow-2xs"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="font-extrabold text-navy-900 dark:text-white text-xl sm:text-2xl tracking-tight">
                                    {t('History')}
                                </h1>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900">
                                    Total: {history.length} {history.length === 1 ? 'Service' : 'Services'}
                                </span>
                            </div>
                            <p className="text-xs text-navy-500 dark:text-slate-400 mt-0.5">
                                Review your past completed bookings and download official tax receipts.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Metrics Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-slate-900 border border-navy-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                        <span className="text-2xl font-black text-navy-900 dark:text-white block font-mono">
                            {history.length}
                        </span>
                        <span className="text-xs font-semibold text-navy-500 dark:text-slate-400 mt-0.5 block">
                            Total Services
                        </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-navy-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block font-mono">
                            {completedCount}
                        </span>
                        <span className="text-xs font-semibold text-navy-500 dark:text-slate-400 mt-0.5 block">
                            Completed Jobs
                        </span>
                    </div>

                    <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 border border-navy-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-center">
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                            <ShieldCheck size={14} /> 100% Protected
                        </span>
                        <span className="text-[11px] font-medium text-navy-500 dark:text-slate-400 mt-0.5">
                            Cooperative Fair Rates (0% Surge)
                        </span>
                    </div>
                </div>

                {history.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-navy-100 dark:border-slate-800 shadow-sm mt-8">
                        <div className="w-20 h-20 bg-navy-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock size={32} className="text-navy-300" />
                        </div>
                        <h3 className="font-semibold text-lg text-navy-800 dark:text-white">{t('No service history')}</h3>
                        <p className="text-navy-500 dark:text-slate-400 mt-2 text-sm">{t("You don't have any completed or cancelled services yet.")}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map(req => {
                            const serviceName = req.services?.name_translations?.[language] || req.services?.name_translations?.['en'] || req.services?.name || 'Service';
                            const subName = req.sub_services?.name_translations?.[language] || req.sub_services?.name_translations?.['en'] || req.sub_services?.name || '';
                            const isCompleted = req.status === 'completed';

                            const orderCode = req.booking_code || req.order_code || (
                                String(req.id).startsWith('REQ-') || String(req.id).startsWith('ORD-') 
                                    ? req.id 
                                    : `ORD-${String(req.id).substring(0, 8).toUpperCase()}`
                            );

                            const serviceCode = req.service_code || req.services?.service_code || (
                                req.service_id 
                                    ? (String(req.service_id).toUpperCase().startsWith('SRV-') 
                                        ? String(req.service_id).toUpperCase() 
                                        : `SRV-${String(req.service_id).substring(0, 6).toUpperCase()}`)
                                    : (req.services?.id 
                                        ? (String(req.services.id).toUpperCase().startsWith('SRV-') 
                                            ? String(req.services.id).toUpperCase() 
                                            : (req.services.id === 'srv-1' ? 'SRV-ELEC-101' : req.services.id === 'srv-2' ? 'SRV-AC-202' : `SRV-${String(req.services.id).substring(0, 6).toUpperCase()}`)) 
                                        : 'SRV-ELEC-101')
                            );

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
                                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-navy-100 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none transition-colors" style={{ backgroundColor: isCompleted ? '#22c55e' : '#ef4444' }}></div>

                                    {/* Top Row: Order ID & Service ID & Status */}
                                    <div className="flex items-center justify-between gap-2 mb-3.5 flex-wrap relative z-10">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2.5 py-1 rounded-lg border border-orange-200/80 dark:border-orange-900 shadow-2xs">
                                                Order: #{orderCode}
                                            </span>
                                            <span className="text-xs font-mono font-bold text-navy-700 dark:text-slate-300 bg-navy-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-navy-100 dark:border-slate-700">
                                                Service ID: {serviceCode}
                                            </span>
                                        </div>
                                        <span className={`px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-full border ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {t(req.status.replace('_', ' '))}
                                        </span>
                                    </div>

                                    {/* Service Titles */}
                                    <div className="mb-3 relative z-10">
                                        <h3 className="font-bold text-navy-900 dark:text-white text-lg group-hover:text-orange-600 transition-colors">
                                            {t(serviceName)}
                                        </h3>
                                        {subName && <p className="text-xs sm:text-sm text-navy-500 dark:text-slate-400 mt-0.5">{t(subName)}</p>}
                                    </div>

                                    {/* Footer: Date & View Receipt Button */}
                                    <div className="flex items-center justify-between text-xs text-navy-500 dark:text-slate-400 mt-4 pt-3.5 border-t border-navy-50 dark:border-slate-800 relative z-10 flex-wrap gap-2">
                                        <div className="flex items-center text-navy-400 dark:text-slate-400">
                                            <Clock size={14} className="mr-1.5" />
                                            <span>Completed on {new Date(req.created_at).toLocaleDateString()}</span>
                                        </div>

                                        {isCompleted && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedReceiptOrder(req);
                                                }}
                                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                                            >
                                                <FileText size={13} />
                                                <span>View Receipt</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Official Order Receipt Modal */}
            {selectedReceiptOrder && (
                <OrderReceiptModal
                    order={{
                        ...selectedReceiptOrder,
                        id: selectedReceiptOrder.id,
                        booking_code: selectedReceiptOrder.booking_code || selectedReceiptOrder.order_code || (String(selectedReceiptOrder.id).startsWith('REQ-') || String(selectedReceiptOrder.id).startsWith('ORD-') ? selectedReceiptOrder.id : `ORD-${String(selectedReceiptOrder.id).slice(0, 6).toUpperCase()}`),
                        service_name: selectedReceiptOrder.services?.name || selectedReceiptOrder.service_name || 'Cooperative Service',
                        sub_service_name: selectedReceiptOrder.sub_services?.name || selectedReceiptOrder.sub_service_name || '',
                        service_id: selectedReceiptOrder.service_code || (selectedReceiptOrder.services?.id ? (selectedReceiptOrder.services.id === 'srv-1' ? 'SRV-ELEC-101' : selectedReceiptOrder.services.id === 'srv-2' ? 'SRV-AC-202' : `SRV-${String(selectedReceiptOrder.services.id).toUpperCase()}`) : 'SRV-ELEC-101'),
                        customer_name: profile?.full_name || 'Coop Customer',
                        customer_mobile: profile?.phone || '+91 98401 23456',
                        service_address: selectedReceiptOrder.address_line || 'Velachery, Chennai',
                        base_amount: selectedReceiptOrder.amount || 450,
                        extra_charge_amount: selectedReceiptOrder.extra_charge_amount || 0,
                        extra_charge_reason: selectedReceiptOrder.extra_charge_reason || '',
                        total_amount: selectedReceiptOrder.final_amount || selectedReceiptOrder.amount || 450,
                        final_amount: selectedReceiptOrder.final_amount || selectedReceiptOrder.amount || 450,
                        scheduled_date: selectedReceiptOrder.preferred_date || '09 Sep 2026',
                        scheduled_time: selectedReceiptOrder.preferred_time || '02:00 PM',
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
