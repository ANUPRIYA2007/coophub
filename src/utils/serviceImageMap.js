// Service Image Mapping for Customer Services Catalog
import electricalRepairImg from '../assets/images/services/electrical_repair.png';
import plumbingServiceImg from '../assets/images/services/plumbing_service.png';
import acRepairHvacImg from '../assets/images/services/ac_repair_hvac.png';
import carpentryWoodworkImg from '../assets/images/services/carpentry_woodwork.png';
import paintingWaterproofingImg from '../assets/images/services/painting_waterproofing.png';
import deepHomeCleaningImg from '../assets/images/services/deep_home_cleaning.png';
import professionalDriverServicesImg from '../assets/images/services/professional_driver_services.png';
import domesticHelpersImg from '../assets/images/services/domestic_helpers.png';
import caregiverServicesImg from '../assets/images/services/caregiver_services.png';
import gardeningLandscapingImg from '../assets/images/services/gardening_landscaping.png';
import technicianServicesImg from '../assets/images/services/technician_services.png';
import emergencyServicesImg from '../assets/images/services/emergency_services.png';

// New missing service images
import specializedCustomTradesImg from '../assets/images/services/specialized_custom_trades.jpg';
import onDemandServicesImg from '../assets/images/services/on_demand_services.jpg';
import verifiedCooperativeWorkersImg from '../assets/images/services/verified_cooperative_workers.jpg';
import trainingCertificationImg from '../assets/images/services/training_certification.jpg';

export const SERVICE_IMAGE_MAP = {
    'electrical_repair': electricalRepairImg,
    'plumbing_service': plumbingServiceImg,
    'ac_repair_hvac': acRepairHvacImg,
    'carpentry_woodwork': carpentryWoodworkImg,
    'painting_waterproofing': paintingWaterproofingImg,
    'deep_home_cleaning': deepHomeCleaningImg,
    'professional_driver_services': professionalDriverServicesImg,
    'domestic_helpers': domesticHelpersImg,
    'caregiver_services': caregiverServicesImg,
    'gardening_landscaping': gardeningLandscapingImg,
    'technician_services': technicianServicesImg,
    'emergency_services': emergencyServicesImg,
    'specialized_custom_trades': specializedCustomTradesImg,
    'on_demand_services': onDemandServicesImg,
    'verified_cooperative_workers': verifiedCooperativeWorkersImg,
    'training_certification': trainingCertificationImg,
};

/**
 * Resolves the appropriate local service image based on service category, name, and English translation.
 */
export function getServiceImage(service) {
    if (!service) return null;
    const cat = (service.category || '').toLowerCase();
    const nm = (service.name || '').toLowerCase();
    const enName = (service.name_translations?.en || '').toLowerCase();
    const combined = `${cat} ${nm} ${enName}`;

    // 1. Electrical Repair -> electrical_repair.png
    if (combined.includes('electric') || combined.includes('wiring') || combined.includes('fan')) {
        return electricalRepairImg;
    }

    // 2. Plumbing Service -> plumbing_service.png
    if (combined.includes('plumb') || combined.includes('pipe') || combined.includes('leak') || combined.includes('tap')) {
        return plumbingServiceImg;
    }

    // 3. AC Repair & HVAC -> ac_repair_hvac.png
    if (combined.includes('ac ') || combined.includes('ac repair') || combined.includes('hvac') || combined.includes('cooling')) {
        return acRepairHvacImg;
    }

    // 4. Carpentry & Woodwork -> carpentry_woodwork.png
    if (combined.includes('carpent') || combined.includes('woodwork') || combined.includes('wood') || combined.includes('furniture')) {
        return carpentryWoodworkImg;
    }

    // 5. Painting & Waterproofing -> painting_waterproofing.png
    if (combined.includes('paint') || combined.includes('waterproof') || combined.includes('polish')) {
        return paintingWaterproofingImg;
    }

    // 6. Deep Home Cleaning -> deep_home_cleaning.png
    if (combined.includes('clean') || combined.includes('deep clean') || combined.includes('sanitiz')) {
        return deepHomeCleaningImg;
    }

    // 7. Professional Driver Services -> professional_driver_services.png
    if (combined.includes('driver') || combined.includes('chauffeur') || combined.includes('transport')) {
        return professionalDriverServicesImg;
    }

    // 8. Domestic Helpers -> domestic_helpers.png
    if (combined.includes('domestic') || combined.includes('helper') || combined.includes('maid') || combined.includes('cook')) {
        return domesticHelpersImg;
    }

    // 9. Caregiver Services -> caregiver_services.png
    if (combined.includes('caregiver') || combined.includes('elder') || combined.includes('patient') || combined.includes('healthcare') || combined.includes('nurse')) {
        return caregiverServicesImg;
    }

    // 10. Gardening & Landscaping -> gardening_landscaping.png
    if (combined.includes('garden') || combined.includes('landscap') || combined.includes('plant') || combined.includes('outdoor')) {
        return gardeningLandscapingImg;
    }

    // 11. Specialized & Custom Trades -> specialized_custom_trades.jpg
    if (combined.includes('specialized') || combined.includes('custom') || combined.includes('trade')) {
        return specializedCustomTradesImg;
    }

    // 12. On-Demand Services -> on_demand_services.jpg
    if (combined.includes('on-demand') || combined.includes('instant') || combined.includes('demand')) {
        return onDemandServicesImg;
    }

    // 13. Verified Cooperative Workers -> verified_cooperative_workers.jpg
    if (combined.includes('verified') || combined.includes('cooperative worker') || combined.includes('worker')) {
        return verifiedCooperativeWorkersImg;
    }

    // 14. Training & Certification -> training_certification.jpg
    if (combined.includes('train') || combined.includes('certif')) {
        return trainingCertificationImg;
    }

    // 15. Emergency Services -> emergency_services.png
    if (combined.includes('emergency') || combined.includes('urgent') || combined.includes('24/7')) {
        return emergencyServicesImg;
    }

    // 16. Technician Services -> technician_services.png
    if (combined.includes('technician') || combined.includes('appliance') || combined.includes('cctv') || combined.includes('technical')) {
        return technicianServicesImg;
    }

    return technicianServicesImg;
}

/**
 * Standard descriptions for services as specified in the COOP HUB design requirements.
 */
export const REQUIRED_DESCRIPTIONS = {
    caregiver: "Compassionate support and assistance for seniors, patients, and individuals needing daily care.",
    gardening: "Garden maintenance, landscaping, planting, trimming, and outdoor space care.",
    technician: "Skilled technicians for equipment repair, maintenance, installation, and technical support.",
    emergency: "Urgent service support for critical household repairs and immediate assistance.",
    onDemand: "Request skilled cooperative workers whenever you need reliable service at your convenience.",
    verified: "Connect with trained, verified, and trusted cooperative workers for dependable services.",
    training: "Skill development, practical training, certification, and continuous learning for cooperative workers.",
    domestic: "Cooking, household assistance, maid services, and daily domestic support.",
};

/**
 * Resolves the concise, professional description for any service card.
 */
export function getServiceDescription(service) {
    if (!service) return '';
    const nm = (service.name || '').toLowerCase();
    const cat = (service.category || '').toLowerCase();
    const enName = (service.name_translations?.en || '').toLowerCase();
    const combined = `${nm} ${cat} ${enName}`;

    // 1. Caregiver Services
    if (combined.includes('caregiver') || combined.includes('patient') || combined.includes('elder')) {
        return REQUIRED_DESCRIPTIONS.caregiver;
    }
    // 2. Gardening & Landscaping
    if (combined.includes('garden') || combined.includes('landscap')) {
        return REQUIRED_DESCRIPTIONS.gardening;
    }
    // 3. Technician Services
    if (combined.includes('technician')) {
        return REQUIRED_DESCRIPTIONS.technician;
    }
    // 4. Emergency Services
    if (combined.includes('emergency') || combined.includes('urgent')) {
        return REQUIRED_DESCRIPTIONS.emergency;
    }
    // 5. On-Demand Services
    if (combined.includes('on-demand') || combined.includes('demand')) {
        return REQUIRED_DESCRIPTIONS.onDemand;
    }
    // 6. Verified Cooperative Workers
    if (combined.includes('verified') || combined.includes('cooperative worker')) {
        return REQUIRED_DESCRIPTIONS.verified;
    }
    // 7. Training & Certification
    if (combined.includes('training') || combined.includes('certification') || combined.includes('train')) {
        return REQUIRED_DESCRIPTIONS.training;
    }
    // 8. Domestic Helpers
    if (combined.includes('domestic') || combined.includes('helper') || combined.includes('maid') || combined.includes('cook')) {
        return REQUIRED_DESCRIPTIONS.domestic;
    }

    return service.description || '';
}
