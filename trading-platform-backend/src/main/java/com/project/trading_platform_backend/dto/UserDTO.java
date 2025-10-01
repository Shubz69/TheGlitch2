// ✅ UserDTO.java — clean DTO for frontend-safe UserModel
package com.project.trading_platform_backend.dto;

import com.project.trading_platform_backend.model.UserModel;

public class UserDTO {
    private Long id;
    private String email;
    private String role;
    private boolean online;
    private String name;
    private String username;
    private int level;
    private int xp;

    public UserDTO() {
        // For deserialization
    }

    public UserDTO(UserModel user, int level, int xp) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.online = user.isOnline();
        this.name = user.getName();
        this.username = user.getUsername();
        this.level = level;
        this.xp = xp;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isOnline() { return online; }
    public void setOnline(boolean online) { this.online = online; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }

    public int getXp() { return xp; }
    public void setXp(int xp) { this.xp = xp; }
}