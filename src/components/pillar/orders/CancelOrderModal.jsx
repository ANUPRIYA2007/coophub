import React, { useState } from 'react';
import { useTranslation } from '../../../i18n/useTranslation';
import { X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export default function CancelOrderModal({ isOpen, onClose, onConfirm, order, isSubmitting }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen || !order) return null;

  const predefinedReasons = [
    "Vehicle breakdown or travel issue",
    "Customer unreachable",
    "Service location unsafe or inaccessible",
    "Missing required tools/materials for this specific job",
    "Personal emergency",
    "Other"
  ];

  const handleSubmit = () => {
    setError(null);
    const finalReason = reason === 'Other' ? otherReason : reason;
    
    if (!finalReason || finalReason.trim() === '') {
      setError("Please provide a reason for cancellation.");
      return;
    }

    onConfirm(finalReason.trim());
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-slide-up">
        {/* Header */}
        <div className="bg-red-50 p-5 border-b border-red-100 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <AlertTriangle size={20} className="stroke-[2.5]" />
              <h2 className="font-bold text-lg">Cancel Order</h2>
            </div>
            <p className="text-red-800/70 text-xs">
              Cancelling an active order may impact your pillar reliability score.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-600 hover:bg-red-100 p-1.5 rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Order</p>
            <p className="font-bold text-slate-800">{order.booking_code}</p>
            <p className="text-sm text-slate-600 truncate">{t(order.service_name)}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Reason for cancellation <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {predefinedReasons.map((r, idx) => (
                <label key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="radio"
                      name="cancel_reason"
                      value={r}
                      checked={reason === r}
                      onChange={(e) => setReason(e.target.value)}
                      className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-full checked:border-red-500 checked:bg-red-50 cursor-pointer transition-colors"
                    />
                    <CheckCircle2 size={12} className="absolute text-red-500 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <span className={`text-sm ${reason === r ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {reason === 'Other' && (
            <div className="animate-fade-in mt-3">
              <textarea
                className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:border-red-400 focus:ring-4 focus:ring-red-400/20 outline-none transition-all"
                rows="3"
                placeholder="Please describe the reason in detail..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
              />
            </div>
          )}

          {error && <p className="text-red-500 text-xs font-semibold mt-2 animate-shake">{error}</p>}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-100 hover:text-slate-800 transition-all text-sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Go Back
          </button>
          <button
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-md shadow-red-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason}
          >
            {isSubmitting ? (
              <><Loader2 size={16} className="animate-spin" /> Cancelling...</>
            ) : (
              "Confirm Cancellation"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
