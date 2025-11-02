# Test Ontologies for Neo4j - Minimal Structure

This file contains simplified Cypher statements to create **Ontology metadata records** that match the application's API structure.

## Overview

The script creates:
- **3 User nodes** (owners of ontologies)
- **8 Tag nodes** (for categorization)
- **3 Ontology nodes** (metadata records)

## ⚠️ Important: What This Creates vs. What the App Needs

### ✅ This Script Creates:
- **:Ontology** - Metadata records (name, description, properties, etc.)
- **:User** - User accounts (owners)
- **:Tag** - Categorization tags (medical, business, public, etc.)
- **:OWNS** - Relationship from User to Ontology
- **:HAS_TAG** - Relationship from Ontology to Tags

### ❌ This Script Does NOT Create:
- **:Class** nodes (e.g., Disease, Product, Person concepts)
- **:Instance** nodes (e.g., COVID-19, Laptop, Alice Johnson)
- Domain relationships (e.g., HAS_SYMPTOM, BELONGS_TO, WORKS_FOR)

### Why?

The application has **two separate data stores**:

1. **Metadata Store** (Neo4j or backend database)
   - Ontology metadata (name, description, tags, owner, etc.)
   - **This script creates this metadata**

2. **Content Store** (Neo4j graph database)
   - Actual OWL/RDF classes and instances
   - Graph relationships (HAS_SYMPTOM, BELONGS_TO, etc.)
   - **Created when user uploads an OWL file**

### How Ontology Content Gets into Neo4j

1. User creates ontology via app → metadata saved
2. User uploads OWL file → stored at `source_url`
3. User clicks "Upload to Neo4j" → calls `/api/ontologies/{id}/upload-to-neo4j`
4. Backend parses OWL file and creates graph structure
5. Graph content stored separately from metadata

## Data Structure

### Ontology Nodes
```cypher
:Ontology {
  id: string           // Unique identifier
  name: string         // Display name
  description: string  // Full description
  source_url: string   // Link to OWL/RDF file (optional)
  image_url: string    // Thumbnail (optional)
  is_public: boolean   // Visibility flag
  createdAt: datetime  // Creation timestamp
  updatedAt: datetime  // Last update timestamp
  ownerId: string      // Owner user ID
  node_count: number   // Stats from parsed content (optional)
  relationship_count: number // Stats from parsed content (optional)
}
```

### User Nodes
```cypher
:User {
  id: string          // Firebase user ID
  email: string
  name: string
  createdAt: datetime
}
```

### Tag Nodes
```cypher
:Tag {
  name: string      // Tag name (e.g., 'medical', 'public')
  category: string  // Tag category (e.g., 'domain', 'visibility')
}
```

### Relationships
- `(:User)-[:OWNS]->(:Ontology)` - User owns ontology
- `(:Ontology)-[:HAS_TAG]->(:Tag)` - Ontology has tag

## Test Data Created

### Users
1. **Alice Johnson** (user-001) - owner of 2 ontologies
2. **Bob Smith** (user-002) - owner of 1 ontology
3. **Carol Williams** (user-003) - no ontologies

### Ontologies
1. **Medical Disease Ontology** (ont-001)
   - Public, owned by Alice
   - Tags: medical, healthcare, public
   
2. **E-commerce Product Ontology** (ont-002)
   - Public, owned by Bob
   - Tags: products, business, public
   
3. **Financial Services Ontology** (ont-003)
   - Private, owned by Alice
   - Tags: finance, business, private

## Usage

### Load into Neo4j

**Via Neo4j Browser:**
1. Open http://localhost:7474
2. Copy/paste contents of `test_ontologies.cypher`
3. Execute

**Via cypher-shell:**
```bash
cat test_ontologies.cypher | cypher-shell -u neo4j -p yourpassword
```

**Via programmatic import:**
```javascript
const neo4j = require('neo4j-driver');
const fs = require('fs');

const driver = neo4j.driver('bolt://localhost:7687', 
  neo4j.auth.basic('neo4j', 'password'));
const session = driver.session();

const cypher = fs.readFileSync('test_ontologies.cypher', 'utf8');
await session.run(cypher);

await session.close();
await driver.close();
```

## Verification Queries

### Count all ontologies
```cypher
MATCH (o:Ontology)
RETURN count(o) as totalOntologies;
```

### List all public ontologies with tags
```cypher
MATCH (o:Ontology {is_public: true})-[:HAS_TAG]->(t:Tag)
RETURN o.name, collect(t.name) as tags;
```

### Get a user's ontologies
```cypher
MATCH (u:User {id: 'user-001'})-[:OWNS]->(o:Ontology)
RETURN o.name, o.description, o.is_public;
```

### Find ontologies by tag
```cypher
MATCH (o:Ontology)-[:HAS_TAG]->(t:Tag {name: 'medical'})
RETURN o.name, o.description;
```

### Count ontologies by user
```cypher
MATCH (u:User)-[:OWNS]->(o:Ontology)
RETURN u.name, count(o) as ontology_count;
```

### View full relationship graph
```cypher
MATCH path = (u:User)-[*]-(o:Ontology)-[*]-(t:Tag)
RETURN path
LIMIT 20;
```

## Adding Real Ontology Content

To add actual graph content (classes and instances):

1. **Via the Application:**
   - Create ontology with OWL/RDF file URL
   - Use "Upload to Neo4j" button
   - Backend will parse and create graph

2. **Manually with Cypher:**
   ```cypher
   // Example: Add a simple medical ontology
   MATCH (ontology:Ontology {id: 'ont-001'})
   
   CREATE (disease:Class {
     name: 'Disease',
     ontology: 'ont-001'
   })
   
   CREATE (covid:Instance {
     name: 'COVID-19',
     ontology: 'ont-001'
   })
   
   CREATE (covid)-[:IS_A]->(disease)
   CREATE (ontology)-[:CONTAINS]->(disease)
   CREATE (ontology)-[:CONTAINS]->(covid);
   ```

3. **Upload via API:**
   ```bash
   curl -X POST "https://your-api.com/api/ontologies/ont-001/upload-to-neo4j" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "owl_file=@your-ontology.owl"
   ```

## Troubleshooting

### "Property already exists" errors
Clear existing data first:
```cypher
MATCH (n) DETACH DELETE n;
```
⚠️ This deletes ALL data in your database!

### No results from queries
Check that the data loaded:
```cypher
MATCH (n) RETURN labels(n)[0] as label, count(*) as count;
```

### Tags not showing
Tags are linked via `:HAS_TAG` relationships:
```cypher
MATCH (o:Ontology)-[r:HAS_TAG]->(t:Tag)
RETURN o.name, t.name;
```

## Integration with Application

This test data matches the application's structure:

- ✅ Can be retrieved via `/search_ontologies` endpoint
- ✅ Works with ontology management features
- ✅ Supports public/private filtering
- ✅ Tag-based filtering works
- ✅ User ownership tracking works
- ✅ Statistics (node_count, relationship_count) included

## Next Steps

1. **Load the metadata** (this script)
2. **Import real OWL content** via app or backend
3. **Test the application** with this data
4. **Expand as needed** for your testing scenarios
