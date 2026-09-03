import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workerService } from '../../services/workers/workerService';
import { Star, ShieldCheck, MapPin, Wrench, CheckCircle, ArrowLeft, ArrowRight, Phone, Award } from 'lucide-react';

export default function WorkerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pillar, setPillar] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDetail() {
            setLoading(true);
            try {
                const data = await workerService.getPillarById(id);
                setPillar(data);
            } catch (err) {
                console.warn('Worker detail note:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchDetail();
    }, [id]);

    if (loading) {
        return (
            <div className="page-container py-16 text-center text-navy-400 font-bold animate-pulse">
                Loading technician profile...
            </div>
        );
    }

    if (!pillar) {
        return (
            <div className="page-container py-16 text-center max-w-md mx-auto">
                <h2 className="text-xl font-bold text-navy-800 mb-2">Technician Not Found</h2>
                <p className="text-xs text-navy-500 mb-6">The requested technician profile could not be loaded.</p>
                <button
                    onClick={() => navigate('/workers')}
                    className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold"
                >
                    Browse All Technicians
                </button>
            </div>
        );
    }

    return (
        <div className="page-container py-8 max-w-3xl mx-auto px-4">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-xs font-bold text-navy-500 hover:text-navy-900 mb-6 transition-colors"
            >
                <ArrowLeft size={16} /> Back to Directory
            </button>

            <div className="bg-white rounded-3xl border border-navy-100 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-navy-100">
                    <div className="w-20 h-20 rounded-2xl bg-orange-100 text-orange-600 font-black text-2xl flex items-center justify-center shrink-0 shadow-sm">
                        {pillar.full_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <ShieldCheck size={12} /> {pillar.verification_status}
                            </span>
                            <span className="text-xs text-navy-400 font-mono">{pillar.pillar_code}</span>
                        </div>
                        <h1 className="text-2xl font-black text-navy-900">{pillar.full_name}</h1>
                        <p className="text-sm font-semibold text-orange-600 mt-0.5">{pillar.role}</p>
                    </div>

                    <div className="text-right sm:self-center">
                        <span className="text-xs text-navy-400 block">Starting Tariff</span>
                        <span className="font-mono font-black text-2xl text-navy-900">₹{pillar.starting_price}</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-6 border-b border-navy-100 text-center">
                    <div>
                        <span className="text-xs text-navy-400 block mb-1">Customer Rating</span>
                        <span className="font-black text-lg text-amber-500 flex items-center justify-center gap-1">
                            <Star size={16} fill="currentColor" /> {pillar.rating}
                        </span>
                    </div>
                    <div>
                        <span className="text-xs text-navy-400 block mb-1">Completed Orders</span>
                        <span className="font-black text-lg text-navy-900">{pillar.completed_jobs}+</span>
                    </div>
                    <div>
                        <span className="text-xs text-navy-400 block mb-1">Experience</span>
                        <span className="font-black text-lg text-navy-900">{pillar.experience_years} Years</span>
                    </div>
                </div>

                <div className="py-6 space-y-4">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-navy-400 mb-2">Service Specialization</h3>
                        <p className="text-sm font-medium text-navy-800">{pillar.trade}</p>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-navy-400 mb-2">Cooperative Quality Guarantee</h3>
                        <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-4 space-y-2 text-xs text-navy-700">
                            <div className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                                <span>100% Verified Government Identity & Aadhaar KYC</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                                <span>Cooperative Standard Fixed Tariffs & Transparent Pricing</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                                <span>30-Day Service Guarantee backed by Cooperative Welfare Fund</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-navy-100 flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(`/services?pillar=${pillar.id}`)}
                        className="btn-primary flex-1 py-3.5 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 text-sm font-bold"
                    >
                        Book This Technician <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
