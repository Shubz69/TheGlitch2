package com.project.trading_platform_backend.config;

import com.project.trading_platform_backend.model.UserModel;
import com.project.trading_platform_backend.security.JwtUtil;
import com.project.trading_platform_backend.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Interceptor to authenticate WebSocket connections using JWT
 */
@Component
@Slf4j
public class WebSocketAuthenticationInterceptor implements ChannelInterceptor {
    
    private final JwtUtil jwtUtil;
    private final UserService userService;

    @Autowired
    public WebSocketAuthenticationInterceptor(JwtUtil jwtUtil, UserService userService) {
        this.jwtUtil = jwtUtil;
        this.userService = userService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Extract JWT from the headers
            List<String> authorization = accessor.getNativeHeader("Authorization");
            
            if (authorization != null && !authorization.isEmpty()) {
                String token = authorization.get(0).replace("Bearer ", "");
                
                try {
                    // Validate token
                    if (jwtUtil.validateToken(token)) {
                        // Extract username from token
                        String username = jwtUtil.extractUsername(token);
                        
                        // Load user details
                        UserDetails userDetails = userService.loadUserByUsername(username);
                        
                        // Get the actual user model for additional information
                        UserModel user = userService.findByUsername(username);
                        
                        // Authenticate user
                        UsernamePasswordAuthenticationToken authentication = 
                            new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        
                        // Set authentication in the Security Context
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        
                        // Store authentication in the accessor for later use
                        accessor.setUser(authentication);
                        
                        // Store user information in session attributes for tracking
                        if (user != null) {
                            accessor.setSessionId(user.getId().toString());
                            accessor.addNativeHeader("userId", user.getId().toString());
                            accessor.addNativeHeader("username", user.getUsername());
                        }
                        
                        log.info("WebSocket connection authenticated for user: {} (ID: {})", username, user != null ? user.getId() : "unknown");
                    } else {
                        log.warn("Invalid JWT token in WebSocket connection");
                    }
                } catch (Exception e) {
                    log.error("Failed to authenticate WebSocket connection", e);
                }
            } else {
                log.warn("No authorization header in WebSocket connection");
            }
        }
        
        return message;
    }
} 