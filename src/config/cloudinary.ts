// Cloudinary configuration for frontend widget
// Note: This app uses unsigned uploads with upload presets
// Only cloud name is needed - no API keys required in frontend
// This is the most secure approach for frontend uploads
export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME, // fallback for dev
  uploadPreset: 'ontologymarketplace', // unsigned upload preset
};

export const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
export const cloudinaryApiUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}`;

export const uploadPresetConfig = {
  defaultImagePreset: 'ontologymarketplace',
  defaultVideoPreset: 'ontologymarketplace',
  defaultRawPreset: 'ontologymarketplace',
  
  // Preset settings for different use cases
  presets: {
    profileImages: {
      name: 'profile_images',
      settings: {
        folder: 'profile-images',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: {
          width: 400,
          height: 400,
          crop: 'fill',
          gravity: 'face'
        },
        use_filename: true,
        unique_filename: true
      }
    },
    thumbnails: {
      name: 'thumbnails',
      settings: {
        folder: 'thumbnails',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: {
          width: 300,
          height: 200,
          crop: 'fill'
        },
        use_filename: true,
        unique_filename: true
      }
    },
    ontologyThumbnails: {
      name: 'ontology_thumbnails',
      settings: {
        folder: 'ontology-thumbnails',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: {
          width: 400,
          height: 300,
          crop: 'fill'
        },
        use_filename: true,
        unique_filename: true
      }
    },
    documents: {
      name: 'documents',
      settings: {
        folder: 'documents',
        allowed_formats: ['pdf', 'doc', 'docx', 'txt'],
        resource_type: 'raw'
      }
    }
  }
};
