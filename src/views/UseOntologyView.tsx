import React, { useState, useEffect } from 'react';
import { OntologySelector } from '../components/OntologySelector';
import { Neo4jConnectionModal, Neo4jCredentials } from '../components/Neo4jConnectionModal';
import { ConversionStatus, ConversionState } from '../components/ConversionStatus';
import { ontologyService, Ontology } from '../services/ontologyService';

interface UseOntologyViewProps {
  onNavigate: (view: string, ontologyId?: string) => void;
}

export const UseOntologyView: React.FC<UseOntologyViewProps> = ({ onNavigate }) => {
  const [selectedOntologyId, setSelectedOntologyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ontologies, setOntologies] = useState<Ontology[]>([]);
  const [isLoadingOntologies, setIsLoadingOntologies] = useState(false);
  const [previewData, setPreviewData] = useState<Ontology[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showNeo4jModal, setShowNeo4jModal] = useState(false);
  const [isConvertingToNeo4j, setIsConvertingToNeo4j] = useState(false);
  const [conversionState, setConversionState] = useState<ConversionState>('idle');
  const [conversionMessage, setConversionMessage] = useState<string>('');
  const [conversionStats, setConversionStats] = useState<any>(null);
  const [lastNeo4jUri, setLastNeo4jUri] = useState<string>('');

  // Get the selected ontology object
  const selectedOntology = ontologies.find(ont => ont.id === selectedOntologyId);

  useEffect(() => {
    // Load ontologies on component mount
    loadOntologies();
    // Load preview data on component mount
    loadPreviewData();
  }, []);

  const loadOntologies = async () => {
    setIsLoadingOntologies(true);
    setError(null);
    
    try {
      const result = await ontologyService.getOntologies();
      if (result.error) {
        setError(result.error);
        setOntologies([]);
      } else {
        setOntologies(result.ontologies);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load ontologies';
      setError(errorMessage);
      setOntologies([]);

    } finally {
      setIsLoadingOntologies(false);
    }
  };

  const loadPreviewData = async () => {
    setIsLoadingPreview(true);
    setError(null);
    
    try {
      // Check if user is authenticated first
      if (!ontologyService.isAuthenticated()) {
        setError('Please log in with Firebase to view ontologies');
        setPreviewData([]);
        return;
      }

      const result = await ontologyService.searchOntologies();
      if (result.success && result.data) {
        setPreviewData(result.data);
      } else {
        setError(result.error || 'Failed to load preview data');
        setPreviewData([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load preview data';
      setError(errorMessage);
      setPreviewData([]);

    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleRefreshPreview = async () => {
    await loadPreviewData();
  };

  const handleUpload = async () => {
    if (!selectedOntologyId) {
      alert('Please select an ontology first');
      return;
    }

    // Open Neo4j connection modal
    setShowNeo4jModal(true);
  };

  const handleNeo4jConvert = async (credentials: Neo4jCredentials) => {
    if (!selectedOntologyId || !selectedOntology) {
      setConversionState('error');
      setConversionMessage('Please select an ontology first');
      setShowNeo4jModal(false);
      return;
    }

    // Close modal and show conversion status in main UI
    setShowNeo4jModal(false);
    setIsConvertingToNeo4j(true);
    setConversionState('converting');
    setConversionMessage('Initializing conversion process...');
    setConversionStats(null);
    setError(null);
    setLastNeo4jUri(credentials.uri);

    try {
      // Get the source URL from the selected ontology
      const sourceUrl = selectedOntology.properties?.source_url;

      if (!sourceUrl) {
        throw new Error('Selected ontology does not have a source URL');
      }

      // Update message based on clear_existing flag
      console.log('Neo4j conversion starting with credentials:', {
        uri: credentials.uri,
        username: credentials.username,
        clearExisting: credentials.clearExisting,
        rootLabel: credentials.rootLabel
      });

      if (credentials.clearExisting) {
        setConversionMessage('Clearing existing database before import...');
      } else {
        setConversionMessage('Connecting to Neo4j and downloading ontology...');
      }

      const result = await ontologyService.convertToNeo4j({
        ontology_id: selectedOntologyId,
        ontology_name: selectedOntology.name,
        source_url: sourceUrl,
        neo4j_uri: credentials.uri,
        neo4j_user: credentials.username,
        neo4j_password: credentials.password,
        root_label: credentials.rootLabel,
        clear_existing: credentials.clearExisting
      });

      if (result.success) {
        setConversionState('success');
        setConversionMessage(result.message || 'Ontology successfully converted to Neo4j!');
        setConversionStats(result.stats);
      } else {
        throw new Error(result.error || 'Conversion failed');
      }
    } catch (error) {
      console.error('Neo4j conversion error:', error);
      setConversionState('error');
      setConversionMessage(error instanceof Error ? error.message : 'Conversion failed');
      setError(error instanceof Error ? error.message : 'Conversion failed');
    } finally {
      setIsConvertingToNeo4j(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selected Ontology Panel */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">SELECTED ONTOLOGY</h2>
              <button
                onClick={loadOntologies}
                disabled={isLoadingOntologies}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
              >
                {isLoadingOntologies ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            <OntologySelector
              selectedId={selectedOntologyId}
              onSelect={setSelectedOntologyId}
              onNavigate={onNavigate}
              ontologies={ontologies}
              isLoading={isLoadingOntologies}
            />
            
            {selectedOntologyId && selectedOntology && (
              <div className="mt-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Ontology Preview</h3>
                  
                  {/* Thumbnail Display */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {selectedOntology.properties?.image_url ? (
                        <img 
                          src={selectedOntology.properties.image_url} 
                          alt={`${selectedOntology.name} thumbnail`}
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            e.currentTarget.src = 'https://via.placeholder.com/128x128?text=📊';
                          }}
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
                          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Ontology Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-lg">{selectedOntology.name}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-3">{selectedOntology.description}</p>
                      
                      <div className="flex items-center space-x-2 mt-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedOntology.properties?.is_public 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedOntology.properties?.is_public ? 'Public' : 'Private'}
                        </span>
                        
                        {selectedOntology.properties?.source_url && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Has Source
                          </span>
                        )}
                        
                        {selectedOntology.properties?.image_url && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Has Thumbnail
                          </span>
                        )}
                      </div>
                      
                      {selectedOntology.createdAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Created: {new Date(selectedOntology.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ontology Preview Panel */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">ONTOLOGY PREVIEW</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Available Ontologies from API
                </p>
              </div>
              <button
                onClick={handleRefreshPreview}
                disabled={isLoadingPreview}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
              >
                {isLoadingPreview ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            {isLoadingPreview ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading ontologies...</p>
                </div>
              </div>
            ) : error && error.includes('log in') ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
                  <p className="text-sm text-gray-600 mb-4">Please log in with Firebase to view ontologies</p>
                  <button
                    onClick={() => onNavigate('login')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {previewData.length > 0 ? (
                  previewData.map((ontology) => {
                    // Safely handle potentially undefined properties
                    const isPublic = ontology.properties?.is_public ?? false;
                    const hasSource = !!ontology.properties?.source_url;
                    
                    return (
                      <div key={ontology.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start space-x-4">
                          {/* Thumbnail */}
                          <div className="flex-shrink-0">
                            {ontology.properties?.image_url ? (
                              <img 
                                src={ontology.properties.image_url} 
                                alt={`${ontology.name} thumbnail`}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  // Fallback to placeholder if image fails to load
                                  e.currentTarget.src = 'https://via.placeholder.com/64x64?text=📊';
                                }}
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{ontology.name}</h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ontology.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                isPublic 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {isPublic ? 'Public' : 'Private'}
                              </span>
                              {hasSource && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Has Source
                                </span>
                              )}
                              {ontology.properties?.image_url && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Has Thumbnail
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No ontologies available</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={handleUpload}
                disabled={!selectedOntologyId}
                className={`px-6 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ${
                  selectedOntologyId
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                CONVERT TO NEO4J
              </button>
            </div>
            
            {!selectedOntologyId && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Select an ontology to convert to Neo4j
                </p>
              </div>
            )}

            {/* Conversion Status Display */}
            <ConversionStatus
              state={conversionState}
              message={conversionMessage}
              stats={conversionStats}
              neo4jUri={lastNeo4jUri}
              onClose={() => setConversionState('idle')}
            />
          </div>
        </div>
      </div>

      {/* Neo4j Connection Modal */}
      <Neo4jConnectionModal
        isOpen={showNeo4jModal}
        onClose={() => setShowNeo4jModal(false)}
        onConnect={handleNeo4jConvert}
        isLoading={isConvertingToNeo4j}
      />
    </div>
  );
};