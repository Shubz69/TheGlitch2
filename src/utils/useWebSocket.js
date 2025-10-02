import { useState, useEffect, useCallback, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useAuth } from '../context/AuthContext';

// Define a fixed API base URL with proper fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const useWebSocket = (channelId, onMessageCallback, shouldConnect = true) => {
  const { token, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const stompClientRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const connectRef = useRef(null);

  // Get auth headers for WebSocket connection
  const getAuthHeaders = useCallback(() => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  // Handle reconnection logic - define before connect
  const handleReconnect = useCallback(() => {
    if (!shouldConnect) return; // Skip reconnection if shouldConnect is false
    
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current += 1;
      console.log(`Reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
      
      // Instead of calling connect directly, schedule a reconnection
      setTimeout(() => {
        console.log('Attempting to reconnect...');
        // We'll use a ref to the latest connect function
        if (typeof connectRef.current === 'function') {
          connectRef.current();
        }
      }, 2000 * reconnectAttempts.current);
    } else {
      console.error('Max reconnect attempts reached');
      setConnectionError('Max reconnect attempts reached. Please refresh the page to try again.');
    }
  }, [shouldConnect]); // Add shouldConnect as dependency

  // Connect to WebSocket
  const connect = useCallback(() => {
    // Skip connection if not authenticated or missing channelId or shouldConnect is false
    if (!shouldConnect || !isAuthenticated || !token || !channelId) {
      console.log('Skipping WebSocket connection:', !shouldConnect ? 'Connection disabled' : 'Not authenticated or missing channelId');
      return;
    }
    
    try {
      console.log(`Connecting to WebSocket at ${API_BASE_URL}/ws`);
      
      // Clear any previous connection
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.disconnect();
      }
      
      // Create new SockJS instance
      const socket = new SockJS(`${API_BASE_URL}/ws`);
      
      // Create STOMP client over SockJS
      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: getAuthHeaders(),
        debug: (str) => {
          // Only log in development environment
          if (process.env.NODE_ENV === 'development') {
            console.log(`STOMP: ${str}`);
          }
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      // Set connection handlers
      client.onConnect = (frame) => {
        console.log('WebSocket Connected:', frame);
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
        
        // Subscribe to channel
        if (channelId) {
          client.subscribe(`/topic/chat/${channelId}`, (message) => {
            console.log('Received message:', message);
            try {
              // Check if message.body exists and is valid JSON
              if (message.body) {
                // Validate if the message is proper JSON before parsing
                if (message.body.trim().startsWith('{') || message.body.trim().startsWith('[')) {
                  try {
                    const data = JSON.parse(message.body);
                    onMessageCallback(data);
                  } catch (parseError) {
                    console.error('Error parsing message as JSON:', parseError);
                    console.warn('Invalid JSON received:', message.body.substring(0, 50) + '...');
                  }
                } else {
                  // Handle non-JSON message
                  console.warn('Received non-JSON message:', message.body.substring(0, 50) + '...');
                }
              }
            } catch (error) {
              console.error('Error handling message:', error);
            }
          });
          
          // Also subscribe to online users updates
          client.subscribe('/topic/online-users', (message) => {
            try {
              if (message.body) {
                const data = JSON.parse(message.body);
                // This will be handled by the admin panel for online status updates
                console.log('Online users update received:', data);
              }
            } catch (error) {
              console.error('Error parsing online users update:', error);
            }
          });
        }
      };

      client.onStompError = (frame) => {
        console.error('STOMP Error:', frame);
        setConnectionError(`STOMP Error: ${frame.headers?.message || 'Unknown error'}`);
        setIsConnected(false);
        handleReconnect();
      };

      client.onWebSocketError = (error) => {
        // Check if error is an Event object (common when server is unreachable)
        const errorMessage = error instanceof Event 
          ? 'Cannot connect to server. Server may be unavailable.' 
          : (error.message || 'Connection failed');
          
        console.error('WebSocket Error:', error);
        setConnectionError(`WebSocket Error: ${errorMessage}`);
        setIsConnected(false);
        handleReconnect();
      };

      client.onDisconnect = () => {
        console.log('WebSocket Disconnected');
        setIsConnected(false);
      };

      // Activate the client
      stompClientRef.current = client;
      client.activate();
      
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionError(`Connection Error: ${error.message}`);
      setIsConnected(false);
      handleReconnect();
    }
  }, [channelId, getAuthHeaders, onMessageCallback, handleReconnect, isAuthenticated, token, shouldConnect]); // Add shouldConnect as dependency

  // Update the connectRef when connect changes
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Send message through WebSocket
  const sendMessage = useCallback((message) => {
    if (!shouldConnect) {
      console.log('WebSocket connections disabled, not sending message');
      return false;
    }
    
    if (!isAuthenticated || !token) {
      console.log('Cannot send message: Not authenticated');
      return false;
    }
    
    if (!stompClientRef.current || !stompClientRef.current.connected || !channelId) {
      console.error('Cannot send message: WebSocket not connected or channelId missing');
      return false;
    }

    try {
      stompClientRef.current.publish({
        destination: `/app/chat/${channelId}`,
        headers: getAuthHeaders(),
        body: JSON.stringify(message)
      });
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [channelId, getAuthHeaders, isAuthenticated, token, shouldConnect]); // Add shouldConnect as dependency

  // Initial connection
  useEffect(() => {
    if (shouldConnect) {
      connect();
    } else {
      console.log('WebSocket connections disabled, not connecting');
    }
    
    // Cleanup on unmount
    return () => {
      if (stompClientRef.current) {
        console.log('Disconnecting WebSocket');
        stompClientRef.current.deactivate();
      }
    };
  }, [connect, shouldConnect]); // Add shouldConnect as dependency

  return {
    isConnected,
    connectionError,
    sendMessage
  };
};
