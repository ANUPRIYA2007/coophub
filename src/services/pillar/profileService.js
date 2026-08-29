import { supabase } from "../../lib/supabase.js";
import { documentStorageService } from "./documentStorageService.js";

export const pillarProfileService = {
  // Get Pillar Profile
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from("pillar_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return { profile: data, error: null };
    } catch (error) {
      console.error("Get profile error:", error);
      return { profile: null, error };
    }
  },

  // Update Profile
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from("pillar_profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return { profile: data, error: null };
    } catch (error) {
      console.error("Update profile error:", error);
      return { profile: null, error };
    }
  },

  // Update Availability Status
  async updateAvailability(userId, isAvailable) {
    try {
      const { data, error } = await supabase
        .from("pillar_profiles")
        .update({ is_available: isAvailable })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return { profile: data, error: null };
    } catch (error) {
      console.error("Update availability error:", error);
      return { profile: null, error };
    }
  },

  // Get KYC Documents
  async getKycDocuments(userId) {
    const isDemo = localStorage.getItem("coophub_demo_user") === "true" || userId === "00000000-0000-0000-0000-000000000000";
    if (isDemo) {
      const demoDocs = JSON.parse(localStorage.getItem("coophub_demo_kyc_docs") || "null") || [
        {
          id: "kyc-demo-1",
          document_type: "aadhaar",
          document_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
          verification_status: "verified",
          uploaded_at: new Date(Date.now() - 86400000 * 5).toISOString()
        }
      ];
      return { data: demoDocs, error: null };
    }

    try {
      // Query dedicated tables and legacy KYC
      const [
        { data: aadhaarDocs },
        { data: panDocs },
        { data: voterDocs },
        { data: dlDocs },
        { data: legacyDocs, error }
      ] = await Promise.all([
        supabase.from("pillar_aadhaar_documents").select("*").eq("pillar_id", userId),
        supabase.from("pillar_pan_documents").select("*").eq("pillar_id", userId),
        supabase.from("pillar_voter_id_documents").select("*").eq("pillar_id", userId),
        supabase.from("pillar_driving_license_documents").select("*").eq("pillar_id", userId),
        supabase.from("kyc_documents").select("*").eq("pillar_id", userId)
      ]);

      const unified = [];
      if (aadhaarDocs) aadhaarDocs.forEach(d => unified.push({ ...d, document_type: 'aadhaar', document_url: d.document_image_url }));
      if (panDocs) panDocs.forEach(d => unified.push({ ...d, document_type: 'pan', document_url: d.document_image_url }));
      if (voterDocs) voterDocs.forEach(d => unified.push({ ...d, document_type: 'voter_id', document_url: d.document_image_url }));
      if (dlDocs) dlDocs.forEach(d => unified.push({ ...d, document_type: 'driving_licence', document_url: d.document_image_url }));
      if (legacyDocs) {
        legacyDocs.forEach(d => {
          if (!unified.some(u => u.document_type === d.document_type)) {
            unified.push(d);
          }
        });
      }

      return { data: unified, error: null };
    } catch (error) {
      console.error("Get KYC docs error:", error);
      return { data: [], error };
    }
  },

  // Upload KYC Document
  async uploadKycDocument(userId, docType, file) {
    const isDemo = localStorage.getItem("coophub_demo_user") === "true" || userId === "00000000-0000-0000-0000-000000000000";
    const docUrl = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80";

    if (isDemo) {
      const existing = JSON.parse(localStorage.getItem("coophub_demo_kyc_docs") || "[]");
      const newDoc = {
        id: `kyc-demo-${Date.now()}`,
        document_type: docType,
        document_url: docUrl,
        verification_status: "pending",
        uploaded_at: new Date().toISOString()
      };
      existing.unshift(newDoc);
      localStorage.setItem("coophub_demo_kyc_docs", JSON.stringify(existing));
      return { data: newDoc, error: null };
    }

    try {
      let finalUrl = docUrl;
      if (file) {
        const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
        const fileName = `${userId}/${docType}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("kyc_documents")
          .upload(fileName, file, { upsert: true });

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from("kyc_documents")
            .getPublicUrl(fileName);
          finalUrl = publicData?.publicUrl || finalUrl;
        }
      }

      // Also persist into dedicated document storage
      try {
        await documentStorageService.saveExtractedDocument({
          pillarId: userId,
          documentType: docType,
          extractedData: {},
          documentUrl: finalUrl
        });
      } catch (stErr) {}

      const { data, error } = await supabase
        .from("kyc_documents")
        .insert([{
          pillar_id: userId,
          document_type: docType,
          document_url: finalUrl,
          verification_status: "pending",
          uploaded_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Upload KYC doc error:", error);
      return { data: null, error };
    }
  }
};

export default pillarProfileService;
