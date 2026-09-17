import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Plus, Eye, EyeOff, FileText, Tag, X } from 'lucide-react';

const OntologyGraphPlaceholder: React.FC = () => (
  <svg viewBox="0 0 200 160" className="w-32 h-32 opacity-60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="75" r="18" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="2.5"/>
    <circle cx="38" cy="38" r="11" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="2"/>
    <circle cx="162" cy="38" r="11" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="2"/>
    <circle cx="30" cy="118" r="11" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="2"/>
    <circle cx="170" cy="118" r="11" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="2"/>
    <circle cx="100" cy="140" r="9" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="2"/>
    <circle cx="62" cy="148" r="7" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.5"/>
    <circle cx="138" cy="148" r="7" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.5"/>
    <line x1="100" y1="57" x2="46" y2="44" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="100" y1="57" x2="154" y2="44" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="87" y1="86" x2="39" y2="109" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="113" y1="86" x2="161" y2="109" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="100" y1="93" x2="100" y2="131" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="95" y1="139" x2="67" y2="143" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="105" y1="139" x2="133" y2="143" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
import toast from 'react-hot-toast';
import { ontologyService, Ontology } from '../services/ontologyService';
import { authService } from '../services/authService';
import { BackendApiClient } from '../config/backendApi';

interface DashboardViewProps {
  onNavigate: (view: string, id?: string) => void;
}

interface Category {
  name: string;
  count: number;
  filter: (ontology: Ontology) => boolean;
}

interface Tag {
  name: string;
  count: number;
  color: string;
}

const ITEMS_PER_PAGE = 6;

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const defaultImageUrl = (import.meta.env as any).VITE_DEFAULT_ONTOLOGY_IMAGE_URL || (import.meta.env as any).DEFAULT_ONTOLOGY_IMAGE_URL || '';
  const [ontologies, setOntologies] = useState<Ontology[]>([]);
  const [filteredOntologies, setFilteredOntologies] = useState<Ontology[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOntologies, setTotalOntologies] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({ total: 0, public: 0, private: 0, recent: 0, deleted: 0 });
  const [purgeTarget, setPurgeTarget] = useState<{ id: string; name: string } | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<{ id: string; name: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Guards against the two mount-time fetches (see below) racing and an
  // out-of-order/older response clobbering a newer one's state.
  const requestIdRef = useRef(0);

  // Load user data
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  // Refresh ontologies when auth state actually changes (e.g., login/logout).
  // onAuthStateChange fires immediately on subscribe with the current user too;
  // that initial call is redundant with the selectedCategory mount-effect below,
  // so it's skipped here to avoid firing two concurrent identical fetches.
  useEffect(() => {
    let isInitialCallback = true;
    const unsubscribe = authService.onAuthStateChange((u) => {
      if (isInitialCallback) {
        isInitialCallback = false;
        setUser(u);
        return;
      }
      setUser(u);
      // Re-load ontologies so private ones appear after login
      loadOntologies();
      loadCategoryCounts();
    });
    return unsubscribe;
  }, []);

  // Load category counts once on mount.
  useEffect(() => {
    loadCategoryCounts();
  }, []);

  // (Re)load ontologies whenever the active category changes.
  // Also covers initial mount since selectedCategory has an initial value.
  useEffect(() => {
    loadOntologies(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const loadCategoryCounts = async () => {
    try {
      const counts = await BackendApiClient.getOntologyCounts();
      setCategoryCounts(counts);
    } catch (e) {
      console.error('Error loading category counts:', e);
    }
  };

  // Client-side narrowing of the currently-loaded page by search query.
  // Not used while the page only holds 6 items (search goes to the backend
  // via handleSubmitSearch). Kept for re-use if ITEMS_PER_PAGE grows.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const filterByQuery = (list: Ontology[], query: string) => {
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter(o =>
      o.name.toLowerCase().includes(q) ||
      o.description.toLowerCase().includes(q)
    );
  };

  // Apply tag filter client-side to the currently-loaded page.
  // Category filtering happens server-side via loadOntologies.
  useEffect(() => {
    let filtered = ontologies;

    if (selectedTags.length > 0) {
      filtered = filtered.filter(ontology => {
        const ontologyTags = ontology.tags || [];
        return selectedTags.some((tag: string) => ontologyTags.includes(tag));
      });
    }

    setFilteredOntologies(filtered);
  }, [ontologies, selectedTags]);

  // Map selectedCategory state into backend filter params.
  const getCategoryFilters = (category: string): { isPublic?: boolean; recentOnly?: boolean; deletedOnly?: boolean } => {
    switch (category) {
      case 'public': return { isPublic: true };
      case 'private': return { isPublic: false };
      case 'recently-modified': return { recentOnly: true };
      case 'recently-deleted': return { deletedOnly: true };
      default: return {};
    }
  };

  const loadOntologies = async (page = 1, term: string = submittedSearchTerm, category: string = selectedCategory) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError('');

    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const filters = getCategoryFilters(category);
      const result = await ontologyService.searchOntologies({
        limit: ITEMS_PER_PAGE,
        offset,
        searchTerm: term || undefined,
        ...filters,
      });
      // A newer loadOntologies call has since started; its result should win, not this one.
      if (requestId !== requestIdRef.current) return;
      if (result.success && result.data) {
        setOntologies(result.data);
        setTotalOntologies(result.total ?? result.data.length);
        setCurrentPage(page);
      } else {
        setError(result.error || 'Failed to load ontologies');
      }
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error('Error loading ontologies:', error);
      setError('Failed to load ontologies');
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleSubmitSearch = () => {
    const term = searchQuery.trim();
    setSubmittedSearchTerm(term);
    loadOntologies(1, term);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (submittedSearchTerm) {
      setSubmittedSearchTerm('');
      loadOntologies(1, '');
    }
  };

  const handleRestore = (ontologyId: string, ontologyName: string) => {
    setRestoreTarget({ id: ontologyId, name: ontologyName });
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return;
    setIsRestoring(true);
    try {
      const result = await ontologyService.restoreOntology(restoreTarget.id);
      if (result.success) {
        await loadOntologies(currentPage);
        await loadCategoryCounts();
        toast.success('Ontology restored successfully.');
        setRestoreTarget(null);
      } else {
        toast.error(result.error || 'Failed to restore ontology');
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePurge = (ontologyId: string, ontologyName: string) => {
    setPurgeTarget({ id: ontologyId, name: ontologyName });
  };

  const confirmPurge = async () => {
    if (!purgeTarget) return;
    setIsPurging(true);
    try {
      const result = await ontologyService.purgeOntology(purgeTarget.id);
      if (result.success) {
        await loadOntologies(currentPage);
        await loadCategoryCounts();
        toast.success('Ontology permanently deleted.');
        setPurgeTarget(null);
      } else {
        toast.error(result.error || 'Failed to permanently delete ontology');
      }
    } finally {
      setIsPurging(false);
    }
  };

  // Auto-reset to full list when the user clears the input
  useEffect(() => {
    if (searchQuery === '' && submittedSearchTerm !== '') {
      setSubmittedSearchTerm('');
      loadOntologies(1, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Tags now provided by backend per ontology; no local heuristics.

  // Generate categories dynamically using server-side counts
  const categories: Category[] = useMemo(() => [
    {
      name: 'All Ontologies',
      count: categoryCounts.total,
      filter: () => true
    },
    {
      name: 'Recently Modified',
      count: categoryCounts.recent,
      filter: (onto: Ontology) => {
        const date = new Date(onto.updatedAt || onto.createdAt || '');
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date > weekAgo;
      }
    },
    {
      name: 'Public',
      count: categoryCounts.public,
      filter: (onto: Ontology) => onto.properties?.is_public || false
    },
    {
      name: 'Private',
      count: categoryCounts.private,
      filter: (onto: Ontology) => !onto.properties?.is_public
    },
    {
      name: 'Recently Deleted',
      count: categoryCounts.deleted,
      filter: () => true
    }
  ], [categoryCounts]);

  // Generate tags dynamically
  const generateTags = (): Tag[] => {
    const tagCounts: { [key: string]: number } = {};
    
    ontologies.forEach(ontology => {
      const tags = ontology.tags || [];
      tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const tagColors = {
      'Medical': 'bg-blue-100 text-blue-800',
      'E-commerce': 'bg-green-100 text-green-800',
      'Academic': 'bg-purple-100 text-purple-800',
      'Research': 'bg-orange-100 text-orange-800'
    };

    return Object.entries(tagCounts).map(([name, count]) => ({
      name,
      count,
      color: tagColors[name as keyof typeof tagColors] || 'bg-gray-100 text-gray-800'
    }));
  };

  const tags = useMemo(() => generateTags(), [ontologies]);

  const handleTagClick = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(tag => tag !== tagName)
        : [...prev, tagName]
    );
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    
    try {
      let dateObj: Date;
      
      // If it's already a Date object
      if (date instanceof Date) {
        dateObj = date;
      } else {
        // Try to parse the date
        dateObj = new Date(date);
      }
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date:', date);
        return '';
      }
      
      return dateObj.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Date value:', date);
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user?.name || 'Anonymous User'}</h1>
              {user ? (
                <>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500">
                    {totalOntologies} ontologies • Member since {new Date().getFullYear()}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  Log in to create and edit
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex space-x-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            {/* Quick Actions */}
            {user && (
              <div className="mb-6">
                <button
                  onClick={() => onNavigate('new-ontology')}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New</span>
                </button>
              </div>
            )}

            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Categories</h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name.toLowerCase().replace(/\s+/g, '-'))}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-200 ${
                      selectedCategory === category.name.toLowerCase().replace(/\s+/g, '-')
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{category.name}</span>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                        {category.count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
              <div className="space-y-2">
                {tags.map((tag) => (
                  <button
                    key={tag.name}
                    onClick={() => handleTagClick(tag.name)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-200 flex items-center justify-between ${
                      selectedTags.includes(tag.name)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Tag className="h-3 w-3" />
                      <span>{tag.name}</span>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                      {tag.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmitSearch();
                    }
                  }}
                  placeholder="Search your ontologies..."
                  className="w-full pl-10 pr-40 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      aria-label="Clear search"
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleSubmitSearch}
                      className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                      Search
                    </button>
                  )}
                </div>
              </div>
              {submittedSearchTerm && (
                <p className="text-xs text-gray-500 mt-2">
                  Showing results for <span className="font-medium text-gray-700">"{submittedSearchTerm}"</span> — clear the box to return to all ontologies.
                </p>
              )}
            </div>

            {/* Ontologies Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-500">Loading ontologies...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => loadOntologies()}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : filteredOntologies.length > 0 ? (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOntologies.map((ontology) => {
                  const ontologyUuid = (ontology as any).uuid || ontology.id;
                  if (!ontologyUuid) return null; // Skip if no UUID/ID

                  const isTrashView = selectedCategory === 'recently-deleted';

                  return (
                  <div
                    key={ontology.id}
                    onClick={() => { if (!isTrashView) onNavigate('ontology-details', ontologyUuid); }}
                    className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 ${isTrashView ? '' : 'cursor-pointer'}`}
                  >
                    {/* Thumbnail */}
                    <div className="h-56 bg-gray-50 rounded-t-lg flex items-center justify-center overflow-hidden">
                      {((ontology.properties?.image_url && ontology.properties.image_url.trim()) || defaultImageUrl) ? (
                        <img
                          src={(ontology.properties?.image_url && ontology.properties.image_url.trim()) ? ontology.properties.image_url : defaultImageUrl}
                          alt={`${ontology.name} thumbnail`}
                          loading="lazy"
                          width={400}
                          height={224}
                          className="max-h-full max-w-full object-contain rounded-t-lg"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            if (defaultImageUrl && img.src !== defaultImageUrl) {
                              img.src = defaultImageUrl;
                            } else {
                              img.style.display = 'none';
                              const fallback = img.nextElementSibling as HTMLElement;
                              if (fallback) {
                                fallback.style.display = 'flex';
                              }
                            }
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full flex items-center justify-center" style={{ display: (((ontology.properties?.image_url && ontology.properties.image_url.trim()) ? ontology.properties.image_url : defaultImageUrl)) ? 'none' : 'flex' }}>
                        <OntologyGraphPlaceholder />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 truncate">{ontology.name || 'Untitled Ontology'}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ontology.description}</p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {(ontology.tags || []).slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {(ontology.tags || []).length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            +{(ontology.tags || []).length - 3}
                          </span>
                        )}
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            ontology.properties?.is_public 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {ontology.properties?.is_public ? (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                Public
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 mr-1" />
                                Private
                              </>
                            )}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(ontology.updatedAt || ontology.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          {isTrashView ? (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRestore(ontologyUuid, ontology.name || 'Untitled Ontology'); }}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Restore
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handlePurge(ontologyUuid, ontology.name || 'Untitled Ontology'); }}
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                              >
                                Delete forever
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigate('ontology-details', ontologyUuid);
                              }}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )})}
              </div>

              {/* Pagination Controls */}
              {(() => {
                const totalPages = Math.ceil(totalOntologies / ITEMS_PER_PAGE);
                if (totalPages <= 1) return null;

                const windowSize = 1;
                const items: (number | 'ellipsis-left' | 'ellipsis-right')[] = [];
                items.push(1);
                const windowStart = Math.max(2, currentPage - windowSize);
                const windowEnd = Math.min(totalPages - 1, currentPage + windowSize);
                if (windowStart > 2) items.push('ellipsis-left');
                for (let i = windowStart; i <= windowEnd; i++) items.push(i);
                if (windowEnd < totalPages - 1) items.push('ellipsis-right');
                if (totalPages > 1) items.push(totalPages);

                return (
                  <div className="flex items-center justify-between mt-8">
                    <p className="text-sm text-gray-600">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalOntologies)} of {totalOntologies}
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => loadOntologies(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Previous
                      </button>
                      {items.map((item, idx) =>
                        typeof item === 'number' ? (
                          <button
                            key={item}
                            onClick={() => loadOntologies(item)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                              currentPage === item
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {item}
                          </button>
                        ) : (
                          <span key={`${item}-${idx}`} className="px-2 text-sm text-gray-400 select-none">…</span>
                        )
                      )}
                      <button
                        onClick={() => loadOntologies(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                );
              })()}
              </>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No ontologies found</h3>
                <p className="text-sm text-gray-600 mb-6">
                  {searchQuery || selectedCategory !== 'all' || selectedTags.length > 0
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first ontology'
                  }
                </p>
                <button
                  onClick={() => onNavigate('new-ontology')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Create Your First Ontology
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Restore Confirmation Dialog */}
      {restoreTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-blue-700">Restore ontology?</h2>
            <p className="text-sm text-gray-700 mb-4">
              <span className="font-medium">"{restoreTarget.name}"</span> will be moved back to your active ontologies.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setRestoreTarget(null)}
                disabled={isRestoring}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRestore}
                disabled={isRestoring}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isRestoring ? 'Restoring...' : 'Yes, restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purge Confirmation Dialog */}
      {purgeTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-red-700">Delete forever?</h2>
            <p className="text-sm text-gray-700 mb-2">
              You are about to permanently delete <span className="font-medium">"{purgeTarget.name}"</span>.
            </p>
            <p className="text-sm text-gray-700 mb-4">
              This cannot be undone. All comments and reactions on this ontology will also be removed.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setPurgeTarget(null)}
                disabled={isPurging}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurge}
                disabled={isPurging}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isPurging ? 'Deleting...' : 'Yes, delete forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
