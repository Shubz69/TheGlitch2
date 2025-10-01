package com.project.trading_platform_backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for message responses
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    private Long id;
    private Long channelId;
    private Long senderId;
    private String senderUsername;
    private int senderLevel;
    private String content;
    private LocalDateTime timestamp;
    private boolean encrypted;
    private Long replyToId;
    private String replyToUsername;

    /**
     * Create message from model
     * @param model MessageModel
     * @param senderLevel User level
     */
    public Message(MessageModel model, int senderLevel) {
        this.id = model.getId();
        this.channelId = model.getChannel() != null ? model.getChannel().getId() : null;
        this.senderId = model.getSender() != null ? model.getSender().getId() : null;
        this.senderUsername = model.getSender() != null ? model.getSender().getUsername() : "Unknown";

        this.senderLevel = senderLevel;
        this.content = model.getContent();
        this.timestamp = model.getTimestamp();
        this.encrypted = model.isEncrypted();
    }
} 