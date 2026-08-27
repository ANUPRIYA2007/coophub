import { supabase } from '../../lib/supabase';

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
            } catch (e) { /* silent */ }

            return newId;
        }

        // 🔒 REAL SUPABASE: Insert live database row with zero mocks
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Authentication required to submit request.');
        }

        const payload = {
            customer_id: user.id,
            service_id: requestData.service_id,
            sub_service_id: requestData.sub_service_id,
            status: 'pending',
            location_type: requestData.location_type || null,
            address_line: requestData.address_line || null,
            area: requestData.area || null,
            city: requestData.city || null,
            state: requestData.state || null,
            postal_code: requestData.postal_code || null,
            latitude: requestData.latitude || null,
            longitude: requestData.longitude || null,
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
        const { data, error } = await supabase
            .from('service_requests')
            .select(`
                *,
                services (id, name_translations),
                sub_services (id, name_translations)
            `)
            .eq('id', requestId)
            .single();

        if (error) {
            throw new Error('Failed to retrieve request details, or request not found.');
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
