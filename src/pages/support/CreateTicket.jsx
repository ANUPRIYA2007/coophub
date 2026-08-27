import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../hooks/useTranslation';

export default function CreateTicket() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Internal States explicitly mapping form structures safely
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('general');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!subject.trim() || !description.trim()) {
            setError('Please complete all required fields.');
            return;
        }

        setSubmitting(true);
        const isDemo = localStorage.getItem('coophub_demo_customer') === 'true';

        try {
            if (isDemo) {
                const newTicket = {
                    id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
                    subject: subject.trim(),
                    category: category,
                    description: description.trim(),
                    status: 'open',
                    created_at: new Date().toISOString()
                };
                const existing = JSON.parse(localStorage.getItem('coophub_demo_customer_tickets') || '[]');
                existing.unshift(newTicket);
                localStorage.setItem('coophub_demo_customer_tickets', JSON.stringify(existing));
                navigate('/support/tickets');
                return;
            }

            const { error: insertErr } = await supabase.from('support_tickets').insert({
                customer_id: profile.user_id,
                subject: subject.trim(),
                category: category,
                description: description.trim()
            });

            if (insertErr) throw insertErr;
            navigate('/support/tickets');
        } catch (err) {
            setError(err.message || 'Failed to create support ticket.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface pb-24 pt-6 px-4">
            <div className="max-w-xl mx-auto">
                <div className="flex items-center mb-8">
                    <button onClick={() => navigate('/support')} className="mr-3 text-navy-500 hover:text-navy-800 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <h1 className="heading-3">{t('navigation.create_ticket') || 'Create Support Ticket'}</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-navy-100 shadow-sm space-y-5">
                    {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}

                    <div>
                        <label className="block text-sm font-medium text-navy-700 mb-2">Subject (Required)</label>
                        <input
                            type="text"
                            required
                            maxLength={100}
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="input-field w-full"
                            placeholder="Briefly describe the issue..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-navy-700 mb-2">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="input-field w-full appearance-none bg-white"
                        >
                            <option value="general">General Inquiry</option>
                            <option value="service_issue">Service Issue</option>
                            <option value="billing">Billing & Payment</option>
                            <option value="feedback">Feedback / Suggestion</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-navy-700 mb-2">Description (Required)</label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input-field w-full h-32 resize-none"
                            placeholder="Please provide details to help us resolve this faster..."
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary w-full flex justify-center items-center py-3.5"
                    >
                        {submitting ? (
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            'Submit Ticket'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
