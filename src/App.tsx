import React, { useState, useEffect } from 'react';
import { User, Menu, X, Upload } from 'lucide-react';
import { UseOntologyView } from './views/UseOntologyView';
import { OntologyDetailsView } from './views/OntologyDetailsView';
// import { EditOntologyView } from './views/EditOntologyView';
import { NewOntologyView } from './views/NewOntologyView';
import { DashboardView } from './views/DashboardView';
import { LoginView } from './views/LoginView';
import { UserProfileSettings } from './components/UserProfileSettings';
import { authService } from './services/authService';
import { userService } from './services/userService';
import toast, { Toaster } from 'react-hot-toast';

type ViewType = 'login' | 'dashboard' | 'use-ontology' | 'ontology-details' | 'edit-ontology' | 'new-ontology';

interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
}

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [selectedOntologyId, setSelectedOntologyId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingHash, setPendingHash] = useState<string | null>(null);

  // Universal upload dialog state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadUri, setUploadUri] = useState('');
  const [uploadUsername, setUploadUsername] = useState('neo4j');
  const [uploadPassword, setUploadPassword] = useState('');
  const [uploadDatabase, setUploadDatabase] = useState('neo4j');
  const [uploadRootLabel, setUploadRootLabel] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadConnectionStatus, setUploadConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [uploadConnectionMessage, setUploadConnectionMessage] = useState('');

  // Simplified hash parser - processes hash into view and ID
  const parseHash = (hash: string): { view: ViewType | null; id: string | null } => {
    if (!hash) return { view: null, id: null };

    const hashContent = hash.substring(1); // Remove #

    // Format: #ontology-details/uuid
    const parts = hashContent.split('/');
    if (parts.length === 2) {
      const [view, id] = parts;
      if (id && ['ontology-details', 'edit-ontology'].includes(view)) {
        return { view: view as ViewType, id };
      }
    }

    // Format: #dashboard or single view name
    if (parts.length === 1) {
      const part = parts[0];
      if (part === 'dashboard' || part === 'new-ontology') {
        return { view: part as ViewType, id: null };
      }
      if (part === 'ontology-details' || part === 'edit-ontology') {
        return { view: part as ViewType, id: null };
      }
      // Assume UUID if not a known view name
      if (part && part.length > 0) {
        return { view: 'ontology-details', id: part };
      }
    }

    // Legacy format: #ontology-details?id=uuid
    const legacyMatch = hashContent.match(/^([^?]+)\?id=(.+)$/);
    if (legacyMatch) {
      const [, view, id] = legacyMatch;
      if (id && ['ontology-details', 'edit-ontology'].includes(view)) {
        return { view: view as ViewType, id };
      }
    }

    return { view: null, id: null };
  };

  useEffect(() => {
    // Check for hash URL on initial load
    const hash = window.location.hash;
    if (hash) {
      setPendingHash(hash);
    }

    // Listen for authentication state changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      setCurrentUser(user);
      if (user) {
        setCurrentView('dashboard');
      } else {
        setCurrentView('login');
      }
      setIsLoading(false);
    });

    // Check if user is already authenticated
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setCurrentView('dashboard');
    }
    setIsLoading(false);

    return unsubscribe;
  }, []);

  // Handle hash-based URLs for opening views in new tabs
  useEffect(() => {
    // Only handle hash routing when user is authenticated and not loading
    if (!currentUser || isLoading) return;

    const processHash = (hash: string) => {
      if (!hash) return;

      // Parse hash URL (e.g., #ontology-details?id=123)
      const [view, queryString] = hash.substring(1).split('?');
      if (queryString) {
        const urlParams = new URLSearchParams(queryString);
        const id = urlParams.get('id');
        if (id) {
          setSelectedOntologyId(id);
        }
      }

      // Set the view based on hash
      if (view && ['ontology-details', 'edit-ontology'].includes(view)) {
        setCurrentView(view as ViewType);
      }
    };

    const handleHashChange = () => {
      const hash = window.location.hash;
      processHash(hash);
    };

    // Process pending hash or current hash
    const hashToProcess = pendingHash || window.location.hash;
    processHash(hashToProcess);
    setPendingHash(null); // Clear pending hash after processing

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser, isLoading, pendingHash]);

  // Handle Firebase permission errors by defaulting to demo mode
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error && event.error.message && 
          (event.error.message.includes('permission') || 
           event.error.message.includes('Missing or insufficient permissions'))) {
        console.log('Firebase permission error detected, you can use Demo Mode instead');
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const getPageTitle = () => {
    if (!currentUser) return 'Login';
    
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard';
      case 'use-ontology':
        return 'Use Ontology';
      case 'ontology-details':
        return 'Ontology Details';
      case 'edit-ontology':
        return 'Edit Ontology';
      case 'new-ontology':
        return 'New Ontology';
      default:
        return 'Ontology Marketplace';
    }
  };

  const navigationItems = [
    { id: 'dashboard' as ViewType, label: 'Dashboard' },
    { id: 'use-ontology' as ViewType, label: 'Use Ontology' },
    { id: 'new-ontology' as ViewType, label: 'Create New' },
  ];

  const handleViewChange = (view: string, ontologyId?: string) => {
    setCurrentView(view as ViewType);
    if (ontologyId) {
      setSelectedOntologyId(ontologyId);
    }
    setMobileMenuOpen(false);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setCurrentUser(null);
      setCurrentView('login');
      setSelectedOntologyId(null);
      setShowSettings(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  const showToastSuccessMessage = (message: string) => {
    toast.success(message);
  };

  const showToastErrorMessage = (message: string) => {
    toast.error(message);
  };

  const handleUploadDialogCancel = () => {
    setShowUploadDialog(false);
    setUploadUri('');
    setUploadPassword('');
    setUploadRootLabel('');
    setUploadFile(null);
    setUploadConnectionStatus('idle');
    setUploadConnectionMessage('');
  };

  const handleUploadTestConnection = async () => {
    if (!uploadUri || !uploadPassword) {
      setUploadConnectionStatus('error');
      setUploadConnectionMessage('URI and password are required');
      return;
    }
    setUploadConnectionStatus('testing');
    setUploadConnectionMessage('');
    try {
      const { auth: firebaseAuth } = await import('./config/firebase');
      const user = firebaseAuth.currentUser;
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();

      const baseUrl = (import.meta.env as any).VITE_BACKEND_BASE_URL as string;
      const response = await fetch(`${baseUrl}/test_neo4j_connection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          neo4j_uri: uploadUri,
          neo4j_username: uploadUsername,
          neo4j_password: uploadPassword,
          neo4j_database: uploadDatabase,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setUploadConnectionStatus('success');
        setUploadConnectionMessage(result.message || 'Connection successful');
      } else {
        setUploadConnectionStatus('error');
        setUploadConnectionMessage(result.message || 'Connection failed');
      }
    } catch (error) {
      setUploadConnectionStatus('error');
      setUploadConnectionMessage(error instanceof Error ? error.message : 'Failed to test connection');
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadUri || !uploadPassword) {
      toast.error('Please fill in Neo4j URI and password.');
      return;
    }
    if (!uploadFile) {
      toast.error('Please select an OWL or TTL file to upload.');
      return;
    }

    setIsUploading(true);
    try {
      const { auth: firebaseAuth } = await import('./config/firebase');
      const user = firebaseAuth.currentUser;
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('neo4j_uri', uploadUri);
      formData.append('neo4j_username', uploadUsername);
      formData.append('neo4j_password', uploadPassword);
      formData.append('neo4j_database', uploadDatabase);
      formData.append('source_url', '');
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

      toast.success('Ontology uploaded to Neo4j successfully!');
      handleUploadDialogCancel();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload ontology');
    } finally {
      setIsUploading(false);
    }
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-bold text-2xl">OM</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login view if not authenticated
  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-200"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Logo/Brand */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">OM</span>
              </div>
              <span className="hidden sm:block text-lg font-semibold text-gray-900">
                Ontology Marketplace
              </span>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-6 ml-8">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id as ViewType)}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    currentView === item.id 
                      ? 'text-blue-600 border-b-2 border-blue-500 pb-1' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Page title for mobile */}
            <h1 className="md:hidden text-lg font-semibold text-gray-900">
              {getPageTitle()}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {currentUser && (
              <button
                onClick={() => setShowUploadDialog(true)}
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-white text-sm font-medium transition-colors duration-200"
                style={{ backgroundColor: '#4A90D9' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3A7BC8')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4A90D9')}
                title="Upload ontology file to Neo4j"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </button>
            )}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center space-x-2 p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
                  title="Account Settings"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.name}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-gray-600" />
                  )}
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {currentUser.name}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile navigation menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-2 mt-4">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id as ViewType)}
                  className={`text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    currentView === item.id 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {currentUser && (
                <>
                  <div className="border-t border-gray-200 pt-2 mt-2"></div>
                  <button
                    onClick={() => {
                      setShowUploadDialog(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-green-700 hover:bg-green-50 transition-colors duration-200"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload to Neo4j</span>
                  </button>
                </>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2"></div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        {currentView === 'dashboard' && (
          <DashboardView onNavigate={handleViewChange} onOpenSettings={() => setShowSettings(true)} />
        )}
        {currentView === 'use-ontology' && (
          <UseOntologyView onNavigate={handleViewChange} />
        )}
        {currentView === 'ontology-details' && (
          <OntologyDetailsView 
            ontologyId={selectedOntologyId} 
            onNavigate={handleViewChange} 
            showToastSuccess={showToastSuccessMessage}
            showToastError={showToastErrorMessage}
          />
        )}
        {/* Edit ontology view removed */}
        {currentView === 'new-ontology' && (
          <NewOntologyView onNavigate={handleViewChange} />
        )}
      </main>

      {/* User Profile Settings Modal */}
      {showSettings && currentUser && (
        <UserProfileSettings
          user={currentUser}
          onUpdate={handleUserUpdate}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Universal Upload to Neo4j Dialog */}
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
                  placeholder="e.g. Root Node"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Start tree from a specific label (leave empty for all roots)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ontology File *
                </label>
                <input
                  type="file"
                  accept=".owl,.ttl,.rdf,.xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setUploadFile(file);
                  }}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                <p className="mt-1 text-xs text-gray-500">Upload an OWL or TTL file directly.</p>
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
              </div>
            </div>

            {/* Connection Status */}
            {uploadConnectionStatus !== 'idle' && (
              <div className={`mt-4 p-3 rounded-md text-sm ${
                uploadConnectionStatus === 'testing' ? 'bg-blue-50 text-blue-700' :
                uploadConnectionStatus === 'success' ? 'bg-green-50 text-green-700' :
                'bg-red-50 text-red-700'
              }`}>
                {uploadConnectionStatus === 'testing' ? 'Testing connection...' : uploadConnectionMessage}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleUploadDialogCancel}
                disabled={isUploading || uploadConnectionStatus === 'testing'}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadTestConnection}
                disabled={isUploading || uploadConnectionStatus === 'testing'}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {uploadConnectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={isUploading || uploadConnectionStatus === 'testing'}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}

export default App;