import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workerService } from '../../services/workers/workerService';
import { Star, ShieldCheck, MapPin, Wrench, CheckCircle, ArrowLeft, ArrowRight, Phone, Award, Sparkles, Building, Clock } from 'lucide-react';

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
                Loading certified specialist profile...
            </div>
        );
    }

    if (!pillar) {
        return (
            <div className="page-container py-16 text-center max-w-md mx-auto">
                <h2 className="text-xl font-bold text-navy-800 mb-2">Specialist Not Found</h2>
                <p className="text-xs text-navy-500 mb-6">The requested certified pillar profile could not be loaded.</p>
                <button
                    onClick={() => navigate('/workers')}
                    className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold"
                >
                    Browse All Specialists
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
                <ArrowLeft size={16} /> Back to Workforce Directory
            </button>

            <div className="bg-white rounded-3xl border border-navy-100 p-6 sm:p-8 shadow-xs">
                {/* Header Card */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-navy-100">
                    <div className="w-24 h-24 rounded-2xl bg-orange-100 text-orange-600 font-black text-3xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                        {pillar.avatar_url ? (
                            <img
                                src={pillar.avatar_url}
                                alt={pillar.full_name}
                                className="w-full h-full object-cover rounded-2xl"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        ) : (
                            pillar.full_name.charAt(0)
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <ShieldCheck size={12} /> {pillar.verification_status || 'Verified Cooperative Pillar'}
                            </span>
                            <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                                {pillar.pillar_code}
                            </span>
                        </div>
                        <h1 className="text-2xl font-black text-navy-900">{pillar.full_name}</h1>
                        <p className="text-sm font-semibold text-navy-600 mt-0.5">{pillar.trade}</p>
                        
                        {/* Sub-Service Tag */}
                        <div className="mt-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-orange-500 text-white shadow-xs">
                                <Sparkles size={13} /> Specialist: {pillar.sub_service || (pillar.sub_services && pillar.sub_services[0])}
                            </span>
                        </div>
                    </div>

                    <div className="text-right sm:self-center mt-2 sm:mt-0">
                        <span className="text-xs text-navy-400 block">Standard Tariff</span>
                        <span className="font-mono font-black text-2xl text-navy-900">₹{pillar.starting_price}</span>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-4 py-6 border-b border-navy-100 text-center">
                    <div>
                        <span className="text-xs text-navy-400 block mb-1">Customer Rating</span>
                        <span className="font-black text-lg text-amber-500 flex items-center justify-center gap-1">
                            <Star size={16} fill="currentColor" /> {pillar.rating}
                        </span>
                        <span className="text-[10px] text-navy-400">({pillar.total_reviews || 48} verified reviews)</span>
                    </div>
                    <div>
                        <span className="text-xs text-navy-400 block mb-1">Completed Jobs</span>
                        <span className="font-black text-lg text-navy-900">{pillar.completed_jobs}+</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">100% On-time</span>
                    </div>
                    <div>
                        <span className="text-xs text-navy-400 block mb-1">Experience</span>
                        <span className="font-black text-lg text-navy-900">{pillar.experience_years} Years</span>
                        <span className="text-[10px] text-navy-400">Chennai Certified</span>
                    </div>
                </div>

                {/* Location & Credentials */}
                <div className="py-6 space-y-4">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-navy-400 mb-2">Location & Coverage</h3>
                        <div className="bg-navy-50/60 border border-navy-100 rounded-2xl p-4 space-y-2 text-xs text-navy-800">
                            <div className="flex items-start gap-2">
                                <MapPin size={15} className="text-orange-500 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold block text-navy-900">{pillar.address}</span>
                                    <span className="text-navy-500">Zone: {pillar.area} | Pincode: {pillar.pincode}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-1 border-t border-navy-100 text-navy-600">
                                <Building size={14} className="text-navy-400 shrink-0" />
                                <span>Service Coverage: <strong>{pillar.service_area}</strong></span>
                            </div>
                            {pillar.mobile && (
                                <div className="flex items-center gap-2 pt-1 border-t border-navy-100 text-navy-700">
                                    <Phone size={14} className="text-emerald-600 shrink-0" />
                                    <span>Verified Contact: <strong className="font-mono text-emerald-700">+91 {pillar.mobile}</strong></span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-navy-400 mb-2">Cooperative Quality Guarantee</h3>
                        <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-4 space-y-2 text-xs text-navy-700">
                            <div className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                                <span>100% Verified Government Identity & Aadhaar KYC Authenticated</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                                <span>Cooperative Standard Fixed Tariffs & No Hidden Convenience Fees</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                                <span>30-Day Service Guarantee backed by Cooperative Welfare Fund</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-navy-100 flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(`/services?pillar=${pillar.id || pillar.pillar_code}`)}
                        className="btn-primary flex-1 py-3.5 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                    >
                        Book {pillar.full_name} Now <ArrowRight size={16} />
                    </button>
                    {pillar.mobile && (
                        <a
                            href={`tel:+91${pillar.mobile}`}
                            className="px-5 py-3.5 bg-navy-100 hover:bg-navy-200 text-navy-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                        >
                            <Phone size={15} /> Call Specialist
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
