package com.project.trading_platform_backend.repository;

import com.project.trading_platform_backend.model.FreeChannelModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FreeChannelRepository extends JpaRepository<FreeChannelModel, Long> {
    List<FreeChannelModel> findByHiddenFalse();
}
