import axios from 'axios';

// Define a fixed API base URL with proper fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// List of endpoints that should be accessible without authentication
const PUBLIC_ENDPOINTS = [
    '/api/courses',
    '/api/auth/login',
    '/api/auth/register'
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
    login: (credentials) => {
        return axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
    },
    
    register: (userData) => {
        return axios.post(`${API_BASE_URL}/api/auth/register`, userData);
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
        console.log('Attempting to fetch courses from:', `${API_BASE_URL}/api/courses`);
        
        try {
            // First try: no auth headers at all to hit the public endpoint
            const response = await axios.get(`${API_BASE_URL}/api/courses`, {
                headers: { 
                    'Accept': 'application/json'
                },
                // Bypass the interceptor that adds the auth token
                skipAuthRefresh: true
            });
            return response;
        } catch (error) {
            console.error('Error fetching courses (attempt 1):', error);
            
            try {
                // Second try: with explicit auth token if available
                console.log('Trying with explicit auth token');
                const token = localStorage.getItem('token');
                if (token) {
                    const response = await axios.get(`${API_BASE_URL}/api/courses`, {
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    });
                    return response;
                }
            } catch (err) {
                console.error('Error fetching courses (attempt 2):', err);
            }
            
            // If all else fails, create a new axios instance without interceptors
            try {
                console.log('Creating fresh axios instance without interceptors');
                const response = await axiosNoAuth.get(`${API_BASE_URL}/api/courses`);
                return response;
            } catch (err) {
                console.error('Error fetching courses (attempt 3):', err);
            }
            
            // Last resort: return mock data
            console.log('Returning mock course data');
            return {
                data: [
                    { id: 1, title: "Introduction to Trading", description: "Learn the basics of trading.", level: "Beginner", duration: 2, price: 0 },
                    { id: 2, title: "Technical Analysis", description: "Master chart patterns and indicators.", level: "Intermediate", duration: 4, price: 49.99 },
                    { id: 3, title: "Risk Management", description: "Essential strategies to protect your capital.", level: "All Levels", duration: 3, price: 29.99 },
                    { id: 4, title: "Health & Fitness", description: "Master the science of peak physical performance, biohacking techniques, and longevity protocols that enhance cognitive function, energy levels, and decision-making capabilities for sustained wealth creation", level: "All Levels", duration: 6, price: 79.99 },
                    { id: 5, title: "E-Commerce", description: "Build and scale profitable online businesses using advanced dropshipping strategies, Amazon FBA mastery, Shopify optimization, and multi-channel selling techniques that generate 6-7 figure revenues", level: "Intermediate", duration: 8, price: 99.99 },
                    { id: 6, title: "Forex Trading", description: "Master professional-grade currency trading strategies, risk management systems, and market analysis techniques used by institutional traders to consistently profit from global currency fluctuations", level: "Intermediate", duration: 6, price: 89.99 },
                    { id: 7, title: "Crypto & Blockchain", description: "Navigate the digital asset revolution with advanced DeFi strategies, yield farming protocols, NFT arbitrage, and blockchain technology investments that capitalize on the future of finance", level: "Intermediate", duration: 5, price: 79.99 },
                    { id: 8, title: "Algorithmic FX", description: "Develop sophisticated automated trading systems using machine learning, quantitative analysis, and algorithmic strategies that execute high-frequency trades with precision and minimal risk", level: "Advanced", duration: 10, price: 149.99 },
                    { id: 9, title: "Intelligent Systems Development", description: "Create cutting-edge AI applications, automated trading bots, and intelligent software solutions that generate passive income through technology innovation and system automation", level: "Advanced", duration: 12, price: 199.99 },
                    { id: 10, title: "Social Media", description: "Build massive personal brands and monetize digital influence across TikTok, Instagram, YouTube, and LinkedIn using advanced content strategies, affiliate marketing, and brand partnerships", level: "All Levels", duration: 4, price: 59.99 },
                    { id: 11, title: "Real Estate", description: "Master strategic property investment, REIT analysis, real estate crowdfunding, and PropTech opportunities that create multiple passive income streams and long-term wealth appreciation", level: "Intermediate", duration: 7, price: 119.99 }
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
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
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