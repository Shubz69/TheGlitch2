package com.project.trading_platform_backend.dto;

import java.time.LocalDateTime;

public class MessageResponseDTO {

    private Long id;
    private String content;
    private String senderUsername;
    private String senderAvatar;
    private int senderLevel;
    private LocalDateTime timestamp;
    private Long channelId;
    private Long senderId;
    private String senderName;
    private String role;

    public MessageResponseDTO() {}

    public MessageResponseDTO(Long id, String content, String senderUsername, String senderAvatar, int senderLevel, LocalDateTime timestamp, Long channelId) {
        this.id = id;
        this.content = content;
        this.senderUsername = senderUsername;
        this.senderAvatar = senderAvatar;
        this.senderLevel = senderLevel;
        this.timestamp = timestamp;
        this.channelId = channelId;
    }

    public Long getId() { return id; }
    public String getContent() { return content; }
    public String getSenderUsername() { return senderUsername; }
    public String getSenderAvatar() { return senderAvatar; }
    public int getSenderLevel() { return senderLevel; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public Long getChannelId() { return channelId; }
    public Long getSenderId() { return senderId; }
    public String getSenderName() { return senderName; }
    public String getRole() { return role; }

    public void setId(Long id) { this.id = id; }
    public void setContent(String content) { this.content = content; }
    public void setSenderUsername(String senderUsername) { this.senderUsername = senderUsername; }
    public void setSenderAvatar(String senderAvatar) { this.senderAvatar = senderAvatar; }
    public void setSenderLevel(int senderLevel) { this.senderLevel = senderLevel; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public void setChannelId(Long channelId) { this.channelId = channelId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    public void setRole(String role) { this.role = role; }
}
