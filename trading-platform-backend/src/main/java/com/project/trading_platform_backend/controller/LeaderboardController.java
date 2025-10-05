package com.project.trading_platform_backend.controller;

import com.project.trading_platform_backend.model.LevelModel;
import com.project.trading_platform_backend.model.UserModel;
import com.project.trading_platform_backend.repository.LevelRepository;
import com.project.trading_platform_backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LevelRepository levelRepository;
    private final UserRepository userRepository;

    public LeaderboardController(LevelRepository levelRepository, UserRepository userRepository) {
        this.levelRepository = levelRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getTopUsers() {
        List<LevelModel> levels = levelRepository.findAll();

        if (levels.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<Map<String, Object>> top = levels.stream()
                .sorted(Comparator.comparingInt(LevelModel::getLevel).reversed())
                .limit(10)
                .map(level -> {
                    UserModel user = userRepository.findById(level.getUserId()).orElse(null);
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("id", user != null ? user.getId() : level.getUserId()); // 🔐 for route
                    entry.put("name", user != null ? user.getName() : "User");
                    entry.put("username", user != null ? user.getUsername() : "unknown");
                    entry.put("level", level.getLevel());
                    entry.put("xp", level.getXp());
                    return entry;
                }).toList();

        return ResponseEntity.ok(top);
    }

}

