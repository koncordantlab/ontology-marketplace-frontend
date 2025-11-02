# Ontology Marketplace

A modern web application for creating, managing, and using ontologies with FastAPI backend integration, real-time data management, and comprehensive user dashboards.

## 📑 Table of Contents

- [Quick Start](#-quick-start)
  - [Step 1: Clone the Repository and Install Dependencies](#step-1-clone-the-repository-and-install-dependencies)
  - [Step 2: Create .env File](#step-2-create-env-file)
  - [Step 3: Firebase Project Setup](#step-3-firebase-project-setup)
  - [Step 4: Cloudinary Setup (for Image Uploads)](#step-4-cloudinary-setup-for-image-uploads)
  - [Step 5: Start Development Server](#step-5-start-development-server)
  - [Step 6: Access Application](#step-6-access-application)
  - [Available Scripts](#available-scripts)
- [Features](#-features)
  - [Core Functionality](#core-functionality)
  - [Dashboard Features](#dashboard-features)
  - [User Experience](#user-experience)
- [Technology Stack](#️-technology-stack)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Development Tools](#development-tools)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Ontology Endpoints](#ontology-endpoints)
  - [Upload Endpoints](#upload-endpoints)
  - [User Endpoints](#user-endpoints)
  - [Tags Endpoints](#tags-endpoints)
  - [Neo4j Integration Endpoints](#neo4j-integration-endpoints)
- [Usage Guide](#-usage-guide)
  - [Getting Started](#getting-started)
  - [Creating Ontologies](#creating-ontologies)
  - [Using Ontologies](#using-ontologies)
  - [Neo4j Integration](#neo4j-integration)
  - [Managing Ontologies](#managing-ontologies)
- [Security](#-security)
  - [Authentication](#authentication)
  - [Data Protection](#data-protection)
- [Production Deployment](#-production-deployment)
  - [Pre-deployment Checklist](#pre-deployment-checklist)
  - [Build for Production](#build-for-production)
  - [Deployment Options](#deployment-options)
- [Development](#-development)
  - [Available Scripts](#available-scripts-1)
  - [Development Workflow](#development-workflow)
  - [Local Testing Tips](#local-testing-tips)
- [Troubleshooting](#-troubleshooting)
  - [Common Issues](#common-issues)
  - [Getting Help](#getting-help)
- [License](#-license)
- [Contributing](#-contributing)
  - [Development Guidelines](#development-guidelines)
- [Project Status](#-project-status)
  - [Current Features](#current-features)
  - [Features in Development](#features-in-development)

## 🚀 Quick Start

### Step 1: Clone the Repository and Install Dependencies
```bash
git clone <repository-url>
cd ontology-market-place-frontend
npm install
```

**Note:** This will install all dependencies including React, Vite, Firebase, and Tailwind CSS.

### Step 2: Create .env File
```bash
# Create .env file in the root directory
touch .env
```

Add the following environment variables:
```env
# Firebase Configuration (get from Firebase Console)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Backend API Gateway URL
VITE_BACKEND_BASE_URL=your_api_gateway_base_url

# Cloudinary Configuration (optional - for image uploads)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name

# Default Ontology Image (optional)
VITE_DEFAULT_ONTOLOGY_IMAGE_URL=your_default_image_url
```

### Step 3: Firebase Project Setup

#### 3.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `your_project_name_id`
4. Enable Google Analytics (optional)
5. Click "Create project"

#### 3.2 Enable Required Services

**Authentication**
1. Go to "Authentication" → "Sign-in method"
2. Enable "Email/Password" provider
3. Enable "Google" provider
4. Add authorized domains: `localhost` (for development)

### Step 4: Cloudinary Setup (for Image Uploads)

#### 4.1 Create Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for free account
3. Note your cloud name, API key, and API secret

#### 4.2 Configure Cloudinary
Add your Cloudinary cloud name to the `.env` file:
```env
# Cloudinary Configuration (get from your Cloudinary dashboard)
# Only cloud name is needed - app uses unsigned upload with preset
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

**Important Security Notes**: 
- Never commit API keys or secrets to version control
- `.env` is already in `.gitignore`
- This app uses **unsigned uploads with upload presets** (no API keys needed in frontend)
- The upload preset handles all security on the server-side
- Much more secure than exposing API keys to the browser!

### Step 5: Start Development Server

```bash
# Start the Vite development server
npm run dev
```

The application will be available at:
- **Local URL**: http://localhost:5173
- Vite will automatically open your browser

### Step 6: Access Application
- Sign up or log in with Firebase Authentication
- Start creating and managing ontologies!
- All data operations go through the FastAPI backend

### Available Scripts
```bash
npm run dev      # Start development server (with hot reload)
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint to check code quality
```

## 🎯 Features

### Core Functionality
- **Create Ontologies**: Add new ontologies with metadata, thumbnails, and tags
- **Import from URL**: Import ontologies from external sources (OWL format only)
- **Search & Filter**: Find ontologies by name, description, tags, or status
- **User Management**: Complete authentication and profile system with permissions
- **Neo4j Integration**: Connect to Neo4j databases, upload ontologies, and query graph data
- **Tag Management**: Dynamic tagging system with tag editor and filtering
- **Permission System**: User-specific permissions for editing and deleting ontologies
- **Ontology Details**: View and edit ontology metadata with permission-based access

### Dashboard Features
- **Real-time Overview**: View all your ontologies at a glance
- **Categories**: Filter by All, Recently Modified, Public, Private
- **Tags**: Dynamic tagging system for easy organization with tag-based filtering
- **Thumbnail Support**: Visual representation with automatic fallbacks
- **Search**: Real-time search across ontology names and descriptions
- **Responsive Design**: Works on desktop, tablet, and mobile

### User Experience
- **Modern UI**: Clean, intuitive interface with Tailwind CSS
- **Loading States**: Proper feedback during operations
- **Error Handling**: Clear error messages and fallbacks
- **Hash-based Navigation**: URL hash routing for deep linking and browser history
- **Permission-based Access**: Edit and delete permissions managed per user
- **Tag Management**: Visual tag editor with dialog for managing ontology tags

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **Firebase Authentication** for user management and tokens
- **FastAPI Backend** via Zuplo API Gateway for data operations
- **Backend Storage** (handled by FastAPI backend)
- **Cloudinary** for image uploads (unsigned upload with presets)
- **Neo4j** integration for graph database operations (connect, query, upload)

### Development Tools
- **ESLint** for code quality
- **TypeScript** for type safety
- **PostCSS** for CSS processing

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── CloudinaryUploadWidget.tsx    # Cloudinary upload widget wrapper
│   ├── CommentSystem.tsx             # Comment system (currently disabled)
│   ├── DemoLoginPanel.tsx            # Demo authentication panel
│   ├── FileDropZone.tsx              # File drag-and-drop zone
│   ├── GraphVisualization.tsx        # Neo4j graph visualization
│   ├── OntologyCard.tsx              # Ontology card display component
│   ├── OntologyDetailsForm.tsx       # Ontology details editing form
│   ├── OntologyForm.tsx              # Create/edit ontology form
│   ├── OntologyMixPanel.tsx          # Ontology mixing panel
│   ├── OntologySelector.tsx          # Ontology selection dropdown
│   ├── SimpleThumbnailUpload.tsx     # Simple thumbnail upload
│   ├── TagManagerDialog.tsx          # Tag management dialog
│   ├── ThumbnailUpload.tsx            # Image upload component
│   ├── Toggle.tsx                     # Toggle switch component
│   └── UserProfileSettings.tsx        # User profile management
├── views/               # Main application views
│   ├── DashboardView.tsx             # Main dashboard with search/filter
│   ├── LoginView.tsx                 # Authentication view
│   ├── NewOntologyView.tsx           # Create new ontology
│   ├── OntologyDetailsView.tsx       # View/edit ontology details
│   ├── ProfileView.tsx               # User profile view
│   └── UseOntologyView.tsx           # Use/upload ontologies to databases
├── services/            # Business logic and API services
│   ├── authService.ts                # Firebase authentication
│   ├── backendSignedUploadService.ts # Backend signed upload service
│   ├── cloudinaryPresetService.ts    # Cloudinary preset management
│   ├── cloudinaryService.ts          # Image upload service
│   ├── cloudinaryWidgetService.ts    # Cloudinary widget service
│   ├── demoAuthService.ts            # Demo authentication service
│   ├── neo4jService.ts               # Neo4j database integration
│   ├── ontologyService.ts           # Ontology API operations
│   ├── signedUploadService.ts       # Signed upload service
│   ├── simpleUploadService.ts       # Simple upload service
│   ├── unsignedUploadService.ts     # Unsigned upload service
│   └── userService.ts                # User account and permissions
├── config/              # Configuration files
│   ├── firebase.ts                   # Firebase configuration
│   ├── backendApi.ts                 # Backend API configuration
│   └── cloudinary.ts                 # Cloudinary configuration
└── App.tsx              # Main application component with routing
```

## 🔧 API Endpoints

### Backend API Gateway
All API calls go through an API Gateway (Zuplo), the base URL is set in the `.env` file as `VITE_BACKEND_BASE_URL`.

### Authentication Endpoints

#### Verify Token
- **URL**: `/auth/verify-token`
- **Method**: GET
- **Auth**: Bearer token required (Firebase ID token)

### Ontology Endpoints

#### Search Ontologies
- **URL**: `/search_ontologies`
- **Method**: GET
- **Auth**: Bearer token required (Firebase ID token)
- **Returns**: List of user's ontologies and public ontologies

#### Get Ontology by ID
- **URL**: `/api/ontologies/{id}`
- **Method**: GET
- **Auth**: Bearer token required (Firebase ID token)
- **Returns**: Single ontology details

#### Add Ontology
- **URL**: `/add_ontologies`
- **Method**: POST
- **Auth**: Bearer token required (Firebase ID token)
- **Payload**: Array of ontology objects `[{name, description, properties, ...}]`
- **Returns**: Created ontology(ies) with ID(s)

#### Update Ontology
- **URL**: `/update_ontology/{id}`
- **Method**: PUT
- **Auth**: Bearer token required (Firebase ID token)
- **Payload**: Ontology updates with ID
- **Returns**: Updated ontology

#### Delete Ontology
- **URL**: `/delete_ontologies`
- **Method**: DELETE
- **Auth**: Bearer token required (Firebase ID token)
- **Payload**: Array of ontology IDs `[id1, id2, ...]`
- **Returns**: Deletion confirmation

### Upload Endpoints

#### Upload Ontology from URL
- **URL**: `/api/ontologies/upload-from-url`
- **Method**: POST
- **Auth**: Bearer token required
- **Payload**: `{url, ...metadata}`
- **Returns**: Uploaded ontology data

#### Validate Ontology URL
- **URL**: `/api/ontologies/validate-url`
- **Method**: POST
- **Auth**: Bearer token required
- **Payload**: `{url}`
- **Returns**: Validation result

#### Upload Ontology (Proxy)
- **URL**: `/upload_ontology`
- **Method**: POST
- **Auth**: Bearer token required
- **Payload**: `{uri, username, password, database, ttl_url}`
- **Returns**: Upload result

### User Endpoints

#### Get User
- **URL**: `/get_user`
- **Method**: GET
- **Auth**: Bearer token required (Firebase ID token)
- **Returns**: User account data with permissions `{is_public, permissions: {can_edit_ontologies, can_delete_ontologies}}`

#### Update User
- **URL**: `/update_user`
- **Method**: PUT/PATCH
- **Auth**: Bearer token required
- **Payload**: User update data
- **Returns**: Updated user data

### Tags Endpoints

#### Get Tags
- **URL**: `/get_tags`
- **Method**: GET
- **Auth**: Bearer token optional (public tags available)
- **Returns**: List of available tags

### Neo4j Integration Endpoints

#### Upload Ontology to Neo4j
- **URL**: `/api/ontologies/{ontologyId}/upload-to-neo4j`
- **Method**: POST
- **Auth**: Bearer token required
- **Payload**: `{mergeStrategy?: 'merge' | 'replace', ...options}`
- **Returns**: Upload result

#### Connect to Neo4j
- **URL**: `/api/neo4j/connect`
- **Method**: POST
- **Auth**: Bearer token required
- **Payload**: `{uri, username, password}`
- **Returns**: Connection status

#### Disconnect from Neo4j
- **URL**: `/api/neo4j/disconnect`
- **Method**: POST
- **Auth**: Bearer token required
- **Returns**: Disconnection confirmation

#### Execute Neo4j Query
- **URL**: `/api/neo4j/query`
- **Method**: POST
- **Auth**: Bearer token required
- **Payload**: `{query: string, params?: object}`
- **Returns**: Query results

#### Get Neo4j Graph Data
- **URL**: `/api/neo4j/graph`
- **Method**: GET
- **Auth**: Bearer token required
- **Query Params**: `limit?: number`
- **Returns**: Graph data `{nodes, relationships}`

#### Get Neo4j Database Info
- **URL**: `/api/neo4j/info`
- **Method**: GET
- **Auth**: Bearer token required
- **Returns**: Database information

## 🎮 Usage Guide

### Getting Started
1. **Sign Up/Login**: Use Firebase authentication (email/password or Google)
2. **Dashboard**: View your ontologies and explore features
3. **Create Ontology**: Add new ontologies with metadata
4. **Import from URL**: Import ontologies from external sources
5. **Manage**: Edit, delete, and organize your ontologies

### Creating Ontologies
1. Click "Create New Ontology" or navigate to the create page
2. Fill in required fields:
   - **Title**: Name of the ontology
   - **Description**: Detailed description
   - **Source URL** (optional): URL to import from
   - **Tags**: Comma-separated tags
   - **Public/Private**: Control visibility
3. Upload thumbnail (optional)
4. Click "CREATE ONTOLOGY"

### Using Ontologies
1. Go to "Use Ontology" view (accessible from navigation)
2. Select an ontology from the dropdown
3. Choose upload strategy (merge or replace) using the toggle
4. Click "UPLOAD" to send ontology to Neo4j database
5. Preview ontology details before uploading

### Neo4j Integration
1. **Connect to Neo4j**: Use the backend API to connect with credentials
2. **Upload Ontologies**: Upload selected ontologies to Neo4j graph database
3. **Query Graph Data**: Execute Cypher queries through the backend API
4. **Visualize Graphs**: View graph data (nodes and relationships)
5. **Database Info**: Get database statistics and information

### Managing Ontologies
- **View**: Click on ontology cards to see details (hash-based navigation: `#ontology-details/{id}`)
- **Edit**: Modify ontology properties and metadata (permission-based)
- **Delete**: Remove ontologies with confirmation (permission-based)
- **Search**: Use the search bar to find specific ontologies
- **Filter**: Use categories (All, Recently Modified, Public, Private) and tags to organize
- **Tags**: Manage tags using the tag manager dialog
- **Permissions**: View and edit permissions are managed through the user service

## 🔒 Security

### Authentication
- Firebase Authentication with email/password and Google OAuth
- Secure token-based API authentication (Firebase ID tokens)
- Protected routes and user-specific data access

### Data Protection
- User-specific ontology access
- Public/private ontology controls
- Permission-based editing and deletion (managed via `/get_user` endpoint)
- Secure backend API with Firebase token validation
- Automatic token refresh before expiration
- Environment variables for sensitive data
- Cloudinary unsigned uploads (no API keys in frontend)

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] Firebase Authentication enabled
- [ ] Backend API endpoint configured
- [ ] Environment variables set for production
- [ ] CORS settings configured for production domains

### Build for Production
```bash
# Build frontend
npm run build

# Deploy hosting (optional)
firebase deploy --only hosting
```

### Deployment Options

#### Netlify (Recommended)
1. Connect GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy automatically on push to main branch

#### Vercel
1. Import project from GitHub
2. Set framework preset: Vite
3. Configure build settings
4. Add environment variables
5. Deploy automatically


## 🧪 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Development Workflow
1. **Start Dev Server**: Run `npm run dev` to start Vite dev server on http://localhost:5173
2. **Hot Reload**: Vite automatically reloads when you make changes to source files
3. **Testing**: Test all features with real backend API
4. **Backend Integration**: All API calls go through Zuplo Gateway with Firebase auth tokens
5. **Build**: Run `npm run build` to create production build in `dist/` folder
6. **Preview**: Run `npm run preview` to preview production build locally

### Local Testing Tips
- Open browser DevTools to see API requests and responses
- Check Network tab to verify backend API calls
- Verify Firebase Authentication is working correctly
- Monitor console for any errors or warnings

## 🆘 Troubleshooting

### Common Issues

#### Firebase Authentication Issues
**Problem**: Users can't sign in
**Solution**: 
1. Check Firebase configuration in `.env`
2. Verify Authentication providers are enabled
3. Add localhost to authorized domains

#### Backend API Errors
**Problem**: API calls failing
**Solution**:
1. Check backend API logs
2. Verify Firebase Authentication token is valid
3. Check CORS configuration on Zuplo Gateway
4. Verify backend API endpoint is accessible

#### Build Errors
**Problem**: `npm run build` fails
**Solution**:
1. Clear caches: `rm -rf node_modules package-lock.json`
2. Reinstall: `npm install`
3. Check TypeScript errors: `npx tsc --noEmit`

#### Image Upload Issues
**Problem**: Thumbnails not uploading
**Solution**:
1. Verify Cloudinary configuration
2. Check upload preset exists
3. Ensure proper CORS settings

### Getting Help
1. Check browser console for errors
2. View backend API response in Network tab
3. Verify environment variables
4. Test in different browser/incognito mode

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use proper error handling
- Ensure responsive design
- Test with real Firebase services
- Add comments for complex logic

## 📊 Project Status

✅ **Production Ready**
- FastAPI backend via Zuplo Gateway
- Real-time dashboard with filtering
- Comprehensive user management
- Responsive design
- TypeScript support
- Image upload functionality
- Database integration

### Current Features
- **Dashboard**: Complete ontology management interface with search, filters, and categories
- **API Integration**: FastAPI backend via Zuplo API Gateway with full CRUD operations
- **User Management**: Full authentication and profile system (Firebase Auth) with permissions
- **Ontology Operations**: Create, read, update, delete with permission-based access
- **Search & Filter**: Advanced filtering by category, tags, and text search
- **Tag Management**: Tag editor and tag manager dialog for organizing ontologies
- **Image Upload**: Cloudinary integration for thumbnails (unsigned upload with presets)
- **Neo4j Integration**: Connect to Neo4j, upload ontologies, query graph data, and visualize graphs
- **Hash-based Routing**: URL hash navigation for deep linking and browser history
- **Permission System**: User-specific edit and delete permissions managed via backend
- **Ontology Details View**: Comprehensive view with inline editing capabilities

### Features in Development
- **Comment System**: Comment system component exists but is currently disabled/hidden
- **Graph Visualization**: Basic graph visualization component available

**Ready to use**: Clone, configure environment variables, and run `npm run dev`!
