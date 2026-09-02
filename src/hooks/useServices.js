import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from './useTranslation';

const MASTER_SERVICES = [
    {
        id: 'a0000000-0000-0000-0000-000000000001',
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
        id: 'a0000000-0000-0000-0000-000000000003',
        name: 'AC Repair & Service',
        category: 'Cooling',
        icon: '❄️',
        name_translations: {
            en: 'AC Repair & Service',
            ta: 'ஏசி பழுது மற்றும் பராமரிப்பு',
            hi: 'एसी मरम्मत और सर्विसिंग',
            te: 'AC మరమ్మత్తు & సర్వీసింగ్',
            kn: 'ಎಸಿ ದುರಸ್ತಿ மற்றும் ಸೇವೆ'
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
        id: 'a0000000-0000-0000-0000-000000000002',
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
        id: 'a0000000-0000-0000-0000-000000000004',
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
        id: 'a0000000-0000-0000-0000-000000000005',
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
        id: 'a0000000-0000-0000-0000-000000000010',
        name: 'Domestic Helpers',
        category: 'Domestic',
        icon: '🍲',
        name_translations: {
            en: 'Domestic Helpers',
            ta: 'வீட்டு உதவியாளர்கள்',
            hi: 'घरेलू सहायक',
            te: 'గృహ సహాయకులు',
            kn: 'ಮನೆ ಕೆಲಸದವರು'
        },
        description_translations: {
            en: 'Cooking, household assistance, daily domestic support.',
            ta: 'சமையல், வீட்டு வேலைகள் மற்றும் தினசரி குடும்ப உதவி.',
            hi: 'खाना बनाना, घरेलू सहायता और दैनिक घरेलू सहयोग।',
            te: 'వంట, ఇంటి పనుల సహాయం మరియు రోజువారీ మద్దతు.',
            kn: 'ಅಡುಗೆ, ಮನೆಕೆಲಸ ಮತ್ತು ದೈನಂದಿನ ಗೃಹ ಬೆಂಬಲ.'
        }
    },
    {
        id: 'a0000000-0000-0000-0000-000000000011',
        name: 'Caregiver Services',
        category: 'Healthcare',
        icon: '🩺',
        name_translations: {
            en: 'Caregiver Services',
            ta: 'பராமரிப்பாளர் சேவைகள்',
            hi: 'देखभालकर्ता सेवाएं',
            te: 'సంరక్షక సేవలు',
            kn: 'ಆರೈಕೆದಾರರ ಸೇವೆಗಳು'
        },
        description_translations: {
            en: 'Elder care, patient assistance, home care and nursing support.',
            ta: 'முதியோர் பராமரிப்பு, நோயாளி உதவி மற்றும் செவிலியர் ஆதரவு.',
            hi: 'बुजुर्गों की देखभाल, रोगी सहायता और होम नर्सिंग समर्थन।',
            te: 'వృద్ధుల సంరక్షణ, రోగుల సహాయం మరియు హోమ్ కేర్.',
            kn: 'ಹಿರಿಯರ ಆರೈಕೆ, ರೋಗಿ ಸಹಾಯ ಮತ್ತು ಮನೆ ನರ್ಸಿಂಗ್ ಬೆಂಬಲ.'
        }
    },
    {
        id: 'a0000000-0000-0000-0000-000000000012',
        name: 'Gardening & Landscaping',
        category: 'Outdoor',
        icon: '🌿',
        name_translations: {
            en: 'Gardening & Landscaping',
            ta: 'தோட்டக்கலை & இயற்கையமைப்பு',
            hi: 'बागवानी और लैंडस्केपिंग',
            te: 'గార్డెనింగ్ & ల్యాండ్‌స్కేపింగ్',
            kn: 'ತೋಟಗಾರಿಕೆ ಮತ್ತು ಭೂದೃಶ್ಯ'
        },
        description_translations: {
            en: 'Garden maintenance, plant care, pruning and landscaping.',
            ta: 'தோட்ட பராமரிப்பு, செடி வளர்ப்பு, கவாத்து மற்றும் வடிவமைப்பு.',
            hi: 'बगीचे का रखरखाव, पौधों की देखभाल, छंटाई और लैंडस्केपिंग।',
            te: 'గార్డెన్ నిర్వహణ, మొక్కల సంరక్షణ మరియు ల్యాండ్‌స్కేపిಂಗ್.',
            kn: 'ತೋಟ ನಿರ್ವಹಣೆ, ಸಸ್ಯ ಆರೈಕೆ ಮತ್ತು ಭೂದೃಶ್ಯ ವಿನ್ಯಾಸ.'
        }
    },
    {
        id: 'a0000000-0000-0000-0000-000000000013',
        name: 'Technician Services',
        category: 'Technical',
        icon: '🔧',
        name_translations: {
            en: 'Technician Services',
            ta: 'தொழில்நுட்ப வல்லுநர் சேவைகள்',
            hi: 'तकनीशियन सेवाएं',
            te: 'టెక్నీషియన్ సేవలు',
            kn: 'ತಂತ್ರಜ್ಞರ ಸೇವೆಗಳು'
        },
        description_translations: {
            en: 'Appliance repair, CCTV, electronics and equipment maintenance.',
            ta: 'உபகரண பழுது, சிசிடிவி மற்றும் மின்னணு சாதன பராமரிப்பு.',
            hi: 'उपकरण मरम्मत, सीसीटीवी, इलेक्ट्रॉनिक्स और उपकरण रखरखाव।',
            te: 'ఉపకరణాల మరమ్మత్తు, సీసీటీవీ మరియు ఎలక్ట్రానిక్స్ నిర్వహణ.',
            kn: 'ಉಪಕರಣ ದುರಸ್ತಿ, ಸಿಸಿಟಿವಿ ಮತ್ತು ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್ ನಿರ್ವಹಣೆ.'
        }
    },
    {
        id: 'a0000000-0000-0000-0000-000000000014',
        name: 'Emergency Services',
        category: 'Emergency',
        icon: '🚨',
        name_translations: {
            en: 'Emergency Services',
            ta: 'அவசர சேவைகள்',
            hi: 'आपातकालीन सेवाएं',
            te: 'అత్యవసర సేవలు',
            kn: 'ತುರ್ತು ಸೇವೆಗಳು'
        },
        description_translations: {
            en: '24/7 urgent household and repair assistance.',
            ta: '24/7 அவசர வீட்டு பராமரிப்பு மற்றும் உடனடி பழுதுபார்ப்பு.',
            hi: '24/7 तत्काल घरेलू और मरम्मत सहायता।',
            te: '24/7 అత్యవసర గృహ మరియు మరమ్మత్తు సహాయం.',
            kn: '24/7 ತುರ್ತು ಗೃಹ ಮತ್ತು ದುರಸ್ತಿ ನೆರವು.'
        }
    },
    {
        id: 'a0000000-0000-0000-0000-000000000015',
        name: 'On-Demand Services',
        category: 'On-Demand',
        icon: '⚡',
        name_translations: {
            en: 'On-Demand Services',
            ta: 'தேவைக்கேற்ற உடனடி சேவைகள்',
            hi: 'ऑन-डिमांड सेवाएं',
            te: 'ఆన్-డిమాండ్ సేవలు',
            kn: 'ಆನ್-ಡಿಮಾಂಡ್ ಸೇವೆಗಳು'
        },
        description_translations: {
            en: 'Instant booking for quick and immediate assistance.',
            ta: 'விரைவான மற்றும் உடனடி உதவிக்கான நேரடி முன்பதிவு.',
            hi: 'त्वरित और तत्काल सहायता के लिए त्वरित बुकिंग।',
            te: 'త్వరిత సహాయం కోసం తక్షణ బుకింగ్.',
            kn: 'ತ್ವರಿತ ಮತ್ತು ತಕ್ಷಣದ ನೆರವಿಗಾಗಿ ತ್ವರಿತ ಬುಕಿಂಗ್.'
        }
    },
    {
        id: 'a0000000-0000-0000-0000-000000000016',
        name: 'Verified Cooperative Workers',
        category: 'Cooperative',
        icon: '🛡️',
        name_translations: {
            en: 'Verified Cooperative Workers',
            ta: 'சரிபார்க்கப்பட்ட கூட்டுறவு பணியாளர்கள்',
            hi: 'सत्यापित सहकारी कार्यकर्ता',
            te: 'ధృవీకరించబడిన సహకార కార్మికులు',
            kn: 'ಪರಿಶೀಲಿಸಿದ ಸಹಕಾರಿ ಕಾರ್ಮಿಕರು'
        },
        description_translations: {
            en: 'Verified and skilled workers from cooperative societies.',
            ta: 'கூட்டுறவு சங்கங்களிலிருந்து சரிபார்க்கப்பட்ட திறமையான தொழிலாளர்கள்.',
            hi: 'सहकारी समितियों से सत्यापित और कुशल कार्यकर्ता।',
            te: 'సహకార సంఘాల నుండి నైపుణ్యం కలిగిన కార్మికులు.',
            kn: 'ಸಹಕಾರಿ ಸಂಘಗಳಿಂದ ಪರಿಶೀಲಿಸಿದ ನುರಿತ ಕಾರ್ಮಿಕರು.'
        }
    },
    {
        id: 'a0000000-0000-0000-0000-000000000017',
        name: 'Training & Certification',
        category: 'Training',
        icon: '🎓',
        name_translations: {
            en: 'Training & Certification',
            ta: 'பயிற்சி மற்றும் சான்றிதழ்',
            hi: 'प्रशिक्षण और प्रमाणन',
            te: 'శిక్షణ మరియు ధృవీకరణ',
            kn: 'ತರಬೇತಿ ಮತ್ತು ಪ್ರಮಾಣೀಕರಣ'
        },
        description_translations: {
            en: 'Worker skill development, training and certification.',
            ta: 'தொழிலாளர் திறன் மேம்பாடு, பயிற்சி மற்றும் சான்றிதழ்.',
            hi: 'श्रमिक कौशल विकास, प्रशिक्षण और प्रमाणन।',
            te: 'కార్మికుల నైపుణ్య అభివృద్ధి మరియు ధృవీకరణ.',
            kn: 'ಕಾರ್ಮಿಕ ಕೌಶಲ್ಯ ಅಭಿವೃದ್ಧಿ, ತರಬೇತಿ ಮತ್ತು ಪ್ರಮಾಣೀಕರಣ.'
        }
    },
    {
        id: 'a0000000-0000-0000-0000-000000000007',
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
    }
];

const MASTER_SUB_SERVICES = [
    { id: 'b0000000-0000-0000-0000-000000000004', service_id: 'a0000000-0000-0000-0000-000000000001', name: 'Ceiling Fan & Switchboard Wiring', base_price: 350 },
    { id: 'b0000000-0000-0000-0000-000000000005', service_id: 'a0000000-0000-0000-0000-000000000002', name: 'Pipe Leak Repair & Tap Fixing', base_price: 250 },
    { id: 'b0000000-0000-0000-0000-000000000006', service_id: 'a0000000-0000-0000-0000-000000000003', name: 'Split AC Master Service & Jet Cleaning', base_price: 600 },
    { id: 'b0000000-0000-0000-0000-000000000007', service_id: 'a0000000-0000-0000-0000-000000000004', name: 'Washing Machine Drum & Motor Service', base_price: 650 },
    { id: 'b0000000-0000-0000-0000-000000000008', service_id: 'a0000000-0000-0000-0000-000000000005', name: 'Single Room Wall Painting & Primer', base_price: 2400 },
    { id: 'b0000000-0000-0000-0000-000000000010', service_id: 'a0000000-0000-0000-0000-000000000010', name: 'Daily Cooking & Meal Preparation', base_price: 350 },
    { id: 'b0000000-0000-0000-0000-000000000011', service_id: 'a0000000-0000-0000-0000-000000000010', name: 'Household Assistance & Maid Service', base_price: 500 },
    { id: 'b0000000-0000-0000-0000-000000000020', service_id: 'a0000000-0000-0000-0000-000000000011', name: 'Elder Care & Daily Patient Assistance', base_price: 800 },
    { id: 'b0000000-0000-0000-0000-000000000021', service_id: 'a0000000-0000-0000-0000-000000000011', name: 'Home Nursing & Medication Support', base_price: 1200 },
    { id: 'b0000000-0000-0000-0000-000000000030', service_id: 'a0000000-0000-0000-0000-000000000012', name: 'Garden Maintenance & Lawn Mowing', base_price: 450 },
    { id: 'b0000000-0000-0000-0000-000000000031', service_id: 'a0000000-0000-0000-0000-000000000012', name: 'Plant Care, Pruning & Landscaping', base_price: 650 },
    { id: 'b0000000-0000-0000-0000-000000000040', service_id: 'a0000000-0000-0000-0000-000000000013', name: 'CCTV & Security Camera Setup', base_price: 850 },
    { id: 'b0000000-0000-0000-0000-000000000041', service_id: 'a0000000-0000-0000-0000-000000000013', name: 'Electronics & Equipment Maintenance', base_price: 550 },
    { id: 'b0000000-0000-0000-0000-000000000050', service_id: 'a0000000-0000-0000-0000-000000000014', name: '24/7 Urgent Plumbing & Pipe Burst Fix', base_price: 600 },
    { id: 'b0000000-0000-0000-0000-000000000051', service_id: 'a0000000-0000-0000-0000-000000000014', name: '24/7 Emergency Electrical Short Circuit', base_price: 700 },
    { id: 'b0000000-0000-0000-0000-000000000060', service_id: 'a0000000-0000-0000-0000-000000000015', name: 'Instant 30-Min Priority Dispatch', base_price: 400 },
    { id: 'b0000000-0000-0000-0000-000000000070', service_id: 'a0000000-0000-0000-0000-000000000016', name: 'Verified Skilled Cooperative Technician', base_price: 500 },
    { id: 'b0000000-0000-0000-0000-000000000080', service_id: 'a0000000-0000-0000-0000-000000000017', name: 'Worker Skill Assessment & Certification', base_price: 0 },
    { id: 'b0000000-0000-0000-0000-000000000001', service_id: 'a0000000-0000-0000-0000-000000000007', name: 'Personal City Chauffeur (Local Trip)', base_price: 450 },
    { id: 'b0000000-0000-0000-0000-000000000002', service_id: 'a0000000-0000-0000-0000-000000000007', name: 'Outstation / Full-Day Driver', base_price: 1200 }
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

            try {
                // Fetch Services from Supabase
                const { data: srvData } = await supabase
                    .from('services')
                    .select('*')
                    .eq('active', true)
                    .order('display_order', { ascending: true });

                // Fetch Sub-Services from Supabase
                const { data: subData } = await supabase
                    .from('sub_services')
                    .select('*')
                    .eq('active', true)
                    .order('display_order', { ascending: true });

                const mapTranslations = (item) => ({
                    ...item,
                    name: item.name_translations?.[language] || item.name_translations?.['en'] || item.name || '',
                    description: item.description_translations?.[language] || item.description_translations?.['en'] || item.description || ''
                });

                // Merge database services with master catalog so all standard categories are populated
                let combinedServices = [...MASTER_SERVICES];
                if (srvData && srvData.length > 0) {
                    const dbMapped = srvData.map(mapTranslations);
                    const dbIds = new Set(dbMapped.map(s => s.id));
                    const remainingMasters = MASTER_SERVICES.filter(m => !dbIds.has(m.id)).map(mapTranslations);
                    combinedServices = [...dbMapped, ...remainingMasters];
                } else {
                    combinedServices = MASTER_SERVICES.map(mapTranslations);
                }

                let combinedSubServices = [...MASTER_SUB_SERVICES];
                if (subData && subData.length > 0) {
                    const subMapped = subData.map(mapTranslations);
                    const subDbIds = new Set(subMapped.map(s => s.id));
                    const remainingSubMasters = MASTER_SUB_SERVICES.filter(m => !subDbIds.has(m.id)).map(mapTranslations);
                    combinedSubServices = [...subMapped, ...remainingSubMasters];
                } else {
                    combinedSubServices = MASTER_SUB_SERVICES.map(mapTranslations);
                }

                setServices(combinedServices);
                setSubServices(combinedSubServices);
            } catch (err) {
                console.warn('Using master services catalogue:', err.message);
                const mapTranslations = (item) => ({
                    ...item,
                    name: item.name_translations?.[language] || item.name_translations?.['en'] || item.name || '',
                    description: item.description_translations?.[language] || item.description_translations?.['en'] || item.description || ''
                });
                setServices(MASTER_SERVICES.map(mapTranslations));
                setSubServices(MASTER_SUB_SERVICES.map(mapTranslations));
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

export { MASTER_SERVICES, MASTER_SUB_SERVICES };
export default useServices;
