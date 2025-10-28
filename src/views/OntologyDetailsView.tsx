import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CommentSystem } from '../components/CommentSystem';
import { ontologyService, Ontology } from '../services/ontologyService';
import { BackendApiClient } from '../config/backendApi';
import { cloudinaryService } from '../services/cloudinaryService';

interface OntologyDetailsViewProps {
  ontologyId: string | null;
  onNavigate?: (view: string, ontologyId?: string) => void;
}

export const OntologyDetailsView: React.FC<OntologyDetailsViewProps> = ({
  ontologyId
}) => {
  const [ontology, setOntology] = useState<Ontology | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [editable, setEditable] = useState<Ontology | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dialog state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadUri, setUploadUri] = useState('');
  const [uploadUsername, setUploadUsername] = useState('neo4j');
  const [uploadPassword, setUploadPassword] = useState('');
  const [uploadDatabase, setUploadDatabase] = useState('neo4j');
  const [isUploading, setIsUploading] = useState(false);

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

  // Check edit permission
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (!ontologyId) return;
        const ontologyUuid = (ontology && (ontology as any).uuid) || ontologyId;
        const resp: any = await BackendApiClient.request(`/can_edit_ontology/${ontologyUuid}`, {
          method: 'GET',
        });
        setCanEdit(!!resp?.success);
      } catch (e) {
        setCanEdit(false);
      }
    };
    checkPermission();
  }, [ontologyId, ontology]);

  // Initialize editable copy when ontology loads
  useEffect(() => {
    if (ontology) {
      setEditable({
        ...ontology,
        properties: {
          source_url: ontology.properties?.source_url || '',
          image_url: ontology.properties?.image_url || '',
          is_public: !!ontology.properties?.is_public,
          tags: ontology.properties?.tags || [],
        },
      });
    }
  }, [ontology]);

  const isDirty = useMemo(() => {
    if (!ontology || !editable) return false;
    const orig = {
      name: ontology.name,
      description: ontology.description,
      source_url: ontology.properties?.source_url || '',
      image_url: ontology.properties?.image_url || '',
      is_public: !!ontology.properties?.is_public,
    };
    const cur = {
      name: editable.name,
      description: editable.description,
      source_url: editable.properties?.source_url || '',
      image_url: editable.properties?.image_url || '',
      is_public: !!editable.properties?.is_public,
    };
    // Dirty if fields changed or a new image file was chosen
    return JSON.stringify(orig) !== JSON.stringify(cur) || !!selectedImageFile;
  }, [ontology, editable, selectedImageFile]);

  const handleFieldChange = (field: 'name' | 'description', value: string) => {
    if (!editable) return;
    setEditable({ ...editable, [field]: value });
  };

  const handlePropChange = (field: 'source_url' | 'image_url' | 'is_public', value: string | boolean) => {
    if (!editable) return;
    setEditable({
      ...editable,
      properties: {
        ...editable.properties,
        [field]: value as any,
      },
    });
  };

  const handleImageSelect = (file: File) => {
    if (!file) return;
    // Hold in memory and preview; upload will happen on Save
    setSelectedImageFile(file);
    const url = URL.createObjectURL(file);
    setSelectedImagePreviewUrl(url);
  };

  const clearSelectedImage = () => {
    if (selectedImagePreviewUrl) {
      URL.revokeObjectURL(selectedImagePreviewUrl);
    }
    setSelectedImagePreviewUrl(null);
    setSelectedImageFile(null);
    // Reset the file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!editable || !ontology?.id) return;
    setIsSaving(true);
    try {
      // Get the ontology UUID (same logic as in checkPermission)
      const ontologyUuid = (ontology as any).uuid || ontology.id;
      
      // If a new image file was chosen, upload it first
      let imageUrlToSave = editable.properties?.image_url || '';
      if (selectedImageFile) {
        const uploadRes = await cloudinaryService.uploadImage(selectedImageFile, {
          preset: 'ontologymarketplace',
          folder: 'ontology-images',
          tags: ['ontology', 'image']
        });
        if (!uploadRes.success || !uploadRes.url) {
          throw new Error(uploadRes.error || 'Image upload failed');
        }
        imageUrlToSave = uploadRes.url;
      }

      const updates: any = {
        // Top-level fields expected by backend
        name: editable.name ?? ontology.name,
        description: editable.description ?? ontology.description,
        source_url: (editable.properties?.source_url ?? ontology.properties?.source_url) || '',
        image_url: (imageUrlToSave ?? ontology.properties?.image_url) || '',
        is_public: (
          editable.properties?.is_public ?? ontology.properties?.is_public ?? false
        ),
        node_count: ontology.node_count ?? null,
        relationship_count: ontology.relationship_count ?? null,
        score: ontology.score ?? null,
        // Keep nested properties for compatibility with other consumers
        properties: {
          source_url: (editable.properties?.source_url ?? ontology.properties?.source_url) || '',
          image_url: (imageUrlToSave ?? ontology.properties?.image_url) || '',
          is_public: (
            editable.properties?.is_public ?? ontology.properties?.is_public ?? false
          ),
        },
      };

      const result = await BackendApiClient.updateOntology(ontologyUuid, updates);
      if ((result as any)?.success === false) {
        throw new Error((result as any)?.error || 'Failed to update ontology');
      }
      // Refresh local state
      setOntology({ ...editable, id: ontology.id, properties: { ...editable.properties, image_url: imageUrlToSave } });
      // Clear selected image state after successful save
      clearSelectedImage();
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = () => {
    setShowUploadDialog(true);
  };

  const handleDialogCancel = () => {
    setShowUploadDialog(false);
    setUploadUri('');
    setUploadPassword('');
  };

  const handleDialogUpload = async () => {
    if (!uploadUri || !uploadPassword || !ontology) {
      alert('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    try {
      const uploadUrl = import.meta.env.VITE_UPLOAD_URL;
      if (!uploadUrl) {
        throw new Error('VITE_UPLOAD_URL is not configured');
      }

      const payload = {
        uri: uploadUri,
        username: uploadUsername,
        password: uploadPassword,
        database: uploadDatabase,
        ttl_url: ontology.properties?.source_url || ontology.file_url || ''
      };

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      alert('Ontology uploaded successfully!');
      setShowUploadDialog(false);
      setUploadUri('');
      setUploadPassword('');
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload ontology');
    } finally {
      setIsUploading(false);
    }
  };

  // Deprecated: Editing now happens inline via Save

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
            <p className="text-sm text-gray-600">{error || 'Ontology not found'}</p>
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
        {/* Header */}

        {/* Details Panel */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6"></h2>
          
          {/* Image between DETAILS title and Title field */}
          <div className="mb-2 max-h-48 flex items-center justify-center">
            {selectedImagePreviewUrl ? (
              <img
                src={selectedImagePreviewUrl}
                alt="Selected preview"
                className="w-full h-full max-h-48 object-contain rounded-lg"
              />
            ) : editable?.properties?.image_url ? (
              <img 
                src={editable.properties.image_url} 
                alt={editable.name || 'Ontology image'}
                className="w-full h-full max-h-48 object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
          </div>
          {canEdit && (
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file);
                  }}
                  className="block flex-1 text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                {selectedImageFile && (
                  <button
                    type="button"
                    onClick={clearSelectedImage}
                    className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 whitespace-nowrap"
                    title="Reset image widget"
                  >
                    Reset Image
                  </button>
                )}
              </div>
            </div>
          )}
          
          <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={editable?.name || ''}
                  placeholder={'Untitled Ontology'}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-900 disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={editable?.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-900 disabled:bg-gray-100"
                />
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
                <div className="flex items-center gap-3">
                  <input
                    id="is_public"
                    type="checkbox"
                    checked={!!editable?.properties?.is_public}
                    onChange={(e) => handlePropChange('is_public', e.target.checked)}
                    disabled={!canEdit}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="is_public" className="text-sm text-gray-700">
                    Public
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source URL
                </label>
                <input
                  type="url"
                  value={editable?.properties?.source_url || ''}
                  onChange={(e) => handlePropChange('source_url', e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-900 disabled:bg-gray-100"
                />
              </div>

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
              
              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={handleSave}
                  disabled={!canEdit || !isDirty || isSaving}
                  className={`px-8 py-3 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ${
                    !canEdit || !isDirty || isSaving
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSaving ? 'SAVING...' : 'SAVE'}
                </button>
                <button
                  onClick={handleUpload}
                  className="px-8 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  UPLOAD TO DATABASE
                </button>
              </div>
            </div>
        </div>

        {/* Comments Section - hidden/disabled */}
        {false && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">COMMENTS</h2>
            </div>
            <CommentSystem />
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
        )}

        {/* Upload Dialog */}
        {showUploadDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload to Neo4j Database</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Neo4j URI *
                  </label>
                  <input
                    type="text"
                    value={uploadUri}
                    onChange={(e) => setUploadUri(e.target.value)}
                    placeholder="neo4j+s://xxxx.databases.neo4j.io"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={uploadUsername}
                    onChange={(e) => setUploadUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={uploadPassword}
                    onChange={(e) => setUploadPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Database
                  </label>
                  <input
                    type="text"
                    value={uploadDatabase}
                    onChange={(e) => setUploadDatabase(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleDialogCancel}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDialogUpload}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};