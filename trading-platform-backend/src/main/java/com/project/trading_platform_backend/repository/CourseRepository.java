package com.project.trading_platform_backend.repository;

import com.project.trading_platform_backend.model.CourseModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<CourseModel, Long> {
    Optional<CourseModel> findByName(String name);

    Optional<CourseModel> findByCourseId(String courseId);
}
