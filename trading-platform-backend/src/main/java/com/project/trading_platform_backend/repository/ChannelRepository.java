package com.project.trading_platform_backend.repository;

import com.project.trading_platform_backend.model.ChannelModel;
import com.project.trading_platform_backend.model.CourseModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChannelRepository extends JpaRepository<ChannelModel, Long> {

    Optional<ChannelModel> findByName(String name);

    Optional<ChannelModel> findByCourse(CourseModel course);

    List<ChannelModel> findByAccessLevel(String accessLevel);

    List<ChannelModel> findBySystemChannelTrue();

    List<ChannelModel> findByHiddenFalse();

    List<ChannelModel> findByCourse_Id(Long courseId);
}
