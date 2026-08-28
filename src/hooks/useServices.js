import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from './useTranslation';

const DEMO_SERVICES = [
    {
        id: 'srv-1',
        name: 'Electrical Repair',
        category: 'Electrical',
        icon: '⚡',
        name_translations: {
            en: 'Electrical Repair',
            ta: 'மின்சார பழுதுபார்ப்பு',
            hi: 'बिजली मरम्मत',
            te: 'విద్యుత్ మరమ్మత్తు',
            kn: 'ವಿದ್ಯುತ್ ದುರಸ್ತಿ'
        },
        description_translations: {
            en: 'Fan repair, switchboard wiring, inverter installation & short circuit fixes.',
            ta: 'மின்விசிறி பழுது, சுவிட்ச்போர்டு வயரிங் மற்றும் இன்வெர்ட்டர் பொருத்துதல்.',
            hi: 'पंखा मरम्मत, स्विचबोर्ड वायरिंग और इन्वर्टर इंस्टॉलेशन।',
            te: 'ఫ్యాన్ మరమ్మత్తు, స్విచ్‌బోర్డ్ వైరింగ్ మరియు ఇన్వర్టర్ ఇన్‌స్టాలేషన్.',
            kn: 'ಫ್ಯಾನ್ ದುರಸ್ತಿ, ಸ್ವಿಚ್‌ಬೋರ್ಡ್ ವೈರಿಂಗ್ ಮತ್ತು ಇನ್ವರ್ಟರ್ ಸ್ಥಾಪನೆ.'
        }
    },
    {
        id: 'srv-2',
        name: 'AC Repair & Service',
        category: 'Cooling',
        icon: '❄️',
        name_translations: {
            en: 'AC Repair & Service',
            ta: 'ஏசி பழுது மற்றும் பராமரிப்பு',
            hi: 'एसी मरम्मत और सर्विसिंग',
            te: 'AC మరమ్మత్తు & సర్వీసింగ్',
            kn: 'ಎಸಿ ದುರಸ್ತಿ ಮತ್ತು ಸೇವೆ'
        },
        description_translations: {
            en: 'Gas leak repair, deep jet pump cleaning, cooling issues and PCB service.',
            ta: 'கேஸ் கசிவு சரிசெய்தல், ஜெட் பம்ப் சர்வீஸ் மற்றும் கூலிங் பராமரிப்பு.',
            hi: 'गैस रिसाव मरम्मत, जेट पंप सफाई और कूलिंग समस्या निवारण।',
            te: 'గ్యాస్ లీక్ మరమ్మత్తు, జెట్ పంప్ క్లీనింగ్ మరియు కూలింగ్ సర్వీస్.',
            kn: 'ಅನಿಲ ಸೋರಿಕೆ ದುರಸ್ತಿ, ಜೆಟ್ ಪಂಪ್ ಕ್ಲೀನಿಂಗ್ ಮತ್ತು ಕೂಲಿಂಗ್ ಸೇವೆ.'
        }
    },
    {
        id: 'srv-3',
        name: 'Plumbing & Pipe Fixing',
        category: 'Plumbing',
        icon: '🔧',
        name_translations: {
            en: 'Plumbing & Pipe Fixing',
            ta: 'பிளம்பிங் மற்றும் குழாய் பொருத்துதல்',
            hi: 'प्लंबिंग और पाइप मरम्मत',
            te: 'ప్లంబింగ్ & పైప్ మరమ్మత్తు',
            kn: 'ಪ್ಲಂಬಿಂಗ್ ಮತ್ತು ಪೈಪ್ ಸರಿಪಡಿಸುವಿಕೆ'
        },
        description_translations: {
            en: 'Pipe leakage, tap fixture replacement, motor installation and drainage blockage.',
            ta: 'குழாய் கசிவு, புதிய குழாய் பொருத்துதல் மற்றும் மோட்டார் சர்வீஸ்.',
            hi: 'पाइप रिसाव, नल फिक्सिंग और मोटर इंस्टॉलेशन।',
            te: 'పైప్ లీకేజ్, ట్యాప్ ఫిక్సింగ్ మరియు మోటార్ సర్వీస్.',
            kn: 'ಪೈಪ್ ಸೋರಿಕೆ, ಟ್ಯಾಪ್ ಜೋಡಣೆ ಮತ್ತು ಮೋಟಾರ್ ಸ್ಥಾಪನೆ.'
        }
    },
    {
        id: 'srv-4',
        name: 'Appliance Repair',
        category: 'Appliances',
        icon: '🧺',
        name_translations: {
            en: 'Appliance Repair',
            ta: 'வீட்டு உபகரணங்கள் பழுதுபார்ப்பு',
            hi: 'उपकरण मरम्मत',
            te: 'గృహోపకరణాల మరమ్మత్తు',
            kn: 'ಉಪಕರಣಗಳ ದುರಸ್ತಿ'
        },
        description_translations: {
            en: 'Washing machine, refrigerator, microwave oven and water purifier service.',
            ta: 'வாஷிங் மெஷின், ஃப்ரிட்ஜ், மைக்ரோவேவ் மற்றும் ஆர்.ஓ பியூரிஃபையர் சர்வீஸ்.',
            hi: 'वॉशिंग मशीन, फ्रिज और माइक्रोवेव मरम्मत।',
            te: 'వాషింగ్ మెషిన్, ఫ్రిజ్ మరియు మైక్రోవేవ్ సర్వీస్.',
            kn: 'ವಾಷಿಂಗ್ ಮೆಷಿನ್, ಫ್ರಿಜ್ ಮತ್ತು ಮೈಕ್ರೋವೇವ್ ದುರಸ್ತಿ.'
        }
    },
    {
        id: 'srv-5',
        name: 'House Painting & Polish',
        category: 'Painting',
        icon: '🎨',
        name_translations: {
            en: 'House Painting & Polish',
            ta: 'வீட்டு பெயிண்டிங் மற்றும் பாலிஷ்',
            hi: 'हाउस पेंटिंग और पॉलिश',
            te: 'హౌస్ పెయింటింగ్ & పాలిష్',
            kn: 'ಮನೆ ಪೇಂಟಿಂಗ್ ಮತ್ತು ಪಾಲಿಶ್'
        },
        description_translations: {
            en: 'Interior & exterior emulsion painting, wood polish and waterproofing.',
            ta: 'உள் மற்றும் வெளி சுவர் பெயிண்டிங், மர பாலிஷ் மற்றும் வாட்டர்ப்ரூஃபிங்.',
            hi: 'आंतरिक और बाहरी पेंटिंग, लकड़ी की पॉलिश और वॉटरप्रूफिंग।',
            te: 'ఇంటీరియర్ మరియు ఎక్స్‌టీరియర్ పెయింటింగ్ మరియు వాటర్‌ప్రూఫింగ్.',
            kn: 'ಒಳಾಂಗಣ ಮತ್ತು ಹೊರಾಂಗಣ ಪೇಂಟಿಂಗ್ ಮತ್ತು ವಾಟರ್‌ಪ್ರೂಫಿಂಗ್.'
        }
    },
    {
        id: 'srv-driver',
        name: 'Professional Driver Services',
        category: 'Transport',
        icon: '🚗',
        name_translations: {
            en: 'Professional Driver Services',
            ta: 'தொழில்முறை ஓட்டுநர் சேவை',
            hi: 'पेशेवर ड्राइवर सेवा',
            te: 'డ్రైవర్ సేవలు',
            kn: 'ಡ್ರೈವರ್ ಸೇವೆಗಳು'
        },
        description_translations: {
            en: 'Verified personal and commercial chauffeurs for local and outstation trips.',
            ta: 'உள்ளூர் மற்றும் வெளியூர் பயணங்களுக்கான சரிபார்க்கப்பட்ட ஓட்டுநர்கள்.',
            hi: 'स्थानीय और बाहरी यात्राओं के लिए सत्यापित पेशेवर ड्राइवर।',
            te: 'స్థానిక మరియు అవుట్‌స్టేషన్ ప్రయాణాల కోసం డ్రైవర్లు.',
            kn: 'ಸ್ಥಳೀಯ ಮತ್ತು ಹೊರಗಿನ ಪ್ರಯಾಣಕ್ಕಾಗಿ ಪರಿಶೀಲಿಸಿದ ಚಾಲಕರು.'
        }
    },
    {
        id: 'srv-others',
        name: 'Specialized & Custom Trades',
        category: 'Specialized',
        icon: '🛠️',
        name_translations: {
            en: 'Specialized & Custom Trades',
            ta: 'சிறப்புத் தொழில்கள்',
            hi: 'विशेषज्ञ सेवाएं',
            te: 'ప్రత్యేక సేవలు',
            kn: 'ವಿಶೇಷ ಸೇವೆಗಳು'
        },
        description_translations: {
            en: 'CCTV installation, welding, masonry, and on-demand artisan trades.',
            ta: 'சிசிடிவி பொருத்துதல், வெல்டிங் மற்றும் இதர பணிகள்.',
            hi: 'सीसीटीवी स्थापना, वेल्डिंग और कस्टम सेवाएं।',
            te: 'సీసీటీవీ ఇన్‌స్టాలేషన్ మరియు ఇతర సేవలు.',
            kn: 'ಸಿಸಿಟಿವಿ ಸ್ಥಾಪನೆ ಮತ್ತು ಇತರ ವಿಶೇಷ ಸೇವೆಗಳು.'
        }
    }
];

const DEMO_SUB_SERVICES = [
    { id: 'sub-1', service_id: 'srv-1', name: 'Ceiling Fan & Switchboard Wiring', base_price: 350 },
    { id: 'sub-2', service_id: 'srv-1', name: 'MCB Trip & Short Circuit Inspection', base_price: 450 },
    { id: 'sub-3', service_id: 'srv-1', name: 'Inverter & Battery Setup', base_price: 800 },
    { id: 'sub-4', service_id: 'srv-2', name: 'AC Jet Cleaning & Filter Wash', base_price: 600 },
    { id: 'sub-5', service_id: 'srv-2', name: 'AC Gas Leak Refill & Check', base_price: 1800 },
    { id: 'sub-6', service_id: 'srv-3', name: 'Tap & Mixer Replacement', base_price: 250 },
    { id: 'sub-7', service_id: 'srv-3', name: 'Water Leakage & Clog Removal', base_price: 400 },
    { id: 'sub-8', service_id: 'srv-4', name: 'Washing Machine Drum & Motor Service', base_price: 650 },
    { id: 'sub-9', service_id: 'srv-5', name: 'Single Room Wall Painting & Primer', base_price: 2400 },
    { id: 'sub-driver-1', service_id: 'srv-driver', name: 'Personal City Chauffeur (Local Trip)', base_price: 450 },
    { id: 'sub-driver-2', service_id: 'srv-driver', name: 'Outstation / Full-Day Driver', base_price: 1200 },
    { id: 'sub-other-1', service_id: 'srv-others', name: 'CCTV & Smart Security Setup', base_price: 850 }
];

export function useServices() {
    const { language } = useTranslation();
    const [services, setServices] = useState([]);
    const [subServices, setSubServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCatalogue = async () => {
            setLoading(true);
            const isDemo = localStorage.getItem('coophub_demo_customer') === 'true';

            try {
                // Fetch Services from Supabase
                const { data: srvData, error: srvError } = await supabase
                    .from('services')
                    .select('*')
                    .eq('active', true)
                    .order('display_order', { ascending: true });

                // Fetch Sub-Services from Supabase
                const { data: subData, error: subError } = await supabase
                    .from('sub_services')
                    .select('*')
                    .eq('active', true)
                    .order('display_order', { ascending: true });

                const mapTranslations = (item) => ({
                    ...item,
                    name: item.name_translations?.[language] || item.name_translations?.['en'] || item.name || '',
                    description: item.description_translations?.[language] || item.description_translations?.['en'] || item.description || ''
                });

                if (srvData && srvData.length > 0) {
                    setServices(srvData.map(mapTranslations));
                    setSubServices(subData ? subData.map(mapTranslations) : []);
                } else if (isDemo) {
                    // In Demo Mode: provide complete catalogue
                    setServices(DEMO_SERVICES.map(mapTranslations));
                    setSubServices(DEMO_SUB_SERVICES.map(mapTranslations));
                } else {
                    setServices([]);
                    setSubServices([]);
                }
            } catch (err) {
                if (isDemo) {
                    const mapTranslations = (item) => ({
                        ...item,
                        name: item.name_translations?.[language] || item.name_translations?.['en'] || item.name || '',
                        description: item.description_translations?.[language] || item.description_translations?.['en'] || item.description || ''
                    });
                    setServices(DEMO_SERVICES.map(mapTranslations));
                    setSubServices(DEMO_SUB_SERVICES.map(mapTranslations));
                } else {
                    setError(err.message);
                }
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
