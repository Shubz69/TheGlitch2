package com.project.trading_platform_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for message requests
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {
    
    private String content;
    private String senderName;
    private Long replyToId;

    // Explicit getter for content in case Lombok's @Data annotation is not working
    public String getContent() {
        return content;
    }
} 