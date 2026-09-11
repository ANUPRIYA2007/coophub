import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../context/AuthContext';
import { useServices } from '../../hooks/useServices';
import { serviceRequestService } from '../../services/customer/serviceRequestService';
import { attachmentService } from '../../services/customer/attachmentService';
import { locationService } from '../../services/customer/locationService';
import { workerService } from '../../services/workers/workerService';
import LocationPickerModal from '../../components/maps/LocationPickerModal';
import CameraCaptureModal from '../../components/common/CameraCaptureModal';
import DatePickerDropdown from '../../components/ui/DatePickerDropdown';
import ResponsiveTimePicker from '../../components/ui/ResponsiveTimePicker';
import {
    MapPin, AlertTriangle, CheckCircle2, Home, ShoppingBag,
    Star, ShieldCheck, Sparkles, UserCheck, Check, Clock, Camera, X
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
    const [cameraPreview, setCameraPreview] = useState(null);
    const cameraInputRef = useRef(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Pillar Discovery States (Phase 2)
    const [availablePillars, setAvailablePillars] = useState([]);
    const [selectedPillarId, setSelectedPillarId] = useState(paramPillarId);
    const [loadingPillars, setLoadingPillars] = useState(false);
    
    // AI Auto-Match Animation States
    const [isAiMatching, setIsAiMatching] = useState(false);
    const [aiMatchedPillar, setAiMatchedPillar] = useState(null);

    // Load available pillars when reaching step 3 or when service/coords ready
    const loadPillars = async () => {
        setLoadingPillars(true);
        try {
            const data = await workerService.getAvailablePillars({
                category: serviceInfo?.category || serviceInfo?.name || '',
                serviceName: serviceInfo?.name || '',
                subServiceName: subServiceInfo?.name || '',
                lat: formData.latitude || null,
                lng: formData.longitude || null
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

    const handleAiAutoMatch = async () => {
        setSelectedPillarId('auto_match');
        if (aiMatchedPillar) return; // already ran once

        setIsAiMatching(true);
        try {
            const { matchingService } = await import('../../services/ai/matchingService');
            const matchRes = await matchingService.matchWorkforceForRequest({
                service_id: serviceInfo?.id || targetServiceId,
                service_name: serviceInfo?.name,
                category: serviceInfo?.category || serviceInfo?.name,
                sub_service_name: subServiceInfo?.name || '',
                latitude: formData.latitude || null,
                longitude: formData.longitude || null
            });

            if (matchRes?.rankedCandidates?.length > 0) {
                setAiMatchedPillar(matchRes.rankedCandidates[0]);
            } else if (availablePillars.length > 0) {
                setAiMatchedPillar({
                    id: availablePillars[0].id,
                    pillarId: availablePillars[0].id,
                    pillarCode: availablePillars[0].pillar_code,
                    fullName: availablePillars[0].full_name,
                    distanceKm: availablePillars[0].distance,
                    matchScore: 85
                });
            }
        } catch (err) {
            console.warn('AI matching interactive run failed:', err);
        } finally {
            setIsAiMatching(false);
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
        const isCoords = (s) => !s || /^Lat:\s*[\d.-]+/i.test(String(s).trim());
        const cleanAddress = !isCoords(loc.address_line) ? loc.address_line : '';

        setFormData(prev => ({
            ...prev,
            location_type: 'google_map',
            latitude: loc.latitude,
            longitude: loc.longitude,
            address_line: cleanAddress || (!isCoords(prev.address_line) ? prev.address_line : ''),
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
        // Generate preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setCameraPreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            setCameraPreview(null);
        }
    };

    const handleCameraCapture = () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            cameraInputRef.current?.click();
            return;
        }
        setIsCameraOpen(true);
    };

    const handleCapturedPhoto = (file) => {
        const formError = attachmentService.validateFile(file);
        if (formError) {
            setError(formError);
            return;
        }
        setError(null);
        setSelectedFile(file);
        
        // Generate preview for image
        const reader = new FileReader();
        reader.onloadend = () => setCameraPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const clearAttachment = () => {
        setSelectedFile(null);
        setCameraPreview(null);
    };

    const nextStep = () => {
        setError(null);
        if (step === 1) { // Validate Location
            const hasValidAddress = formData.address_line && !/^Lat:\s*[\d.-]+/i.test(formData.address_line);
            if (!hasValidAddress && !formData.latitude) {
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
                // 1. Generate base64 DataURL for guaranteed immediate preview across all storage environments
                let base64DataUrl = cameraPreview;
                if (!base64DataUrl) {
                    base64DataUrl = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = () => resolve(null);
                        reader.readAsDataURL(selectedFile);
                    });
                }

                // 2. Safely attempt Supabase storage upload
                let uploadResult = null;
                try {
                    uploadResult = await attachmentService.uploadAttachment(selectedFile, profile?.user_id || profile?.id || 'customer');
                } catch (upErr) {
                    console.warn('Storage upload note (using base64 dataUrl mirror):', upErr);
                }

                const finalUrl = uploadResult?.url || base64DataUrl;
                const isPdf = selectedFile.type?.includes('pdf') || selectedFile.name?.toLowerCase().endsWith('.pdf');

                const attachmentItem = {
                    id: `att-${Date.now()}`,
                    name: selectedFile.name || (isPdf ? 'document.pdf' : 'customer_photo.jpg'),
                    type: isPdf ? 'pdf' : 'image',
                    size: `${(selectedFile.size / 1024).toFixed(1)} KB`,
                    url: finalUrl,
                    previewUrl: base64DataUrl || finalUrl,
                    path: uploadResult?.path || null,
                    uploaded_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };

                uploadedAttachments.push(attachmentItem);
            }

            // Determine the accurately assigned pillar
            let chosenPillar = null;
            if (selectedPillarId && selectedPillarId !== 'auto_match') {
                chosenPillar = availablePillars.find(p => p.id === selectedPillarId) || null;
            } else if (aiMatchedPillar) {
                const targetId = aiMatchedPillar.pillarId || aiMatchedPillar.id;
                chosenPillar = availablePillars.find(p => p.id === targetId) || {
                    id: targetId,
                    full_name: aiMatchedPillar.fullName,
                    pillar_code: aiMatchedPillar.pillarCode
                };
            } else if (availablePillars.length > 0) {
                chosenPillar = availablePillars[0];
            }

            const assignedPillarId = chosenPillar?.id || null;
            const assignedPillarName = chosenPillar?.full_name || null;
            const assignedPillarCode = chosenPillar?.pillar_code || null;

            const isCoords = (s) => !s || /^Lat:\s*[\d.-]+/i.test(String(s).trim());
            const cleanAddress = !isCoords(formData.address_line)
                ? formData.address_line
                : [formData.area, formData.city].filter(Boolean).join(', ');

            const resolvedCustomerName = profile?.full_name || profile?.name || (() => {
                try {
                    const savedDemo = JSON.parse(localStorage.getItem('coophub_demo_profile') || '{}');
                    if (savedDemo.full_name && savedDemo.full_name !== 'Valued Customer') return savedDemo.full_name;
                    const custUser = JSON.parse(localStorage.getItem('coophub_customer_user') || '{}');
                    if (custUser.full_name && custUser.full_name !== 'Valued Customer') return custUser.full_name;
                } catch(e) {}
                return 'Anupriya Sundaram';
            })();

            const payload = {
                service_id: serviceInfo?.id || targetServiceId,
                sub_service_id: subServiceInfo?.id || targetSubServiceId || null,
                service_name: serviceInfo.name,
                sub_service_name: subServiceInfo?.name || '',
                category: serviceInfo.category || serviceInfo.name,
                pillar_id: assignedPillarId,
                pillar_name: assignedPillarName,
                pillar_code: assignedPillarCode,
                pillar: chosenPillar,
                customer_name: resolvedCustomerName,
                customer_phone: profile?.mobile || profile?.phone || '+91 98401 23456',
                customer_email: profile?.email || 'customer@coophub.in',
                amount: chosenPillar?.starting_price || subServiceInfo?.base_price || 450,
                ...formData,
                address_line: cleanAddress,
                attachments: uploadedAttachments,
                photo_urls: uploadedAttachments.map(a => a.url).filter(Boolean)
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
                        <h1 className="font-bold text-navy-800 text-lg">{t('Request Service')}</h1>
                        <div className="flex items-center gap-1.5 text-[11px] text-navy-400 font-semibold">
                            <span>{t('Step')} {step} {t('of')} 4</span>
                            <span>•</span>
                            <span>{step === 1 ? t('Location') : step === 2 ? t('Schedule') : step === 3 ? t('Select Pillar') : t('Confirm')}</span>
                        </div>
                    </div>
                </header>

                <div className="mb-6">
                    <h2 className="heading-3">{t(serviceInfo.name)}</h2>
                    <p className="text-navy-500 mt-1">{subServiceInfo ? `› ${t(subServiceInfo.name)}` : ''}</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-danger-50 text-danger-600 text-sm font-medium border border-danger-100 flex items-start">
                        <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
                        <span>{t(error)}</span>
                    </div>
                )}

                <div className="card p-6 shadow-lg shadow-navy-900/5">
                    {/* Step 1: Location */}
                    {step === 1 && (
                        <div className="space-y-5 animate-fade-in">
                            <h2 className="font-semibold text-lg text-navy-800 border-b border-navy-100 pb-2">{t('Service Location')}</h2>

                            <div
                                onClick={() => setShowMapPicker(true)}
                                className="border-2 border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/40 hover:bg-orange-50 p-5 rounded-2xl cursor-pointer transition-all text-center space-y-2 group"
                            >
                                <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center mx-auto shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                                    <MapPin size={24} />
                                </div>
                                <h3 className="font-bold text-navy-900 text-sm">
                                    {formData.latitude ? t("Change Location on Google Map") : t("Pin Location on Google Map & Places Search")}
                                </h3>
                                <p className="text-xs text-navy-500 max-w-sm mx-auto">
                                    {t("Search landmarks, use live GPS, or drag the map pin to ensure your technician arrives at the exact spot.")}
                                </p>
                            </div>

                            {formData.latitude && (
                                <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                                            <CheckCircle2 size={14} /> {t("Confirmed Google Coordinates")}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setShowMapPicker(true)}
                                            className="text-xs font-bold text-orange-600 hover:underline"
                                        >
                                            {t("Edit Pin")}
                                        </button>
                                    </div>
                                    <p className="font-bold text-navy-900 text-sm">
                                        {(formData.address_line && !/^Lat:\s*[\d.-]+/i.test(formData.address_line))
                                            ? formData.address_line
                                            : [formData.area, formData.city].filter(Boolean).join(', ') || t("Selected Map Location")}
                                    </p>
                                    <div className="flex flex-wrap gap-3 text-xs text-navy-600 pt-1 border-t border-navy-100">
                                        <span>{t("Area")}: <strong>{formData.area || "-"}</strong></span>
                                        <span>{t("City")}: <strong>{formData.city || "-"}</strong></span>
                                        <span className="text-navy-400 font-mono text-[11px]">
                                            GPS: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-navy-700">{t("Detailed Address / Building / Flat:")}</span>
                                </div>
                                <input 
                                    type="text" 
                                    name="address_line" 
                                    value={(formData.address_line && !/^Lat:\s*[\d.-]+/i.test(formData.address_line)) ? formData.address_line : ''} 
                                    onChange={handleFormChange} 
                                    placeholder={t("Door No, Building Name, Street...")} 
                                    className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all outline-none text-xs" 
                                    required 
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" name="area" value={formData.area} onChange={handleFormChange} placeholder={t('Area')} className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 outline-none text-xs" />
                                    <input type="text" name="city" value={formData.city} onChange={handleFormChange} placeholder={t('City')} className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 outline-none text-xs" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" name="state" value={formData.state} onChange={handleFormChange} placeholder={t("State")} className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 outline-none text-xs" />
                                    <input type="text" name="postal_code" value={formData.postal_code} onChange={handleFormChange} placeholder={t("Postal Code")} className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 outline-none text-xs" />
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
                                <button onClick={nextStep} className="btn-primary w-full shadow-lg shadow-orange-500/20 py-3.5">{t("Continue")}</button>
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
                                        <DatePickerDropdown
                                            value={formData.preferred_date}
                                            onChange={handleFormChange}
                                            disabled={formData.flexible_timing || formData.is_emergency}
                                        />
                                    </div>
                                    <div>
                                        <ResponsiveTimePicker
                                            value={formData.preferred_time}
                                            onChange={handleFormChange}
                                            disabled={formData.flexible_timing || formData.is_emergency}
                                        />
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

                                {/* Preview area */}
                                {selectedFile && (
                                    <div className="mb-4 relative">
                                        <button
                                            onClick={clearAttachment}
                                            className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                                            type="button"
                                        >
                                            <X size={14} strokeWidth={3} />
                                        </button>
                                        {cameraPreview ? (
                                            <img src={cameraPreview} alt="Attachment preview" className="w-full h-40 object-cover rounded-xl border border-navy-200" />
                                        ) : (
                                            <div className="w-full py-4 px-4 bg-navy-50 rounded-xl border border-navy-200 flex items-center gap-3">
                                                <svg className="h-6 w-6 text-navy-400 shrink-0" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                <p className="text-sm text-navy-700 font-medium truncate">{selectedFile.name}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Upload & Camera buttons */}
                                {!selectedFile && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* File Upload */}
                                        <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-navy-200 rounded-xl cursor-pointer hover:bg-navy-50/50 hover:border-orange-300 transition-all group">
                                            <div className="text-center space-y-2">
                                                <svg className="mx-auto h-8 w-8 text-navy-400 group-hover:text-orange-500 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                                <p className="text-sm text-navy-600 font-medium group-hover:text-orange-600 transition-colors">{t('booking.upload_file')}</p>
                                                <p className="text-[10px] text-navy-400">JPG, PNG, PDF</p>
                                            </div>
                                            <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFileChange} />
                                        </label>

                                        {/* Camera Capture */}
                                        <button
                                            type="button"
                                            onClick={handleCameraCapture}
                                            className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-navy-200 rounded-xl cursor-pointer hover:bg-navy-50/50 hover:border-orange-300 transition-all group"
                                        >
                                            <div className="text-center space-y-2">
                                                <Camera className="mx-auto h-8 w-8 text-navy-400 group-hover:text-orange-500 transition-colors" />
                                                <p className="text-sm text-navy-600 font-medium group-hover:text-orange-600 transition-colors">{t('Take Photo')}</p>
                                                <p className="text-[10px] text-navy-400">{t('Use Web Camera')}</p>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3.5">{t('Back')}</button>
                                <button onClick={nextStep} className="btn-primary flex-1 py-3.5 shadow-lg shadow-orange-500/20">{t('Select Pillar')}</button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Select Available Pillar (Phase 2) */}
                    {step === 3 && (
                        <div className="space-y-5 animate-fade-in">
                            <div>
                                <h2 className="font-semibold text-lg text-navy-800 border-b border-navy-100 pb-2 mb-2">{t('Select Your Cooperative Technician')}</h2>
                                <p className="text-xs text-navy-500">
                                    {t('Browse certified Pillars in your vicinity, or let the AI allocation engine match the top-rated available specialist.')}
                                </p>
                            </div>

                            {/* Option 1: AI Auto-Match */}
                            <div
                                onClick={handleAiAutoMatch}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                                    selectedPillarId === 'auto_match'
                                        ? 'border-orange-500 bg-orange-50/50 shadow-sm'
                                        : 'border-navy-100 hover:border-navy-200 bg-white'
                                }`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                                        <Sparkles size={22} className={isAiMatching ? "animate-spin" : ""} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-navy-900 text-sm">{t('⚡ AI Auto-Match Best Pillar')}</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                                {t('Recommended')}
                                            </span>
                                        </div>
                                        {isAiMatching ? (
                                            <p className="text-xs text-orange-600 font-semibold mt-0.5 flex items-center gap-1">
                                                <span className="animate-pulse">Analyzing Chronos Forecast & Routing Matrix...</span>
                                            </p>
                                        ) : aiMatchedPillar ? (
                                            <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                                                Top Match: {aiMatchedPillar.fullName} ({aiMatchedPillar.matchScore || 90}% Match)
                                                {aiMatchedPillar.distanceKm !== null ? ` • ${aiMatchedPillar.isLiveDistance ? '' : '~'}${aiMatchedPillar.distanceKm} km away` : ' • (Distance Unavailable)'}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-navy-500 mt-0.5">
                                                {t('Dispatches nearest verified specialist with highest trade score and fastest ETA.')}
                                            </p>
                                        )}
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
                                    {t('Available Technicians Nearby')} ({availablePillars.length})
                                </span>

                                {loadingPillars ? (
                                    <div className="text-center py-8 text-xs font-semibold text-navy-400 animate-pulse">
                                        {t('Querying live cooperative database for active technicians...')}
                                    </div>
                                ) : availablePillars.length === 0 ? (
                                    <div className="p-4 rounded-xl bg-navy-50 text-xs text-navy-600 text-center">
                                        {t('No individual technicians found matching criteria. AI Auto-Dispatch will handle matching.')}
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
                                                            {t(p.role)}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy-500 mt-1">
                                                        <span className="flex items-center gap-1 font-bold text-amber-500">
                                                            <Star size={12} fill="currentColor" /> {p.rating}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{p.completed_jobs} {t('completed jobs')}</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1 text-navy-600 font-semibold">
                                                            <MapPin size={12} /> {p.distance !== null ? `${p.isLiveDistance ? '' : '~'}${p.distance} km` : 'Distance Unavailable'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <span className="font-mono font-black text-navy-900 text-sm block">₹{p.starting_price}</span>
                                                <span className="text-[10px] text-emerald-600 font-bold uppercase block">
                                                    {p.is_available ? t('Available') : t('Busy')}
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
                                <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-3.5">{t('Back')}</button>
                                <button onClick={() => setStep(4)} className="btn-primary flex-1 py-3.5 shadow-lg shadow-orange-500/20">{t('Review Summary')}</button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Summary & Confirm */}
                    {step === 4 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="font-semibold text-xl text-navy-800 border-b border-navy-100 pb-3">{t('Review & Confirm Booking')}</h2>

                            <div className="space-y-4">
                                {formData.is_emergency && (
                                    <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-center">
                                        <span className="text-xs font-black text-red-700 tracking-wider uppercase">
                                            🚨 {t('HIGH PRIORITY EMERGENCY SERVICE DISPATCH')}
                                        </span>
                                    </div>
                                )}
                                <div className="bg-navy-50 p-4 rounded-xl">
                                    <p className="text-xs text-muted mb-1">{t('Service Requested')}</p>
                                    <p className="font-medium text-navy-800">{t(serviceInfo.name)}{subServiceInfo ? ` - ${t(subServiceInfo.name)}` : ''}</p>
                                </div>
                                <div className="bg-navy-50 p-4 rounded-xl">
                                    <p className="text-xs text-muted mb-1">{t('Assigned Pillar / Technician')}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-navy-800">
                                            {selectedPillarId === 'auto_match' ? t('⚡ AI Auto-Match (Nearest Certified Pillar)') : chosenPillarDetails?.full_name}
                                        </span>
                                        {chosenPillarDetails && (
                                            <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                                                <Star size={12} fill="currentColor" /> {chosenPillarDetails.rating}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-navy-50 p-4 rounded-xl">
                                    <p className="text-xs text-muted mb-1">{t('Location')}</p>
                                    {formData.location_type === 'geolocation' ? (
                                        <p className="font-medium text-navy-800">{t('Coordinates')}: {formData.latitude}, {formData.longitude}</p>
                                    ) : (
                                        <p className="font-medium text-navy-800">
                                            {[
                                                formData.address_line && !/^Lat:\s*[\d.-]+/i.test(formData.address_line) ? formData.address_line : null,
                                                formData.area,
                                                formData.city
                                            ].filter(Boolean).join(', ') || `${formData.latitude}, ${formData.longitude}`}
                                        </p>
                                    )}
                                </div>
                                <div className="bg-navy-50 p-4 rounded-xl">
                                    <p className="text-xs text-muted mb-1">{t('Schedule')}</p>
                                    <p className="font-medium text-navy-800">
                                        {formData.is_emergency ? t('⚡ Immediate Emergency Dispatch') : (formData.flexible_timing ? t('Flexible Timing') : `${formData.preferred_date} at ${formData.preferred_time}`)}
                                    </p>
                                </div>
                                {formData.customer_description && (
                                    <div className="bg-navy-50 p-4 rounded-xl">
                                        <p className="text-xs text-muted mb-1">{t('Notes')}</p>
                                        <p className="font-medium text-navy-800">{formData.customer_description}</p>
                                    </div>
                                )}
                                {selectedFile && (
                                    <div className="bg-navy-50 p-4 rounded-xl border border-navy-200">
                                        <p className="text-xs text-muted mb-2 font-semibold text-navy-500 uppercase tracking-wider">{t('Customer Attachment (Visible to Pillar)')}</p>
                                        <div className="flex items-center gap-3">
                                            {cameraPreview ? (
                                                <img src={cameraPreview} alt="Attached preview" className="w-14 h-14 object-cover rounded-xl border border-orange-200 shadow-sm" />
                                            ) : (
                                                <div className="w-14 h-14 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-black text-xs border border-red-200">
                                                    PDF
                                                </div>
                                            )}
                                            <div className="overflow-hidden flex-1">
                                                <p className="text-sm font-bold text-navy-800 truncate">{selectedFile.name}</p>
                                                <p className="text-xs text-navy-500">{(selectedFile.size / 1024).toFixed(1)} KB • Ready for Technician Inspection</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 mt-4 flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-orange-800/80 block">{t('Estimated Service Base')}</span>
                                    <span className="text-sm font-bold text-orange-950">{t('Standard Cooperative Tariff')}</span>
                                </div>
                                <span className="font-mono font-black text-xl text-orange-600">
                                    ₹{chosenPillarDetails?.starting_price || subServiceInfo?.base_price || 450}
                                </span>
                            </div>

                            <div className="flex gap-3 pt-6 mt-6 border-t border-navy-100">
                                <button onClick={() => setStep(3)} disabled={isSubmitting} className="btn-secondary flex-1 py-3.5">{t('Back')}</button>
                                <button onClick={submitRequest} disabled={isSubmitting} className="btn-primary flex-[2] py-3.5 shadow-lg shadow-orange-500/20">
                                    {isSubmitting ? t('Submitting...') : t('Confirm Booking')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Camera Capture Modal */}
            <CameraCaptureModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCapturedPhoto}
            />

            {/* Native device camera fallback input */}
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCapturedPhoto(file);
                }}
            />
        </div>
    );
}
