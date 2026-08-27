import { supabase } from '../../lib/supabase';

export const serviceRequestService = {
    /**
     * Submits a finalized service request securely bound to the authenticated user token
     * @param {Object} requestData 
     * @returns {string} ID of created request
     */
    createServiceRequest: async (requestData) => {
        // Validate logged-in user natively
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Authentication required to submit request.');
        }

        const payload = {
            customer_id: user.id,
            service_id: requestData.service_id,
            sub_service_id: requestData.sub_service_id,
            status: 'requested', // Explicit absolute initial state constraint
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
            throw new Error('Unable to create service request properly. Database constraint failure.');
        }

        return data.id;
    },

    /**
     * Loads a finalized specific request for the user
     * @param {string} requestId 
     */
    getRequestDetails: async (requestId) => {
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
        return data;
    }
};
