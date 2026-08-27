import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';

export default function ReviewForm({ requestId }) {
    const { profile } = useAuth();
    const { t } = useTranslation();
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [existingReview, setExistingReview] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkReviewStatus = async () => {
            if (!profile?.user_id || !requestId) return;
            try {
                const { data, error } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('request_id', requestId)
                    .eq('customer_id', profile.user_id)
                    .maybeSingle(); // Does not throw error if 0 rows

                if (data) {
                    setHasReviewed(true);
                    setExistingReview(data);
                }
            } catch (err) {
                console.error('Error checking review status', err);
            }
        };
        checkReviewStatus();
    }, [requestId, profile]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating < 1 || rating > 5) return;
        setSubmitting(true);
        setError(null);

        const isDemo = localStorage.getItem('coophub_demo_customer') === 'true';
        if (isDemo) {
            setHasReviewed(true);
            setExistingReview({ rating, feedback, created_at: new Date().toISOString() });
            setSubmitting(false);
            return;
        }

        try {
            const { error: insertErr } = await supabase.from('reviews').insert({
                request_id: requestId,
                customer_id: profile.user_id,
                rating,
                feedback: feedback.trim() || null
            });

            if (insertErr) {
                if (insertErr.code === '23505') { // Unique violation
                    throw new Error('You have already submitted a review for this service.');
                }
                throw insertErr;
            }

            setHasReviewed(true);
            setExistingReview({ rating, feedback, created_at: new Date().toISOString() });
        } catch (err) {
            setError(err.message || 'Failed to submit review.');
        } finally {
            setSubmitting(false);
        }
    };

    if (hasReviewed && existingReview) {
        return (
            <div className="mt-8 bg-green-50/50 border border-green-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <h3 className="font-bold text-green-900">Review Submitted</h3>
                </div>
                <div className="flex mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className={`w-5 h-5 ${star <= existingReview.rating ? 'text-orange-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                </div>
                {existingReview.feedback && <p className="text-sm text-green-800 italic bg-white/50 p-3 rounded-xl">"{existingReview.feedback}"</p>}
            </div>
        );
    }

    return (
        <div className="mt-8 bg-white border border-navy-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <h3 className="font-semibold text-navy-800 mb-2">Leave a Review</h3>
            <p className="text-sm text-navy-500 mb-6">Your feedback helps us continuously improve our cooperative.</p>

            {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            type="button"
                            key={star}
                            className={`p-1 transition-transform ${hover >= star || rating >= star ? 'scale-110' : 'scale-100'}`}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(rating)}
                        >
                            <svg className={`w-10 h-10 transition-colors ${hover >= star || rating >= star ? 'text-orange-400' : 'text-gray-200 hover:text-orange-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </button>
                    ))}
                </div>

                {rating > 0 && (
                    <div className="animate-fade-in-up">
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Share your experience (Optional)"
                            className="w-full bg-gray-50 border border-navy-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none h-24 transition-all"
                            maxLength={500}
                        ></textarea>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary w-full mt-4 flex justify-center items-center h-12"
                        >
                            {submitting ? (
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                "Submit Review"
                            )}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
