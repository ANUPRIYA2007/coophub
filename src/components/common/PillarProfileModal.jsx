import React from 'react';
import { X, Star, ShieldCheck, MapPin, Briefcase, Award, Clock } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export default function PillarProfileModal({ pillar, distanceKm, etaMins, onClose }) {
    const { t } = useTranslation();

    if (!pillar) return null;

    const mainServices = Array.isArray(pillar.main_services) ? pillar.main_services : [pillar.main_services || ''];
    const subServices = Array.isArray(pillar.sub_services) ? pillar.sub_services : [];
    const certs = Array.isArray(pillar.certified_skills) ? pillar.certified_skills : [];

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative animate-slide-up">
                
                {/* Header Actions */}
                <div className="sticky top-0 z-10 flex justify-end p-4">
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-black/10 backdrop-blur-md flex items-center justify-center hover:bg-black/20 text-navy-900 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Profile Header Block */}
                <div className="px-6 pb-6 text-center -mt-8">
                    <div className="w-24 h-24 rounded-full mx-auto bg-orange-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative">
                        <img 
                            src={pillar.profile_image || "/assets/images/mascot-hero.png"} 
                            alt={pillar.full_name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/src/assets/branding/mascot-ai.png'; }}
                        />
                        {pillar.is_verified && (
                            <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                <ShieldCheck size={12} className="text-white" />
                            </div>
                        )}
                    </div>

                    <h2 className="text-xl font-bold text-navy-900 mt-4 leading-tight">{pillar.full_name}</h2>
                    <p className="text-sm font-medium text-navy-600 mt-0.5">{t(pillar.role || 'Certified Cooperative Technician')}</p>

                    <div className="flex items-center justify-center space-x-4 mt-4">
                        <div className="text-center">
                            <div className="flex items-center justify-center space-x-1 text-amber-500 font-bold text-base">
                                <Star size={16} className="fill-amber-400" />
                                <span>{pillar.rating || 5.0}</span>
                            </div>
                            <span className="text-[10px] text-navy-500 font-medium uppercase tracking-wider">Rating</span>
                        </div>
                        <div className="w-px h-8 bg-navy-100"></div>
                        <div className="text-center">
                            <div className="flex items-center justify-center space-x-1 text-navy-800 font-bold text-base">
                                <Briefcase size={16} className="text-navy-500" />
                                <span>{pillar.total_completed_jobs || pillar.reviews_count || 0}</span>
                            </div>
                            <span className="text-[10px] text-navy-500 font-medium uppercase tracking-wider">Jobs</span>
                        </div>
                        <div className="w-px h-8 bg-navy-100"></div>
                        <div className="text-center">
                            <div className="flex items-center justify-center space-x-1 text-emerald-600 font-bold text-base">
                                <Clock size={16} />
                                <span>{pillar.experience_years || '2+'} Yrs</span>
                            </div>
                            <span className="text-[10px] text-navy-500 font-medium uppercase tracking-wider">Exp</span>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="bg-navy-50 flex-1 px-6 py-6 space-y-6">
                    
                    {/* Live Tracking Status */}
                    <div className="bg-white rounded-2xl p-4 border border-navy-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-navy-500 font-bold uppercase tracking-wider">Live Distance</p>
                                <p className="text-sm font-bold text-navy-900 mt-0.5">
                                    {distanceKm !== null ? `${distanceKm} km` : 'Location Unavailable'}
                                </p>
                            </div>
                        </div>
                        {distanceKm !== null && (
                            <div className="text-right">
                                <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Estimated ETA</p>
                                <p className="text-sm font-mono font-bold text-navy-900 mt-0.5">
                                    {etaMins === 0 ? 'Arrived' : `~${etaMins} mins`}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Skills & Certs */}
                    <div>
                        <h3 className="text-sm font-bold text-navy-900 mb-3 flex items-center gap-2">
                            <Award size={16} className="text-orange-500" />
                            Verified Skills & Certifications
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-navy-500 mb-1.5">Primary Skill</p>
                                <div className="flex flex-wrap gap-2">
                                    {mainServices.map((s, i) => (
                                        s && <span key={i} className="px-3 py-1 bg-navy-100 text-navy-800 text-xs font-bold rounded-lg">{s}</span>
                                    ))}
                                </div>
                            </div>
                            
                            {subServices.length > 0 && (
                                <div>
                                    <p className="text-xs text-navy-500 mb-1.5">Specialties</p>
                                    <div className="flex flex-wrap gap-2">
                                        {subServices.map((s, i) => (
                                            s && <span key={i} className="px-2.5 py-1 bg-white border border-navy-200 text-navy-600 text-xs font-medium rounded-lg">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {certs.length > 0 && (
                                <div>
                                    <p className="text-xs text-navy-500 mb-1.5">Platform Certifications</p>
                                    <div className="space-y-2">
                                        {certs.map((c, i) => (
                                            <div key={i} className="flex items-center space-x-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                                                <ShieldCheck size={14} className="shrink-0" />
                                                <span>{c}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-white border-t border-navy-50">
                    <button 
                        onClick={onClose}
                        className="w-full btn-primary py-3.5 rounded-xl text-sm font-bold shadow-md shadow-orange-500/20"
                    >
                        Close Profile
                    </button>
                </div>
            </div>
        </div>
    );
}
