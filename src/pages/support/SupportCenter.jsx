import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../hooks/useTranslation';
import {
    Search,
    HelpCircle,
    ChevronDown,
    MessageSquare,
    FileText,
    ShieldCheck,
    CreditCard,
    Calendar,
    ThumbsUp,
    ThumbsDown,
    ArrowLeft,
    PhoneCall,
    CheckCircle2,
    LifeBuoy,
    Sparkles,
    Headphones
} from 'lucide-react';

const DEFAULT_FAQS = [
    {
        id: 'faq-1',
        category: 'booking',
        categoryLabel: 'Booking & Dispatch',
        question: 'How do I book a skilled cooperative worker on COOP HUB?',
        answer: 'Navigate to "Services" from the sidebar, select your required service (such as Electrician, Plumber, Carpenter, Appliance Repair, or Painter), choose your preferred date and time, and submit your request. A certified cooperative technician from your local ward cluster will be promptly assigned.',
        question_translations: {
            ta: 'கூப் ஹப்பில் (COOP HUB) ஒரு நிபுணத்துவ தொழிலாளியை எவ்வாறு முன்பதிவு செய்வது?',
            hi: 'COOP HUB पर कुशल सहकारी तकनीशियन कैसे बुक करें?'
        },
        answer_translations: {
            ta: 'பக்கப்பட்டியிலுள்ள "சேவைகள்" பகுதிக்குச் சென்று, உங்களுக்குத் தேவையான சேவையைத் தேர்ந்தெடுத்து, வசதியான தேதி மற்றும் நேரத்தைத் தேர்வுசெய்து முன்பதிவு செய்யுங்கள். உங்கள் பகுதிக்குரிய சான்றளிக்கப்பட்ட தொழில்நுட்ப வல்லுநர் உடனடியாக ஒதுக்கப்படுவார்.',
            hi: 'साइडबार से "Services" पर जाएं, अपनी आवश्यक सेवा चुनें, अपनी पसंद की तारीख और समय चुनें और अनुरोध सबमिट करें। आपके स्थानीय क्लस्टर से एक प्रमाणित तकनीशियन सौंपा जाएगा।'
        }
    },
    {
        id: 'faq-2',
        category: 'safety',
        categoryLabel: 'Safety & Verification',
        question: 'What is the 6-Digit Arrival OTP and when should I share it?',
        answer: 'Your safety is our highest priority. When a technician accepts your booking, a unique 6-digit Arrival OTP is generated on your booking details card. Share this code with the technician only when they arrive at your home in person. The technician cannot begin the job without verifying this OTP.',
        question_translations: {
            ta: '6 இலக்க வருகை OTP என்றால் என்ன மற்றும் அதை எப்போது பகிர வேண்டும்?',
            hi: '6-अंकीय अराइवल OTP क्या है और मुझे इसे कब साझा करना चाहिए?'
        },
        answer_translations: {
            ta: 'உங்கள் பாதுகாப்பு எங்கள் முதன்மையான கடமையாகும். தொழில்நுட்ப வல்லுநர் உங்கள் வீட்டிற்கு நேரில் வந்த பிறகு மட்டுமே இந்த 6 இலக்க வருகை OTP-யை அவரிடம் பகிர வேண்டும். இந்த OTP சரிபார்க்கப்படாமல் வேலையைத் தொடங்க முடியாது.',
            hi: 'आपकी सुरक्षा हमारी सर्वोच्च प्राथमिकता है। जब तकनीशियन व्यक्तिगत रूप से आपके घर पहुंचे, तभी यह 6-अंकीय OTP उनके साथ साझा करें। इस OTP के सत्यापन के बिना काम शुरू नहीं किया जा सकता।'
        }
    },
    {
        id: 'faq-3',
        category: 'pricing',
        categoryLabel: 'Tariffs & Pricing',
        question: 'How are service prices and tariffs determined?',
        answer: 'COOP HUB follows statutory cooperative tariffs approved by the Cooperative Board with 0% surge pricing. Standard inspection and initial labor charges are transparently fixed upfront. There are no surprise platform charges, surge multipliers, or peak-hour markups.',
        question_translations: {
            ta: 'சேவை கட்டணங்கள் மற்றும் கட்டண விபரங்கள் எவ்வாறு நிர்ணயிக்கப்படுகின்றன?',
            hi: 'सेवा मूल्य और टैरिफ कैसे निर्धारित किए जाते हैं?'
        },
        answer_translations: {
            ta: 'கூப் ஹப் கூட்டுறவு வாரியத்தால் அங்கீகரிக்கப்பட்ட நிலையான கட்டணங்களை 0% கூடுதல் கட்டண உயர்வு (Surge) இன்றி வழங்குகிறது. மறைக்கப்பட்ட கட்டணங்கள் எதுவும் இல்லை.',
            hi: 'COOP HUB सहकारी बोर्ड द्वारा अनुमोदित पारदर्शी टैरिफ का पालन करता है जिसमें 0% सर्ज प्राइसिंग है। मानक निरीक्षण और श्रम शुल्क पहले से तय होते हैं।'
        }
    },
    {
        id: 'faq-4',
        category: 'booking',
        categoryLabel: 'Booking & Dispatch',
        question: 'Can I track the technician in real-time?',
        answer: 'Yes. Once a technician is dispatched, you can view their real-time status, estimated time of arrival (ETA), and reach out to them via direct call or secure in-app messaging through your "Bookings" page.',
        question_translations: {
            ta: 'தொழில்நுட்ப வல்லுநரை நிகழ்நேரத்தில் கண்காணிக்க முடியுமா?',
            hi: 'क्या मैं तकनीशियन को रीयल-टाइम में ट्रैक कर सकता हूँ?'
        },
        answer_translations: {
            ta: 'ஆம். தொழில்நுட்ப வல்லுநர் புறப்பட்டதும், "Bookings" பக்கத்தின் மூலம் அவரது வருகை நேரம், இருப்பிட நிலை ஆகியவற்றை அறிந்துகொள்ளலாம் மற்றும் நேரடியாகத் தொடர்பு கொள்ளலாம்.',
            hi: 'हाँ। तकनीशियन के निकलने के बाद, आप "Bookings" पेज के माध्यम से उनका रीयल-टाइम स्टेटस, आगमन का समय (ETA) और संपर्क विवरण देख सकते हैं।'
        }
    },
    {
        id: 'faq-5',
        category: 'pricing',
        categoryLabel: 'Payments & Escrow',
        question: 'What payment methods are supported for service bookings?',
        answer: 'You can pay using UPI (Google Pay, PhonePe, Paytm, BHIM), Net Banking, Debit/Credit Cards, or Cash on Completion directly to the technician. All online transactions are held in safe escrow until work is completed to your satisfaction.',
        question_translations: {
            ta: 'சேவை முன்பதிவுகளுக்கு என்ன கட்டண முறைகள் ஆதரிக்கப்படுகின்றன?',
            hi: 'सेवा बुकिंग के लिए कौन से भुगतान तरीके समर्थित हैं?'
        },
        answer_translations: {
            ta: 'UPI, நெட் பேங்கிங், டெபிட்/கிரெடிட் கார்டுகள் அல்லது வேலை முடிந்த பிறகு பணமாக (Cash on Delivery) செலுத்தலாம்.',
            hi: 'आप UPI, नेट बैंकिंग, डेबिट/क्रेडिट कार्ड या काम पूरा होने पर नकद (Cash on Delivery) द्वारा भुगतान कर सकते हैं।'
        }
    },
    {
        id: 'faq-6',
        category: 'safety',
        categoryLabel: 'Safety & Verification',
        question: 'Are COOP HUB technicians background verified and certified?',
        answer: 'Yes. Every technician on COOP HUB is an authenticated cooperative member with verified trade qualifications (ITI, NSDC, or Polytechnic diploma) and statutory identity checks conducted before they can accept customer service calls.',
        question_translations: {
            ta: 'கூப் ஹப் தொழில்நுட்ப வல்லுநர்கள் சான்றிதழ் மற்றும் பின்னணி சரிபார்க்கப்பட்டவர்களா?',
            hi: 'क्या COOP HUB तकनीशियन पृष्ठभूमि सत्यापित और प्रमाणित हैं?'
        },
        answer_translations: {
            ta: 'ஆம். ஒவ்வொரு தொழில்நுட்ப வல்லுநரும் ITI, NSDC அல்லது பாலிடெக்னிக் தொழில் தகுதிகள் மற்றும் அடையாள சரிபார்ப்புகளை நிறைவு செய்த கூட்டுறவு சங்க உறுப்பினர்கள் ஆவர்.',
            hi: 'हाँ। प्रत्येक तकनीशियन ITI/NSDC प्रमाणित और पृष्ठभूमि सत्यापित सहकारी सदस्य होता है।'
        }
    },
    {
        id: 'faq-7',
        category: 'pricing',
        categoryLabel: 'Tariffs & Pricing',
        question: 'What if replacement parts or materials are needed during service?',
        answer: 'If parts need replacement (such as switches, pipes, valves, or components), the technician will inspect the issue and present an itemized rate card with standard MRP before purchasing or installing anything. You may also supply the replacement parts yourself.',
        question_translations: {
            ta: 'பழுதுபார்க்கும் போது உதிரி பாகங்கள் தேவைப்பட்டால் என்ன செய்வது?',
            hi: 'यदि सेवा के दौरान अतिरिक्त स्पेयर पार्ट्स की आवश्यकता हो तो क्या होगा?'
        },
        answer_translations: {
            ta: 'உதிரி பாகங்கள் தேவைப்பட்டால், தொழில்நுட்ப வல்லுநர் நிலையான MRP விலைப் பட்டியலை உங்களிடம் காண்பித்து அனுமதி பெற்ற பின்னரே அவற்றை வாங்குவார். அல்லது நீங்களே உதிரிபாகங்களை வாங்கித் தரலாம்.',
            hi: 'यदि स्पेयर पार्ट्स बदलने की आवश्यकता है, तो तकनीशियन आपको उचित मूल्य सूची दिखाएगा और आपकी सहमति के बाद ही खरीदेगा।'
        }
    },
    {
        id: 'faq-8',
        category: 'booking',
        categoryLabel: 'Booking & Dispatch',
        question: 'How do I cancel or reschedule my booking?',
        answer: 'You can cancel or reschedule easily from your "Bookings" tab. Cancellations made before the technician departs are 100% free with immediate full refund if paid online.',
        question_translations: {
            ta: 'முன்பதிவை எவ்வாறு ரத்து செய்வது அல்லது மாற்று நேரத்திற்கு மாற்றுவது?',
            hi: 'मैं अपनी बुकिंग कैसे रद्द या पुनर्निर्धारित कर सकता हूँ?'
        },
        answer_translations: {
            ta: 'உங்கள் "Bookings" பக்கத்தில் எளிதாக ரத்து செய்யலாம் அல்லது நேரத்தை மாற்றிக்கொள்ளலாம். தொழில்நுட்ப வல்லுநர் புறப்படுவதற்கு முன் செய்யப்படும் ரத்துகளுக்கு எந்தக் கட்டணமும் இல்லை.',
            hi: 'आप अपने "Bookings" टैब से आसानी से रद्द या पुनर्निर्धारित कर सकते हैं। तकनीशियन के निकलने से पहले रद्दीकरण पूरी तरह से निःशुल्क है।'
        }
    },
    {
        id: 'faq-9',
        category: 'support',
        categoryLabel: 'Customer Protection',
        question: 'What should I do if I am not satisfied with the completed service?',
        answer: 'We provide a Cooperative Satisfaction Guarantee. You can open a ticket under "Contact Support" or raise a dispute within 48 hours of service completion. Our cluster coordinator will arrange a free inspection re-visit or issue an escrow refund.',
        question_translations: {
            ta: 'வழங்கப்பட்ட சேவையில் திருப்தி இல்லையெனில் நான் என்ன செய்ய வேண்டும்?',
            hi: 'यदि मैं पूरी की गई सेवा से संतुष्ट नहीं हूँ तो मुझे क्या करना चाहिए?'
        },
        answer_translations: {
            ta: 'வேலை முடிந்த 48 மணி நேரத்திற்குள் "Contact Support" மூலம் புகார் அளிக்கலாம். கூட்டுறவு மேற்பார்வையாளர் இலவச மறு ஆய்வு அல்லது பணத்தைத் திரும்பப் பெற ஏற்பாடு செய்வார்.',
            hi: 'काम पूरा होने के 48 घंटों के भीतर "Contact Support" पर टिकट खोलें। हमारे समन्वयक निःशुल्क पुनः-निरीक्षण या रिफंड की व्यवस्था करेंगे।'
        }
    },
    {
        id: 'faq-10',
        category: 'support',
        categoryLabel: 'Customer Protection',
        question: 'How can I contact customer care or reach a cooperative officer?',
        answer: 'You can tap "Contact Support" to submit an inquiry, converse 24/7 with our CoopBot AI assistant, or call the National Cooperative Citizen Helpline toll-free at 1800-425-COOP (2667).',
        question_translations: {
            ta: 'வாடிக்கையாளர் சேவையை அல்லது அதிகாரியை எவ்வாறு நேரடியாகத் தொடர்பு கொள்வது?',
            hi: 'मैं कस्टमर केयर या सहकारी अधिकारी से कैसे संपर्क कर सकता हूँ?'
        },
        answer_translations: {
            ta: 'மேலே உள்ள "Contact Support" பொத்தானை அழுத்தி டிக்கெட் பதிவு செய்யலாம், CoopBot AI உடன் பேசலாம் அல்லது 1800-425-COOP (2667) கட்டணமில்லா எண்ணை அழைக்கலாம்.',
            hi: 'आप "Contact Support" पर क्लिक कर सकते हैं, CoopBot AI से बात कर सकते हैं, या 1800-425-COOP (2667) टोल-फ्री पर कॉल कर सकते हैं।'
        }
    }
];

const CATEGORIES = [
    { id: 'all', label: 'All Topics' },
    { id: 'booking', label: 'Booking & Dispatch' },
    { id: 'safety', label: 'Safety & OTP' },
    { id: 'pricing', label: 'Tariffs & Payments' },
    { id: 'support', label: 'Support & Grievances' }
];

export default function SupportCenter() {
    const navigate = useNavigate();
    const { t, language } = useTranslation();
    const [faqs, setFaqs] = useState(DEFAULT_FAQS);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [openFaq, setOpenFaq] = useState('faq-1');
    const [feedback, setFeedback] = useState({});

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const { data, error } = await supabase
                    .from('faq')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: true });

                if (!error && data && data.length > 0) {
                    // Prepend database FAQs to default FAQs, avoiding duplicates
                    const dbIds = new Set(data.map(item => item.id));
                    const merged = [
                        ...data,
                        ...DEFAULT_FAQS.filter(item => !dbIds.has(item.id))
                    ];
                    setFaqs(merged);
                } else {
                    setFaqs(DEFAULT_FAQS);
                }
            } catch (err) {
                console.warn("Using default FAQs due to fetch failure", err);
                setFaqs(DEFAULT_FAQS);
            } finally {
                setLoading(false);
            }
        };
        fetchFaqs();
    }, []);

    const toggleFaq = (id) => {
        setOpenFaq(prev => prev === id ? null : id);
    };

    const handleFeedback = (faqId, isHelpful, e) => {
        e.stopPropagation();
        setFeedback(prev => ({
            ...prev,
            [faqId]: isHelpful
        }));
    };

    // Helper to resolve localized FAQ text
    const getFaqText = (faq, field) => {
        if (faq[`${field}_translations`]?.[language]) {
            return faq[`${field}_translations`][language];
        }
        const rawText = faq[field] || faq[`${field}_translations`]?.['en'] || '';
        if (!rawText) return '';
        return t(rawText);
    };

    // Filter FAQs based on search and category
    const filteredFaqs = useMemo(() => {
        return faqs.filter(faq => {
            const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
            const q = getFaqText(faq, 'question').toLowerCase();
            const a = getFaqText(faq, 'answer').toLowerCase();
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = !query || q.includes(query) || a.includes(query);
            return matchesCategory && matchesSearch;
        });
    }, [faqs, selectedCategory, searchQuery, language]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col space-y-4 max-w-4xl mx-auto pt-10">
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-6 animate-pulse"></div>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full animate-pulse"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 pb-24 pt-6 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Header with back navigation */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-navy-100 dark:border-slate-800 text-navy-600 dark:text-slate-300 hover:bg-navy-50 dark:hover:bg-slate-800 transition-all shadow-xs"
                            title="Go Back"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-navy-900 dark:text-white tracking-tight flex items-center gap-2">
                                <span>{t('Help & Support')}</span>
                                <span className="text-xs bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 font-bold px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-900">
                                    {t('24/7 Available')}
                                </span>
                            </h1>
                            <p className="text-xs sm:text-sm text-navy-500 dark:text-slate-400 mt-0.5">
                                {t('Find instant answers, check service policies, or reach dedicated support officers.')}
                            </p>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
                        <ShieldCheck size={16} />
                        <span>{t('Citizen Protection Guarantee')}</span>
                    </div>
                </div>

                {/* Quick Action Navigation Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                        onClick={() => navigate('/support/new')} 
                        className="group relative bg-white p-5 rounded-2xl border border-navy-100 shadow-xs hover:shadow-lg hover:border-orange-300 hover:-translate-y-0.5 transition-all text-left overflow-hidden"
                    >
                        {/* Gradient accent */}
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        <div className="relative">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl border border-orange-100 group-hover:scale-110 group-hover:bg-orange-100 transition-all">
                                    <MessageSquare size={22} />
                                </div>
                                <span className="text-[11px] font-extrabold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
                                    New Ticket
                                </span>
                            </div>
                            <h3 className="font-extrabold text-navy-900 text-base group-hover:text-orange-600 transition-colors mb-1">
                                {t('Contact Support')}
                            </h3>
                            <p className="text-xs text-navy-500 leading-relaxed">
                                {t('Open a new inquiry or request resolution from a cooperative ward officer.')}
                            </p>
                            <div className="flex items-center gap-1.5 mt-3 text-[11px] font-semibold text-orange-600">
                                <span>Avg. response: 15 min</span>
                                <span className="w-1 h-1 rounded-full bg-orange-400"></span>
                                <span>24/7 Active</span>
                            </div>
                        </div>
                    </button>

                    <button 
                        onClick={() => navigate('/support/tickets')} 
                        className="group relative bg-white p-5 rounded-2xl border border-navy-100 shadow-xs hover:shadow-lg hover:border-navy-300 hover:-translate-y-0.5 transition-all text-left overflow-hidden"
                    >
                        {/* Gradient accent */}
                        <div className="absolute inset-0 bg-gradient-to-br from-navy-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        <div className="relative">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-navy-50 text-navy-600 rounded-2xl border border-navy-100 group-hover:scale-110 group-hover:bg-navy-100 transition-all">
                                    <FileText size={22} />
                                </div>
                                <span className="text-[11px] font-extrabold text-navy-600 bg-navy-50 border border-navy-200 px-2.5 py-1 rounded-full">
                                    Track Status
                                </span>
                            </div>
                            <h3 className="font-extrabold text-navy-900 text-base group-hover:text-navy-700 transition-colors mb-1">
                                {t('My Tickets')}
                            </h3>
                            <p className="text-xs text-navy-500 leading-relaxed">
                                {t('Check the real-time progress and history of your submitted support inquiries.')}
                            </p>
                            <div className="flex items-center gap-1.5 mt-3 text-[11px] font-semibold text-navy-500">
                                <span>Live status updates</span>
                                <span className="w-1 h-1 rounded-full bg-navy-300"></span>
                                <span>Full audit trail</span>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Quick Info Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white border border-navy-100 rounded-2xl p-3.5 text-center shadow-xs">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center mx-auto mb-2">
                            <Headphones size={18} />
                        </div>
                        <div className="text-base font-black text-navy-900">24/7</div>
                        <div className="text-[11px] font-semibold text-navy-600 mt-0.5">Support Hours</div>
                    </div>
                    <div className="bg-white border border-navy-100 rounded-2xl p-3.5 text-center shadow-xs">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-2">
                            <CheckCircle2 size={18} />
                        </div>
                        <div className="text-base font-black text-navy-900">&lt;15 min</div>
                        <div className="text-[11px] font-semibold text-navy-600 mt-0.5">First Response</div>
                    </div>
                    <div className="bg-white border border-navy-100 rounded-2xl p-3.5 text-center shadow-xs">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto mb-2">
                            <ShieldCheck size={18} />
                        </div>
                        <div className="text-base font-black text-navy-900">100%</div>
                        <div className="text-[11px] font-semibold text-navy-600 mt-0.5">Resolved Rate</div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-100 dark:border-slate-800 pb-4">
                        <div>
                            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                                <HelpCircle size={20} className="text-orange-500" />
                                <span>{t('Frequently Asked Questions')}</span>
                            </h2>
                            <p className="text-xs text-navy-500 dark:text-slate-400 mt-0.5">
                                {t('Instant answers to common questions about booking, safety OTP, tariffs, and payments.')}
                            </p>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-72">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400 dark:text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('Search questions or keywords...')}
                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-navy-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-navy-900 dark:text-white placeholder-navy-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-2xs"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700 text-xs font-bold"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {CATEGORIES.map(cat => {
                            const isSelected = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                        isSelected
                                            ? 'bg-orange-500 text-white shadow-xs'
                                            : 'bg-white dark:bg-slate-900 border border-navy-100 dark:border-slate-800 text-navy-600 dark:text-slate-300 hover:bg-navy-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {t(cat.label)}
                                </button>
                            );
                        })}
                    </div>

                    {/* FAQ Items List */}
                    {filteredFaqs.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-navy-100 dark:border-slate-800 shadow-xs mt-4 space-y-3">
                            <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-500 mx-auto flex items-center justify-center">
                                <Search size={22} />
                            </div>
                            <h4 className="font-bold text-navy-900 dark:text-white text-sm">{t('No matching questions found')}</h4>
                            <p className="text-navy-400 dark:text-slate-400 text-xs max-w-sm mx-auto">
                                {t("We couldn't find any questions matching")} "{searchQuery}". {t("Try a different keyword or contact our support team.")}
                            </p>
                            <button
                                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                                className="px-4 py-2 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-xl transition-all"
                            >
                                {t('Reset Filters')}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredFaqs.map((faq, index) => {
                                const question = getFaqText(faq, 'question');
                                const answer = getFaqText(faq, 'answer');
                                const isOpen = openFaq === faq.id;
                                const currentFeedback = feedback[faq.id];

                                return (
                                    <div 
                                        key={faq.id} 
                                        className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden transition-all shadow-xs ${
                                            isOpen 
                                                ? 'border-orange-300 dark:border-orange-900/60 shadow-sm' 
                                                : 'border-navy-100 dark:border-slate-800 hover:border-navy-200 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <button
                                            className="w-full text-left p-4 sm:p-5 font-semibold text-navy-900 dark:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/50 flex justify-between items-start sm:items-center gap-4 focus:outline-none transition-colors"
                                            onClick={() => toggleFaq(faq.id)}
                                        >
                                            <div className="space-y-1 pr-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-navy-500 dark:text-slate-400">
                                                        {t(faq.categoryLabel || faq.category || 'General')}
                                                    </span>
                                                </div>
                                                <span className="text-sm sm:text-base font-bold block text-navy-900 dark:text-white leading-snug">
                                                    {question}
                                                </span>
                                            </div>
                                            <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-navy-500 dark:text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 bg-orange-50 dark:bg-orange-950 text-orange-500' : ''}`}>
                                                <ChevronDown size={18} />
                                            </div>
                                        </button>

                                        {isOpen && (
                                            <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-navy-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
                                                <p className="mt-2">{answer}</p>

                                                {/* Micro Feedback Interaction */}
                                                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-navy-400 dark:text-slate-400">
                                                    <span>{t('Was this helpful?')}</span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => handleFeedback(faq.id, true, e)}
                                                            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all ${
                                                                currentFeedback === true
                                                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold'
                                                                    : 'hover:bg-slate-200/60 dark:hover:bg-slate-800 text-navy-500 dark:text-slate-400'
                                                            }`}
                                                        >
                                                            <ThumbsUp size={12} />
                                                            <span>{currentFeedback === true ? t('Helpful!') : t('Yes')}</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleFeedback(faq.id, false, e)}
                                                            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all ${
                                                                currentFeedback === false
                                                                    ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold'
                                                                    : 'hover:bg-slate-200/60 dark:hover:bg-slate-800 text-navy-500 dark:text-slate-400'
                                                            }`}
                                                        >
                                                            <ThumbsDown size={12} />
                                                            <span>{currentFeedback === false ? t('Noted') : t('No')}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Still Need Assistance Banner */}
                <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="space-y-1.5 max-w-lg">
                            <span className="inline-block bg-white/20 text-white text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                                {t('Dedicated Cooperative Support')}
                            </span>
                            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                                {t("Still can't find what you need?")}
                            </h3>
                            <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                                {t('Our support team and cluster grievance officers are here to help resolve any inquiry or booking dispute.')}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <button
                                onClick={() => navigate('/support/new')}
                                className="px-5 py-3 bg-white text-orange-600 hover:bg-orange-50 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                            >
                                <MessageSquare size={16} />
                                <span>{t('Create Support Ticket')}</span>
                            </button>
                            <a
                                href="tel:18004252667"
                                className="px-4 py-3 bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/30 backdrop-blur-xs transition-all flex items-center gap-2"
                            >
                                <PhoneCall size={16} />
                                <span>1800-425-COOP</span>
                            </a>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
