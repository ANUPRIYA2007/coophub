/**
 * COOP HUB — Real Document Quality Analysis Engine
 * 
 * Evaluates uploaded document images for clarity, resolution, sharpness,
 * contrast, and text coverage before administrative review.
 * 
 * Quality Tiers:
 * - GOOD: High resolution, sharp edges, readable text, high OCR density
 * - FAIR: Readable with minor artifacts or low contrast
 * - POOR: Blurry, low resolution, or partial text detection
 * - UNREADABLE: Extremely blurry, corrupted, empty, or insufficient contrast
 */

export const documentQualityService = {
  /**
   * Analyze document image properties and OCR confidence
   * @param {object} params
   * @param {number} params.width - Image width in pixels
   * @param {number} params.height - Image height in pixels
   * @param {number} params.fileSize - File size in bytes
   * @param {number} params.ocrConfidence - OCR / Vision engine confidence score (0-100)
   * @param {string} params.rawText - Raw OCR text extracted
   * @param {string} params.mimeType - File MIME type
   * @returns {object} Quality assessment details and classification tier
   */
  assessQuality({
    width = 0,
    height = 0,
    fileSize = 0,
    ocrConfidence = 0,
    rawText = '',
    mimeType = 'image/jpeg'
  } = {}) {
    const issues = [];
    const metrics = {};

    // 1. Resolution & Dimension Analysis
    const totalPixels = width * height;
    metrics.resolution = `${width}x${height}`;
    metrics.totalPixels = totalPixels;
    metrics.fileSizeBytes = fileSize;
    metrics.fileSizeKb = Math.round(fileSize / 1024);

    let resolutionScore = 1.0;
    if (width === 0 || height === 0) {
      resolutionScore = 0.3;
      issues.push('Dimensions could not be determined');
    } else if (width < 600 || height < 400) {
      resolutionScore = 0.4;
      issues.push('Low resolution image (< 600x400) may impede accurate text recognition');
    } else if (width < 1000 || height < 700) {
      resolutionScore = 0.75;
    } else {
      resolutionScore = 1.0;
    }

    // 2. File Size Analysis
    let sizeScore = 1.0;
    if (fileSize < 10 * 1024) { // < 10KB
      sizeScore = 0.3;
      issues.push('Extremely small file size indicates severe compression or empty file');
    } else if (fileSize < 50 * 1024) { // < 50KB
      sizeScore = 0.7;
    } else {
      sizeScore = 1.0;
    }

    // 3. OCR Text Density & Confidence
    const cleanText = (rawText || '').trim();
    const charCount = cleanText.length;
    const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;
    metrics.charCount = charCount;
    metrics.wordCount = wordCount;
    metrics.ocrConfidence = Math.round(ocrConfidence);

    let textScore = 1.0;
    if (charCount < 15) {
      textScore = 0.1;
      issues.push('Very low character detection (< 15 characters); document appears blank or illegible');
    } else if (charCount < 50) {
      textScore = 0.5;
      issues.push('Sparse text detection (< 50 characters); partial document or heavy blur');
    } else if (charCount < 120) {
      textScore = 0.8;
    } else {
      textScore = 1.0;
    }

    // 4. OCR Confidence Score Weighting
    let confScore = 1.0;
    if (ocrConfidence > 0) {
      if (ocrConfidence < 40) {
        confScore = 0.3;
        issues.push(`Low OCR confidence (${Math.round(ocrConfidence)}%) indicates poor contrast or optical distortion`);
      } else if (ocrConfidence < 70) {
        confScore = 0.7;
        issues.push(`Moderate OCR confidence (${Math.round(ocrConfidence)}%)`);
      } else {
        confScore = 1.0;
      }
    } else {
      // If OCR engine did not report confidence, rely on character density
      confScore = textScore;
    }

    // 5. Composite Quality Score (0 to 100)
    const compositeScore = Math.round(
      (resolutionScore * 0.25 + sizeScore * 0.15 + textScore * 0.35 + confScore * 0.25) * 100
    );

    // 6. Classification Tier
    let qualityTier = 'GOOD';
    if (compositeScore < 30 || charCount < 15) {
      qualityTier = 'UNREADABLE';
    } else if (compositeScore < 55) {
      qualityTier = 'POOR';
    } else if (compositeScore < 80) {
      qualityTier = 'FAIR';
    } else {
      qualityTier = 'GOOD';
    }

    return {
      quality_tier: qualityTier,
      composite_score: compositeScore,
      is_readable: qualityTier !== 'UNREADABLE',
      metrics: {
        ...metrics,
        resolution_score: resolutionScore,
        size_score: sizeScore,
        text_score: textScore,
        confidence_score: confScore
      },
      issues,
      evaluated_at: new Date().toISOString()
    };
  }
};

export default documentQualityService;
