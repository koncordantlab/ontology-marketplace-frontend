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
    COUNTS: '/ontology_counts',
    GET_BY_ID: (_id: string) => `/ontologies/${_id}`,
    CREATE: '/add_ontologies',
    UPDATE: (_id: string) => `/update_ontology/${_id}`,
    DELETE: (_id: string) => `/delete_ontologies`,
    RESTORE: '/restore_ontologies',
    PURGE: '/purge_ontologies',
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

  // OMRank recommendation endpoint
  RECOMMEND: {
    SEARCH: '/recommend',
    DETAIL: (_acronym: string) => `/recommend/detail/${_acronym}`,
    SIMILAR: (_acronym: string) => `/recommend/similar/${_acronym}`,
  },
  
  // User endpoints
  USER: {
    GET: '/get_user',
    UPDATE: '/update_user',
  },

  // Comment endpoints
  COMMENTS: {
    LIST: (ontologyId: string) => `/ontologies/${ontologyId}/comments`,
    CREATE: (ontologyId: string) => `/ontologies/${ontologyId}/comments`,
    EDIT: (commentId: string) => `/comments/${commentId}`,
    DELETE: (commentId: string) => `/comments/${commentId}`,
    REPLIES: (commentId: string) => `/comments/${commentId}/replies`,
    REACTIONS: (commentId: string) => `/comments/${commentId}/reactions`,
    REMOVE_REACTION: (commentId: string, emoji: string) => `/comments/${commentId}/reactions/${emoji}`,
    REMOVE_REACTION_BY_ID: (commentId: string, reactionId: string) => `/comments/${commentId}/reactions/by-id/${reactionId}`,
    FLAG: (commentId: string) => `/comments/${commentId}/flag`,
  },

  // Activity feed endpoints
  ACTIVITY: {
    FEED: '/users/me/activity',
    UNREAD_COUNT: '/users/me/activity/unread-count',
    MARK_READ: (itemId: string) => `/users/me/activity/${itemId}/read`,
    MARK_ALL_READ: '/users/me/activity/read-all',
  },

  // Message endpoints
  MESSAGES: {
    LIST: '/messages',
    SEND: '/messages',
    GET: (messageId: string) => `/messages/${messageId}`,
    REPLY: (messageId: string) => `/messages/${messageId}/reply`,
    MARK_READ: (messageId: string) => `/messages/${messageId}/read`,
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
      let token: string | null = null;
      try {
        token = await this.getAuthToken();
      } catch (e) {
        // No authenticated user; proceed without Authorization header for public endpoints
        token = null;
      }
      
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
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
   * Get list of ontologies (search ontologies) with pagination.
   * Pass `searchTerm` to filter server-side via the /search_ontologies endpoint.
   */
  static async getOntologies(
    limit = 6,
    offset = 0,
    searchTerm?: string,
    filters?: { isPublic?: boolean; recentOnly?: boolean; deletedOnly?: boolean },
  ) {
    const params: Record<string, string> = { limit: String(limit), offset: String(offset) };
    if (searchTerm && searchTerm.trim()) params.search_term = searchTerm.trim();
    if (filters?.isPublic === true) params.is_public = 'true';
    else if (filters?.isPublic === false) params.is_public = 'false';
    if (filters?.recentOnly) params.recent_only = 'true';
    if (filters?.deletedOnly) params.deleted_only = 'true';
    return this.request(BACKEND_API.ONTOLOGIES.LIST, {
      method: 'GET',
      params,
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
    // Use PUT to update a single ontology by id with a flat payload
    return this.request(BACKEND_API.ONTOLOGIES.UPDATE(id), {
      method: 'PUT',
      body: { ...data, id },
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

  /** Restore a soft-deleted ontology. */
  static async restoreOntology(id: string) {
    return this.request(BACKEND_API.ONTOLOGIES.RESTORE, {
      method: 'POST',
      body: [id],
    });
  }

  /** Permanently delete a soft-deleted ontology (creator only, cascades). */
  static async purgeOntology(id: string) {
    return this.request(BACKEND_API.ONTOLOGIES.PURGE, {
      method: 'DELETE',
      body: [id],
    });
  }

  /**
   * Search ontologies with pagination
   */
  static async searchOntologies(query: string, limit = 6, offset = 0) {
    return this.request(BACKEND_API.ONTOLOGIES.SEARCH, {
      method: 'POST',
      body: { query },
      params: { limit: String(limit), offset: String(offset) },
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
   * Get ontology category counts (total, public, private, recent)
   */
  static async getOntologyCounts(): Promise<{ total: number; public: number; private: number; recent: number; deleted: number }> {
    return this.request(BACKEND_API.ONTOLOGIES.COUNTS, { method: 'GET' });
  }

  /**
   * Get list of available tags from backend
   */
  static async getTags(): Promise<string[]> {
    return this.request(BACKEND_API.TAGS.LIST, { method: 'GET' });
  }

  /**
   * OMRank keyword/semantic ontology recommendation for a query string.
   */
  static async recommend(
    query: string,
    mode: 'keyword' | 'semantic' = 'keyword',
    top = 20,
    platform: 'all' | 'bioportal' | 'proto-okn' = 'all',
  ): Promise<RecommendResponse> {
    return this.request(BACKEND_API.RECOMMEND.SEARCH, {
      method: 'GET',
      params: { q: query, mode, top: String(top), platform },
    });
  }

  /**
   * Full OMRank detail record for a single ontology, by acronym.
   */
  static async recommendDetail(acronym: string): Promise<RecommendDetailResponse> {
    return this.request(BACKEND_API.RECOMMEND.DETAIL(acronym), { method: 'GET' });
  }

  /**
   * Ontologies most similar to the given acronym (embedding + domain-tag overlap).
   */
  static async recommendSimilar(acronym: string, top = 20): Promise<RecommendSimilarResponse> {
    return this.request(BACKEND_API.RECOMMEND.SIMILAR(acronym), {
      method: 'GET',
      params: { top: String(top) },
    });
  }
}

/**
 * OMRank recommendation types
 */
export interface RecommendResult {
  rank: number;
  acronym: string;
  name: string;
  score: number;
  confidence: number;
  tier: 'Gold' | 'Silver' | 'Bronze' | 'Candidate' | 'EvidencePending';
  relevance: number;
  semantic: number;
  structural: number;
  fair: number;
  interop: number;
  adoption: number;
  governance: number;
  maintenance: number;
  intl: number;
  class_count: number;
  data_source: 'owl+metadata' | 'metadata_only' | 'no_file';
  source_label: string;
}

export interface RecommendResponse {
  success: boolean;
  message: string;
  data: {
    results: RecommendResult[];
    query: string;
    mode: 'keyword' | 'semantic';
    semantic_available: boolean;
  } | null;
}

export interface RecommendDimension {
  name: string;
  key: string;
  score: number | null;
  conf: number | null;
  weight: number;
  desc: string;
}

export interface RecommendDetail {
  acronym: string;
  name: string;
  description: string;
  homepage: string | null;
  uri: string | null;
  tags: string[];
  release_date: string;
  version_iri: string | null;
  owl_format: string | null;
  download_url: string | null;
  download_status: string | null;
  parse_status: string | null;
  class_count: number;
  property_count: number;
  individual_count: number;
  axiom_count: number;
  max_depth: number;
  avg_depth: number;
  has_label_count: number;
  has_definition_count: number;
  has_synonym_count: number;
  owl_profile: string | null;
  language_tags: string[];
  external_ns_count: number;
  import_count: number;
  omrank_score: number | null;
  confidence: number | null;
  tier: 'Gold' | 'Silver' | 'Bronze' | 'Candidate' | 'EvidencePending';
  data_source: 'owl+metadata' | 'metadata_only' | 'no_file';
  source_label: string;
  dims: RecommendDimension[];
}

export interface RecommendDetailResponse {
  success: boolean;
  message: string;
  data: RecommendDetail | null;
}

export interface RecommendSimilarResult {
  acronym: string;
  name: string;
  description: string;
  data_source: 'owl+metadata' | 'metadata_only' | 'no_file';
  source_label: string;
  omrank_score: number | null;
  tier: 'Gold' | 'Silver' | 'Bronze' | 'Candidate' | 'EvidencePending' | null;
  similarity: number;
}

export interface RecommendSimilarResponse {
  success: boolean;
  message: string;
  data: {
    acronym: string;
    results: RecommendSimilarResult[];
  } | null;
}

