package com.project.trading_platform_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "channel_model")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ChannelModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private Integer minLevel;

    private String description;

    private String accessLevel;

    @Column(nullable = false)
    private String type = "ALL";

    private boolean systemChannel = false;

    private boolean hidden = false;

    @ManyToMany(mappedBy = "channels") // This should match the field name in UserModel
    @JsonIgnore
    private Set<UserModel> users = new HashSet<>();


    // Fixed the course relationship to ensure correct column type mapping
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", referencedColumnName = "id")
    private CourseModel course;

    public ChannelModel() {}

    public ChannelModel(String name, String accessLevel, boolean systemChannel, CourseModel course, Integer minLevel) {
        this.name = name;
        this.accessLevel = accessLevel;
        this.systemChannel = systemChannel;
        this.course = course;
        this.minLevel = minLevel;
        this.type = "ALL";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name != null ? name.trim() : ""; }
    public void setName(String name) { this.name = name; }

    public String getAccessLevel() { return accessLevel != null ? accessLevel.trim().toLowerCase() : "open"; }
    public void setAccessLevel(String accessLevel) { this.accessLevel = accessLevel; }

    public String getType() { return type != null ? type.trim().toUpperCase() : "ALL"; }
    public void setType(String type) { this.type = type; }

    public Integer getMinLevel() { return minLevel; }
    public void setMinLevel(Integer minLevel) { this.minLevel = minLevel; }

    public String getDescription() { return description != null ? description.trim() : ""; }
    public void setDescription(String description) { this.description = description; }

    public boolean isSystemChannel() { return systemChannel; }
    public void setSystemChannel(boolean systemChannel) { this.systemChannel = systemChannel; }

    public boolean isHidden() { return hidden; }
    public void setHidden(boolean hidden) { this.hidden = hidden; }

    public Set<UserModel> getUsers() { return users; }
    public void setUsers(Set<UserModel> users) { this.users = users; }

    public CourseModel getCourse() { return course; }
    public void setCourse(CourseModel course) { this.course = course; }

    /**
     * Helper method to get the course ID directly
     * @return the course ID or null if no course is associated
     */
    public Long getCourseId() {
        return course != null ? course.getId() : null;
    }

    @Override
    public String toString() {
        return "ChannelModel{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", accessLevel='" + getAccessLevel() + '\'' +
                ", systemChannel=" + systemChannel +
                ", hidden=" + hidden +
                ", minLevel=" + minLevel +
                ", type='" + getType() + '\'' +
                ", courseId=" + (course != null ? course.getId() : "none") +
                '}';
    }
}