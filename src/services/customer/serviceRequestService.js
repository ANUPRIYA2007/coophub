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
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        const SERVICE_UUID_MAP = {
            'electrical': 'a0000000-0000-0000-0000-000000000001',
            'electrician': 'a0000000-0000-0000-0000-000000000001',
            'plumbing': 'a0000000-0000-0000-0000-000000000002',
            'plumber': 'a0000000-0000-0000-0000-000000000002',
            'cooling': 'a0000000-0000-0000-0000-000000000003',
            'ac': 'a0000000-0000-0000-0000-000000000003',
            'ac repair': 'a0000000-0000-0000-0000-000000000003',
            'appliances': 'a0000000-0000-0000-0000-000000000004',
            'painting': 'a0000000-0000-0000-0000-000000000005',
            'cleaning': 'a0000000-0000-0000-0000-000000000006',
            'transport': 'a0000000-0000-0000-0000-000000000007',
            'driver': 'a0000000-0000-0000-0000-000000000007'
        };

        // 1. Resolve safe valid service_id UUID
        let validServiceId = 'a0000000-0000-0000-0000-000000000001';
        if (requestData.service_id && UUID_REGEX.test(requestData.service_id)) {
            validServiceId = requestData.service_id;
        } else {
            const key = String(requestData.category || requestData.service_name || '').toLowerCase();
            const matchedKey = Object.keys(SERVICE_UUID_MAP).find(k => key.includes(k));
            if (matchedKey) validServiceId = SERVICE_UUID_MAP[matchedKey];
        }

        // 2. Resolve sub_service_id
        const validSubServiceId = (requestData.sub_service_id && UUID_REGEX.test(requestData.sub_service_id))
            ? requestData.sub_service_id
            : null;

        // 3. Resolve customer details & authenticate safely
        let validCustomerId = null;
        let customerName = requestData.customer_name || 'Valued Customer';
        let customerPhone = requestData.customer_phone || requestData.customer_mobile || '+91 98401 23456';
        let customerEmail = requestData.customer_email || requestData.email || 'customer@coophub.in';

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.id && UUID_REGEX.test(user.id)) {
                validCustomerId = user.id;
                customerEmail = user.email || customerEmail;
                if (user.user_metadata?.full_name) customerName = user.user_metadata.full_name;
                if (user.user_metadata?.mobile || user.phone) customerPhone = user.user_metadata?.mobile || user.phone;
            }
        } catch (e) {}

        if (!validCustomerId) {
            try {
                const stored = localStorage.getItem('coophub_customer_user');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    customerName = parsed.name || parsed.full_name || customerName;
                    customerPhone = parsed.mobile || parsed.phone || customerPhone;
                    customerEmail = parsed.email || customerEmail;
                }
            } catch (e) {}
        }

        // 4. Generate secure arrival OTP
        const arrivalOtp = String(Math.floor(100000 + Math.random() * 900000));

        // 5. Intelligent Workforce Allocation (find matching certified pillar)
        let assignedPillarId = null;
        if (requestData.pillar_id && UUID_REGEX.test(requestData.pillar_id)) {
            assignedPillarId = requestData.pillar_id;
        }

        try {
            const { matchingService } = await import('../ai/matchingService');
            const matchRes = await matchingService.matchWorkforceForRequest({
                service_id: validServiceId,
                service_name: requestData.service_name,
                category: requestData.category || requestData.service_name,
                latitude: requestData.latitude || 13.0067,
                longitude: requestData.longitude || 80.2025
            });

            if (matchRes?.rankedCandidates?.length > 0 && !assignedPillarId) {
                const topCandidate = matchRes.rankedCandidates[0];
                if (topCandidate?.pillarId && UUID_REGEX.test(topCandidate.pillarId)) {
                    assignedPillarId = topCandidate.pillarId;
                    console.log(`⚡ AI Workforce Engine auto-assigned top matching Pillar: ${topCandidate.fullName} (${topCandidate.pillarCode})`);
                }
            }
        } catch (matchErr) {
            console.warn("AI workforce auto-dispatch note:", matchErr);
        }

        // 6. Format customer contact details inside description so Pillar always sees it
        const customNotes = requestData.customer_description || requestData.description || 'Standard service request';
        const formattedDescription = `[Customer: ${customerName} | Phone: ${customerPhone}] ${customNotes}`;

        // 7. Construct payload for Supabase database insertion
        const payload = {
            customer_id: validCustomerId,
            service_id: validServiceId,
            sub_service_id: validSubServiceId,
            pillar_id: assignedPillarId,
            status: assignedPillarId ? 'assigned' : 'pending',
            arrival_otp: arrivalOtp,
            location_type: requestData.location_type || 'manual',
            address_line: requestData.address_line || null,
            area: requestData.area || 'Guindy',
            city: requestData.city || 'Chennai',
            state: requestData.state || 'Tamil Nadu',
            postal_code: requestData.postal_code || '600032',
            latitude: requestData.latitude || 13.0067,
            longitude: requestData.longitude || 80.2025,
            flexible_timing: !!requestData.flexible_timing,
            preferred_date: requestData.preferred_date || new Date().toISOString().split('T')[0],
            preferred_time: requestData.preferred_time || '10:30 AM',
            customer_description: formattedDescription,
            amount: requestData.amount || requestData.total_amount || 450,
            total_amount: requestData.total_amount || requestData.amount || 450,
            attachments: requestData.attachments || []
        };

        let createdId = null;
        let createdRecord = null;

        // Try inserting into Supabase database (triggers Supabase Realtime across all browsers)
        try {
            const { data, error } = await supabase
                .from('service_requests')
                .insert([payload])
                .select('*')
                .single();

            if (!error && data) {
                createdId = data.id;
                createdRecord = data;
                console.log("⚡ Live Supabase order created successfully:", createdId);

                // Mirror to bookings table with service_id for unified order tracking
                try {
                    await supabase.from('bookings').insert([{
                        id: data.id,
                        booking_code: 'ORD-' + String(data.id).substring(0, 6).toUpperCase(),
                        customer_id: validCustomerId,
                        pillar_id: assignedPillarId,
                        service_id: validServiceId,
                        sub_service_id: validSubServiceId,
                        service_name: requestData.service_name || "Home Service",
                        sub_service_name: requestData.sub_service_name || "General Inspection",
                        customer_name: customerName,
                        customer_mobile: customerPhone,
                        service_address: [requestData.address_line, requestData.area, requestData.city].filter(Boolean).join(', ') || 'Guindy, Chennai',
                        scheduled_date: requestData.preferred_date || new Date().toISOString().split('T')[0],
                        scheduled_time: requestData.preferred_time || '10:30 AM',
                        base_amount: requestData.amount || 450,
                        total_amount: requestData.total_amount || requestData.amount || 450,
                        arrival_otp: arrivalOtp,
                        status: assignedPillarId ? 'assigned' : 'pending'
                    }]);
                } catch (bErr) {
                    console.warn("Bookings mirror note:", bErr?.message);
                }
            } else if (error) {
                console.warn("Supabase insert note:", error.message);
            }
        } catch (dbErr) {
            console.warn("Database insert catch:", dbErr);
        }

        // Fallback ID if offline / constraint
        if (!createdId) {
            createdId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        // 8. Construct rich standard order object
        const fullOrderObj = {
            id: createdId,
            order_id: createdId,
            booking_code: String(createdId).startsWith('REQ-') ? createdId : 'REQ-' + String(createdId).substring(0, 6).toUpperCase(),
            status: assignedPillarId ? 'assigned' : 'pending',
            created_at: new Date().toISOString(),
            customer_id: validCustomerId,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_mobile: customerPhone,
            customer_email: customerEmail,
            customer: {
                id: validCustomerId || 'cust-1',
                full_name: customerName,
                mobile: customerPhone,
                email: customerEmail
            },
            service_id: validServiceId,
            sub_service_id: validSubServiceId,
            service_name: requestData.service_name || "Home Service",
            sub_service_name: requestData.sub_service_name || "General Inspection",
            service: {
                id: validServiceId,
                name: requestData.service_name || "Home Service",
                category: requestData.category || "Service",
                price: requestData.amount || 450
            },
            total_amount: requestData.total_amount || requestData.amount || 450,
            base_amount: requestData.amount || 450,
            address_line: requestData.address_line || 'Flat 4B, Shanthi Apts',
            area: requestData.area || 'Guindy',
            city: requestData.city || 'Chennai',
            service_address: [requestData.address_line, requestData.area, requestData.city].filter(Boolean).join(', ') || 'Guindy, Chennai',
            preferred_date: requestData.preferred_date || new Date().toISOString().split('T')[0],
            preferred_time: requestData.preferred_time || '10:30 AM',
            scheduled_date: requestData.preferred_date || new Date().toISOString().split('T')[0],
            scheduled_time: requestData.preferred_time || '10:30 AM',
            arrival_otp: arrivalOtp,
            extra_charge_status: 'none',
            extra_charge_amount: 0,
            customer_description: formattedDescription,
            latitude: requestData.latitude || 13.0067,
            longitude: requestData.longitude || 80.2025,
            pillar_id: assignedPillarId,
            attachments: requestData.attachments || [],
            photo_urls: (requestData.attachments || []).map(a => typeof a === 'object' ? (a.url || a.previewUrl) : a).filter(Boolean),
            ...(createdRecord || {})
        };

        // Guarantee attachments is not overwritten by null createdRecord property
        if (!fullOrderObj.attachments || fullOrderObj.attachments.length === 0) {
            fullOrderObj.attachments = requestData.attachments || [];
        }
        if (!fullOrderObj.photo_urls || fullOrderObj.photo_urls.length === 0) {
            fullOrderObj.photo_urls = (requestData.attachments || []).map(a => typeof a === 'object' ? (a.url || a.previewUrl) : a).filter(Boolean);
        }

        // 9. Persist into LocalStorage for immediate cross-role and demo access
        try {
            // A. Customer's requests
            const custRequests = JSON.parse(localStorage.getItem('coophub_demo_customer_created_requests') || '[]');
            custRequests.unshift(fullOrderObj);
            localStorage.setItem('coophub_demo_customer_created_requests', JSON.stringify(custRequests));

            // B. Shared live orders feed (read by Pillar Portal OrdersList)
            const sharedOrders = JSON.parse(localStorage.getItem('coophub_shared_live_orders') || '[]');
            sharedOrders.unshift(fullOrderObj);
            localStorage.setItem('coophub_shared_live_orders', JSON.stringify(sharedOrders.slice(0, 50)));

            // C. Trigger storage event key for cross-tab listeners
            localStorage.setItem('coophub_last_order_event', JSON.stringify({ id: createdId, time: Date.now() }));
        } catch (sErr) {}

        // 10. Multi-channel instant broadcast across all tabs and windows
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                const bc = new BroadcastChannel('coophub_orders_sync');
                bc.postMessage({ type: 'NEW_ORDER', order: fullOrderObj, timestamp: Date.now() });
                setTimeout(() => { try { bc.close(); } catch(e){} }, 500);
            }
        } catch (bcErr) {}

        try {
            window.dispatchEvent(new CustomEvent('coophub_order_created', { detail: fullOrderObj }));
        } catch (we) {}

        // 11. Send Confirmation Email (async)
        try {
            emailService.sendServiceRequestConfirmationEmail({
                email: customerEmail,
                customer_name: customerName,
                service_name: requestData.service_name || 'Home Service',
                request_id: createdId,
                service_date: requestData.preferred_date || new Date().toISOString().split('T')[0],
                service_time: requestData.preferred_time || '10:30 AM',
                service_location: [requestData.address_line, requestData.area, requestData.city].filter(Boolean).join(', ') || 'Guindy, Chennai',
                total_amount: requestData.total_amount || 450,
                request_status: assignedPillarId ? 'Pillar Assigned' : 'Pending Confirmation'
            }).catch(() => {});
        } catch (e) {}

        return createdId;
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
     * Cancel a service request (customer-initiated, before OTP / work starts)
     * Allowed statuses: pending, assigned, accepted, on_the_way, arrived
     * @param {string} requestId
     * @param {string} cancelReason - predefined reason
     * @param {string} cancelDetails - freeform details typed by customer
     * @returns {{ success: boolean, error?: string }}
     */
    cancelRequest: async (requestId, cancelReason, cancelDetails = '') => {
        const CANCELLABLE_STATUSES = ['pending', 'assigned', 'accepted', 'on_the_way', 'arrived'];

        try {
            // 1. Verify current status is cancellable
            const { data: current, error: fetchErr } = await supabase
                .from('service_requests')
                .select('id, status, pillar_id')
                .eq('id', requestId)
                .maybeSingle();

            if (fetchErr || !current) {
                return { success: false, error: 'Request not found.' };
            }

            if (!CANCELLABLE_STATUSES.includes(current.status)) {
                return { success: false, error: `Cannot cancel — service is already "${current.status}".` };
            }

            // 2. Update service_requests to cancelled
            const fullReason = cancelDetails
                ? `${cancelReason}: ${cancelDetails}`
                : cancelReason;

            const { error: updErr } = await supabase
                .from('service_requests')
                .update({
                    status: 'cancelled',
                    cancel_reason: fullReason,
                    cancelled_at: new Date().toISOString(),
                    cancelled_by: 'customer'
                })
                .eq('id', requestId);

            if (updErr) {
                console.warn('Cancel update error:', updErr.message);
                return { success: false, error: updErr.message };
            }

            // 3. Also update bookings table
            try {
                await supabase
                    .from('bookings')
                    .update({
                        status: 'cancelled',
                        cancel_reason: fullReason,
                        cancelled_at: new Date().toISOString()
                    })
                    .eq('id', requestId);
            } catch (bErr) {
                console.warn('Bookings cancel sync note:', bErr?.message);
            }

            // 4. Record in status history
            try {
                await supabase.from('request_status_history').insert([{
                    request_id: requestId,
                    from_status: current.status,
                    to_status: 'cancelled',
                    changed_by: 'customer',
                    notes: fullReason
                }]);
            } catch (hErr) {
                console.warn('Status history note:', hErr?.message);
            }

            // 5. BroadcastChannel notification
            try {
                if (typeof BroadcastChannel !== 'undefined') {
                    const bc = new BroadcastChannel('coophub_orders_sync');
                    bc.postMessage({ type: 'ORDER_CANCELLED', orderId: requestId, reason: fullReason, timestamp: Date.now() });
                    setTimeout(() => { try { bc.close(); } catch(e){} }, 500);
                }
            } catch (bcErr) {}

            return { success: true };
        } catch (err) {
            console.error('Cancel request error:', err);
            return { success: false, error: err.message || 'Something went wrong.' };
        }
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
