// ✅ FIXED: UserModel.java
package com.project.trading_platform_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class UserModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    @JsonIgnore
    private String password;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String role = "FREE";

    private String name;
    private String address;
    private String phone;
    private String avatar;
    private String bio;

    private boolean muted = false;
    private boolean mfaVerified = false;
    private String mfaCode;

    private boolean agreedToRules = false;

    @Column(name = "last_seen")
    private LocalDateTime lastSeen;

    // ✅ Ensures course access logic won't crash
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_courses",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    private Set<CourseModel> courses = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_channel_access",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "channel_id")
    )
    @JsonIgnore
    private Set<ChannelModel> channels = new HashSet<>();

    public UserModel() {}

    public UserModel(Long id, String email, String password, String role, String username, String name, String address, String phone, String avatar) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.role = role;
        this.username = username;
        this.name = name;
        this.address = address;
        this.phone = phone;
        this.avatar = avatar;
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

    /**
     * Alternative getter for muted status
     * @return true if user is muted
     */
    public Boolean getMuted() { return muted; }
}