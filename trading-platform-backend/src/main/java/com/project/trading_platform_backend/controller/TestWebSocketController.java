package com.project.trading_platform_backend.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Test controller for WebSocket functionality
 * For demonstration and testing purposes only
 */
@Controller
public class TestWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    public TestWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Echo a message back to the sender
     */
    @MessageMapping("/test/echo")
    @SendTo("/topic/test/echo")
    public Map<String, Object> echoMessage(Map<String, Object> message) {
        Map<String, Object> response = new HashMap<>(message);
        response.put("timestamp", System.currentTimeMillis());
        response.put("echo", true);
        return response;
    }

    /**
     * REST endpoint to send a test message to a specific topic
     */
    @RestController
    @RequestMapping("/api/test/websocket")
    public static class TestWebSocketRestController {
        
        private final SimpMessagingTemplate messagingTemplate;
        
        public TestWebSocketRestController(SimpMessagingTemplate messagingTemplate) {
            this.messagingTemplate = messagingTemplate;
        }
        
        @PostMapping("/send")
        public Map<String, Object> sendMessage(@RequestBody Map<String, Object> message) {
            String destination = (String) message.getOrDefault("destination", "/topic/test");
            
            Map<String, Object> payload = new HashMap<>(message);
            payload.put("timestamp", System.currentTimeMillis());
            payload.put("server", true);
            
            messagingTemplate.convertAndSend(destination, payload);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("destination", destination);
            response.put("timestamp", System.currentTimeMillis());
            return response;
        }
        
        @PostMapping("/send-to-user")
        public Map<String, Object> sendToUser(
                @RequestParam String username,
                @RequestBody Map<String, Object> message) {
            
            String destination = (String) message.getOrDefault("destination", "/queue/messages");
            
            Map<String, Object> payload = new HashMap<>(message);
            payload.put("timestamp", System.currentTimeMillis());
            payload.put("server", true);
            
            messagingTemplate.convertAndSendToUser(username, destination, payload);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("sentTo", username);
            response.put("destination", destination);
            response.put("timestamp", System.currentTimeMillis());
            return response;
        }
    }
} 