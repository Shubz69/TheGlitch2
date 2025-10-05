package com.project.trading_platform_backend.repository;

import com.project.trading_platform_backend.model.ChannelModel;
import com.project.trading_platform_backend.model.UserModel;
import com.project.trading_platform_backend.model.UserChannelAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserChannelAccessRepository extends JpaRepository<UserChannelAccess, Long> {
    boolean existsByUserAndChannel(UserModel user, ChannelModel channel);
}
