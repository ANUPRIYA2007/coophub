// ==============================================================================
// COOP HUB — Worker Skill Certification Service
// ==============================================================================
// Manages the skill certification lifecycle independently from identity verification.
// Statuses: 'pending', 'under_review', 'approved', 'rejected', 'expired'
// ==============================================================================

import { supabase } from '../../lib/supabase.js';

const DEMO_CERTIFICATIONS = [
  {
    id: "CERT-001",
    pillar_id: "00000000-0000-0000-0000-000000000000",
    skill_name: "Electrical Repair",
    certificate_name: "National Trade Certificate (NTC) — Wireman & Industrial Electrician",
    issuing_organization: "National Council for Vocational Training (NCVT)",
    certificate_number: "NCVT-TN-2022-8491",
    issue_date: "2022-06-15",
    expiry_date: "2027-06-15",
    document_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
    verification_status: "approved",
    rejection_reason: null,
    verified_by: "Admin",
    verified_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 35).toISOString()
  },
  {
    id: "CERT-002",
    pillar_id: "00000000-0000-0000-0000-000000000000",
    skill_name: "AC Repair & HVAC",
    certificate_name: "Advanced Refrigeration & Inverter AC Systems Specialist",
    issuing_organization: "Government Industrial Training Institute (ITI Guindy)",
    certificate_number: "ITI-CHE-2023-1120",
    issue_date: "2023-03-10",
    expiry_date: "2028-03-10",
    document_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
    verification_status: "approved",
    rejection_reason: null,
    verified_by: "Admin",
    verified_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 20).toISOString()
  }
];

export const certificationService = {
  /**
   * Fetch all certifications for a specific Pillar
   */
  async getMyCertifications(pillarId) {
    const isDemo = localStorage.getItem("coophub_demo_user") === "true" || pillarId === "00000000-0000-0000-0000-000000000000";

    if (isDemo) {
      const stored = JSON.parse(localStorage.getItem("coophub_demo_certifications") || "null");
      return { data: stored || DEMO_CERTIFICATIONS, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('skill_certifications')
        .select('*')
        .eq('pillar_id', pillarId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error("Get certifications error:", error);
      return { data: [], error };
    }
  },

  /**
   * Fetch all pending and historical certifications for Admin Review Workspace
   */
  async getAllCertifications(filterStatus = 'all') {
    const isDemo = localStorage.getItem("coophub_demo_admin") === "true" || localStorage.getItem("coophub_demo_user") === "true";

    if (isDemo) {
      const stored = JSON.parse(localStorage.getItem("coophub_demo_certifications") || "null") || DEMO_CERTIFICATIONS;
      let res = stored;
      if (filterStatus !== 'all') {
        res = stored.filter(c => c.verification_status === filterStatus);
      }
      return { data: res, error: null };
    }

    try {
      let query = supabase
        .from('skill_certifications')
        .select(`
          *,
          pillar:pillar_profiles(id, full_name, mobile, pillar_code, main_services)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('verification_status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error("Fetch all certs error:", error);
      return { data: [], error };
    }
  },

  /**
   * Submit a new skill certificate
   */
  async submitCertification({ pillarId, skillName, certificateName, issuingOrg, certificateNumber, issueDate, expiryDate, file }) {
    const isDemo = localStorage.getItem("coophub_demo_user") === "true" || pillarId === "00000000-0000-0000-0000-000000000000";

    let docUrl = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80";

    if (!isDemo && file) {
      try {
        const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
        const fileName = `${pillarId}/cert_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('kyc_documents')
          .upload(fileName, file, { upsert: true });

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from('kyc_documents')
            .getPublicUrl(fileName);
          docUrl = publicData?.publicUrl || docUrl;
        }
      } catch (uploadErr) {
        console.warn("Storage upload notice:", uploadErr);
      }
    }

    const payload = {
      pillar_id: pillarId,
      skill_name: skillName,
      certificate_name: certificateName,
      issuing_organization: issuingOrg,
      certificate_number: certificateNumber || null,
      issue_date: issueDate || new Date().toISOString().split('T')[0],
      expiry_date: expiryDate || null,
      document_url: docUrl,
      verification_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isDemo) {
      const stored = JSON.parse(localStorage.getItem("coophub_demo_certifications") || "null") || [...DEMO_CERTIFICATIONS];
      const newCert = {
        ...payload,
        id: `CERT-DEMO-${Date.now()}`
      };
      stored.unshift(newCert);
      localStorage.setItem("coophub_demo_certifications", JSON.stringify(stored));
      return { data: newCert, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('skill_certifications')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // In-app notification for admin
      try {
        await supabase.from('notifications').insert([{
          user_id: pillarId,
          type: 'certification_submitted',
          title: 'Skill Certificate Submitted',
          message: `Your certificate "${certificateName}" for ${skillName} has been submitted for cooperative verification.`,
          read: false
        }]);
      } catch (e) { /* silent */ }

      return { data, error: null };
    } catch (error) {
      console.error("Submit certification error:", error);
      return { data: null, error };
    }
  },

  /**
   * Admin approves a skill certification
   */
  async approveCertification(certId, verifiedByUserId = null) {
    const isDemo = localStorage.getItem("coophub_demo_admin") === "true" || localStorage.getItem("coophub_demo_user") === "true";

    if (isDemo) {
      const stored = JSON.parse(localStorage.getItem("coophub_demo_certifications") || "null") || [...DEMO_CERTIFICATIONS];
      const match = stored.find(c => c.id === certId);
      if (match) {
        match.verification_status = 'approved';
        match.verified_at = new Date().toISOString();
        match.verified_by = 'Cooperative Admin';
        localStorage.setItem("coophub_demo_certifications", JSON.stringify(stored));
      }
      return { success: true, data: match };
    }

    try {
      const { data: cert, error: fetchErr } = await supabase
        .from('skill_certifications')
        .select('*')
        .eq('id', certId)
        .single();

      if (fetchErr) throw fetchErr;

      const { data, error } = await supabase
        .from('skill_certifications')
        .update({
          verification_status: 'approved',
          verified_by: verifiedByUserId,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', certId)
        .select()
        .single();

      if (error) throw error;

      // Update pillar_profiles certified_skills list cache
      try {
        const { data: pillar } = await supabase
          .from('pillar_profiles')
          .select('certified_skills')
          .eq('id', cert.pillar_id)
          .single();

        const currentSkills = Array.isArray(pillar?.certified_skills) ? pillar.certified_skills : [];
        if (!currentSkills.includes(cert.skill_name)) {
          await supabase
            .from('pillar_profiles')
            .update({ certified_skills: [...currentSkills, cert.skill_name] })
            .eq('id', cert.pillar_id);
        }

        // Send realtime approval notification to the Pillar
        await supabase.from('notifications').insert([{
          user_id: cert.pillar_id,
          type: 'certification_approved',
          title: '🎉 Skill Certificate Approved!',
          message: `Your skill certificate for ${cert.skill_name} (${cert.certificate_name}) has been verified and approved by the Cooperative Administrator.`,
          read: false
        }]);
      } catch (notifErr) {
        console.warn("Pillar cert sync notice:", notifErr);
      }

      return { success: true, data };
    } catch (error) {
      console.error("Approve certification error:", error);
      return { success: false, error };
    }
  },

  /**
   * Admin rejects a skill certification
   */
  async rejectCertification(certId, rejectionReason) {
    const isDemo = localStorage.getItem("coophub_demo_admin") === "true" || localStorage.getItem("coophub_demo_user") === "true";

    if (isDemo) {
      const stored = JSON.parse(localStorage.getItem("coophub_demo_certifications") || "null") || [...DEMO_CERTIFICATIONS];
      const match = stored.find(c => c.id === certId);
      if (match) {
        match.verification_status = 'rejected';
        match.rejection_reason = rejectionReason || 'Certificate document could not be verified.';
        match.verified_at = new Date().toISOString();
        localStorage.setItem("coophub_demo_certifications", JSON.stringify(stored));
      }
      return { success: true, data: match };
    }

    try {
      const { data: cert } = await supabase
        .from('skill_certifications')
        .select('*')
        .eq('id', certId)
        .single();

      const { data, error } = await supabase
        .from('skill_certifications')
        .update({
          verification_status: 'rejected',
          rejection_reason: rejectionReason || 'Certificate validation unconfirmed',
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', certId)
        .select()
        .single();

      if (error) throw error;

      if (cert) {
        try {
          await supabase.from('notifications').insert([{
            user_id: cert.pillar_id,
            type: 'certification_rejected',
            title: '⚠️ Skill Certificate Needs Revision',
            message: `Your certificate for ${cert.skill_name} was rejected: "${rejectionReason}". You may re-upload a clearer document.`,
            read: false
          }]);
        } catch (e) { /* silent */ }
      }

      return { success: true, data };
    } catch (error) {
      console.error("Reject certification error:", error);
      return { success: false, error };
    }
  }
};

export default certificationService;
