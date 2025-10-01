package com.project.trading_platform_backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String content;

    @ManyToOne
    @JoinColumn(name = "sender_id")
    private UserModel sender;

    @ManyToOne
    @JoinColumn(name = "channel_id")
    private ChannelModel channel;

    private LocalDateTime timestamp;
    
    private boolean encrypted = false;

    // Getters
    public Long getId() { return id; }
    public UserModel getSender() { return sender; }
    public ChannelModel getChannel() { return channel; }
    public String getContent() { return content; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public boolean isEncrypted() { return encrypted; }

    // Setters
    public void setSender(UserModel sender) { this.sender = sender; }
    public void setChannel(ChannelModel channel) { this.channel = channel; }
    public void setContent(String content) { this.content = content; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public void setEncrypted(boolean encrypted) { this.encrypted = encrypted; }
}
