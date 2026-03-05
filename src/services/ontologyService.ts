import { auth } from '../config/firebase';
import { BackendApiClient } from '../config/backendApi';

export interface Ontology {
  id?: string;
  name: string;
  description: string;
  properties: {
    source_url?: string;
    image_url?: string;
    is_public: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
  ownerId?: string;
  // Additional fields from API
  node_count?: number;
  relationship_count?: number;
  file_url?: string;
  uid?: string;
  fileUrls?: string[];
  score?: number | null;
  uuid?: string;
  tags?: string[];
}

export interface OntologyResponse {
  success: boolean;
  data?: Ontology[];
  error?: string;
}

export interface AddOntologyResponse {
  success: boolean;
  data?: Ontology;
  error?: string;
}

class OntologyService {
  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  

  /**
   * Get a user-friendly error message
   */
  private getUserFriendlyError(error: any): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('network') || message.includes('failed to fetch')) {
        return 'Unable to connect to the server. Please check your internet connection.';
      }
      
      if (message.includes('unauthorized') || message.includes('401')) {
        return 'Your session has expired. Please log in again.';
      }
      
      if (message.includes('forbidden') || message.includes('403')) {
        return 'You do not have permission to perform this action.';
      }
      
      if (message.includes('not found') || message.includes('404')) {
        return 'The requested resource was not found.';
      }
      
      if (message.includes('500') || message.includes('internal server error')) {
        return 'Server error. Please try again later.';
      }
      
      return 'An error occurred. Please try again.';
    }
    
    return 'An unexpected error occurred.';
  }

  /**
   * Get Firebase ID token for authentication
   */
  public async getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated. Please log in with Firebase to access the API.');
    }
    
    try {
      const token = await user.getIdToken();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw new Error('Authentication failed. Please try logging in again.');
    }
  }

  /**
   * Search for ontologies - returns all ontologies a user creates or public ontologies
   */
  async searchOntologies(): Promise<OntologyResponse> {
    try {
      const data = await BackendApiClient.getOntologies();
      
      // Handle different response structures
      let ontologiesArray: any[];
      if (Array.isArray(data)) {
        ontologiesArray = data;
      } else if (data && data.data && Array.isArray(data.data.results)) {
        // Backend returns: { success, message, data: { results: [...] } }
        ontologiesArray = data.data.results;
      } else if (data && Array.isArray(data.data)) {
        ontologiesArray = data.data;
      } else if (data && Array.isArray(data.ontologies)) {
        ontologiesArray = data.ontologies;
      } else {
        console.warn('Unexpected response structure:', data);
        ontologiesArray = [];
      }
      
      // Normalize the data structure to ensure consistency
      // Helper function to safely get nested property values
      const getValue = (obj: any, ...paths: string[]): any => {
        for (const path of paths) {
          const keys = path.split('.');
          let value = obj;
          for (const key of keys) {
            if (value === null || value === undefined) break;
            value = value[key];
          }
          if (value !== null && value !== undefined) return value;
        }
        return null;
      };

      // Helper function to parse dates from various formats
      const parseDate = (dateValue: any): Date => {
        if (!dateValue) return new Date();
        
        // If it's a Firestore timestamp object
        if (dateValue && typeof dateValue === 'object' && dateValue._seconds) {
          return new Date(dateValue._seconds * 1000);
        }
        
        // If it's already a Date object
        if (dateValue instanceof Date) {
          return dateValue;
        }
        
        // If it's a string or number, try to parse it
        try {
          return new Date(dateValue);
        } catch (e) {
          return new Date();
        }
      };

      const normalizedOntologies = ontologiesArray.map((ontology: any) => {
        // Get values with fallbacks for all possible field name variations
        const id = getValue(ontology, 'id', 'uuid', '_id') || '';
        const name = getValue(ontology, 'name', 'title') || 'Untitled Ontology';
        const description = getValue(ontology, 'description', 'desc', 'summary') || '';
        
        // Handle properties object or flat structure
        const sourceUrl = getValue(
          ontology, 
          'source_url', 
          'sourceUrl',
          'file_url', 
          'fileUrl',
          'url',
          'properties.source_url',
          'properties.sourceUrl'
        ) || '';
        
        const imageUrl = getValue(
          ontology,
          'image_url',
          'imageUrl',
          'thumbnail',
          'thumbnail_url',
          'thumbnailUrl',
          'properties.image_url',
          'properties.imageUrl'
        ) || '';
        
        const isPublic = getValue(
          ontology,
          'is_public',
          'isPublic',
          'public',
          'properties.is_public',
          'properties.isPublic'
        ) ?? false;
        
        const ownerId = getValue(ontology, 'ownerId', 'owner_id', 'uid', 'userId', 'user_id') || '';
        
        // Get created/updated dates from multiple possible fields
        const createdAt = parseDate(
          getValue(ontology, 'createdAt', 'created_at', 'created', 'dateCreated', 'created_time')
        );
        
        const updatedAt = parseDate(
          getValue(ontology, 'updatedAt', 'updated_at', 'modified', 'dateModified', 'updatedAt', 'modified_at')
        ) || createdAt;

        return {
          id,
          name,
          description,
          properties: {
            source_url: sourceUrl,
            image_url: imageUrl,
            is_public: isPublic
          },
          ownerId,
          createdAt,
          updatedAt,
          // Preserve all additional fields
          node_count: getValue(ontology, 'node_count', 'nodeCount'),
          relationship_count: getValue(ontology, 'relationship_count', 'relationshipCount'),
          file_url: getValue(ontology, 'file_url', 'fileUrl'),
          uid: getValue(ontology, 'uid'),
          score: getValue(ontology, 'score'),
          uuid: getValue(ontology, 'uuid'),
          tags: getValue(ontology, 'tags', 'properties.tags') || [],
          // Add any other fields that might exist
          ...(Object.keys(ontology).reduce((acc, key) => {
            if (!['id', 'name', 'title', 'description', 'properties', 'createdAt', 'created_at', 'updatedAt', 'updated_at'].includes(key)) {
              acc[key] = ontology[key];
            }
            return acc;
          }, {} as any))
        };
      });
      return {
        success: true,
        data: normalizedOntologies
      };
    } catch (error) {
      console.error('Error searching ontologies:', error);
      
      // Return proper error instead of fallback data
      return {
        success: false,
        error: this.getUserFriendlyError(error),
        data: []
      };
    }
  }

  /**
   * Add a new ontology
   */
  async addOntology(ontology: Omit<Ontology, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<AddOntologyResponse> {
    try {
      // Auth handled by BackendApiClient
      
      const payload = {
        name: ontology.name,
        description: ontology.description,
        tags: ontology.tags || [],
        source_url: ontology.properties.source_url || '',
        image_url: ontology.properties.image_url || '',
        is_public: ontology.properties.is_public,
      };



      const data = await BackendApiClient.createOntology(payload);

      // Normalize response: API may return various shapes
      // Expected: { success, data: { created_ontologies: [ { uuid, ... } ] } }
      let createdItem: any = null;
      const raw: any = data as any;

      // Check if backend indicated the ontology was skipped (already exists)
      if (raw?.data?.created_ontologies && Array.isArray(raw.data.created_ontologies) && raw.data.created_ontologies.length === 0) {
        // Ontology with same source_url already exists
        return {
          success: false,
          error: 'URL already exists'
        };
      }

      if (Array.isArray(raw)) {
        createdItem = raw[0];
      } else if (raw?.data?.created_ontologies && Array.isArray(raw.data.created_ontologies)) {
        createdItem = raw.data.created_ontologies[0];
      } else if (raw?.data && Array.isArray(raw.data)) {
        createdItem = raw.data[0];
      } else if (raw?.ontologies && Array.isArray(raw.ontologies)) {
        createdItem = raw.ontologies[0];
      } else if (raw?.ontology) {
        createdItem = raw.ontology;
      } else {
        createdItem = raw;
      }

      // Build a normalized Ontology object with id fallback to uuid
      const ontologyUuid = createdItem?.uuid || createdItem?.id || '';

      // If we still don't have a UUID, something went wrong
      if (!ontologyUuid) {
        console.error('No UUID returned from backend:', raw);
        return {
          success: false,
          error: 'Failed to create ontology - no ID returned from server'
        };
      }
      const normalized: Ontology = {
        id: ontologyUuid,
        name: createdItem?.name || ontology.name,
        description: createdItem?.description || ontology.description,
        properties: {
          source_url: createdItem?.source_url || createdItem?.properties?.source_url || (ontology.properties.source_url || ''),
          image_url: createdItem?.image_url || createdItem?.properties?.image_url || (ontology.properties.image_url || ''),
          is_public: typeof createdItem?.is_public === 'boolean' ? createdItem.is_public : ontology.properties.is_public,
        },
        createdAt: createdItem?.createdAt ? new Date(createdItem.createdAt) : new Date(),
        updatedAt: createdItem?.updatedAt ? new Date(createdItem.updatedAt) : new Date(),
        tags: createdItem?.tags || ontology.tags || [],
        uuid: ontologyUuid,
      } as Ontology & { uuid: string };

      return {
        success: true,
        data: normalized
      };
    } catch (error) {
      console.error('Error adding ontology:', error);
      
      // Return proper error instead of fallback
      return {
        success: false,
        error: this.getUserFriendlyError(error)
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return auth.currentUser !== null;
  }

  /**
   * Get ontologies with loading state management
   */
  async getOntologies(): Promise<{ ontologies: Ontology[]; error?: string }> {
    const result = await this.searchOntologies();
    
    if (!result.success) {
      return {
        ontologies: [],
        error: result.error
      };
    }

    return {
      ontologies: result.data || []
    };
  }

  /**
   * Create a new ontology with validation
   */
  async createOntology(
    name: string, 
    description: string, 
    isPublic: boolean = false,
    sourceUrl?: string,
    imageUrl?: string,
    tags?: string[]
  ): Promise<{ ontology?: Ontology; error?: string }> {
    // Validate required fields
    if (!name || !name.trim()) {
      return { error: 'Ontology name is required' };
    }
    
    if (!description || !description.trim()) {
      return { error: 'Ontology description is required' };
    }

    // Validate name length
    if (name.trim().length > 255) {
      return { error: 'Ontology name must be 255 characters or less' };
    }

    // Validate description length
    if (description.trim().length > 10000) {
      return { error: 'Description must be 10,000 characters or less' };
    }

    // Validate URLs if provided
    if (sourceUrl && !this.isValidUrl(sourceUrl)) {
      return { error: 'Invalid source URL format' };
    }

    if (imageUrl && !this.isValidUrl(imageUrl)) {
      return { error: 'Invalid image URL format' };
    }

    // Sanitize input
    const sanitizedName = name.trim().substring(0, 255);
    const sanitizedDescription = description.trim().substring(0, 10000);
    const sanitizedSourceUrl = sourceUrl ? sourceUrl.trim().substring(0, 2048) : '';
    const sanitizedImageUrl = imageUrl ? imageUrl.trim().substring(0, 2048) : '';

    const ontologyData: Omit<Ontology, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'> = {
      name: sanitizedName,
      description: sanitizedDescription,
      properties: {
        source_url: sanitizedSourceUrl,
        image_url: sanitizedImageUrl,
        is_public: isPublic
      },
      tags: Array.isArray(tags) ? tags : []
    };

    const result = await this.addOntology(ontologyData);
    
    if (!result.success) {
      return { error: result.error };
    }

    return { ontology: result.data };
  }

  /**
   * Normalize a single ontology object from the API response.
   */
  private normalizeOntology(ontology: any): Ontology {
    const getValue = (obj: any, ...paths: string[]): any => {
      for (const path of paths) {
        const keys = path.split('.');
        let value = obj;
        for (const key of keys) {
          if (value === null || value === undefined) break;
          value = value[key];
        }
        if (value !== null && value !== undefined) return value;
      }
      return null;
    };

    const parseDate = (dateValue: any): Date => {
      if (!dateValue) return new Date();
      if (dateValue && typeof dateValue === 'object' && dateValue._seconds) {
        return new Date(dateValue._seconds * 1000);
      }
      if (dateValue instanceof Date) return dateValue;
      try { return new Date(dateValue); } catch { return new Date(); }
    };

    const id = getValue(ontology, 'id', 'uuid', '_id') || '';
    const name = getValue(ontology, 'name', 'title') || 'Untitled Ontology';
    const description = getValue(ontology, 'description', 'desc', 'summary') || '';
    const sourceUrl = getValue(ontology, 'source_url', 'sourceUrl', 'file_url', 'fileUrl', 'url', 'properties.source_url') || '';
    const imageUrl = getValue(ontology, 'image_url', 'imageUrl', 'thumbnail', 'thumbnail_url', 'properties.image_url') || '';
    const isPublic = getValue(ontology, 'is_public', 'isPublic', 'public', 'properties.is_public') ?? false;
    const ownerId = getValue(ontology, 'ownerId', 'owner_id', 'uid', 'userId') || '';
    const createdAt = parseDate(getValue(ontology, 'createdAt', 'created_at', 'created', 'dateCreated'));
    const updatedAt = parseDate(getValue(ontology, 'updatedAt', 'updated_at', 'modified', 'dateModified')) || createdAt;

    return {
      id,
      name,
      description,
      properties: { source_url: sourceUrl, image_url: imageUrl, is_public: isPublic },
      ownerId,
      createdAt,
      updatedAt,
      node_count: getValue(ontology, 'node_count', 'nodeCount'),
      relationship_count: getValue(ontology, 'relationship_count', 'relationshipCount'),
      file_url: getValue(ontology, 'file_url', 'fileUrl'),
      uid: getValue(ontology, 'uid'),
      score: getValue(ontology, 'score'),
      uuid: getValue(ontology, 'uuid'),
      tags: getValue(ontology, 'tags', 'properties.tags') || [],
    };
  }

  /**
   * Get a single ontology by ID using the dedicated endpoint
   */
  async getOntology(ontologyId: string): Promise<{ success: boolean; data?: Ontology; error?: string }> {
    try {
      const data = await BackendApiClient.getOntologyById(ontologyId);
      const raw: any = data;

      if (raw?.success === false) {
        return { success: false, error: raw.message || 'Ontology not found' };
      }

      // The backend returns { success, message, data: { uuid, name, ... } }
      const ontologyData = raw?.data || raw;
      if (!ontologyData) {
        return { success: false, error: 'Ontology not found' };
      }

      const normalized = this.normalizeOntology(ontologyData);
      return { success: true, data: normalized };
    } catch (error) {
      console.error('Error getting ontology:', error);
      return { success: false, error: this.getUserFriendlyError(error) };
    }
  }

  /**
   * Update an existing ontology
   */
  async updateOntology(ontologyId: string, updates: any): Promise<AddOntologyResponse> {
    try {
      const data = await BackendApiClient.updateOntology(ontologyId, updates);
      return { success: true, data };
    } catch (error) {
      console.error('Error updating ontology:', error);
      const message = error instanceof Error ? error.message : 'Failed to update ontology';
      return { success: false, error: message };
    }
  }

  /**
   * Delete an ontology
   */
  async deleteOntology(ontologyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await BackendApiClient.deleteOntology(ontologyId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting ontology:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete ontology';
      return { success: false, error: message };
    }
  }
}

export const ontologyService = new OntologyService();
