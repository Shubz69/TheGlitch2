package com.project.trading_platform_backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "channels")
public class FreeChannelModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String type;

    private Integer min_level;

    @Column(name = "course_id")
    private String courseId;

    @Column(name = "access_level")
    private String accessLevel;

    private boolean hidden;

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getType() { return type; }
    public Integer getMinLevel() { return min_level; }
    public String getCourseId() { return courseId; }
    public String getAccessLevel() {
        return accessLevel != null ? accessLevel.trim().toLowerCase() : "";
    }
    public boolean isHidden() { return hidden; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setType(String type) { this.type = type; }
    public void setMinLevel(Integer min_level) { this.min_level = min_level; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
    public void setAccessLevel(String accessLevel) { this.accessLevel = accessLevel; }
    public void setHidden(boolean hidden) { this.hidden = hidden; }
}
