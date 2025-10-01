package com.project.trading_platform_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class CommentModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long parentCommentId; // For replies
    private Long profileUserId;
    private String commenterName;
    private String message;
    private LocalDateTime timestamp;
    private int likes = 0;

    // Getters
    public Long getId() { return id; }
    public Long getParentCommentId() { return parentCommentId; }
    public Long getProfileUserId() { return profileUserId; }
    public String getCommenterName() { return commenterName; }
    public String getMessage() { return message; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public int getLikes() { return likes; }

    // Setters
    public void setParentCommentId(Long parentCommentId) { this.parentCommentId = parentCommentId; }
    public void setProfileUserId(Long profileUserId) { this.profileUserId = profileUserId; }
    public void setCommenterName(String commenterName) { this.commenterName = commenterName; }
    public void setMessage(String message) { this.message = message; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public void setLikes(int likes) { this.likes = likes; }
}
