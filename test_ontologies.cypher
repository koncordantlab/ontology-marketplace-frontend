// Minimal test data for Ontology Marketplace
// Creates Ontology records with User and Tag relationships
// This matches the API endpoints structure (no :Class or :Instance nodes)

// Clear existing test data (optional - uncomment to use)
// MATCH (n) DETACH DELETE n;

// ============================================
// Create Users
// ============================================

CREATE (user1:User {
  id: 'user-001',
  email: 'alice@example.com',
  name: 'Alice Johnson',
  created_at: datetime('2025-01-01T10:00:00Z')
})

CREATE (user2:User {
  id: 'user-002',
  email: 'bob@example.com',
  name: 'Bob Smith',
  created_at: datetime('2025-01-02T10:00:00Z')
})

CREATE (user3:User {
  id: 'user-003',
  email: 'carol@example.com',
  name: 'Carol Williams',
  created_at: datetime('2025-01-03T10:00:00Z')
});

// ============================================
// Create Tags
// ============================================

CREATE (tag1:Tag {
  name: 'Medical',
  category: 'domain'
})

CREATE (tag2:Tag {
  name: 'Healthcare',
  category: 'domain'
})

CREATE (tag3:Tag {
  name: 'Products',
  category: 'domain'
})

CREATE (tag4:Tag {
  name: 'Business',
  category: 'domain'
})

CREATE (tag5:Tag {
  name: 'Finance',
  category: 'domain'
})

CREATE (tag6:Tag {
  name: 'Research',
  category: 'domain'
})

CREATE (tag7:Tag {
  name: 'Journalism',
  category: 'visibility'
})

CREATE (tag8:Tag {
  name: 'Politics',
  category: 'visibility'
});

// ============================================
// Create Ontologies
// ============================================

// 1. Medical Ontology (public)
CREATE (ontology1:Ontology {
  uuid: 'ont-001',
  name: 'Medical Disease Ontology',
  description: 'Comprehensive ontology for diseases, symptoms, and treatments. Includes relationships between medical conditions and their characteristics.',
  source_url: 'https://example.com/medical-ontology.owl',
  image_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400',
  is_public: true,
  created_at: datetime('2025-01-10T08:00:00Z'),
  updated_at: datetime('2025-01-15T14:30:00Z'),
  ownerId: 'user-001',
  node_count: 45,
  relationship_count: 120
})

// Link ontology to user
CREATE (user1)-[:CREATED {since: datetime('2025-01-10T08:00:00Z')}]->(ontology1)

// Link ontology to tags
CREATE (ontology1)-[:TAGGED]->(tag1)
CREATE (ontology1)-[:TAGGED]->(tag2);

// 2. E-commerce Product Ontology (public)
CREATE (ontology2:Ontology {
  uuid: 'ont-002',
  name: 'E-commerce Product Ontology',
  description: 'Product classification, categories, and commerce relationships for online retail. Includes pricing, inventory, and review structures.',
  source_url: 'https://example.com/ecommerce.owl',
  image_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400',
  is_public: true,
  created_at: datetime('2025-01-08T09:15:00Z'),
  updated_at: datetime('2025-01-12T16:45:00Z'),
  ownerId: 'user-002',
  node_count: 38,
  relationship_count: 95
})

CREATE (user2)-[:CREATED {since: datetime('2025-01-08T09:15:00Z')}]->(ontology2)
CREATE (ontology2)-[:TAGGED]->(tag3)
CREATE (ontology2)-[:TAGGED]->(tag4);

// 3. Financial Services Ontology (private)
CREATE (ontology3:Ontology {
  uuid: 'ont-003',
  name: 'Financial Services Ontology',
  description: 'Banking, transactions, accounts, and financial instruments modeling. Covers banking operations, account types, and transaction flows.',
  source_url: 'https://example.com/finance.owl',
  image_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400',
  is_public: false,
  created_at: datetime('2025-01-05T11:00:00Z'),
  updated_at: datetime('2025-01-14T10:20:00Z'),
  ownerId: 'user-001',
  node_count: 52,
  relationship_count: 138
})

CREATE (user1)-[:CREATED {since: datetime('2025-01-05T11:00:00Z')}]->(ontology3)
CREATE (ontology3)-[:TAGGED]->(tag5)
CREATE (ontology3)-[:TAGGED]->(tag4);

// ============================================
// NOTE: App Requirements Assessment
// ============================================

// The application stores Ontology metadata (name, description, properties, etc.)
// BUT the actual ontology content (OWL/RDF classes, instances, relationships)
// is NOT stored in Neo4j for this API.
//
// Current architecture:
// - Ontologies are stored as metadata records (this file)
// - The actual OWL file is stored via source_url
// - When "uploaded to Neo4j" via the /upload-to-neo4j endpoint,
//   the backend parses the OWL file and creates nodes/relationships
//
// This test data creates:
// ✅ :Ontology nodes (metadata records)
// ✅ :User nodes (owners)
// ✅ :Tag nodes (categorization)
// ✅ Relationships between them
//
// This test data does NOT create:
// ❌ :Class nodes (concepts like Disease, Product, etc.)
// ❌ :Instance nodes (specific diseases, products, etc.)
// ❌ Relationships between concepts (HAS_SYMPTOM, BELONGS_TO, etc.)
//
// These (:Class and :Instance) would be created when:
// 1. User uploads an OWL file via the app
// 2. Backend parses the OWL/RDF file
// 3. Backend creates Neo4j nodes for concepts and relationships
// 4. Data is stored separately from the metadata
//
// To add test content nodes, you would:
// 1. Load the OWL file using the backend API
// 2. Use the /upload-to-neo4j endpoint
// 3. Backend will create the graph structure

// ============================================
// Verification Queries
// ============================================

// Count ontologies by user
MATCH (u:User)-[:CREATED]->(o:Ontology)
RETURN u.name, u.email, count(o) as ontologies;

// List all public ontologies with their tags
MATCH (o:Ontology {is_public: true})-[:TAGGED]->(t:Tag)
RETURN o.name, o.description, collect(t.name) as tags;

// List private ontologies with owners
MATCH (u:User)-[:CREATED]->(o:Ontology {is_public: false})
RETURN o.name, u.name as owner, o.created_at;

// Find ontologies by tag
MATCH (o:Ontology)-[:TAGGED]->(t:Tag {name: 'medical'})
RETURN o.name, o.description, o.is_public;

// Get user's ontologies
MATCH (u:User {id: 'user-001'})-[:CREATED]->(o:Ontology)
RETURN o.name, o.created_at, o.is_public
ORDER BY o.created_at DESC;

// Count ontologies by visibility
MATCH (o:Ontology)
RETURN o.is_public, count(*) as count;

// Get all tags used
MATCH (o:Ontology)-[:TAGGED]->(t:Tag)
RETURN DISTINCT t.name, t.category, count(*) as usage_count
ORDER BY usage_count DESC;
