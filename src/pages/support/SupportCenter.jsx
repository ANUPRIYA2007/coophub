import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../hooks/useTranslation';

export default function SupportCenter() {
    const navigate = useNavigate();
    const { t, language } = useTranslation();
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openFaq, setOpenFaq] = useState(null);

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const { data, error } = await supabase
                    .from('faq')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                setFaqs(data || []);
            } catch (err) {
                console.error("Failed to load FAQs");
            } finally {
                setLoading(false);
            }
        };
        fetchFaqs();
    }, []);

    const toggleFaq = (id) => {
        setOpenFaq(openFaq === id ? null : id);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface p-6 flex flex-col space-y-4 max-w-2xl mx-auto pt-20">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded-xl w-full animate-pulse"></div>)}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-24 pt-6 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center mb-8">
                    <button onClick={() => navigate('/home')} className="mr-3 text-navy-500 hover:text-navy-800 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <h1 className="heading-3">{t('Help & Support')}</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    <button onClick={() => navigate('/support/new')} className="bg-white p-5 rounded-2xl border border-navy-100 shadow-sm hover:shadow-md transition-all text-left flex items-start space-x-4">
                        <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-navy-800">{t('Contact Support')}</h3>
                            <p className="text-sm text-navy-500 mt-1">{t('Open a new support ticket.')}</p>
                        </div>
                    </button>

                    <button onClick={() => navigate('/support/tickets')} className="bg-white p-5 rounded-2xl border border-navy-100 shadow-sm hover:shadow-md transition-all text-left flex items-start space-x-4">
                        <div className="p-3 bg-navy-50 text-navy-500 rounded-xl">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-navy-800">{t('My Tickets')}</h3>
                            <p className="text-sm text-navy-500 mt-1">{t('Check status of your active queries.')}</p>
                        </div>
                    </button>
                </div>

                <h2 className="font-bold text-navy-800 mb-4 text-lg border-b border-navy-100 pb-2">{t('Frequently Asked Questions')}</h2>

                {faqs.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-navy-100 shadow-sm mt-4">
                        <p className="text-navy-500 text-sm">{t('No FAQs available yet.')}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {faqs.map((faq) => {
                            const question = faq.question_translations?.[language] || faq.question_translations?.['en'] || 'Question';
                            const answer = faq.answer_translations?.[language] || faq.answer_translations?.['en'] || 'Answer';
                            const isOpen = openFaq === faq.id;

                            return (
                                <div key={faq.id} className="bg-white border border-navy-100 rounded-xl overflow-hidden transition-all">
                                    <button
                                        className="w-full text-left p-4 font-medium text-navy-800 hover:bg-navy-50 flex justify-between items-center focus:outline-none"
                                        onClick={() => toggleFaq(faq.id)}
                                    >
                                        <span>{question}</span>
                                        <svg className={`w-5 h-5 text-navy-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                    {isOpen && (
                                        <div className="p-4 pt-0 text-navy-600 text-sm bg-navy-50 border-t border-navy-50">
                                            {answer}
                                        </div>
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
