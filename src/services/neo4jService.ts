import { BackendApiClient } from '../config/backendApi';

export interface Neo4jCredentials {
  uri: string;
  username: string;
  password: string;
}

export interface Neo4jNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
  x?: number;
  y?: number;
}

export interface Neo4jRelationship {
  id: string;
  type: string;
  startNodeId: string;
  endNodeId: string;
  properties: Record<string, any>;
}

export interface Neo4jGraph {
  nodes: Neo4jNode[];
  relationships: Neo4jRelationship[];
}

class Neo4jService {
  private connected = false;

  async connect(credentials: Neo4jCredentials): Promise<boolean> {
    try {
      // Connect via backend API
      const response = await BackendApiClient.connectNeo4j(credentials);
      
      if (response.success !== false) {
        this.connected = true;
        console.log('Successfully connected to Neo4j via backend');
        return true;
      }
      
      throw new Error(response.error || 'Connection failed');
    } catch (error) {
      console.error('Failed to connect to Neo4j:', error);
      this.disconnect();
      throw new Error(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.connected) {
        await BackendApiClient.disconnectNeo4j();
      }
      this.connected = false;
      console.log('Disconnected from Neo4j');
    } catch (error) {
      console.error('Error disconnecting from Neo4j:', error);
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getGraphData(limit: number = 100): Promise<Neo4jGraph> {
    if (!this.connected) {
      throw new Error('Not connected to Neo4j database');
    }

    try {
      const response = await BackendApiClient.getNeo4jGraphData(limit);
      
      return response as Neo4jGraph;
    } catch (error) {
      console.error('Error fetching graph data:', error);
      throw new Error(`Failed to fetch graph data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getNodesByLabel(label: string, limit: number = 50): Promise<Neo4jNode[]> {
    if (!this.connected) {
      throw new Error('Not connected to Neo4j database');
    }

    try {
      const query = `MATCH (n:${label}) RETURN n LIMIT ${limit}`;
      const response = await BackendApiClient.executeNeo4jQuery(query);
      
      // Transform the response to match the expected format
      return response.records?.map((record: any, index: number) => {
        const node = record.n || record;
        return {
          id: node.identity?.toString() || String(index),
          labels: node.labels || [],
          properties: node.properties || {},
          x: Math.random() * 500 + 50,
          y: Math.random() * 300 + 50
        };
      }) || [];
    } catch (error) {
      console.error('Error fetching nodes by label:', error);
      throw new Error(`Failed to fetch nodes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async executeCustomQuery(query: string, parameters: Record<string, any> = {}): Promise<any[]> {
    if (!this.connected) {
      throw new Error('Not connected to Neo4j database');
    }

    try {
      const response = await BackendApiClient.executeNeo4jQuery(query, parameters);
      return response.records || [];
    } catch (error) {
      console.error('Error executing custom query:', error);
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDatabaseInfo(): Promise<any> {
    if (!this.connected) {
      throw new Error('Not connected to Neo4j database');
    }

    try {
      const response = await BackendApiClient.getNeo4jDatabaseInfo();
      return response;
    } catch (error) {
      console.error('Error getting database info:', error);
      throw new Error(`Failed to get database info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const neo4jService = new Neo4jService();