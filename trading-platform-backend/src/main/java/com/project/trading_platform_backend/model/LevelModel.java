package com.project.trading_platform_backend.model;

import jakarta.persistence.*;

@Entity
public class LevelModel {

    @Id
    private Long userId;

    private int level = 1;
    private int xp = 0;

    public LevelModel() {}

    public LevelModel(Long userId, int level, int xp) {
        this.userId = userId;
        this.level = level;
        this.xp = xp;
    }

    // Getters
    public Long getUserId() { return userId; }
    public int getLevel() { return level; }
    public int getXp() { return xp; }

    // Setters
    public void setUserId(Long userId) { this.userId = userId; }
    public void setLevel(int level) { this.level = level; }
    public void setXp(int xp) { this.xp = xp; }
}
