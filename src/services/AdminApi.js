import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://theglitch.world';

// Admin-specific API methods
const AdminApi = {
    getAllUsers: () => {
        const token = localStorage.getItem('token');
        return axios.get(`${API_BASE_URL}/api/users`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
    },
    
    deleteUser: (userId) => {
        const token = localStorage.getItem('token');
        return axios.delete(`${API_BASE_URL}/api/users/${userId}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
    },

    getContactMessages: () => {
        const token = localStorage.getItem('token');
        return axios.get(`${API_BASE_URL}/api/contact`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
    },

    deleteContactMessage: (messageId) => {
        const token = localStorage.getItem('token');
        return axios.delete(`${API_BASE_URL}/api/contact/${messageId}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
    }
};

export default AdminApi; 