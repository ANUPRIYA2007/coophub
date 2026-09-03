import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../context/AuthContext';
import { useServices } from '../../hooks/useServices';
import { serviceRequestService } from '../../services/customer/serviceRequestService';
import { attachmentService } from '../../services/customer/attachmentService';
import { locationService } from '../../services/customer/locationService';
import { workerService } from '../../services/workers/workerService';
import LocationPickerModal from '../../components/maps/LocationPickerModal';
import {
    MapPin, AlertTriangle, CheckCircle2, Home, ShoppingBag,
    Star, ShieldCheck, Sparkles, UserCheck, Check, Clock
} from 'lucide-react';

export default function ServiceRequest() {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { services, subServices, loading: catLoading } = useServices();
    const { t } = useTranslation();

    const targetServiceId = params.id || params.serviceId;
    const targetSubServiceId = params.subServiceId || searchParams.get('sub');
    const paramPillarId = searchParams.get('pillar') || 'auto_match';

    const serviceInfo = (services || []).find(s => 
        s.id === targetServiceId || 
        s.service_code?.toLowerCase() === targetServiceId?.toLowerCase() ||
        s.category?.toLowerCase() === targetServiceId?.toLowerCase() ||
        s.name?.toLowerCase() === targetServiceId?.toLowerCase()
    ) || (services && services.length > 0 ? services[0] : null);

    const subServiceInfo = (subServices || []).find(s => s.id === targetSubServiceId) ||
                           (subServices || []).find(s => s.service_id === serviceInfo?.id) ||
                           null;

    // Form States
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        location_type: 'manual',
        address_line: '', area: '', city: '', state: '', postal_code: '',
        latitude: null, longitude: null,
        preferred_date: '', preferred_time: '', flexible_timing: false,
        is_emergency: false,
        customer_description: '',
        attachments: []
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Pillar Discovery States (Phase 2)
    const [availablePillars, setAvailablePillars] = useState([]);
    const [selectedPillarId, setSelectedPillarId] = useState(paramPillarId);
    const [loadingPillars, setLoadingPillars] = useState(false);

    // Load available pillars when reaching step 3 or when service/coords ready
    const loadPillars = async () => {
        setLoadingPillars(true);
        try {
            const data = await workerService.getAvailablePillars({
                category: serviceInfo?.category || serviceInfo?.name || '',
                serviceName: serviceInfo?.name || '',
                lat: formData.latitude || 13.0067,
                lng: formData.longitude || 80.2025
            });
            setAvailablePillars(data || []);
            if (paramPillarId !== 'auto_match' && data.some(p => p.id === paramPillarId)) {
                setSelectedPillarId(paramPillarId);
            }
        } catch (err) {
            console.warn('Pillars load note:', err);
        } finally {
            setLoadingPillars(false);
        }
    };

    if (catLoading) {
        return (
            <div className="min-h-screen bg-surface p-8 flex items-center justify-center">
                <div className="text-center font-bold text-navy-600">Loading booking catalogue...</div>
            </div>
        );
    }

    if (!serviceInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface p-6 text-center">
                <div className="card p-8 max-w-md w-full shadow-xl bg-white rounded-3xl border border-navy-100">
                    <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-navy-900 mb-2">Service Unavailable</h2>
                    <p className="text-navy-500 text-sm mb-6">The requested service is not currently available for booking.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button type="button" onClick={() => navigate('/services')} className="btn-primary py-3 px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                            <ShoppingBag size={16} /> Browse Services
                        </button>
                        <button type="button" onClick={() => navigate('/home')} className="py-3 px-5 rounded-xl border border-navy-200 text-navy-700 hover:bg-navy-50 font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                            <Home size={16} /> Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleMapLocationConfirmed = (loc) => {
        setFormData(prev => ({
            ...prev,
            location_type: 'google_map',
            latitude: loc.latitude,
            longitude: loc.longitude,
            address_line: loc.address_line,
            area: loc.area || prev.area,
            city: loc.city || prev.city,
            state: loc.state || prev.state,
            postal_code: loc.postal_code || prev.postal_code
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formError = attachmentService.validateFile(file);
        if (formError) {
            setError(formError);
            return;
        }
        setError(null);
        setSelectedFile(file);
    };

    const nextStep = () => {
        setError(null);
        if (step === 1) { // Validate Location
            if (!formData.address_line && !formData.latitude) {
                setError('Please choose your service location on Google Map or enter your address.');
                return;
            }
        }
        if (step === 2) { // Validate Schedule
            if (!formData.is_emergency && !formData.flexible_timing && (!formData.preferred_date || !formData.preferred_time)) {
                setError('Please provide preferred date and time, or check flexible timing.');
                return;
            }
            loadPillars();
        }
        setStep(p => p + 1);
    };

    const submitRequest = async () => {
        setError(null);
        setIsSubmitting(true);
        try {
            let uploadedAttachments = [];
            if (selectedFile) {
                const path = await attachmentService.uploadAttachment(selectedFile, profile?.user_id);
                uploadedAttachments.push(path);
            }

            const chosenPillar = availablePillars.find(p => p.id === selectedPillarId);

            const payload = {
                service_id: serviceInfo?.id || targetServiceId,
                sub_service_id: subServiceInfo?.id || targetSubServiceId || null,
                service_name: serviceInfo.name,
                category: serviceInfo.category || serviceInfo.name,
                pillar_id: selectedPillarId !== 'auto_match' ? selectedPillarId : null,
                pillar_name: chosenPillar?.full_name || null,
                amount: chosenPillar?.starting_price || subServiceInfo?.base_price || 450,
                ...formData,
                attachments: uploadedAttachments
            };

            const requestId = await serviceRequestService.createServiceRequest(payload);
            navigate(`/requests/${requestId}`);

        } catch (err) {
            setError(err.message || 'Failed to submit request.');
            setIsSubmitting(false);
        }
    };

    const chosenPillarDetails = availablePillars.find(p => p.id === selectedPillarId);

    return (
        <div className="min-h-screen bg-surface pb-20 px-4 pt-6">
            <div className="max-w-2xl mx-auto">
                <header className="bg-white sticky top-0 z-40 border-b border-navy-100/50 shadow-sm px-4 py-3 flex items-center -mx-4 -mt-6 mb-6">
                    <button onClick={() => navigate(-1)} className="mr-3 text-navy-500 hover:text-orange-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h1 className="font-bold text-navy-800 text-lg">{t('booking.request_service')}</h1>
                        <div className="flex items-center gap-1.5 text-[11px] text-navy-400 font-semibold">
                            <span>Step {step} of 4</span>
                            <span>•</span>
                            <span>{step === 1 ? 'Location' : step === 2 ? 'Schedule' : step === 3 ? 'Select Pillar' : 'Confirm'}</span>
                        </div>
                    </div>
                </header>

                <div className="mb-6">
                    <h2 className="heading-3">{serviceInfo.name}</h2>
                    <p className="text-navy-500 mt-1">{subServiceInfo ? `› ${subServiceInfo.name}` : ''}</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-danger-50 text-danger-600 text-sm font-medium border border-danger-100 flex items-start">
                        <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="card p-6 shadow-lg shadow-navy-900/5">
                    {/* Step 1: Location */}
                    {step === 1 && (
                        <div className="space-y-5 animate-fade-in">
                            <h2 className="font-semibold text-lg text-navy-800 border-b border-navy-100 pb-2">{t('booking.location')}</h2>

                            <div
                                onClick={() => setShowMapPicker(true)}
                                className="border-2 border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/40 hover:bg-orange-50 p-5 rounded-2xl cursor-pointer transition-all text-center space-y-2 group"
                            >
                                <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center mx-auto shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                                    <MapPin size={24} />
                                </div>
                                <h3 className="font-bold text-navy-900 text-sm">
                                    {formData.latitude ? "Change Location on Google Map" : "Pin Location on Google Map & Places Search"}
                                </h3>
                                <p className="text-xs text-navy-500 max-w-sm mx-auto">
                                    Search landmarks, use live GPS, or drag the map pin to ensure your technician arrives at the exact spot.
                                </p>
                            </div>

                            {formData.latitude && (
                                <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                                            <CheckCircle2 size={14} /> Confirmed Google Coordinates
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setShowMapPicker(true)}
                                            className="text-xs font-bold text-orange-600 hover:underline"
                                        >
                                            Edit Pin
                                        </button>
                                    </div>
                                    <p className="font-bold text-navy-900 text-sm">
                                        {formData.address_line || "Selected Map Location"}
                                    </p>
                                    <div className="flex flex-wrap gap-3 text-xs text-navy-600 pt-1 border-t border-navy-100">
                                        <span>Area: <strong>{formData.area || "-"}</strong></span>
                                        <span>City: <strong>{formData.city || "-"}</strong></span>
                                        <span className="text-navy-400 font-mono text-[11px]">
                                            GPS: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-navy-700">Detailed Address / Building / Flat:</span>
                                </div>
                                <input type="text" name="address_line" value={formData.address_line} onChange={handleFormChange} placeholder="Door No, Building Name, Street..." className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all outline-none text-xs" required />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" name="area" value={formData.area} onChange={handleFormChange} placeholder={t('booking.area')} className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 outline-none text-xs" />
                                    <input type="text" name="city" value={formData.city} onChange={handleFormChange} placeholder={t('booking.city')} className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 outline-none text-xs" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" name="state" value={formData.state} onChange={handleFormChange} placeholder="State" className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 outline-none text-xs" />
                                    <input type="text" name="postal_code" value={formData.postal_code} onChange={handleFormChange} placeholder="Postal Code" className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 outline-none text-xs" />
                                </div>
                            </div>

                            <LocationPickerModal
                                isOpen={showMapPicker}
                                onClose={() => setShowMapPicker(false)}
                                onConfirmLocation={handleMapLocationConfirmed}
                                initialCoords={formData.latitude ? { lat: formData.latitude, lng: formData.longitude } : null}
                                initialAddress={formData.address_line}
                            />

                            <div className="mt-8 pt-4">
                                <button onClick={nextStep} className="btn-primary w-full shadow-lg shadow-orange-500/20 py-3.5">Continue</button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Schedule & Details */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h2 className="font-semibold text-lg text-navy-800 border-b border-navy-100 pb-2 mb-4">{t('booking.schedule')}</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="block text-xs font-medium text-muted mb-1">{t('booking.preferred_date')}</label>
                                        <input type="date" name="preferred_date" value={formData.preferred_date} onChange={handleFormChange} disabled={formData.flexible_timing || formData.is_emergency} className="w-full px-4 py-3 rounded-xl border border-navy-200 outline-none disabled:opacity-50 disabled:bg-navy-50" min={new Date().toISOString().split('T')[0]} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-muted mb-1">{t('booking.preferred_time')}</label>
                                        <input type="time" name="preferred_time" value={formData.preferred_time} onChange={handleFormChange} disabled={formData.flexible_timing || formData.is_emergency} className="w-full px-4 py-3 rounded-xl border border-navy-200 outline-none disabled:opacity-50 disabled:bg-navy-50" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" name="flexible_timing" checked={formData.flexible_timing} onChange={handleFormChange} disabled={formData.is_emergency} className="w-5 h-5 rounded border-navy-200 text-orange-500 focus:ring-orange-500" />
                                        <span className="text-sm text-navy-700 font-medium">{t('booking.flexible_timing')}</span>
                                    </label>

                                    {/* Emergency On-Demand Priority Toggle */}
                                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl bg-red-50 border border-red-200">
                                        <input
                                            type="checkbox"
                                            name="is_emergency"
                                            checked={formData.is_emergency}
                                            onChange={handleFormChange}
                                            className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                                        />
                                        <div>
                                            <span className="text-xs font-black text-red-700 uppercase tracking-wider block">
                                                🚨 Emergency Priority Dispatch (&lt; 30 Mins)
                                            </span>
                                            <span className="text-[11px] text-red-600">
                                                Pings nearest on-duty technicians with instant dispatch override.
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <h2 className="font-semibold text-lg text-navy-800 border-b border-navy-100 pb-2 mb-4">{t('booking.tell_us_more')}</h2>
                                <textarea name="customer_description" value={formData.customer_description} onChange={handleFormChange} rows={3} placeholder={t('booking.description_placeholder')} className="w-full px-4 py-3 rounded-xl border border-navy-200 outline-none focus:ring-2 focus:ring-orange-400 resize-none"></textarea>
                            </div>

                            <div>
                                <h2 className="font-semibold text-lg text-navy-800 border-b border-navy-100 pb-2 mb-4">{t('booking.attachments')}</h2>
                                <label className="flex items-center justify-center w-full p-6 border-2 border-dashed border-navy-200 rounded-xl cursor-pointer hover:bg-navy-50/50 transition-colors">
                                    <div className="text-center space-y-2">
                                        <svg className="mx-auto h-8 w-8 text-navy-400" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                        <p className="text-sm text-navy-600 font-medium">{selectedFile ? selectedFile.name : t('booking.upload_file')}</p>
                                    </div>
                                    <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFileChange} />
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3.5">Back</button>
                                <button onClick={nextStep} className="btn-primary flex-1 py-3.5 shadow-lg shadow-orange-500/20">Select Pillar</button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Select Available Pillar (Phase 2) */}
                    {step === 3 && (
                        <div className="space-y-5 animate-fade-in">
                            <div>
                                <h2 className="font-semibold text-lg text-navy-800 border-b border-navy-100 pb-2 mb-2">Select Your Cooperative Technician</h2>
                                <p className="text-xs text-navy-500">
                                    Browse certified Pillars in your vicinity, or let the AI allocation engine match the top-rated available specialist.
                                </p>
                            </div>

                            {/* Option 1: AI Auto-Match */}
                            <div
                                onClick={() => setSelectedPillarId('auto_match')}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                                    selectedPillarId === 'auto_match'
                                        ? 'border-orange-500 bg-orange-50/50 shadow-sm'
                                        : 'border-navy-100 hover:border-navy-200 bg-white'
                                }`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                                        <Sparkles size={22} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-navy-900 text-sm">⚡ AI Auto-Match Best Pillar</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                                Recommended
                                            </span>
                                        </div>
                                        <p className="text-xs text-navy-500 mt-0.5">
                                            Dispatches nearest verified specialist with highest trade score and fastest ETA.
                                        </p>
                                    </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    selectedPillarId === 'auto_match' ? 'border-orange-500 bg-orange-500 text-white' : 'border-navy-300'
                                }`}>
                                    {selectedPillarId === 'auto_match' && <Check size={12} strokeWidth={3} />}
                                </div>
                            </div>

                            {/* Option 2: Live Pillars from Database */}
                            <div className="space-y-3 pt-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-navy-400 block">
                                    Available Technicians Nearby ({availablePillars.length})
                                </span>

                                {loadingPillars ? (
                                    <div className="text-center py-8 text-xs font-semibold text-navy-400 animate-pulse">
                                        Querying live cooperative database for active technicians...
                                    </div>
                                ) : availablePillars.length === 0 ? (
                                    <div className="p-4 rounded-xl bg-navy-50 text-xs text-navy-600 text-center">
                                        No individual technicians found matching criteria. AI Auto-Dispatch will handle matching.
                                    </div>
                                ) : (
                                    availablePillars.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => setSelectedPillarId(p.id)}
                                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                selectedPillarId === p.id
                                                    ? 'border-orange-500 bg-orange-50/50 shadow-sm'
                                                    : 'border-navy-100 hover:border-navy-200 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                                <div className="w-12 h-12 rounded-xl bg-navy-100 text-navy-700 font-bold flex items-center justify-center text-base shrink-0">
                                                    {p.full_name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-navy-900 text-sm truncate">{p.full_name}</span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                                            {p.role}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy-500 mt-1">
                                                        <span className="flex items-center gap-1 font-bold text-amber-500">
                                                            <Star size={12} fill="currentColor" /> {p.rating}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{p.completed_jobs} completed jobs</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1 text-navy-600 font-semibold">
                                                            <MapPin size={12} /> ~{p.distance} km
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <span className="font-mono font-black text-navy-900 text-sm block">₹{p.starting_price}</span>
                                                <span className="text-[10px] text-emerald-600 font-bold uppercase block">
                                                    {p.is_available ? 'Available' : 'Busy'}
                                                </span>
                                            </div>

                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-1 ${
                                                selectedPillarId === p.id ? 'border-orange-500 bg-orange-500 text-white' : 'border-navy-300'
                                            }`}>
                                                {selectedPillarId === p.id && <Check size={12} strokeWidth={3} />}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-navy-100">
                                <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-3.5">Back</button>
                                <button onClick={() => setStep(4)} className="btn-primary flex-1 py-3.5 shadow-lg shadow-orange-500/20">Review Summary</button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Summary & Confirm */}
                    {step === 4 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="font-semibold text-xl text-navy-800 border-b border-navy-100 pb-3">{t('booking.confirm_title')}</h2>

                            <div className="space-y-4">
                                {formData.is_emergency && (
                                    <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-center">
                                        <span className="text-xs font-black text-red-700 tracking-wider uppercase">
                                            🚨 HIGH PRIORITY EMERGENCY SERVICE DISPATCH
                                        </span>
                                    </div>
                                )}
                                <div className="bg-navy-50 p-4 rounded-xl">
                                    <p className="text-xs text-muted mb-1">Service Requested</p>
                                    <p className="font-medium text-navy-800">{serviceInfo.name}{subServiceInfo ? ` - ${subServiceInfo.name}` : ''}</p>
                                </div>
                                <div className="bg-navy-50 p-4 rounded-xl">
                                    <p className="text-xs text-muted mb-1">Assigned Pillar / Technician</p>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-navy-800">
                                            {selectedPillarId === 'auto_match' ? '⚡ AI Auto-Match (Nearest Certified Pillar)' : chosenPillarDetails?.full_name}
                                        </span>
                                        {chosenPillarDetails && (
                                            <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                                                <Star size={12} fill="currentColor" /> {chosenPillarDetails.rating}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-navy-50 p-4 rounded-xl">
                                    <p className="text-xs text-muted mb-1">Location</p>
                                    {formData.location_type === 'geolocation' ? (
                                        <p className="font-medium text-navy-800">Coordinates: {formData.latitude}, {formData.longitude}</p>
                                    ) : (
                                        <p className="font-medium text-navy-800">{[formData.address_line, formData.area, formData.city].filter(Boolean).join(', ')}</p>
                                    )}
                                </div>
                                <div className="bg-navy-50 p-4 rounded-xl">
                                    <p className="text-xs text-muted mb-1">Schedule</p>
                                    <p className="font-medium text-navy-800">
                                        {formData.is_emergency ? '⚡ Immediate Emergency Dispatch' : (formData.flexible_timing ? 'Flexible Timing' : `${formData.preferred_date} at ${formData.preferred_time}`)}
                                    </p>
                                </div>
                                {formData.customer_description && (
                                    <div className="bg-navy-50 p-4 rounded-xl">
                                        <p className="text-xs text-muted mb-1">Notes</p>
                                        <p className="font-medium text-navy-800">{formData.customer_description}</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 mt-4 flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-orange-800/80 block">Estimated Service Base</span>
                                    <span className="text-sm font-bold text-orange-950">Standard Cooperative Tariff</span>
                                </div>
                                <span className="font-mono font-black text-xl text-orange-600">
                                    ₹{chosenPillarDetails?.starting_price || subServiceInfo?.base_price || 450}
                                </span>
                            </div>

                            <div className="flex gap-3 pt-6 mt-6 border-t border-navy-100">
                                <button onClick={() => setStep(3)} disabled={isSubmitting} className="btn-secondary flex-1 py-3.5">Back</button>
                                <button onClick={submitRequest} disabled={isSubmitting} className="btn-primary flex-[2] py-3.5 shadow-lg shadow-orange-500/20">
                                    {isSubmitting ? 'Submitting...' : t('booking.confirm_btn')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
