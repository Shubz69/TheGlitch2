import React, { useEffect, useState, useRef, useCallback } from 'react';
import '../styles/Community.css';
import { useWebSocket } from '../utils/useWebSocket';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Api from '../services/Api';
import BinaryBackground from '../components/BinaryBackground';

// Icons
import { FaHashtag, FaLock, FaBullhorn, FaUserAlt, FaPaperPlane, FaSmile, FaCrown, FaShieldAlt, FaBan, FaVolumeMute, FaTrash, FaPaperclip, FaTimes } from 'react-icons/fa';
import { BsStars } from 'react-icons/bs';
import { RiAdminFill } from 'react-icons/ri';

// All API calls use real endpoints only - no mock mode

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

// Online users will be fetched from API or computed from real data


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
    
    // Welcome message and channel visibility
    const [hasReadWelcome, setHasReadWelcome] = useState(false);
    const [showAllChannels, setShowAllChannels] = useState(false);
    const [courses, setCourses] = useState([]);
    
    // Initialize WebSocket connection for real-time messaging
    const { 
        sendMessage: sendSocketMessage,
        isConnected, 
        connectionError 
    } = useWebSocket(
        selectedChannel?.id,
        (message) => {
            console.log('WebSocket: Message received', message);
            setMessages(prev => {
                const isDuplicate = prev.some(m => 
                    m.id === message.id ||
                    (m.content === message.content && 
                    m.sender?.username === message.sender?.username &&
                    Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 5000)
                );
                
                if (isDuplicate) {
                    console.log('Skipping duplicate message');
                    return prev;
                }
                
                const newMessages = [...prev, message];
                // Save to localStorage as backup
                if (selectedChannel?.id) {
                    saveMessagesToStorage(selectedChannel.id, newMessages);
                }
                return newMessages;
            });
        }
    );

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

    // ***** XP SYSTEM FUNCTIONS *****
    
    // XP and Level calculation rules
    const XP_PER_MESSAGE = 10; // Base XP for sending a message
    const XP_PER_FILE = 20; // Extra XP for including a file/image
    const XP_PER_EMOJI = 2; // Extra XP per emoji in message
    
    // Level thresholds - XP required to reach each level
    const getLevelFromXP = (xp) => {
        // Level formula: Level = floor(sqrt(XP / 100)) + 1
        // This means: Level 1 = 0 XP, Level 2 = 100 XP, Level 3 = 400 XP, Level 4 = 900 XP, etc.
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    };
    
    const getXPForLevel = (level) => {
        // Reverse formula: XP needed for a level = (level - 1)^2 * 100
        return Math.pow(level - 1, 2) * 100;
    };
    
    const getXPProgress = (xp) => {
        const currentLevel = getLevelFromXP(xp);
        const currentLevelXP = getXPForLevel(currentLevel);
        const nextLevelXP = getXPForLevel(currentLevel + 1);
        const xpInCurrentLevel = xp - currentLevelXP;
        const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
        const progressPercentage = (xpInCurrentLevel / xpNeededForNextLevel) * 100;
        
        return {
            currentLevel,
            currentXP: xp,
            xpInCurrentLevel,
            xpNeededForNextLevel,
            progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
            nextLevel: currentLevel + 1
        };
    };
    
    // Award XP and update user data
    const awardXP = (earnedXP) => {
        try {
            // Get current user data
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const currentXP = currentUser.xp || 0;
            const newXP = currentXP + earnedXP;
            const newLevel = getLevelFromXP(newXP);
            const oldLevel = getLevelFromXP(currentXP);
            
            // Update user data
            const updatedUser = {
                ...currentUser,
                xp: newXP,
                level: newLevel,
                totalMessages: (currentUser.totalMessages || 0) + 1
            };
            
            // Save to localStorage
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Update state
            setStoredUser(updatedUser);
            setUserLevel(newLevel);
            
            // Log XP gain
            console.log(`+${earnedXP} XP! Total XP: ${newXP}, Level: ${newLevel}`);
            
            // Check for level up
            if (newLevel > oldLevel) {
                console.log(`🎉 LEVEL UP! You are now Level ${newLevel}!`);
                // You could add a toast notification here
            }
            
            return {
                earnedXP,
                newXP,
                newLevel,
                leveledUp: newLevel > oldLevel
            };
        } catch (error) {
            console.error('Error awarding XP:', error);
            return null;
        }
    };
    
    // Calculate XP for a message
    const calculateMessageXP = (messageContent, hasFile) => {
        let totalXP = XP_PER_MESSAGE;
        
        // Bonus for file attachments
        if (hasFile) {
            totalXP += XP_PER_FILE;
        }
        
        // Bonus for emojis (count emojis in message)
        const emojiRegex = /[\p{Emoji}]/gu;
        const emojiMatches = messageContent.match(emojiRegex);
        if (emojiMatches) {
            totalXP += emojiMatches.length * XP_PER_EMOJI;
        }
        
        // Bonus for longer messages (1 XP per 50 characters, max 20 bonus XP)
        const lengthBonus = Math.min(20, Math.floor(messageContent.length / 50));
        totalXP += lengthBonus;
        
        return totalXP;
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
        const channelName = (channel.name || '').toLowerCase();
        const isWelcomeChannel = channelName === 'welcome';
        const isAnnouncementsChannel = channelName === 'announcements';
        
        // Admin-only channels: only admins can post
        if (channel.accessLevel === 'admin-only' || channel.locked) {
            return userRole === 'admin' || isAdmin;
        }
        
        // Welcome and announcements channels: read-only for everyone (except admins)
        if ((isWelcomeChannel || isAnnouncementsChannel) && !isAdmin) {
            return false; // Read-only for non-admins
        }
        
        // Subscribed users can post in all other channels
        if (hasActiveSubscription) {
            return true;
        }
        
        // Non-subscribed users can only post in announcements/welcome (but we already blocked those)
        return false;
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
        
        setLoading(true);
        
        try {
            // Fetch from backend API for permanent persistence
            const response = await Api.getChannelMessages(channelId);
            if (response && response.data && Array.isArray(response.data)) {
                const apiMessages = response.data;
                console.log(`✅ Loaded ${apiMessages.length} messages from backend for channel ${channelId}`);
                
                // Save to localStorage as backup/cache
                saveMessagesToStorage(channelId, apiMessages);
                
                // Set messages from API
                setMessages(apiMessages);
                setLoading(false);
                return;
            } else {
                // Response format unexpected, try localStorage
                const storedMessages = loadMessagesFromStorage(channelId);
                if (storedMessages.length > 0) {
                    console.log(`Loaded ${storedMessages.length} messages from localStorage`);
                    setMessages(storedMessages);
                } else {
                    setMessages([]);
                }
            }
        } catch (apiError) {
            console.warn('Backend API unavailable, loading from localStorage:', apiError.message);
            // Use localStorage as persistent storage - messages persist here
            const storedMessages = loadMessagesFromStorage(channelId);
            if (storedMessages.length > 0) {
                console.log(`✅ Loaded ${storedMessages.length} messages from localStorage`);
                setMessages(storedMessages);
            } else {
                console.log('No messages found - starting with empty channel');
                setMessages([]);
            }
        }
        
        setLoading(false);
    }, []);

    // Check if welcome message has been read
    useEffect(() => {
        const readStatus = localStorage.getItem('welcomeMessageRead') === 'true';
        setHasReadWelcome(readStatus);
        setShowAllChannels(readStatus);
    }, []);

    // Fetch courses for channel naming
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await Api.getCourses();
                if (response && response.data && Array.isArray(response.data)) {
                    setCourses(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch courses:', error);
            }
        };
        
        if (isAuthenticated) {
            fetchCourses();
        }
    }, [isAuthenticated]);

    // Check subscription status
    const checkSubscription = () => {
        const hasActiveSubscription = localStorage.getItem('hasActiveSubscription') === 'true';
        const subscriptionExpiry = localStorage.getItem('subscriptionExpiry');
        
        if (hasActiveSubscription && subscriptionExpiry) {
            const expiryDate = new Date(subscriptionExpiry);
            if (expiryDate > new Date()) {
                return true; // Active subscription
            } else {
                // Subscription expired
                localStorage.removeItem('hasActiveSubscription');
                localStorage.removeItem('subscriptionExpiry');
                return false;
            }
        }
        return false;
    };

    // Check subscription before allowing access to community
    useEffect(() => {
        if (!isAuthenticated) return;
        
        const storedUserData = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = storedUserData.role === 'ADMIN' || storedUserData.role === 'admin';
        
        // Admins bypass subscription requirement
        if (isAdmin) {
            return;
        }
        
        // Don't redirect - allow user to see community page with subscribe button
        // Subscription check is done in the render to show subscribe banner
    }, [isAuthenticated, navigate]);

    // Initialize component
    useEffect(() => {
        console.log("===========================");
        console.log("Community component initializing - Real API Mode");
        
        const storedToken = localStorage.getItem('token');
        const storedUserData = JSON.parse(localStorage.getItem('user') || '{}');
        
        const tokenIsValid = storedToken && storedToken.split('.').length === 3;
        setIsAuthenticated(tokenIsValid);
        
        console.log("Community component initializing");
        console.log("Is authenticated:", tokenIsValid);
        console.log("User object:", storedUserData);
        console.log("===========================");

        if (!tokenIsValid) {
            console.log("User not authenticated, redirecting to login");
            navigate('/login');
            return;
        }
        
        // Don't redirect - allow user to see community page with subscribe button
        // Subscription check is done in the render to show subscribe banner

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
            
            // Initialize XP and level if not present
            const currentXP = storedUserData.xp || 0;
            const calculatedLevel = getLevelFromXP(currentXP);
            
            // Create enhanced user object with guaranteed username and XP
            const enhancedUser = {
                ...storedUserData,
                username: displayName,
                xp: currentXP,
                level: calculatedLevel,
                totalMessages: storedUserData.totalMessages || 0
            };
            
            // Save back to localStorage if we added new fields
            if (!storedUserData.xp || !storedUserData.level) {
                localStorage.setItem('user', JSON.stringify(enhancedUser));
            }
            
            setStoredUser(enhancedUser);
            setUserId(storedUserData.id);
            
            // Check if user is admin
            const adminEmail = 'shubzfx@gmail.com';
            const userIsAdmin = storedUserData.email?.toLowerCase() === adminEmail.toLowerCase() || 
                               storedUserData.role?.toLowerCase() === 'admin';
            setIsAdmin(userIsAdmin);
            
            // Set user level
            setUserLevel(calculatedLevel);
            
            console.log("Display name:", displayName);
            console.log("User XP:", currentXP);
            console.log("User level:", calculatedLevel);
            console.log("Total messages:", enhancedUser.totalMessages);
            console.log("User is admin:", userIsAdmin);
            console.log("User role:", storedUserData.role);
        }
    }, [navigate]);

    // Load channels
    useEffect(() => {
        if (!isAuthenticated) return;
        
        const loadChannels = async () => {
            try {
                // Use real API to fetch channels
                const response = await Api.getChannels();
                if (response && response.data && Array.isArray(response.data)) {
                    let apiChannels = response.data.map(channel => ({
                        ...channel,
                        memberCount: channel.memberCount || 0,
                        lastActivity: channel.lastActivity || null,
                        unread: false,
                        locked: channel.accessLevel === 'admin-only'
                    }));
                    
                    // Update course channel names with actual course titles
                    if (courses.length > 0) {
                        apiChannels = apiChannels.map(channel => {
                            if (channel.category === 'courses' && channel.courseId) {
                                const course = courses.find(c => c.id === channel.courseId);
                                if (course) {
                                    return {
                                        ...channel,
                                        name: course.title.toLowerCase().replace(/\s+/g, '-'),
                                        displayName: course.title
                                    };
                                }
                            }
                            return channel;
                        });
                    }
                    
                    console.log(`Loaded ${apiChannels.length} channels from API`);
                    setChannelList(apiChannels);
                    
                    // Select first channel or channel from URL
                    if (channelIdParam) {
                        const channel = apiChannels.find(c => c.id === parseInt(channelIdParam));
                        if (channel) {
                            setSelectedChannel(channel);
                        }
                    } else if (apiChannels.length > 0 && !selectedChannel) {
                        setSelectedChannel(apiChannels[0]);
                    }
                    return;
                }
            } catch (apiError) {
                console.warn('Failed to fetch channels from API:', apiError.message);
            }
            
            // Initialize online users count (will be fetched from API when available)
            setOnlineUsers([]);
            
            // If API fails, create minimal channel structure from courses
            // This ensures the UI works even if backend isn't ready
            if (courses.length > 0) {
                // Create basic channels structure from available courses
                const courseChannels = courses.map((course, index) => ({
                    id: 40 + index,
                    name: course.title.toLowerCase().replace(/\s+/g, '-'),
                    displayName: course.title,
                    description: `${course.title} course channel`,
                    accessLevel: "open",
                    courseId: course.id,
                    category: "courses",
                    memberCount: 0,
                    lastActivity: null,
                    unread: false,
                    locked: false
                }));
                
                // Add essential channels
                const essentialChannels = [
                    { id: 25, name: "welcome", displayName: "Welcome", description: "Welcome to the trading platform", accessLevel: "open", category: "announcements", memberCount: 0, lastActivity: null, unread: false, locked: false },
                    { id: 26, name: "announcements", displayName: "Announcements", description: "Important platform announcements", accessLevel: "admin-only", category: "announcements", memberCount: 0, lastActivity: null, unread: false, locked: true },
                    { id: 28, name: "general-chat", displayName: "General Chat", description: "General trading discussion", accessLevel: "open", category: "trading", memberCount: 0, lastActivity: null, unread: false, locked: false }
                ];
                
                const allChannels = [...essentialChannels, ...courseChannels];
                console.log(`Created ${allChannels.length} channels from courses (backend unavailable)`);
                setChannelList(allChannels);
                
                // Select first channel or channel from URL
                if (channelIdParam) {
                    const channel = allChannels.find(c => c.id === parseInt(channelIdParam));
                    if (channel) {
                        setSelectedChannel(channel);
                    }
                } else if (allChannels.length > 0 && !selectedChannel) {
                    setSelectedChannel(allChannels[0]);
                }
            } else {
                console.error('Unable to load channels - API unavailable and no courses loaded');
            }
        };
        
        loadChannels();
    }, [isAuthenticated, channelIdParam, selectedChannel, courses]);

    // Load messages when channel changes
    useEffect(() => {
        if (selectedChannel) {
            fetchMessages(selectedChannel.id);
            navigate(`/community/${selectedChannel.id}`);
        }
    }, [selectedChannel, fetchMessages, navigate]);
    
    // Add welcome message when welcome channel is selected for first time
    useEffect(() => {
        if (selectedChannel && selectedChannel.name === 'welcome' && !hasReadWelcome) {
            // Check if welcome message already exists
            const hasWelcomeMessage = messages.some(msg => msg.id === 'welcome-message');
            
            if (!hasWelcomeMessage) {
                const welcomeMessage = {
                    id: 'welcome-message',
                    channelId: selectedChannel.id,
                    content: `🎉 **WELCOME TO THE GLITCH COMMUNITY!** 🎉

Welcome to the most elite trading and wealth-building community on the planet! We're thrilled to have you join us on this incredible journey toward financial freedom and generational wealth.

## 📋 **COMMUNITY RULES**

**1. Respect & Professionalism**
   • Treat all members with respect and professionalism
   • No harassment, discrimination, or personal attacks
   • Maintain a positive and constructive environment

**2. Trading & Investment Discussions**
   • Share knowledge and insights, not financial advice
   • All trades are at your own risk - we are not financial advisors
   • Use proper risk management and never trade more than you can afford to lose

**3. Content & Privacy**
   • Keep conversations relevant to trading, wealth-building, and course topics
   • Do not share personal financial information (account numbers, passwords, etc.)
   • Respect intellectual property - do not share copyrighted course materials

**4. Spam & Promotion**
   • No spam, self-promotion, or affiliate links without permission
   • Do not promote other trading services or products
   • Keep discussions focused on learning and community growth

**5. Course Access**
   • Course-specific channels are for enrolled members only
   • Share insights and ask questions related to your enrolled courses
   • Complete courses in order for maximum learning effectiveness

**6. Community Support**
   • Help fellow members when you can
   • Ask questions - we're all here to learn and grow together
   • Report any issues or concerns to staff members

**7. Platform Usage**
   • Use appropriate language and avoid profanity
   • Keep messages clear and concise
   • Use channels for their intended purposes

## 🚀 **GETTING STARTED**

1. **Complete your profile** - Add your avatar and bio
2. **Explore channels** - Check out different course and trading channels
3. **Join discussions** - Start participating in conversations
4. **Enroll in courses** - Begin your wealth-building journey
5. **Earn XP** - Level up by being active in the community

## 💎 **PREMIUM BENEFITS**

Premium members get access to:
• Exclusive VIP channels and content
• Premium trading signals and insights
• Advanced course materials
• Priority support from our team
• Elite trader discussions

## ⚡ **QUICK TIPS**

• Earn XP by sending messages, sharing files, and being active
• Level up to unlock new channels and features
• Check the announcements channel regularly for updates
• Connect with other traders in the general chat channels

Remember: **Success in trading comes from discipline, education, and consistent action.** We're here to support you every step of the way!

Click the ✅ below to acknowledge you've read and agree to follow these rules, and unlock access to all channels.

Let's build generational wealth together! 💰🚀`,
                    sender: {
                        id: 'system',
                        username: 'THE GLITCH',
                        avatar: '/avatars/avatar_ai.png',
                        role: 'admin'
                    },
                    timestamp: new Date().toISOString(),
                    file: null,
                    isWelcomeMessage: true
                };
                
                setMessages([welcomeMessage]);
            }
        }
    }, [selectedChannel, hasReadWelcome, messages]);

    // Handle send message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !selectedChannel) return;

        // Check if user can send messages in this channel
        if (!canUserPostInChannel(selectedChannel)) {
            alert("You don't have permission to send messages in this channel.");
            return;
        }

        const messageContent = newMessage.trim();
        const messageToSend = {
            channelId: selectedChannel.id,
            content: messageContent,
            file: selectedFile ? {
                name: selectedFile.name,
                type: selectedFile.type,
                size: selectedFile.size,
                preview: filePreview
            } : null
        };

        // Optimistic update - add message to UI immediately
        const optimisticMessage = {
            id: `temp_${Date.now()}`,
            channelId: selectedChannel.id,
            content: messageContent,
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
        
        // Add message to state immediately for instant UI feedback
        const updatedMessages = [...messages, optimisticMessage];
        setMessages(updatedMessages);
        
        // Clear inputs immediately
        setNewMessage('');
        removeSelectedFile();

        try {
            // Save to backend API for permanent persistence
            try {
                const response = await Api.sendMessage(selectedChannel.id, messageToSend);
                
                if (response && response.data) {
                    // Replace optimistic message with server response (has real ID)
                    const serverMessage = response.data;
                    const finalMessages = updatedMessages
                        .filter(msg => msg.id !== optimisticMessage.id) // Remove temp message
                        .concat(serverMessage); // Add server message
                    
                    setMessages(finalMessages);
                    saveMessagesToStorage(selectedChannel.id, finalMessages);
                    
                    console.log('✅ Message saved to backend:', serverMessage);
                } else {
                    // If response doesn't have expected format, keep optimistic message
                    // Convert temp ID to permanent ID
                    const permanentMessage = {
                        ...optimisticMessage,
                        id: Date.now()
                    };
                    const finalMessages = updatedMessages.map(msg => 
                        msg.id === optimisticMessage.id ? permanentMessage : msg
                    );
                    saveMessagesToStorage(selectedChannel.id, finalMessages);
                    console.log('Message sent and saved to localStorage');
                }
            } catch (apiError) {
                console.error('Backend API unavailable, saving to localStorage:', apiError);
                // Backend unavailable - save to localStorage for persistence
                // Convert temp ID to permanent ID
                const permanentMessage = {
                    ...optimisticMessage,
                    id: Date.now()
                };
                const finalMessages = updatedMessages.map(msg => 
                    msg.id === optimisticMessage.id ? permanentMessage : msg
                );
                setMessages(finalMessages);
                saveMessagesToStorage(selectedChannel.id, finalMessages);
                console.log('Message saved to localStorage (backend unavailable)');
            }
            
            // ***** AWARD XP FOR SENDING MESSAGE *****
            const earnedXP = calculateMessageXP(messageContent, !!selectedFile);
            const xpResult = awardXP(earnedXP);
            
            if (xpResult) {
                console.log(`✨ +${xpResult.earnedXP} XP! | Total: ${xpResult.newXP} XP | Level ${xpResult.newLevel}`);
                
                if (xpResult.leveledUp) {
                    // Optional: Show level up notification
                    console.log(`🎉 LEVEL UP! You reached Level ${xpResult.newLevel}!`);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            // On error, remove optimistic message and show error
            setMessages(messages);
            alert('Failed to send message. Please try again.');
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

    // Handle welcome message acknowledgment
    const handleWelcomeAcknowledgment = () => {
        localStorage.setItem('welcomeMessageRead', 'true');
        setHasReadWelcome(true);
        setShowAllChannels(true);
    };

    // Group channels by category
    const groupedChannels = channelList.reduce((acc, channel) => {
        const category = channel.category || 'general';
        const channelName = (channel.name || '').toLowerCase();
        const isAdminChannel = channel.accessLevel === 'admin-only' || channel.locked;
        const isWelcomeChannel = channelName === 'welcome';
        const isAnnouncementsChannel = channelName === 'announcements';
        
        // Admins always see all channels
        if (isAdmin) {
            // Admins see everything - no filtering
        } else if (hasActiveSubscription) {
            // Subscribed users: Show ALL channels EXCEPT welcome, announcements, and admin-only channels
            if (isWelcomeChannel || isAnnouncementsChannel || isAdminChannel) {
                return acc; // Skip these channels for subscribed users
            }
        } else {
            // Non-subscribed users: Only show announcements and welcome (until they subscribe)
            if (category !== 'announcements' || isAdminChannel) {
                return acc;
            }
        }
        
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(channel);
        return acc;
    }, {});

    // Category order
    const categoryOrder = ['announcements', 'staff', 'courses', 'trading', 'general', 'support', 'premium'];

    // Check subscription status for banner and channel visibility
    const hasActiveSubscription = checkSubscription();
    const pendingSubscription = localStorage.getItem('pendingSubscription') === 'true';
    const storedUserDataForBanner = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdminForBanner = storedUserDataForBanner.role === 'ADMIN' || storedUserDataForBanner.role === 'admin';
    const showSubscribeBanner = !isAdminForBanner && !hasActiveSubscription;

    // Handle subscribe button click - redirect to Stripe payment link
    const handleSubscribe = () => {
        // Redirect to Stripe payment link
        window.location.href = 'https://buy.stripe.com/7sY00i9fefKA1oP0f7dIA0j';
    };

    // Render
    return (
        <div className="community-container" style={{ position: 'relative' }}>
            <BinaryBackground />
            
            {/* SUBSCRIBE BANNER - Show if no active subscription */}
            {showSubscribeBanner && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                    color: 'white',
                    padding: '16px 24px',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    borderBottom: '2px solid #6D28D9'
                }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                            Subscribe to Access Full Community
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                            Get 3 months free, then just £99/month
                        </p>
                    </div>
                    <button
                        onClick={handleSubscribe}
                        style={{
                            background: 'white',
                            color: '#8B5CF6',
                            border: 'none',
                            padding: '12px 32px',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
                        }}
                    >
                        SUBSCRIBE NOW
                    </button>
                </div>
            )}
            
            {/* BLUR OVERLAY - Blur content when no subscription */}
            {showSubscribeBanner && (
                <>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 999,
                        pointerEvents: 'none'
                    }} />
                    
                    {/* SUBSCRIPTION MODAL OVERLAY */}
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1001,
                        background: 'rgba(0, 0, 0, 0.7)'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #1E1F22 0%, #2B2D31 100%)',
                            borderRadius: '16px',
                            padding: '40px',
                            maxWidth: '500px',
                            width: '90%',
                            textAlign: 'center',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                            border: '2px solid #8B5CF6'
                        }}>
                            <div style={{
                                fontSize: '48px',
                                marginBottom: '20px'
                            }}>
                                🔒
                            </div>
                            <h2 style={{
                                color: 'white',
                                fontSize: '28px',
                                fontWeight: 'bold',
                                marginBottom: '16px',
                                marginTop: 0
                            }}>
                                Subscribe to Access Community
                            </h2>
                            <p style={{
                                color: '#B5BAC1',
                                fontSize: '16px',
                                lineHeight: '1.6',
                                marginBottom: '32px'
                            }}>
                                To access the community, you need to subscribe. <strong style={{ color: '#A78BFA' }}>Click here</strong> to subscribe and get 3 months free, then just £99/month.
                            </p>
                            <button
                                onClick={handleSubscribe}
                                style={{
                                    background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '16px 48px',
                                    borderRadius: '10px',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                                    width: '100%',
                                    maxWidth: '300px'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'scale(1.05)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.6)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
                                }}
                            >
                                Subscribe Now
                            </button>
                        </div>
                    </div>
                </>
            )}
            
            {/* LEFT SIDEBAR - CHANNELS */}
            <div className="community-sidebar" style={{
                filter: showSubscribeBanner ? 'blur(8px)' : 'none',
                pointerEvents: showSubscribeBanner ? 'none' : 'auto',
                userSelect: showSubscribeBanner ? 'none' : 'auto'
            }}>
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
                                                <span className="channel-name">{channel.displayName || channel.name}</span>
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
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--purple-primary), var(--purple-dark))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: 'white',
                            flexShrink: 0
                        }}>
                            {(storedUser?.username || storedUser?.name || 'U').substring(0, 2).toUpperCase()}
                        </div>
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
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                gap: '6px'
                            }}>
                                <span>Level {userLevel}</span>
                                <span>•</span>
                                <span>{storedUser?.xp || 0} XP</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* MAIN CHAT AREA */}
            <div className="chat-main" style={{
                filter: showSubscribeBanner ? 'blur(8px)' : 'none',
                pointerEvents: showSubscribeBanner ? 'none' : 'auto',
                userSelect: showSubscribeBanner ? 'none' : 'auto'
            }}>
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
                                    <h3>Welcome to #{selectedChannel.displayName || selectedChannel.name}</h3>
                                    <p>{selectedChannel.description || 'No messages yet. Be the first to start the conversation!'}</p>
                                </div>
                            ) : (
                                messages.map((message, index) => (
                                    <div 
                                        key={message.id || index} 
                                        className="message-item"
                                    >
                                        <div className="message-avatar-text">
                                            {(message.sender?.username || 'U').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="message-content">
                                            <div className="message-header-info">
                                                <span className="message-author">
                                                    {message.sender?.username || 'Unknown'}
                                                </span>
                                                <span className="message-timestamp">
                                                    {formatTimestamp(message.timestamp)}
                                                </span>
                                            </div>
                                            <div className="message-text" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                                {message.isWelcomeMessage ? (
                                                    message.content.split('\n').map((line, idx) => {
                                                        const trimmedLine = line.trim();
                                                        // Format markdown-style headers
                                                        if (trimmedLine.startsWith('## ')) {
                                                            return <h3 key={idx} style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '16px', marginBottom: '10px', color: 'var(--primary)' }}>{trimmedLine.substring(3)}</h3>;
                                                        }
                                                        // Format bold text (lines that start and end with **)
                                                        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4) {
                                                            return <div key={idx} style={{ fontWeight: 'bold', marginTop: '8px', marginBottom: '4px' }}>{trimmedLine.replace(/\*\*/g, '')}</div>;
                                                        }
                                                        // Empty lines
                                                        if (trimmedLine === '') {
                                                            return <br key={idx} />;
                                                        }
                                                        // Regular text lines
                                                        return <div key={idx} style={{ marginBottom: '4px' }}>{line.replace(/\*\*/g, '')}</div>;
                                                    })
                                                ) : (
                                                    message.content
                                                )}
                                            </div>
                                            {message.isWelcomeMessage && !hasReadWelcome && (
                                                <div style={{
                                                    marginTop: '20px',
                                                    padding: '16px',
                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onClick={handleWelcomeAcknowledgment}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
                                                >
                                                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                                                    <span style={{ fontWeight: 600 }}>I've read and agree to the rules</span>
                                                </div>
                                            )}
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
            <div className="online-sidebar" style={{
                filter: showSubscribeBanner ? 'blur(8px)' : 'none',
                pointerEvents: showSubscribeBanner ? 'none' : 'auto',
                userSelect: showSubscribeBanner ? 'none' : 'auto'
            }}>
                <div className="online-section">
                    <div className="online-header">
                        <h3>Online Users</h3>
                        <span className="online-count">
                            {onlineUsers.filter(u => u.status === 'online').length || 0} / {onlineUsers.length || 0}
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
