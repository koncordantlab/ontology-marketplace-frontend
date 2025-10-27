import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { auth } from '../config/firebase';

export interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  createdAt?: Date;
  lastLoginAt?: Date;
}

export interface AuthError {
  code: string;
  message: string;
}

class AuthService {
  private currentUser: User | null = null;
  private authStateListeners: ((user: User | null) => void)[] = [];

  constructor() {
    // Listen for authentication state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await this.createUserFromFirebaseUser(firebaseUser);
          this.currentUser = user;
          await this.updateLastLogin(user.id);
        } catch (error) {
          console.error('Error in auth state change:', error);
          this.currentUser = null;
        }
      } else {
        this.currentUser = null;
      }
      
      // Notify all listeners
      this.authStateListeners.forEach(listener => listener(this.currentUser));
    });
  }

  // Convert Firebase User to our User interface
  private async createUserFromFirebaseUser(firebaseUser: FirebaseUser): Promise<User> {
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'User',
      email: firebaseUser.email || '',
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: undefined,
      lastLoginAt: new Date()
    };
  }

  // Register new user with email and password
  async register(email: string, password: string, name: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update the user's display name
      await updateProfile(firebaseUser, { displayName: name });

      return {
        id: firebaseUser.uid,
        name,
        email,
        createdAt: new Date(),
        lastLoginAt: new Date()
      };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return await this.createUserFromFirebaseUser(userCredential.user);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      return await this.createUserFromFirebaseUser(userCredential.user);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Send password reset email
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Update user profile
  async updateUserProfile(updates: { name?: string; photoURL?: string }): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }

    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: updates.name,
        photoURL: updates.photoURL
      });

      // Update current user in memory
      if (this.currentUser) {
        this.currentUser = {
          ...this.currentUser,
          ...updates
        };
      }
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('No user is currently signed in');
    }

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, newPassword);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Update last login timestamp
  private async updateLastLogin(userId: string): Promise<void> {
    // No-op: Last login tracking moved to backend
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Get Firebase ID token for authentication
  async getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated. Please log in with Firebase to access the API.');
    }
    
    try {
      const token = await user.getIdToken();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw new Error('Authentication failed. Please try logging in again.');
    }
  }

  // Add auth state listener
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Handle Firebase Auth errors
  private handleAuthError(error: any): AuthError {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed before completion.',
      'auth/cancelled-popup-request': 'Sign-in was cancelled.',
      'auth/requires-recent-login': 'Please sign in again to perform this action.'
    };

    return {
      code: error.code || 'auth/unknown-error',
      message: errorMessages[error.code] || error.message || 'An unexpected error occurred.'
    };
  }
}

export const authService = new AuthService();