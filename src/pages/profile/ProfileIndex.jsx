import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../hooks/useTranslation';

export default function ProfileIndex() {
    const navigate = useNavigate();
    const { user, profile: authProfile } = useAuth();
    const { t } = useTranslation();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Edit Mode states
    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (localStorage.getItem('coophub_demo_customer') === 'true') {
                const savedDemo = JSON.parse(localStorage.getItem('coophub_demo_profile') || '{}');
                const demoP = {
                    id: 'CUST-CHE-DEMO01',
                    full_name: savedDemo.full_name || authProfile?.full_name || 'Anupriya',
                    email: savedDemo.email || authProfile?.email || 'customer@coophub.in',
                    phone: savedDemo.phone || '+91 98401 23456',
                    role: 'customer',
                    preferred_language: 'en',
                    created_at: savedDemo.created_at || '2026-01-15T10:00:00.000Z'
                };
                setProfile(demoP);
                setFullName(demoP.full_name);
                setPhone(demoP.phone);
                setLoading(false);
                return;
            }

            const currentUserId = user?.id || authProfile?.user_id || authProfile?.id;
            const currentUserEmail = user?.email || authProfile?.email;

            let resolvedProfile = null;

            if (currentUserId || currentUserEmail) {
                try {
                    // Try customer_profiles first
                    let query = supabase.from('customer_profiles').select('*');
                    if (currentUserId) query = query.eq('user_id', currentUserId);
                    else query = query.eq('email', currentUserEmail);
                    
                    const { data: custData } = await query.maybeSingle();
                    if (custData) {
                        resolvedProfile = custData;
                    }
                } catch (err) {
                    console.warn('customer_profiles query note:', err);
                }

                // Fallback to profiles table if customer_profiles had no match
                if (!resolvedProfile && currentUserId) {
                    try {
                        const { data: baseData } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', currentUserId)
                            .maybeSingle();
                        if (baseData) {
                            resolvedProfile = baseData;
                        }
                    } catch (err) {
                        console.warn('profiles query note:', err);
                    }
                }
            }

            // If no DB row yet, build cleanly from auth session metadata
            const finalProfile = {
                id: resolvedProfile?.id || currentUserId || 'CUST-CHE-0001',
                user_id: currentUserId,
                full_name: resolvedProfile?.full_name || user?.user_metadata?.full_name || authProfile?.full_name || currentUserEmail?.split('@')[0] || 'Valued Customer',
                email: resolvedProfile?.email || currentUserEmail || '',
                phone: resolvedProfile?.mobile || resolvedProfile?.phone || user?.user_metadata?.mobile_number || user?.user_metadata?.mobile || '',
                role: 'Customer',
                created_at: resolvedProfile?.created_at || user?.created_at || new Date().toISOString()
            };

            setProfile(finalProfile);
            setFullName(finalProfile.full_name);
            setPhone(finalProfile.phone);
            setLoading(false);
        };
        fetchProfile();
    }, [user, authProfile]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (localStorage.getItem('coophub_demo_customer') === 'true') {
                const updated = {
                    ...profile,
                    full_name: fullName.trim(),
                    phone: phone.trim()
                };
                localStorage.setItem('coophub_demo_profile', JSON.stringify(updated));
                setProfile(updated);
                setIsEditing(false);
                return;
            }

            const currentUserId = user?.id || profile?.user_id;

            if (currentUserId) {
                // Upsert to customer_profiles
                await supabase.from('customer_profiles').upsert([
                    {
                        user_id: currentUserId,
                        full_name: fullName.trim(),
                        mobile: phone.trim(),
                        email: profile.email,
                        updated_at: new Date().toISOString()
                    }
                ], { onConflict: 'email' });

                // Also update user metadata
                await supabase.auth.updateUser({
                    data: {
                        full_name: fullName.trim(),
                        mobile_number: phone.trim()
                    }
                });
            }

            setProfile(prev => ({ ...prev, full_name: fullName.trim(), phone: phone.trim() }));
            setIsEditing(false);
        } catch (err) {
            console.error('Update profile error:', err);
            alert('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-surface p-10 flex justify-center animate-pulse"><div className="w-24 h-24 bg-gray-200 rounded-full"></div></div>;
    }

    // Generate formatted Unique Member ID
    const memberId = profile?.user_id 
        ? `CUST-CHE-${profile.user_id.slice(0, 6).toUpperCase()}`
        : (profile?.id?.startsWith('CUST-') ? profile.id : `CUST-CHE-${(profile?.id || '0000').slice(0, 6).toUpperCase()}`);

    const memberSinceDate = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className="min-h-screen bg-surface pb-24 pt-6 px-4">
            <div className="max-w-xl mx-auto">
                {/* Unified Sticky Header */}
                <header className="bg-white sticky top-0 z-40 border-b border-navy-100/50 shadow-sm px-4 py-3 flex items-center -mx-4 -mt-6 mb-8">
                    <button onClick={() => navigate('/home')} className="mr-3 text-navy-500 hover:text-orange-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="font-bold text-navy-800 text-lg">{t('navigation.profile') || 'My Profile'}</h1>
                </header>

                <div className="bg-white border border-navy-100 rounded-3xl p-8 text-center shadow-sm relative mb-8">
                    {/* Visual Role Indicator */}
                    <div className="absolute top-4 right-4 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border border-orange-200">
                        {profile?.role || 'Customer'}
                    </div>

                    <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4 border-4 border-white shadow-md">
                        {profile?.full_name?.charAt(0)?.toUpperCase() || '👤'}
                    </div>

                    {!isEditing ? (
                        <>
                            <h2 className="text-2xl font-bold text-navy-900">{profile?.full_name || 'Valued Customer'}</h2>
                            <p className="text-navy-500 mt-1">{profile?.phone || profile?.email || 'No Phone Recorded'}</p>

                            <button
                                onClick={() => setIsEditing(true)}
                                className="mt-6 px-8 py-2.5 bg-navy-50 text-navy-700 hover:bg-navy-100 font-medium rounded-xl transition-colors mx-auto flex items-center shadow-sm"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                Edit Profile details
                            </button>
                        </>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-4 max-w-sm mx-auto text-left animate-fade-in-up pt-4">
                            <div>
                                <label className="block text-xs font-semibold text-navy-500 uppercase tracking-wider mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-surface"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-navy-500 uppercase tracking-wider mb-1">Mobile Number</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-surface"
                                    placeholder="+91 98401 23456"
                                    required
                                />
                            </div>
                            <div className="flex space-x-3 pt-2">
                                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-navy-100 text-navy-700 hover:bg-navy-200 transition-colors rounded-xl font-medium">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center">
                                    {saving ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Additional Non-editable fields (Module Requirements) */}
                <div className="bg-white border border-navy-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-navy-50 flex justify-between items-center">
                        <span className="text-navy-600 text-sm font-medium">Member ID</span>
                        <span className="text-orange-600 font-mono font-bold text-xs bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                            {memberId}
                        </span>
                    </div>
                    <div className="px-6 py-4 flex justify-between items-center bg-navy-50/50">
                        <span className="text-navy-600 text-sm font-medium">Member Since</span>
                        <span className="text-navy-900 font-semibold text-sm">
                            {memberSinceDate}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}
