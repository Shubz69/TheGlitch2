// ✅ FIXED: CourseController.java
package com.project.trading_platform_backend.controller;

import com.project.trading_platform_backend.model.CourseModel;
import com.project.trading_platform_backend.service.CourseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;
    private static final Logger logger = LoggerFactory.getLogger(CourseController.class);

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    // 🔹 Get all courses — accessible to everyone (for pricing + display)
    @GetMapping
    public ResponseEntity<List<CourseModel>> getAllCourses() {
        logger.info("Fetching all courses");
        List<CourseModel> courses = courseService.getAllCourses();
        return ResponseEntity.ok(courses);
    }

    // 🔹 Create a course — Admin only
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCourse(@RequestBody CourseModel course) {
        try {
            CourseModel savedCourse = courseService.saveCourse(course);
            logger.info("✅ Course created: {} [ID: {}]", savedCourse.getName(), savedCourse.getId());
            return ResponseEntity.ok(savedCourse);
        } catch (RuntimeException e) {
            logger.error("❌ Error creating course '{}': {}", course.getName(), e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 🔹 Delete course by ID — Admin only
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        logger.info("Attempting to delete course with id: {}", id);
        boolean deleted = courseService.deleteCourse(id);
        if (deleted) {
            logger.info("🗑️ Course with id {} deleted", id);
            return ResponseEntity.ok("Course deleted successfully");
        } else {
            logger.warn("⚠️ Course with id {} not found", id);
            return ResponseEntity.status(404).body("Course not found");
        }
    }

    @GetMapping("/load-test-courses")
    public ResponseEntity<?> loadTestCourses() {
        // Create and save test courses
        CourseModel course1 = new CourseModel();
        course1.setCourseId("1");
        course1.setName("Introduction to Trading");
        course1.setDescription("Learn the basics of trading markets effectively.");
        course1.setPrice(new BigDecimal("99.00"));
        
        CourseModel course2 = new CourseModel();
        course2.setCourseId("2");
        course2.setName("Technical Analysis");
        course2.setDescription("Master chart patterns and market indicators.");
        course2.setPrice(new BigDecimal("99.00"));
        
        CourseModel course3 = new CourseModel();
        course3.setCourseId("3");
        course3.setName("Risk Management");
        course3.setDescription("Essential strategies to protect your capital.");
        course3.setPrice(new BigDecimal("99.00"));
        
        // Save all courses
        courseService.saveCourse(course1);
        courseService.saveCourse(course2);
        courseService.saveCourse(course3);
        
        return ResponseEntity.ok("Test courses loaded successfully. You can now test payments with course IDs 1, 2, or 3.");
    }
}
