/**
 * PROTOTYPE REFERENCE VERIFICATION DATASET
 * 
 * ⚠️ IMPORTANT NOTICE:
 * This is strictly a local prototype/reference dataset for demonstration
 * and simulated verification logic in COOP HUB.
 * It is NEVER represented as an official government database.
 */

export const PROTOTYPE_VERIFICATION_RECORDS = [
  // 1. Aadhaar Reference Samples
  {
    document_type: "aadhaar",
    document_number: "XXXX-XXXX-4892",
    full_name: "Senthil Kumar",
    dob: "1992-05-14",
    state: "Tamil Nadu",
    city: "Chennai",
    status: "VALID_ACTIVE",
    issued_authority: "UIDAI (Demo Reference)",
    match_keywords: ["senthil", "kumar", "4892"]
  },
  {
    document_type: "aadhaar",
    document_number: "XXXX-XXXX-9124",
    full_name: "Murugan Velan",
    dob: "1988-11-20",
    state: "Tamil Nadu",
    city: "Chennai",
    status: "VALID_ACTIVE",
    issued_authority: "UIDAI (Demo Reference)",
    match_keywords: ["murugan", "velan", "9124"]
  },
  {
    document_type: "aadhaar",
    document_number: "XXXX-XXXX-6712",
    full_name: "Ramesh Pandi",
    dob: "1994-08-10",
    state: "Tamil Nadu",
    city: "Chennai",
    status: "VALID_ACTIVE",
    issued_authority: "UIDAI (Demo Reference)",
    match_keywords: ["ramesh", "pandi", "6712"]
  },

  // 2. PAN Card Reference Samples
  {
    document_type: "pan",
    document_number: "ABCDE1234F",
    full_name: "Praveen Kumaran",
    dob: "1995-02-18",
    state: "Tamil Nadu",
    city: "Chennai",
    status: "VALID_ACTIVE",
    issued_authority: "Income Tax Department (Demo Reference)",
    match_keywords: ["praveen", "kumaran", "abcde1234f"]
  },
  {
    document_type: "pan",
    document_number: "BCDFG5678K",
    full_name: "Lakshmi Priya",
    dob: "1996-09-25",
    state: "Tamil Nadu",
    city: "Chennai",
    status: "VALID_ACTIVE",
    issued_authority: "Income Tax Department (Demo Reference)",
    match_keywords: ["lakshmi", "priya", "bcdfg5678k"]
  },

  // 3. Voter ID Reference Samples
  {
    document_type: "voter_id",
    document_number: "TN/02/123/456789",
    full_name: "Karthik Rajan",
    dob: "1990-07-04",
    state: "Tamil Nadu",
    city: "Chennai",
    status: "VALID_ACTIVE",
    issued_authority: "Election Commission of India (Demo Reference)",
    match_keywords: ["karthik", "rajan", "456789"]
  },

  // 4. Driving Licence Reference Samples
  {
    document_type: "driving_licence",
    document_number: "TN01 20180004921",
    full_name: "Deepak Sundaram",
    dob: "1991-03-12",
    state: "Tamil Nadu",
    city: "Chennai",
    status: "VALID_ACTIVE",
    issued_authority: "Transport Department Tamil Nadu (Demo Reference)",
    match_keywords: ["deepak", "sundaram", "20180004921"]
  }
];

/**
 * Helper to query prototype reference verification records
 */
export function findReferenceRecord({ document_type, document_number, full_name }) {
  if (!document_type && !full_name && !document_number) return null;

  const normalizedName = (full_name || '').toLowerCase().trim();
  const normalizedDocNo = (document_number || '').replace(/[\s-]/g, '').toLowerCase();
  const docTypeKey = (document_type || '').toLowerCase().replace(/[\s-]/g, '_');

  return PROTOTYPE_VERIFICATION_RECORDS.find(rec => {
    // Check type match if specified
    const typeMatch = !document_type || rec.document_type === docTypeKey || docTypeKey.includes(rec.document_type);
    
    // Check document number match
    const cleanRecDocNo = rec.document_number.replace(/[\s-]/g, '').toLowerCase();
    const docNoMatch = normalizedDocNo && cleanRecDocNo.includes(normalizedDocNo.slice(-4));

    // Check name match
    const recName = rec.full_name.toLowerCase();
    const nameMatch = normalizedName && (recName.includes(normalizedName) || normalizedName.includes(recName));

    return typeMatch && (docNoMatch || nameMatch);
  }) || null;
}
