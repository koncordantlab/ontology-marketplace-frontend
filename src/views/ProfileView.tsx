import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, LogOut, Save } from 'lucide-react';
import { OntologyCard } from '../components/OntologyCard';
import { userService } from '../services/userService';
import { authService } from '../services/authService';

interface User {
  id: string;
  name: string;
  email: string;
}

interface ProfileViewProps {
  onNavigate: (view: string, ontologyId?: string) => void;
  currentUser: User;
}

interface Ontology {
  id: string;
  title: string;
  description: string;
  tags: string[];
  thumbnail: string;
  lastModified: string;
}

const mockOntologies: Ontology[] = [
  {
    id: '1',
    title: 'Medical Terminology Ontology',
    description: 'Comprehensive medical terminology and relationships for healthcare applications, including diseases, treatments, and procedures.',
    tags: ['Medical', 'Healthcare', 'Clinical'],
    thumbnail: 'medical',
    lastModified: '2025-01-15'
  },
  {
    id: '2',
    title: 'E-commerce Product Catalog',
    description: 'Product categorization and attribute definitions for online retail platforms with hierarchical classification.',
    tags: ['E-commerce', 'Retail', 'Products'],
    thumbnail: 'ecommerce',
    lastModified: '2025-01-12'
  },
  {
    id: '3',
    title: 'Academic Research Classification',
    description: 'Research paper classification system with citation relationships and academic domain categorization.',
    tags: ['Academic', 'Research', 'Publications'],
    thumbnail: 'academic',
    lastModified: '2025-01-10'
  }
];

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate, currentUser }) => {
  const account = userService.getUserAccount();
  const firebaseUser = authService.getCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOntologies, setFilteredOntologies] = useState(mockOntologies);

  // Profile fields from Firebase Auth
  const [name, setName] = useState(firebaseUser?.name || currentUser.name);
  const [imageUrl, setImageUrl] = useState(firebaseUser?.photoURL || '');
  
  // Backend fields
  const [isPublic, setIsPublic] = useState(account?.is_public ?? false);

  const [initial, setInitial] = useState(() => ({
    name: firebaseUser?.name || currentUser.name,
    imageUrl: firebaseUser?.photoURL || '',
    isPublic: account?.is_public ?? false,
  }));

  // Sync initial snapshot when Firebase user data loads/changes
  useEffect(() => {
    setInitial({
      name: firebaseUser?.name || currentUser.name,
      imageUrl: firebaseUser?.photoURL || '',
      isPublic: account?.is_public ?? false,
    });
  }, [firebaseUser?.name, firebaseUser?.photoURL, account?.is_public, currentUser.name]);

  // Sync state values when Firebase user data loads (only if state is empty/unchanged)
  useEffect(() => {
    if (firebaseUser?.photoURL && !imageUrl) {
      setImageUrl(firebaseUser.photoURL);
    }
  }, [firebaseUser?.photoURL, imageUrl]);

  const isDirty = useMemo(() => {
    return name !== initial.name || imageUrl !== initial.imageUrl || isPublic !== initial.isPublic;
  }, [name, imageUrl, isPublic, initial]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = mockOntologies.filter(ontology =>
      ontology.title.toLowerCase().includes(query.toLowerCase()) ||
      ontology.description.toLowerCase().includes(query.toLowerCase()) ||
      ontology.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredOntologies(filtered);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name || currentUser.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-xl">
                    {(name || currentUser.name).split(' ').map(n => n[0]).join('')}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{name || currentUser.name}</h1>
                <p className="text-gray-600">{firebaseUser?.email || currentUser.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredOntologies.length} ontologies • Member since 2025
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
              <nav className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <button
                    onClick={() => onNavigate('new-ontology')}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 mb-4"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create New</span>
                  </button>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Categories</h4>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200">
                    All Ontologies ({mockOntologies.length})
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200">
                    Recently Modified
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200">
                    Favorites
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Tags</h4>
                  {['Medical', 'E-commerce', 'Academic', 'Research'].map((tag) => (
                    <button
                      key={tag}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Account Info Form */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={firebaseUser?.email || currentUser.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Public Profile</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500 ml-7">
                    {isPublic 
                      ? 'Your profile is visible to other users'
                      : 'Your profile is private and only visible to you'}
                  </p>
                </div>
              </div>

              {/* Actions Row: Save Changes + Log Out */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={async () => {
                    try {
                      // Update Firebase profile (name, photoURL)
                      await authService.updateUserProfile({ name, photoURL: imageUrl || undefined });
                      // Update backend (is_public) only if changed
                      if (isPublic !== initial.isPublic) {
                        await userService.updateUser(isPublic);
                      }
                      // Refresh backend cache
                      await userService.refresh();
                      // Sync snapshot so dirty state resets
                      setInitial({ name, imageUrl, isPublic });
                    } catch (e) {
                      console.error('Failed to save profile:', e);
                    }
                  }}
                  disabled={!isDirty}
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ${
                    isDirty ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={async () => {
                    try {
                      await authService.signOut();
                      userService.clear();
                      onNavigate('login');
                    } catch (e) {
                      console.error('Logout failed:', e);
                    }
                  }}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-md font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search your ontologies..."
                />
              </div>
            </div>

            {/* Ontology Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredOntologies.map((ontology) => {
                const ontologyUuid = (ontology as any).uuid || ontology.id;
                return (
                  <OntologyCard
                    key={ontology.id}
                    ontology={ontology}
                    onView={() => onNavigate('ontology-details', ontologyUuid)}
                    onEdit={() => onNavigate('edit-ontology', ontologyUuid)}
                  />
                );
              })}
            </div>

            {filteredOntologies.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">No ontologies found</div>
                <div className="text-gray-400 text-sm mb-4">
                  {searchQuery ? 'Try adjusting your search terms' : 'Create your first ontology to get started'}
                </div>
                {!searchQuery && (
                  <button
                    onClick={() => onNavigate('new-ontology')}
                    className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Create Your First Ontology</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};