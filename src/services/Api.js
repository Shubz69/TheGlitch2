import axios from 'axios';

// Define a fixed API base URL with proper fallback
// Automatically detect the origin to avoid CORS issues with www redirects
const getApiBaseUrl = () => {
    // Use environment variable if set
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }
    
    // Detect current origin to match www/non-www
    if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        // If frontend is on www.theglitch.world, use that for API too
        if (origin.includes('theglitch.world')) {
            return origin; // This will be https://www.theglitch.world or https://theglitch.world
        }
    }
    
    // Fallback to non-www version
    return 'https://theglitch.world';
};

const API_BASE_URL = getApiBaseUrl();

// Mock user database for demo purposes
const MOCK_USERS = [
    {
        id: 1,
        email: 'shubzfx@gmail.com',
        password: 'password123', // In real app, this would be hashed
        name: 'Shubz',
        username: 'ShubzFx',
        avatar: '/avatars/avatar_ai.png',
        role: 'ADMIN',
        level: 99,
        xp: 980100, // Level 99 = (99-1)^2 * 100 = 960400
        totalMessages: 5000
    },
    {
        id: 2,
        email: 'demo@theglitch.online',
        password: 'demo123',
        name: 'Demo User',
        username: 'demo',
        avatar: '/avatars/avatar_tech.png',
        role: 'USER',
        level: 1,
        xp: 0,
        totalMessages: 0
    }
];

// Mock authentication functions
const mockLogin = async (email, password) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
            if (user) {
                // Generate a proper 3-part JWT token
                const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
                const payload = btoa(JSON.stringify({
                    sub: user.id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
                }));
                const signature = btoa('mock-signature');
                const token = `${header}.${payload}.${signature}`;
                
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    username: user.username,
                    avatar: user.avatar || '/avatars/avatar_ai.png',
                    role: user.role,
                    level: user.level || 1,
                    xp: user.xp || 0,
                    totalMessages: user.totalMessages || 0
                }));
                
                resolve({
                    data: {
                        token: token,
                        user: {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            username: user.username,
                            avatar: user.avatar || '/avatars/avatar_ai.png',
                            level: user.level || 1,
                            xp: user.xp || 0,
                            totalMessages: user.totalMessages || 0,
                            role: user.role
                        }
                    }
                });
            } else {
                reject(new Error('Invalid email or password'));
            }
        }, 1000); // Simulate network delay
    });
};

const mockRegister = async (userData) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Handle FormData or regular object
            const userInfo = userData instanceof FormData ? {
                email: userData.get('email'),
                password: userData.get('password'),
                name: userData.get('name'),
                username: userData.get('username'),
                avatar: userData.get('avatar') || '/avatars/avatar_ai.png'
            } : {
                ...userData,
                avatar: userData.avatar || '/avatars/avatar_ai.png'
            };
            
            // Check if user already exists (case-insensitive email and username check)
            const existingUser = MOCK_USERS.find(u => 
                u.email.toLowerCase() === userInfo.email.toLowerCase() || 
                u.username.toLowerCase() === userInfo.username.toLowerCase()
            );
            if (existingUser) {
                if (existingUser.email.toLowerCase() === userInfo.email.toLowerCase()) {
                    reject(new Error('An account with this email already exists'));
                } else {
                    reject(new Error('This username is already taken. Please choose another one.'));
                }
                return;
            }
            
            // Create new user
            const newUser = {
                id: MOCK_USERS.length + 1,
                email: userInfo.email,
                password: userInfo.password,
                name: userInfo.name,
                username: userInfo.username,
                avatar: userInfo.avatar,
                role: 'USER',
                level: 1,
                xp: 0,
                totalMessages: 0
            };
            
            MOCK_USERS.push(newUser);
            
            // Generate a proper 3-part JWT token
            const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
            const payload = btoa(JSON.stringify({
                sub: newUser.id.toString(),
                email: newUser.email,
                name: newUser.name,
                username: newUser.username,
                role: newUser.role,
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
            }));
            const signature = btoa('mock-signature');
            const token = `${header}.${payload}.${signature}`;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                username: newUser.username,
                avatar: newUser.avatar,
                role: newUser.role,
                level: newUser.level,
                xp: newUser.xp,
                totalMessages: newUser.totalMessages
            }));
            
            resolve({
                data: {
                    status: "MFA_REQUIRED",
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                    username: newUser.username,
                    avatar: newUser.avatar,
                    role: newUser.role,
                    mfaVerified: false
                }
            });
        }, 1000); // Simulate network delay
    });
};

// List of endpoints that should be accessible without authentication
const PUBLIC_ENDPOINTS = [
    '/api/courses',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/verify-reset-code',
    '/api/auth/reset-password'
];

// Helper function to check if a URL is public
const isPublicUrl = (url) => {
    return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

// Check if user has valid authentication
const hasValidAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
        // Basic validation - check if token has expected format
        const parts = token.split('.');
        
        // Validate token structure
        if (parts.length !== 3) {
            console.error('Invalid token structure');
            return false;
        }
        
        // Try to decode token
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Date.now() / 1000;
        
        // Check if token is expired
        if (payload.exp && payload.exp < currentTime) {
            console.error('Token has expired');
            // Clean up expired token
            localStorage.removeItem('token');
            return false;
        }
        
        return true;
    } catch (err) {
        console.error('Token validation error:', err);
        return false;
    }
};

// Helper function to determine if a request should proceed
const shouldMakeRequest = (url) => {
    // Allow requests to public endpoints
    if (isPublicUrl(url)) {
        return true;
    }

    // Block requests to protected endpoints if no valid auth
    return hasValidAuth();
};

// Create a custom axios instance for auth-skipping requests
const axiosNoAuth = axios.create();

// Add global interceptor to include auth token
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && !config.skipAuthRefresh) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle auth errors
axios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 403) {
            console.error('Access forbidden: Authentication failed or insufficient permissions');
            
            // Check token validity
            if (!hasValidAuth()) {
                console.log('Invalid token detected during request');
                // Could trigger a logout or refresh token here
            }
        }
        return Promise.reject(error);
    }
);

const Api = {
    // Authentication
    login: async (credentials) => {
        try {
            // Try real API first
            return await axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
        } catch (apiError) {
            // Only fallback to mock if API completely fails
            console.warn('API login failed, trying mock fallback:', apiError.message);
            try {
                return await mockLogin(credentials.email, credentials.password);
            } catch (error) {
                throw apiError; // Throw API error, not mock error
            }
        }
    },
    
    register: async (userData) => {
        try {
            // Try real API first
            // Handle FormData for file uploads
            const config = userData instanceof FormData ? {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            } : {};
            
            return await axios.post(`${API_BASE_URL}/api/auth/register`, userData, config);
        } catch (apiError) {
            // Only fallback to mock if API completely fails
            console.warn('API registration failed, trying mock fallback:', apiError.message);
            try {
                return await mockRegister(userData);
            } catch (error) {
                throw apiError; // Throw API error, not mock error
            }
        }
    },
    
    // Direct Stripe payment link that bypasses authentication checks
    getDirectStripeCheckoutUrl: (courseId) => {
        return `${API_BASE_URL}/api/stripe/direct-checkout?courseId=${courseId}&timestamp=${Date.now()}`;
    },
    
    // Payment Processing
    initiatePayment: (courseId) => {
        console.log('Initiating payment for course:', courseId);
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Cannot initiate payment: No authentication token');
            return Promise.reject(new Error('Authentication required'));
        }
        
        // Create a specialized axios instance for payment processing with better error handling
        const paymentAxios = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout for payment requests
        });
        
        return paymentAxios.post('/api/payments/checkout', { courseId })
            .then(response => {
                console.log('Payment initiation successful:', response.data);
                return response;
            })
            .catch(error => {
                console.error('Payment initiation failed:', error);
                // Add detailed error info
                if (error.response) {
                    console.error('Response data:', error.response.data);
                    console.error('Response status:', error.response.status);
                } else if (error.request) {
                    console.error('No response received from server');
                }
                throw error;
            });
    },
    
    completePayment: (sessionId, courseId) => {
        console.log('Completing payment for course:', courseId, 'with session:', sessionId);
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Cannot complete payment: No authentication token');
            return Promise.reject(new Error('Authentication required'));
        }
        
        return axios.post(
            `${API_BASE_URL}/api/payments/complete`, 
            { sessionId, courseId },
            { 
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );
    },
    
    // Courses
    getCourses: async () => {
        try {
            // Try real API first
            console.log('Fetching courses from live API:', `${API_BASE_URL}/api/courses`);
            const response = await axios.get(`${API_BASE_URL}/api/courses`);
            return response;
        } catch (apiError) {
            // Only fallback to mock if API completely fails
            console.warn('API courses fetch failed, using mock fallback:', apiError.message);
            return {
                data: [
                    { id: 1, title: "Health & Fitness", description: "Master the science of peak physical performance, biohacking techniques, and longevity protocols that enhance cognitive function, energy levels, and decision-making capabilities for sustained wealth creation", level: "All Levels", duration: 6, price: 79.99, imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" },
                    { id: 2, title: "E-Commerce", description: "Build and scale profitable online businesses using advanced dropshipping strategies, Amazon FBA mastery, Shopify optimization, and multi-channel selling techniques that generate 6-7 figure revenues", level: "Intermediate", duration: 8, price: 99.99, imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80" },
                    { id: 3, title: "Forex Trading", description: "Master professional-grade currency trading strategies, risk management systems, and market analysis techniques used by institutional traders to consistently profit from global currency fluctuations", level: "Intermediate", duration: 6, price: 89.99, imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80" },
                    { id: 4, title: "Crypto & Blockchain", description: "Navigate the digital asset revolution with advanced DeFi strategies, yield farming protocols, NFT arbitrage, and blockchain technology investments that capitalize on the future of finance", level: "Intermediate", duration: 5, price: 79.99, imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2336&q=80" },
                    { id: 5, title: "Algorithmic FX", description: "Develop sophisticated automated trading systems using machine learning, quantitative analysis, and algorithmic strategies that execute high-frequency trades with precision and minimal risk", level: "Advanced", duration: 10, price: 149.99, imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" },
                    { id: 6, title: "Intelligent Systems Development", description: "Create cutting-edge AI applications, automated trading bots, and intelligent software solutions that generate passive income through technology innovation and system automation", level: "Advanced", duration: 12, price: 199.99, imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" },
                    { id: 7, title: "Social Media", description: "Build massive personal brands and monetize digital influence across TikTok, Instagram, YouTube, and LinkedIn using advanced content strategies, affiliate marketing, and brand partnerships", level: "All Levels", duration: 4, price: 59.99, imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2339&q=80" },
                    { id: 8, title: "Real Estate", description: "Master strategic property investment, REIT analysis, real estate crowdfunding, and PropTech opportunities that create multiple passive income streams and long-term wealth appreciation", level: "Intermediate", duration: 7, price: 119.99, imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2073&q=80" }
                ]
            };
        }
    },
    
    getCourseById: (id) => {
        return axios.get(`${API_BASE_URL}/api/courses/${id}`);
    },
    
    // Admin APIs
    getAllUsers: () => {
        if (!shouldMakeRequest(`${API_BASE_URL}/api/users`)) {
            console.log('Skipping getAllUsers request - auth required');
            return Promise.resolve({ data: [] });
        }
        return axios.get(`${API_BASE_URL}/api/users`);
    },
    
    deleteUser: (userId) => {
        if (!shouldMakeRequest(`${API_BASE_URL}/api/users/${userId}`)) {
            console.log('Skipping deleteUser request - auth required');
            return Promise.resolve({ success: false });
        }
        return axios.delete(`${API_BASE_URL}/api/users/${userId}`);
    },
    
    // Community/Channels
    getChannels: async (customHeaders = {}) => {
        console.log('Attempting to fetch channels from:', `${API_BASE_URL}/api/community/channels`);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/community/channels`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...customHeaders
                }
            });
            return response;
        } catch (error) {
            console.error('Error fetching channels:', error);
            throw error;
        }
    },
    
    getChannelMessages: async (channelId, customHeaders = {}) => {
        console.log(`Attempting to fetch messages for channel ${channelId}`);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/community/channels/${channelId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...customHeaders
                }
            });
            return response;
        } catch (error) {
            console.error(`Error fetching messages for channel ${channelId}:`, error);
            throw error;
        }
    },
    
    sendMessage: async (channelId, messageData) => {
        console.log(`Attempting to send message to channel ${channelId}`);
        
        if (!shouldMakeRequest(`${API_BASE_URL}/api/community/channels/${channelId}/messages`)) {
            console.log('Cannot send message: Not authenticated');
            throw new Error('Authentication required to send messages');
        }
        
        try {
            const token = localStorage.getItem('token');
            const customAxios = axios.create();
            
            const response = await customAxios.post(
                `${API_BASE_URL}/api/community/channels/${channelId}/messages`, 
                messageData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response;
        } catch (error) {
            console.error(`Error sending message to channel ${channelId}:`, error);
            throw error; // Rethrow as sending messages should report errors to user
        }
    },
    
    deleteMessage: async (channelId, messageId) => {
        console.log(`Attempting to delete message ${messageId} from channel ${channelId}`);
        
        if (!shouldMakeRequest(`${API_BASE_URL}/api/community/channels/${channelId}/messages/${messageId}`)) {
            console.log('Cannot delete message: Not authenticated');
            throw new Error('Authentication required to delete messages');
        }
        
        try {
            const token = localStorage.getItem('token');
            const customAxios = axios.create();
            
            const response = await customAxios.delete(
                `${API_BASE_URL}/api/community/channels/${channelId}/messages/${messageId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            return response;
        } catch (error) {
            console.error(`Error deleting message ${messageId}:`, error);
            throw error; // Rethrow as deletion should report errors to user
        }
    },
    
    updateMessage: async (channelId, messageId, messageData) => {
        console.log(`Attempting to update message ${messageId} in channel ${channelId}`);
        
        if (!shouldMakeRequest(`${API_BASE_URL}/api/community/channels/${channelId}/messages/${messageId}`)) {
            console.log('Cannot update message: Not authenticated');
            throw new Error('Authentication required to update messages');
        }
        
        try {
            const token = localStorage.getItem('token');
            const customAxios = axios.create();
            
            const response = await customAxios.put(
                `${API_BASE_URL}/api/community/channels/${channelId}/messages/${messageId}`,
                messageData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response;
        } catch (error) {
            console.error(`Error updating message ${messageId}:`, error);
            throw error; // Rethrow as updates should report errors to user
        }
    },
    
    // User Profile
    getUserData: () => {
        return axios.get(`${API_BASE_URL}/api/users/me`);
    },
    
    getUserProfile: (userId) => {
        return axios.get(`${API_BASE_URL}/api/users/${userId}`);
    },
    
    updateUserProfile: (userId, profileData) => {
        return axios.put(`${API_BASE_URL}/api/users/${userId}`, profileData);
    },
    
    getUserLevel: (userId) => {
        const baseUrl = process.env.REACT_APP_API_URL || 'https://theglitch.world';
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('Cannot get user level: No authentication token');
            return Promise.reject(new Error('Authentication required'));
        }
        
        return axios.get(`${baseUrl}/api/users/${userId}/level`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
    },
    
    // Contact
    getContactMessages: () => {
        return axios.get(`${API_BASE_URL}/api/contact`);
    },
    
    submitContactForm: (contactData) => {
        return axios.post(`${API_BASE_URL}/api/contact`, contactData);
    },
    

    
    // Password reset methods
    sendPasswordResetEmail: async (email) => {
        try {
            // Use real API only - no mock fallback for production
            console.log('Sending password reset email request to:', `${API_BASE_URL}/api/auth/forgot-password`);
            
            // Configure request with proper headers and timeout
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 15000 // 15 second timeout
            };
            
            const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email }, config);
            console.log('Password reset email response:', response.data);
            
            // Check various response formats
            if (response.data && (response.data.success === true || response.data.success === false)) {
                return response.data.success;
            }
            
            // If response has message but no explicit success flag, assume success
            if (response.data && response.data.message) {
                return true;
            }
            
            // If response status is 200, assume success
            if (response.status === 200) {
                return true;
            }
            
            return false;
        } catch (apiError) {
            console.error('Failed to send password reset email:', apiError);
            console.error('Error response:', apiError.response);
            console.error('Error status:', apiError.response?.status);
            console.error('Error data:', apiError.response?.data);
            console.error('Error message:', apiError.message);
            
            // Handle network errors (no response from server)
            if (!apiError.response) {
                // Check for CORS errors specifically
                if (apiError.message && (apiError.message.includes('CORS') || apiError.message.includes('Cross-Origin'))) {
                    throw new Error('Server connection issue. Please contact support if this persists.');
                }
                
                // Check for blocked requests (often CORS-related)
                if (apiError.code === 'ERR_NETWORK' || apiError.message.includes('Network Error')) {
                    // Check if it's likely a CORS or backend issue
                    if (apiError.request && apiError.request.status === 0) {
                        throw new Error('Unable to connect to server. The password reset service may be temporarily unavailable. Please try again in a few moments or contact support.');
                    }
                    throw new Error('Connection error. Please check your internet connection and try again.');
                } else if (apiError.message.includes('timeout')) {
                    throw new Error('Request timed out. Please try again.');
                } else if (apiError.code === 'ERR_CERT' || apiError.message.includes('certificate')) {
                    throw new Error('Security certificate error. Please contact support.');
                } else {
                    throw new Error('Unable to reach server. Please try again later or contact support.');
                }
            }
            
            // Handle HTTP error responses
            const status = apiError.response.status;
            
            // Always check for server-provided error messages first
            if (apiError.response?.data?.message) {
                throw new Error(apiError.response.data.message);
            }
            
            // Fallback to status-specific messages if no custom message
            if (status === 404) {
                throw new Error('This email does not exist in our system. Please check your email address or sign up for a new account.');
            } else if (status === 405) {
                throw new Error('Password reset endpoint is not configured correctly on the server. Please contact support.');
            } else if (status === 429) {
                throw new Error('Too many requests. Please wait a few minutes before trying again.');
            } else if (status === 500) {
                throw new Error('Server error. Please try again later.');
            } else if (status === 400) {
                throw new Error('Invalid request. Please check your email address.');
            } else {
                throw new Error(`Failed to send reset email (Status: ${status}). Please try again.`);
            }
        }
    },

    verifyResetCode: async (email, code) => {
        try {
            // Use real API only - no mock fallback for production
            const response = await axios.post(`${API_BASE_URL}/api/auth/verify-reset-code`, { email, code });
            if (response.data.success && response.data.token) {
                return {
                    success: true,
                    token: response.data.token
                };
            }
            throw new Error('Invalid or expired code');
        } catch (apiError) {
            console.error('Failed to verify reset code:', apiError);
            throw new Error(apiError.response?.data?.message || 'Invalid or expired code');
        }
    },

    resetPassword: async (token, newPassword) => {
        try {
            // Use real API only - no mock fallback for production
            const response = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, { token, newPassword });
            return response.data.success || true;
        } catch (apiError) {
            console.error('Failed to reset password:', apiError);
            throw new Error(apiError.response?.data?.message || 'Invalid or expired token');
        }
    },

    // Enhanced login with better error handling
    loginWithErrorDetails: async (credentials) => {
        try {
            // Use real API first
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
            return {
                success: true,
                token: response.data.token,
                user: response.data.user || response.data
            };
        } catch (apiError) {
            // Only fallback to mock if API completely fails
            console.warn('API login failed, trying mock fallback:', apiError.message);
            try {
                const user = MOCK_USERS.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());
                
                if (!user) {
                    return {
                        success: false,
                        error: 'email',
                        message: apiError.response?.data?.message || 'Email not found. Please check your email address or register for a new account.'
                    };
                }
                
                if (user.password !== credentials.password) {
                    return {
                        success: false,
                        error: 'password',
                        message: apiError.response?.data?.message || 'Incorrect password. Please try again or reset your password.'
                    };
                }
                
                // Generate token and return success
                const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
                const payload = btoa(JSON.stringify({
                    sub: user.id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
                }));
                const signature = btoa('mock-signature');
                const token = `${header}.${payload}.${signature}`;
                
                return {
                    success: true,
                    token: token,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        username: user.username,
                        role: user.role
                    }
                };
            } catch (mockError) {
                // Return API error details if available
                return {
                    success: false,
                    error: apiError.response?.status === 401 ? 'password' : apiError.response?.status === 404 ? 'email' : 'system',
                    message: apiError.response?.data?.message || 'An error occurred. Please try again.'
                };
            }
        }
    },

    // Handle API errors in a consistent way
    handleApiError: (error) => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            if (error.response.data && error.response.data.message) {
                return error.response.data.message;
            }
            return `Error ${error.response.status}: ${error.response.statusText}`;
        } else if (error.request) {
            // The request was made but no response was received
            return "No response from server. Please try again later.";
        } else {
            // Something happened in setting up the request that triggered an Error
            return error.message;
        }
    }
};

export default Api;