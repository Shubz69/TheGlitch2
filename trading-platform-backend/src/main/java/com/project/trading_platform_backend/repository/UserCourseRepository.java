package com.project.trading_platform_backend.repository;

import com.project.trading_platform_backend.model.UserCourseModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for user course relationships
 */
@Repository
public interface UserCourseRepository extends JpaRepository<UserCourseModel, Long> {
    
    /**
     * Find a user course relationship by user ID and course ID
     * @param userId User ID
     * @param courseId Course ID
     * @return Optional containing the relationship if found
     */
    Optional<UserCourseModel> findByUserIdAndCourseId(Long userId, Long courseId);
    
    /**
     * Check if a user has purchased a course
     * @param userId User ID
     * @param courseId Course ID
     * @return true if the user has purchased the course
     */
    boolean existsByUserIdAndCourseId(Long userId, Long courseId);
} 