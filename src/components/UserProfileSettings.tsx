import React, { useEffect, useMemo, useRef, useState } from 'react';
import { User, Mail, Lock, Camera, Save, AlertCircle, Globe, EyeOff, LogOut } from 'lucide-react';
import { authService, AuthError } from '../services/authService';
import { userService } from '../services/userService';
import { cloudinaryService } from '../services/cloudinaryService';

interface UserProfileSettingsProps {
  user: {
    id: string;
    name: string;
    email: string;
    photoURL?: string;
  };
  onUpdate: (user: any) => void;
  onClose: () => void;
}

export const UserProfileSettings: React.FC<UserProfileSettingsProps> = ({
  user,
  onUpdate,
  onClose
}) => {
  const account = userService.getUserAccount();
  const firebaseUser = authService.getCurrentUser();
  
  // Profile fields from Firebase Auth
  const [name, setName] = useState(firebaseUser?.name || user.name);
  const [imageUrl, setImageUrl] = useState(firebaseUser?.photoURL || user.photoURL || '');
  
  // Backend fields
  const [isPublic, setIsPublic] = useState(account?.is_public ?? false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track dirty state against initial snapshot
  const [initial, setInitial] = useState(() => ({
    name: firebaseUser?.name || user.name,
    imageUrl: firebaseUser?.photoURL || user.photoURL || '',
    isPublic: account?.is_public ?? false,
  }));

  useEffect(() => {
    setInitial({
      name: firebaseUser?.name || user.name,
      imageUrl: firebaseUser?.photoURL || user.photoURL || '',
      isPublic: account?.is_public ?? false,
    });
    // Keep snapshot in sync when underlying sources change
  }, [firebaseUser?.name, firebaseUser?.photoURL, account?.is_public, user.name, user.photoURL]);

  const isDirty = useMemo(() => (
    name !== initial.name || imageUrl !== initial.imageUrl || isPublic !== initial.isPublic
  ), [name, imageUrl, isPublic, initial]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Update Firebase profile (name, photoURL)
      await authService.updateUserProfile({ 
        name, 
        photoURL: imageUrl || undefined 
      });
      
      // Update backend (is_public) only if changed
      if (isPublic !== initial.isPublic) {
        await userService.updateUser(isPublic);
      }
      
      // Refresh backend cache
      await userService.refresh();
      
      setSuccessMessage('Profile updated successfully!');
        // Sync snapshot so dirty state resets
        setInitial({ name, imageUrl, isPublic });
      
      // Update parent component with Firebase user data
      const updatedFirebaseUser = authService.getCurrentUser();
      if (updatedFirebaseUser) {
        onUpdate({ 
          ...user, 
          name: updatedFirebaseUser.name,
          photoURL: updatedFirebaseUser.photoURL 
        });
      } else {
        onUpdate({ ...user, name, photoURL: imageUrl });
      }
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      await authService.changePassword(currentPassword, newPassword);
      setSuccessMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'profile'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'password'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Password
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Profile Photo */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  {imageUrl || user.photoURL ? (
                    <img
                      src={imageUrl || user.photoURL}
                      alt={name || user.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-xl">
                      {(name || user.name).split(' ').map(n => n[0]).join('')}
                    </span>
                  )}
                </div>
                <div className="flex flex-col space-y-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Change Photo</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsLoading(true);
                      setError('');
                      try {
                        // Use the default preset that exists
                        const res = await cloudinaryService.uploadImage(file, {
                          preset: 'ontologymarketplace',
                          folder: 'profile-images',
                          tags: ['profile', 'user']
                        });
                        if (!res.success || !res.url) {
                          throw new Error(res.error || 'Failed to upload image');
                        }
                        setImageUrl(res.url);
                        setSuccessMessage('Image uploaded. Click Save Changes to apply.');
                      } catch (err: any) {
                        setError(err?.message || 'Image upload failed');
                      } finally {
                        setIsLoading(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }
                    }}
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    required
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={firebaseUser?.email || user.email}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                    disabled
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              {/* Public Profile Toggle */}
              <div>
                <label className="flex items-center space-x-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-14 h-7 rounded-full transition-colors duration-200 ${
                      isPublic ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      <div className={`w-6 h-6 rounded-full bg-white mt-0.5 ml-0.5 transition-transform duration-200 ${
                        isPublic ? 'transform translate-x-7' : ''
                      }`}></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isPublic ? (
                      <Globe className="h-5 w-5 text-blue-600" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {isPublic ? 'Public Profile' : 'Private Profile'}
                    </span>
                  </div>
                </label>
                <p className="mt-1 text-xs text-gray-500 ml-20">
                  {isPublic 
                    ? 'Your profile is visible to other users'
                    : 'Your profile is private and only visible to you'}
                </p>
              </div>

              {/* Actions Row: Save Changes + Log Out */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={isLoading || !isDirty}
                  className={`inline-flex items-center justify-center space-x-2 py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ${
                    isLoading || !isDirty
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Save className="h-4 w-4" />
                  <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await authService.signOut();
                      userService.clear();
                      onClose();
                      // Optionally: window.location.reload();
                    } catch (e) {
                      setError('Failed to log out. Please try again.');
                    }
                  }}
                  className="inline-flex items-center space-x-2 py-2 px-4 rounded-md font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              {/* Current Password */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    required
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    required
                  />
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmNewPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    required
                  />
                </div>
              </div>

              {/* Change Password Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Lock className="h-4 w-4" />
                <span>{isLoading ? 'Changing...' : 'Change Password'}</span>
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};