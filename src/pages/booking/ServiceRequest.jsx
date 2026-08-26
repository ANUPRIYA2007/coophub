import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { useServices } from '../../hooks/useServices';
import { locationService } from '../../services/customer/locationService';
import { attachmentService } from '../../services/customer/attachmentService';
import { serviceRequestService } from '../../services/customer/serviceRequestService';
import { useAuth } from '../../context/AuthContext';

export default function ServiceRequest() {
    const { id: serviceId } = useParams();
    const [searchParams] = useSearchParams();
    const subServiceId = searchParams.get('sub');

    const { t } = useTranslation();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { services, subServices, loading: catLoading } = useServices();

    const serviceInfo = services.find(s => s.id === serviceId);
    const subServiceInfo = subServices.find(s => s.id === subServiceId);

    // Form States
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        location_type: 'manual',
        address_line: '', area: '', city: '', state: '', postal_code: '',
        latitude: null, longitude: null,
        preferred_date: '', preferred_time: '', flexible_timing: false,
        customer_description: '',
        attachments: []
    });
    const [selectedFile, setSelectedFile] = useState(null);
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
            alert('Location successfully pinpointed.');
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
            if (formData.location_type === 'manual' && (!formData.address_line || !formData.city)) {
                setError('Address line and city are required.'); return;
            }
            if (formData.location_type === 'geolocation' && (!formData.latitude)) {
                setError('Location coordinates missing. Please try again.'); return;
            }
        }
        if (step === 2) { // Validate Schedule
            if (!formData.flexible_timing && (!formData.preferred_date || !formData.preferred_time)) {
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
                // The prompt allows storing the db relative path mapping
                uploadedAttachments.push(path);
            }

            const payload = {
                service_id: serviceId,
                sub_service_id: subServiceId || null,
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
                <button onClick={() => navigate(-1)} className="text-navy-600 mb-6 hover:text-navy-900 transition flex items-center font-medium">
                    <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back
                </button>

                <div className="mb-6">
                    <h1 className="heading-3">{t('booking.request_service')}</h1>
                    <p className="text-navy-500 mt-1">{serviceInfo.name} {subServiceInfo ? `› ${subServiceInfo.name}` : ''}</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-danger-50 text-danger-600 text-sm font-medium border border-danger-100 flex items-start">
                        <svg className="w-5 h-5 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <span>{error}</span>
                    </div>
                )}

                <div className="card p-6 shadow-lg shadow-navy-900/5">
                    {/* Step 1: Location */}
                    {step === 1 && (
                        <div className="space-y-5 animate-fade-in">
                            <h2 className="font-semibold text-lg text-navy-800 border-b border-navy-100 pb-2">{t('booking.location')}</h2>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleGetLocation}
                                    disabled={isLocating}
                                    className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center transition-colors ${formData.location_type === 'geolocation' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-navy-200 hover:bg-navy-50 text-navy-700'}`}
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {isLocating ? 'Locating...' : formData.latitude ? 'Location Saved' : t('booking.use_current_location')}
                                </button>
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, location_type: 'manual', latitude: null, longitude: null }))}
                                    className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center transition-colors ${formData.location_type === 'manual' ? 'border-navy-500 bg-navy-50 text-navy-800' : 'border-navy-200 hover:bg-navy-50 text-navy-700'}`}
                                >
                                    {t('booking.enter_manual')}
                                </button>
                            </div>

                            {formData.location_type === 'manual' && (
                                <div className="space-y-4 pt-4">
                                    <input type="text" name="address_line" value={formData.address_line} onChange={handleFormChange} placeholder={t('booking.address_line')} className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all outline-none" required />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" name="area" value={formData.area} onChange={handleFormChange} placeholder={t('booking.area')} className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 outline-none" />
                                        <input type="text" name="city" value={formData.city} onChange={handleFormChange} placeholder={t('booking.city')} className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 outline-none" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" name="state" value={formData.state} onChange={handleFormChange} placeholder="State" className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 outline-none" />
                                        <input type="text" name="postal_code" value={formData.postal_code} onChange={handleFormChange} placeholder="Postal Code" className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 outline-none" />
                                    </div>
                                </div>
                            )}

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
                                        <input type="date" name="preferred_date" value={formData.preferred_date} onChange={handleFormChange} disabled={formData.flexible_timing} className="w-full px-4 py-3 rounded-xl border border-navy-200 outline-none disabled:opacity-50 disabled:bg-gray-100" min={new Date().toISOString().split('T')[0]} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-muted mb-1">{t('booking.preferred_time')}</label>
                                        <input type="time" name="preferred_time" value={formData.preferred_time} onChange={handleFormChange} disabled={formData.flexible_timing} className="w-full px-4 py-3 rounded-xl border border-navy-200 outline-none disabled:opacity-50 disabled:bg-gray-100" />
                                    </div>
                                </div>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" name="flexible_timing" checked={formData.flexible_timing} onChange={handleFormChange} className="w-5 h-5 rounded border-navy-200 text-orange-500 focus:ring-orange-500" />
                                    <span className="text-sm text-navy-700 font-medium">{t('booking.flexible_timing')}</span>
                                </label>
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
                                        {formData.flexible_timing ? 'Flexible Timing' : `${formData.preferred_date} at ${formData.preferred_time}`}
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
