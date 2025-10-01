package com.project.trading_platform_backend.controller;

import com.project.trading_platform_backend.service.ChatbotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "*")
public class ChatbotController {

    @Autowired
    private ChatbotService chatbotService;

    @PostMapping
    public ResponseEntity<ChatResponse> getChatbotResponse(@RequestBody ChatRequest request) {
        try {
            String response = chatbotService.generateResponse(request.getMessage());
            if (response == null || response.trim().isEmpty()) {
                response = "⚠️ Sorry, I couldn't answer that. Please contact support.";
            }
            return ResponseEntity.ok(new ChatResponse(response));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new ChatResponse("⚠️ Internal error. Please try again later."));
        }
    }

    public static class ChatRequest {
        private String message;
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class ChatResponse {
        private String reply;
        public ChatResponse(String reply) { this.reply = reply; }
        public String getReply() { return reply; }
    }
}
