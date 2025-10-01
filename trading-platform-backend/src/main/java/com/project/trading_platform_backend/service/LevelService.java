package com.project.trading_platform_backend.service;

import com.project.trading_platform_backend.model.LevelModel;
import com.project.trading_platform_backend.repository.LevelRepository;
import org.springframework.stereotype.Service;

/**
 * Service for user level management
 */
@Service
public class LevelService {

    private final LevelRepository levelRepository;

    public LevelService(LevelRepository levelRepository) {
        this.levelRepository = levelRepository;
    }

    /**
     * Get user level
     * @param userId User ID
     * @return LevelModel for the user
     */
    public LevelModel getUserLevel(Long userId) {
        return levelRepository.findById(userId)
                .orElseGet(() -> {
                    // Create default level for user if not found
                    LevelModel level = new LevelModel();
                    level.setUserId(userId);
                    level.setLevel(1);
                    level.setXp(0);
                    return levelRepository.save(level);
                });
    }

    /**
     * Add experience points to user
     * @param userId User ID
     * @param xp XP to add
     * @return Updated level model
     */
    public LevelModel addXp(Long userId, int xp) {
        LevelModel level = getUserLevel(userId);
        level.setXp(level.getXp() + xp);
        
        // Check if level up is needed
        checkLevelUp(level);
        
        return levelRepository.save(level);
    }
    
    /**
     * Check and update level based on XP
     * @param level Level model to check
     */
    private void checkLevelUp(LevelModel level) {
        int currentLevel = level.getLevel();
        int currentXp = level.getXp();
        
        // Simple algorithm: Each level requires level*1000 XP
        int requiredXp = currentLevel * 1000;
        
        if (currentXp >= requiredXp) {
            level.setLevel(currentLevel + 1);
            level.setXp(currentXp - requiredXp);
            
            // Check if multiple level ups
            checkLevelUp(level);
        }
    }
} 