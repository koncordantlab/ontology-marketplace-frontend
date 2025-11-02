import React, { useEffect, useState } from 'react';
import { BackendApiClient } from '../config/backendApi';

interface TagManagerDialogProps {
  open: boolean;
  initialSelected?: string[];
  onClose: () => void;
  onSave: (tags: string[]) => void;
}

export const TagManagerDialog: React.FC<TagManagerDialogProps> = ({
  open,
  initialSelected = [],
  onClose,
  onSave,
}) => {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialSelected);
  const [newTag, setNewTag] = useState('');
  const [tempNewTags, setTempNewTags] = useState<string[]>([]);

  useEffect(() => {
    setSelectedTags(initialSelected);
  }, [initialSelected, open]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const tags = await BackendApiClient.getTags();
        setAvailableTags(Array.isArray(tags) ? tags : []);
      } catch {
        setAvailableTags([]);
      }
    })();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Manage Tags</h2>

        <div className="space-y-4 max-h-[60vh] overflow-auto pr-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.length === 0 && (
                <span className="text-sm text-gray-500">No tags available</span>
              )}
              {availableTags.map((tag) => {
                const selected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSelectedTags((prev) =>
                        selected ? prev.filter((t) => t !== tag) : [...prev, tag]
                      );
                    }}
                    className={`px-2 py-1 rounded-full text-xs border ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Create New Tag</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTag.trim()) {
                    const tag = newTag.trim();
                    setTempNewTags((prev) => Array.from(new Set([...prev, tag])));
                    setSelectedTags((prev) => Array.from(new Set([...prev, tag])));
                    setNewTag('');
                  }
                }}
                placeholder="Enter a new tag"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newTag.trim()) return;
                  const tag = newTag.trim();
                  setTempNewTags((prev) => Array.from(new Set([...prev, tag])));
                  setSelectedTags((prev) => Array.from(new Set([...prev, tag])));
                  setNewTag('');
                }}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            {tempNewTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tempNewTags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        setTempNewTags((prev) => prev.filter((t) => t !== tag));
                        setSelectedTags((prev) => prev.filter((t) => t !== tag));
                      }}
                      className="text-green-900/70 hover:text-green-900"
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(Array.from(new Set(selectedTags)))}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};


