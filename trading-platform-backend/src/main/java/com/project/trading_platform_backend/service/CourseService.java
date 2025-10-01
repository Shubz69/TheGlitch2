package com.project.trading_platform_backend.service;

import com.project.trading_platform_backend.model.CourseModel;
import com.project.trading_platform_backend.repository.CourseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private static final Logger logger = LoggerFactory.getLogger(CourseService.class);

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    public List<CourseModel> getAllCourses() {
        logger.info("Retrieving all courses");
        return courseRepository.findAll();
    }

    public CourseModel saveCourse(CourseModel course) {
        logger.info("Saving course: {}", course.getName());
        if (courseRepository.findByName(course.getName()).isPresent()) {
            logger.error("Course with name {} already exists", course.getName());
            throw new RuntimeException("Course with this name already exists.");
        }
        return courseRepository.save(course);
    }

    public boolean deleteCourse(Long id) {
        logger.info("Deleting course with id: {}", id);
        Optional<CourseModel> course = courseRepository.findById(id);
        if (course.isPresent()) {
            courseRepository.deleteById(id);
            logger.info("Course with id {} deleted", id);
            return true;
        }
        logger.warn("Course with id {} not found", id);
        return false;
    }
}


