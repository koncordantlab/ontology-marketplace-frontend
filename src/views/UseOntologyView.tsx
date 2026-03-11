import React, { useState, useEffect } from 'react';
import { Toggle } from '../components/Toggle';
import { OntologySelector } from '../components/OntologySelector';
import { ontologyService, Ontology } from '../services/ontologyService';
import { BackendApiClient } from '../config/backendApi';
import toast from 'react-hot-toast';

interface UseOntologyViewProps {
  onNavigate: (view: string, ontologyId?: string) => void;
  initialOntologyId?: string | null;
}

const ITEMS_PER_PAGE = 6;

export const UseOntologyView: React.FC<UseOntologyViewProps> = ({ onNavigate, initialOntologyId }) => {
  const [showMerged, setShowMerged] = useState(true);
  const [selectedOntologyId, setSelectedOntologyId] = useState<string | null>(initialOntologyId || null);
  const [error, setError] = useState<string | null>(null);
  const [ontologies, setOntologies] = useState<Ontology[]>([]);
  const [isLoadingOntologies, setIsLoadingOntologies] = useState(false);
  const [previewData, setPreviewData] = useState<Ontology[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Upload form state (always visible)
  const [uploadUri, setUploadUri] = useState('');
  const [uploadUsername, setUploadUsername] = useState('neo4j');
  const [uploadPassword, setUploadPassword] = useState('');
  const [uploadDatabase, setUploadDatabase] = useState('neo4j');
  const [uploadRootLabel, setUploadRootLabel] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');

  // Get the selected ontology object
  const selectedOntology = ontologies.find(ont => ont.id === selectedOntologyId);

  useEffect(() => {
    loadOntologies();
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

  const handleTestConnection = async () => {
    if (!uploadUri || !uploadPassword) {
      setConnectionStatus('error');
      setConnectionMessage('URI and password are required');
      return;
    }

    setConnectionStatus('testing');
    setConnectionMessage('');

    try {
      const result = await BackendApiClient.request('/test_neo4j_connection', {
        method: 'POST',
        body: {
          neo4j_uri: uploadUri,
          neo4j_username: uploadUsername,
          neo4j_password: uploadPassword,
          neo4j_database: uploadDatabase,
        },
      });

      if (result.success) {
        setConnectionStatus('success');
        setConnectionMessage(result.message || 'Connection successful');
      } else {
        setConnectionStatus('error');
        setConnectionMessage(result.message || 'Connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionMessage(error instanceof Error ? error.message : 'Failed to test connection');
    }
  };

  const handleUpload = async () => {
    if (!uploadUri || !uploadPassword) {
      toast.error('Please fill in Neo4j URI and password.');
      return;
    }

    // Basic URI format validation
    if (!uploadUri.startsWith('neo4j://') && !uploadUri.startsWith('neo4j+s://') && !uploadUri.startsWith('bolt://') && !uploadUri.startsWith('bolt+s://')) {
      toast.error('Invalid Neo4j URI. It should start with neo4j://, neo4j+s://, bolt://, or bolt+s://');
      return;
    }

    const sourceUrl = selectedOntology?.properties?.source_url || '';

    // Must have either a file or a source URL from a selected ontology
    if (!uploadFile && !sourceUrl) {
      toast.error('Please upload a file or select an existing ontology with a source URL.');
      return;
    }

    if (!uploadFile && sourceUrl) {
      const urlLower = sourceUrl.toLowerCase();
      const hasValidExtension = ['.owl', '.ttl', '.rdf', '.xml'].some(ext => urlLower.includes(ext));
      if (!hasValidExtension) {
        toast.error('The source URL does not point to a downloadable OWL/TTL file. Please upload a file instead.');
        return;
      }
    }

    setIsUploading(true);
    try {
      if (uploadFile) {
        const { auth: firebaseAuth } = await import('../config/firebase');
        const user = firebaseAuth.currentUser;
        if (!user) throw new Error('User not authenticated');
        const token = await user.getIdToken();

        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('neo4j_uri', uploadUri);
        formData.append('neo4j_username', uploadUsername);
        formData.append('neo4j_password', uploadPassword);
        formData.append('neo4j_database', uploadDatabase);
        formData.append('source_url', sourceUrl);
        if (uploadRootLabel.trim()) {
          formData.append('root_label', uploadRootLabel.trim());
        }

        const baseUrl = (import.meta.env as any).VITE_BACKEND_BASE_URL as string;
        const response = await fetch(`${baseUrl}/upload_ontology_file`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success === false) {
          throw new Error(result.message || 'Upload failed');
        }
      } else {
        const payload: Record<string, string> = {
          neo4j_uri: uploadUri,
          neo4j_username: uploadUsername,
          neo4j_password: uploadPassword,
          neo4j_database: uploadDatabase,
          source_url: sourceUrl,
        };
        if (uploadRootLabel.trim()) {
          payload.root_label = uploadRootLabel.trim();
        }

        const result = await BackendApiClient.request<{ success: boolean; message?: string }>('/upload_ontology', {
          method: 'POST',
          body: payload,
        });
        if (result.success === false) {
          throw new Error(result.message || 'Upload failed');
        }
      }

      toast.success('Ontology uploaded successfully!');
      setUploadFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload ontology');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back button when navigated from details */}
        {initialOntologyId && (
          <button
            onClick={() => onNavigate('ontology-details', initialOntologyId)}
            className="mb-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Ontology Details
          </button>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Upload Form */}
          <div className="space-y-6">
            {/* File Upload Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">UPLOAD TO NEO4J</h2>

              {/* Ontology File */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ontology File (OWL, TTL, RDF)</label>
                <input
                  type="file"
                  accept=".owl,.ttl,.rdf,.xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setUploadFile(file);
                  }}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadFile && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                      {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => setUploadFile(null)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Upload your own file, or select an existing ontology below to use its source URL.
                </p>
              </div>

              {/* Or select existing ontology */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Or use existing ontology</label>
                  <button
                    onClick={loadOntologies}
                    disabled={isLoadingOntologies}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
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
                {selectedOntology && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium text-gray-900">{selectedOntology.name}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{selectedOntology.description}</p>
                    {selectedOntology.properties?.source_url && (
                      <p className="text-xs text-blue-600 mt-1 truncate">
                        Source: {selectedOntology.properties.source_url}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {!uploadFile && !selectedOntology?.properties?.source_url && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
                  <p className="text-sm text-yellow-800">
                    Upload a file or select an ontology with a source URL to proceed.
                  </p>
                </div>
              )}

              {/* Root Label */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Root Label (optional)</label>
                <input
                  type="text"
                  value={uploadRootLabel}
                  onChange={(e) => setUploadRootLabel(e.target.value)}
                  placeholder="e.g. Root Node"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Start tree from a specific label (leave empty for all roots)</p>
              </div>
            </div>

            {/* Neo4j Connection Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">NEO4J CONNECTION</h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Neo4j URI *</label>
                  <input
                    type="text"
                    value={uploadUri}
                    onChange={(e) => setUploadUri(e.target.value)}
                    placeholder="neo4j+s://xxxx.databases.neo4j.io"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={uploadUsername}
                      onChange={(e) => setUploadUsername(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input
                      type="password"
                      value={uploadPassword}
                      onChange={(e) => setUploadPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Database</label>
                  <input
                    type="text"
                    value={uploadDatabase}
                    onChange={(e) => setUploadDatabase(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Connection Status */}
              {connectionStatus !== 'idle' && (
                <div className={`mt-3 p-3 rounded-md text-sm ${
                  connectionStatus === 'testing' ? 'bg-blue-50 text-blue-700' :
                  connectionStatus === 'success' ? 'bg-green-50 text-green-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {connectionStatus === 'testing' ? 'Testing connection...' : connectionMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleTestConnection}
                  disabled={isUploading || connectionStatus === 'testing'}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
                >
                  {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading || connectionStatus === 'testing' || (!uploadFile && !selectedOntology?.properties?.source_url)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
                >
                  {isUploading ? 'Uploading...' : 'Upload to Neo4j'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Ontology Preview */}
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
              <>
              <div className="space-y-4">
                {previewData.length > 0 ? (
                  previewData
                    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                    .map((ontology) => {
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
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center"
                              style={{ display: ontology.properties?.image_url ? 'none' : 'flex' }}
                            >
                              <span className="text-white font-bold text-lg">
                                {ontology.name
                                  ? ontology.name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
                                  : 'ON'}
                              </span>
                            </div>
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

              {/* Pagination */}
              {previewData.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, previewData.length)} of {previewData.length}
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      {currentPage} / {Math.ceil(previewData.length / ITEMS_PER_PAGE)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(previewData.length / ITEMS_PER_PAGE), p + 1))}
                      disabled={currentPage >= Math.ceil(previewData.length / ITEMS_PER_PAGE)}
                      className="px-3 py-1 text-sm rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              </>
            )}

            <div className="flex items-center mt-6">
              <Toggle
                checked={showMerged}
                onChange={setShowMerged}
                label="Show Merged"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
