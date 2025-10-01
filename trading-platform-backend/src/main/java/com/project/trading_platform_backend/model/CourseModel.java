// ✅ FIXED: CourseModel.java
package com.project.trading_platform_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Entity
@Table(name = "courses")
public class CourseModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String courseId;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal price;

    // ✅ Fix lazy proxy issues by fetching eagerly if needed for user match
    @JsonIgnore
    @ManyToMany(mappedBy = "courses", fetch = FetchType.LAZY)
    private Set<UserModel> users = new HashSet<>();

    public CourseModel() {}

    public CourseModel(String courseId, String name, String description, BigDecimal price) {
        this.courseId = courseId;
        this.name = name;
        this.description = description;
        this.price = price;
    }

    public Long getId() { return id; }

    public String getCourseId() { return courseId != null ? courseId.trim() : ""; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getName() { return name != null ? name.trim() : ""; }
    public String getTitle() { return getName(); }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description != null ? description.trim() : ""; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getPrice() { return price != null ? price : BigDecimal.ZERO; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public Set<UserModel> getUsers() { return users; }
    public void setUsers(Set<UserModel> users) { this.users = users; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof CourseModel that)) return false;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "CourseModel{" +
                "id=" + id +
                ", courseId='" + courseId + '\'' +
                ", name='" + name + '\'' +
                ", price=" + price +
                '}';
    }
}