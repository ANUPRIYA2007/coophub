import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../context/AuthContext';
import { useServices } from '../../hooks/useServices';
import { serviceRequestService } from '../../services/customer/serviceRequestService';
import { attachmentService } from '../../services/customer/attachmentService';
import { locationService } from '../../services/customer/locationService';
import LocationPickerModal from '../../components/maps/LocationPickerModal';
import { MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ServiceRequest() {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { services, subServices, loading: catLoading } = useServices();
    const { t } = useTranslation();

    const targetServiceId = params.id || params.serviceId;
    const targetSubServiceId = params.subServiceId || searchParams.get('sub');

    const serviceInfo = services.find(s => s.id === targetServiceId || s.category?.toLowerCase() === targetServiceId?.toLowerCase()) || services[0];
    const subServiceInfo = subServices.find(s => s.id === targetSubServiceId) ||
                           subServices.find(s => s.service_id === serviceInfo?.id) ||
                           subServices[0];

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

    // Navigate to step 1 logic
    if (catLoading) return <div className="p-10 text-center">Loading catalogue...</div>;
    if (!serviceInfo) return <div className="p-10 text-center">Service not found.</div>;

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

    const handleGetLocation = async () => {
        setIsLocating(true);
        setError(null);
        try {
            const coords = await locationService.getCurrentPosition();
            setFormData(prev => ({
                ...prev,
                location_type: 'geolocation',
                latitude: coords.latitude,
                longitude: coords.longitude
            }));
            setShowMapPicker(true);
        } catch (err) {
            setError(err.message);
            setFormData(prev => ({ ...prev, location_type: 'manual' }));
        } finally {
            setIsLocating(false);
        }
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
                setError('Please choose your service location on Google Map or enter your address.'); return;
            }
        }
        if (step === 2) { // Validate Schedule
            if (!formData.is_emergency && !formData.flexible_timing && (!formData.preferred_date || !formData.preferred_time)) {
                setError('Please provide preferred date and time, or check flexible timing.'); return;
            }
        }
        setStep(p => p + 1);
    };

    const submitRequest = async () => {
        setError(null);
        setIsSubmitting(true);
        try {
            let uploadedAttachments = [];
            if (selectedFile) {
                const path = await attachmentService.uploadAttachment(selectedFile, profile.user_id);
                uploadedAttachments.push(path);
            }

            const payload = {
                service_id: serviceInfo?.id || targetServiceId,
                sub_service_id: subServiceInfo?.id || targetSubServiceId || null,
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

    return (
        <div className="min-h-screen bg-surface pb-20 px-4 pt-6">
            <div className="max-w-2xl mx-auto">
                <header className="bg-white sticky top-0 z-40 border-b border-navy-100/50 shadow-sm px-4 py-3 flex items-center -mx-4 -mt-6 mb-6">
                    <button onClick={() => navigate(-1)} className="mr-3 text-navy-500 hover:text-orange-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="font-bold text-navy-800 text-lg">{t('booking.request_service')}</h1>
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
                                <button onClick={nextStep} className="btn-primary flex-1 py-3.5 shadow-lg shadow-orange-500/20">Review Summary</button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Summary */}
                    {step === 3 && (
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

                            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 mt-4">
                                <p className="text-sm text-orange-800 font-medium text-center">
                                    Price will be determined according to the service/order process.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-6 mt-6 border-t border-navy-100">
                                <button onClick={() => setStep(2)} disabled={isSubmitting} className="btn-secondary flex-1 py-3.5">Back</button>
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
