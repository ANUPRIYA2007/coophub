// Complete COOP HUB Sub-Services Catalog
// 16 Main Services x Exactly 5 Specified Sub-Services Each = 80 Sub-Services
import { SUB_SERVICE_IMAGE_MAP } from './subServiceImageMap.js';

export const SUB_SERVICES_CATALOG = [
  // --------------------------------------------------
  // 1. Electrical Repair (service_id: a0000000-0000-0000-0000-000000000001)
  // --------------------------------------------------
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    service_id: 'a0000000-0000-0000-0000-000000000001',
    service_name: 'Electrical Repair',
    name: 'Ceiling Fan & Switchboard Wiring',
    description: 'Fan connection, switch replacement, and wiring fault repair.',
    base_price: 350
  },
  {
    id: 'sub_elec_02',
    service_id: 'a0000000-0000-0000-0000-000000000001',
    service_name: 'Electrical Repair',
    name: 'Lighting Installation & Repair',
    description: 'LED, tube light, fixture installation, and lighting fault repair.',
    base_price: 299
  },
  {
    id: 'sub_elec_03',
    service_id: 'a0000000-0000-0000-0000-000000000001',
    service_name: 'Electrical Repair',
    name: 'Electrical Wiring & Rewiring',
    description: 'New wiring, rewiring, circuit inspection, and connection repair.',
    base_price: 499
  },
  {
    id: 'sub_elec_04',
    service_id: 'a0000000-0000-0000-0000-000000000001',
    service_name: 'Electrical Repair',
    name: 'MCB & Distribution Board Services',
    description: 'MCB replacement, DB inspection, overload, and protection issues.',
    base_price: 450
  },
  {
    id: 'sub_elec_05',
    service_id: 'a0000000-0000-0000-0000-000000000001',
    service_name: 'Electrical Repair',
    name: 'Power Socket & Switch Repair',
    description: 'Socket installation, switch replacement, and loose-connection repair.',
    base_price: 249
  },

  // --------------------------------------------------
  // 2. Plumbing Service (service_id: a0000000-0000-0000-0000-000000000002)
  // --------------------------------------------------
  {
    id: 'b0000000-0000-0000-0000-000000000005',
    service_id: 'a0000000-0000-0000-0000-000000000002',
    service_name: 'Plumbing Service',
    name: 'Pipe Leakage Repair',
    description: 'Detect and repair leaking water pipes and connections.',
    base_price: 299
  },
  {
    id: 'sub_plumb_02',
    service_id: 'a0000000-0000-0000-0000-000000000002',
    service_name: 'Plumbing Service',
    name: 'Tap & Faucet Repair',
    description: 'Repair or replace leaking, damaged, or faulty taps and faucets.',
    base_price: 249
  },
  {
    id: 'sub_plumb_03',
    service_id: 'a0000000-0000-0000-0000-000000000002',
    service_name: 'Plumbing Service',
    name: 'Sink & Wash Basin Service',
    description: 'Installation, blockage removal, leakage repair, and fitting service.',
    base_price: 349
  },
  {
    id: 'sub_plumb_04',
    service_id: 'a0000000-0000-0000-0000-000000000002',
    service_name: 'Plumbing Service',
    name: 'Toilet & Sanitary Repair',
    description: 'Toilet fitting, flushing issues, leakage, and sanitary repairs.',
    base_price: 399
  },
  {
    id: 'sub_plumb_05',
    service_id: 'a0000000-0000-0000-0000-000000000002',
    service_name: 'Plumbing Service',
    name: 'Drainage & Blockage Removal',
    description: 'Clear blocked drains, pipelines, and household drainage systems.',
    base_price: 449
  },

  // --------------------------------------------------
  // 3. AC Repair & HVAC (service_id: a0000000-0000-0000-0000-000000000003)
  // --------------------------------------------------
  {
    id: 'b0000000-0000-0000-0000-000000000006',
    service_id: 'a0000000-0000-0000-0000-000000000003',
    service_name: 'AC Repair & HVAC',
    name: 'AC General Service',
    description: 'Cleaning, inspection, and routine AC maintenance.',
    base_price: 499
  },
  {
    id: 'sub_ac_02',
    service_id: 'a0000000-0000-0000-0000-000000000003',
    service_name: 'AC Repair & HVAC',
    name: 'AC Repair & Troubleshooting',
    description: 'Diagnose cooling, power, noise, and operational problems.',
    base_price: 599
  },
  {
    id: 'sub_ac_03',
    service_id: 'a0000000-0000-0000-0000-000000000003',
    service_name: 'AC Repair & HVAC',
    name: 'AC Installation',
    description: 'Professional installation of split and window AC units.',
    base_price: 1199
  },
  {
    id: 'sub_ac_04',
    service_id: 'a0000000-0000-0000-0000-000000000003',
    service_name: 'AC Repair & HVAC',
    name: 'AC Gas Filling & Leak Check',
    description: 'Refrigerant inspection, leak detection, and gas charging.',
    base_price: 1499
  },
  {
    id: 'sub_ac_05',
    service_id: 'a0000000-0000-0000-0000-000000000003',
    service_name: 'AC Repair & HVAC',
    name: 'AC Deep Cleaning',
    description: 'Thorough cleaning of filters, coils, blower, and indoor unit.',
    base_price: 799
  },

  // --------------------------------------------------
  // 4. Carpentry & Woodwork (service_id: a0000000-0000-0000-0000-000000000004)
  // --------------------------------------------------
  {
    id: 'sub_carp_01',
    service_id: 'a0000000-0000-0000-0000-000000000004',
    service_name: 'Carpentry & Woodwork',
    name: 'Furniture Repair',
    description: 'Repair damaged chairs, tables, cabinets, and household furniture.',
    base_price: 349
  },
  {
    id: 'sub_carp_02',
    service_id: 'a0000000-0000-0000-0000-000000000004',
    service_name: 'Carpentry & Woodwork',
    name: 'Door & Window Repair',
    description: 'Fix hinges, locks, frames, alignment, and wooden fittings.',
    base_price: 299
  },
  {
    id: 'sub_carp_03',
    service_id: 'a0000000-0000-0000-0000-000000000004',
    service_name: 'Carpentry & Woodwork',
    name: 'Modular Furniture Work',
    description: 'Assembly, installation, modification, and repair of modular furniture.',
    base_price: 699
  },
  {
    id: 'sub_carp_04',
    service_id: 'a0000000-0000-0000-0000-000000000004',
    service_name: 'Carpentry & Woodwork',
    name: 'Custom Woodwork',
    description: 'Custom shelves, cabinets, partitions, and wooden structures.',
    base_price: 899
  },
  {
    id: 'sub_carp_05',
    service_id: 'a0000000-0000-0000-0000-000000000004',
    service_name: 'Carpentry & Woodwork',
    name: 'Wood Polishing & Restoration',
    description: 'Polish, refinish, restore, and improve wooden surfaces.',
    base_price: 799
  },

  // --------------------------------------------------
  // 5. Painting & Waterproofing (service_id: a0000000-0000-0000-0000-000000000005)
  // --------------------------------------------------
  {
    id: 'b0000000-0000-0000-0000-000000000008',
    service_id: 'a0000000-0000-0000-0000-000000000005',
    service_name: 'Painting & Waterproofing',
    name: 'Interior Wall Painting',
    description: 'Professional painting for rooms, walls, and indoor spaces.',
    base_price: 1999
  },
  {
    id: 'sub_paint_02',
    service_id: 'a0000000-0000-0000-0000-000000000005',
    service_name: 'Painting & Waterproofing',
    name: 'Exterior Painting',
    description: 'Weather-resistant painting for exterior walls and buildings.',
    base_price: 3499
  },
  {
    id: 'sub_paint_03',
    service_id: 'a0000000-0000-0000-0000-000000000005',
    service_name: 'Painting & Waterproofing',
    name: 'Waterproofing',
    description: 'Roof, wall, bathroom, and leakage-prevention waterproofing.',
    base_price: 1499
  },
  {
    id: 'sub_paint_04',
    service_id: 'a0000000-0000-0000-0000-000000000005',
    service_name: 'Painting & Waterproofing',
    name: 'Texture & Decorative Painting',
    description: 'Texture finishes, accent walls, and decorative painting.',
    base_price: 1299
  },
  {
    id: 'sub_paint_05',
    service_id: 'a0000000-0000-0000-0000-000000000005',
    service_name: 'Painting & Waterproofing',
    name: 'Wall Repair & Repainting',
    description: 'Surface preparation, crack repair, patching, and repainting.',
    base_price: 899
  },

  // --------------------------------------------------
  // 6. Deep Home Cleaning (service_id: a0000000-0000-0000-0000-000000000006)
  // --------------------------------------------------
  {
    id: 'sub_clean_01',
    service_id: 'a0000000-0000-0000-0000-000000000006',
    service_name: 'Deep Home Cleaning',
    name: 'Full Home Deep Cleaning',
    description: 'Comprehensive cleaning of rooms, surfaces, and household areas.',
    base_price: 1899
  },
  {
    id: 'sub_clean_02',
    service_id: 'a0000000-0000-0000-0000-000000000006',
    service_name: 'Deep Home Cleaning',
    name: 'Kitchen Deep Cleaning',
    description: 'Clean cabinets, counters, appliances, tiles, and kitchen surfaces.',
    base_price: 799
  },
  {
    id: 'sub_clean_03',
    service_id: 'a0000000-0000-0000-0000-000000000006',
    service_name: 'Deep Home Cleaning',
    name: 'Bathroom Deep Cleaning',
    description: 'Deep cleaning and sanitization of bathroom surfaces and fixtures.',
    base_price: 499
  },
  {
    id: 'sub_clean_04',
    service_id: 'a0000000-0000-0000-0000-000000000006',
    service_name: 'Deep Home Cleaning',
    name: 'Sofa & Upholstery Cleaning',
    description: 'Professional cleaning of sofas, chairs, and fabric upholstery.',
    base_price: 699
  },
  {
    id: 'sub_clean_05',
    service_id: 'a0000000-0000-0000-0000-000000000006',
    service_name: 'Deep Home Cleaning',
    name: 'Move-In / Move-Out Cleaning',
    description: 'Detailed cleaning before moving into or leaving a property.',
    base_price: 2199
  },

  // --------------------------------------------------
  // 7. Professional Driver Services (service_id: a0000000-0000-0000-0000-000000000007)
  // --------------------------------------------------
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    service_id: 'a0000000-0000-0000-0000-000000000007',
    service_name: 'Professional Driver Services',
    name: 'Personal Driver',
    description: 'Trained driver for personal and daily transportation needs.',
    base_price: 450
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    service_id: 'a0000000-0000-0000-0000-000000000007',
    service_name: 'Professional Driver Services',
    name: 'Outstation Driver',
    description: 'Experienced driver support for long-distance and outstation travel.',
    base_price: 1200
  },
  {
    id: 'sub_driv_03',
    service_id: 'a0000000-0000-0000-0000-000000000007',
    service_name: 'Professional Driver Services',
    name: 'Corporate Driver',
    description: 'Professional driving support for business and corporate requirements.',
    base_price: 900
  },
  {
    id: 'sub_driv_04',
    service_id: 'a0000000-0000-0000-0000-000000000007',
    service_name: 'Professional Driver Services',
    name: 'Event & Function Driver',
    description: 'Driver support for weddings, events, functions, and special occasions.',
    base_price: 750
  },
  {
    id: 'sub_driv_05',
    service_id: 'a0000000-0000-0000-0000-000000000007',
    service_name: 'Professional Driver Services',
    name: 'Vehicle Pickup & Drop',
    description: 'Safe vehicle pickup, delivery, and service-center transportation.',
    base_price: 350
  },

  // --------------------------------------------------
  // 8. Domestic Helpers (service_id: a0000000-0000-0000-0000-000000000010)
  // --------------------------------------------------
  {
    id: 'sub_dom_01',
    service_id: 'a0000000-0000-0000-0000-000000000010',
    service_name: 'Domestic Helpers',
    name: 'Household Assistance',
    description: 'General assistance with routine household activities.',
    base_price: 450
  },
  {
    id: 'b0000000-0000-0000-0000-000000000010',
    service_id: 'a0000000-0000-0000-0000-000000000010',
    service_name: 'Domestic Helpers',
    name: 'Cooking Assistance',
    description: 'Support with daily meal preparation and kitchen activities.',
    base_price: 400
  },
  {
    id: 'sub_dom_03',
    service_id: 'a0000000-0000-0000-0000-000000000010',
    service_name: 'Domestic Helpers',
    name: 'Laundry & Ironing',
    description: 'Washing, drying, folding, and ironing household clothes.',
    base_price: 300
  },
  {
    id: 'sub_dom_04',
    service_id: 'a0000000-0000-0000-0000-000000000010',
    service_name: 'Domestic Helpers',
    name: 'Household Organization',
    description: 'Assistance with organizing rooms, belongings, and household spaces.',
    base_price: 500
  },
  {
    id: 'sub_dom_05',
    service_id: 'a0000000-0000-0000-0000-000000000010',
    service_name: 'Domestic Helpers',
    name: 'Elderly Household Assistance',
    description: 'Non-medical household support for elderly family members.',
    base_price: 600
  },

  // --------------------------------------------------
  // 9. Caregiver Services (service_id: a0000000-0000-0000-0000-000000000011)
  // --------------------------------------------------
  {
    id: 'b0000000-0000-0000-0000-000000000020',
    service_id: 'a0000000-0000-0000-0000-000000000011',
    service_name: 'Caregiver Services',
    name: 'Elderly Care Assistance',
    description: 'Daily support and companionship for senior citizens.',
    base_price: 800
  },
  {
    id: 'sub_care_02',
    service_id: 'a0000000-0000-0000-0000-000000000011',
    service_name: 'Caregiver Services',
    name: 'Patient Care Assistance',
    description: 'Non-medical assistance with routine patient-care needs.',
    base_price: 950
  },
  {
    id: 'sub_care_03',
    service_id: 'a0000000-0000-0000-0000-000000000011',
    service_name: 'Caregiver Services',
    name: 'Mobility & Daily Activity Support',
    description: 'Assistance with movement and everyday activities.',
    base_price: 700
  },
  {
    id: 'sub_care_04',
    service_id: 'a0000000-0000-0000-0000-000000000011',
    service_name: 'Caregiver Services',
    name: 'Companion Care',
    description: 'Companionship, conversation, and basic daily support.',
    base_price: 600
  },
  {
    id: 'sub_care_05',
    service_id: 'a0000000-0000-0000-0000-000000000011',
    service_name: 'Caregiver Services',
    name: 'Home Care Support',
    description: 'General household and personal assistance for individuals needing support.',
    base_price: 750
  },

  // --------------------------------------------------
  // 10. Gardening & Landscaping (service_id: a0000000-0000-0000-0000-000000000012)
  // --------------------------------------------------
  {
    id: 'b0000000-0000-0000-0000-000000000030',
    service_id: 'a0000000-0000-0000-0000-000000000012',
    service_name: 'Gardening & Landscaping',
    name: 'Garden Maintenance',
    description: 'Routine maintenance, cleaning, pruning, and garden care.',
    base_price: 450
  },
  {
    id: 'sub_gard_02',
    service_id: 'a0000000-0000-0000-0000-000000000012',
    service_name: 'Gardening & Landscaping',
    name: 'Planting & Replanting',
    description: 'Plant installation, replanting, and garden arrangement.',
    base_price: 550
  },
  {
    id: 'sub_gard_03',
    service_id: 'a0000000-0000-0000-0000-000000000012',
    service_name: 'Gardening & Landscaping',
    name: 'Lawn Maintenance',
    description: 'Grass cutting, trimming, watering, and lawn care.',
    base_price: 400
  },
  {
    id: 'sub_gard_04',
    service_id: 'a0000000-0000-0000-0000-000000000012',
    service_name: 'Gardening & Landscaping',
    name: 'Landscape Design & Setup',
    description: 'Planning and setting up attractive outdoor spaces.',
    base_price: 1500
  },
  {
    id: 'sub_gard_05',
    service_id: 'a0000000-0000-0000-0000-000000000012',
    service_name: 'Gardening & Landscaping',
    name: 'Tree & Plant Care',
    description: 'Pruning, trimming, plant health, and regular maintenance.',
    base_price: 600
  },

  // --------------------------------------------------
  // 11. Technician Services (service_id: a0000000-0000-0000-0000-000000000013)
  // --------------------------------------------------
  {
    id: 'sub_tech_01',
    service_id: 'a0000000-0000-0000-0000-000000000013',
    service_name: 'Technician Services',
    name: 'Appliance Installation',
    description: 'Installation and setup of household and commercial appliances.',
    base_price: 499
  },
  {
    id: 'sub_tech_02',
    service_id: 'a0000000-0000-0000-0000-000000000013',
    service_name: 'Technician Services',
    name: 'Appliance Repair',
    description: 'Troubleshooting and repair of common electrical appliances.',
    base_price: 599
  },
  {
    id: 'sub_tech_03',
    service_id: 'a0000000-0000-0000-0000-000000000013',
    service_name: 'Technician Services',
    name: 'Equipment Maintenance',
    description: 'Preventive maintenance and servicing of equipment.',
    base_price: 699
  },
  {
    id: 'b0000000-0000-0000-0000-000000000040',
    service_id: 'a0000000-0000-0000-0000-000000000013',
    service_name: 'Technician Services',
    name: 'CCTV & Security Systems',
    description: 'CCTV installation, configuration, and basic troubleshooting.',
    base_price: 850
  },
  {
    id: 'sub_tech_05',
    service_id: 'a0000000-0000-0000-0000-000000000013',
    service_name: 'Technician Services',
    name: 'Technical Inspection & Troubleshooting',
    description: 'Diagnose equipment faults and recommend repair solutions.',
    base_price: 399
  },

  // --------------------------------------------------
  // 12. Emergency Services (service_id: a0000000-0000-0000-0000-000000000014)
  // --------------------------------------------------
  {
    id: 'b0000000-0000-0000-0000-000000000051',
    service_id: 'a0000000-0000-0000-0000-000000000014',
    service_name: 'Emergency Services',
    name: 'Emergency Electrical Repair',
    description: 'Urgent assistance for electrical faults and power-related issues.',
    base_price: 699
  },
  {
    id: 'b0000000-0000-0000-0000-000000000050',
    service_id: 'a0000000-0000-0000-0000-000000000014',
    service_name: 'Emergency Services',
    name: 'Emergency Plumbing Repair',
    description: 'Immediate support for leaks, burst pipes, and serious blockages.',
    base_price: 599
  },
  {
    id: 'sub_emg_03',
    service_id: 'a0000000-0000-0000-0000-000000000014',
    service_name: 'Emergency Services',
    name: 'Emergency AC Repair',
    description: 'Urgent AC troubleshooting and repair assistance.',
    base_price: 799
  },
  {
    id: 'sub_emg_04',
    service_id: 'a0000000-0000-0000-0000-000000000014',
    service_name: 'Emergency Services',
    name: 'Emergency Home Repair',
    description: 'Rapid assistance for critical household repair requirements.',
    base_price: 649
  },
  {
    id: 'sub_emg_05',
    service_id: 'a0000000-0000-0000-0000-000000000014',
    service_name: 'Emergency Services',
    name: 'Emergency On-Site Assistance',
    description: 'Priority dispatch of an eligible nearby cooperative worker.',
    base_price: 499
  },

  // --------------------------------------------------
  // 13. On-Demand Services (service_id: a0000000-0000-0000-0000-000000000015)
  // --------------------------------------------------
  {
    id: 'b0000000-0000-0000-0000-000000000060',
    service_id: 'a0000000-0000-0000-0000-000000000015',
    service_name: 'On-Demand Services',
    name: 'Quick Home Repair',
    description: 'Request a skilled worker for an immediate household repair.',
    base_price: 399
  },
  {
    id: 'sub_dem_02',
    service_id: 'a0000000-0000-0000-0000-000000000015',
    service_name: 'On-Demand Services',
    name: 'Same-Day Service',
    description: 'Book an eligible cooperative worker for service on the same day.',
    base_price: 499
  },
  {
    id: 'sub_dem_03',
    service_id: 'a0000000-0000-0000-0000-000000000015',
    service_name: 'On-Demand Services',
    name: 'Flexible Service Request',
    description: 'Submit a custom service requirement based on your needs.',
    base_price: 349
  },
  {
    id: 'sub_dem_04',
    service_id: 'a0000000-0000-0000-0000-000000000015',
    service_name: 'On-Demand Services',
    name: 'Multi-Skill Assistance',
    description: 'Request support involving multiple household service skills.',
    base_price: 699
  },
  {
    id: 'sub_dem_05',
    service_id: 'a0000000-0000-0000-0000-000000000015',
    service_name: 'On-Demand Services',
    name: 'Custom On-Demand Work',
    description: 'Describe a specific requirement and get matched with a suitable worker.',
    base_price: 449
  },

  // --------------------------------------------------
  // 14. Specialized & Custom Trades (service_id: a0000000-0000-0000-0000-000000000008)
  // --------------------------------------------------
  {
    id: 'sub_spec_01',
    service_id: 'a0000000-0000-0000-0000-000000000008',
    service_name: 'Specialized & Custom Trades',
    name: 'Welding Services',
    description: 'Welding, fabrication, repair, and metalwork assistance.',
    base_price: 650
  },
  {
    id: 'sub_spec_02',
    service_id: 'a0000000-0000-0000-0000-000000000008',
    service_name: 'Specialized & Custom Trades',
    name: 'Masonry & Minor Construction',
    description: 'Brickwork, plastering, repairs, and minor construction tasks.',
    base_price: 750
  },
  {
    id: 'sub_spec_03',
    service_id: 'a0000000-0000-0000-0000-000000000008',
    service_name: 'Specialized & Custom Trades',
    name: 'CCTV & Security Installation',
    description: 'Security camera and related system installation.',
    base_price: 850
  },
  {
    id: 'sub_spec_04',
    service_id: 'a0000000-0000-0000-0000-000000000008',
    service_name: 'Specialized & Custom Trades',
    name: 'Fabrication & Custom Work',
    description: 'Custom fabrication and specialized repair requirements.',
    base_price: 900
  },
  {
    id: 'sub_spec_05',
    service_id: 'a0000000-0000-0000-0000-000000000008',
    service_name: 'Specialized & Custom Trades',
    name: 'Custom Trade Request',
    description: 'Submit a specialized requirement for suitable worker matching.',
    base_price: 500
  },

  // --------------------------------------------------
  // 15. Verified Cooperative Workers (service_id: a0000000-0000-0000-0000-000000000016)
  // --------------------------------------------------
  {
    id: 'b0000000-0000-0000-0000-000000000070',
    service_id: 'a0000000-0000-0000-0000-000000000016',
    service_name: 'Verified Cooperative Workers',
    name: 'Verified Electricians',
    description: 'Find identity-verified cooperative electricians with relevant skills.',
    base_price: 450
  },
  {
    id: 'sub_veri_02',
    service_id: 'a0000000-0000-0000-0000-000000000016',
    service_name: 'Verified Cooperative Workers',
    name: 'Verified Plumbers',
    description: 'Find verified cooperative plumbers based on skills and availability.',
    base_price: 400
  },
  {
    id: 'sub_veri_03',
    service_id: 'a0000000-0000-0000-0000-000000000016',
    service_name: 'Verified Cooperative Workers',
    name: 'Verified Technicians',
    description: 'Connect with verified technicians for technical service requirements.',
    base_price: 550
  },
  {
    id: 'sub_veri_04',
    service_id: 'a0000000-0000-0000-0000-000000000016',
    service_name: 'Verified Cooperative Workers',
    name: 'Verified Home Service Workers',
    description: 'Discover verified workers across household service categories.',
    base_price: 400
  },
  {
    id: 'sub_veri_05',
    service_id: 'a0000000-0000-0000-0000-000000000016',
    service_name: 'Verified Cooperative Workers',
    name: 'Certified Skilled Workers',
    description: 'Find workers with verified skills, experience, and certifications.',
    base_price: 500
  },

  // --------------------------------------------------
  // 16. Training & Certification (service_id: a0000000-0000-0000-0000-000000000017)
  // --------------------------------------------------
  {
    id: 'sub_train_01',
    service_id: 'a0000000-0000-0000-0000-000000000017',
    service_name: 'Training & Certification',
    name: 'Electrical Skills Training',
    description: 'Practical training for electrical repair and installation skills.',
    base_price: 1500
  },
  {
    id: 'sub_train_02',
    service_id: 'a0000000-0000-0000-0000-000000000017',
    service_name: 'Training & Certification',
    name: 'Plumbing Skills Training',
    description: 'Hands-on training in plumbing repair, fitting, and maintenance.',
    base_price: 1500
  },
  {
    id: 'sub_train_03',
    service_id: 'a0000000-0000-0000-0000-000000000017',
    service_name: 'Training & Certification',
    name: 'Technical Skills Training',
    description: 'Practical development of technical and equipment-related skills.',
    base_price: 1800
  },
  {
    id: 'sub_train_04',
    service_id: 'a0000000-0000-0000-0000-000000000017',
    service_name: 'Training & Certification',
    name: 'Safety & Workplace Training',
    description: 'Training in workplace safety, service practices, and worker protection.',
    base_price: 999
  },
  {
    id: 'b0000000-0000-0000-0000-000000000080',
    service_id: 'a0000000-0000-0000-0000-000000000017',
    service_name: 'Training & Certification',
    name: 'Certification & Skill Assessment',
    description: 'Skill evaluation, certification, and competency assessment.',
    base_price: 1200
  }
];

/**
 * Normalizes main service identifier (ID, category, or name) to the canonical service ID.
 */
export function resolveCanonicalServiceId(identifier, serviceObj = null) {
  if (!identifier && !serviceObj) return null;
  const raw = String(identifier || '').toLowerCase();
  const name = String(serviceObj?.name || '').toLowerCase();
  const cat = String(serviceObj?.category || '').toLowerCase();
  const combined = `${raw} ${name} ${cat}`;

  // 1. Electrical Repair
  if (combined.includes('a0000000-0000-0000-0000-000000000001') || combined.includes('electr')) {
    return 'a0000000-0000-0000-0000-000000000001';
  }
  // 2. Plumbing Service
  if (combined.includes('a0000000-0000-0000-0000-000000000002') || combined.includes('plumb') || combined.includes('pipe')) {
    return 'a0000000-0000-0000-0000-000000000002';
  }
  // 3. AC Repair & HVAC
  if (combined.includes('a0000000-0000-0000-0000-000000000003') || combined.includes('cooling') || combined.includes('ac ') || combined.includes('hvac')) {
    return 'a0000000-0000-0000-0000-000000000003';
  }
  // 4. Carpentry & Woodwork
  if (combined.includes('a0000000-0000-0000-0000-000000000004') || combined.includes('carpent') || combined.includes('wood')) {
    return 'a0000000-0000-0000-0000-000000000004';
  }
  // 5. Painting & Waterproofing
  if (combined.includes('a0000000-0000-0000-0000-000000000005') || combined.includes('paint') || combined.includes('waterproof')) {
    return 'a0000000-0000-0000-0000-000000000005';
  }
  // 6. Deep Home Cleaning
  if (combined.includes('a0000000-0000-0000-0000-000000000006') || combined.includes('clean')) {
    return 'a0000000-0000-0000-0000-000000000006';
  }
  // 7. Professional Driver Services
  if (combined.includes('a0000000-0000-0000-0000-000000000007') || combined.includes('driver') || combined.includes('transport') || combined.includes('chauffeur')) {
    return 'a0000000-0000-0000-0000-000000000007';
  }
  // 14. Specialized & Custom Trades
  if (combined.includes('a0000000-0000-0000-0000-000000000008') || combined.includes('specialized') || combined.includes('custom trade') || combined.includes('trade')) {
    return 'a0000000-0000-0000-0000-000000000008';
  }
  // 8. Domestic Helpers
  if (combined.includes('a0000000-0000-0000-0000-000000000010') || combined.includes('domestic') || combined.includes('maid') || combined.includes('helper')) {
    return 'a0000000-0000-0000-0000-000000000010';
  }
  // 9. Caregiver Services
  if (combined.includes('a0000000-0000-0000-0000-000000000011') || combined.includes('caregiver') || combined.includes('patient') || combined.includes('health')) {
    return 'a0000000-0000-0000-0000-000000000011';
  }
  // 10. Gardening & Landscaping
  if (combined.includes('a0000000-0000-0000-0000-000000000012') || combined.includes('garden') || combined.includes('landscap') || combined.includes('outdoor')) {
    return 'a0000000-0000-0000-0000-000000000012';
  }
  // 11. Technician Services
  if (combined.includes('a0000000-0000-0000-0000-000000000013') || combined.includes('technician') || combined.includes('appliance') || combined.includes('technical')) {
    return 'a0000000-0000-0000-0000-000000000013';
  }
  // 12. Emergency Services
  if (combined.includes('a0000000-0000-0000-0000-000000000014') || combined.includes('emergency') || combined.includes('urgent')) {
    return 'a0000000-0000-0000-0000-000000000014';
  }
  // 13. On-Demand Services
  if (combined.includes('a0000000-0000-0000-0000-000000000015') || combined.includes('on-demand') || combined.includes('demand')) {
    return 'a0000000-0000-0000-0000-000000000015';
  }
  // 15. Verified Cooperative Workers
  if (combined.includes('a0000000-0000-0000-0000-000000000016') || combined.includes('verified') || combined.includes('cooperative worker')) {
    return 'a0000000-0000-0000-0000-000000000016';
  }
  // 16. Training & Certification
  if (combined.includes('a0000000-0000-0000-0000-000000000017') || combined.includes('train') || combined.includes('certif')) {
    return 'a0000000-0000-0000-0000-000000000017';
  }

  return identifier;
}

// Attach corresponding sub-service images
SUB_SERVICES_CATALOG.forEach(sub => {
  if (!sub.image && SUB_SERVICE_IMAGE_MAP[sub.id]) {
    sub.image = SUB_SERVICE_IMAGE_MAP[sub.id];
  }
});

/**
 * Returns the exact 5 sub-services for a main service identifier or service object.
 */
export function getSubServicesForCatalog(serviceId, serviceObj = null) {
  const canonicalId = resolveCanonicalServiceId(serviceId, serviceObj);
  const matched = SUB_SERVICES_CATALOG.filter(sub => sub.service_id === canonicalId);
  if (matched.length > 0) {
    return matched;
  }
  // Fallback: direct service_id filter
  return SUB_SERVICES_CATALOG.filter(sub => sub.service_id === serviceId);
}

