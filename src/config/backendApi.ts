/**
 * Backend API Configuration
 * Configuration for the Zuplo API Gateway at https://ontology-marketplace-main-34028ed.d2.zuplo.dev
 */

export const BACKEND_API = {
  BASE_URL: (import.meta.env.VITE_BACKEND_BASE_URL as string),
  
  // Auth endpoints
  AUTH: {
    VERIFY_TOKEN: '/auth/verify-token',
  },
  
  // Ontology endpoints (matching Zuplo API Gateway)
  ONTOLOGIES: {
    LIST: '/search_ontologies',
    GET_BY_ID: (_id: string) => `/api/ontologies/${_id}`,
    CREATE: '/add_ontologies',
    UPDATE: '/update_ontologies',
    DELETE: (_id: string) => `/delete_ontologies`,
    SEARCH: '/search_ontologies',
  },
  
  // Upload/Processing endpoints
  UPLOAD: {
    FROM_URL: '/api/ontologies/upload-from-url',
    VALIDATE_URL: '/api/ontologies/validate-url',
    ONTOLOGY: '/upload_ontology',
  },

  // Tags endpoints
  TAGS: {
    LIST: '/get_tags',
  },
  
  // User endpoints
  USER: {
    GET: '/get_user',
    UPDATE: '/update_user',
  },
  
  // Database endpoints
  DATABASE: {
    UPLOAD_TO_NEO4J: (ontologyId: string) => `/api/ontologies/${ontologyId}/upload-to-neo4j`,
    EXPORT_FROM_NEO4J: '/api/neo4j/export',
  },
  
  // Neo4j query endpoints
  NEO4J: {
    CONNECT: '/api/neo4j/connect',
    DISCONNECT: '/api/neo4j/disconnect',
    QUERY: '/api/neo4j/query',
    GRAPH_DATA: '/api/neo4j/graph',
    DATABASE_INFO: '/api/neo4j/info',
  },
} as const;

/**
 * Backend API Client Helper
 * Provides a standardized way to call the FastAPI backend
 */
export class BackendApiClient {
  /**
   * Get a valid Firebase ID token, refreshing if needed
   */
  private static async getAuthToken(): Promise<string> {
    const { auth } = await import('./firebase');
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Get token result to check expiration
      const tokenResult = await user.getIdTokenResult();
      const expirationTime = new Date(tokenResult.expirationTime).getTime() / 1000;
      const now = Date.now() / 1000;
      
      // If token expires in less than 5 minutes, force refresh
      const shouldRefresh = expirationTime - now < 300;
      
      if (shouldRefresh) {
        console.log('Refreshing token before expiry');
        return await user.getIdToken(true); // Force refresh
      }
      
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw new Error('Authentication failed. Please try logging in again.');
    }
  }

  /**
   * Make an authenticated request to the backend API
   */
  static async request<T = any>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      body?: any;
      headers?: Record<string, string>;
      params?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, headers = {}, params } = options;
    
    try {
      const token = await this.getAuthToken();
      
      // Build URL with query parameters if any
      let url = `${BACKEND_API.BASE_URL}${endpoint}`;
      if (params) {
        const queryString = new URLSearchParams(params).toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...headers,
        },
        ...(body && { body: JSON.stringify(body) }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return {} as T;
    } catch (error) {
      console.error(`Backend API call failed (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Get list of ontologies (search ontologies)
   */
  static async getOntologies() {
    return this.request(BACKEND_API.ONTOLOGIES.LIST, {
      method: 'GET',
    });
  }

  /**
   * Get ontology by ID
   */
  static async getOntologyById(id: string) {
    return this.request(BACKEND_API.ONTOLOGIES.GET_BY_ID(id));
  }

  /**
   * Create new ontology
   */
  static async createOntology(data: any) {
    // The backend expects a list of payload objects for bulk creation
    const payloadArray = [data];
    return this.request(BACKEND_API.ONTOLOGIES.CREATE, {
      method: 'POST',
      body: payloadArray,
    });
  }

  /**
   * Update ontology
   */
  static async updateOntology(id: string, data: any) {
    // The backend expects a list of payload objects for bulk update
    const payloadArray = [{ ...data, id }];
    return this.request(BACKEND_API.ONTOLOGIES.UPDATE, {
      method: 'POST',
      body: payloadArray,
    });
  }

  /**
   * Delete ontology
   */
  static async deleteOntology(id: string) {
    // The backend expects a DELETE with a list of UUIDs in the body
    return this.request(BACKEND_API.ONTOLOGIES.DELETE(id), {
      method: 'DELETE',
      body: [id],
    });
  }

  /**
   * Search ontologies
   */
  static async searchOntologies(query: string) {
    return this.request(BACKEND_API.ONTOLOGIES.SEARCH, {
      method: 'POST',
      body: { query },
    });
  }

  /**
   * Upload ontology from URL
   */
  static async uploadFromUrl(url: string, metadata?: any) {
    return this.request(BACKEND_API.UPLOAD.FROM_URL, {
      method: 'POST',
      body: { url, ...metadata },
    });
  }

  /**
   * Upload ontology to backend service (proxy) which handles CORS/auth
   * Payload shape:
   * { uri, username, password, database, ttl_url }
   */
  static async uploadOntology(payload: any) {
    return this.request(BACKEND_API.UPLOAD.ONTOLOGY, {
      method: 'POST',
      body: payload,
    });
  }

  /**
   * Validate ontology URL
   */
  static async validateUrl(url: string) {
    return this.request(BACKEND_API.UPLOAD.VALIDATE_URL, {
      method: 'POST',
      body: { url },
    });
  }

  /**
   * Upload ontology to Neo4j
   */
  static async uploadToNeo4j(ontologyId: string, options?: any) {
    return this.request(BACKEND_API.DATABASE.UPLOAD_TO_NEO4J(ontologyId), {
      method: 'POST',
      body: options || {},
    });
  }

  /**
   * Connect to Neo4j
   */
  static async connectNeo4j(credentials: any) {
    return this.request(BACKEND_API.NEO4J.CONNECT, {
      method: 'POST',
      body: credentials,
    });
  }

  /**
   * Disconnect from Neo4j
   */
  static async disconnectNeo4j() {
    return this.request(BACKEND_API.NEO4J.DISCONNECT, {
      method: 'POST',
    });
  }

  /**
   * Execute Neo4j query
   */
  static async executeNeo4jQuery(query: string, params?: any) {
    return this.request(BACKEND_API.NEO4J.QUERY, {
      method: 'POST',
      body: { query, params: params || {} },
    });
  }

  /**
   * Get Neo4j graph data
   */
  static async getNeo4jGraphData(limit?: number) {
    return this.request(BACKEND_API.NEO4J.GRAPH_DATA, {
      method: 'GET',
      params: limit ? { limit: limit.toString() } : undefined,
    });
  }

  /**
   * Get Neo4j database info
   */
  static async getNeo4jDatabaseInfo() {
    return this.request(BACKEND_API.NEO4J.DATABASE_INFO);
  }

  /**
   * Get list of available tags from backend
   */
  static async getTags(): Promise<string[]> {
    return this.request(BACKEND_API.TAGS.LIST, { method: 'GET' });
  }
}

