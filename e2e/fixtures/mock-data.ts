// Create a fake but structurally valid JWT (header.payload.signature)
// Firebase SDK validates JWT structure (3 dot-separated base64 sections)
const fakeJwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
const fakeJwtPayload = btoa(JSON.stringify({
  iss: 'https://securetoken.google.com/e2e-test',
  aud: 'e2e-test',
  auth_time: Math.floor(Date.now() / 1000),
  user_id: 'mock-uid-12345',
  sub: 'mock-uid-12345',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  email: 'test@example.com',
  email_verified: true,
  firebase: { identities: { email: ['test@example.com'] }, sign_in_provider: 'password' },
}));
const fakeJwtSignature = btoa('fake-signature-for-e2e-testing');
const MOCK_ID_TOKEN = `${fakeJwtHeader}.${fakeJwtPayload}.${fakeJwtSignature}`;

export const MOCK_USER = {
  localId: 'mock-uid-12345',
  email: 'test@example.com',
  displayName: 'Test User',
  idToken: MOCK_ID_TOKEN,
  refreshToken: 'mock-refresh-token-xyz',
  expiresIn: '3600',
};

export const MOCK_ONTOLOGIES = [
  {
    id: 'ont-1',
    uuid: 'ont-uuid-1',
    name: 'Medical Ontology',
    description: 'An ontology for medical terminology and relationships',
    properties: {
      source_url: 'https://example.com/medical.owl',
      image_url: '',
      is_public: true,
    },
    tags: ['Medical', 'Healthcare'],
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-03-01T14:30:00Z',
    ownerId: 'mock-uid-12345',
    node_count: 150,
    relationship_count: 200,
  },
  {
    id: 'ont-2',
    uuid: 'ont-uuid-2',
    name: 'E-commerce Product Ontology',
    description: 'Product classification and attribute ontology for e-commerce',
    properties: {
      source_url: '',
      image_url: '',
      is_public: false,
    },
    tags: ['E-commerce', 'Products'],
    createdAt: '2025-02-10T08:00:00Z',
    updatedAt: '2025-03-05T11:00:00Z',
    ownerId: 'mock-uid-12345',
    node_count: 80,
    relationship_count: 120,
  },
  {
    id: 'ont-3',
    uuid: 'ont-uuid-3',
    name: 'Academic Research Ontology',
    description: 'Ontology for organizing academic research papers and citations',
    properties: {
      source_url: 'https://example.com/academic.owl',
      image_url: '',
      is_public: true,
    },
    tags: ['Academic', 'Research'],
    createdAt: '2025-03-01T12:00:00Z',
    updatedAt: '2025-03-10T09:00:00Z',
    ownerId: 'mock-uid-12345',
    node_count: 300,
    relationship_count: 450,
  },
];

export const MOCK_TAGS = ['Medical', 'Healthcare', 'E-commerce', 'Products', 'Academic', 'Research'];

export const MOCK_ACTIVITY_ITEMS = [
  {
    id: 'activity-1',
    type: 'comment',
    created_at: '2025-03-10T15:00:00Z',
    content: 'Great ontology! Very useful for our project.',
    subject: null,
    ontology_name: 'Medical Ontology',
    ontology_id: 'ont-uuid-1',
    is_read: false,
  },
  {
    id: 'activity-2',
    type: 'reply',
    created_at: '2025-03-09T12:00:00Z',
    content: 'Thanks for the feedback!',
    subject: null,
    ontology_name: 'Medical Ontology',
    ontology_id: 'ont-uuid-1',
    is_read: true,
  },
  {
    id: 'activity-3',
    type: 'message',
    created_at: '2025-03-08T10:00:00Z',
    content: 'Welcome to the Ontology Marketplace!',
    subject: 'Welcome',
    ontology_name: null,
    ontology_id: null,
    is_read: false,
  },
];

export const MOCK_COMMENTS = [
  {
    uuid: 'comment-1',
    content: 'This is a great ontology!',
    is_deleted: false,
    created_at: '2025-03-10T15:00:00Z',
    updated_at: '2025-03-10T15:00:00Z',
    author_email: 'other@example.com',
    author_name: 'Other User',
    reply_count: 1,
    reactions: { '👍': { count: 2, user_reacted: false } },
    is_editable: false,
  },
  {
    uuid: 'comment-2',
    content: 'Very useful for medical research.',
    is_deleted: false,
    created_at: '2025-03-09T12:00:00Z',
    updated_at: '2025-03-09T12:00:00Z',
    author_email: 'test@example.com',
    author_name: 'Test User',
    reply_count: 0,
    reactions: {},
    is_editable: true,
  },
];

export const MOCK_USER_ACCOUNT = {
  email: 'test@example.com',
  name: 'Test User',
  is_public: true,
  permissions: {
    can_edit_ontologies: ['ont-uuid-1', 'ont-uuid-2', 'ont-uuid-3'],
    can_delete_ontologies: ['ont-uuid-1', 'ont-uuid-2', 'ont-uuid-3'],
  },
};
