# Ontology Marketplace

A modern web application for creating, managing, and using ontologies with FastAPI backend integration, real-time data management, and comprehensive user dashboards.

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
```

### Step 3: Firebase Project Setup

#### 2.1 Create Firebase Project
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

#### 3.1 Create Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for free account
3. Note your cloud name, API key, and API secret

#### 3.2 Configure Cloudinary
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
- **Create Ontologies**: Add new ontologies with metadata and thumbnails
- **Import from URL**: Import ontologies from external sources (OWL format only)
- **Search & Filter**: Find ontologies by name, description, tags, or status
- **User Management**: Complete authentication and profile system
- **Database Integration**: Upload ontologies to databases like Neo4j

### Dashboard Features
- **Real-time Overview**: View all your ontologies at a glance
- **Categories**: Filter by All, Recently Modified, Public, Private
- **Tags**: Dynamic tagging system for easy organization
- **Thumbnail Support**: Visual representation with automatic fallbacks
- **Responsive Design**: Works on desktop, tablet, and mobile

### User Experience
- **Modern UI**: Clean, intuitive interface with Tailwind CSS
- **Loading States**: Proper feedback during operations
- **Error Handling**: Clear error messages and fallbacks
- **Accessibility**: Keyboard navigation and screen reader support

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
- **Cloudinary** for image uploads

### Development Tools
- **ESLint** for code quality
- **TypeScript** for type safety
- **PostCSS** for CSS processing

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── OntologySelector.tsx    # Ontology selection dropdown
│   ├── ThumbnailUpload.tsx     # Image upload component
│   ├── Toggle.tsx              # Toggle switch component
│   └── UserProfileSettings.tsx # User profile management
├── views/               # Main application views
│   ├── DashboardView.tsx       # Main dashboard
│   ├── LoginView.tsx           # Authentication
│   ├── NewOntologyView.tsx     # Create new ontology
│   ├── UseOntologyView.tsx     # Use/upload ontologies
│   ├── (removed) EditOntologyView.tsx
│   └── OntologyDetailsView.tsx # View ontology details
├── services/            # Business logic and API services
│   ├── authService.ts          # Firebase authentication
│   ├── ontologyService.ts      # Ontology API operations
│   ├── cloudinaryService.ts    # Image upload service
│   └── simpleUploadService.ts  # Simple upload service
├── config/              # Configuration files
│   ├── firebase.ts             # Firebase configuration
│   ├── backendApi.ts           # Backend API configuration
│   └── cloudinary.ts           # Cloudinary configuration
└── App.tsx              # Main application component
```

## 🔧 API Endpoints

### Backend API Gateway
All API calls go through an API Gateway, the base url is set in the .env file

### Available Endpoints

#### Search Ontologies
- **URL**: `/search_ontologies`
- **Method**: GET
- **Auth**: Bearer token required (Firebase ID token)
- **Returns**: List of user's ontologies and public ontologies

#### Add Ontology
- **URL**: `/add_ontologies`
- **Method**: POST
- **Auth**: Bearer token required (Firebase ID token)
- **Payload**: Ontology data (name, description, properties)
- **Returns**: Created ontology with ID

#### Update Ontology
- **URL**: `/update_ontology`
- **Method**: PUT
- **Auth**: Bearer token required (Firebase ID token)
- **Payload**: Ontology updates with ID
- **Returns**: Updated ontology

#### Delete Ontology
- **URL**: `/delete_ontologies`
- **Method**: DELETE
- **Auth**: Bearer token required (Firebase ID token)
- **Payload**: Ontology ID
- **Returns**: Deletion confirmation

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
1. Go to "Use Ontology" view
2. Select an ontology from the dropdown
3. Choose upload strategy (merge or replace)
4. Click "UPLOAD" to send to target database

### Managing Ontologies
- **View**: Click on ontology cards to see details
- **Edit**: Modify ontology properties and metadata
- **Delete**: Remove ontologies with confirmation
- **Search**: Use the search bar to find specific ontologies
- **Filter**: Use categories and tags to organize

## 🔒 Security

### Authentication
- Firebase Authentication with email/password and Google OAuth
- Secure token-based API authentication (Firebase ID tokens)
- Protected routes and user-specific data access

### Data Protection
- User-specific ontology access
- Public/private ontology controls
- Secure backend API with Firebase token validation
- Environment variables for sensitive data

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
- **Dashboard**: Complete ontology management interface
- **API Integration**: FastAPI backend via Zuplo API Gateway
- **User Management**: Full authentication and profile system (Firebase Auth)
- **Ontology Operations**: Create, read, update, delete
- **Search & Filter**: Advanced filtering and search capabilities
- **Image Upload**: Cloudinary integration for thumbnails
- **Database Upload**: Upload ontologies to external databases

**Ready to use**: Clone, configure environment variables, and run `npm run dev`!
