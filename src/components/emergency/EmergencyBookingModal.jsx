import React, { useState } from 'react';
import { emergencyDispatchService } from '../../services/emergency/emergencyDispatchService';
import { useAuth } from '../../context/AuthContext';
import { 
  AlertTriangle, MapPin, Zap, Droplets, Wind, Lock, Wrench, 
  CheckCircle2, Clock, X, ShieldAlert, Phone, Navigation, RefreshCw
} from 'lucide-react';

const EMERGENCY_SERVICES = [
  { id: 'srv-elec', name: 'Electrical Emergency', icon: Zap, color: '#EF4444', description: 'Short circuit, sparks, total power blackout, fuse blowout' },
  { id: 'srv-plumb', name: 'Water Pipe Burst', icon: Droplets, color: '#2563EB', description: 'Major pipe rupture, ceiling leak, sewage overflow' },
  { id: 'srv-ac', name: 'AC Failure / Smoke', icon: Wind, color: '#059669', description: 'Compressor sparking, chemical odor, fan seized' },
  { id: 'srv-lock', name: 'Lockout / Security', icon: Lock, color: '#D97706', description: 'Main door jammed, broken key in lock, safety hazard' },
  { id: 'srv-other', name: 'Other Urgent Hazard', icon: Wrench, color: '#64748B', description: 'Structural or appliance hazard requiring immediate assistance' }
];

export default function EmergencyBookingModal({ isOpen, onClose, onBookingSuccess = () => {} }) {
  const { user, profile } = useAuth();
  const [selectedService, setSelectedService] = useState(EMERGENCY_SERVICES[0]);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [locationMode, setLocationMode] = useState('gps'); // 'gps' | 'manual'
  const [coords, setCoords] = useState(null);
  const [manualArea, setManualArea] = useState('Guindy');
  const [manualAddress, setManualAddress] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [dispatchStage, setDispatchStage] = useState('NONE'); // 'DISPATCHING', 'OFFERED', 'ACCEPTED'

  if (!isOpen) return null;

  const handleFetchCurrentGps = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please enter address manually.');
      setLocationMode('manual');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy)
        });
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocationError('Location permission required for emergency dispatch. Please allow location access or specify your area manually.');
        setLocating(false);
        setLocationMode('manual');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmitEmergency = async (e) => {
    e.preventDefault();
    if (!emergencyReason.trim()) {
      alert('Please describe the emergency hazard briefly so the technician brings proper tools.');
      return;
    }

    setSubmitting(true);
    try {
      const customerId = user?.id || 'demo-customer-uuid';
      const res = await emergencyDispatchService.createEmergencyRequest({
        customerId,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        lat: coords?.latitude || (manualArea === 'Guindy' ? 13.0067 : 13.0827),
        lng: coords?.longitude || (manualArea === 'Guindy' ? 80.2025 : 80.2707),
        area: manualArea,
        address: manualAddress || `${manualArea}, Chennai`,
        emergencyReason: emergencyReason.trim(),
        priority: 'EMERGENCY'
      });

      setActiveRequest(res);
      setDispatchStage('DISPATCHING');

      // Subscribe to real-time status updates
      emergencyDispatchService.subscribeToEmergencyRequest(res.id, (updatedReq) => {
        setActiveRequest(updatedReq);
        if (updatedReq.dispatch_status) {
          setDispatchStage(updatedReq.dispatch_status);
        }
      });

      onBookingSuccess(res);
    } catch (err) {
      alert('Emergency request failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(5, 10, 18, 0.85)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '16px'
    }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '2px solid #EF4444',
        borderRadius: 'var(--radius-xl)',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 40px rgba(239, 68, 68, 0.3)',
        padding: '24px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '10px', borderRadius: '12px' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--color-text)', margin: 0 }}>
                Emergency Rapid Dispatch
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#EF4444', fontWeight: '800', marginTop: '2px' }}>
                PRIORITY QUEUE • HIGH-VELOCITY DISPATCH
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-outline" style={{ padding: '4px 8px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Active Dispatch Tracker View */}
        {activeRequest ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '70px', height: '70px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#EF4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              border: '2px dashed #EF4444'
            }}>
              <Zap size={32} className="spin" />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-text)', margin: '0 0 6px' }}>
              {dispatchStage === 'ACCEPTED' ? 'Technician Accepted & Mobilizing!' : 'Scanning Nearest Available Technicians...'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
              Order ID: <strong style={{ fontFamily: 'monospace' }}>#{activeRequest.id.slice(0, 8)}</strong> • Service: <strong>{selectedService.name}</strong>
            </p>

            {/* Stepper */}
            <div style={{
              background: 'var(--color-surface-hover)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--color-text)', marginBottom: '10px' }}>
                Real-Time Dispatch Progress:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669' }}>
                  <CheckCircle2 size={16} /> 1. Emergency Order Created in Priority Queue
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: dispatchStage !== 'EMERGENCY_CREATED' ? '#059669' : '#FF7900' }}>
                  {dispatchStage !== 'EMERGENCY_CREATED' ? <CheckCircle2 size={16} /> : <Clock size={16} className="spin" />}
                  2. Geolocation calculated & dispatched to nearest certified Pillars
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: dispatchStage === 'ACCEPTED' ? '#059669' : 'var(--color-text-muted)' }}>
                  {dispatchStage === 'ACCEPTED' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                  3. Pillar acceptance & arrival countdown
                </div>
              </div>
            </div>

            {/* Arrival OTP */}
            <div style={{
              background: 'rgba(255, 121, 0, 0.08)',
              border: '1px solid #FF7900',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#FF7900', textTransform: 'uppercase' }}>
                Your Arrival Security OTP
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '4px', color: 'var(--color-text)', marginTop: '2px' }}>
                {activeRequest.arrival_otp || '489201'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Share this 6-digit code with the technician only when they arrive at your door.
              </div>
            </div>

            <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', background: '#EF4444', color: 'white', fontWeight: '800' }}>
              Keep Tracking in Background
            </button>
          </div>
        ) : (
          /* Intake Form */
          <form onSubmit={handleSubmitEmergency}>
            {/* Service Category Buttons */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--color-text)', display: 'block', marginBottom: '8px' }}>
                Select Emergency Type:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                {EMERGENCY_SERVICES.map((s) => {
                  const Icon = s.icon;
                  const isSelected = selectedService.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedService(s)}
                      style={{
                        background: isSelected ? 'rgba(239, 68, 68, 0.12)' : 'var(--color-surface-hover)',
                        border: `1.5px solid ${isSelected ? '#EF4444' : 'var(--color-border)'}`,
                        borderRadius: '10px',
                        padding: '10px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <Icon size={18} color={s.color} />
                      <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--color-text)' }}>{s.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location Section */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--color-text)', display: 'block', marginBottom: '8px' }}>
                Incident Location:
              </label>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={handleFetchCurrentGps}
                  disabled={locating}
                  className="btn btn-sm"
                  style={{
                    background: coords ? '#10B981' : '#EF4444',
                    color: 'white',
                    fontWeight: '700',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '0.82rem'
                  }}
                >
                  <Navigation size={14} className={locating ? 'spin' : ''} />
                  {locating ? 'Detecting GPS...' : coords ? `✓ GPS Locked (±${coords.accuracy}m)` : 'Get Exact GPS Location'}
                </button>

                <button
                  type="button"
                  onClick={() => setLocationMode(locationMode === 'gps' ? 'manual' : 'gps')}
                  className="btn btn-sm btn-outline"
                  style={{ fontSize: '0.82rem' }}
                >
                  {locationMode === 'gps' ? 'Enter Area Manually' : 'Use GPS'}
                </button>
              </div>

              {locationError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', color: '#B91C1C', marginBottom: '10px' }}>
                  {locationError}
                </div>
              )}

              {locationMode === 'manual' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <select
                    value={manualArea}
                    onChange={(e) => setManualArea(e.target.value)}
                    style={{
                      padding: '8px 12px', borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface-hover)',
                      fontSize: '0.85rem'
                    }}
                  >
                    {['Guindy', 'Velachery', 'Adyar', 'T. Nagar', 'Anna Nagar', 'Tambaram', 'Mylapore'].map(a => (
                      <option key={a} value={a}>{a} (Chennai)</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Specific building / street / landmark..."
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    style={{
                      padding: '8px 12px', borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface-hover)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Emergency Description */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--color-text)', display: 'block', marginBottom: '6px' }}>
                Describe the Hazard / Situation:
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Sparking from the main MCB box with burning smell. Need immediate shutoff and rewiring."
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-hover)',
                  fontSize: '0.85rem',
                  resize: 'none'
                }}
              />
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  flex: 2,
                  background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                  color: 'white',
                  fontWeight: '900',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Zap size={16} />
                {submitting ? 'Connecting...' : 'Request Emergency Dispatch Now'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
