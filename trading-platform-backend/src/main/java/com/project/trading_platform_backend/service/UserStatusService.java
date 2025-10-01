package com.project.trading_platform_backend.service;

import com.project.trading_platform_backend.model.UserModel;
import com.project.trading_platform_backend.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class UserStatusService {

    private final UserRepository userRepository;

    public UserStatusService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Called every 1 minute to simulate activity
    public void updateLastSeen(UserModel user) {
        user.setLastSeen(LocalDateTime.now());
        userRepository.save(user);
    }

    // Called every 10 min to simulate inactivity/cleanup (optional)
    @Scheduled(fixedRate = 600_000)
    public void cleanupOldSessions() {
        // Future: implement session expiry
    }
}
