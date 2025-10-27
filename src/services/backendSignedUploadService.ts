import { cloudinaryUploadUrl } from '../config/cloudinary';
import { authService } from './authService';

export interface BackendSignedUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  publicId?: string;
}

export interface BackendSignedUploadOptions {
  preset?: string;
  folder?: string;
  tags?: string[];
}

export class BackendSignedUploadService {
  private async getSignature(params: Record<string, string>): Promise<{
    signature: string;
    timestamp: string;
    api_key: string;
  }> {
    try {
      const token = await authService.getAuthToken();
      
      // TODO: Update this to use the backend API when Cloudinary endpoint is available
      // For now, this is a placeholder that would need to be implemented on the backend
      throw new Error('Cloudinary signature generation needs to be implemented via backend API');
    } catch (error) {
      console.error('Error getting signature from backend:', error);
      throw error;
    }
  }


  async uploadFile(file: File, options: BackendSignedUploadOptions = {}): Promise<BackendSignedUploadResult> {
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
      
      // Use the specified preset or default
      const preset = options.preset || 'ontologymarketplace';
      formData.append('upload_preset', preset);
      
      // Prepare parameters for signature generation
      const params: Record<string, string> = {
        upload_preset: preset
      };
      
      if (options.folder) {
        params.folder = options.folder;
        formData.append('folder', options.folder);
      }
      
      if (options.tags && options.tags.length > 0) {
        params.tags = options.tags.join(',');
        formData.append('tags', options.tags.join(','));
      }

      // Get signature from backend
      const signatureData = await this.getSignature(params);
      
      // Add signature data to form
      formData.append('api_key', signatureData.api_key);
      formData.append('timestamp', signatureData.timestamp);
      formData.append('signature', signatureData.signature);



      const response = await fetch(cloudinaryUploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        return {
          success: false,
          error: `Upload failed: ${response.status} - ${errorText}`
        };
      }

      const result = await response.json();

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id
      };

    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }


  async uploadThumbnail(file: File): Promise<BackendSignedUploadResult> {
    return this.uploadFile(file, {
      preset: 'ontologymarketplace',
      folder: 'ontology-thumbnails',
      tags: ['thumbnail', 'ontology']
    });
  }


  async uploadProfileImage(file: File): Promise<BackendSignedUploadResult> {
    return this.uploadFile(file, {
      preset: 'ontologymarketplace',
      folder: 'profile-images',
      tags: ['profile', 'user']
    });
  }


  async uploadGeneralImage(file: File): Promise<BackendSignedUploadResult> {
    return this.uploadFile(file, {
      preset: 'ontologymarketplace',
      folder: 'general',
      tags: ['general']
    });
  }
}

export const backendSignedUploadService = new BackendSignedUploadService();
