import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, CheckCircle2, FileText, X } from 'lucide-react';

export default function KycConsentModal({ isOpen, onClose, onConsentAccepted }) {
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!agreed) {
      setError('You must agree to the identity verification terms to proceed.');
      return;
    }

    const consentRecord = {
      consent_granted: true,
      timestamp: new Date().toISOString(),
      purpose: 'COOP_HUB_PILLAR_ONBOARDING_VERIFICATION',
      version: 'v2.0_AUTHORITATIVE',
      ip_recorded: true
    };

    onConsentAccepted(consentRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Identity Verification Consent
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Statutory Electronic KYC & Skill Authorization
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto text-sm text-slate-600 dark:text-slate-300">
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3">
            <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-blue-900 dark:text-blue-200">
              <strong>Your privacy is strictly protected.</strong> Under the Aadhaar Act, 2016 and IT Rules, COOP HUB collects verification data solely for onboarding skilled technicians and dispensing emergency work allocations.
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Terms of Consent:
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Purpose of Verification:</strong> Confirming legal identity, eligibility to work, and trade skill certifications for cooperative work dispatch.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Authoritative Digital Verification:</strong> You authorize COOP HUB to verify your UIDAI Secure QR code, DigiLocker records, or official identity documents.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Data Masking & Security:</strong> Aadhaar numbers are permanently masked (only last 4 digits stored: <code>XXXX-XXXX-1234</code>). Documents are encrypted in transit and at rest.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Zero Third-Party Sharing:</strong> Your identity documents are never sold, traded, or shared with unauthorized commercial entities.</span>
              </li>
            </ul>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                if (error) setError(null);
              }}
              className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">
              I voluntary give consent to COOP HUB to verify my identity and trade credentials using UIDAI Secure QR or Government verification pipelines.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!agreed}
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Confirm & Proceed</span>
          </button>
        </div>
      </div>
    </div>
  );
}
