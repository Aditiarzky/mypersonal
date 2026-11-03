const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();

export interface CloudinaryImage {
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface UploadImageOptions {
  folder?: string;
  signal?: AbortSignal;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  error?: { message?: string };
}

/** Upload an image using a Cloudinary unsigned upload preset. */
export async function uploadImageToCloudinary(
  file: File,
  options: UploadImageOptions = {}
): Promise<CloudinaryImage> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary belum dikonfigurasi. Isi VITE_CLOUDINARY_CLOUD_NAME dan VITE_CLOUDINARY_UPLOAD_PRESET.'
    );
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  if (options.folder?.trim()) formData.append('folder', options.folder.trim());

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUD_NAME)}/image/upload`,
    { method: 'POST', body: formData, signal: options.signal }
  );

  const result = (await response.json()) as CloudinaryUploadResponse;
  if (!response.ok) {
    throw new Error(result.error?.message || `Upload Cloudinary gagal (${response.status}).`);
  }

  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes
  };
}
