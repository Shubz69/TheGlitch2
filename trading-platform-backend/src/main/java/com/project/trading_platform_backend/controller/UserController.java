package com.project.trading_platform_backend.controller;

import com.project.trading_platform_backend.dto.UserDTO;
import com.project.trading_platform_backend.model.CourseModel;
import com.project.trading_platform_backend.model.LevelModel;
import com.project.trading_platform_backend.model.UserModel;
import com.project.trading_platform_backend.repository.LevelRepository;
import com.project.trading_platform_backend.repository.UserRepository;
import com.project.trading_platform_backend.repository.CourseRepository;
import com.project.trading_platform_backend.service.UserService;
import com.project.trading_platform_backend.service.LevelService;
import com.project.trading_platform_backend.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final LevelRepository levelRepository;
    private final JwtUtil jwtUtil;
    private final LevelService levelService;

    public UserController(
            UserService userService,
            UserRepository userRepository,
            CourseRepository courseRepository,
            LevelRepository levelRepository,
            JwtUtil jwtUtil,
            LevelService levelService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.levelRepository = levelRepository;
        this.jwtUtil = jwtUtil;
        this.levelService = levelService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserModel> users = userRepository.findAll();

        List<UserDTO> dtos = users.stream()
                .map(u -> {
                    updateUserRole(u);
                    int level = userService.getUserLevel(u.getId());
                    int xp = levelRepository.findById(u.getId())
                            .map(LevelModel::getXp)
                            .orElse(0);
                    return new UserDTO(u, level, xp);
                })
                .toList();

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Object> getUserById(@PathVariable("id") Long id) {
        Optional<UserModel> userOpt = userService.getUserById(id);
        return userOpt.<ResponseEntity<Object>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body("User not found"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getOwnProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("message", "No valid token provided"));
            }
            
            String token = authHeader.substring(7);
            Long userId = jwtUtil.extractUserId(token);
            
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Invalid token"));
            }

            Optional<UserModel> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }

            UserModel user = userOpt.get();
            updateUserRole(user);

            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId());
            profile.put("username", user.getUsername());
            profile.put("email", user.getEmail());
            profile.put("name", user.getName());
            profile.put("avatar", user.getAvatar());
            profile.put("phone", user.getPhone());
            profile.put("address", user.getAddress());
            profile.put("role", user.getRole());
            profile.put("bio", user.getBio());

            int level = userService.getUserLevel(userId);
            profile.put("level", level);
            profile.put("xp", levelRepository.findById(userId).map(LevelModel::getXp).orElse(0));

            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error retrieving profile: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable("id") Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.status(404).body("User not found");
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    @GetMapping("/active-users")
    public ResponseEntity<List<UserModel>> getActiveUsers() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(5);
        List<UserModel> active = userRepository.findAll().stream()
                .filter(u -> u.getLastSeen() != null && u.getLastSeen().isAfter(cutoff))
                .toList();
        return ResponseEntity.ok(active);
    }

    @GetMapping("/my-courses")
    public ResponseEntity<?> getUserCourses(@RequestParam("userId") Long userId) {
        UserModel user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("courses", new ArrayList<>(user.getCourses()));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/assign-course")
    public ResponseEntity<?> assignCourse(@RequestParam Long userId, @RequestParam Long courseId) {
        Optional<UserModel> userOpt = userRepository.findById(userId);
        Optional<CourseModel> courseOpt = courseRepository.findById(courseId);

        if (userOpt.isEmpty() || courseOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User or Course not found");
        }

        UserModel user = userOpt.get();
        CourseModel course = courseOpt.get();

        user.getCourses().add(course);
        updateUserRole(user);
        userRepository.save(user);

        return ResponseEntity.ok("Course assigned successfully to user");
    }

    @PostMapping("/upload-avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam Long userId, @RequestParam MultipartFile file) throws IOException {
        if (!file.getContentType().equals("image/png")) {
            return ResponseEntity.badRequest().body("Invalid file type. Please upload a PNG image.");
        }
        String filename = "avatar_" + userId + ".png";
        Path path = Paths.get("src/main/resources/static/styles/images/" + filename);
        Files.write(path, file.getBytes());

        UserModel user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            user.setAvatar(filename);
            userRepository.save(user);
        }
        return ResponseEntity.ok("Avatar updated.");
    }

    @GetMapping("/public-profile/{id}")
    public ResponseEntity<?> getPublicProfile(@PathVariable Long id) {
        Optional<UserModel> userOpt = userService.getUserById(id);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body("User not found");

        UserModel user = userOpt.get();
        Map<String, Object> profile = new HashMap<>();
        profile.put("username", user.getName());
        profile.put("avatar", user.getAvatar());
        profile.put("level", 1);
        profile.put("xp", 0);
        profile.put("bio", user.getBio());

        return ResponseEntity.ok(profile);
    }

    @PutMapping("/{id}/update")
    public ResponseEntity<?> updateUserFields(@PathVariable("id") Long id, @RequestBody Map<String, String> updates) {
        Optional<UserModel> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
        UserModel user = userOpt.get();

        updates.forEach((key, value) -> {
            if (value == null || value.trim().isEmpty()) return;
            switch (key) {
                case "username" -> user.setUsername(value);
                case "email" -> user.setEmail(value);
                case "phone" -> user.setPhone(value);
                case "address" -> user.setAddress(value);
                case "name" -> user.setName(value);
                case "avatar" -> user.setAvatar(value);
                case "bio" -> user.setBio(value);
                default -> System.out.println("Unknown field: " + key);
            }
        });

        try {
            UserModel saved = userRepository.save(user);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Update failed: " + e.getMessage());
        }
    }

    @GetMapping("/{userId}/purchased-courses")
    public ResponseEntity<List<CourseModel>> getPurchasedCourses(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {

        Long extractedId = extractUserId(authHeader);
        if (!userId.equals(extractedId)) {
            return ResponseEntity.status(403).body(null);
        }

        Optional<UserModel> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        UserModel user = userOpt.get();
        updateUserRole(user);
        return ResponseEntity.ok(new ArrayList<>(user.getCourses()));
    }

    @GetMapping("/{userId}/level")
    public ResponseEntity<?> getUserLevel(@PathVariable Long userId, @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract user from token
            String token = authHeader.replace("Bearer ", "");
            Long authUserId = jwtUtil.extractUserId(token);
            
            if (authUserId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid authentication token");
            }
            
            // Only allow users to access their own level or admins to access any level
            UserModel authUser = userService.findById(authUserId)
                    .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
                    
            if (!authUserId.equals(userId) && !authUser.getRole().equalsIgnoreCase("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You can only access your own level information");
            }
            
            // Get user level
            LevelModel level = levelService.getUserLevel(userId);
            if (level == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User level not found");
            }
            
            return ResponseEntity.ok(level);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving user level: " + e.getMessage());
        }
    }

    private void updateUserRole(UserModel user) {
        if (user.getRole().equals("ADMIN")) return;
        if (user.getCourses() != null && !user.getCourses().isEmpty()) {
            user.setRole("PREMIUM");
        } else {
            user.setRole("FREE");
        }
        userRepository.save(user);
    }

    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try {
            String token = authHeader.substring(7);
            String secret = "jNyUxUOuSPUa3YwjXkFeuV1kjpSz6kxC/MxAs91Mmlk=";

            io.jsonwebtoken.Claims claims = io.jsonwebtoken.Jwts.parser()
                    .setSigningKey(secret.getBytes())
                    .parseClaimsJws(token)
                    .getBody();

            String email = claims.getSubject();
            Optional<UserModel> userOpt = userRepository.findByEmail(email);
            return userOpt.map(UserModel::getId).orElse(null);
        } catch (Exception e) {
            System.out.println("Failed to extract ID from token: " + e.getMessage());
            return null;
        }
    }
}
