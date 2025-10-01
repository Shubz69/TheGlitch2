package com.project.trading_platform_backend.model;

import jakarta.persistence.*;

/**
 * Message Channel entity for chat messaging
 */
@Entity
@Table(name = "message_channels")
public class MessageChannel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;
    
    @Column(name = "is_private")
    private boolean isPrivate = false;

    public MessageChannel() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isPrivate() { return isPrivate; }
    public void setIsPrivate(boolean isPrivate) { this.isPrivate = isPrivate; }
} 