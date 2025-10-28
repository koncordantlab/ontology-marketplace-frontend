import { cloudinaryConfig, cloudinaryUploadUrl, cloudinaryApiUrl, uploadPresetConfig } from '../config/cloudinary';



export interface CloudinaryUploadResponse {
  success: boolean;
  url?: string;
  error?: string;
  publicId?: string;
  assetId?: string;
}

export interface CloudinaryUploadOptions {
  preset?: string;
  folder?: string;
  transformation?: any;
  tags?: string[];
  context?: Record<string, string>;
}

class CloudinaryService {
  async uploadImage(file: File, options: CloudinaryUploadOptions = {}): Promise<CloudinaryUploadResponse> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          error: 'File must be an image'
        };
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return {
          success: false,
          error: 'File size must be less than 5MB'
        };
      }

      const formData = new FormData();
      formData.append('file', file);
      
      // Use upload preset for unsigned uploads (no API key needed)
      const preset = options.preset || uploadPresetConfig.defaultImagePreset;
      formData.append('upload_preset', preset);
      
      // For unsigned uploads, we don't include API key or signature
      // The upload_preset handles the authentication
      
      // Add additional options
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      
      if (options.tags && options.tags.length > 0) {
        formData.append('tags', options.tags.join(','));
      }
      
      if (options.context) {
        Object.entries(options.context).forEach(([key, value]) => {
          formData.append(`context[${key}]`, value);
        });
      }



      const response = await fetch(cloudinaryUploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary upload error:', response.status, errorText);
        return {
          success: false,
          error: `Upload failed: ${response.status} - ${errorText}`
        };
      }

      const data = await response.json();

      return {
        success: true,
        url: data.secure_url || data.url,
        publicId: data.public_id,
        assetId: data.asset_id
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }


  async uploadImageWithPreset(file: File, presetName: string): Promise<CloudinaryUploadResponse> {
    return this.uploadImage(file, { preset: presetName });
  }


  async uploadProfileImage(file: File): Promise<CloudinaryUploadResponse> {
    return this.uploadImage(file, { 
      preset: uploadPresetConfig.presets.profileImages.name,
      tags: ['profile', 'user']
    });
  }


  async uploadThumbnail(file: File): Promise<CloudinaryUploadResponse> {
    return this.uploadImage(file, { 
      preset: uploadPresetConfig.presets.ontologyThumbnails.name,
      folder: 'ontology-thumbnails',
      tags: ['thumbnail', 'ontology']
    });
  }


  async uploadDataUrl(dataUrl: string, filename: string = 'ontology-thumbnail'): Promise<CloudinaryUploadResponse> {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Create a file from the blob
      const file = new File([blob], `${filename}.png`, { type: 'image/png' });
      
      // Upload the file
      return await this.uploadImage(file);
    } catch (error) {
      console.error('Error uploading data URL to Cloudinary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }


  // Removed generateAndUploadThumbnail - requires html-to-image package
  // Uncomment and install html-to-image if needed:
  // async generateAndUploadThumbnail(elementRef: HTMLElement, filename: string = 'ontology-thumbnail'): Promise<CloudinaryUploadResponse> {
  //   const { toPng } = await import('html-to-image');
  //   const dataUrl = await toPng(elementRef, { quality: 0.8 });
  //   return await this.uploadDataUrl(dataUrl, filename);
  // }


  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = this.generateSignature(publicId, timestamp);

      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('api_key', cloudinaryConfig.apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);

      const response = await fetch(`${cloudinaryApiUrl}/image/destroy`, {
        method: 'POST',
        body: formData,
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      return false;
    }
  }


  private generateSignature(publicId: string, timestamp: number): string {
    // This is a simplified signature generation
    // In production, you should use a proper signature generation method
    const params = `public_id=${publicId}&timestamp=${timestamp}${cloudinaryConfig.apiSecret}`;
    return btoa(params); // This is simplified - use proper crypto in production
  }
}

export const cloudinaryService = new CloudinaryService();
