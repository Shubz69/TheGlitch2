import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Api from '../services/Api';
import { jwtDecode } from 'jwt-decode';

// Create the context
const AuthContext = createContext(null);

// Custom hook for using the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mfaVerified, setMfaVerified] = useState(false);
  const navigate = useNavigate();

  // Function to get token from localStorage
  const getToken = useCallback(() => {
    return localStorage.getItem('token');
  }, []);

  // Check if user has a verified session in localStorage
  useEffect(() => {
    const mfaVerifiedStatus = localStorage.getItem('mfaVerified');
    if (mfaVerifiedStatus === 'true') {
      setMfaVerified(true);
    }
  }, []);

  // Logout function defined using useCallback
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('mfaVerified');
    setUser(null);
    setMfaVerified(false);
    navigate('/login');
  }, [navigate]);

  // Check if token exists and is valid on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Check if token is expired
        try {
          const decodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime) {
            // Token expired
            console.log('Token expired, logging out');
            logout();
            setLoading(false);
            return;
          }
          
          // Token is valid, get minimal user info from token
          // No API call for now to avoid errors
          const userData = {
            id: decodedToken.id || decodedToken.userId || decodedToken.sub,
            email: decodedToken.email || '',
            role: decodedToken.role || 'USER'
          };
          
          // Store user data in localStorage for components that need it
          localStorage.setItem('user', JSON.stringify(userData));
          
          setUser(userData);
          
          // If user is ADMIN, bypass MFA verification
          if (userData.role === 'ADMIN') {
            localStorage.setItem('mfaVerified', 'true');
            setMfaVerified(true);
          }
          
          setLoading(false);
        } catch (tokenError) {
          console.error('Token decode error:', tokenError);
          logout();
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setError(error.message || 'Authentication failed');
        logout();
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [logout]);

  // Login function - supports both email/password login and token-based login from MFA
  const login = async (emailOrToken, passwordOrRole, userData = null) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check which login method is being used
      if (userData) {
        // This is a direct login with token (from MFA verification)
        const token = emailOrToken;
        const role = passwordOrRole;
        
        // Token is already set in localStorage by the VerifyMFA component
        
        // Set MFA as verified
        localStorage.setItem('mfaVerified', 'true');
        setMfaVerified(true);
        
        setUser({
          ...userData,
          role
        });
        
        return userData;
      } else {
        // This is an email/password login
        const email = emailOrToken;
        const password = passwordOrRole;
        
        // Call the login API
        const response = await Api.login({ email, password });
        const data = response.data;
        
        console.log('Login response:', data);
        
        if (data.status === "MFA_REQUIRED" && !data.mfaVerified) {
          // Redirect to MFA verification
          console.log('MFA required, redirecting to verification page');
          
          // Set email for MFA verification
          localStorage.setItem('mfaEmail', email);
          
          // Navigate programmatically to the MFA verification page
          // with proper state data that won't be lost in browser history
          navigate('/verify-mfa', {
            state: {
              userId: data.id,
              email: email,
              requiresVerification: true,
              userData: data,
              returnUrl: '/community'
            },
            replace: true  // Replace the history entry so back button works properly
          });
          
          // Return early to prevent further processing
          setLoading(false);
          return data;
        }
        
        // Store the token and set user data
        localStorage.setItem('token', data.token);
        
        // If there's a refreshToken in the response, store it
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        const userInfo = {
          id: data.id,
          username: data.username,
          email: data.email,
          name: data.name,
          avatar: data.avatar,
          phone: data.phone || "",
          address: data.address || "",
          role: data.role,
          mfaVerified: data.mfaVerified || false
        };
        
        // Store user data in localStorage for other components
        localStorage.setItem('user', JSON.stringify(userInfo));
        
        setUser(userInfo);
        
        // If user is ADMIN, bypass MFA verification
        if (data.role === 'ADMIN') {
          localStorage.setItem('mfaVerified', 'true');
          setMfaVerified(true);
        }
        
        // Redirect to community after successful login
        navigate('/community');
        
        return data;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(Api.handleApiError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await Api.register(userData);
      const data = response.data;
      
      if (data.status === "MFA_REQUIRED") {
        // Redirect to MFA verification
        console.log('MFA required after registration, redirecting to verification page');
        navigate('/verify-mfa', {
          state: {
            userId: data.id,
            email: userData.email,
            requiresVerification: true,
            userData: data
          }
        });
        return;
      }
      
      // Store the token
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        const userInfo = {
          id: data.id,
          username: data.username,
          email: data.email,
          name: data.name,
          avatar: data.avatar,
          role: data.role
        };
        
        setUser(userInfo);
        
        // Send welcome message to new user
        sendWelcomeMessage(userInfo.id, userData.email);
        
        // If user is ADMIN, bypass MFA verification
        if (data.role === 'ADMIN') {
          localStorage.setItem('mfaVerified', 'true');
          setMfaVerified(true);
        }
        
        // For new signups, redirect to subscription page
        // Check if this is a new signup (from SignUp page)
        if (localStorage.getItem('newSignup') === 'true') {
          localStorage.setItem('pendingSubscription', 'true');
          navigate('/subscription');
          return data;
        }
      }
      
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      setError(Api.handleApiError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Verify MFA function
  const verifyMfa = () => {
    localStorage.setItem('mfaVerified', 'true');
    setMfaVerified(true);
  };

  // Function to send welcome message to new users
  const sendWelcomeMessage = (userId, email) => {
    const welcomeMessage = {
      id: Date.now(),
      text: `Welcome to THE GLITCH platform, ${email}! 🎉 We're excited to have you join our community. Our admin team is here to help you get started and answer any questions you might have. Feel free to reach out anytime!`,
      sender: 'admin',
      timestamp: new Date().toISOString(),
      read: false
    };

    // Store the welcome message
    const existingMessages = JSON.parse(localStorage.getItem(`messages_${userId}`) || '[]');
    const updatedMessages = [...existingMessages, welcomeMessage];
    localStorage.setItem(`messages_${userId}`, JSON.stringify(updatedMessages));

    // Also notify admin about new user
    const adminNotification = {
      id: Date.now() + 1,
      text: `New user registered: ${email}`,
      sender: 'system',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'user_registration'
    };

    const adminMessages = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
    const updatedAdminMessages = [...adminMessages, adminNotification];
    localStorage.setItem('admin_notifications', JSON.stringify(updatedAdminMessages));
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    mfaVerified,
    verifyMfa
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
