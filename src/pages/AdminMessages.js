import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/AdminMessages.css';
import '../styles/SharedBackground.css';
import AdminApi from '../services/AdminApi';
import SharedBackground from '../components/SharedBackground';

const AdminMessages = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!user || !user.role === 'ADMIN') {
                setError('Access denied. Admin privileges required.');
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Try using the AdminApi service
                try {
                    const response = await AdminApi.getContactMessages();
                    console.log('Contact messages received:', response.data);
                    setMessages(response.data);
                    setError(null);
                } catch (apiError) {
                    console.error("API service method failed, using direct fetch:", apiError);
                    
                    // Fallback to direct fetch
                    const token = localStorage.getItem("token");
                    const res = await fetch("https://theglitch.world/api/contact", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    
                    if (!res.ok) {
                        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
                    }
                    
                    const data = await res.json();
                    console.log('Contact messages received via direct fetch:', data);
                    setMessages(data);
                    setError(null);
                }
            } catch (err) {
                console.error("Failed to fetch messages:", err);
                setError(`Failed to load messages: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [user]);

    if (!user || user.role !== 'ADMIN') {
        return (
            <div className="admin-messages-container">
                <SharedBackground />
                <div className="glitch-bg"></div>
                <div className="access-denied">
                    <h1 className="glitch-title">ACCESS DENIED</h1>
                    <p>You must be an admin to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-messages-container">
            <SharedBackground />
            {/* Glitch Background Effect */}
            <div className="glitch-bg"></div>
            
            <div className="admin-messages-content">
                <div className="admin-header">
                    <h1 className="glitch-title">CONTACT SUBMISSIONS</h1>
                    <p className="admin-subtitle">Review and manage user contact messages</p>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <div className="loading-text">Loading messages...</div>
                    </div>
                ) : error ? (
                    <div className="error-container">
                        <span className="error-icon">⚠️</span>
                        <p className="error-message">{error}</p>
                        <button onClick={() => window.location.reload()} className="retry-btn">
                            Retry
                        </button>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>No Messages Yet</h3>
                        <p>When users submit contact forms, they will appear here.</p>
                    </div>
                ) : (
                    <div className="messages-section">
                        <div className="messages-header">
                            <h3>📨 User Messages ({messages.length})</h3>
                        </div>
                        <div className="messages-grid">
                            {messages.map((msg) => (
                                <div key={msg.id || Math.random().toString()} className="message-card">
                                    <div className="message-header">
                                        <div className="user-info">
                                            <div className="user-avatar">
                                                <span className="avatar-letter">{msg.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                                            </div>
                                            <div className="user-details">
                                                <div className="user-name">{msg.name || 'Anonymous'}</div>
                                                <div className="user-email">{msg.email || 'No email'}</div>
                                            </div>
                                        </div>
                                        <div className="message-time">
                                            <span className="time-icon">🕒</span>
                                            {new Date(msg.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="message-content">
                                        {msg.message || 'No message content'}
                                    </div>
                                    <div className="message-actions">
                                        <button className="action-btn reply-btn">Reply</button>
                                        <button className="action-btn mark-read-btn">Mark Read</button>
                                        <button className="action-btn delete-btn">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminMessages;
