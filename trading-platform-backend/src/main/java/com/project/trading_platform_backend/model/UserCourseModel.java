package com.project.trading_platform_backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Model representing a user's purchase of a course
 */
@Entity
@Table(name = "user_courses")
@NoArgsConstructor
@AllArgsConstructor
@IdClass(UserCourseModel.UserCourseId.class)
public class UserCourseModel {
    
    /**
     * Composite primary key class
     */
    public static class UserCourseId implements Serializable {
        private Long userId;
        private Long courseId;
        
        public UserCourseId() {}
        
        public UserCourseId(Long userId, Long courseId) {
            this.userId = userId;
            this.courseId = courseId;
        }
        
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            UserCourseId that = (UserCourseId) o;
            return Objects.equals(userId, that.userId) && 
                   Objects.equals(courseId, that.courseId);
        }
        
        @Override
        public int hashCode() {
            return Objects.hash(userId, courseId);
        }
    }
    
    @Id
    @Column(name = "user_id")
    private Long userId;
    
    @Id
    @Column(name = "course_id")
    private Long courseId;
    
    @Column(name = "purchase_date")
    private LocalDateTime purchaseDate;
    
    @Column(name = "completion_status")
    private Integer completionStatus;
    
    @Column(name = "last_accessed")
    private LocalDateTime lastAccessed;
    
    // Constructor for quick creation
    public UserCourseModel(Long userId, Long courseId) {
        this.userId = userId;
        this.courseId = courseId;
        this.purchaseDate = LocalDateTime.now();
        this.completionStatus = 0;
    }
    
    // Getters and setters
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public Long getCourseId() {
        return courseId;
    }
    
    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }
    
    public LocalDateTime getPurchaseDate() {
        return purchaseDate;
    }
    
    public void setPurchaseDate(LocalDateTime purchaseDate) {
        this.purchaseDate = purchaseDate;
    }
    
    public Integer getCompletionStatus() {
        return completionStatus;
    }
    
    public void setCompletionStatus(Integer completionStatus) {
        this.completionStatus = completionStatus;
    }
    
    public LocalDateTime getLastAccessed() {
        return lastAccessed;
    }
    
    public void setLastAccessed(LocalDateTime lastAccessed) {
        this.lastAccessed = lastAccessed;
    }
} 