import React, { useState, useEffect } from 'react';
import { User, Menu, X } from 'lucide-react';
import { UseOntologyView } from './views/UseOntologyView';
import { OntologyDetailsView } from './views/OntologyDetailsView';
// import { EditOntologyView } from './views/EditOntologyView';
import { NewOntologyView } from './views/NewOntologyView';
import { DashboardView } from './views/DashboardView';
import { LoginView } from './views/LoginView';
import { UserProfileSettings } from './components/UserProfileSettings';
import { authService } from './services/authService';
import { userService } from './services/userService';

type ViewType = 'login' | 'dashboard' | 'use-ontology' | 'ontology-details' | 'edit-ontology' | 'new-ontology';

interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
}

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedOntologyId, setSelectedOntologyId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
    // Process hash FIRST, before setting any default views
    // This avoids race conditions where dashboard view overrides hash-based navigation
    const hash = window.location.hash;
    const parsedHash = parseHash(hash); // Parse once and reuse
    
    // Set view and ID from hash if present
    if (parsedHash.view) {
      setCurrentView(parsedHash.view);
    }
    if (parsedHash.id) {
      setSelectedOntologyId(parsedHash.id);
    }

    // Listen for authentication state changes
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        // Only override view if we're on login screen
        setCurrentView((prev) => (prev === 'login' ? (parsedHash.view || 'dashboard') : prev));
        // Fetch user account and permissions after login
        try {
          await userService.refresh();
        } catch (error) {
          console.error('Failed to fetch user account on login:', error);
        }
      } else {
        // On logout, only set dashboard if no hash was parsed
        if (!parsedHash.view) {
          setCurrentView('dashboard');
        }
        // Clear cache on logout
        userService.clear();
      }
      setIsLoading(false);
    });

    // Check if user is already authenticated
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      // Only set dashboard if no hash was processed
      if (!parsedHash.view) {
        setCurrentView('dashboard');
      }
      // Fetch user account if user is already logged in
      // For detail views, we need permissions loaded ASAP, so start refresh immediately
      // (Don't await here to avoid blocking UI, but OntologyDetailsView will await if needed)
      userService.refresh().catch((error) => {
        console.error('Failed to fetch user account on initial load:', error);
      });
    } else {
      // No user - if no hash, show dashboard
      if (!parsedHash.view) {
        setCurrentView('dashboard');
      }
    }
    setIsLoading(false);

    return unsubscribe;
  }, []);

  // Handle hash changes (for navigation within same window)
  useEffect(() => {
    if (isLoading) return;

    const handleHashChange = () => {
      const hash = window.location.hash;
      const parsed = parseHash(hash);
      
      if (parsed.view) {
        setCurrentView(parsed.view);
      }
      if (parsed.id !== null) {
        // null means no ID in hash, undefined means don't change
        setSelectedOntologyId(parsed.id);
      }
    };

    // Listen for hash changes (when user navigates via back/forward or direct hash change)
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isLoading]);

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

  const navigationItems = currentUser
    ? [
        { id: 'dashboard' as ViewType, label: 'Dashboard' },
        { id: 'new-ontology' as ViewType, label: 'Create New' },
      ]
    : [
        { id: 'dashboard' as ViewType, label: 'Dashboard' },
      ];

  // Unified navigation helper - updates both state and URL hash
  const handleViewChange = (view: string, ontologyId?: string) => {
    setCurrentView(view as ViewType);
    
    if (ontologyId) {
      setSelectedOntologyId(ontologyId);
      // Update URL hash to reflect the navigation
      window.location.hash = `ontology-details/${ontologyId}`;
    } else {
      // Clear ontology ID if navigating away from detail view
      if (view !== 'ontology-details' && view !== 'edit-ontology') {
        setSelectedOntologyId(null);
      }
      window.location.hash = view;
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
      userService.clear();
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
  // Always render app; unauthenticated users see the dashboard with a Login button

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
                  onClick={() => {
                    if (item.id === 'dashboard') {
                      const url = `${window.location.pathname}#dashboard`;
                      window.open(url, 'dashboard');
                      return;
                    }
                    handleViewChange(item.id as ViewType);
                  }}
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
            {currentUser ? (
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
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Log In
              </button>
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
                  onClick={() => {
                    if (item.id === 'dashboard') {
                      const url = `${window.location.pathname}#dashboard`;
                      window.open(url, 'dashboard');
                      setMobileMenuOpen(false);
                      return;
                    }
                    handleViewChange(item.id as ViewType);
                  }}
                  className={`text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    currentView === item.id 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2"></div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        {currentView === 'dashboard' && (
          <DashboardView onNavigate={handleViewChange} />
        )}
        {currentView === 'use-ontology' && (
          <UseOntologyView onNavigate={handleViewChange} />
        )}
        {currentView === 'ontology-details' && (
          <OntologyDetailsView 
            ontologyId={selectedOntologyId} 
            onNavigate={handleViewChange} 
          />
        )}
        {/* Edit ontology view removed */}
        {currentView === 'new-ontology' && (
          <NewOntologyView onNavigate={handleViewChange} />
        )}
      </main>

      {/* Login Modal for unauthenticated users */}
      {showLoginModal && !currentUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              ✕
            </button>
            <LoginView
              onLogin={(user) => {
                handleLogin(user);
                setShowLoginModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* User Profile Settings Modal */}
      {showSettings && currentUser && (
        <UserProfileSettings
          user={currentUser}
          onUpdate={handleUserUpdate}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;