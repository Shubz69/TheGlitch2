package com.project.trading_platform_backend.dto;

public class RegisterRequest {
    private String email;
    private String password;
    private String username;  // Added username field
    private String name;      // Added name field
    private String avatar;

    // Getters and Setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getUsername() {  // Added getter for username
        return username;
    }

    public void setUsername(String username) {  // Added setter for username
        this.username = username;
    }

    public String getName() {  // Added getter for name
        return name;
    }

    public void setName(String name) {  // Added setter for name
        this.name = name;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }
}
