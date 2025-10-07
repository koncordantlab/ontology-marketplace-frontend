import React, { useState, useEffect } from 'react';
import { Plus, ExternalLink, Loader, CheckCircle, AlertCircle, Save, Upload } from 'lucide-react';
import { ThumbnailUpload } from './ThumbnailUpload';
import { FirebaseFunctionCaller } from '../config/firebaseFunctions';
import { ontologyService, Ontology } from '../services/ontologyService';

interface OntologyFormProps {
  mode: 'create' | 'edit';
  ontologyId?: string | null;
  initialData?: Partial<Ontology>;
  onNavigate: (view: string, ontologyId?: string) => void;
  onSuccess?: (ontology: Ontology) => void;
}

export const OntologyForm: React.FC<OntologyFormProps> = ({
  mode,
  ontologyId,
  initialData,
  onNavigate,
  onSuccess
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [ontologyUrl, setOntologyUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processError, setProcessError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form with data
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setTitle(initialData.name || '');
      setDescription(initialData.description || '');
      setTags(initialData.properties?.tags?.join(', ') || '');
      setOntologyUrl(initialData.properties?.source_url || '');
      setIsPublic(initialData.properties?.is_public || false);
      setThumbnailUrl(initialData.properties?.image_url || '');
    }
  }, [mode, initialData]);

  const handleProcessUrl = async () => {
    if (!ontologyUrl.trim()) {
      setProcessError('Please enter a valid URL');
      return;
    }

    setIsProcessing(true);
    setProcessError('');

    try {
      const processResult = await FirebaseFunctionCaller.processOntologyUrl(ontologyUrl, false);
      
      // Update form with processed data if available
      if (processResult.name) setTitle(processResult.name);
      if (processResult.description) setDescription(processResult.description);
      if (processResult.thumbnailUrl) setThumbnailUrl(processResult.thumbnailUrl);
      
    } catch (error) {
      setProcessError('Failed to process URL. Please check the URL and try again.');
      console.error('Error processing URL:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setSaveError('Title and description are required');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      let result;

      if (mode === 'create') {
        result = await ontologyService.createOntology(
          title,
          description,
          isPublic,
          ontologyUrl || undefined,
          thumbnailUrl || undefined
        );
      } else {
        // Edit mode - update existing ontology
        if (!ontologyId) {
          setSaveError('Ontology ID is required for editing');
          return;
        }

        const updatePayload = {
          name: title,
          description: description,
          properties: {
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            source_url: ontologyUrl || '',
            image_url: thumbnailUrl || '',
            is_public: isPublic
          }
        };

        console.log('Update payload with thumbnailUrl:', thumbnailUrl);
        console.log('Full update payload:', updatePayload);

        const updateResult = await ontologyService.updateOntology(ontologyId, updatePayload);
        // Map the response to match expected structure
        result = updateResult.success
          ? { ontology: updateResult.data }
          : { error: updateResult.error || 'Failed to update ontology' };
      }

      if (result.error) {
        setSaveError(result.error);
      } else if (result.ontology) {
        setSaveSuccess(true);
        onSuccess?.(result.ontology);
        
        // Navigate after success
        setTimeout(() => {
          onNavigate('ontology-details', result.ontology?.id);
        }, 1500);
      }
    } catch (error) {
      setSaveError(`Failed to ${mode} ontology. Please try again.`);
      console.error(`Error ${mode}ing ontology:`, error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleThumbnailUploaded = (url: string) => {
    setThumbnailUrl(url);
  };

  const handleThumbnailError = (error: string) => {
    setSaveError(`Thumbnail upload failed: ${error}`);
  };

  const isFormValid = title.trim() && description.trim();
  const isProcessingOrSaving = isProcessing || isSaving;
  const isCreateMode = mode === 'create';

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {isCreateMode ? 'Create New Ontology' : 'Edit Ontology'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isCreateMode ? 'Create a new ontology or import from URL' : 'Update your ontology details'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Enter ontology title"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
                  placeholder="Describe your ontology"
                />
              </div>

              <div>
                <label htmlFor="ontology-url" className="block text-sm font-medium text-gray-700 mb-2">
                  Source URL (Optional)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    id="ontology-url"
                    value={ontologyUrl}
                    onChange={(e) => setOntologyUrl(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="https://example.com/ontology.owl"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Only OWL (Web Ontology Language) format is supported
                </p>
                
                {/* Process URL Button */}
                {ontologyUrl.trim() && (
                  <button
                    type="button"
                    onClick={handleProcessUrl}
                    disabled={isProcessing}
                    className="mt-2 flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Process URL</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Comma-separated tags"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Make this ontology public</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Public ontologies can be viewed by all users
                </p>
              </div>
            </div>

            {/* Right Column - Thumbnail and Submit Button */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail (Optional)
                </label>
                <ThumbnailUpload
                  onThumbnailUploaded={handleThumbnailUploaded}
                  onError={handleThumbnailError}
                />
              </div>

              {/* Error Messages */}
              {processError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-800">{processError}</p>
                </div>
              )}

              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-800">{saveError}</p>
                </div>
              )}

              {/* Success Message */}
              {saveSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-800">
                    Ontology {isCreateMode ? 'created' : 'updated'} successfully!
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid || isProcessingOrSaving}
                className={`w-full px-6 py-3 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center space-x-2 ${
                  !isFormValid || isProcessingOrSaving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isProcessingOrSaving ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>
                      {isProcessing ? 'PROCESSING...' : (isCreateMode ? 'CREATING...' : 'UPDATING...')}
                    </span>
                  </>
                ) : (
                  <>
                    {isCreateMode ? (
                      <>
                        <Plus className="h-5 w-5" />
                        <span>CREATE ONTOLOGY</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        <span>UPDATE ONTOLOGY</span>
                      </>
                    )}
                  </>
                )}
              </button>

              <div className="text-xs text-gray-500 text-center">
                {isPublic ? 'This ontology will be published publicly' : 'This ontology will be saved as private'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
