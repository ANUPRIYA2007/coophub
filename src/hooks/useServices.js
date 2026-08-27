import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from './useTranslation';

export function useServices() {
    const { language } = useTranslation();
    const [services, setServices] = useState([]);
    const [subServices, setSubServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCatalogue = async () => {
            setLoading(true);
            try {
                // Fetch Services
                const { data: srvData, error: srvError } = await supabase
                    .from('services')
                    .select('*')
                    .eq('active', true)
                    .order('display_order', { ascending: true });

                if (srvError) throw srvError;

                // Fetch Sub-Services
                const { data: subData, error: subError } = await supabase
                    .from('sub_services')
                    .select('*')
                    .eq('active', true)
                    .order('display_order', { ascending: true });

                if (subError) throw subError;

                // Map JSONB translations properly to current language
                const mapTranslations = (item) => ({
                    ...item,
                    name: item.name_translations?.[language] || item.name_translations?.['en'] || '',
                    description: item.description_translations?.[language] || item.description_translations?.['en'] || ''
                });

                setServices((srvData || []).map(mapTranslations));
                setSubServices((subData || []).map(mapTranslations));
            } catch (err) {
                console.error('Error fetching catalogue:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCatalogue();
    }, [language]);

    // Helpers
    const getSubServices = (serviceId) => {
        return subServices.filter(sub => sub.service_id === serviceId);
    };

    return { services, subServices, getSubServices, loading, error };
}
