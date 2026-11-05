/**
 * Supabase Storage - Signed URL Manager
 *
 * Handles secure upload/download URLs for bill images.
 */
import { createClient } from '@supabase/supabase-js';

const BILLS_BUCKET = 'bill-images';

interface StorageEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

/**
 * Upload a bill image to Supabase Storage and return the public URL.
 */
export async function uploadBillImage(
  env: StorageEnv,
  merchantId: string,
  fileName: string,
  fileData: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const filePath = `${merchantId}/${Date.now()}_${fileName}`;

  const { error } = await supabase.storage
    .from(BILLS_BUCKET)
    .upload(filePath, fileData, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Generate a signed URL valid for 24 hours
  const { data: signedData, error: signError } = await supabase.storage
    .from(BILLS_BUCKET)
    .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours

  if (signError || !signedData) {
    throw new Error(`Failed to create signed URL: ${signError?.message}`);
  }

  return signedData.signedUrl;
}

/**
 * Get a signed download URL for an existing bill image.
 */
export async function getSignedUrl(
  env: StorageEnv,
  imagePath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabase.storage
    .from(BILLS_BUCKET)
    .createSignedUrl(imagePath, expiresInSeconds);

  if (error || !data) {
    throw new Error(`Failed to create signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}

