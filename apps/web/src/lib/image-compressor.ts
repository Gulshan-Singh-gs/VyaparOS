/**
 * HTML5 Canvas Image Compressor
 *
 * Compresses camera or file uploads to a max 1200px dimension WebP or JPEG
 * targeting < 150KB size while preserving legibility of handwritten bills.
 */

export interface CompressionOptions {
  maxWidthOrHeight?: number;
  initialQuality?: number;
  maxSizeBytes?: number;
  mimeType?: 'image/webp' | 'image/jpeg';
}

export interface CompressedImageResult {
  base64: string;
  blob: Blob;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidthOrHeight: 1200,
  initialQuality: 0.8,
  maxSizeBytes: 150 * 1024, // 150 KB
  mimeType: 'image/webp',
};

export async function compressImage(
  fileOrBlob: File | Blob,
  options: CompressionOptions = {},
): Promise<CompressedImageResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = async () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > opts.maxWidthOrHeight) {
            height = Math.round((height * opts.maxWidthOrHeight) / width);
            width = opts.maxWidthOrHeight;
          }
        } else {
          if (height > opts.maxWidthOrHeight) {
            width = Math.round((width * opts.maxWidthOrHeight) / height);
            height = opts.maxWidthOrHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get 2D rendering context from canvas'));
          return;
        }

        // Draw image onto canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let quality = opts.initialQuality;
        let blob: Blob | null = null;

        // Iterative compression to hit target payload
        for (let attempt = 0; attempt < 4; attempt++) {
          blob = await new Promise<Blob | null>((res) =>
            canvas.toBlob((b) => res(b), opts.mimeType, quality),
          );

          if (!blob) break;

          if (blob.size <= opts.maxSizeBytes || quality <= 0.4) {
            break;
          }

          quality -= 0.15;
        }

        if (!blob) {
          reject(new Error('Failed to create Blob from Canvas'));
          return;
        }

        const base64Reader = new FileReader();
        base64Reader.onloadend = () => {
          const dataUrl = base64Reader.result as string;
          // Strip prefix data:image/...;base64,
          const base64 = dataUrl.split(',')[1] || '';

          resolve({
            base64,
            blob,
            mimeType: opts.mimeType,
            sizeBytes: blob.size,
            width,
            height,
          });
        };

        base64Reader.onerror = reject;
        base64Reader.readAsDataURL(blob);
      };

      img.onerror = reject;
      img.src = e.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(fileOrBlob);
  });
}

