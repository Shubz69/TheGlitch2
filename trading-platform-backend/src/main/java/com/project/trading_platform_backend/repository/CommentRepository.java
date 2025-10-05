package com.project.trading_platform_backend.repository;

import com.project.trading_platform_backend.model.CommentModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<CommentModel, Long> {
    List<CommentModel> findByProfileUserIdOrderByTimestampDesc(Long userId);
}
