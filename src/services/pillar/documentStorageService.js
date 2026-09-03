/**
 * COOP HUB — Dedicated Pillar KYC Document Storage Service
 * 
 * Manages strongly-typed storage, querying, and updates across dedicated document tables:
 * 1. pillar_aadhaar_documents
 * 2. pillar_pan_documents
 * 3. pillar_voter_id_documents
 * 4. pillar_driving_license_documents
 */

import { supabase } from '../../lib/supabase.js';

export const documentStorageService = {
  /**
   * Save extracted document data to the appropriate dedicated table
   * @param {object} params
   * @param {string} params.pillarId - Pillar user ID
   * @param {string} params.documentType - 'aadhaar' | 'pan' | 'voter_id' | 'driving_licence'
   * @param {object} params.extractedData - Structured fields from Vision AI
   * @param {string} params.rawOcrText - Raw OCR transcribed text
   * @param {string} params.documentUrl - Image / PDF data URL or storage URL
   * @param {object} params.validationResult - Deterministic validation output
   */
  async saveExtractedDocument({
    pillarId,
    documentType = 'aadhaar',
    extractedData = {},
    rawOcrText = '',
    documentUrl = null,
    validationResult = {}
  }) {
    if (!pillarId) {
      console.warn("Cannot save KYC document without pillarId.");
      return { success: false, error: "Missing pillarId" };
    }

    const type = (documentType || 'aadhaar').toLowerCase();
    // Core Mandate: Never set 'verified' from OCR extraction alone
    const verificationStatus = validationResult.verification_status || (validationResult.status === 'MATCHED' || validationResult.status === 'AI_ASSISTED' ? 'ai_assisted' : 'manual_review');
    const verificationScore = validationResult.confidence_score || 0.85;
    const validationErrors = validationResult.mismatches || [];

    try {
      // 1. AADHAAR
      if (type.includes('aadhaar') || type.includes('uidai')) {
        const payload = {
          pillar_id: pillarId,
          aadhaar_number: extractedData.document_number || extractedData.aadhaar_number || null,
          full_name: extractedData.full_name || null,
          date_of_birth: extractedData.date_of_birth || null,
          gender: extractedData.gender || null,
          address: extractedData.address || null,
          care_of: extractedData.care_of || extractedData.fathers_or_guardians_name || null,
          village_town_city: extractedData.village_town_city || null,
          district: extractedData.district || null,
          state: extractedData.state || 'Tamil Nadu',
          pincode: extractedData.pincode || null,
          issue_date: extractedData.issue_date || null,
          document_image_url: documentUrl,
          ocr_raw_text: rawOcrText,
          extracted_data: extractedData,
          verification_status: verificationStatus,
          verification_score: verificationScore,
          validation_errors: validationErrors,
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('pillar_aadhaar_documents')
          .upsert([payload], { onConflict: 'pillar_id' })
          .select()
          .single();

        if (error) throw error;
        return { success: true, table: 'pillar_aadhaar_documents', data };
      }

      // 2. PAN CARD
      if (type.includes('pan')) {
        const payload = {
          pillar_id: pillarId,
          pan_number: extractedData.document_number || extractedData.pan_number || null,
          full_name: extractedData.full_name || null,
          father_name: extractedData.father_name || extractedData.fathers_or_guardians_name || null,
          date_of_birth: extractedData.date_of_birth || null,
          signature_detected: extractedData.signature_detected || true,
          photograph_detected: extractedData.photograph_detected || true,
          document_image_url: documentUrl,
          ocr_raw_text: rawOcrText,
          extracted_data: extractedData,
          verification_status: verificationStatus,
          verification_score: verificationScore,
          validation_errors: validationErrors,
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('pillar_pan_documents')
          .upsert([payload], { onConflict: 'pillar_id' })
          .select()
          .single();

        if (error) throw error;
        return { success: true, table: 'pillar_pan_documents', data };
      }

      // 3. VOTER ID
      if (type.includes('voter') || type.includes('epic')) {
        const payload = {
          pillar_id: pillarId,
          voter_id_number: extractedData.document_number || extractedData.voter_id_number || null,
          full_name: extractedData.full_name || null,
          guardian_name: extractedData.guardian_name || extractedData.fathers_or_guardians_name || null,
          date_of_birth: extractedData.date_of_birth || null,
          age: extractedData.age || null,
          gender: extractedData.gender || null,
          address: extractedData.address || null,
          village_town_city: extractedData.village_town_city || null,
          district: extractedData.district || null,
          state: extractedData.state || 'Tamil Nadu',
          pincode: extractedData.pincode || null,
          polling_station: extractedData.polling_station || null,
          constituency: extractedData.constituency || null,
          document_image_url: documentUrl,
          ocr_raw_text: rawOcrText,
          extracted_data: extractedData,
          verification_status: verificationStatus,
          verification_score: verificationScore,
          validation_errors: validationErrors,
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('pillar_voter_id_documents')
          .upsert([payload], { onConflict: 'pillar_id' })
          .select()
          .single();

        if (error) throw error;
        return { success: true, table: 'pillar_voter_id_documents', data };
      }

      // 4. DRIVING LICENCE
      if (type.includes('driving') || type.includes('license') || type.includes('licence') || type.includes('dl')) {
        const payload = {
          pillar_id: pillarId,
          driving_license_number: extractedData.document_number || extractedData.driving_license_number || null,
          full_name: extractedData.full_name || null,
          date_of_birth: extractedData.date_of_birth || null,
          guardian_name: extractedData.guardian_name || extractedData.fathers_or_guardians_name || null,
          address: extractedData.address || null,
          blood_group: extractedData.blood_group || null,
          issue_date: extractedData.issue_date || null,
          expiry_date: extractedData.expiry_date || null,
          issuing_authority: extractedData.issuing_authority || null,
          transport_authority: extractedData.transport_authority || null,
          vehicle_classes: Array.isArray(extractedData.vehicle_classes) ? extractedData.vehicle_classes : ['LMV'],
          validity_status: extractedData.validity_status || 'ACTIVE',
          document_image_url: documentUrl,
          ocr_raw_text: rawOcrText,
          extracted_data: extractedData,
          verification_status: verificationStatus,
          verification_score: verificationScore,
          validation_errors: validationErrors,
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('pillar_driving_license_documents')
          .upsert([payload], { onConflict: 'pillar_id' })
          .select()
          .single();

        if (error) throw error;
        return { success: true, table: 'pillar_driving_license_documents', data };
      }

      return { success: false, error: `Unsupported document type: ${documentType}` };
    } catch (err) {
      console.error(`Error saving document to dedicated table for ${documentType}:`, err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Retrieve all dedicated KYC documents for a specific pillar
   * @param {string} pillarId - Pillar ID
   */
  async getPillarDocuments(pillarId) {
    if (!pillarId) return { aadhaar: null, pan: null, voterId: null, drivingLicense: null };

    try {
      const [
        { data: aadhaar },
        { data: pan },
        { data: voterId },
        { data: dl }
      ] = await Promise.all([
        supabase.from('pillar_aadhaar_documents').select('*').eq('pillar_id', pillarId).maybeSingle(),
        supabase.from('pillar_pan_documents').select('*').eq('pillar_id', pillarId).maybeSingle(),
        supabase.from('pillar_voter_id_documents').select('*').eq('pillar_id', pillarId).maybeSingle(),
        supabase.from('pillar_driving_license_documents').select('*').eq('pillar_id', pillarId).maybeSingle()
      ]);

      return {
        aadhaar: aadhaar || null,
        pan: pan || null,
        voterId: voterId || null,
        drivingLicense: dl || null
      };
    } catch (err) {
      console.error("Error retrieving dedicated documents for pillar:", err);
      return { aadhaar: null, pan: null, voterId: null, drivingLicense: null };
    }
  }
};

export default documentStorageService;
