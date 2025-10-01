// ✅ FIXED: AdminController.java with ID-safe course assignment
package com.project.trading_platform_backend.controller;

import com.project.trading_platform_backend.model.CourseModel;
import com.project.trading_platform_backend.model.LevelModel;
import com.project.trading_platform_backend.model.UserModel;
import com.project.trading_platform_backend.repository.LevelRepository;
import com.project.trading_platform_backend.repository.UserRepository;
import com.project.trading_platform_backend.repository.CourseRepository;
import com.project.trading_platform_backend.service.PresenceService;
import com.project.trading_platform_backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.Set;
import java.util.Map;
import java.util.HashMap;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final LevelRepository levelRepository;
    private final UserService userService;
    private final CourseRepository courseRepository;
    private final PresenceService presenceService;

    public AdminController(UserRepository userRepository, LevelRepository levelRepository,
                           UserService userService, CourseRepository courseRepository,
                           PresenceService presenceService) {
        this.userRepository = userRepository;
        this.levelRepository = levelRepository;
        this.userService = userService;
        this.courseRepository = courseRepository;
        this.presenceService = presenceService;
    }

    @PostMapping("/grant-xp")
    public ResponseEntity<?> grantXp(@RequestParam("userId") Long userId, @RequestParam("amount") int amount) {
        LevelModel level = levelRepository.findById(userId).orElse(new LevelModel(userId, 1, 0));
        level.setXp(level.getXp() + amount);

        while (level.getXp() >= level.getLevel() * 100 && level.getLevel() < 100) {
            level.setXp(level.getXp() - (level.getLevel() * 100));
            level.setLevel(level.getLevel() + 1);
        }

        levelRepository.save(level);
        return ResponseEntity.ok("XP granted. Current level: " + level.getLevel());
    }

    @PostMapping("/set-role")
    public ResponseEntity<?> setRole(@RequestParam("userId") Long userId, @RequestParam("role") String role) {
        boolean success = userService.updateUserRole(userId, role.toUpperCase());
        return success ? ResponseEntity.ok("Role updated to " + role)
                : ResponseEntity.badRequest().body("User not found");
    }

    @PostMapping("/mute")
    public ResponseEntity<?> muteUser(@RequestParam("userId") Long userId, @RequestParam("mute") boolean mute) {
        boolean success = userService.muteUser(userId, mute);
        return success ? ResponseEntity.ok("User " + (mute ? "muted" : "unmuted"))
                : ResponseEntity.badRequest().body("User not found");
    }

    @PostMapping("/assign-course")
    public ResponseEntity<?> assignCourse(@RequestParam("userId") Long userId, @RequestParam("courseId") Long courseId) {
        Optional<CourseModel> courseOpt = courseRepository.findById(courseId);
        Optional<UserModel> userOpt = userRepository.findById(userId);

        if (courseOpt.isEmpty()) return ResponseEntity.status(404).body("Course not found.");
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body("User not found.");

        CourseModel course = courseOpt.get();
        boolean success = userService.assignCourseToUser(userId, course);

        return success
                ? ResponseEntity.ok("User assigned to course " + course.getTitle() + " (ID: " + course.getId() + ")")
                : ResponseEntity.badRequest().body("Failed to assign course (user may already have it).");
    }

    @DeleteMapping("/messages/{id}")
    public ResponseEntity<?> deleteMessage(@PathVariable Long id) {
        boolean success = userService.deleteMessageAsAdmin(id);
        return success ? ResponseEntity.ok("Message deleted") : ResponseEntity.status(404).body("Not found or not allowed");
    }

    @GetMapping("/online-users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getOnlineUsers() {
        try {
            Set<Long> onlineUserIds = presenceService.getOnlineUsers();
            return ResponseEntity.ok(onlineUserIds);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to get online users: " + e.getMessage());
        }
    }
    
    @GetMapping("/user-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserStatus() {
        try {
            Map<String, Object> status = new HashMap<>();
            status.put("onlineCount", presenceService.getOnlineUsersCount());
            status.put("offlineCount", presenceService.getOfflineUsersCount());
            status.put("totalCount", (int) userRepository.count());
            status.put("onlineUsers", presenceService.getOnlineUsersWithDetails());
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to get user status: " + e.getMessage());
        }
    }
}