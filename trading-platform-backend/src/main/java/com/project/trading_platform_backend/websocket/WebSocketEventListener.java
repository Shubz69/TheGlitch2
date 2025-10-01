package com.project.trading_platform_backend.websocket;

import com.project.trading_platform_backend.model.ChatMessage;
import com.project.trading_platform_backend.model.UserModel;
import com.project.trading_platform_backend.repository.UserRepository;
import com.project.trading_platform_backend.service.PresenceService;
import com.project.trading_platform_backend.service.WebSocketSecurityService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.LocalDateTime;

/**
 * Event listener for WebSocket connections
 */
@Component
public class WebSocketEventListener {

    private final SimpMessageSendingOperations messagingTemplate;
    private final WebSocketSecurityService securityService;
    private final PresenceService presenceService;
    private final UserRepository userRepository;
    private static final Logger log = LoggerFactory.getLogger(WebSocketEventListener.class);

    @Autowired
    public WebSocketEventListener(SimpMessageSendingOperations messagingTemplate, 
                                WebSocketSecurityService securityService,
                                PresenceService presenceService,
                                UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.securityService = securityService;
        this.presenceService = presenceService;
        this.userRepository = userRepository;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        log.info("Received a new WebSocket connection");
        
        // Extract user information from the session
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String userIdStr = (String) headerAccessor.getSessionAttributes().get("userId");
        
        if (userIdStr != null) {
            try {
                Long userId = Long.parseLong(userIdStr);
                // Mark user as online
                presenceService.markUserOnline(userId);
                
                // Update last seen timestamp
                userRepository.findById(userId).ifPresent(user -> {
                    user.setLastSeen(LocalDateTime.now());
                    userRepository.save(user);
                });
                
                log.info("User {} marked as online", userId);
            } catch (NumberFormatException e) {
                log.error("Invalid user ID format: {}", userIdStr);
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        String username = (String) headerAccessor.getSessionAttributes().get("username");
        String channelId = (String) headerAccessor.getSessionAttributes().get("channel");
        String userIdStr = (String) headerAccessor.getSessionAttributes().get("userId");

        if (username != null && channelId != null) {
            log.info("User Disconnected: {}", username);

            try {
                // Create leave message
                ChatMessage chatMessage = new ChatMessage();
                chatMessage.setType(ChatMessage.MessageType.LEAVE);
                chatMessage.setSender(username);
                chatMessage.setChannelId(channelId);
                chatMessage.setTimestamp(System.currentTimeMillis());

                // Encrypt and broadcast leave message
                String encryptedMessage = securityService.processOutgoingMessage(chatMessage);
                messagingTemplate.convertAndSend("/topic/channel/" + channelId, encryptedMessage);

            } catch (Exception e) {
                log.error("Error handling disconnect event", e);
            }
        }
        
        // Handle user offline status
        if (userIdStr != null) {
            try {
                Long userId = Long.parseLong(userIdStr);
                // Mark user as offline
                presenceService.markUserOffline(userId);
                
                // Update last seen timestamp
                userRepository.findById(userId).ifPresent(user -> {
                    user.setLastSeen(LocalDateTime.now());
                    userRepository.save(user);
                });
                
                log.info("User {} marked as offline", userId);
            } catch (NumberFormatException e) {
                log.error("Invalid user ID format: {}", userIdStr);
            }
        }
    }
} 