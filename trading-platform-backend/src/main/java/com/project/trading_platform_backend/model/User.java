package com.project.trading_platform_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * Separate User class that implements UserDetails for security integration
 * This is NOT an entity - it wraps UserModel
 */
// Removed @Entity and @Table - this is not an entity
public class User implements UserDetails {

    private Long id;
    private String email;
    private String password;
    private String username;
    private String role;
    private String name;
    private String address;
    private String phone;
    private String avatar;
    private String bio;
    private boolean muted;
    private boolean mfaVerified;
    private String mfaCode;
    private boolean agreedToRules;
    private LocalDateTime lastSeen;
    private Set<CourseModel> courses = new HashSet<>();

    public User() {
    }

    /**
     * Create a User from a UserModel
     */
    public User(UserModel userModel) {
        this.id = userModel.getId();
        this.email = userModel.getEmail();
        this.password = userModel.getPassword();
        this.username = userModel.getUsername();
        this.role = userModel.getRole();
        this.name = userModel.getName();
        this.address = userModel.getAddress();
        this.phone = userModel.getPhone();
        this.avatar = userModel.getAvatar();
        this.bio = userModel.getBio();
        this.muted = userModel.isMuted();
        this.mfaVerified = userModel.isMfaVerified();
        this.mfaCode = userModel.getMfaCode();
        this.agreedToRules = userModel.isAgreedToRules();
        this.lastSeen = userModel.getLastSeen();
        this.courses = userModel.getCourses();
    }

    public boolean isAdmin() {
        return role != null && role.equalsIgnoreCase("ADMIN");
    }

    public boolean isPremium() {
        return role != null && role.equalsIgnoreCase("PREMIUM");
    }

    public boolean isOnline() {
        return lastSeen != null && lastSeen.isAfter(LocalDateTime.now().minusMinutes(2));
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getUsername() { return username; }
    public String getRole() { return role; }
    public String getName() { return name; }
    public String getAddress() { return address; }
    public String getPhone() { return phone; }
    public String getAvatar() { return avatar; }
    public String getBio() { return bio; }
    public String getMfaCode() { return mfaCode; }
    public boolean isMuted() { return muted; }
    public boolean isMfaVerified() { return mfaVerified; }
    public boolean isAgreedToRules() { return agreedToRules; }
    public LocalDateTime getLastSeen() { return lastSeen; }
    public Set<CourseModel> getCourses() { return courses; }

    public void setId(Long id) { this.id = id; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setUsername(String username) { this.username = username; }
    public void setRole(String role) { this.role = role; }
    public void setName(String name) { this.name = name; }
    public void setAddress(String address) { this.address = address; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public void setBio(String bio) { this.bio = bio; }
    public void setMuted(boolean muted) { this.muted = muted; }
    public void setMfaCode(String mfaCode) { this.mfaCode = mfaCode; }
    public void setMfaVerified(boolean mfaVerified) { this.mfaVerified = mfaVerified; }
    public void setAgreedToRules(boolean agreedToRules) { this.agreedToRules = agreedToRules; }
    public void setLastSeen(LocalDateTime lastSeen) { this.lastSeen = lastSeen; }
    public void setCourses(Set<CourseModel> courses) { this.courses = courses; }

    public Boolean getMuted() { return muted; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + getRole()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
} 