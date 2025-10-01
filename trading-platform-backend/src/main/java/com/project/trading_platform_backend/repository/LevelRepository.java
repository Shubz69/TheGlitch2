package com.project.trading_platform_backend.repository;

import com.project.trading_platform_backend.model.LevelModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LevelRepository extends JpaRepository<LevelModel, Long> {
}
