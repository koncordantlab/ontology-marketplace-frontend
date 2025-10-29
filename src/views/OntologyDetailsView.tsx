import React, { useState, useEffect } from 'react';
import { GraphVisualization } from '../components/GraphVisualization';
import { CommentSystem } from '../components/CommentSystem';
import { ontologyService, Ontology } from '../services/ontologyService';

interface OntologyDetailsViewProps {
  ontologyId: string | null;
  onNavigate: (view: string, ontologyId?: string) => void;
}

export const OntologyDetailsView: React.FC<OntologyDetailsViewProps> = ({
  ontologyId,
  onNavigate
}) => {
  const [ontology, setOntology] = useState<Ontology | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOntology = async () => {
      if (!ontologyId) {
        setError('No ontology ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await ontologyService.searchOntologies();
        
        if (result.success && result.data) {
          const foundOntology = result.data.find(ont => ont.id === ontologyId);
          if (foundOntology) {
            setOntology(foundOntology);
          } else {
            setError('Ontology not found');
          }
        } else {
          setError(result.error || 'Failed to fetch ontology');
        }
      } catch (err) {
        setError('Error loading ontology');
        console.error('Error fetching ontology:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOntology();
  }, [ontologyId]);

  const handleUpload = () => {
    console.log('Uploading ontology to database:', ontologyId);
    // Navigate to use ontology view for database upload
    onNavigate('use-ontology', ontologyId || undefined);
  };

  const handleEdit = () => {
    onNavigate('edit-ontology', ontologyId || undefined);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading ontology...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ontology) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Ontology</h3>
            <p className="text-sm text-gray-600 mb-6">{error || 'Ontology not found'}</p>
            <button
              onClick={() => onNavigate('dashboard')}
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extract tags from ontology description and properties
  const extractTags = (ontology: Ontology): string[] => {
    const tags: string[] = [];
    
    // Add tags based on description content
    const description = ontology.description.toLowerCase();
    if (description.includes('medical') || description.includes('healthcare')) tags.push('medical');
    if (description.includes('e-commerce') || description.includes('product')) tags.push('e-commerce');
    if (description.includes('academic') || description.includes('research')) tags.push('academic');
    if (description.includes('technology') || description.includes('tech')) tags.push('technology');
    
    // Add source-based tags
    if (ontology.properties?.source_url) {
      const url = ontology.properties.source_url.toLowerCase();
      if (url.includes('github')) tags.push('open-source');
      if (url.includes('owl') || url.includes('rdf')) tags.push('semantic-web');
    }
    
    return tags.length > 0 ? tags : ['general'];
  };

  const tags = extractTags(ontology);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with back button */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{ontology.name}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Details Panel */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">DETAILS</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900">
                  {ontology.name}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 min-h-[100px]">
                  {ontology.description}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    ontology.properties?.is_public 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {ontology.properties?.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>

              {ontology.properties?.source_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source URL
                  </label>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900">
                    <a 
                      href={ontology.properties.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 break-all"
                    >
                      {ontology.properties.source_url}
                    </a>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created
                </label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900">
                  {ontology.createdAt ? new Date(ontology.createdAt).toLocaleDateString() : 'Unknown'}
                </div>
              </div>

              {ontology.node_count && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nodes
                  </label>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900">
                    {ontology.node_count.toLocaleString()}
                  </div>
                </div>
              )}

              {ontology.relationship_count && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationships
                  </label>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900">
                    {ontology.relationship_count.toLocaleString()}
                  </div>
                </div>
              )}
              
              <div className="flex flex-col space-y-3 pt-4">
                {/* Check if user owns this ontology */}
                {(() => {
                  // Use the is_owner flag from backend
                  const isOwner = ontology?.is_owner ?? false;

                  if (isOwner) {
                    return (
                      <button
                        onClick={handleEdit}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                      >
                        EDIT
                      </button>
                    );
                  } else {
                    return (
                      <div className="text-center text-sm text-gray-500 italic py-2">
                        You can only edit ontologies you created
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </div>

          {/* Graph View Panel */}
          <div className="lg:col-span-6 bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">READ-ONLY GRAPH VIEW</h2>
            <GraphVisualization width={600} height={400} className="h-96" />
            
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleUpload}
                className="px-8 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
              >
                UPLOAD TO DATABASE
              </button>
            </div>
          </div>

          {/* Comments Panel */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">COMMENTS</h2>
            </div>
            
            <CommentSystem />
            
            {/* Add Comment Form */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <textarea
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none text-sm"
              />
              <div className="mt-2 flex justify-end">
                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200">
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};