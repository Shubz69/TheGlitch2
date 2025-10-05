package com.project.trading_platform_backend.controller;

import com.project.trading_platform_backend.dto.MessageRequest;
import com.project.trading_platform_backend.dto.MessageResponseDTO;
import com.project.trading_platform_backend.model.ChannelModel;
import com.project.trading_platform_backend.model.UserModel;
import com.project.trading_platform_backend.service.ChannelService;
import com.project.trading_platform_backend.service.MessageService;
import com.project.trading_platform_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
public class MessageSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    private final ChannelService channelService;
    private final UserService userService;

    @Autowired
    public MessageSocketController(SimpMessagingTemplate messagingTemplate,
                                 MessageService messageService,
                                 ChannelService channelService,
                                 UserService userService) {
        this.messagingTemplate = messagingTemplate;
        this.messageService = messageService;
        this.channelService = channelService;
        this.userService = userService;
    }

    @MessageMapping("/chat/{channelId}")
    public void send(@DestinationVariable String channelId, MessageRequest messageRequest) {
        try {
            // Get the authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                System.err.println("User not authenticated for message in channel: " + channelId);
                return;
            }

            String username = authentication.getName();
            UserModel user = userService.findByUsername(username);
            if (user == null) {
                System.err.println("User not found: " + username);
                return;
            }

            // Get the channel
            ChannelModel channel = channelService.getChannelById(Long.parseLong(channelId));
            if (channel == null) {
                System.err.println("Channel not found: " + channelId);
                return;
            }

            // Send the message through the service (this will save it to the database)
            MessageResponseDTO savedMessage = messageService.sendMessage(user, channel, messageRequest.getContent());
            
            // Broadcast the saved message to all subscribers of the channel
            messagingTemplate.convertAndSend("/topic/chat/" + channelId, savedMessage);
            
            System.out.println("Message saved and broadcasted to channel: " + channelId + " → " + savedMessage.getContent());
            
        } catch (Exception e) {
            System.err.println("Error processing message in channel " + channelId + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    @MessageMapping("/message/{channelId}")
    public void sendLegacy(@DestinationVariable String channelId, MessageResponseDTO message) {
        // Legacy method for backward compatibility
        System.out.println("Legacy message endpoint called for channel: " + channelId);
        messagingTemplate.convertAndSend("/topic/chat/" + channelId, message);
    }
}
