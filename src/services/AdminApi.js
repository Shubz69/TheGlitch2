import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

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

    getContactMessages: async () => {
        const base = process.env.REACT_APP_API_URL || 'http://localhost:8080';
        const token = localStorage.getItem('token');
        const res = await fetch(`${base}/api/contact`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        return { data: await res.json() };
    }
};

export default AdminApi; 