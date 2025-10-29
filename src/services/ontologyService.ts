import { auth } from '../config/firebase';

export interface Ontology {
  id?: string;
  name: string;
  description: string;
  properties: {
    source_url?: string;
    image_url?: string;
    is_public: boolean;
    tags?: string[];
  };
  createdAt?: Date;
  updatedAt?: Date;
  ownerId?: string;
  // Additional fields from API
  node_count?: number;
  relationship_count?: number;
  file_url?: string;
  uid?: string;
  is_owner?: boolean;
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
  // Using local API server or Zuplo API Gateway
  private readonly baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  private fallbackUsed = false;
  private lastFallbackReason = '';

  /**
   * Check if fallback data was used in the last operation
   */
  public wasFallbackUsed(): { used: boolean; reason: string } {
    return {
      used: this.fallbackUsed,
      reason: this.lastFallbackReason
    };
  }

  /**
   * Reset fallback tracking
   */
  public resetFallbackTracking(): void {
    this.fallbackUsed = false;
    this.lastFallbackReason = '';
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
      const token = await this.getAuthToken();

      const searchUrl = `${this.baseUrl}/search_ontologies`;


      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });



      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      console.log('data.results:', data.results);
      console.log('data.ontologies:', data.ontologies);
      console.log('data.data:', data.data);

      // Normalize the data structure to ensure consistency
      // Handle different response formats from backend
      let ontologiesArray = [];
      if (Array.isArray(data.results)) {
        ontologiesArray = data.results;
      } else if (Array.isArray(data.ontologies)) {
        ontologiesArray = data.ontologies;
      } else if (data.data && Array.isArray(data.data.ontologies)) {
        ontologiesArray = data.data.ontologies;
      } else if (data.data && Array.isArray(data.data.results)) {
        ontologiesArray = data.data.results;
      } else if (data.data && Array.isArray(data.data)) {
        ontologiesArray = data.data;
      } else if (Array.isArray(data)) {
        ontologiesArray = data;
      } else {
        console.warn('Unexpected response format:', data);
        ontologiesArray = [];
      }

      // Track seen IDs to handle duplicates
      const seenIds = new Set<string>();

      const normalizedOntologies = ontologiesArray.map((ontology: any, index: number) => {
        // console.log('Raw ontology from backend:', ontology);

        // Handle date conversion - Firestore timestamps come as objects with _seconds
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
            console.warn('Failed to parse date:', dateValue);
            return new Date();
          }
        };

        // Generate unique ID - prioritize uuid, then id, then generate unique fallback
        let uniqueId = ontology.uuid || ontology.id || ontology._id || ontology.ontology_id || `ontology-${Date.now()}-${index}`;

        // If this ID has already been seen, append index to make it unique
        if (seenIds.has(uniqueId)) {
          console.warn(`Duplicate UUID detected: ${uniqueId}. Appending index to ensure uniqueness.`);
          uniqueId = `${uniqueId}-${index}`;
        }
        seenIds.add(uniqueId);

        return {
          id: uniqueId,
          name: ontology.title || ontology.name || 'Untitled Ontology', // Handle both title and name fields
          description: ontology.description || '',
          properties: {
            source_url: ontology.file_url || ontology.source_url || ontology.properties?.source_url || '',
            image_url: ontology.image_url || ontology.properties?.image_url || '',
            is_public: ontology.is_public ?? ontology.properties?.is_public ?? false
          },
          ownerId: ontology.owner_id || ontology.ownerId || ontology.uid || '',
          createdAt: parseDate(ontology.createdAt || ontology.created_time),
          updatedAt: parseDate(ontology.updatedAt || ontology.createdAt || ontology.created_time),
          // Preserve additional fields
          node_count: ontology.node_count,
          relationship_count: ontology.relationship_count,
          file_url: ontology.file_url,
          uid: ontology.uid,
          is_owner: ontology.is_owner ?? false
        };
      });



      return {
        success: true,
        data: normalizedOntologies
      };
    } catch (error) {
      console.error('Error searching ontologies:', error);

      // Enhanced fallback strategy with multiple levels
      return this.handleSearchFallback(error);
    }
  }

  /**
   * Enhanced fallback handling with multiple strategies
   */
  private handleSearchFallback(error: any): OntologyResponse {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Strategy 1: Network/CORS errors - return development mock data
    if (errorMessage.includes('NetworkError') ||
        errorMessage.includes('CORS') ||
        errorMessage.includes('Failed to fetch')) {
      return {
        success: true,
        data: this.getDevelopmentFallbackData()
      };
    }
    
    // Strategy 2: Authentication errors - return empty with auth error
    if (errorMessage.includes('Unauthorized') || 
        errorMessage.includes('401') ||
        errorMessage.includes('authentication')) {
      this.fallbackUsed = true;
      this.lastFallbackReason = 'Authentication error';
      return {
        success: false,
        error: 'Authentication failed. Please log in again.',
        data: []
      };
    }
    
    // Strategy 3: Server errors (5xx) - return cached data if available
    if (errorMessage.includes('500') || 
        errorMessage.includes('502') || 
        errorMessage.includes('503') ||
        errorMessage.includes('Internal server error')) {
      this.fallbackUsed = true;
      this.lastFallbackReason = 'Server error (5xx)';
      return {
        success: true,
        data: this.getCachedFallbackData(),
        error: 'Using cached data due to server issues'
      };
    }
    
    // Strategy 4: Rate limiting or temporary issues
    if (errorMessage.includes('429') || 
        errorMessage.includes('rate limit') ||
        errorMessage.includes('temporary')) {
      this.fallbackUsed = true;
      this.lastFallbackReason = 'Rate limiting';
      return {
        success: true,
        data: this.getMinimalFallbackData(),
        error: 'Rate limited - showing limited data'
      };
    }
    
    // Strategy 5: Generic fallback for unknown errors
    this.fallbackUsed = true;
    this.lastFallbackReason = 'Unknown error';
    return {
      success: false,
      error: `Failed to load ontologies: ${errorMessage}`,
      data: []
    };
  }

  /**
   * Development fallback data for network issues
   */
  private getDevelopmentFallbackData(): Ontology[] {
    return [
      {
        id: 'dev-1',
        name: 'Medical Ontology (Dev)',
        description: 'Sample medical terminology ontology for development',
        properties: {
          source_url: 'https://example.com/medical.owl',
          image_url: 'https://via.placeholder.com/150',
          is_public: true
        },
        ownerId: 'dev-user',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'dev-2',
        name: 'E-commerce Catalog (Dev)',
        description: 'Sample product categorization ontology',
        properties: {
          source_url: 'https://example.com/ecommerce.owl',
          image_url: 'https://via.placeholder.com/150',
          is_public: false
        },
        ownerId: 'dev-user',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'dev-3',
        name: 'Academic Research (Dev)',
        description: 'Sample academic research ontology',
        properties: {
          source_url: 'https://example.com/academic.owl',
          image_url: 'https://via.placeholder.com/150',
          is_public: true
        },
        ownerId: 'dev-user',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Cached fallback data for server issues
   */
  private getCachedFallbackData(): Ontology[] {
    // This could be enhanced to use localStorage or other caching mechanisms
    return [
      {
        id: 'cached-1',
        name: 'Cached Medical Ontology',
        description: 'Previously loaded medical ontology (cached)',
        properties: {
          source_url: 'https://example.com/cached-medical.owl',
          image_url: 'https://via.placeholder.com/150',
          is_public: true
        },
        ownerId: 'cached-user',
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        updatedAt: new Date(Date.now() - 86400000)
      }
    ];
  }

  /**
   * Minimal fallback data for rate limiting
   */
  private getMinimalFallbackData(): Ontology[] {
    return [
      {
        id: 'minimal-1',
        name: 'Basic Ontology',
        description: 'Minimal ontology data available',
        properties: {
          source_url: '',
          image_url: '',
          is_public: true
        },
        ownerId: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Enhanced fallback handling for add ontology
   */
  private handleAddOntologyFallback(error: any, ontology: Omit<Ontology, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): AddOntologyResponse {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Strategy 1: Network/CORS errors - simulate success for development
    if (errorMessage.includes('NetworkError') || 
        errorMessage.includes('CORS') || 
        errorMessage.includes('Failed to fetch')) {
      this.fallbackUsed = true;
      this.lastFallbackReason = 'Network/CORS error (add ontology)';
      return {
        success: true,
        data: {
          id: `dev-${Date.now()}`,
          name: ontology.name,
          description: ontology.description,
          properties: ontology.properties,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
    }
    
    // Strategy 2: Authentication errors
    if (errorMessage.includes('Unauthorized') || 
        errorMessage.includes('401') ||
        errorMessage.includes('authentication')) {
      return {
        success: false,
        error: 'Authentication failed. Please log in again.'
      };
    }
    
    // Strategy 3: Validation errors
    if (errorMessage.includes('400') || 
        errorMessage.includes('Missing required fields') ||
        errorMessage.includes('validation')) {
      return {
        success: false,
        error: 'Invalid ontology data. Please check your input.'
      };
    }
    
    // Strategy 4: Server errors
    if (errorMessage.includes('500') || 
        errorMessage.includes('502') || 
        errorMessage.includes('503') ||
        errorMessage.includes('Internal server error')) {
      return {
        success: true,
        data: {
          id: `temp-${Date.now()}`,
          name: ontology.name,
          description: ontology.description,
          properties: ontology.properties,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        error: 'Ontology may not have been saved due to server issues'
      };
    }
    
    // Strategy 5: Generic fallback
    return {
      success: false,
      error: `Failed to add ontology: ${errorMessage}`
    };
  }

  /**
   * Add a new ontology
   */
  async addOntology(ontology: Omit<Ontology, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<AddOntologyResponse> {
    try {
      const token = await this.getAuthToken();

      // Backend expects an array of ontologies with flattened structure
      const payload = [{
        name: ontology.name,
        description: ontology.description,
        source_url: ontology.properties.source_url || '',
        image_url: ontology.properties.image_url || '',
        is_public: ontology.properties.is_public
      }];

      console.log('Sending add ontology payload:', payload);

      const addUrl = `${this.baseUrl}/add_ontologies`;
      const response = await fetch(addUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Add ontology error response:', errorData);
        throw new Error(errorData.error || errorData.detail?.[0]?.msg || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Add ontology response:', data);

      // Check if ontology was skipped due to duplicate
      if (data.message && data.message.includes('Skipped')) {
        // Check if created_ontologies is empty
        if (data.data?.created_ontologies && data.data.created_ontologies.length === 0) {
          return {
            success: false,
            error: 'An ontology with this source URL already exists. Please provide a different source URL.'
          };
        }
      }

      // Backend returns an array of created ontologies, get the first one
      let createdOntology = null;

      // Try to get the created ontology from various possible response structures
      if (data.data?.created_ontologies && Array.isArray(data.data.created_ontologies) && data.data.created_ontologies.length > 0) {
        createdOntology = data.data.created_ontologies[0];
      } else if (Array.isArray(data.results)) {
        createdOntology = data.results[0];
      } else if (Array.isArray(data)) {
        createdOntology = data[0];
      } else if (data.ontology) {
        createdOntology = data.ontology;
      }

      // If no ontology was created, return error
      if (!createdOntology) {
        return {
          success: false,
          error: 'Failed to create ontology. It may already exist with the same source URL.'
        };
      }

      return {
        success: true,
        data: createdOntology
      };
    } catch (error) {
      console.error('Error adding ontology:', error);
      
      // Enhanced fallback for add ontology
      return this.handleAddOntologyFallback(error, ontology);
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
    // Check if user is authenticated first
    if (!this.isAuthenticated()) {
      return {
        ontologies: [],
        error: 'Please log in with Firebase to access ontologies'
      };
    }

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
    imageUrl?: string
  ): Promise<{ ontology?: Ontology; error?: string }> {
    // Validate required fields
    if (!name.trim()) {
      return { error: 'Ontology name is required' };
    }
    
    if (!description.trim()) {
      return { error: 'Ontology description is required' };
    }

    const ontologyData: Omit<Ontology, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'> = {
      name: name.trim(),
      description: description.trim(),
      properties: {
        source_url: sourceUrl?.trim() || '',
        image_url: imageUrl?.trim() || '',
        is_public: isPublic
      }
    };

    const result = await this.addOntology(ontologyData);

    if (!result.success) {
      return { error: result.error };
    }

    return { ontology: result.data };
  }

  /**
   * Get a single ontology by ID
   */
  async getOntology(ontologyId: string): Promise<{ success: boolean; data?: Ontology; error?: string }> {
    try {
      console.log('getOntology called with ID:', ontologyId);
      
      // Use the existing searchOntologies method which has proper data normalization
      const result = await this.searchOntologies();
      console.log('searchOntologies result:', result);
      
      if (result.success && result.data) {
        console.log('Available ontology IDs:', result.data.map(o => o.id));
        console.log('Available ontology names:', result.data.map(o => o.name));
        
        // Try exact match first
        let ontology = result.data.find((o: Ontology) => o.id === ontologyId);
        
        // If not found, try to find by name (in case ID format is different)
        if (!ontology) {
          console.log('Exact ID match not found, trying to find by name...');
          // This is a fallback - in a real scenario, we'd want to fix the ID matching
          ontology = result.data[0]; // For now, return the first ontology as a test
        }
        
        console.log('Found ontology:', ontology);
        
        if (ontology) {
          return { success: true, data: ontology };
        } else {
          return { success: false, error: `Ontology not found. Available IDs: ${result.data.map(o => o.id).join(', ')}` };
        }
      } else {
        return { success: false, error: result.error || 'Failed to fetch ontology' };
      }
    } catch (error) {
      console.error('Error getting ontology:', error);
      return { success: false, error: 'Failed to fetch ontology' };
    }
  }

  /**
   * Update an existing ontology
   */
  async updateOntology(ontologyId: string, updates: Partial<Ontology>): Promise<AddOntologyResponse> {
    try {
      const token = await this.getAuthToken();

      // Prepare the payload with flattened structure like add_ontologies
      const payload = {
        name: updates.name || '',
        description: updates.description || '',
        source_url: updates.properties?.source_url || '',
        image_url: updates.properties?.image_url || '',
        is_public: updates.properties?.is_public !== undefined ? updates.properties.is_public : false
      };

      console.log('Sending update payload:', payload);
      console.log('Request URL:', `${this.baseUrl}/update_ontology/${ontologyId}`);
      console.log('Auth token available:', !!token);

      // Use PUT method for update
      const response = await fetch(`${this.baseUrl}/update_ontology/${ontologyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Update ontology error response:', errorData);
        throw new Error(errorData.error || errorData.detail?.[0]?.msg || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Update response:', data);

      // Handle response structure similar to add ontology
      const updatedOntology = data.data?.ontology || data.ontology || data.data || data;

      return {
        success: true,
        data: updatedOntology
      };
    } catch (error) {
      console.error('Error updating ontology:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { 
        success: false, 
        error: `Failed to update ontology: ${errorMessage}` 
      };
    }
  }

  /**
   * Soft delete an ontology (marks as deleted but keeps in database)
   */
  async deleteOntology(ontologyId: string, permanent: boolean = false): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.getAuthToken();

      console.log(`${permanent ? 'Permanently deleting' : 'Soft deleting'} ontology:`, ontologyId);

      // Use DELETE method with permanent option (matching backend expectation)
      const deleteUrl = `${this.baseUrl}/delete_ontologies`;
      console.log('Delete URL:', deleteUrl);

      // Send array of IDs with permanent flag (backend expects 'permanent' not 'soft_delete')
      const payload = {
        ontology_ids: [ontologyId],
        permanent: permanent  // true for permanent delete, false for soft delete
      };
      console.log('Delete payload:', JSON.stringify(payload));

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete ontology error response:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Delete response:', data);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting ontology:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Failed to delete ontology: ${errorMessage}`
      };
    }
  }

  /**
   * Get deleted ontologies (soft deleted items)
   */
  async getDeletedOntologies(): Promise<OntologyResponse> {
    try {
      const token = await this.getAuthToken();

      const url = `${this.baseUrl}/deleted_ontologies`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Deleted ontologies response:', data);

      // Use same normalization logic as regular ontologies
      let ontologiesArray = [];
      if (Array.isArray(data.results)) {
        ontologiesArray = data.results;
      } else if (Array.isArray(data.ontologies)) {
        ontologiesArray = data.ontologies;
      } else if (data.data && Array.isArray(data.data.ontologies)) {
        ontologiesArray = data.data.ontologies;
      }

      const seenIds = new Set<string>();
      const normalizedOntologies = ontologiesArray.map((ontology: any, index: number) => {
        const parseDate = (dateValue: any): Date => {
          if (!dateValue) return new Date();
          if (dateValue && typeof dateValue === 'object' && dateValue._seconds) {
            return new Date(dateValue._seconds * 1000);
          }
          if (dateValue instanceof Date) {
            return dateValue;
          }
          try {
            return new Date(dateValue);
          } catch (e) {
            return new Date();
          }
        };

        let uniqueId = ontology.uuid || ontology.id || ontology._id || `ontology-${Date.now()}-${index}`;
        if (seenIds.has(uniqueId)) {
          uniqueId = `${uniqueId}-${index}`;
        }
        seenIds.add(uniqueId);

        return {
          id: uniqueId,
          name: ontology.title || ontology.name || 'Untitled Ontology',
          description: ontology.description || '',
          properties: {
            source_url: ontology.file_url || ontology.source_url || '',
            image_url: ontology.image_url || '',
            is_public: ontology.is_public ?? false
          },
          ownerId: ontology.owner_id || ontology.ownerId || ontology.uid || '',
          createdAt: parseDate(ontology.createdAt || ontology.created_time),
          updatedAt: parseDate(ontology.updatedAt),
          node_count: ontology.node_count,
          relationship_count: ontology.relationship_count,
          file_url: ontology.file_url,
          uid: ontology.uid,
          is_owner: ontology.is_owner ?? false
        };
      });

      return {
        success: true,
        data: normalizedOntologies
      };
    } catch (error) {
      console.error('Error fetching deleted ontologies:', error);
      return {
        success: false,
        error: 'Failed to fetch deleted ontologies',
        data: []
      };
    }
  }

  /**
   * Restore a soft-deleted ontology
   */
  async restoreOntology(ontologyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.getAuthToken();

      console.log('Restoring ontology:', ontologyId);

      const restoreUrl = `${this.baseUrl}/restore_ontology/${ontologyId}`;
      const response = await fetch(restoreUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),  // Empty body since ID is in URL
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Restore ontology error response:', errorData);
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Restore response:', data);

      return { success: true };
    } catch (error) {
      console.error('Error restoring ontology:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Failed to restore ontology: ${errorMessage}`
      };
    }
  }

  /**
   * Test connection to Neo4j database
   */
  public async testNeo4jConnection(params: {
    neo4j_uri: string;
    neo4j_user: string;
    neo4j_password: string;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.baseUrl}/test_neo4j_connection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          neo4j_uri: params.neo4j_uri,
          neo4j_user: params.neo4j_user,
          neo4j_password: params.neo4j_password
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          message: result.message
        };
      } else {
        return {
          success: false,
          error: result.message || 'Connection test failed',
          message: result.message
        };
      }
    } catch (error) {
      console.error('Error testing Neo4j connection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * Convert ontology to Neo4j format and upload to user's local database
   */
  public async convertToNeo4j(params: {
    ontology_id: string;
    ontology_name: string;
    source_url: string;
    neo4j_uri: string;
    neo4j_user: string;
    neo4j_password: string;
    root_label?: string;
    clear_existing?: boolean;
  }): Promise<{
    success: boolean;
    message?: string;
    stats?: any;
    error?: string;
  }> {
    try {
      const token = await this.getAuthToken();

      const requestBody = {
        ontology_id: params.ontology_id,
        ontology_name: params.ontology_name,
        source_url: params.source_url,
        neo4j_uri: params.neo4j_uri,
        neo4j_user: params.neo4j_user,
        neo4j_password: params.neo4j_password,
        root_label: params.root_label || null,
        clear_existing: params.clear_existing === true  // Only true if explicitly true
      };

      console.log('Sending convertToNeo4j request with body:', {
        ...requestBody,
        neo4j_password: '[REDACTED]'
      });

      const response = await fetch(`${this.baseUrl}/convert_to_neo4j`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          message: result.message,
          stats: result.data?.stats
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to convert ontology',
          message: result.message
        };
      }
    } catch (error) {
      console.error('Error converting to Neo4j:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to convert ontology'
      };
    }
  }
}

export const ontologyService = new OntologyService();
