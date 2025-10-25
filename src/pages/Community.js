import React, { useEffect, useState, useRef, useCallback } from 'react';
import '../styles/Community.css';
import '../styles/SharedBackground.css';
import { useWebSocket } from '../utils/useWebSocket';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Api from '../services/Api';
import SharedBackground from '../components/SharedBackground';

// Icons
import { FaHashtag, FaLock, FaBullhorn, FaUserAlt, FaPaperPlane, FaSmile, FaCrown, FaShieldAlt, FaBan, FaVolumeMute, FaTrash, FaPaperclip, FaTimes } from 'react-icons/fa';
import { BsStars } from 'react-icons/bs';
import { RiAdminFill } from 'react-icons/ri';

// Set this to true to use mock data instead of real API calls
const MOCK_MODE = true;

// Emojis array for the emoji picker
const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧',
    '😮', '😲', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮',
    '💪', '👍', '👎', '👏', '🙌', '👋', '🤝', '🙏', '💰', '💸',
    '💎', '💵', '💴', '💶', '💷', '🚀', '📈', '📉', '💹', '⚡',
    '🔥', '⭐', '✨', '💫', '🌟', '🎯', '🎮', '🎵', '🎶', '❤️',
    '💜', '💙', '💚', '💛', '🧡', '🖤', '🤍', '🤎', '💔', '❣️'
];

// Helper function to get correct avatar path
const getAvatarPath = (avatarName) => {
    if (!avatarName) return '/avatars/avatar_ai.png';
    
    // Check if the avatarName already has the full path
    if (avatarName.startsWith('/')) return avatarName;
    if (avatarName.startsWith('http')) return avatarName;
    
    // Handle numbered avatars (avatar1, avatar2, etc)
    if (avatarName.startsWith('avatar')) {
        return `/avatars/${avatarName}.png`;
    }
    
    // Default case
    return `/avatars/${avatarName}`;
};

// Modified mock data with proper avatar paths
const MOCK_DATA = {
    channels: [
        // Announcements Category
        { id: 25, name: "welcome", description: "Welcome to the trading platform", accessLevel: "admin-only", category: "announcements" },
        { id: 26, name: "announcements", description: "Important platform announcements", accessLevel: "admin-only", category: "announcements" },
        
        // Staff Category
        { id: 39, name: "staff-lounge", description: "Admin only channel", accessLevel: "admin-only", category: "staff" },
        
        // Courses Category
        { id: 40, name: "intro-to-trading", description: "Introduction to Trading course channel", accessLevel: "open", courseId: 1, category: "courses" },
        { id: 41, name: "technical-analysis", description: "Technical Analysis course channel", accessLevel: "open", courseId: 2, category: "courses" },
        { id: 42, name: "fundamental-analysis", description: "Fundamental Analysis course channel", accessLevel: "open", courseId: 3, category: "courses" },
        { id: 43, name: "crypto-trading", description: "Cryptocurrency Trading course channel", accessLevel: "open", courseId: 4, category: "courses" },
        { id: 44, name: "day-trading", description: "Day Trading course channel", accessLevel: "open", courseId: 5, category: "courses" },
        { id: 45, name: "swing-trading", description: "Swing Trading course channel", accessLevel: "open", courseId: 6, category: "courses" },
        { id: 46, name: "trading-psychology", description: "Trading Psychology course channel", accessLevel: "open", courseId: 7, category: "courses" },
        { id: 47, name: "risk-management", description: "Risk Management course channel", accessLevel: "open", courseId: 8, category: "courses" },
        { id: 48, name: "trading-plan", description: "Trading Plan course channel", accessLevel: "open", courseId: 9, category: "courses" },
        
        // Trading Category
        { id: 28, name: "general-chat", description: "General trading discussion", accessLevel: "open", category: "trading" },
        { id: 34, name: "strategy-sharing", description: "Share and discuss trading strategies", accessLevel: "open", category: "trading" },
        { id: 35, name: "trade-ideas", description: "Share your trading ideas", accessLevel: "open", category: "trading" },
        { id: 36, name: "market-analysis", description: "Market analysis and insights", accessLevel: "open", category: "trading" },
        { id: 29, name: "rookie-hub", description: "For new traders (level 1+)", accessLevel: "open", minLevel: 1, category: "trading" },
        { id: 30, name: "pro-discussion", description: "For experienced traders (level 25+)", accessLevel: "open", minLevel: 25, category: "trading" },
        
        // General Category
        { id: 27, name: "off-topic", description: "General off-topic chat", accessLevel: "open", category: "general" },
        { id: 31, name: "gaming", description: "Gaming discussion", accessLevel: "open", category: "general" },
        { id: 32, name: "music", description: "Music and entertainment", accessLevel: "open", category: "general" },
        { id: 33, name: "memes", description: "Share memes and funny content", accessLevel: "open", category: "general" },
        
        // Support Category
        { id: 37, name: "help-support", description: "Get help and support", accessLevel: "open", category: "support" },
        { id: 38, name: "bug-reports", description: "Report bugs and issues", accessLevel: "open", category: "support" },
        { id: 49, name: "feature-requests", description: "Request new features", accessLevel: "open", category: "support" },
        
        // Premium Category
        { id: 50, name: "vip-lounge", description: "Exclusive VIP members chat", accessLevel: "open", category: "premium" },
        { id: 51, name: "premium-signals", description: "Premium trading signals", accessLevel: "open", category: "premium" },
        { id: 52, name: "elite-insights", description: "For advanced traders (level 50+)", accessLevel: "open", minLevel: 50, category: "premium" }
    ],
    onlineUsers: [
        { 
            id: 1, 
            username: 'ShubzFx', 
            avatar: '/avatars/avatar_ai.png', 
            status: 'online',
            role: 'PREMIUM'
        },
        { 
            id: 2, 
            username: 'test-user', 
            avatar: '/avatars/avatar_tech.png', 
            status: 'online',
            role: 'FREE'
        }
    ]
};

// Mock WebSocket for development
const useMockWebSocket = (channelId, onMessageCallback) => {
    const [isConnected] = useState(true);
    const [connectionError] = useState(null);
    
    const sendMessage = useCallback((message) => {
        console.log('MOCK WebSocket: Message sent', message);
        
        // Simulate message being added to state after a short delay
        setTimeout(() => {
            if (onMessageCallback) {
                onMessageCallback({
                    ...message,
                    id: Date.now(),
                    timestamp: Date.now(),
                    channelId: channelId
                });
            }
        }, 100);
    }, [channelId, onMessageCallback]);

    return {
        isConnected,
        connectionError,
        sendMessage
    };
};

// Emoji picker component
const EmojiPicker = ({ onEmojiSelect, onClose }) => {
    return (
        <div className="emoji-picker" onClick={(e) => e.stopPropagation()}>
            <div className="emoji-picker-header">
                <span>Emoji</span>
                <button className="emoji-picker-close" onClick={onClose}>×</button>
            </div>
            <div className="emoji-grid">
                {emojis.map((emoji, index) => (
                    <button
                        key={index}
                        className="emoji-item"
                        onClick={() => onEmojiSelect(emoji)}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
};

// Get category icon
const getCategoryIcon = (category) => {
    switch(category) {
        case 'announcements': return '📢';
        case 'staff': return '👨‍💼';
        case 'courses': return '📚';
        case 'trading': return '📈';
        case 'general': return '💬';
        case 'support': return '🆘';
        case 'premium': return '⭐';
        default: return '#';
    }
};

// Get channel icon
const getChannelIcon = (channel) => {
    if (channel.accessLevel === 'admin-only') return <FaLock />;
    if (channel.category === 'announcements') return <FaBullhorn />;
    return <FaHashtag />;
};

// Main Community Component
const Community = () => {
    const { user: authUser } = useAuth();
    const [userLevel, setUserLevel] = useState(1);
    const [storedUser, setStoredUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { id: channelIdParam } = useParams();
    
    const [channelList, setChannelList] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [onlineUsers, setOnlineUsers] = useState([]);
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);
    
    // Discord-like features
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const fileInputRef = useRef(null);
    
    // Get effective MOCK mode
    const effectiveMockMode = MOCK_MODE;
    
    // Initialize WebSocket connections
    const realWebSocketResult = useWebSocket(
        selectedChannel?.id,
        (message) => {
            console.log('Real WebSocket: Message received', message);
            setMessages(prev => {
                const isDuplicate = prev.some(m => 
                    m.content === message.content && 
                    m.sender?.username === message.sender?.username &&
                    Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 5000
                );
                
                if (isDuplicate) {
                    console.log('Skipping duplicate message');
                    return prev;
                }
                
                const newMessages = [...prev, message];
                // Save to localStorage
                if (selectedChannel?.id) {
                    saveMessagesToStorage(selectedChannel.id, newMessages);
                }
                return newMessages;
            });
        }
    );
    
    const mockWebSocketResult = useMockWebSocket(
        selectedChannel?.id,
        (message) => {
            console.log('Mock WebSocket: Message received', message);
            setMessages(prev => {
                const newMessages = [...prev, message];
                // Save to localStorage
                if (selectedChannel?.id) {
                    saveMessagesToStorage(selectedChannel.id, newMessages);
                }
                return newMessages;
            });
        }
    );
    
    const { 
        sendMessage: sendSocketMessage,
        isConnected, 
        connectionError 
    } = effectiveMockMode ? mockWebSocketResult : realWebSocketResult;

    const shouldUseMockData = effectiveMockMode || !!connectionError;

    // ***** LOCALSTORAGE FUNCTIONS FOR MESSAGE PERSISTENCE *****
    
    // Save messages to localStorage
    const saveMessagesToStorage = (channelId, messages) => {
        try {
            const key = `community_messages_${channelId}`;
            localStorage.setItem(key, JSON.stringify(messages));
            console.log(`Saved ${messages.length} messages to localStorage for channel ${channelId}`);
        } catch (error) {
            console.error('Error saving messages to localStorage:', error);
        }
    };

    // Load messages from localStorage
    const loadMessagesFromStorage = (channelId) => {
        try {
            const key = `community_messages_${channelId}`;
            const stored = localStorage.getItem(key);
            if (stored) {
                const messages = JSON.parse(stored);
                console.log(`Loaded ${messages.length} messages from localStorage for channel ${channelId}`);
                return messages;
            }
        } catch (error) {
            console.error('Error loading messages from localStorage:', error);
        }
        return [];
    };

    // Check for valid auth token
    const hasValidToken = () => {
        const token = localStorage.getItem('token');
        if (!token) return false;
        
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return false;
            
            const payload = JSON.parse(atob(parts[1]));
            const currentTime = Date.now() / 1000;
            
            if (payload.exp && payload.exp < currentTime) {
                console.log('Token expired');
                return false;
            }
            
            return true;
        } catch (e) {
            console.error('Token validation error:', e);
            return false;
        }
    };

    // Get user's role
    const getCurrentUserRole = () => {
        if (isAdmin) return 'admin';
        if (storedUser?.role) return storedUser.role.toLowerCase();
        return 'free';
    };

    // Get user's courses
    const getUserCourses = () => {
        return storedUser?.courses || [];
    };

    // Check if user can access channel
    const canUserAccessChannel = (channel) => {
        const userRole = getCurrentUserRole();
        const userCourses = getUserCourses();
        
        // Admins can access everything
        if (userRole === 'admin' || isAdmin) {
            return true;
        }
        
        // Check access level
        if (channel.accessLevel === 'admin-only') {
            return false;
        }
        
        if (channel.accessLevel === 'open') {
            return true;
        }
        
        if (channel.accessLevel === 'premium') {
            return userRole === 'premium';
        }
        
        if (channel.accessLevel === 'level') {
            return userLevel >= (channel.minLevel || 0);
        }
        
        if (channel.accessLevel === 'course') {
            return userCourses.some(course => course.id === channel.courseId);
        }
        
        return true;
    };

    // Check if user can post in channel
    const canUserPostInChannel = (channel) => {
        const userRole = getCurrentUserRole();
        
        // Admin-only channels: only admins can post
        if (channel.accessLevel === 'admin-only') {
            return userRole === 'admin' || isAdmin;
        }
        
        // All other channels: if you can access, you can post
        return canUserAccessChannel(channel);
    };

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Emoji selection handler
    const handleEmojiSelect = (emoji) => {
        const input = messageInputRef.current;
        if (input) {
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const text = newMessage;
            const before = text.substring(0, start);
            const after = text.substring(end);
            
            setNewMessage(before + emoji + after);
            
            // Set cursor position after emoji
            setTimeout(() => {
                input.focus();
                input.setSelectionRange(start + emoji.length, start + emoji.length);
            }, 0);
        }
        setShowEmojiPicker(false);
    };

    // File selection handler
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            
            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFilePreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                setFilePreview(null);
            }
        }
    };

    // Remove selected file
    const removeSelectedFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Fetch messages for a channel
    const fetchMessages = useCallback(async (channelId) => {
        if (!channelId) return;
        
        // First, try to load from localStorage
        const storedMessages = loadMessagesFromStorage(channelId);
        if (storedMessages.length > 0) {
            setMessages(storedMessages);
        } else {
            setMessages([]);
        }
        
        setLoading(false);
    }, []);

    // Initialize component
    useEffect(() => {
        console.log("===========================");
        console.log("MOCK_MODE:", MOCK_MODE);
        
        const storedToken = localStorage.getItem('token');
        const storedUserData = JSON.parse(localStorage.getItem('user') || '{}');
        
        const tokenIsValid = storedToken && storedToken.split('.').length === 3;
        setIsAuthenticated(tokenIsValid);
        
        console.log("Community component initializing");
        console.log("Is authenticated:", tokenIsValid);
        console.log("User object:", storedUserData);
        console.log("===========================");

        if (tokenIsValid) {
            // Ensure user has a displayable name
            // Priority: username > name > email prefix > 'User'
            let displayName = storedUserData.username || storedUserData.name;
            if (!displayName && storedUserData.email) {
                // Extract username from email (everything before @)
                displayName = storedUserData.email.split('@')[0];
            }
            if (!displayName) {
                displayName = 'User';
            }
            
            // Create enhanced user object with guaranteed username
            const enhancedUser = {
                ...storedUserData,
                username: displayName
            };
            
            setStoredUser(enhancedUser);
            setUserId(storedUserData.id);
            
            // Check if user is admin
            const adminEmail = 'shubzfx@gmail.com';
            const userIsAdmin = storedUserData.email?.toLowerCase() === adminEmail.toLowerCase() || 
                               storedUserData.role?.toLowerCase() === 'admin';
            setIsAdmin(userIsAdmin);
            
            // Set user level
            setUserLevel(storedUserData.level || 1);
            
            console.log("Display name:", displayName);
            console.log("User level:", storedUserData.level || 1);
            console.log("User is admin:", userIsAdmin);
            console.log("User role:", storedUserData.role);
        } else {
            console.log("User not authenticated, redirecting to login");
            navigate('/login');
        }
    }, [navigate]);

    // Load channels
    useEffect(() => {
        if (!isAuthenticated) return;
        
        // Always use mock data for channels
        const mockChannels = MOCK_DATA.channels.map(channel => ({
            ...channel,
            memberCount: 0,
            lastActivity: null,
            unread: false,
            locked: channel.accessLevel === 'admin-only'
        }));
        
        console.log(`Loaded ${mockChannels.length} channels`);
        setChannelList(mockChannels);
        
        // Load online users
        setOnlineUsers(MOCK_DATA.onlineUsers);
        
        // Select first channel or channel from URL
        if (channelIdParam) {
            const channel = mockChannels.find(c => c.id === parseInt(channelIdParam));
            if (channel) {
                setSelectedChannel(channel);
            }
        } else if (mockChannels.length > 0 && !selectedChannel) {
            setSelectedChannel(mockChannels[0]);
        }
    }, [isAuthenticated, channelIdParam, selectedChannel]);

    // Load messages when channel changes
    useEffect(() => {
        if (selectedChannel) {
            fetchMessages(selectedChannel.id);
            navigate(`/community/${selectedChannel.id}`);
        }
    }, [selectedChannel, fetchMessages, navigate]);

    // Handle send message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !selectedChannel) return;

        // Check if user can send messages in this channel
        if (!canUserPostInChannel(selectedChannel)) {
            alert("You don't have permission to send messages in this channel.");
            return;
        }

        try {
            const message = {
                id: Date.now(),
                channelId: selectedChannel.id,
                content: newMessage,
                sender: {
                    id: userId,
                    username: storedUser?.username || storedUser?.name || 'User',
                    avatar: storedUser?.avatar || '/avatars/avatar_ai.png',
                    role: getCurrentUserRole()
                },
                timestamp: new Date().toISOString(),
                file: selectedFile ? {
                    name: selectedFile.name,
                    type: selectedFile.type,
                    size: selectedFile.size,
                    preview: filePreview
                } : null
            };
            
            // Add message to state immediately
            const updatedMessages = [...messages, message];
            setMessages(updatedMessages);
            
            // Save to localStorage
            saveMessagesToStorage(selectedChannel.id, updatedMessages);
            
            // Clear inputs
            setNewMessage('');
            removeSelectedFile();
            
            console.log('Message sent:', message);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMs = now - date;
        const diffInMinutes = Math.floor(diffInMs / 60000);
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Group channels by category
    const groupedChannels = channelList.reduce((acc, channel) => {
        const category = channel.category || 'general';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(channel);
        return acc;
    }, {});

    // Category order
    const categoryOrder = ['announcements', 'staff', 'courses', 'trading', 'general', 'support', 'premium'];

    // Render
    return (
        <div className="community-container">
            <SharedBackground />
            
            {/* LEFT SIDEBAR - CHANNELS */}
            <div className="community-sidebar">
                <div className="sidebar-header">
                    <h2>Channels</h2>
                </div>
                
                <div className="channels-section">
                    {categoryOrder.map(categoryName => {
                        const channels = groupedChannels[categoryName];
                        if (!channels || channels.length === 0) return null;
                        
                        return (
                            <div key={categoryName} className="channel-category">
                                <div className="category-header">
                                    <span className="category-icon">{getCategoryIcon(categoryName)}</span>
                                    <h3 className="category-title">{categoryName}</h3>
                                    <span className="category-count">{channels.length}</span>
                                </div>
                                
                                <ul className="channels-list">
                                    {channels.map(channel => {
                                        const canAccess = canUserAccessChannel(channel);
                                        const isActive = selectedChannel?.id === channel.id;
                                        
                                        return (
                                            <li 
                                                key={channel.id}
                                                className={`channel-item ${isActive ? 'active' : ''} ${channel.unread ? 'unread' : ''}`}
                                                onClick={() => canAccess && setSelectedChannel(channel)}
                                                style={{ cursor: canAccess ? 'pointer' : 'not-allowed', opacity: canAccess ? 1 : 0.5 }}
                                            >
                                                <span className="channel-icon">
                                                    {getChannelIcon(channel)}
                                                </span>
                                                <span className="channel-name">{channel.name}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                </div>
                
                {/* User Profile at Bottom */}
                <div className="sidebar-footer" style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <img 
                        src={getAvatarPath(storedUser?.avatar)} 
                        alt="avatar"
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: '2px solid var(--purple-primary)'
                        }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                            fontWeight: 600, 
                            fontSize: '0.9rem',
                            color: 'white',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {storedUser?.username || storedUser?.name || 'User'}
                        </div>
                        <div style={{ 
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)'
                        }}>
                            Level {userLevel}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* MAIN CHAT AREA */}
            <div className="chat-main">
                {selectedChannel ? (
                    <>
                        {/* Chat Header */}
                        <div className="chat-header">
                            <h2>
                                {selectedChannel.name}
                                <span className="channel-access-badge">
                                    FREE FOR ALL USERS
                                </span>
                            </h2>
                        </div>
                        
                        {/* Messages */}
                        <div className="chat-messages">
                            {messages.length === 0 ? (
                                <div className="empty-state">
                                    <h3>Welcome to #{selectedChannel.name}</h3>
                                    <p>{selectedChannel.description || 'No messages yet. Be the first to start the conversation!'}</p>
                                </div>
                            ) : (
                                messages.map((message, index) => (
                                    <div key={message.id || index} className="message-item">
                                        <img 
                                            src={getAvatarPath(message.sender?.avatar)} 
                                            alt={message.sender?.username}
                                            className="message-avatar"
                                        />
                                        <div className="message-content">
                                            <div className="message-header-info">
                                                <span className="message-author">
                                                    {message.sender?.username || 'Unknown'}
                                                </span>
                                                <span className="message-timestamp">
                                                    {formatTimestamp(message.timestamp)}
                                                </span>
                                            </div>
                                            <div className="message-text">{message.content}</div>
                                            {message.file && message.file.preview && (
                                                <div className="message-attachment">
                                                    <img 
                                                        src={message.file.preview} 
                                                        alt={message.file.name}
                                                        style={{
                                                            maxWidth: '400px',
                                                            maxHeight: '300px',
                                                            borderRadius: '8px',
                                                            marginTop: '8px'
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {message.file && !message.file.preview && (
                                                <div className="message-file" style={{
                                                    marginTop: '8px',
                                                    padding: '12px',
                                                    background: 'var(--bg-elevated)',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}>
                                                    <FaPaperclip />
                                                    <span>{message.file.name}</span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        ({(message.file.size / 1024).toFixed(2)} KB)
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        
                        {/* Chat Input */}
                        <div className="chat-input-container">
                            <div className="connection-status">
                                <span className="status-dot"></span>
                                <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
                            </div>
                            
                            {/* File Preview */}
                            {selectedFile && (
                                <div className="file-preview" style={{
                                    marginBottom: '12px',
                                    padding: '12px',
                                    background: 'var(--bg-elevated)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {filePreview && (
                                            <img 
                                                src={filePreview} 
                                                alt="preview"
                                                style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '4px',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{selectedFile.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {(selectedFile.size / 1024).toFixed(2)} KB
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={removeSelectedFile}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            padding: '8px',
                                            fontSize: '1.2rem'
                                        }}
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            )}
                            
                            <form className="chat-form" onSubmit={handleSendMessage}>
                                <div className="chat-input-wrapper">
                                    <textarea
                                        ref={messageInputRef}
                                        className="chat-input"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={
                                            canUserPostInChannel(selectedChannel)
                                                ? `Message #${selectedChannel.name}`
                                                : selectedChannel.accessLevel === 'admin-only'
                                                    ? `🔒 Only admins can post in #${selectedChannel.name}`
                                                    : `You don't have permission to send messages in #${selectedChannel.name}`
                                        }
                                        disabled={!canUserPostInChannel(selectedChannel)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                        rows="1"
                                        style={{ paddingRight: '120px' }}
                                    />
                                    
                                    <div className="chat-input-buttons">
                                        {/* File Upload Button */}
                                        <button
                                            type="button"
                                            className="chat-input-btn"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={!canUserPostInChannel(selectedChannel)}
                                        >
                                            <FaPaperclip />
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            style={{ display: 'none' }}
                                            onChange={handleFileSelect}
                                            accept="image/*,.pdf,.doc,.docx,.txt"
                                        />
                                        
                                        {/* Emoji Button */}
                                        <button
                                            type="button"
                                            className="chat-input-btn"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            disabled={!canUserPostInChannel(selectedChannel)}
                                        >
                                            <FaSmile />
                                        </button>
                                    </div>
                                </div>
                                
                                <button 
                                    type="submit" 
                                    className="send-btn"
                                    disabled={(!newMessage.trim() && !selectedFile) || !canUserPostInChannel(selectedChannel)}
                                >
                                    <FaPaperPlane style={{ marginRight: '8px' }} />
                                    Send
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="no-channel-selected">
                        <h2>Welcome to The Glitch Community</h2>
                        <p>Select a channel to start chatting</p>
                    </div>
                )}
            </div>
            
            {/* RIGHT SIDEBAR - ONLINE USERS */}
            <div className="online-sidebar">
                <div className="online-section">
                    <div className="online-header">
                        <h3>Online Users</h3>
                        <span className="online-count">
                            {onlineUsers.filter(u => u.status === 'online').length} / {onlineUsers.length}
                        </span>
                    </div>
                    
                    <div className="user-stats">
                        <div className="stat-item">
                            <span className="stat-label">Online:</span>
                            <span className="stat-value">{onlineUsers.filter(u => u.status === 'online').length}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Total Users:</span>
                            <span className="stat-value">{onlineUsers.length}</span>
                        </div>
                    </div>
                </div>
                
                <div className="online-section">
                    <ul className="online-users">
                        {onlineUsers.map(user => (
                            <li key={user.id} className="user-item">
                                <img 
                                    src={getAvatarPath(user.avatar)} 
                                    alt={user.username}
                                    className="user-avatar"
                                />
                                <div className="user-info">
                                    <div className="user-name">{user.username}</div>
                                    <div className={`user-role ${user.role}`}>{user.role}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
                <EmojiPicker
                    onEmojiSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                />
            )}
        </div>
    );
};

export default Community;
