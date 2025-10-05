package com.project.trading_platform_backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.trading_platform_backend.model.ChatMessage;
import com.project.trading_platform_backend.model.MessageModel;
import com.project.trading_platform_backend.model.UserModel;
import com.project.trading_platform_backend.repository.UserRepository;
import com.project.trading_platform_backend.service.CommunityService;
import com.project.trading_platform_backend.service.WebSocketSecurityService;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Controller for handling WebSocket chat messages
 */
@Controller
@Slf4j
public class ChatController {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final WebSocketSecurityService securityService;
    private final CommunityService communityService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public ChatController(
            SimpMessagingTemplate messagingTemplate,
            WebSocketSecurityService securityService,
            CommunityService communityService,
            UserRepository userRepository,
            ObjectMapper objectMapper) {
        this.messagingTemplate = messagingTemplate;
        this.securityService = securityService;
        this.communityService = communityService;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    // This method was removed to resolve WebSocket mapping conflict with MessageSocketController
    // The /chat/{channelId} endpoint is now handled by MessageSocketController

    @MessageMapping("/chat")
    public void handleMessage(SimpMessageHeaderAccessor headerAccessor, String messagePayload) {
        try {
            log.info("Received message: {}", messagePayload);
            log.info("WebSocket encryption enabled: {}", securityService.isEncryptionEnabled());
            
            // First, try to decrypt the message if needed
            String processedPayload = securityService.decryptMessage(messagePayload);
            
            // Then parse it into a ChatMessage object
            ChatMessage chatMessage = objectMapper.readValue(processedPayload, ChatMessage.class);
            
            // Get the sender's username from the authentication, if available
            String sender = null;
            if (headerAccessor.getUser() != null) {
                sender = headerAccessor.getUser().getName();
                log.info("Authenticated sender: {}", sender);
            }
            
            // Set message metadata
            String channelId = chatMessage.getChannelId();
            chatMessage.setTimestamp(System.currentTimeMillis());
            chatMessage.setType(ChatMessage.MessageType.CHAT);
            
            // Store message in the database if the sender is authenticated
            if (sender != null && !sender.isEmpty()) {
                Optional<Object> senderOpt = userRepository.findByUsername(sender);
                if (senderOpt.isPresent()) {
                    UserModel senderUser = (UserModel) senderOpt.get();
                    try {
                        // Store message in database
                        MessageModel dbMessage = communityService.addMessage(
                                Long.parseLong(channelId),
                                senderUser.getId(),
                                chatMessage.getContent()
                        );
                        
                        // Add more user details to the outgoing message
                        chatMessage.setSender(senderUser.getUsername());
                    } catch (Exception e) {
                        log.error("Error storing message in database", e);
                        // Continue to broadcast even if storing fails
                    }
                }
            }
            
            // Process outgoing message (encrypt if enabled)
            String processedMessage = securityService.processOutgoingMessage(chatMessage);
            
            // Broadcast the message to subscribers
            log.info("Broadcasting message to channel {}: {}", channelId, chatMessage.getContent());
            
            // Send the processed message 
            messagingTemplate.convertAndSend("/topic/chat/" + channelId, processedMessage);
            
            // Also send a debug message to console with message details
            log.info("Message sent: channelId={}, sender={}, content={}, type={}", 
                channelId, chatMessage.getSender(), chatMessage.getContent(), chatMessage.getType());
        } catch (Exception e) {
            log.error("Error processing chat message", e);
            try {
                // Send error message to sender
                messagingTemplate.convertAndSendToUser(
                    headerAccessor.getUser().getName(),
                    "/queue/errors",
                    securityService.handleException(e)
                );
            } catch (Exception ex) {
                log.error("Error sending error message", ex);
            }
        }
    }
} 