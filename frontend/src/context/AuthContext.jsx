import { createContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/baseurl.js';

const AuthContext = createContext();

export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('authUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if we're running in Electron
  const isElectron = window.electronAPI && window.electronAPI.req;

  // Handle OAuth callback in browser mode
  useEffect(() => {
    if (isElectron) return; // skip if running inside Electron
    if (window.location.pathname === '/auth/google-redirect') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const accessToken = params.get('access_token') || params.get('token');

      const finalizeWebLogin = async () => {
        try {
          let tokenData = null;
          if (code && !accessToken) {
            // Exchange the code for JWT token via backend endpoint
            const res = await fetch(`${API_BASE_URL}/auth/google-redirect?code=${encodeURIComponent(code)}`);
            if (!res.ok) throw new Error('Token exchange failed');
            tokenData = await res.json();
          } else {
            tokenData = { success: true, access_token: accessToken, user: null };
          }

          if (tokenData && tokenData.success && tokenData.access_token) {
            handleAuthSuccess({ access_token: tokenData.access_token, user: tokenData.user });
          }
        } catch (err) {
          console.error('OAuth callback handling failed', err);
        } finally {
          // Clean up URL regardless of outcome
          window.history.replaceState({}, document.title, '/');
        }
      };

      finalizeWebLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the user object persisted so it survives full application restarts
  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem('authUser', JSON.stringify(user));
      } catch (e) {
        console.error('Failed to persist authUser', e);
      }
    } else {
      localStorage.removeItem('authUser');
    }
  }, [user]);

  // Initialize authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Initializing authentication...');
      console.log('isElectron:', isElectron);
      console.log('electronAPI.req.auth available:', !!(window.electronAPI && window.electronAPI.req && window.electronAPI.req.auth));
      
      try {
        if (isElectron && window.electronAPI.req.auth) {
          console.log('Checking for stored token...');
          // In Electron, check for stored token
          const tokenResult = await window.electronAPI.req.auth.getToken();
          console.log('Token result:', tokenResult);
          
          if (tokenResult.status === 1 && tokenResult.token) {
            console.log('Token found, checking status...');
            const authStatus = await window.electronAPI.req.auth.checkStatus();
            console.log('Auth status:', authStatus);
            
            if (authStatus.status === 1) {
              console.log('Setting authenticated user:', authStatus.user);
              setToken(tokenResult.token);
              setUser(authStatus.user);
            } else {
              console.log('Token invalid, logging out...');
              // Token is invalid, clear it
              await window.electronAPI.req.auth.logout();
            }
          } else {
            console.log('No valid token found');
          }
        } else if (token) {
          // In web browser, check if token is still valid
          // This would call your backend API
          console.log('Web token found:', token);
        } else {
          console.log('No authentication method available');
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [token, isElectron]);

  // Listen for login success from Electron
  useEffect(() => {
    console.log('Setting up Electron auth listener, isElectron:', isElectron);
    console.log('electronAPI available:', !!window.electronAPI);
    console.log('electronAPI.res.auth available:', !!(window.electronAPI && window.electronAPI.res && window.electronAPI.res.auth));
    
    if (isElectron && window.electronAPI.res.auth) {
      const handleLoginSuccess = (event, data) => {
        console.log('Login success received from Electron:', data);
        handleAuthSuccess(data);
      };

      window.electronAPI.res.auth.loginSuccess(handleLoginSuccess);
      console.log('Electron auth listener set up successfully');

      return () => {
        // Cleanup listener if needed
        console.log('Cleaning up Electron auth listener');
      };
    } else {
      console.log('Electron auth not available, skipping listener setup');
    }
  }, [isElectron]);

  const handleAuthSuccess = (authData) => {
    if (authData.access_token) {
      setToken(authData.access_token);
      setUser(authData.user);
      localStorage.setItem('authToken', authData.access_token);
      localStorage.setItem('authUser', JSON.stringify(authData.user));
      setError(null);
    }
  };

  const login = async () => {
    try {
      setError(null);
      setLoading(true);
      
      if (isElectron) {
        // In Electron, trigger the login flow through IPC
        if (window.electronAPI.req.auth) {
          const result = await window.electronAPI.req.auth.initiateLogin();
          if (result.status === 0) {
            throw new Error(result.error || 'Login failed');
          }
        } else {
          throw new Error('Authentication not available in Electron');
        }
      } else {
        // In web browser, redirect to Google OAuth
        const redirectUri = `${window.location.origin}/auth/google-redirect`;
        window.location.href = `${API_BASE_URL}/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (isElectron && window.electronAPI.req.auth) {
        await window.electronAPI.req.auth.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      setError(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 