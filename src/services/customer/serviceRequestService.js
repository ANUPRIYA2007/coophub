import { supabase } from '../../lib/supabase';
import { emailService } from '../email/emailService';

// Rich Demo Requests for Customer Demo Login mode
const DEMO_REQUESTS = [
    {
        id: "REQ-8942",
        status: "on_the_way", // pending, assigned, accepted, on_the_way, arrived, in_progress, completed, cancelled
        created_at: new Date().toISOString(),
        preferred_date: new Date().toISOString().split("T")[0],
        preferred_time: "10:30 AM",
        flexible_timing: false,
        location_type: "manual",
        address_line: "Flat 4B, Shanthi Apartments, 5th Cross St",
        area: "Guindy",
        city: "Chennai",
        state: "Tamil Nadu",
        postal_code: "600032",
        latitude: 13.0067,
        longitude: 80.2021,
        customer_description: "Ceiling fan making squeaking noise and 16A switch spark issue.",
        arrival_otp: "489201",
        extra_charge_status: "pending",
        extra_charge_amount: 500,
        extra_charge_reason: "Replacement of burned heavy-duty capacitor and copper coil rewire.",
        services: {
            id: "srv-1",
            name: "Electrical Repair",
            name_translations: {
                en: "Electrical Repair",
                ta: "மின்சார பழுதுபார்ப்பு",
                hi: "बिजली मरम्मत",
                te: "విద్యుత్ మరమ్మత్తు",
                kn: "ವಿದ್ಯುತ್ ದುರಸ್ತಿ"
            }
        },
        sub_services: {
            id: "sub-1",
            name: "Ceiling Fan & Switchboard Wiring",
            name_translations: {
                en: "Ceiling Fan & Switchboard Wiring",
                ta: "மின்விசிறி மற்றும் சுவிட்ச்போர்டு வயரிங்",
                hi: "सीलिंग फैन और स्विचबोर्ड वायरिंग",
                te: "సీలింగ్ ఫ్యాన్ & స్విచ్‌బోర్డ్ వైరింగ్",
                kn: "ಸೀಲಿಂಗ್ ಫ್ಯಾನ್ ಮತ್ತು ಸ್ವಿಚ್‌ಬೋರ್ಡ್ ವೈರಿಂಗ್"
            }
        },
        pillar: {
            id: "PIL-CHE-042",
            full_name: "Raj Kumar",
            role: "Certified Senior Electrician",
            rating: 4.9,
            reviews_count: 128,
            avatar_url: "/assets/images/mascot-hero.png",
            latitude: 13.0125,
            longitude: 80.2104,
            distance_km: "1.2",
            eta_mins: "8",
            last_location_time: "Just now"
        }
    },
    {
        id: "REQ-8890",
        status: "completed",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        preferred_date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        preferred_time: "02:00 PM",
        flexible_timing: false,
        location_type: "manual",
        address_line: "Plot 12, 2nd Main Road",
        area: "Velachery",
        city: "Chennai",
        state: "Tamil Nadu",
        postal_code: "600042",
        latitude: 12.9815,
        longitude: 80.2180,
        customer_description: "AC heavy power socket installation with MCB trip testing.",
        arrival_otp: "612840",
        extra_charge_status: "accepted",
        extra_charge_amount: 500,
        services: {
            id: "srv-2",
            name: "AC Repair & Installation",
            name_translations: {
                en: "AC Repair & Installation",
                ta: "ஏசி பழுது மற்றும் பொருத்துதல்",
                hi: "एसी मरम्मत और स्थापना",
                te: "AC మరమ్మత్తు & ఇన్‌స్టాలేషన్",
                kn: "ಎಸಿ ದುರಸ್ತಿ ಮತ್ತು ಅಳವಡಿಕೆ"
            }
        },
        sub_services: {
            id: "sub-2",
            name: "AC Power Point & 16A Socket",
            name_translations: {
                en: "AC Power Point & 16A Socket",
                ta: "ஏசி பவர் பாயிண்ட் & 16A சாக்கெட்",
                hi: "एसी पावर प्वाइंट और 16A सॉकेट",
                te: "AC పవర్ పాయింట్ & 16A సాకెట్",
                kn: "ಎಸಿ ಪವರ್ ಪಾಯಿಂಟ್ & 16A ಸಾಕೆಟ್"
            }
        },
        pillar: {
            id: "PIL-CHE-042",
            full_name: "Raj Kumar",
            role: "Certified Senior Electrician",
            rating: 4.9
        }
    },
    {
        id: "REQ-8812",
        status: "completed",
        created_at: new Date(Date.now() - 172800000).toISOString(),
        preferred_date: new Date(Date.now() - 172800000).toISOString().split("T")[0],
        preferred_time: "11:00 AM",
        flexible_timing: true,
        location_type: "manual",
        address_line: "18, Gandhi Nagar 1st Main Rd",
        area: "Adyar",
        city: "Chennai",
        state: "Tamil Nadu",
        postal_code: "600020",
        latitude: 13.0012,
        longitude: 80.2565,
        customer_description: "Inverter battery rewiring and terminal clamp replacement.",
        arrival_otp: "740192",
        extra_charge_status: "none",
        extra_charge_amount: 0,
        services: {
            id: "srv-1",
            name: "Electrical Repair",
            name_translations: {
                en: "Electrical Repair",
                ta: "மின்சார பழுதுபார்ப்பு",
                hi: "बिजली मरम्मत",
                te: "విద్యుత్ మరమ్మత్తు",
                kn: "ವಿದ್ಯುತ್ ದುರಸ್ತಿ"
            }
        },
        sub_services: {
            id: "sub-3",
            name: "Inverter Battery Rewiring",
            name_translations: {
                en: "Inverter Battery Rewiring",
                ta: "இன்வெர்ட்டர் பேட்டரி வயரிங்",
                hi: "इन्वर्टर बैटरी रीवायरिंग",
                te: "ఇన్వర్టర్ బ్యాటరీ రీవైరింగ్",
                kn: "ಇನ್ವರ್ಟರ್ ಬ್ಯಾಟರಿ ರಿವೈರಿಂಗ್"
            }
        },
        pillar: {
            id: "PIL-CHE-042",
            full_name: "Raj Kumar",
            role: "Certified Senior Electrician",
            rating: 4.9
        }
    }
];

export const serviceRequestService = {
    /**
     * Submits a finalized service request securely bound to the authenticated user token
     * @param {Object} requestData 
     * @returns {string} ID of created request
     */
    createServiceRequest: async (requestData) => {
        const isDemo = localStorage.getItem('coophub_demo_customer') === 'true';

        // 🧪 DEMO MODE: Store in local storage memory for instant interactive testing
        if (isDemo) {
            const newId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
            const demoItem = {
                id: newId,
                status: 'pending',
                created_at: new Date().toISOString(),
                ...requestData,
                arrival_otp: String(Math.floor(100000 + Math.random() * 900000)),
                extra_charge_status: 'none',
                extra_charge_amount: 0,
                services: {
                    name_translations: {
                        en: requestData.service_name || "Home Service",
                        ta: "வீட்டு சேவை",
                        hi: "घरेलू सेवा",
                        te: "గృహ సేవ",
                        kn: "ಮನೆ ಸೇವೆ"
                    }
                },
                sub_services: {
                    name_translations: {
                        en: requestData.sub_service_name || "General Inspection",
                        ta: "பொது ஆய்வு",
                        hi: "सामान्य निरीक्षण",
                        te: "సాధారణ తనిఖీ",
                        kn: "ಸಾಮಾನ್ಯ ತಪಾಸಣೆ"
                    }
                }
            };

            try {
                const existing = JSON.parse(localStorage.getItem('coophub_demo_customer_created_requests') || '[]');
                existing.unshift(demoItem);
                localStorage.setItem('coophub_demo_customer_created_requests', JSON.stringify(existing));

                // Trigger confirmation email template
                await emailService.sendServiceRequestConfirmationEmail({
                    email: requestData.email || 'customer@coophub.in',
                    customer_name: requestData.customer_name || 'Valued Customer',
                    service_name: requestData.service_name || 'Home Service',
                    request_id: newId,
                    service_date: requestData.preferred_date || new Date().toISOString().split('T')[0],
                    service_time: requestData.preferred_time || '10:30 AM',
                    service_location: [requestData.address_line, requestData.area, requestData.city].filter(Boolean).join(', ') || 'Guindy, Chennai',
                    total_amount: requestData.total_amount || 450,
                    request_status: 'Confirmed'
                });
            } catch (e) { /* silent */ }

            return newId;
        }

        // 🔒 REAL SUPABASE: Insert live database row with zero mocks
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Authentication required to submit request.');
        }

        // 1. Generate secure 6-digit arrival OTP
        const arrivalOtp = String(Math.floor(100000 + Math.random() * 900000));

        // 2. Intelligent Workforce Allocation: Find best available certified Pillar in this trade
        let assignedPillarId = requestData.pillar_id || null;
        let initialStatus = 'pending';

        try {
            const { matchingService } = await import('../ai/matchingService');
            const matchRes = await matchingService.matchWorkforceForRequest({
                service_id: requestData.service_id,
                service_name: requestData.service_name,
                category: requestData.category || requestData.service_name,
                latitude: requestData.latitude || 13.0067,
                longitude: requestData.longitude || 80.2025
            });

            if (matchRes?.rankedCandidates?.length > 0) {
                const topCandidate = matchRes.rankedCandidates[0];
                if (topCandidate?.pillarId) {
                    assignedPillarId = topCandidate.pillarId;
                    initialStatus = 'assigned';
                    console.log(`⚡ AI Workforce Engine auto-assigned top matching Pillar: ${topCandidate.fullName} (${topCandidate.pillarCode})`);
                }
            }
        } catch (matchErr) {
            console.warn("AI workforce auto-dispatch note:", matchErr);
        }

        const payload = {
            customer_id: user.id,
            service_id: requestData.service_id,
            sub_service_id: requestData.sub_service_id,
            pillar_id: assignedPillarId,
            status: initialStatus,
            arrival_otp: arrivalOtp,
            location_type: requestData.location_type || 'google_map',
            address_line: requestData.address_line || null,
            area: requestData.area || null,
            city: requestData.city || null,
            state: requestData.state || null,
            postal_code: requestData.postal_code || null,
            latitude: requestData.latitude || 13.0067,
            longitude: requestData.longitude || 80.2025,
            flexible_timing: !!requestData.flexible_timing,
            preferred_date: requestData.preferred_date || null,
            preferred_time: requestData.preferred_time || null,
            customer_description: requestData.customer_description || null,
            attachments: requestData.attachments || []
        };

        const { data, error } = await supabase
            .from('service_requests')
            .insert([payload])
            .select('id')
            .single();

        if (error) {
            console.error('Request Creation Error:', error);
            throw new Error('Unable to create service request properly. Database constraint failure: ' + error.message);
        }

        // Notify assigned pillar in realtime if matched
        if (assignedPillarId) {
            try {
                await supabase.from('notifications').insert([{
                    user_id: assignedPillarId,
                    type: 'new_job_assigned',
                    title: '⚡ New Service Assignment Dispatched',
                    message: `You have been matched & assigned to Order #${data.id.slice(0, 8)}. Please review details in your orders dashboard.`,
                    read: false
                }]);
            } catch (ne) { /* silent */ }
        }

        // Trigger Service Request Confirmation Email with real data
        try {
            const loc = [requestData.address_line, requestData.area, requestData.city].filter(Boolean).join(', ');
            await emailService.sendServiceRequestConfirmationEmail({
                email: user.email,
                customer_name: profile?.full_name || user.email?.split('@')[0] || 'Customer',
                service_name: requestData.service_name || 'Service Request',
                request_id: data.id,
                service_date: requestData.preferred_date || new Date().toLocaleDateString(),
                service_time: requestData.preferred_time || (requestData.flexible_timing ? 'Flexible Timing' : 'Standard Slot'),
                service_location: loc || 'Service Location',
                total_amount: requestData.total_amount || requestData.estimated_price || '0',
                request_status: initialStatus === 'assigned' ? 'Pillar Assigned' : 'Pending',
                pillar_name: requestData.pillar_name || null,
                pillar_id: assignedPillarId,
                payment_status: requestData.payment_status || null,
                invoice_number: null
            });
        } catch (mailErr) {
            console.warn('Service request confirmation email notice:', mailErr);
        }

        return data.id;
    },

    /**
     * Loads a finalized specific request for the user
     * @param {string} requestId 
     */
    getRequestDetails: async (requestId) => {
        const isDemo = localStorage.getItem('coophub_demo_customer') === 'true';

        // 🧪 DEMO MODE: Match from static demo list or created items
        if (isDemo) {
            const userCreated = JSON.parse(localStorage.getItem('coophub_demo_customer_created_requests') || '[]');
            const allDemo = [...userCreated, ...DEMO_REQUESTS];
            const found = allDemo.find(r => r.id === requestId);
            if (found) return found;
            return allDemo[0];
        }

        // 🔒 REAL SUPABASE: Live database query
        let data = null;
        try {
            const { data: fullData, error: fullError } = await supabase
                .from('service_requests')
                .select(`
                    *,
                    services (id, name_translations),
                    sub_services (id, name_translations)
                `)
                .eq('id', requestId)
                .maybeSingle();

            if (fullData) {
                data = fullData;
            } else if (fullError) {
                console.warn("Full join query failed, falling back to simple select:", fullError.message);
            }
        } catch (e) {
            console.warn("Join fetch note:", e);
        }

        if (!data) {
            const { data: simpleData, error: simpleError } = await supabase
                .from('service_requests')
                .select('*')
                .eq('id', requestId)
                .maybeSingle();

            if (simpleError || !simpleData) {
                // Also check bookings table as fallback
                const { data: bData } = await supabase
                    .from('bookings')
                    .select('*')
                    .eq('id', requestId)
                    .maybeSingle();

                if (bData) {
                    data = {
                        id: bData.id,
                        status: bData.status || 'pending',
                        service_name: bData.service_name,
                        address_line: bData.service_address,
                        pillar_id: bData.pillar_id,
                        arrival_otp: bData.arrival_otp || '489201',
                        created_at: bData.created_at
                    };
                } else {
                    throw new Error('Failed to retrieve request details, or request not found.');
                }
            } else {
                data = simpleData;
            }
        }

        // Fetch service name if not populated
        if (data && data.service_id && (!data.services || !data.services.name_translations)) {
            try {
                const { data: sData } = await supabase
                    .from('services')
                    .select('id, name_translations, name, category')
                    .eq('id', data.service_id)
                    .maybeSingle();
                if (sData) data.services = sData;
            } catch (se) {}
        }

        // Fetch pillar profile if pillar_id is present
        if (data && data.pillar_id && !data.pillar) {
            try {
                const { data: pData } = await supabase
                    .from('pillar_profiles')
                    .select('id, full_name, role, mobile, pillar_id, current_lat, current_lng')
                    .eq('id', data.pillar_id)
                    .maybeSingle();
                if (pData) data.pillar = pData;
            } catch (pe) {}
        }

        return data;
    },

    /**
     * Loads the customer's request history
     */
    getCustomerRequests: async () => {
        const isDemo = localStorage.getItem('coophub_demo_customer') === 'true';

        // 🧪 DEMO MODE: Return rich demo requests
        if (isDemo) {
            const userCreated = JSON.parse(localStorage.getItem('coophub_demo_customer_created_requests') || '[]');
            return [...userCreated, ...DEMO_REQUESTS];
        }

        // 🔒 REAL SUPABASE: Live database query
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthenticated');

        const { data, error } = await supabase
            .from('service_requests')
            .select(`
                id, status, created_at, preferred_date, 
                services (name_translations), sub_services (name_translations)
            `)
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw new Error('Failed to fetch request history');
        return data || [];
    }
};
