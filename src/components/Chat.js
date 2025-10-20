import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button, Paper, Avatar, Divider, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import WebSocketService from '../services/WebSocketService';
import Api from '../services/Api';
import { useAuth } from '../context/AuthContext';

/**
 * Chat component for real-time messaging
 */
const Chat = ({ channelId, channelName }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    // Connect socket and join channel room
    WebSocketService.connect({ userId: user?.id, role: user?.role }, async () => {
      WebSocketService.offChannelEvents();
      WebSocketService.joinChannel(channelId);
      WebSocketService.onChannelMessage(({ channelId: incomingChannelId, message: incoming }) => {
        if (!mounted) return;
        if (incomingChannelId !== channelId) return;
        setMessages(prev => {
          const exists = prev.some(m => m.id && incoming.id && m.id === incoming.id);
          if (exists) return prev;
          return [...prev, incoming];
        });
        scrollToBottom();
      });
      try {
        const resp = await Api.getChannelMessages(channelId, { limit: 50 });
        if (!mounted) return;
        setMessages(resp.data.messages || []);
      } catch (e) {
        console.error('Failed to load channel messages', e);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      WebSocketService.offChannelEvents();
    };
  }, [channelId, user?.id, user?.role]);
  
  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const body = message.trim();
    if (!body) return;
    const optimistic = {
      id: `tmp_${Date.now()}`,
      channelId,
      senderId: String(user?.id || ''),
      body,
      createdAt: Date.now(),
      status: 'sending'
    };
    setMessages(prev => [...prev, optimistic]);
    setMessage('');
    try {
      await Api.sendMessage(channelId, { body });
      // The server broadcast will append the persisted message
      // Optionally remove the optimistic once acked by replacing on duplicate id not feasible; keep both minimalistic
    } catch (err) {
      console.error('Send failed', err);
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get user initials for avatar
  const getUserInitials = (username) => {
    return username ? username.substring(0, 2).toUpperCase() : '?';
  };
  
  // Get message style based on sender
  const getMessageStyle = (sender) => {
    const isCurrentUser = sender === user.username;
    
    return {
      display: 'flex',
      justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
      mb: 2
    };
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Channel Header */}
      <Paper elevation={2} sx={{ 
        p: 2, 
        mb: 2, 
        bgcolor: '#000',
        color: '#fff',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Typography variant="h6" fontWeight="bold">
          #{channelName}
        </Typography>
      </Paper>
      
      {/* Messages Area */}
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        p: 2, 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: '#000',
        minHeight: '400px',
        maxHeight: '500px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 1
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress sx={{ color: '#fff' }} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="#ccc">
              No messages yet. Be the first to send a message!
            </Typography>
          </Box>
        ) : (
          messages.map((msg, index) => {
            const isCurrentUser = String(msg.senderId) === String(user?.id) || msg.sender === user?.username;
            
            return (
              <Box key={index} sx={getMessageStyle(msg.sender)}>
                {!isCurrentUser && (
                  <Avatar 
                    sx={{ 
                      bgcolor: '#fff', 
                      color: '#000',
                      width: 32, 
                      height: 32, 
                      mr: 1, 
                      fontSize: '0.875rem' 
                    }}
                  >
                    {getUserInitials(msg.sender)}
                  </Avatar>
                )}
                
                <Box sx={{ maxWidth: '70%' }}>
                  {!isCurrentUser && (
                    <Typography variant="caption" color="#ccc">
                      {msg.sender}
                    </Typography>
                  )}
                  
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 1.5, 
                      borderRadius: 2,
                      bgcolor: isCurrentUser ? '#fff' : 'rgba(255, 255, 255, 0.1)',
                      color: isCurrentUser ? '#000' : '#fff',
                      border: isCurrentUser ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <Typography variant="body1">{msg.body || msg.content}</Typography>
                    <Typography variant="caption" color={isCurrentUser ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)'} sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                      {formatTime(msg.createdAt || msg.timestamp)}
                    </Typography>
                  </Paper>
                </Box>
                
                {isCurrentUser && (
                  <Avatar 
                    sx={{ 
                      bgcolor: '#fff', 
                      color: '#000',
                      width: 32, 
                      height: 32, 
                      ml: 1, 
                      fontSize: '0.875rem' 
                    }}
                  >
                    {getUserInitials(msg.sender || user?.username)}
                  </Avatar>
                )}
              </Box>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>
      
      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
      
      {/* Message Input */}
      <Box sx={{ p: 2, bgcolor: '#000' }}>
        <form onSubmit={handleSendMessage} style={{ display: 'flex' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#fff',
                },
                '& input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  opacity: 1,
                },
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
              },
            }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            sx={{ 
              ml: 1,
              bgcolor: '#fff',
              color: '#000',
              '&:hover': {
                bgcolor: '#ccc',
              }
            }}
            disabled={message.trim() === ''}
          >
            <SendIcon />
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export default Chat; 