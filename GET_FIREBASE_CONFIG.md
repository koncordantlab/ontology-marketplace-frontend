# How to Get Firebase Configuration Values

## Step-by-Step Instructions

### 1. Go to Firebase Console
- Visit: https://console.firebase.google.com/
- Select your project (or create a new one)

### 2. Navigate to Project Settings
- Click the ⚙️ **gear icon** (Settings) next to "Project Overview"
- Select **"Project settings"**

### 3. Scroll Down to "Your apps"
- You'll see a section titled **"Your apps"**
- If you don't have a web app, click **"Add app"** → **"Web"** (</>)**

### 4. View App Configuration
Once you have a web app, you'll see your config like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### 5. Copy Each Value

| Config Value | What It Is | Where to Find |
|--------------|------------|---------------|
| **apiKey** | Public API key | Top of config block |
| **authDomain** | Your project's auth domain | Usually: `project-id.firebaseapp.com` |
| **projectId** | Your Firebase project ID | From project name/settings |
| **storageBucket** | Cloud Storage bucket | Usually: `project-id.appspot.com` |
| **messagingSenderId** | **Cloud Messaging sender ID** | In the config - looks like: `123456789012` |
| **appId** | **Your app's unique ID** | In the config - looks like: `1:123456789012:web:abc...` |

### 6. Create/Update `.env` File

Create a `.env` file in the root directory with these values:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyC...your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Backend API Gateway URL
VITE_BACKEND_BASE_URL=https://ontology-marketplace-main-34028ed.d2.zuplo.dev

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

## What Each Value Does

### Required (Used by Firebase Auth):
- ✅ **apiKey** - Enables Firebase services
- ✅ **authDomain** - Authentication domain
- ✅ **projectId** - Your Firebase project
- ✅ **appId** - Your web app identifier

### Required (Even if not using):
- ⚠️ **messagingSenderId** - Required by Firebase config (even if not using Cloud Messaging)
- ⚠️ **storageBucket** - Required by Firebase config (even if not using Storage)

### Optional:
- Cloudinary cloud name (for image uploads)

## Important Notes

1. **messagingSenderId**: Always looks like a 12-digit number
   - Example: `123456789012`
   
2. **appId**: Follows the pattern `1:123456789012:web:abc123def456`
   - The middle part matches your messagingSenderId

3. **Don't commit `.env`**: It's already in `.gitignore`

4. **Get from browser console**: If you can't find it in Firebase Console, you can get it from:
   - Chrome DevTools → Application → Firebase settings
   - Or from an already running app at Firebase Console → Project Settings → Your apps

## Quick Access

Direct link format:
```
https://console.firebase.google.com/project/YOUR_PROJECT_ID/settings/general
```

Replace `YOUR_PROJECT_ID` with your actual project ID.

