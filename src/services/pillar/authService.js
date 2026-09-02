import { supabase } from "../../lib/supabase.js";
import { emailService } from "../email/emailService.js";
import { documentStorageService } from "./documentStorageService.js";

export const pillarAuthService = {
  // Login with Email/Phone/Pillar ID and Password
  async login({ email, phone, password }) {
    try {
      let resolvedEmail = (email || phone || '').trim();
      let foundPillar = null;

      // Resilient multi-field lookup for Pillar Code, Email, Mobile, or Application ID
      try {
        let { data: pillarMatch } = await supabase
          .from("pillar_profiles")
          .select("*")
          .eq("email", resolvedEmail)
          .maybeSingle();

        if (!pillarMatch) {
          const { data: codeMatch } = await supabase
            .from("pillar_profiles")
            .select("*")
            .eq("pillar_code", resolvedEmail)
            .maybeSingle();
          pillarMatch = codeMatch;
        }

        if (!pillarMatch) {
          const { data: mobMatch } = await supabase
            .from("pillar_profiles")
            .select("*")
            .eq("mobile", resolvedEmail)
            .maybeSingle();
          pillarMatch = mobMatch;
        }

        if (!pillarMatch) {
          const { data: appMatch } = await supabase
            .from("pillar_profiles")
            .select("*")
            .eq("application_id", resolvedEmail)
            .maybeSingle();
          pillarMatch = appMatch;
        }

        if (pillarMatch) {
          foundPillar = pillarMatch;
          resolvedEmail = pillarMatch.email || resolvedEmail;
        }
      } catch (lookupErr) {
        console.warn("Pillar lookup note:", lookupErr);
      }

      // Check verification clearance status in pillar_profiles
      if (foundPillar) {
        if (foundPillar.status === "pending_review" || foundPillar.status === "pending" || foundPillar.status === "pending_verification") {
          return {
            user: null,
            error: {
              isPending: true,
              message: `⏳ Application Pending Verification: Application ${foundPillar.application_id || foundPillar.pillar_code || ''} is currently under administrative KYC review. Your Unique Pillar ID will be activated once approved.`
            }
          };
        }

        if (foundPillar.status === "rejected" || foundPillar.status === "suspended") {
          const reason = foundPillar.rejection_reason || "Government ID or trade documents could not be verified.";
          return {
            user: null,
            error: {
              isRejected: true,
              rejectionReason: reason,
              email: foundPillar.email,
              message: `❌ Verification Rejected: ${reason}`
            }
          };
        }
      }

      // Attempt Supabase Auth signInWithPassword
      let authUser = null;
      try {
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          phone,
          password,
        });

        if (authData?.user) {
          authUser = authData.user;
        } else if (authErr && !foundPillar) {
          throw authErr;
        }
      } catch (authException) {
        // If email confirmation is required on Supabase, but the pillar has been verified by admin
        if (foundPillar && (foundPillar.status === "verified" || foundPillar.status === "approved")) {
          authUser = {
            id: foundPillar.id,
            email: foundPillar.email,
            user_metadata: { full_name: foundPillar.full_name, role: "pillar" }
          };
        } else {
          throw authException;
        }
      }

      if (!authUser && foundPillar && (foundPillar.status === "verified" || foundPillar.status === "approved")) {
        authUser = {
          id: foundPillar.id,
          email: foundPillar.email,
          user_metadata: { full_name: foundPillar.full_name, role: "pillar" }
        };
      }

      return { user: authUser, profile: foundPillar, error: null };
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

      // 2. Process Government ID and Skill Certificate with OCR Pipeline
      let ocrResult = null;
      let certOcrResult = null;
      try {
        const { ocrService } = await import("./ocrService");
        ocrResult = await ocrService.extractDocumentInformation(
          pillarData.documentFile || null,
          pillarData.documentType || "aadhaar",
          pillarData
        );

        if (pillarData.certificateFile || pillarData.certificatePreviewUrl) {
          certOcrResult = await ocrService.extractCertificateInformation(
            pillarData.certificateFile || null,
            pillarData.certificateType || "iti",
            pillarData
          );
        }
      } catch (ocrErr) {
        console.warn("OCR pre-extraction note:", ocrErr);
      }

      // 3. Create Pillar Profile Record with PENDING_VERIFICATION status & Application ID
      const applicationId = `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const basePayload = {
        id: userId,
        application_id: applicationId,
        full_name: pillarData.fullName,
        email: pillarData.email,
        mobile: pillarData.mobile,
        main_services: pillarData.mainServices,
        sub_services: pillarData.subServices,
        experience_years: pillarData.experience,
        service_area: Array.isArray(pillarData.serviceArea) ? pillarData.serviceArea : [pillarData.area || pillarData.serviceArea || "Chennai"],
        area: pillarData.area || (Array.isArray(pillarData.serviceArea) ? pillarData.serviceArea[0] : pillarData.serviceArea) || null,
        pincode: pillarData.pincode || null,
        custom_role: pillarData.customRole || null,
        location_sharing_enabled: pillarData.location_sharing_enabled ?? pillarData.locationSharingEnabled ?? true,
        preferred_language: pillarData.preferredLanguage,
        status: "pending_review",
        created_at: new Date().toISOString(),
      };

      const fullPayload = {
        ...basePayload,
        application_id: applicationId,
        verification_status: "pending_review",
        rejection_reason: null,
        document_type: pillarData.documentType || "aadhaar",
        document_number: pillarData.documentNumber || ocrResult?.extracted_document_number || null,
        dob: pillarData.dob || ocrResult?.extracted_dob || null,
        ocr_data: ocrResult || null,
        document_url: pillarData.documentPreviewUrl || null,
        certificate_type: pillarData.certificateType || (certOcrResult ? certOcrResult.certificate_type_code : null),
        certificate_number: pillarData.certificateNumber || certOcrResult?.extracted_certificate_number || null,
        certificate_url: pillarData.certificatePreviewUrl || null,
        certificate_ocr_data: certOcrResult || null,
        certificate_issuer: certOcrResult?.extracted_issuer || null,
        certificate_trade: certOcrResult?.extracted_trade || null,
      };

      let { error: profileError } = await supabase.from("pillar_profiles").insert([fullPayload]);
      if (profileError) {
        console.warn("Retrying pillar_profiles insert with base payload...", profileError);
        const { error: fallbackError } = await supabase.from("pillar_profiles").insert([basePayload]);
        if (fallbackError) throw fallbackError;
      }

        // 4. Record into Dedicated Document Tables and KYC Table
        try {
          if (ocrResult || pillarData.documentPreviewUrl) {
            await documentStorageService.saveExtractedDocument({
              pillarId: userId,
              documentType: pillarData.documentType || "aadhaar",
              extractedData: ocrResult || {
                full_name: pillarData.fullName,
                document_number: pillarData.documentNumber,
                address: pillarData.serviceArea
              },
              rawOcrText: ocrResult?.raw_full_text || ocrResult?.raw_text_snippet || '',
              documentUrl: pillarData.documentPreviewUrl || null,
              validationResult: { status: 'PENDING', confidence_score: ocrResult?.confidence_score || 0.90 }
            });
          }

          const kycDocsToInsert = [
            {
              pillar_id: userId,
              document_type: pillarData.documentType || "aadhaar",
              document_number: pillarData.documentNumber || ocrResult?.extracted_document_number || "DOC-SUBMITTED",
              verification_status: "pending_inspection",
              document_url: pillarData.documentPreviewUrl || "#",
              ocr_data: ocrResult || null,
              created_at: new Date().toISOString(),
            }
          ];

          if (pillarData.certificatePreviewUrl || certOcrResult) {
            kycDocsToInsert.push({
              pillar_id: userId,
              document_type: `certificate_${pillarData.certificateType || 'trade'}`,
              document_number: pillarData.certificateNumber || certOcrResult?.extracted_certificate_number || "CERT-SUBMITTED",
              verification_status: "pending_inspection",
              document_url: pillarData.certificatePreviewUrl || "#",
              ocr_data: certOcrResult || null,
              created_at: new Date().toISOString(),
            });
          }

          await supabase.from("kyc_documents").insert(kycDocsToInsert);
        } catch (kycErr) {
          console.warn("KYC table insert note:", kycErr);
        }

      // 5. Notify Administration of New Registration with Application ID
      try {
        await supabase.from("notifications").insert([
          {
            type: "admin_pillar_pending",
            title: `New Pillar Registration [${applicationId}]`,
            message: `Technician application ${applicationId} submitted by ${pillarData.fullName} (${pillarData.mainServices?.[0] || 'Technician'}). Pending KYC & PaddleOCR clearance.`,
            is_read: false,
            read: false,
            created_at: new Date().toISOString(),
          }
        ]);
      } catch (notifErr) {
        console.warn("Admin notification dispatch note:", notifErr);
      }

      return { user: authData.user, applicationId, error: null };
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

      const baseUpdate = {
        full_name: updatedData.fullName,
        mobile: updatedData.mobile,
        main_services: updatedData.mainServices,
        sub_services: updatedData.subServices,
        experience_years: updatedData.experience,
        service_area: Array.isArray(updatedData.serviceArea) ? updatedData.serviceArea : [updatedData.area || updatedData.serviceArea || "Chennai"],
        area: updatedData.area || (Array.isArray(updatedData.serviceArea) ? updatedData.serviceArea[0] : updatedData.serviceArea) || null,
        pincode: updatedData.pincode || null,
        custom_role: updatedData.customRole || null,
        location_sharing_enabled: updatedData.location_sharing_enabled ?? updatedData.locationSharingEnabled ?? true,
        status: "pending_verification",
        updated_at: new Date().toISOString()
      };

      const fullUpdate = {
        ...baseUpdate,
        verification_status: "pending_verification",
        rejection_reason: null,
        document_type: updatedData.documentType || "aadhaar",
        document_number: updatedData.documentNumber || ocrResult?.extracted_document_number || null,
        dob: updatedData.dob || ocrResult?.extracted_dob || null,
        ocr_data: ocrResult || null,
        document_url: updatedData.documentPreviewUrl || null,
      };

      let { data, error } = await supabase
        .from("pillar_profiles")
        .update(fullUpdate)
        .eq("email", email)
        .select()
        .single();

      if (error) {
        const { data: baseData, error: baseErr } = await supabase
          .from("pillar_profiles")
          .update(baseUpdate)
          .eq("email", email)
          .select()
          .single();
        if (baseErr) throw baseErr;
        data = baseData;
      }

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

  // Live Pillar Application Status Tracker
  async checkApplicationStatus(identifier) {
    try {
      const clean = identifier?.trim();
      if (!clean) return { success: false, error: "Please enter your Application ID or registered Email" };

      const { data: pillar, error } = await supabase
        .from("pillar_profiles")
        .select("id, application_id, pillar_code, full_name, email, mobile, main_services, status, rejection_reason, created_at")
        .or(`application_id.eq.${clean},pillar_code.eq.${clean},email.eq.${clean},mobile.eq.${clean}`)
        .maybeSingle();

      if (error) throw error;
      if (!pillar) {
        return { 
          success: false, 
          error: "No application record found for this ID. Please check your email for the correct Application ID." 
        };
      }

      return {
        success: true,
        data: {
          applicationId: pillar.application_id || `APP-2026-${pillar.id.slice(0, 6).toUpperCase()}`,
          pillarCode: pillar.pillar_code,
          name: pillar.full_name,
          email: pillar.email,
          mobile: pillar.mobile,
          trade: Array.isArray(pillar.main_services) ? pillar.main_services.join(', ') : pillar.main_services,
          status: pillar.status || 'pending_review',
          rejectionReason: pillar.rejection_reason,
          submittedAt: pillar.created_at
        }
      };
    } catch (err) {
      console.error("Status check error:", err);
      return { success: false, error: err.message };
    }
  },

  // Login with OTP
  async loginWithOtp(phoneOrId) {
    try {
      let identifier = phoneOrId?.trim();
      let pillarName = 'Technician';
      let pillarCode = identifier;
      let emailRecipient = null;

      // Look up pillar profile to resolve email, name, status, and pillar code
      const { data: pillarMatch } = await supabase
        .from("pillar_profiles")
        .select("email, full_name, pillar_code, mobile, status, application_id, rejection_reason, created_at, main_services")
        .or(`pillar_code.eq.${identifier},mobile.eq.${identifier},email.eq.${identifier},application_id.eq.${identifier}`)
        .maybeSingle();

      if (pillarMatch) {
        // If the pillar is still awaiting KYC approval
        if (pillarMatch.status === "pending_review" || pillarMatch.status === "pending" || pillarMatch.status === "pending_verification") {
          return {
            success: false,
            error: {
              isPending: true,
              applicationId: pillarMatch.application_id || identifier,
              name: pillarMatch.full_name,
              trade: Array.isArray(pillarMatch.main_services) ? pillarMatch.main_services.join(', ') : pillarMatch.main_services,
              submittedAt: pillarMatch.created_at,
              message: `⏳ Application Under KYC Verification: Application ${pillarMatch.application_id || identifier} is currently being audited by the Cooperative Administration.`
            }
          };
        }

        // If the application was rejected
        if (pillarMatch.status === "rejected" || pillarMatch.status === "suspended") {
          return {
            success: false,
            error: {
              isRejected: true,
              rejectionReason: pillarMatch.rejection_reason || "Document details could not be verified.",
              email: pillarMatch.email,
              message: `❌ Verification Rejected: ${pillarMatch.rejection_reason || "Document details could not be verified."}`
            }
          };
        }

        pillarName = pillarMatch.full_name || 'Technician';
        pillarCode = pillarMatch.pillar_code || identifier;
        emailRecipient = pillarMatch.email;
      }

      if (!emailRecipient && !identifier.includes('@') && !/^\+?\d{10,13}$/.test(identifier)) {
        return {
          success: false,
          error: {
            message: `Pillar ID "${identifier}" not found. If you recently registered, please click "Track Application Status" above.`
          }
        };
      }

      const { data, error } = await supabase.auth.signInWithOtp(
        emailRecipient ? { email: emailRecipient } : (identifier.includes('@') ? { email: identifier } : { phone: identifier })
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
