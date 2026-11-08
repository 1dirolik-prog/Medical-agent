/**
 * High-quality image preprocessing service for medical document scanning.
 * Optimizes resolution and quality to preserve fine text, decimal numbers,
 * and tabular lab structures without exceeding RAM or API payload limits.
 */

export interface ProcessedDocumentImage {
  id: string;
  name: string;
  size: number;
  data: string; // Base64 full data url for Gemini API
  mimeType: string;
  thumbnail: string; // Lightweight preview for UI
}

const MAX_IMAGE_DIMENSION = 1800; // Optimal resolution for clinical OCR
const COMPRESSION_QUALITY = 0.85; // High clarity for decimal numbers and units
const THUMBNAIL_DIMENSION = 240;

/**
 * Compresses and prepares an image file for optical character recognition.
 */
export const preprocessDocumentImage = (file: File): Promise<ProcessedDocumentImage> => {
  return new Promise((resolve) => {
    const fileId = Math.random().toString(36).substring(2, 11);
    const fileName = file.name || "medical_document.jpg";
    const fileSize = file.size;

    const fallbackReader = () => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const fullData = (reader.result as string) || "";
        resolve({
          id: fileId,
          name: fileName,
          size: fileSize,
          data: fullData,
          mimeType: file.type || "image/jpeg",
          thumbnail: fullData,
        });
      };
      reader.onerror = () => {
        resolve({
          id: fileId,
          name: fileName,
          size: fileSize,
          data: "",
          mimeType: file.type || "image/jpeg",
          thumbnail: "",
        });
      };
      reader.readAsDataURL(file);
    };

    if (!file.type.startsWith("image/")) {
      fallbackReader();
      return;
    }

    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        try {
          // 1. Generate high-quality OCR image
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
              width = MAX_IMAGE_DIMENSION;
            } else {
              width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
              height = MAX_IMAGE_DIMENSION;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d", { willReadFrequently: false });

          if (!ctx) {
            fallbackReader();
            return;
          }

          // Smooth scaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          const fullDataUrl = canvas.toDataURL("image/jpeg", COMPRESSION_QUALITY);

          // 2. Generate lightweight thumbnail for UI gallery
          let thumbWidth = img.naturalWidth || img.width;
          let thumbHeight = img.naturalHeight || img.height;
          if (thumbWidth > thumbHeight) {
            thumbHeight = Math.round((thumbHeight * THUMBNAIL_DIMENSION) / thumbWidth);
            thumbWidth = THUMBNAIL_DIMENSION;
          } else {
            thumbWidth = Math.round((thumbWidth * THUMBNAIL_DIMENSION) / thumbHeight);
            thumbHeight = THUMBNAIL_DIMENSION;
          }

          const thumbCanvas = document.createElement("canvas");
          thumbCanvas.width = thumbWidth;
          thumbCanvas.height = thumbHeight;
          const thumbCtx = thumbCanvas.getContext("2d");
          let thumbDataUrl = fullDataUrl;

          if (thumbCtx) {
            thumbCtx.imageSmoothingEnabled = true;
            thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
            thumbDataUrl = thumbCanvas.toDataURL("image/jpeg", 0.6);
          }

          resolve({
            id: fileId,
            name: fileName,
            size: fileSize,
            data: fullDataUrl,
            mimeType: "image/jpeg",
            thumbnail: thumbDataUrl,
          });
        } catch (e) {
          fallbackReader();
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        fallbackReader();
      };

      img.src = objectUrl;
    } catch (e) {
      fallbackReader();
    }
  });
};

/**
 * Batch processes multiple files with progress reporting.
 */
export const processDocumentFiles = async (
  files: File[],
  onProgress?: (processed: number, total: number) => void
): Promise<ProcessedDocumentImage[]> => {
  const results: ProcessedDocumentImage[] = [];
  for (let i = 0; i < files.length; i++) {
    const processed = await preprocessDocumentImage(files[i]);
    if (processed.data) {
      results.push(processed);
    }
    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }
  return results;
};
