import { supabase } from "../../lib/supabase";
import { emailService } from "../email/emailService";

export const pillarAuthService = {
  // Login with Email/Phone/Pillar ID and Password
  async login({ email, phone, password }) {
    try {
      let resolvedEmail = email?.trim();

      // If user provided a Pillar Code (e.g. PIL-CHE-042) or Mobile instead of Email
      if (resolvedEmail && !resolvedEmail.includes("@")) {
        const { data: pillarMatch } = await supabase
          .from("pillar_profiles")
          .select("email, status, pillar_code")
          .or(`pillar_code.eq.${resolvedEmail},mobile.eq.${resolvedEmail}`)
          .maybeSingle();

        if (pillarMatch?.email) {
          resolvedEmail = pillarMatch.email;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        phone,
        password,
      });

      if (error) throw error;

      // Check verification clearance status in pillar_profiles
      if (data?.user?.id) {
        const { data: pillarProfile } = await supabase
          .from("pillar_profiles")
          .select("status, pillar_code, full_name, rejection_reason, email")
          .eq("id", data.user.id)
          .maybeSingle();

        if (pillarProfile) {
          if (pillarProfile.status === "pending_review" || pillarProfile.status === "pending" || pillarProfile.status === "pending_verification") {
            await supabase.auth.signOut();
            return {
              user: null,
              error: {
                isPending: true,
                message: "⏳ Application Pending Verification: Your registration and government documents are currently under administrative review. Your Unique Pillar ID will be activated once approved."
              }
            };
          }

          if (pillarProfile.status === "rejected" || pillarProfile.status === "suspended") {
            await supabase.auth.signOut();
            const reason = pillarProfile.rejection_reason || "Government ID or trade documents could not be verified.";
            return {
              user: null,
              error: {
                isRejected: true,
                rejectionReason: reason,
                email: pillarProfile.email,
                message: `❌ Verification Rejected: ${reason}`
              }
            };
          }
        }
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error("Login error:", error);
      return { user: null, error };
    }
  },

  // Register Pillar
  async register(pillarData) {
    try {
      // 1. Register with Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: pillarData.email,
        password: pillarData.password,
        phone: pillarData.mobile,
        options: {
          data: {
            full_name: pillarData.fullName,
            role: "pillar", // Ensure role is pillar
          },
        },
      });

      if (authError) throw authError;

      const userId = authData.user.id;

      // 2. Process Document with PaddleOCR Pipeline
      let ocrResult = null;
      try {
        const { ocrService } = await import("./ocrService");
        ocrResult = await ocrService.extractDocumentInformation(
          pillarData.documentFile || null,
          pillarData.documentType || "aadhaar",
          pillarData
        );
      } catch (ocrErr) {
        console.warn("OCR pre-extraction note:", ocrErr);
      }

      // 3. Create Pillar Profile Record with PENDING_VERIFICATION status
      const { error: profileError } = await supabase.from("pillar_profiles").insert([
        {
          id: userId,
          full_name: pillarData.fullName,
          email: pillarData.email,
          mobile: pillarData.mobile,
          main_services: pillarData.mainServices,
          sub_services: pillarData.subServices,
          experience_years: pillarData.experience,
          service_area: pillarData.serviceArea,
          preferred_language: pillarData.preferredLanguage,
          status: "pending_verification",
          verification_status: "pending_verification",
          rejection_reason: null,
          document_type: pillarData.documentType || "aadhaar",
          document_number: pillarData.documentNumber || ocrResult?.extracted_document_number || null,
          dob: pillarData.dob || ocrResult?.extracted_dob || null,
          ocr_data: ocrResult || null,
          document_url: pillarData.documentPreviewUrl || null,
          created_at: new Date().toISOString(),
        },
      ]);

      if (profileError) throw profileError;

      // 4. Record KYC Document entry
      try {
        await supabase.from("kyc_documents").insert([
          {
            pillar_id: userId,
            document_type: pillarData.documentType || "aadhaar",
            document_number: pillarData.documentNumber || ocrResult?.extracted_document_number || "DOC-SUBMITTED",
            verification_status: "pending_inspection",
            document_url: pillarData.documentPreviewUrl || "#",
            ocr_data: ocrResult || null,
            created_at: new Date().toISOString(),
          }
        ]);
      } catch (kycErr) {
        console.warn("KYC table insert note:", kycErr);
      }

      // 5. Notify Administration of New Registration requiring verification
      try {
        await supabase.from("notifications").insert([
          {
            type: "admin_pillar_pending",
            title: "New Pillar Registration Requires Verification",
            message: `New technician application submitted by ${pillarData.fullName} (${pillarData.mainServices?.[0] || 'Technician'}). Pending KYC & credential verification.`,
            is_read: false,
            read: false,
            created_at: new Date().toISOString(),
          }
        ]);
      } catch (notifErr) {
        console.warn("Admin notification dispatch note:", notifErr);
      }

      return { user: authData.user, error: null };
    } catch (error) {
      console.error("Registration error:", error);
      return { user: null, error };
    }
  },

  // Resubmit Pillar Verification after Rejection
  async resubmitVerification(email, updatedData) {
    try {
      const { ocrService } = await import("./ocrService");
      const ocrResult = await ocrService.extractDocumentInformation(
        updatedData.documentFile || null,
        updatedData.documentType || "aadhaar",
        updatedData
      );

      const { data, error } = await supabase
        .from("pillar_profiles")
        .update({
          full_name: updatedData.fullName,
          mobile: updatedData.mobile,
          main_services: updatedData.mainServices,
          sub_services: updatedData.subServices,
          experience_years: updatedData.experience,
          service_area: updatedData.serviceArea,
          status: "pending_verification",
          verification_status: "pending_verification",
          rejection_reason: null,
          document_type: updatedData.documentType || "aadhaar",
          document_number: updatedData.documentNumber || ocrResult?.extracted_document_number || null,
          dob: updatedData.dob || ocrResult?.extracted_dob || null,
          ocr_data: ocrResult || null,
          document_url: updatedData.documentPreviewUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq("email", email)
        .select()
        .single();

      if (error) throw error;

      // Notify Admin
      try {
        await supabase.from("notifications").insert([
          {
            type: "admin_pillar_resubmitted",
            title: "Pillar Application Resubmitted",
            message: `Technician application resubmitted by ${updatedData.fullName}. Ready for re-evaluation in Verification Workspace.`,
            is_read: false,
            read: false,
            created_at: new Date().toISOString(),
          }
        ]);
      } catch (e) { /* silent */ }

      return { success: true, data };
    } catch (error) {
      console.error("Resubmission error:", error);
      return { success: false, error: error.message };
    }
  },

  // Login with OTP
  async loginWithOtp(phoneOrId) {
    try {
      let identifier = phoneOrId?.trim();
      let pillarName = 'Technician';
      let pillarCode = identifier;
      let emailRecipient = null;

      // Look up pillar profile to resolve email, name, and pillar code
      const { data: pillarMatch } = await supabase
        .from("pillar_profiles")
        .select("email, full_name, pillar_code, mobile")
        .or(`pillar_code.eq.${identifier},mobile.eq.${identifier},email.eq.${identifier}`)
        .maybeSingle();

      if (pillarMatch) {
        pillarName = pillarMatch.full_name || 'Technician';
        pillarCode = pillarMatch.pillar_code || identifier;
        emailRecipient = pillarMatch.email;
        if (pillarMatch.mobile && !identifier.includes('@')) identifier = pillarMatch.mobile;
      }

      const { data, error } = await supabase.auth.signInWithOtp(
        emailRecipient ? { email: emailRecipient } : { phone: identifier }
      );

      if (error) throw error;

      // Trigger Pillar OTP Email Template
      if (emailRecipient) {
        try {
          await emailService.sendPillarOtpEmail({
            email: emailRecipient,
            pillar_name: pillarName,
            pillar_id: pillarCode,
            expiry_minutes: 10
          });
        } catch (mailErr) {
          console.warn("Pillar OTP email dispatch notice:", mailErr);
        }
      }

      return { success: true, error: null };
    } catch (error) {
      console.error("OTP login error:", error);
      return { success: false, error };
    }
  },

  // Verify OTP
  async verifyOtp(phoneOrId, token) {
    try {
      let identifier = phoneOrId?.trim();
      let isEmail = identifier?.includes('@');

      if (!isEmail) {
        const { data: pillarMatch } = await supabase
          .from("pillar_profiles")
          .select("email, mobile")
          .or(`pillar_code.eq.${identifier},mobile.eq.${identifier}`)
          .maybeSingle();

        if (pillarMatch?.email) {
          identifier = pillarMatch.email;
          isEmail = true;
        } else if (pillarMatch?.mobile) {
          identifier = pillarMatch.mobile;
        }
      }

      const { data, error } = await supabase.auth.verifyOtp(
        isEmail
          ? { email: identifier, token, type: 'email' }
          : { phone: identifier, token, type: 'sms' }
      );

      if (error) throw error;
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error("OTP verify error:", error);
      return { user: null, session: null, error };
    }
  },

  // Logout
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error };
    }
  },

  // Get Current Session
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session: data.session, error: null };
    } catch (error) {
      return { session: null, error };
    }
  }
};
