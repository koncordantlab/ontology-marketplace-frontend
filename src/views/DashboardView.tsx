import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, EyeOff, FileText, Tag } from 'lucide-react';
import { ontologyService, Ontology } from '../services/ontologyService';
import { authService } from '../services/authService';

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

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const defaultImageUrl = (import.meta.env as any).VITE_DEFAULT_ONTOLOGY_IMAGE_URL || (import.meta.env as any).DEFAULT_ONTOLOGY_IMAGE_URL || '';
  const [ontologies, setOntologies] = useState<Ontology[]>([]);
  const [filteredOntologies, setFilteredOntologies] = useState<Ontology[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  // Load user data
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  // Refresh ontologies when auth state changes (e.g., after login)
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((u) => {
      setUser(u);
      // Re-load ontologies so private ones appear after login
      loadOntologies();
    });
    return unsubscribe;
  }, []);

  // Load ontologies
  useEffect(() => {
    loadOntologies();
  }, []);

  // Filter ontologies based on search, category, and tags
  useEffect(() => {
    let filtered = ontologies;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(ontology =>
        ontology.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ontology.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      const category = categories.find(cat => cat.name.toLowerCase().replace(/\s+/g, '-') === selectedCategory);
      if (category) {
        filtered = filtered.filter(category.filter);
      }
    }

    // Apply tag filters
    if (selectedTags.length > 0) {
      filtered = filtered.filter(ontology => {
        const ontologyTags = ontology.tags || [];
        return selectedTags.some((tag: string) => ontologyTags.includes(tag));
      });
    }

    setFilteredOntologies(filtered);
  }, [ontologies, searchQuery, selectedCategory, selectedTags]);

  const loadOntologies = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await ontologyService.searchOntologies();
      if (result.success && result.data) {
        setOntologies(result.data);
      } else {
        setError(result.error || 'Failed to load ontologies');
      }
    } catch (error) {
      console.error('Error loading ontologies:', error);
      setError('Failed to load ontologies');
    } finally {
      setIsLoading(false);
    }
  };

  // Tags now provided by backend per ontology; no local heuristics.

  // Generate categories dynamically
  const categories: Category[] = [
    {
      name: 'All Ontologies',
      count: ontologies.length,
      filter: () => true
    },
    {
      name: 'Recently Modified',
      count: ontologies.filter(onto => {
        const date = new Date(onto.updatedAt || onto.createdAt || '');
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date > weekAgo;
      }).length,
      filter: (onto) => {
        const date = new Date(onto.updatedAt || onto.createdAt || '');
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date > weekAgo;
      }
    },
    {
      name: 'Public',
      count: ontologies.filter(onto => onto.properties?.is_public).length,
      filter: (onto) => onto.properties?.is_public || false
    },
    {
      name: 'Private',
      count: ontologies.filter(onto => !onto.properties?.is_public).length,
      filter: (onto) => !onto.properties?.is_public
    }
  ];

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

  const tags = generateTags();

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
                    {ontologies.length} ontologies • Member since {new Date().getFullYear()}
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
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your ontologies..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
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
                  onClick={loadOntologies}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : filteredOntologies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOntologies.map((ontology) => (
                  <div 
                    key={ontology.id} 
                    onClick={() => {
                      const url = `#ontology-details?id=${ontology.id}`;
                      const target = `ontology-${ontology.id}`;
                      window.open(url, target);
                    }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  >
                    {/* Thumbnail */}
                    <div className="h-56 bg-gray-50 rounded-t-lg flex items-center justify-center overflow-hidden">
                      {((ontology.properties?.image_url && ontology.properties.image_url.trim()) || defaultImageUrl) ? (
                        <img
                          src={(ontology.properties?.image_url && ontology.properties.image_url.trim()) ? ontology.properties.image_url : defaultImageUrl}
                          alt={`${ontology.name} thumbnail`}
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
                        <FileText className="w-12 h-12 text-gray-400" />
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
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = `#ontology-details?id=${ontology.id}`;
                              const target = `ontology-${ontology.id}`;
                              window.open(url, target);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
    </div>
  );
};
