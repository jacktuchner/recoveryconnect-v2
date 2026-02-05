import { supabase } from "./supabase";

const BUCKET_NAME = "recordings";

export interface PresignedUrlResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export async function generatePresignedUploadUrl(
  filename: string,
  contentType: string,
  userId: string
): Promise<PresignedUrlResult> {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `${userId}/${timestamp}-${sanitizedFilename}`;

  // Generate a signed upload URL using Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(key);

  if (error || !data) {
    throw new Error(error?.message || "Failed to create upload URL");
  }

  // Get the public URL for the file
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(key);

  return {
    uploadUrl: data.signedUrl,
    fileUrl: publicUrlData.publicUrl,
    key,
  };
}

export async function generatePresignedDownloadUrl(key: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(key, 3600);

  if (error || !data) {
    throw new Error(error?.message || "Failed to create download URL");
  }

  return data.signedUrl;
}

export { BUCKET_NAME };
