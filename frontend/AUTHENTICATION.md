# Authentication System

This document explains how the login/logout functionality works in the Usuals.ai frontend.

## Components

### 1. LoginLogoutButton
A standalone component that can be used anywhere in the app.

**Usage:**
```jsx
import LoginLogoutButton from './components/LoginLogoutButton';

// In your component
<LoginLogoutButton />
```

**Features:**
- Shows "Sign in" button when not authenticated
- Shows user info + "Logout" button when authenticated
- Displays user avatar if available
- Loading spinner during authentication
- Works in both web and Electron environments

### 2. ChatLoginButton
A specialized component for the ChatWidget with enhanced styling.

**Usage:**
```jsx
import ChatLoginButton from './components/ChatLoginButton';

// In ChatWidget
<ChatLoginButton />
```

**Features:**
- Google OAuth branding
- Enhanced styling for chat interface
- User avatar and email display
- Error message handling

## Authentication Flow

### Web Browser
1. User clicks "Sign in"
2. Redirects to `https://backend.usuals.ai/auth/google`
3. Google OAuth flow completes
4. Backend redirects back with JWT token
5. Token stored in localStorage
6. User authenticated

### Electron Desktop
1. User clicks "Sign in"
2. Electron opens OAuth window
3. Local server (port 8080) handles callback
4. Token stored in Electron store
5. User authenticated

### Logout
1. User clicks "Logout"
2. Token cleared from storage
3. User state reset
4. Returns to unauthenticated state

## API Integration

All API requests automatically include the Authorization header:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## Testing

Use the AuthTest component to verify authentication:
```jsx
import AuthTest from './components/AuthTest';

// Test if Authorization header is working
<AuthTest />
```

## Environment Support

- ✅ **Web Browser**: localStorage + redirect OAuth
- ✅ **Electron Desktop**: Electron store + IPC OAuth
- ✅ **Cross-platform**: Seamless experience across environments

## Security

- JWT tokens are stored securely
- Automatic token validation
- Graceful fallback for invalid tokens
- No hardcoded credentials 