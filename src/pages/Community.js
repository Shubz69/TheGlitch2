import React, { useEffect, useState, useRef, useCallback } from 'react';
import '../styles/Community.css';
import '../styles/SharedBackground.css';
// Removed GlitchBranding.css for cleaner design
import { useWebSocket } from '../utils/useWebSocket';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Api from '../services/Api';
import SharedBackground from '../components/SharedBackground';

// Icons - only keep the ones actually used in the code
import { FaHashtag, FaLock, FaBullhorn, FaUserAlt, FaCrown, FaShieldAlt, FaBan, FaVolumeMute, FaTrash } from 'react-icons/fa';
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
    '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '💩', '👻', '💀', '☠️',
    '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀',
    '😿', '😾', '🙈', '🙉', '🙊', '👶', '👧', '🧒', '👦', '👩',
    '🧑', '👨', '👵', '🧓', '👴', '👮', '🕵️', '👷', '👸', '🤴',
    '👳', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶',
    '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '🧌', '👹', '👺',
    '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽',
    '🙀', '😿', '😾', '🙈', '🙉', '🙊', '👶', '👧', '🧒', '👦',
    '👩', '🧑', '👨', '👵', '🧓', '👴', '👮', '🕵️', '👷', '👸'
];

// Helper function to get correct avatar path
const getAvatarPath = (avatarName) => {
    if (!avatarName) return '/styles/assets/avatar-default.png';
    
    // Check if the avatarName already has the full path
    if (avatarName.startsWith('/')) return avatarName;
    
    // Handle numbered avatars (avatar1, avatar2, etc)
    if (avatarName.startsWith('avatar')) {
        return `/styles/assets/${avatarName}.png`;
    }
    
    // Default case
    return `/styles/assets/${avatarName}`;
};

// Modified mock data with proper avatar paths
const MOCK_DATA = {
    channels: [
        { id: 25, name: "welcome", description: "Welcome to the trading platform", accessLevel: "readonly" },
        { id: 26, name: "announcements", description: "Important platform announcements", accessLevel: "readonly" },
        { id: 27, name: "rules", description: "Community rules and guidelines", accessLevel: "readonly" },
        { id: 28, name: "general-chat", description: "General discussion for all members", accessLevel: "open" },
        { id: 29, name: "rookie-hub", description: "For new traders (level 1+)", accessLevel: "level", minLevel: 1 },
        { id: 30, name: "member-lounge", description: "For regular members (level 10+)", accessLevel: "level", minLevel: 10 },
        { id: 31, name: "pro-discussion", description: "For experienced traders (level 25+)", accessLevel: "level", minLevel: 25 },
        { id: 32, name: "elite-insights", description: "For advanced traders (level 50+)", accessLevel: "level", minLevel: 50 },
        { id: 33, name: "legend-chat", description: "For legendary traders (level 99+)", accessLevel: "level", minLevel: 99 },
        { id: 34, name: "strategy-sharing", description: "Share and discuss trading strategies", accessLevel: "open" },
        { id: 35, name: "trade-ideas", description: "Share your trading ideas", accessLevel: "open" },
        { id: 36, name: "ai-insights", description: "Discuss AI and algorithmic trading", accessLevel: "open" },
        { id: 37, name: "feedback-bugs", description: "Report bugs and provide feedback", accessLevel: "open" },
        { id: 38, name: "course-help", description: "Get help with courses", accessLevel: "open" },
        { id: 39, name: "staff-lounge", description: "Admin only channel", accessLevel: "admin-only" },
        { id: 40, name: "intro-to-trading", description: "Introduction to Trading course channel", accessLevel: "course", courseId: 1 },
        { id: 41, name: "technical-analysis", description: "Technical Analysis course channel", accessLevel: "course", courseId: 2 },
        { id: 42, name: "fundamental-analysis", description: "Fundamental Analysis course channel", accessLevel: "course", courseId: 3 },
        { id: 43, name: "crypto-trading", description: "Cryptocurrency Trading course channel", accessLevel: "course", courseId: 4 },
        { id: 44, name: "day-trading", description: "Day Trading course channel", accessLevel: "course", courseId: 5 },
        { id: 45, name: "swing-trading", description: "Swing Trading course channel", accessLevel: "course", courseId: 6 },
        { id: 46, name: "trading-psychology", description: "Trading Psychology course channel", accessLevel: "course", courseId: 7 },
        { id: 47, name: "risk-management", description: "Risk Management course channel", accessLevel: "course", courseId: 8 },
        { id: 48, name: "trading-plan", description: "Trading Plan course channel", accessLevel: "course", courseId: 9 }
    ],
    messages: {
        25: [
            { id: 1, content: "Welcome to our trading community!", senderId: "admin", senderUsername: "Admin", timestamp: Date.now() - 86400000, senderLevel: 10 }
        ],
        26: [
            { id: 1, content: "📢 New course on Trading Psychology now available!", senderId: "admin", senderUsername: "Admin", timestamp: Date.now() - 86400000, senderLevel: 10 }
        ],
        27: [
            { id: 1, content: "Please read our community guidelines", senderId: "admin", senderUsername: "Admin", timestamp: Date.now() - 86400000, senderLevel: 10 }
        ],
        28: [
            { id: 1, content: "What's everyone trading today?", senderId: "user1", senderUsername: "ShubzFx", timestamp: Date.now() - 3600000, senderLevel: 1 },
            { id: 2, content: "Looking at some crypto setups", senderId: "user2", senderUsername: "InvestorGuru", timestamp: Date.now() - 1800000, senderLevel: 4 }
        ],
        29: [
            { id: 1, content: "Any tips for new traders?", senderId: "user5", senderUsername: "test - user", timestamp: Date.now() - 43200000, senderLevel: 1 },
            { id: 2, content: "Start small and focus on risk management", senderId: "admin", senderUsername: "Admin", timestamp: Date.now() - 21600000, senderLevel: 10 }
        ],
        34: [
            { id: 1, content: "Anyone using MACD with RSI?", senderId: "user1", senderUsername: "ShubzFx", timestamp: Date.now() - 7200000, senderLevel: 1 },
            { id: 2, content: "Yes, it's a good combo for confirmation", senderId: "user2", senderUsername: "InvestorGuru", timestamp: Date.now() - 3600000, senderLevel: 4 }
        ],
        40: [
            { id: 1, content: "Welcome to the Intro to Trading course channel!", senderId: "admin", senderUsername: "Admin", timestamp: Date.now() - 86400000, senderLevel: 10 },
            { id: 2, content: "TESTKSJDNFLK F", senderId: "user1", senderUsername: "ShubzFx", timestamp: Date.now() - 86400000, senderLevel: 1 },
            { id: 3, content: "SDFRG", senderId: "user1", senderUsername: "ShubzFx", timestamp: Date.now() - 86400000, senderLevel: 1 }
        ],
        41: [
            { id: 1, content: "Welcome to Technical Analysis course channel!", senderId: "admin", senderUsername: "Admin", timestamp: Date.now() - 86400000, senderLevel: 10 },
            { id: 2, content: "TYJKD", senderId: "user1", senderUsername: "ShubzFx", timestamp: Date.now() - 86400000, senderLevel: 1 }
        ],
        42: [
            { id: 1, content: "Welcome to Fundamental Analysis course channel!", senderId: "admin", senderUsername: "Admin", timestamp: Date.now() - 86400000, senderLevel: 10 },
            { id: 2, content: "DF", senderId: "user1", senderUsername: "ShubzFx", timestamp: Date.now() - 86400000, senderLevel: 1 }
        ],
        44: [
            { id: 1, content: "Welcome to Day Trading course channel!", senderId: "admin", senderUsername: "Admin", timestamp: Date.now() - 86400000, senderLevel: 10 },
            { id: 2, content: "DF", senderId: "user1", senderUsername: "ShubzFx", timestamp: Date.now() - 86400000, senderLevel: 1 }
        ]
    },
    onlineUsers: [
        { id: "user1", username: "ShubzFx", avatar: "avatar2", role: "PREMIUM", level: 1 },
        { id: "admin", username: "Admin", avatar: "avatar1", role: "ADMIN", level: 10 },
        { id: "user5", username: "test - user", avatar: "avatar3", role: "FREE", level: 1 }
    ],
    // User/course relationship from the database
    userCourses: {
        "user1": [1, 2, 3, 5], // ShubzFx has purchased these courses
        "admin": [1, 2, 3, 4, 5, 6, 7, 8, 9], // Admin has access to all courses
        "user5": [] // test-user has no courses
    }
};

// Create a mock useWebSocket hook to prevent WebSocket connection errors in mock mode
const useMockWebSocket = (channelId, onMessageCallback) => {
    const [isConnected] = useState(true);
    const [connectionError] = useState(null);
    
    const sendMessage = useCallback((message) => {
        
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
        }, 300);
        
        return true; // Always succeed in mock mode
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

// Text formatting toolbar component


// Admin Panel component
const AdminPanel = ({ visible, onClose, onAction, selectedUser, action, onActionChange, banReason, onBanReasonChange, muteDuration, onMuteDurationChange }) => {
    if (!visible) return null;

    return (
        <div className="admin-panel-overlay" onClick={onClose}>
            <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
                <div className="admin-panel-header">
                    <h3>Admin Panel</h3>
                    <button className="admin-panel-close" onClick={onClose}>×</button>
                </div>
                <div className="admin-panel-content">
                    <div className="admin-section">
                        <h4>User Management</h4>
                        <div className="admin-actions">
                            <button
                                className={`admin-action-btn ${action === 'ban' ? 'active' : ''}`}
                                onClick={() => onActionChange('ban')}
                            >
                                <FaBan /> Ban User
                            </button>
                            <button
                                className={`admin-action-btn ${action === 'mute' ? 'active' : ''}`}
                                onClick={() => onActionChange('mute')}
                            >
                                <FaVolumeMute /> Mute User
                            </button>
                            <button
                                className={`admin-action-btn ${action === 'kick' ? 'active' : ''}`}
                                onClick={() => onActionChange('kick')}
                            >
                                <FaTrash /> Kick User
                            </button>
                            <button
                                className={`admin-action-btn ${action === 'role' ? 'active' : ''}`}
                                onClick={() => onActionChange('role')}
                            >
                                <FaCrown /> Change Role
                            </button>
                        </div>
                    </div>

                    {action === 'ban' && (
                        <div className="admin-action-form">
                            <label>Ban Reason:</label>
                            <textarea
                                value={banReason}
                                onChange={(e) => onBanReasonChange(e.target.value)}
                                placeholder="Enter reason for ban..."
                                rows="3"
                            />
                        </div>
                    )}

                    {action === 'mute' && (
                        <div className="admin-action-form">
                            <label>Mute Duration (seconds):</label>
                            <input
                                type="number"
                                value={muteDuration}
                                onChange={(e) => onMuteDurationChange(parseInt(e.target.value))}
                                min="60"
                                max="86400"
                            />
                            <span className="duration-hint">
                                {muteDuration >= 3600 ? `${Math.floor(muteDuration / 3600)} hours` : 
                                 muteDuration >= 60 ? `${Math.floor(muteDuration / 60)} minutes` : 
                                 `${muteDuration} seconds`}
                            </span>
                        </div>
                    )}

                    <div className="admin-panel-footer">
                        <button className="admin-confirm-btn" onClick={() => onAction(action)}>
                            Confirm {action.charAt(0).toUpperCase() + action.slice(1)}
                        </button>
                        <button className="admin-cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

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
    const { channelId } = useParams();

    const [channelList, setChannelList] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [replyTo, setReplyTo] = useState(null);
    const messagesEndRef = useRef(null);
    
    // Discord-like features
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    
    // Admin features
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [selectedUserForAction, setSelectedUserForAction] = useState(null);
    const [adminAction, setAdminAction] = useState('');
    const [banReason, setBanReason] = useState('');
    const [muteDuration, setMuteDuration] = useState(3600); // 1 hour default
    
    // Profile Modal
    const [profileModal, setProfileModal] = useState({ visible: false, user: null });
    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelCategory, setNewChannelCategory] = useState('general');

    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        message: null,
        canEdit: false,
        canDelete: false,
        canCopy: true,
    });

    // Enhanced channel data with categories - moved to top to avoid use-before-define
    const enhancedChannelList = [
        // Welcome & Announcements - Free for all users
        {
            id: 1,
            name: "Welcome",
            category: "announcements",
            accessLevel: "free",
            memberCount: 0,
            lastActivity: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
            unread: false,
            locked: false
        },
        {
            id: 2,
            name: "Announcements",
            category: "announcements",
            accessLevel: "free",
            memberCount: 0,
            lastActivity: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
            unread: true,
            locked: false
        },
        // Staff Channels - Admin only
        {
            id: 3,
            name: "Staff Chat",
            category: "staff",
            accessLevel: "admin",
            memberCount: 12,
            lastActivity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
            unread: false,
            locked: true
        },
        {
            id: 4,
            name: "Moderator Lounge",
            category: "staff",
            accessLevel: "admin",
            memberCount: 8,
            lastActivity: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            unread: false,
            locked: true
        },
        // Course Channels - Based on purchased courses
        {
            id: 5,
            name: "Beginner Course",
            category: "courses",
            accessLevel: "course",
            courseId: 1,
            memberCount: 89,
            lastActivity: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
            unread: true,
            locked: true
        },
        {
            id: 6,
            name: "Intermediate Trading",
            category: "courses",
            accessLevel: "course",
            courseId: 2,
            memberCount: 156,
            lastActivity: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
            unread: false,
            locked: true
        },
        {
            id: 7,
            name: "Advanced Strategies",
            category: "courses",
            accessLevel: "course",
            courseId: 3,
            memberCount: 73,
            lastActivity: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
            unread: false,
            locked: true
        },
        {
            id: 8,
            name: "Risk Management",
            category: "courses",
            accessLevel: "course",
            courseId: 4,
            memberCount: 94,
            lastActivity: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
            unread: true,
            locked: true
        },
        {
            id: 9,
            name: "Technical Analysis",
            category: "courses",
            accessLevel: "course",
            courseId: 5,
            memberCount: 127,
            lastActivity: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
            unread: false,
            locked: true
        },
        {
            id: 10,
            name: "Fundamental Analysis",
            category: "courses",
            accessLevel: "course",
            courseId: 6,
            memberCount: 68,
            lastActivity: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
            unread: false,
            locked: true
        },
        {
            id: 11,
            name: "Crypto Trading",
            category: "courses",
            accessLevel: "course",
            courseId: 7,
            memberCount: 203,
            lastActivity: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
            unread: true,
            locked: true
        },
        {
            id: 12,
            name: "Day Trading",
            category: "courses",
            accessLevel: "course",
            courseId: 8,
            memberCount: 145,
            lastActivity: new Date(Date.now() - 18 * 60 * 1000), // 18 minutes ago
            unread: false,
            locked: true
        },
        {
            id: 13,
            name: "Swing Trading",
            category: "courses",
            accessLevel: "course",
            courseId: 9,
            memberCount: 92,
            lastActivity: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago
            unread: false,
            locked: true
        },
        // Trading Channels - Free for all users
        {
            id: 14,
            name: "General Trading",
            category: "trading",
            accessLevel: "free",
            memberCount: 342,
            lastActivity: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
            unread: true,
            locked: false
        },
        {
            id: 15,
            name: "Strategy Discussion",
            category: "trading",
            accessLevel: "free",
            memberCount: 189,
            lastActivity: new Date(Date.now() - 7 * 60 * 1000), // 7 minutes ago
            unread: false,
            locked: false
        },
        {
            id: 16,
            name: "Market Analysis",
            category: "trading",
            accessLevel: "free",
            memberCount: 267,
            lastActivity: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
            unread: false,
            locked: false
        },
        {
            id: 17,
            name: "Trade Ideas",
            category: "trading",
            accessLevel: "free",
            memberCount: 156,
            lastActivity: new Date(Date.now() - 4 * 60 * 1000), // 4 minutes ago
            unread: true,
            locked: false
        },
        // General Channels - Free for all users
        {
            id: 18,
            name: "Off-Topic",
            category: "general",
            accessLevel: "free",
            memberCount: 89,
            lastActivity: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
            unread: false,
            locked: false
        },
        {
            id: 19,
            name: "Gaming",
            category: "general",
            accessLevel: "free",
            memberCount: 134,
            lastActivity: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
            unread: false,
            locked: false
        },
        {
            id: 20,
            name: "Music",
            category: "general",
            accessLevel: "free",
            memberCount: 67,
            lastActivity: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
            unread: false,
            locked: false
        },
        // Support Channels - Free for all users
        {
            id: 21,
            name: "Help & Support",
            category: "support",
            accessLevel: "free",
            memberCount: 45,
            lastActivity: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            unread: false,
            locked: false
        },
        {
            id: 22,
            name: "Bug Reports",
            category: "support",
            accessLevel: "free",
            memberCount: 23,
            lastActivity: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
            unread: false,
            locked: false
        },
        {
            id: 23,
            name: "Feature Requests",
            category: "support",
            accessLevel: "free",
            memberCount: 34,
            lastActivity: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
            unread: false,
            locked: false
        },
        // Premium Channels - Premium users only
        {
            id: 24,
            name: "Premium Lounge",
            category: "premium",
            accessLevel: "premium",
            memberCount: 56,
            lastActivity: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
            unread: true,
            locked: true
        },
        {
            id: 25,
            name: "VIP Trading",
            category: "premium",
            accessLevel: "premium",
            memberCount: 78,
            lastActivity: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
            unread: false,
            locked: true
        }
    ];

    // Enhanced button functionality
    const handleFileUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf,.doc,.docx,.txt,.mp4,.mp3';
        input.multiple = true;
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                // Here you would handle file upload to your backend
                const fileNames = files.map(f => f.name).join(', ');
                alert(`Files selected: ${fileNames}\n\nFile upload functionality would be implemented here.`);
            }
        };
        input.click();
    };

    const handleGifPicker = () => {
        // Simulate GIF picker functionality
        const gifCategories = ['Funny', 'Reaction', 'Gaming', 'Anime', 'Sports'];
        const randomGif = gifCategories[Math.floor(Math.random() * gifCategories.length)];
        alert(`GIF picker would open here for ${randomGif} GIFs.\n\nThis would integrate with a GIF service like GIPHY.`);
    };

    const handleGameActivity = () => {
        // Simulate game activity functionality
        const games = ['Minecraft', 'Fortnite', 'Valorant', 'League of Legends', 'Among Us'];
        const randomGame = games[Math.floor(Math.random() * games.length)];
        alert(`Game activity panel would open here.\n\nCurrent game: ${randomGame}\n\nThis would show current games and allow joining.`);
    };

    const handleEmojiSelect = (emoji) => {
        const input = document.querySelector('.chat-input');
        if (input) {
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const text = input.value;
            const newText = text.substring(0, start) + emoji + text.substring(end);
            setNewMessage(newText);
            
            // Set cursor position after emoji
            setTimeout(() => {
                input.focus();
                input.setSelectionRange(start + emoji.length, start + emoji.length);
            }, 0);
        }
        setShowEmojiPicker(false);
    };





    // Admin action functions
    const handleAdminAction = (action) => {
        if (!selectedUserForAction) return;
        
        switch (action) {
            case 'ban':
                if (banReason.trim()) {
                    console.log(`Banning user ${selectedUserForAction.username} for: ${banReason}`);
                    // Here you would call the backend API to ban the user
                    alert(`User ${selectedUserForAction.username} has been banned. Reason: ${banReason}`);
                } else {
                    alert('Please provide a reason for the ban.');
                    return;
                }
                break;
            case 'mute':
                console.log(`Muting user ${selectedUserForAction.username} for ${muteDuration} seconds`);
                // Here you would call the backend API to mute the user
                alert(`User ${selectedUserForAction.username} has been muted for ${Math.floor(muteDuration / 3600)} hours`);
                break;
            case 'kick':
                if (window.confirm(`Are you sure you want to kick ${selectedUserForAction.username}?`)) {
                    console.log(`Kicking user ${selectedUserForAction.username}`);
                    // Here you would call the backend API to kick the user
                    alert(`User ${selectedUserForAction.username} has been kicked.`);
                } else {
                    return;
                }
                break;
            case 'role':
                const newRole = prompt(`Enter new role for ${selectedUserForAction.username}:`, selectedUserForAction.role);
                if (newRole && newRole !== selectedUserForAction.role) {
                    console.log(`Changing role of ${selectedUserForAction.username} to ${newRole}`);
                    // Here you would call the backend API to change the user's role
                    alert(`Role of ${selectedUserForAction.username} changed to ${newRole}`);
                }
                break;
            default:
                console.log(`Unknown admin action: ${action}`);
                break;
        }
        
        // Reset admin panel
        setShowAdminPanel(false);
        setSelectedUserForAction(null);
        setAdminAction('');
        setBanReason('');
        setMuteDuration(3600);
    };

    const openAdminPanel = (user) => {
        setSelectedUserForAction(user);
        setShowAdminPanel(true);
        setAdminAction('');
    };

    // Initialize user data from AuthContext
    useEffect(() => {
        if (authUser) {
            setStoredUser(authUser);
            setUserId(authUser.id);
            setIsAdmin(authUser.role === 'ADMIN');
            
            // Get user level from API
            const fetchUserLevel = async () => {
                try {
                    // Use Api service for consistent approach
                    const response = await Api.getUserLevel(authUser.id);
                    setUserLevel(response.data.level);
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error('Error fetching user level:', error);
                    setUserLevel(1); // Default level if not found
                }
            };
            fetchUserLevel();
        }
    }, [authUser]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // WebSocket for receiving messages
    const onMessageReceived = useCallback((msg) => {
        console.log("🔔 Message received from WebSocket:", msg);
        
        // Check if message belongs to the selected channel
        const isForCurrentChannel = 
            (msg.channelId === selectedChannel?.id) || 
            (msg.channelId === undefined && selectedChannel) ||
            // Allow for string ID comparison if one is a string and one is a number
            (selectedChannel && msg.channelId && selectedChannel.id.toString() === msg.channelId.toString());
        
        if (!isForCurrentChannel) {
            console.log("Message is for a different channel, ignoring");
            return;
        }
        
        // Ensure we have a valid message object with required fields
        const normalizedMsg = {
            id: msg.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            content: msg.content || 'Empty message',
            senderUsername: msg.senderUsername || msg.sender || 'Unknown',
            timestamp: msg.timestamp || Date.now(),
            senderLevel: msg.senderLevel || 1,
            senderId: msg.senderId || 'unknown',
            avatar: msg.avatar || null
        };
        
        setMessages(prev => {
            // Don't add duplicate messages - check by content, sender and approximate timestamp 
            // to handle cases where the same message might have different IDs
            const isDuplicate = prev.some(m => 
                (m.id === normalizedMsg.id) || 
                (m.content === normalizedMsg.content && 
                 m.senderUsername === normalizedMsg.senderUsername && 
                 Math.abs(m.timestamp - normalizedMsg.timestamp) < 5000)
            );
            
            if (isDuplicate) {
                console.log("Duplicate message detected, not adding to state", normalizedMsg);
                return prev;
            }
            
            console.log("Adding new message to state", normalizedMsg);
            return [...prev, normalizedMsg];
        });
    }, [selectedChannel]);

    // Check for valid auth token
    const hasValidToken = () => {
        const token = localStorage.getItem('token');
        if (!token) return false;
        
        try {
            // Basic validation - check if token has expected format
            const parts = token.split('.');
            if (parts.length !== 3) return false;
            
            // Try to decode token
            const payload = JSON.parse(atob(parts[1]));
            const currentTime = Date.now() / 1000;
            
            // Check if token is expired
            if (payload.exp && payload.exp < currentTime) {
                return false;
            }
            
            return true;
        } catch (err) {
            console.error('Token validation error:', err);
            return false;
        }
    };

    // For now, use mock mode regardless of token validity
    const effectiveMockMode = MOCK_MODE;
    
    // ===== Get WebSocket connection =====
    // Call both hooks unconditionally to comply with React hooks rules
    const mockWebSocketResult = useMockWebSocket(selectedChannel?.id, onMessageReceived);
    // Always call useWebSocket unconditionally, but pass a shouldConnect parameter
    const realWebSocketResult = useWebSocket(selectedChannel?.id, onMessageReceived, !effectiveMockMode);
    
    // Then choose which one's values to use based on effective mock mode
    const { 
        sendMessage: sendSocketMessage,
        isConnected, 
        connectionError 
    } = effectiveMockMode ? mockWebSocketResult : realWebSocketResult;

    // Use mock data if in MOCK_MODE or if we have a connection error
    const shouldUseMockData = effectiveMockMode || !!connectionError;

    // Show websocket connection status
    useEffect(() => {
        if (connectionError) {
            console.error("WebSocket connection error:", connectionError);
        }
    }, [connectionError]);

    // Fetch messages for selected channel
    const fetchMessages = useCallback(async (channelId) => {
        if (!channelId) {
            console.log("Community: No channel ID provided for fetching messages");
            return;
        }
        
        // Check if user can view messages in this channel
        const channel = channelList.find(c => c.id === channelId);
        if (!channel) {
            console.log("Channel not found in accessible channels");
            return;
        }
        
        const userRole = getCurrentUserRole();
        const userCourses = getUserCourses();
        
        if (!canViewChannelMessages(channel, userRole, userCourses)) {
            console.log("User cannot view messages in this channel");
            setMessages([]);
            return;
        }
        
        try {
            console.log(`Community: Fetching messages for channel ${channelId}`);
            setLoading(true);
            
            if (shouldUseMockData) {
                // DEVELOPMENT MOCK: Skip actual API call and use mock data
                console.log(`DEVELOPMENT MODE: Using mock message data for channel ${channelId}`);
                const mockMessages = MOCK_DATA.messages[channelId] || [];
                setTimeout(() => {
                    console.log(`Loaded ${mockMessages.length} mock messages`);
                    setMessages(mockMessages);
                    setLoading(false);
                }, 300); // Simulate network delay
            } else {
                // Real API call for production
                console.log(`Fetching real message data for channel ${channelId}`);
                
                // Verify token is valid first
                const token = localStorage.getItem('token');
                if (!token || !hasValidToken()) {
                    console.error('Authentication token invalid or expired');
                    alert('Your session has expired. Please log in again.');
                    navigate('/login');
                    setLoading(false);
                    return;
                }
                
                try {
                    // Use the Api service with proper error handling
                    const response = await Api.getChannelMessages(channelId);
                    const messages = response.data || [];
                    console.log(`Loaded ${messages.length} real messages`);
                    setMessages(messages);
                } catch (error) {
                    console.error("Error fetching messages:", error);
                    
                    // Check for auth error
                    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                        alert("Authentication error. Please log in again.");
                        navigate('/login');
                        return;
                    }
                    
                    // Fallback to mock data if API fails
                    console.log("Falling back to mock message data");
                    const mockMessages = MOCK_DATA.messages[channelId] || [];
                    setMessages(mockMessages);
                } finally {
                    setLoading(false);
                }
            }
            
        } catch (error) {
            console.error("Community: Error fetching messages:", error);
            setMessages([]);
            setLoading(false);
        }
    }, [shouldUseMockData, navigate, channelList]);

    useEffect(() => {
        if (selectedChannel) {
            fetchMessages(selectedChannel.id);
        }
    }, [selectedChannel, fetchMessages]);

    // Check auth status and session validity on mount and when dependencies change
    useEffect(() => {
        console.log("=== useEffect for channels and courses START ===");
        console.log("shouldUseMockData:", shouldUseMockData);
        console.log("MOCK_MODE:", MOCK_MODE);
        
        // Verify user authentication status and load channels
        const storedToken = localStorage.getItem('token');
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        const tokenIsValid = storedToken && storedToken.split('.').length === 3;
        setIsAuthenticated(tokenIsValid);
        
        console.log("Community component initializing");
        console.log("Is authenticated:", tokenIsValid);
        console.log("Token length:", storedToken?.length || 0);
        console.log("User object:", storedUser);
        console.log("===========================");

        // Skip if we already have a selected channel and we're not initializing
        if (selectedChannel !== null && channelList.length > 0) {
            console.log("Skipping - already have selected channel and channel list");
            return;
        }

        const fetchChannelsAndCourses = async () => {
            try {
                setLoading(true);
                
                if (shouldUseMockData) {
                    console.log("DEVELOPMENT MODE: Using mock channel data");
                    console.log("MOCK_MODE:", MOCK_MODE);
                    console.log("effectiveMockMode:", effectiveMockMode);
                    console.log("shouldUseMockData:", shouldUseMockData);
                    
                    // Get current user
                    const currentUserId = userId || "user5"; // Default to test-user if not logged in
                    const isCurrentUserAdmin = isAdmin || (storedUser?.role === "ADMIN");
                    const currentUserLevel = userLevel || 1;
                    
                    console.log("Current user ID:", currentUserId);
                    console.log("Is admin:", isCurrentUserAdmin);
                    console.log("User level:", currentUserLevel);
                    
                    // Use enhanced channel list directly for better UI experience
                    const channelsToShow = enhancedChannelList;
                    setChannelList(channelsToShow);
                    console.log("Channel list state set to:", channelsToShow);
                    
                    // Add some mock online users
                    const filteredOnlineUsers = isCurrentUserAdmin 
                        ? MOCK_DATA.onlineUsers // Admins can see all users
                        : MOCK_DATA.onlineUsers.filter(u => u.id !== "admin" || isCurrentUserAdmin); // Hide admin from non-admins
                        
                    setOnlineUsers(filteredOnlineUsers);
                    
                    // Only set initial channel if we haven't already set one
                    if (!selectedChannel && channelsToShow.length > 0) {
                        // Get channel parameter from URL if any
                        const params = new URLSearchParams(location.search);
                        const channelParam = params.get('channel') || channelId;
                        
                        // If URL has a channel parameter, find and select that channel
                        if (channelParam) {
                            const targetChannel = channelsToShow.find(
                                channel => channel.id.toString() === channelParam.toString() ||
                                        channel.name.toLowerCase() === channelParam.toLowerCase()
                            );
                            
                            if (targetChannel) {
                                setSelectedChannel(targetChannel);
                            } else {
                                setSelectedChannel(channelsToShow[0]);
                            }
                        } else {
                            setSelectedChannel(channelsToShow[0]);
                        }
                    }
                    
                    setLoading(false);
                    console.log("Mock data loading complete, loading set to false");
                } else {
                    // Real API call for production
                    try {
                        // Get fresh token
                        const token = localStorage.getItem('token');
                        
                        if (!token || !hasValidToken()) {
                            console.error('Authentication token invalid or expired');
                            alert('Please log in to view community channels');
                            navigate('/login');
                            return;
                        }
                        
                        // Get channels from API
                        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
                        const response = await axios.get(`${baseUrl}/api/community/channels`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Accept': 'application/json'
                            }
                        });
                        
                        let channels = response.data || [];
                        console.log('Loaded channels from API:', channels);
                        
                        // Get userId from auth context or localStorage
                        const userId = authUser?.id || JSON.parse(localStorage.getItem('user') || '{}').id;
                        console.log('Community.js: token:', token, 'userId:', userId);
                        console.log('Community.js: Fetching user courses from', `${baseUrl}/api/users/my-courses?userId=${userId}`);
                        const coursesResponse = await axios.get(`${baseUrl}/api/users/my-courses?userId=${userId}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Accept': 'application/json'
                            }
                        });
                        const userCourses = (coursesResponse.data && coursesResponse.data.courses) || [];
                        console.log('Community.js: userCourses API response:', coursesResponse);
                        console.log('User courses:', userCourses);
                        
                        // Add courseId to identify the source course
                        const coursesWithIds = userCourses.map(course => ({
                            course: course,
                            id: course.id
                        }));
                        
                        // Get channels for each course
                        let courseChannels = [];
                        for (const courseWithId of coursesWithIds) {
                            // In a real app, you'd fetch the course's channels
                            const courseChannel = {
                                id: 1000 + courseWithId.id,
                                name: courseWithId.course.title,
                                description: courseWithId.course.description,
                                accessLevel: courseWithId.course.price === 0 ? "free" : "premium",
                                courseId: courseWithId.id
                            };
                            courseChannels.push(courseChannel);
                        }
                        
                        // Combine all channels
                        channels = [...channels, ...courseChannels];
                        
                        // If user courses or channels fail, show a clear alert and stop loading
                        if (!userCourses || !Array.isArray(userCourses)) {
                            alert('Failed to load your courses. Please try again later.');
                            setLoading(false);
                            return;
                        }
                        if (!channels || !Array.isArray(channels)) {
                            alert('Failed to load channels. Please try again later.');
                            setLoading(false);
                            return;
                        }
                        
                        // If not authenticated or no channels found, ensure we at least show free channels
                        if (!token || channels.length === 0) {
                            // Show a message instead of using mock data
                            setChannelList([]);
                            alert("No channels available. Please try again later.");
                        }
                        
                        console.log('Final channels list:', channels);
                        setChannelList(channels);
                        
                        if (!selectedChannel && channels.length > 0) {
                            // Check if we have a channel in the URL
                            const urlChannelId = channelId;
                            if (urlChannelId) {
                                const urlChannel = channels.find(c => c.id.toString() === urlChannelId);
                                if (urlChannel) {
                                    setSelectedChannel(urlChannel);
                                } else {
                                    setSelectedChannel(channels[0]);
                                }
                            } else {
                                setSelectedChannel(channels[0]);
                            }
                        }
                        
                    } catch (error) {
                        console.error("Error fetching user courses:", error);
                        console.error("Failed to load your course channels");
                        alert("Could not load your course channels. Some channels may be missing.");
                        setLoading(false);
                    }
                    
                }
            } catch (error) {
                console.error("Community: Error:", error);
                setLoading(false);
            }
        };

        fetchChannelsAndCourses();
        console.log("=== useEffect for channels and courses END ===");
        
    }, [
        location.search, 
        selectedChannel, 
        userId, 
        isAdmin, 
        isAuthenticated, 
        userLevel, 
        storedUser, 
        navigate, 
        channelId, 
        shouldUseMockData,
        authUser?.id,
        channelList.length,
        effectiveMockMode,
        enhancedChannelList
    ]);  // Include all dependencies used in the effect



    // Close context menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            if (contextMenu.visible) {
                closeContextMenu();
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [contextMenu.visible]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChannel) return;

        // Check if user can send messages in this channel
        const userRole = getCurrentUserRole();
        const userCourses = getUserCourses();
        
        if (!canSendMessage(selectedChannel, userRole, userCourses)) {
            alert("You don't have permission to send messages in this channel.");
            return;
        }

        try {
            // Check authentication first
            const token = localStorage.getItem('token');
            if (!token && !shouldUseMockData) {
                console.error('Authentication token invalid or expired');
                alert('Your session has expired. Please log in again.');
                navigate('/login');
                return;
            }
            
            if (shouldUseMockData) {
                // DEVELOPMENT MOCK: Skip actual API call and simulate message sending
                console.log('DEVELOPMENT MODE: Sending mock message');
                
                // Create new message with mock data
                const newMsg = {
                    id: Date.now(), // Use timestamp as ID for mock
                    content: newMessage,
                    senderId: userId || 'current-user',
                    senderUsername: storedUser?.username || 'You',
                    timestamp: Date.now(),
                    senderLevel: userLevel || 1,
                    avatar: storedUser?.avatar || null
                };
                
                // Use WebSocket to send
                sendSocketMessage(newMsg);
                
                // Clear the message input
                setNewMessage("");
                
                // Mock success message
                console.log('Mock message sent successfully');
                return;
            }
            
            // For real API communication - always try WebSocket first
            if (isConnected) {
                // Send message through WebSocket which will save it to the database
                const messageSent = sendSocketMessage({
                    content: newMessage,
                    channelId: selectedChannel.id
                });
                
                if (messageSent) {
                    setNewMessage("");
                    return; // Message sent via WebSocket successfully
                }
            }
            
            // Fallback to REST API if WebSocket fails
            try {
                await Api.sendMessage(selectedChannel.id, {
                    content: newMessage
                });
                
                // Clear the message input
                setNewMessage("");
                
                // Refresh messages to show the new message
                fetchMessages(selectedChannel.id);
            } catch (error) {
                console.error("Failed to send message via API:", error);
                alert("Failed to send message. Please try again.");
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            alert("Failed to send message. Please try again.");
        }
    };

    const handleRightClick = (e, message) => {
        e.preventDefault();
        const isAuthor = message.senderId === userId;

        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            message,
            canEdit: isAdmin || isAuthor,
            canDelete: isAdmin || isAuthor,
            canCopy: true,
        });
    };

    const handleCopy = (message) => {
        navigator.clipboard.writeText(message.content);
        setContextMenu(prev => ({ ...prev, visible: false }));
    };

    const handleReply = (message) => {
        setReplyTo(message);
        setContextMenu(prev => ({ ...prev, visible: false }));
    };

    const handleEdit = (message) => {
        const newContent = prompt("Edit message:", message.content);
        if (newContent && newContent !== message.content) {
            updateMessage(message.id, newContent);
        }
        setContextMenu(prev => ({ ...prev, visible: false }));
    };

    const handleDelete = async (message) => {
        if (!message || !selectedChannel) return;
        if (loading) return;
        
        if (window.confirm("Are you sure you want to delete this message?")) {
            setLoading(true);
            try {
                if (shouldUseMockData) {
                    // Mock deletion
                    console.log('MOCK: Deleting message', message.id);
                    setMessages(prevMessages => 
                        prevMessages.filter(msg => msg.id !== message.id)
                    );
                } else {
                    // Real API call using Api service
                    await Api.deleteMessage(selectedChannel.id, message.id);
                    
                    // Update UI after successful deletion
                    setMessages(prevMessages => 
                        prevMessages.filter(msg => msg.id !== message.id)
                    );
                }
            } catch (error) {
                console.error('Error deleting message:', error);
                alert('Failed to delete message');
            } finally {
                setLoading(false);
                setContextMenu({ ...contextMenu, visible: false });
            }
        }
    };

    const updateMessage = async (id, newContent) => {
        if (!id || !newContent.trim() || !selectedChannel) return;
        if (loading) return;
        
        setLoading(true);
        try {
            if (shouldUseMockData) {
                // Mock update
                console.log('MOCK: Updating message', id, newContent);
                setMessages(prevMessages => 
                    prevMessages.map(msg => 
                        msg.id === id
                            ? { ...msg, content: newContent, isEdited: true }
                            : msg
                    )
                );
            } else {
                // Real API call using Api service
                await Api.updateMessage(selectedChannel.id, id, { content: newContent });
                
                // Update UI after successful update
                setMessages(prevMessages => 
                    prevMessages.map(msg => 
                        msg.id === id
                            ? { ...msg, content: newContent, isEdited: true }
                            : msg
                    )
                );
            }
        } catch (error) {
            console.error('Error updating message:', error);
            alert('Failed to update message');
        } finally {
            setLoading(false);
        }
    };

    const openUserProfile = async (userId, username) => {
        if (!userId) return;
        
        try {
            if (shouldUseMockData) {
                // Use mock user data
                const mockUser = MOCK_DATA.onlineUsers.find(u => u.id === userId) || {
                    id: userId,
                    username: username || "User" + userId.slice(-4),
                    avatar: "avatar-default",
                    role: "Trader",
                    level: 1,
                    stats: {
                        messages: Math.floor(Math.random() * 100),
                        trades: Math.floor(Math.random() * 50),
                        reputation: Math.floor(Math.random() * 100)
                    },
                    bio: "This is a mock user profile for development purposes.",
                    joinDate: new Date().toISOString().split('T')[0]
                };
                
                setProfileModal({
                    visible: true,
                    user: {
                        ...mockUser,
                        stats: mockUser.stats || {
                            messages: Math.floor(Math.random() * 100),
                            trades: Math.floor(Math.random() * 50),
                            reputation: Math.floor(Math.random() * 100)
                        },
                        bio: mockUser.bio || "This is a mock user profile for development purposes.",
                        joinDate: mockUser.joinDate || new Date().toISOString().split('T')[0]
                    }
                });
                return;
            }
            
            // Get a fresh token from localStorage
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.error('No authentication token found');
                alert('Authentication error: Please log in to view user profiles');
                return;
            }
            
            console.log('Fetching user profile with token');
            
            // Make sure to use either the environment variable or fallback to localhost
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
            
            const response = await axios.get(`${baseUrl}/api/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            setProfileModal({
                visible: true,
                user: response.data
            });
        } catch (err) {
            console.error('Error fetching user profile:', err);
            
            // Handle specific error cases
            if (err.response && err.response.status === 403) {
                alert("Authentication error. Please try logging in again.");
                // Consider redirecting to login
                // navigate('/login');
            }
        }
    };

    const navigateToUserProfile = (userId) => {
        navigate(`/profile/${userId}`);
        setProfileModal({ visible: false, user: null });
    };



    // Add custom styles directly in the component to override the default styles
    const customStyles = {
        messageItem: {
            padding: '8px 12px',   // Reduce padding to make boxes smaller
            marginBottom: '8px',   // Reduce margin between messages
            borderRadius: '8px',    // Keep the rounded corners
            display: 'flex',
            alignItems: 'flex-start'
        },
        messageText: {
            fontSize: '16px',      // Increase font size for better readability
            lineHeight: '1.4',     // Adjust line height for better spacing
            marginTop: '4px'       // Add a small margin at the top
        },
        messageContent: {
            flex: '1',
            paddingLeft: '10px'    // Slightly reduce the padding
        },
        messageHeader: {
            marginBottom: '4px'    // Reduce space between header and content
        }
    };

    // Function to render formatted text
    const renderFormattedText = (text) => {
        if (!text) return '';
        
        // Convert markdown-like formatting to HTML
        let formattedText = text
            // Bold: **text** -> <strong>text</strong>
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic: *text* -> <em>text</em>
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Underline: __text__ -> <u>text</u>
            .replace(/__(.*?)__/g, '<u>$1</u>')
            // Strikethrough: ~~text~~ -> <s>text</s>
            .replace(/~~(.*?)~~/g, '<s>$1</s>')
            // Code: `text` -> <code>text</code>
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Quote: > text -> <blockquote>text</blockquote>
            .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
            // Links: [text](url) -> <a href="url">text</a>
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            // Images: ![alt](url) -> <img src="url" alt="alt" />
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
            // Mentions: @username -> <span class="mention">@username</span>
            .replace(/@(\w+)/g, '<span class="mention">@$1</span>')
            // Line breaks - handle both \n and literal <br /> tags
            .replace(/\n/g, '<br />');
        
        return formattedText;
    };

    // Display userLevel in the chat message component
    const ChatMessage = ({ msg }) => {
        // Generate a consistent unique identifier for users without usernames
        const getUserIdentifier = (senderId) => {
            if (!senderId) return 'User';
            
            // If there's a username, use it
            if (msg.senderUsername) return msg.senderUsername;
            
            // For anonymous users, use a numeric suffix based on their ID
            // This creates a consistent "User X" for each unique senderId
            const userIdNumber = parseInt(senderId.replace(/\D/g, '')) % 10000;
            return `User ${userIdNumber || ''}`;
        };
        
        const displayName = getUserIdentifier(msg.senderId);
        
        return (
            <div className="message-item" key={msg.id || `${msg.timestamp}`} style={customStyles.messageItem}>
                {msg.avatar ? (
                    <img 
                        src={getAvatarPath(msg.avatar)} 
                        alt={displayName} 
                        className="message-avatar"
                        onClick={() => openUserProfile(msg.senderId, displayName)}
                    />
                ) : (
                    <div 
                        className="user-avatar-letter"
                        onClick={() => openUserProfile(msg.senderId, displayName)}
                    >
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                )}
                <div 
                    className="message-content" 
                    onContextMenu={(e) => handleRightClick(e, msg)}
                    style={customStyles.messageContent}
                >
                    <div className="message-header" style={customStyles.messageHeader}>
                        <span 
                            className="message-author"
                            onClick={() => openUserProfile(msg.senderId, displayName)}
                        >
                            {displayName}
                        </span>
                        <span className="message-time">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                    <div 
                        className="message-text" 
                        style={customStyles.messageText}
                        dangerouslySetInnerHTML={{ __html: renderFormattedText(msg.content) }}
                    />
                </div>
            </div>
        );
    };

    // Helper function to get channel icon based on type
    const getChannelIcon = (accessLevel) => {
        switch(accessLevel?.toLowerCase()) {
            case 'free':
            case 'open':
                return <FaHashtag className="channel-icon" />;
            case 'level':
                return <BsStars className="channel-icon" />;
            case 'course':
                return <FaLock className="channel-icon" />;
            case 'admin':
                return <RiAdminFill className="channel-icon" />;
            case 'announcement':
                return <FaBullhorn className="channel-icon" />;
            default:
                return <FaHashtag className="channel-icon" />;
        }
    };

    // Update online users when websocket connection changes
    useEffect(() => {
        if (isConnected) {
            // If we're connected, add the current user to online users if it has a username
            setOnlineUsers(prev => {
                if (storedUser && storedUser.username && !prev.some(u => u.id === storedUser.id)) {
                    return [storedUser]; // Only show the current user for now
                }
                return prev.length > 0 ? prev : []; // Return empty array if no valid users
            });
            
            // In a real implementation, you would get online users from the server
            // But for now, only show the current user to avoid fake accounts
        }
    }, [isConnected, storedUser]);

    useEffect(() => {
        if (channelId && channelList.length > 0) {
            try {
                // Convert channelId to number if possible
                const channelIdNum = parseInt(channelId);
                if (isNaN(channelIdNum)) {
                    // If channelId is not a valid number, default to first channel
                    navigate('/community/' + channelList[0].id);
                    return;
                }
                
                const channel = channelList.find(c => c.id === channelIdNum);
                if (channel) {
                    setSelectedChannel(channel);
                    fetchMessages(channel.id);
                } else {
                    navigate('/community/' + channelList[0].id);
                }
            } catch (error) {
                console.error("Error navigating to channel:", error);
                // Fall back to first channel
                navigate('/community/' + channelList[0].id);
            }
        } else if (channelList.length > 0 && !channelId) {
            navigate('/community/' + channelList[0].id);
        }
    }, [channelId, channelList, navigate, fetchMessages]);

    const closeUserProfile = () => {
        setProfileModal({ visible: false, user: null });
    };

    // eslint-disable-next-line no-unused-vars
    const handleMessageContext = (e, messageId) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            messageId
        });
    };

    const closeContextMenu = () => {
        setContextMenu({ visible: false, x: 0, y: 0, message: null, canEdit: false, canDelete: false, canCopy: true });
    };

    // eslint-disable-next-line no-unused-vars
    const handleContextClick = (action) => {
        // Implement context menu actions here (reply, edit, delete, etc.)
        console.log(`Action ${action} on message ${contextMenu.messageId}`);
        closeContextMenu();
    };

    const handleChannelClick = (channel) => {
        // Check if user can access this channel
        const userRole = getCurrentUserRole();
        const userCourses = getUserCourses();
        
        if (!canAccessChannel(channel, userRole, userCourses)) {
            alert("You don't have access to this channel.");
            return;
        }
        
        navigate(`/community/${channel.id}`);
    };

    const handleUserClick = async (userId) => {
        try {
            if (shouldUseMockData) {
                // Use mock user data
                const mockUser = MOCK_DATA.onlineUsers.find(u => u.id === userId) || {
                    id: userId,
                    username: "User" + userId.slice(-4),
                    avatar: null,
                    role: "Trader",
                    level: 1,
                    stats: {
                        messages: Math.floor(Math.random() * 100),
                        trades: Math.floor(Math.random() * 50),
                        reputation: Math.floor(Math.random() * 100)
                    },
                    bio: "This is a mock user profile for development purposes.",
                    joinDate: new Date().toISOString().split('T')[0]
                };
                
                setProfileModal({
                    visible: true,
                    user: {
                        ...mockUser,
                        stats: mockUser.stats || {
                            messages: Math.floor(Math.random() * 100),
                            trades: Math.floor(Math.random() * 50),
                            reputation: Math.floor(Math.random() * 100)
                        },
                        bio: mockUser.bio || "This is a mock user profile for development purposes.",
                        joinDate: mockUser.joinDate || new Date().toISOString().split('T')[0]
                    }
                });
                return;
            }
            
            // Get a fresh token from localStorage
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.error('No authentication token found');
                alert('Authentication error: Please log in to view user profiles');
                return;
            }
            
            console.log('Fetching user profile with token');
            
            // Make sure to use either the environment variable or fallback to localhost
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
            
            const response = await axios.get(`${baseUrl}/api/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            setProfileModal({
                visible: true,
                user: response.data
            });
        } catch (err) {
            console.error('Error fetching user profile:', err);
            
            // Handle specific error cases
            if (err.response && err.response.status === 403) {
                alert("Authentication error. Please try logging in again.");
                // Consider redirecting to login
                // navigate('/login');
            }
        }
    };

    // Add more custom styles for channel list
    const channelStyles = {
        channelList: {
            padding: '0',
            margin: '0',
            listStyle: 'none',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 240px)'
        },
        channelItem: {
            padding: '6px 12px',
            margin: '2px 0',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'background-color 0.2s ease'
        },
        channelItemActive: {
            backgroundColor: 'rgba(130, 71, 229, 0.2)',
            borderLeft: '3px solid #8247e5'
        },
        channelName: {
            marginLeft: '8px',
            flex: '1',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },
        courseChannel: {
            color: '#1E90FF',
            fontWeight: 'bold'
        },
        levelChannel: {
            color: '#0dc8ff'
        },
        adminChannel: {
            color: '#ff4d4d'
        },
        channelTag: {
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '10px',
            backgroundColor: 'rgba(130, 71, 229, 0.3)',
            color: 'white',
            marginLeft: '4px'
        }
    };

    // Create separate channel groups for better organization
    const getCategoryChannels = (channels, category) => {
        if (category === 'course') {
            return channels.filter(ch => ch.accessLevel === 'course');
        } else if (category === 'open') {
            return channels.filter(ch => ch.accessLevel === 'open' || ch.accessLevel === 'readonly');
        } else if (category === 'level') {
            return channels.filter(ch => ch.accessLevel === 'level');
        } else if (category === 'admin') {
            // Exclude the announcements channel from admin-only section
            return channels.filter(ch => ch.accessLevel === 'admin-only' && ch.name !== "📢 announcements");
        }
        return [];
    };

    // User Profile Modal component
    const UserProfileModal = ({ visible, user, onClose, onNavigateToProfile }) => {
        if (!visible || !user) return null;
        
        return (
            <div className="user-profile-modal" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">User Profile</h2>
                        <button className="modal-close" onClick={onClose}>&times;</button>
                    </div>
                    <div className="modal-body">
                        <div className="profile-summary">
                            {user.avatar ? (
                                <img 
                                    src={getAvatarPath(user.avatar)} 
                                    alt={user.username} 
                                    className="profile-avatar-large" 
                                />
                            ) : (
                                <div className="profile-avatar-large" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'linear-gradient(45deg, #6e00c3, #00ffae)',
                                    color: 'white',
                                    fontSize: '2rem'
                                }}>
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="profile-info">
                                <h3 className="profile-name">{user.username}</h3>
                                <div className="profile-role">{user.role}</div>
                                <div className="profile-join-date">Joined {new Date(user.joinDate).toLocaleDateString()}</div>
                            </div>
                        </div>
                        
                        <div className="profile-stats">
                            <div className="stat-item">
                                <div className="stat-value">{user.level}</div>
                                <div className="stat-label">Level</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{user.stats?.messages || 0}</div>
                                <div className="stat-label">Messages</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{user.stats?.trades || 0}</div>
                                <div className="stat-label">Trades</div>
                            </div>
                        </div>
                        
                        <div className="profile-bio">
                            <div className="bio-label">Bio</div>
                            <div className="bio-text">{user.bio || 'No bio available'}</div>
                        </div>
                        
                        <div className="profile-actions">

                            <button 
                                className="profile-action-btn view-profile-btn"
                                onClick={() => onNavigateToProfile(user.id)}
                            >
                                <FaUserAlt className="action-icon" /> View Profile
                            </button>
                            
                            {isAdmin && user.id !== 'current-user' && (
                                <button 
                                    className="profile-action-btn admin-btn"
                                    onClick={() => openAdminPanel(user)}
                                >
                                    <FaShieldAlt className="action-icon" /> Admin Actions
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Format time ago for channel activity
    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return '';
        
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);
        
        if (diffInSeconds < 60) return 'now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
        return `${Math.floor(diffInSeconds / 2592000)}mo`;
    };

    // Access control functions
    const canAccessChannel = (channel, userRole, userCourses = []) => {
        // Admins have access to all channels
        if (userRole === 'ADMIN') {
            return true;
        }

        // Check channel access level
        switch (channel.accessLevel) {
            case 'free':
                return true; // Free channels are accessible to everyone
            case 'course':
                // Course channels require the user to have purchased the course
                return userCourses.includes(channel.courseId);
            case 'premium':
                // Premium channels require premium subscription
                return userRole === 'PREMIUM';
            case 'admin':
                // Admin channels are only for admins
                return userRole === 'ADMIN';
            default:
                return false;
        }
    };

    const canViewChannelMessages = (channel, userRole, userCourses = []) => {
        // If user can't access the channel, they can't see messages
        if (!canAccessChannel(channel, userRole, userCourses)) {
            return false;
        }

        // For locked channels, check if user has proper access
        if (channel.locked) {
            return canAccessChannel(channel, userRole, userCourses);
        }

        return true;
    };

    const canSendMessage = (channel, userRole, userCourses = []) => {
        // Check basic access first
        if (!canAccessChannel(channel, userRole, userCourses)) {
            return false;
        }

        // Read-only channels don't allow sending messages
        if (channel.accessLevel === 'readonly') {
            return false;
        }

        // Staff channels only allow staff to send messages
        if (channel.category === 'staff' && userRole !== 'ADMIN') {
            return false;
        }

        return true;
    };

    // Filter channels based on user access
    const getAccessibleChannels = (channels, userRole, userCourses = []) => {
        return channels.filter(channel => canAccessChannel(channel, userRole, userCourses));
    };

    // Get user's purchased courses (mock data for now)
    const getUserCourses = () => {
        if (shouldUseMockData) {
            // Use mock data based on user ID
            const currentUserId = userId || "user5";
            return MOCK_DATA.userCourses[currentUserId] || [];
        }
        
        // In real implementation, this would come from the API
        return [];
    };

    // Get channel access requirements description
    const getChannelAccessDescription = (channel) => {
        if (channel.accessLevel === 'free') {
            return 'Free for all users';
        } else if (channel.accessLevel === 'course') {
            return `Requires purchased course access`;
        } else if (channel.accessLevel === 'premium') {
            return 'Requires premium subscription';
        } else if (channel.accessLevel === 'admin') {
            return 'Admin only';
        } else if (channel.accessLevel === 'readonly') {
            return 'Read-only channel';
        }
        return 'Special access required';
    };

    // Get current user's role
    const getCurrentUserRole = () => {
        if (storedUser?.role) {
            return storedUser.role;
        }
        if (isAdmin) {
            return 'ADMIN';
        }
        return 'FREE';
    };

    // Apply access control to channels
    const accessibleChannels = getAccessibleChannels(
        enhancedChannelList, 
        getCurrentUserRole(), 
        getUserCourses()
    );

    // Use accessible channels instead of all channels
    const channelsToDisplay = channelList.length > 0 ? 
        getAccessibleChannels(channelList, getCurrentUserRole(), getUserCourses()) : 
        accessibleChannels;

    // Show loading only if we're actually loading and have no channels
    if (loading && channelList.length === 0) {
        return (
            <div className="community-container">
                <SharedBackground />
                <div className="stars"></div>
                <div className="loading">Loading community...</div>
            </div>
        );
    }

    return (
        <div className="community-container">
            {/* Grid background */}
            <div className="stars"></div>
            
            {/* Left Sidebar - Channels */}
            <div className="community-sidebar">
              <div className="sidebar-header">
                <h2>Channels</h2>
              </div>
              
              <div className="channels-section">
                {/* Welcome & Announcements */}
                <div className="channel-category">
                  <div className="category-header">
                    <span className="category-icon">📢</span>
                    <h3 className="category-title">Welcome & Announcements</h3>
                    <span className="category-count">{channelsToDisplay.filter(c => c.category === 'announcements').length}</span>
                  </div>
                  <ul className="channels-list">
                    {channelsToDisplay
                      .filter(channel => channel.category === 'announcements')
                      .map((channel) => (
                        <li
                          key={channel.id}
                          className={`channel-item ${selectedChannel?.id === channel.id ? 'active' : ''} ${channel.unread ? 'unread' : ''} ${!canAccessChannel(channel, getCurrentUserRole(), getUserCourses()) ? 'access-denied' : ''}`}
                          onClick={() => handleChannelClick(channel)}
                        >
                          <span className="channel-icon">
                            {channel.locked ? '🔒' : '💬'}
                          </span>
                          <span className="channel-name">{channel.name}</span>
                          {channel.accessLevel === "readonly" && (
                            <span className="channel-readonly-tag">Read Only</span>
                          )}
                          {channel.locked && (
                            <span className="channel-lock-icon">🔒</span>
                          )}
                          {!canAccessChannel(channel, getCurrentUserRole(), getUserCourses()) && (
                            <span className="channel-access-denied-tag">🚫</span>
                          )}
                          <div className="channel-status">
                            <span className="channel-members">{channel.memberCount || 0}</span>
                            {channel.lastActivity && (
                              <span className="channel-last-activity">{formatTimeAgo(channel.lastActivity)}</span>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Staff Channels */}
                <div className="channel-category">
                  <div className="category-header">
                    <span className="category-icon">👥</span>
                    <h3 className="category-title">Staff</h3>
                    <span className="category-count">{channelsToDisplay.filter(c => c.category === 'staff').length}</span>
                  </div>
                  <ul className="channels-list">
                    {channelsToDisplay
                      .filter(channel => channel.category === 'staff')
                      .map((channel) => (
                        <li
                          key={channel.id}
                          className={`channel-item ${selectedChannel?.id === channel.id ? 'active' : ''} ${channel.unread ? 'unread' : ''} ${!canAccessChannel(channel, getCurrentUserRole(), getUserCourses()) ? 'access-denied' : ''}`}
                          onClick={() => handleChannelClick(channel)}
                        >
                          <span className="channel-icon">
                            {channel.locked ? '🔒' : '💬'}
                          </span>
                          <span className="channel-name">{channel.name}</span>
                          {channel.accessLevel === "readonly" && (
                            <span className="channel-readonly-tag">Read Only</span>
                          )}
                          {channel.locked && (
                            <span className="channel-lock-icon">🔒</span>
                          )}
                          {!canAccessChannel(channel, getCurrentUserRole(), getUserCourses()) && (
                            <span className="channel-access-denied-tag">🚫</span>
                          )}
                          <div className="channel-status">
                            <span className="channel-members">{channel.memberCount || 0}</span>
                            {channel.lastActivity && (
                              <span className="channel-last-activity">{formatTimeAgo(channel.lastActivity)}</span>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Course Channels */}
                <div className="channel-category">
                  <div className="category-header">
                    <span className="category-icon">📚</span>
                    <h3 className="category-title">Courses</h3>
                    <span className="category-count">{channelsToDisplay.filter(c => c.category === 'courses').length}</span>
                  </div>
                  <ul className="channels-list">
                    {channelsToDisplay
                      .filter(channel => channel.category === 'courses')
                      .map((channel) => (
                        <li
                          key={channel.id}
                          className={`channel-item ${selectedChannel?.id === channel.id ? 'active' : ''} ${channel.unread ? 'unread' : ''} ${!canAccessChannel(channel, getCurrentUserRole(), getUserCourses()) ? 'access-denied' : ''}`}
                          onClick={() => handleChannelClick(channel)}
                        >
                          <span className="channel-icon">
                            {channel.locked ? '🔒' : '💬'}
                          </span>
                          <span className="channel-name">{channel.name}</span>
                          {channel.accessLevel === "readonly" && (
                            <span className="channel-readonly-tag">Read Only</span>
                          )}
                          {channel.locked && (
                            <span className="channel-lock-icon">🔒</span>
                          )}
                          {!canAccessChannel(channel, getCurrentUserRole(), getUserCourses()) && (
                            <span className="channel-access-denied-tag">🚫</span>
                          )}
                          <div className="channel-status">
                            <span className="channel-members">{channel.memberCount || 0}</span>
                            {channel.lastActivity && (
                              <span className="channel-last-activity">{formatTimeAgo(channel.lastActivity)}</span>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Trading Channels */}
                <div className="channel-category">
                  <div className="category-header">
                    <span className="category-icon">📈</span>
                    <h3 className="category-title">Trading</h3>
                    <span className="category-count">{channelsToDisplay.filter(c => c.category === 'trading').length}</span>
                  </div>
                  <ul className="channels-list">
                    {channelsToDisplay
                      .filter(channel => channel.category === 'trading')
                      .map((channel) => (
                        <li
                          key={channel.id}
                          className={`channel-item ${selectedChannel?.id === channel.id ? 'active' : ''} ${channel.unread ? 'unread' : ''} ${!canAccessChannel(channel, getCurrentUserRole(), getUserCourses()) ? 'access-denied' : ''}`}
                          onClick={() => handleChannelClick(channel)}
                        >
                          <span className="channel-icon">
                            {channel.locked ? '🔒' : '💬'}
                          </span>
                          <span className="channel-name">{channel.name}</span>
                          {channel.accessLevel === "readonly" && (
                            <span className="channel-readonly-tag">Read Only</span>
                          )}
                          {channel.locked && (
                            <span className="channel-lock-icon">🔒</span>
                          )}
                          {!canAccessChannel(channel, getCurrentUserRole(), getUserCourses()) && (
                            <span className="channel-access-denied-tag">🚫</span>
                          )}
                          <div className="channel-status">
                            <span className="channel-members">{channel.memberCount || 0}</span>
                            {channel.lastActivity && (
                              <span className="channel-last-activity">{formatTimeAgo(channel.lastActivity)}</span>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* General Channels */}
                <div className="channel-category">
                  <div className="category-header">
                    <span className="category-icon">💭</span>
                    <h3 className="category-title">General</h3>
                    <span className="category-count">{channelsToDisplay.filter(c => c.category === 'general').length}</span>
                  </div>
                  <ul className="channels-list">
                    {channelsToDisplay
                      .filter(channel => channel.category === 'general')
                      .map((channel) => (
                        <li
                          key={channel.id}
                          className={`channel-item ${selectedChannel?.id === channel.id ? 'active' : ''} ${channel.unread ? 'unread' : ''} ${!canAccessChannel(channel, getCurrentUserRole(), getUserCourses()) ? 'access-denied' : ''}`}
                          onClick={() => handleChannelClick(channel)}
                        >
                          <span className="channel-icon">
                            {channel.locked ? '🔒' : '💬'}
                          </span>
                          <span className="channel-name">{channel.name}</span>
                          {channel.accessLevel === "readonly" && (
                            <span className="channel-readonly-tag">Read Only</span>
                          )}
                          {channel.locked && (
                            <span className="channel-lock-icon">🔒</span>
                          )}
                          {!canAccessChannel(channel, getCurrentUserRole(), getUserCourses()) && (
                            <span className="channel-access-denied-tag">🚫</span>
                          )}
                          <div className="channel-status">
                            <span className="channel-members">{channel.memberCount || 0}</span>
                            {channel.lastActivity && (
                              <span className="channel-last-activity">{formatTimeAgo(channel.lastActivity)}</span>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Support Channels */}
                <div className="channel-category">
                  <div className="category-header">
                    <span className="category-icon">🆘</span>
                    <h3 className="category-title">Support</h3>
                    <span className="category-count">{channelsToDisplay.filter(c => c.category === 'support').length}</span>
                  </div>
                  <ul className="channels-list">
                    {channelsToDisplay
                      .filter(channel => channel.category === 'support')
                      .map((channel) => (
                        <li
                          key={channel.id}
                          className={`channel-item ${selectedChannel?.id === channel.id ? 'active' : ''} ${channel.unread ? 'unread' : ''} ${!canAccessChannel(channel, getCurrentUserRole(), getUserCourses()) ? 'access-denied' : ''}`}
                          onClick={() => handleChannelClick(channel)}
                        >
                          <span className="channel-icon">
                            {channel.locked ? '🔒' : '💬'}
                          </span>
                          <span className="channel-name">{channel.name}</span>
                          {channel.accessLevel === "readonly" && (
                            <span className="channel-readonly-tag">Read Only</span>
                          )}
                          {channel.locked && (
                            <span className="channel-lock-icon">🔒</span>
                          )}
                          {!canAccessChannel(channel, getCurrentUserRole(), getUserCourses()) && (
                            <span className="channel-access-denied-tag">🚫</span>
                          )}
                          <div className="channel-status">
                            <span className="channel-members">{channel.memberCount || 0}</span>
                            {channel.lastActivity && (
                              <span className="channel-last-activity">{formatTimeAgo(channel.lastActivity)}</span>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Premium Channels */}
                <div className="channel-category">
                  <div className="category-header">
                    <span className="category-icon">⭐</span>
                    <h3 className="category-title">Premium</h3>
                    <span className="category-count">{channelsToDisplay.filter(c => c.category === 'premium').length}</span>
                  </div>
                  <ul className="channels-list">
                    {channelsToDisplay
                      .filter(channel => channel.category === 'premium')
                      .map((channel) => (
                        <li
                          key={channel.id}
                          className={`channel-item ${selectedChannel?.id === channel.id ? 'active' : ''} ${channel.unread ? 'unread' : ''} ${!canAccessChannel(channel, getCurrentUserRole(), getUserCourses()) ? 'access-denied' : ''}`}
                          onClick={() => handleChannelClick(channel)}
                        >
                          <span className="channel-icon">
                            {channel.locked ? '🔒' : '💬'}
                          </span>
                          <span className="channel-name">{channel.name}</span>
                          {channel.accessLevel === "readonly" && (
                            <span className="channel-readonly-tag">Read Only</span>
                          )}
                          {channel.locked && (
                            <span className="channel-lock-icon">🔒</span>
                          )}
                          {!canAccessChannel(channel, getCurrentUserRole(), getUserCourses()) && (
                            <span className="channel-access-denied-tag">🚫</span>
                          )}
                          <div className="channel-status">
                            <span className="channel-members">{channel.memberCount || 0}</span>
                            {channel.lastActivity && (
                              <span className="channel-last-activity">{formatTimeAgo(channel.lastActivity)}</span>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions">
                <button className="quick-action-btn" onClick={() => setShowCreateChannel(true)}>
                  <span className="quick-action-icon">➕</span>
                  Create Channel
                </button>
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="chat-area">
                {selectedChannel ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-title">
                                <h1>#{selectedChannel.name}</h1>
                                <div className="channel-access-info">
                                    <span className={`access-badge ${selectedChannel.accessLevel}`}>
                                        {getChannelAccessDescription(selectedChannel)}
                                    </span>
                                    {selectedChannel.locked && (
                                        <span className="locked-badge">🔒 Locked</span>
                                    )}
                                </div>
                            </div>
                            <p className="chat-description">
                                {selectedChannel.description || 'Join the conversation'}
                            </p>
                            {!canAccessChannel(selectedChannel, getCurrentUserRole(), getUserCourses()) && (
                                <div className="access-warning">
                                    ⚠️ You don't have access to this channel. Purchase required courses or upgrade your subscription.
                                </div>
                            )}
                        </div>

                        <div className="messages-container">
                            {!canViewChannelMessages(selectedChannel, getCurrentUserRole(), getUserCourses()) ? (
                                <div className="empty-chat">
                                    <h2>Access Denied</h2>
                                    <p>You don't have permission to view messages in #{selectedChannel.name}.</p>
                                    <p>This channel requires: {getChannelAccessDescription(selectedChannel)}</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="empty-chat">
                                    <h2>No messages yet</h2>
                                    <p>Be the first to start the conversation in #{selectedChannel.name}!</p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div key={message.id} className="message-item">
                                        {message.senderAvatar ? (
                                            <img
                                                src={getAvatarPath(message.senderAvatar)}
                                                alt={message.senderUsername}
                                                className="message-avatar"
                                                onClick={() => handleUserClick(message.senderId)}
                                            />
                                        ) : (
                                            <div
                                                className="user-avatar-letter"
                                                onClick={() => handleUserClick(message.senderId)}
                                            >
                                                {message.senderUsername?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        
                                        <div className="message-content">
                                            <div className="message-header">
                                                <span className="message-author">
                                                    {message.senderUsername || 'Unknown User'}
                                                </span>
                                                <span className="message-time">
                                                    {new Date(message.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div className="message-text">
                                                {renderFormattedText(message.content)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="chat-input-container">
                            {/* Status Indicator */}
                            <div className="status-indicator">
                                <div className="status-dot"></div>
                                <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
                            </div>
                            
                            <form className="chat-form" onSubmit={handleSendMessage}>
                                <div className="chat-input-wrapper">
                                    <textarea
                                        className="chat-input"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={`Message #${selectedChannel.name}`}
                                        disabled={!canSendMessage(selectedChannel, getCurrentUserRole(), getUserCourses())}
                                        rows={1}
                                    />
                                </div>
                                
                                {/* Discord-style buttons */}
                                <div className="chat-input-buttons">
                                    <button
                                        type="button"
                                        className="chat-input-btn attach-btn ripple"
                                        data-tooltip="Attach File"
                                        onClick={handleFileUpload}
                                    >
                                        📎
                                    </button>
                                    
                                    <button
                                        type="button"
                                        className="chat-input-btn gif-btn ripple"
                                        data-tooltip="GIF"
                                        onClick={handleGifPicker}
                                    >
                                        GIF
                                    </button>
                                    
                                    <button
                                        type="button"
                                        className="chat-input-btn emoji-btn ripple"
                                        data-tooltip="Emoji"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    >
                                        😊
                                    </button>
                                    
                                    <button
                                        type="button"
                                        className="chat-input-btn game-btn ripple"
                                        data-tooltip="Game Activity"
                                        onClick={handleGameActivity}
                                    >
                                        🎮
                                    </button>
                                </div>
                                
                                <button
                                    type="submit"
                                    className="chat-submit"
                                    disabled={!newMessage.trim() || !canSendMessage(selectedChannel, getCurrentUserRole(), getUserCourses())}
                                >
                                    <span>Send</span>
                                    <span>→</span>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="empty-chat">
                        <h2>Select a Channel</h2>
                        <p>Choose a channel from the sidebar to start chatting</p>
                    </div>
                )}
            </div>

            {/* Right Sidebar - Online Users */}
            <div className="online-sidebar">
                <div className="online-section">
                    <div className="online-header">
                        <h3>Online Users</h3>
                        <span className="online-count">{onlineUsers.length}</span>
                    </div>
                    
                    <ul className="online-users">
                        {onlineUsers.map((user) => (
                            <li key={user.id} className="user-item" onClick={() => handleUserClick(user.id)}>
                                {user.avatar ? (
                                    <img
                                        src={getAvatarPath(user.avatar)}
                                        alt={user.username}
                                        className="user-avatar"
                                    />
                                ) : (
                                    <div className="user-avatar-letter">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                
                                <span className="user-name">{user.username}</span>
                                
                                {user.role && (
                                    <span className="user-role-tag">{user.role}</span>
                                )}
                                
                                <div className={`user-status ${user.isOnline ? 'online' : ''}`}></div>
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

            {/* Context Menu */}
            {contextMenu.visible && (
                <div
                    className="context-menu"
                    style={{
                        left: contextMenu.x,
                        top: contextMenu.y
                    }}
                    onMouseLeave={() => setContextMenu({ visible: false, x: 0, y: 0 })}
                >
                    <div className="edit-option" onClick={() => handleEdit(contextMenu.message)}>
                        ✏️ Edit
                    </div>
                    <div className="copy-option" onClick={() => handleCopy(contextMenu.message)}>
                        📋 Copy
                    </div>
                    <div className="reply-option" onClick={() => handleReply(contextMenu.message)}>
                        💬 Reply
                    </div>
                    <div className="delete-option" onClick={() => handleDelete(contextMenu.message)}>
                        🗑️ Delete
                    </div>
                </div>
            )}

            {/* User Profile Modal */}
            {profileModal.visible && profileModal.user && (
                <UserProfileModal
                    visible={profileModal.visible}
                    user={profileModal.user}
                    onClose={closeUserProfile}
                    onNavigateToProfile={navigateToUserProfile}
                />
            )}

            {/* Admin Panel */}
            <AdminPanel
                visible={showAdminPanel}
                onClose={() => setShowAdminPanel(false)}
                onAction={handleAdminAction}
                selectedUser={selectedUserForAction}
                action={adminAction}
                onActionChange={setAdminAction}
                banReason={banReason}
                onBanReasonChange={setBanReason}
                muteDuration={muteDuration}
                onMuteDurationChange={setMuteDuration}
            />

            {/* Create Channel Modal */}
            {showCreateChannel && (
              <div className="modal-overlay" onClick={() => setShowCreateChannel(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3 className="modal-title">Create New Channel</h3>
                    <button className="modal-close" onClick={() => setShowCreateChannel(false)}>×</button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <label htmlFor="channelName">Channel Name</label>
                      <input
                        type="text"
                        id="channelName"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        placeholder="Enter channel name"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="channelCategory">Category</label>
                      <select
                        id="channelCategory"
                        value={newChannelCategory}
                        onChange={(e) => setNewChannelCategory(e.target.value)}
                        className="form-select"
                      >
                        <option value="announcements">Welcome & Announcements</option>
                        <option value="staff">Staff</option>
                        <option value="courses">Courses</option>
                        <option value="trading">Trading</option>
                        <option value="general">General</option>
                        <option value="support">Support</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>
                    <div className="modal-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          if (newChannelName.trim()) {
                            // Here you would typically make an API call to create the channel
                            console.log('Creating channel:', { name: newChannelName, category: newChannelCategory });
                            setNewChannelName('');
                            setNewChannelCategory('general');
                            setShowCreateChannel(false);
                          }
                        }}
                      >
                        Create Channel
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setShowCreateChannel(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
    );
};

export default Community;
