package com.project.trading_platform_backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ChatMessage model for WebSocket communication
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    /**
     * Message content
     */
    private String content;

    /**
     * Username of the sender
     */
    private String sender;

    /**
     * ID of the channel this message belongs to
     */
    private String channelId;

    /**
     * Timestamp of when the message was sent
     */
    private Long timestamp;

    /**
     * Type of message (e.g., CHAT, JOIN, LEAVE)
     */
    private MessageType type;

    /**
     * Enum for message types
     */
    public enum MessageType {
        CHAT,
        JOIN,
        LEAVE
    }

    // Getters and setters
    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getChannelId() {
        return channelId;
    }

    public void setChannelId(String channelId) {
        this.channelId = channelId;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }

    public MessageType getType() {
        return type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }
} 