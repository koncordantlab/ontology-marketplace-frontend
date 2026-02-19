import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Heart, Bookmark } from 'lucide-react';
import { CommentSystem } from '../components/CommentSystem';
import { TagManagerDialog } from '../components/TagManagerDialog';
import { ontologyService, Ontology } from '../services/ontologyService';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { cloudinaryService } from '../services/cloudinaryService';
import { BackendApiClient } from '../config/backendApi';

interface OntologyDetailsViewProps {
  ontologyId: string | null;
  onNavigate?: (view: string, ontologyId?: string) => void;
  showToastSuccess?: (message: string) => void;
  showToastError?: (message: string) => void;
}

export const OntologyDetailsView: React.FC<OntologyDetailsViewProps> = ({
  ontologyId,
  onNavigate,
  showToastSuccess,
  showToastError
}) => {
  const [ontology, setOntology] = useState<Ontology | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [editable, setEditable] = useState<Ontology | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadUri, setUploadUri] = useState('');
  const [uploadUsername, setUploadUsername] = useState('neo4j');
  const [uploadPassword, setUploadPassword] = useState('');
  const [uploadDatabase, setUploadDatabase] = useState('neo4j');
  const [uploadRootLabel, setUploadRootLabel] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');

  // Tag editor state
  const [editTagIndex, setEditTagIndex] = useState<number | null>(null);
  const [editTagValue, setEditTagValue] = useState('');
  // Tag dialog state
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [selectedDialogTags, setSelectedDialogTags] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  // Like/Save state
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const fetchOntology = async (retryCount = 0) => {
      if (!ontologyId) {
        setError('No ontology ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await ontologyService.searchOntologies();

        if (result.success && result.data) {
          // Find by UUID first, then fallback to ID for backward compatibility
          const foundOntology = result.data.find(ont =>
            (ont as any).uuid === ontologyId || ont.id === ontologyId
          );
          if (foundOntology) {
            setOntology(foundOntology);
          } else if (retryCount < 3) {
            // Retry after a short delay for newly created ontologies
            // that may not yet appear in search results
            setTimeout(() => fetchOntology(retryCount + 1), 1000);
            return; // Don't set loading to false yet
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

  // Check permissions using cached user account data from single /get_user call
  useEffect(() => {
    const checkPermissionsAsync = async () => {
      if (!ontologyId) {
        setCanEdit(false);
        setCanDelete(false);
        setPermissionsLoading(false);
        console.log('No ontology ID; cannot check permissions');
        return;
      }
      
      const ontologyUuid = (ontology && (ontology as any).uuid) || ontologyId;
      const currentUser = authService.getCurrentUser();
      
      // Optimistic check: if user owns the ontology, assume they can edit immediately
      const isOwner = currentUser && ontology?.ownerId && ontology.ownerId === currentUser.id;
      
      // Set optimistic permissions IMMEDIATELY for owners (before checking cache)
      if (isOwner) {
        setCanEdit(true);
        setCanDelete(true);
      }
      
      // Helper to check permissions from userAccount
      const checkPermissions = (userAccount: ReturnType<typeof userService.getUserAccount>): { canEdit: boolean; canDelete: boolean } => {
        if (!userAccount) return { canEdit: false, canDelete: false };
        const normalizedId = ontologyUuid.trim();
        return {
          canEdit: Boolean(userAccount.permissions.can_edit_ontologies.includes(normalizedId) || isOwner),
          canDelete: Boolean(userAccount.permissions.can_delete_ontologies.includes(normalizedId) || isOwner),
        };
      };
      
      let userAccount = userService.getUserAccount();
      const needsRefresh = !userAccount || userService.isStale();
      const isRefreshing = userService.isRefreshing();
      
      // If cache needs refresh OR a refresh is already in progress, await it FIRST
      // This ensures we wait for App.tsx's refresh if it's already running
      if (needsRefresh || isRefreshing) {
        setPermissionsLoading(true);
        try {
          // Await refresh - this will either:
          // 1. Start a new refresh if none in progress
          // 2. Wait for the in-progress refresh from App.tsx if one exists
          // 3. Return immediately if cache is fresh (though we check this above)
          await userService.refresh();
          // After refresh completes, get the updated account
          userAccount = userService.getUserAccount();
        } catch (error) {
          console.error('Failed to refresh user account:', error);
          // On error, keep optimistic permissions for owners
          if (!isOwner) {
            setCanEdit(false);
            setCanDelete(false);
          }
          setPermissionsLoading(false);
          return;
        }
      }
      
      // Now check permissions with the (refreshed) cache
      const permissions = checkPermissions(userAccount);
      setCanEdit(permissions.canEdit);
      setCanDelete(permissions.canDelete);
      setPermissionsLoading(false);
    };
    
    checkPermissionsAsync();
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
      node_count: ontology.node_count ?? null,
      relationship_count: ontology.relationship_count ?? null,
      tags: ontology.tags || [],
    };
    const cur = {
      name: editable.name,
      description: editable.description,
      source_url: editable.properties?.source_url || '',
      image_url: editable.properties?.image_url || '',
      is_public: !!editable.properties?.is_public,
      node_count: editable.node_count ?? null,
      relationship_count: editable.relationship_count ?? null,
      tags: editable.tags || [],
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
    setSaveError(null);
    setSaveSuccess(false);
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
        node_count: editable.node_count ?? ontology.node_count ?? null,
        relationship_count: editable.relationship_count ?? ontology.relationship_count ?? null,
        score: ontology.score ?? null,
        tags: editable.tags ?? ontology.tags ?? [],
      };

      const result = await BackendApiClient.updateOntology(ontologyUuid, updates);
      if ((result as any)?.success === false) {
        throw new Error((result as any)?.error || 'Failed to update ontology');
      }
      // Refresh user account cache after successful update (permissions may have changed)
      userService.refresh().catch((error) => {
        console.error('Failed to refresh user account after update:', error);
      });
      // Refresh local state
      setOntology({ ...editable, id: ontology.id, properties: { ...editable.properties, image_url: imageUrlToSave } });
      // Clear selected image state after successful save
      clearSelectedImage();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error('Save failed:', e);
      const msg = e instanceof Error ? e.message : 'Failed to update ontology';
      setSaveError(msg);
      setTimeout(() => setSaveError(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = () => {
    console.log('Uploading ontology to database:', ontologyId);
    // Navigate to use ontology view for database upload
    onNavigate('use-ontology', ontologyId || undefined);
  };

  const handleConfirmDelete = async () => {
    if (!ontology) return;
    const ontologyUuid = (ontology as any).uuid || ontology.id;
    if (!ontologyUuid) return;
    setIsDeleting(true);
    try {
      await BackendApiClient.deleteOntology(ontologyUuid);
      showToastSuccess?.("Ontology deleted successfully.");
      // After deletion, navigate back to dashboard if handler provided
      if (onNavigate) {
        onNavigate('dashboard');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToastError?.("Failed to delete ontology.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDialogCancel = () => {
    setShowUploadDialog(false);
    setUploadUri('');
    setUploadPassword('');
    setUploadRootLabel('');
    setConnectionStatus('idle');
    setConnectionMessage('');
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

  const handleDialogUpload = async () => {
    if (!uploadUri || !uploadPassword || !ontology) {
      alert('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    try {
      const payload: Record<string, string> = {
        neo4j_uri: uploadUri,
        neo4j_username: uploadUsername,
        neo4j_password: uploadPassword,
        neo4j_database: uploadDatabase,
        source_url: ontology.properties?.source_url || ontology.file_url || ''
      };

      if (uploadRootLabel.trim()) {
        payload.root_label = uploadRootLabel.trim();
      }

      await BackendApiClient.request('/upload_ontology', {
        method: 'POST',
        body: payload,
      });

      showToastSuccess?.('Ontology uploaded successfully!');
      setShowUploadDialog(false);
      setUploadUri('');
      setUploadPassword('');
      setUploadRootLabel('');
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload ontology');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = () => {
    const ontologyUuid = ontology ? ((ontology as any).uuid || ontology.id) : ontologyId;
    const url = `#edit-ontology?id=${ontologyUuid}`;
    window.open(url, '_blank');
  };

  const handleLike = () => {
    if (isLiked) {
      setLikeCount(prev => prev - 1);
    } else {
      setLikeCount(prev => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleToggleBookmark = () => {
    setIsSaved(!isSaved);
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
        {/* Two-column layout: Details (2/3) on left, Comments (1/3) on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Details Panel (2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Two-column header section: Image/Actions on left, Title/Description on right */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Left column: Image and Like/Save buttons */}
            <div className="md:col-span-1">
              {/* Image */}
              {ontology.properties?.image_url && (
                <div className="mb-4 flex items-center justify-center">
                  <img
                    src={ontology.properties.image_url}
                    alt={ontology.name}
                    className="w-full max-h-48 object-contain rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Like/Save buttons */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md border transition-colors duration-200 ${
                    isLiked
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{likeCount > 0 ? likeCount : 'Like'}</span>
                </button>
                <button
                  onClick={handleToggleBookmark}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md border transition-colors duration-200 ${
                    isSaved
                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{isSaved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>

            {/* Right column: Title and Description */}
            <div className="md:col-span-2 space-y-4">
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
            </div>
          </div>

          {/* Single column section: Tags and below */}
          <div className="space-y-4">
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

              {(ontology.node_count || ontology.relationship_count) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statistics
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {ontology.node_count && (
                      <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900">
                        <span className="text-gray-500">Nodes:</span> {ontology.node_count.toLocaleString()}
                      </div>
                    )}
                    {ontology.relationship_count && (
                      <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900">
                        <span className="text-gray-500">Relationships:</span> {ontology.relationship_count.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Success/Error Messages */}
              {saveSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                  Ontology updated successfully.
                </div>
              )}
              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                  {saveError}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={handleEdit}
                  className="px-8 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  EDIT
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
          </div>

          {/* Right column: Comments (1/3) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">COMMENTS</h2>

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Root Label (optional)
                  </label>
                  <input
                    type="text"
                    value={uploadRootLabel}
                    onChange={(e) => setUploadRootLabel(e.target.value)}
                    placeholder="e.g. Spatial Object"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Start tree from a specific label (leave empty for all roots)</p>
                </div>
              </div>

              {/* Connection Status */}
              {connectionStatus !== 'idle' && (
                <div className={`mt-4 p-3 rounded-md text-sm ${
                  connectionStatus === 'testing' ? 'bg-blue-50 text-blue-700' :
                  connectionStatus === 'success' ? 'bg-green-50 text-green-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {connectionStatus === 'testing' ? 'Testing connection...' : connectionMessage}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleDialogCancel}
                  disabled={isUploading || connectionStatus === 'testing'}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTestConnection}
                  disabled={isUploading || connectionStatus === 'testing'}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={handleDialogUpload}
                  disabled={isUploading || connectionStatus === 'testing'}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-red-700">Confirm Deletion</h2>
              <p className="text-sm text-gray-700 mb-4">
                This action cannot be undone. Are you sure you want to permanently delete this ontology?
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tag Management Dialog */}
        {showTagDialog && (
          <TagManagerDialog
            open={showTagDialog}
            initialSelected={selectedDialogTags}
            onClose={() => setShowTagDialog(false)}
            onSave={(committed) => {
              setEditable(prev => prev ? { ...prev, tags: committed } as any : prev);
              setShowTagDialog(false);
            }}
          />
        )}
      </div>
    </div>
  );
};