import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { workerService } from '../../services/workers/workerService';
import { Search, MapPin, Star, ShieldCheck, CheckCircle, ArrowRight, User, Wrench, PhoneCall } from 'lucide-react';

export default function Workers() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialTrade = searchParams.get('trade') || '';

    const [pillars, setPillars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTrade, setSelectedTrade] = useState(initialTrade);

    const trades = [
        { id: '', label: 'All Specialists' },
        { id: 'electric', label: 'Electrician' },
        { id: 'plumb', label: 'Plumber' },
        { id: 'ac', label: 'AC & Appliances' },
        { id: 'carpenter', label: 'Carpentry' }
    ];

    useEffect(() => {
        async function loadPillars() {
            setLoading(true);
            try {
                const data = await workerService.getAvailablePillars({
                    category: selectedTrade,
                    lat: 13.0067,
                    lng: 80.2025
                });
                setPillars(data || []);
            } catch (err) {
                console.warn('Worker load note:', err);
            } finally {
                setLoading(false);
            }
        }
        loadPillars();
    }, [selectedTrade]);

    const filtered = pillars.filter(p => {
        const query = searchQuery.toLowerCase();
        return (
            p.full_name.toLowerCase().includes(query) ||
            p.role.toLowerCase().includes(query) ||
            p.trade.toLowerCase().includes(query) ||
            p.service_area.toLowerCase().includes(query)
        );
    });

    return (
        <div className="page-container py-8 max-w-5xl mx-auto px-4">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full uppercase tracking-wider">
                        Verified Workforce
                    </span>
                    <span className="text-xs text-navy-400 font-semibold flex items-center gap-1">
                        <ShieldCheck size={14} className="text-emerald-500" /> Cooperative Guaranteed
                    </span>
                </div>
                <h1 className="text-3xl font-display font-black text-navy-900">
                    Find Certified Cooperative Pillars
                </h1>
                <p className="text-navy-500 text-sm mt-1">
                    Book background-checked, skilled service professionals across Chennai metro zones.
                </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search technician by name, skill, or area..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 outline-none text-sm transition-all shadow-xs"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {trades.map(t => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedTrade(t.id)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                selectedTrade === t.id
                                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                    : 'bg-white text-navy-700 border border-navy-200 hover:bg-navy-50'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pillar Grid */}
            {loading ? (
                <div className="text-center py-16 text-navy-500 font-semibold animate-pulse">
                    Loading verified technicians in your area...
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-navy-100 p-8 shadow-xs">
                    <Wrench size={40} className="text-navy-300 mx-auto mb-3" />
                    <h3 className="font-bold text-navy-800 text-lg">No technicians match your search</h3>
                    <p className="text-navy-500 text-xs mt-1">Try changing your search term or select "All Specialists".</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(p => (
                        <div
                            key={p.id}
                            className="bg-white rounded-2xl border border-navy-100 p-5 shadow-xs hover:shadow-md transition-all hover:border-orange-200 flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 font-black flex items-center justify-center text-lg shrink-0">
                                        {p.avatar_url ? (
                                            <img src={p.avatar_url} alt={p.full_name} className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            p.full_name.charAt(0)
                                        )}
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        p.is_available ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-navy-100 text-navy-500'
                                    }`}>
                                        {p.is_available ? 'Available' : 'Booked'}
                                    </span>
                                </div>

                                <h3 className="font-bold text-navy-900 text-base group-hover:text-orange-600 transition-colors">
                                    {p.full_name}
                                </h3>
                                <p className="text-xs font-semibold text-orange-600 mb-2">{p.role}</p>

                                <div className="space-y-1.5 text-xs text-navy-600 mb-4 pt-2 border-t border-navy-100/60">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1 font-bold text-amber-500">
                                            <Star size={13} fill="currentColor" /> {p.rating}
                                        </span>
                                        <span className="text-navy-400">({p.completed_jobs} orders)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-navy-500">
                                        <MapPin size={13} className="text-navy-400 shrink-0" />
                                        <span>{p.service_area} (~{p.distance} km)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-navy-100 flex items-center justify-between gap-2">
                                <div>
                                    <span className="text-[10px] text-navy-400 block">Starting from</span>
                                    <span className="font-mono font-black text-navy-900 text-sm">₹{p.starting_price}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/services?pillar=${p.id}`)}
                                    className="px-3.5 py-2 bg-navy-900 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                                >
                                    Book Now <ArrowRight size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
