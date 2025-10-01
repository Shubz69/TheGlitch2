package com.project.trading_platform_backend.controller;


import com.project.trading_platform_backend.dto.MessageRequest;
import com.project.trading_platform_backend.model.*;
import com.project.trading_platform_backend.repository.*;
import com.project.trading_platform_backend.security.JwtUtil;
import com.project.trading_platform_backend.service.*;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/community")
@CrossOrigin(origins = "*")
public class CommunityController {

    private final ChannelService channelService;
    private final MessageService messageService;
    private final UserRepository userRepository;
    private final ChannelRepository channelRepository;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final FreeChannelRepository freeChannelRepository;
    private final CourseService courseService;
    private final CommunityService communityService;

    public CommunityController(ChannelService channelService,
                               MessageService messageService,
                               UserRepository userRepository,
                               ChannelRepository channelRepository,
                               JwtUtil jwtUtil,
                               UserService userService,
                               FreeChannelRepository freeChannelRepository,
                               CourseService courseService,
                               CommunityService communityService) {
        this.channelService = channelService;
        this.messageService = messageService;
        this.userRepository = userRepository;
        this.channelRepository = channelRepository;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
        this.freeChannelRepository = freeChannelRepository;
        this.courseService = courseService;
        this.communityService = communityService;
    }

    @PostMapping("/channels")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createChannel(@RequestBody ChannelModel channel) {
        return ResponseEntity.ok(channelService.createChannel(channel));
    }

    @GetMapping("/channels")
    public ResponseEntity<?> getPremiumAndLevelledChannels(@RequestHeader("Authorization") String authHeader) {
        UserModel user = getUserFromJwt(authHeader);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        List<ChannelModel> all = channelRepository.findAll();
        List<ChannelModel> visible = new ArrayList<>();

        for (ChannelModel ch : all) {
            boolean isVisible = false;
            String access = ch.getAccessLevel() != null ? ch.getAccessLevel().toLowerCase() : "";

            // Admins can see all channels
            if (user.isAdmin()) {
                isVisible = true;
            }
            // Open channels are visible to everyone
            else if (access.equals("open")) {
                isVisible = true;
            }
            // Course channels are visible to users who bought the course
            else if (access.equals("course")) {
                Long courseId = ch.getCourse() != null ? ch.getCourse().getId() : null;
                if (user.getCourses().stream().anyMatch(course -> course.getId().equals(courseId))) {
                    isVisible = true;
                }

            }
            // Level-based channels are visible based on user level
            else if (access.equals("level")) {
                if (userService.getUserLevel(user.getId()) >= (ch.getMinLevel() != null ? ch.getMinLevel() : 0)) {
                    isVisible = true;
                }
            }

            if (ch.getName().equals("staff-lounge") && !user.isAdmin()) {
                continue; // Skip this channel for non-admins
            }


            // Add channel to the visible list if the user can access it
            if (isVisible) {
                visible.add(ch);
            }
        }

        return ResponseEntity.ok(visible);
    }


    @GetMapping("/channels/{channelId}/messages")
    public ResponseEntity<?> getMessages(@PathVariable Long channelId, @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract user from token
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtUtil.extractUserId(token);
            
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid authentication token");
            }
            
            // Check if user has access to this channel
            boolean hasAccess = communityService.userHasChannelAccess(userId, channelId);
            if (!hasAccess) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You do not have access to this channel");
            }
            
            // Get messages
            List<MessageModel> messages = communityService.getChannelMessages(channelId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving channel messages: " + e.getMessage());
        }
    }

    @PostMapping("/channels/{channelId}/messages")
    public ResponseEntity<?> addMessage(
            @PathVariable Long channelId,
            @RequestBody MessageRequest messageRequest,
            @RequestHeader("Authorization") String authHeader) {
        
        try {
            // Extract user from token
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtUtil.extractUserId(token);
            
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid authentication token");
            }
            
            // Check if user has access to this channel
            boolean hasAccess = communityService.userHasChannelAccess(userId, channelId);
            if (!hasAccess) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You do not have access to this channel");
            }
            
            // Add the message
            MessageModel message = communityService.addMessage(channelId, userId, messageRequest.getContent());
            if (message == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Failed to add message");
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(message);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error adding message: " + e.getMessage());
        }
    }


    @PutMapping("/channels/{channelId}/messages/{messageId}")
    public ResponseEntity<?> editMessage(@PathVariable Long channelId,
                                         @PathVariable Long messageId,
                                         @RequestParam("userId") Long userId,
                                         @RequestBody String newContent) {
        Optional<UserModel> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body("User not found");

        boolean updated = messageService.editMessage(messageId, newContent, userOpt.get());
        return updated ? ResponseEntity.ok("Message updated") : ResponseEntity.status(403).body("You are not allowed to edit this message");
    }

    @DeleteMapping("/channels/{channelId}/messages/{messageId}")
    public ResponseEntity<?> deleteMessage(@PathVariable Long channelId,
                                           @PathVariable Long messageId,
                                           @RequestParam("userId") Long userId) {
        Optional<UserModel> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body("User not found");

        UserModel user = userOpt.get();
        if (user.isAdmin()) {
            boolean deleted = messageService.deleteMessage(messageId, user);
            return deleted ? ResponseEntity.ok("Message deleted") : ResponseEntity.status(403).body("You are not allowed to delete this message");
        }

        return ResponseEntity.status(403).body("You are not authorized to delete messages.");
    }


    @PostMapping("/agree-to-rules")
    public ResponseEntity<?> agreeToRules(@RequestParam("userId") Long userId) {
        Optional<UserModel> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return ResponseEntity.badRequest().body("User not found");

        UserModel user = userOpt.get();
        user.setAgreedToRules(true);
        userRepository.save(user);
        return ResponseEntity.ok("Rules accepted.");
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/courses")
    public ResponseEntity<List<CourseModel>> getAllCourses() {
        List<CourseModel> courses = courseService.getAllCourses(); // Admin can see all courses
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/free-channels")
    public ResponseEntity<?> getFreeChannels(@RequestHeader("Authorization") String authHeader) {
        UserModel user = getUserFromJwt(authHeader);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        boolean isAdmin = user.isAdmin();
        int userLevel = userService.getUserLevel(user.getId());

        List<ChannelModel> all = channelRepository.findAll();
        List<ChannelModel> visible = new ArrayList<>();

        for (ChannelModel ch : all) {
            if (ch.getName() == null || ch.getName().trim().isEmpty()) continue;
            if (ch.isHidden()) continue;

            String access = ch.getAccessLevel() != null ? ch.getAccessLevel().toLowerCase() : "";

            if (access.equals("admin-only") && !isAdmin) continue;
            if (access.equals("readonly") || access.equals("open")) {
                visible.add(ch);
            } else if (access.equals("level") && userLevel >= (ch.getMinLevel() != null ? ch.getMinLevel() : 0)) {
                visible.add(ch);
            }
        }

        return ResponseEntity.ok(visible);
    }

    private Long getUserIdFromJwt(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try {
            String token = authHeader.substring(7);
            Claims claims = jwtUtil.extractClaims(token);
            return Long.parseLong(claims.get("id").toString());
        } catch (Exception e) {
            return null;
        }
    }

    private UserModel getUserFromJwt(String authHeader) {
        Long userId = getUserIdFromJwt(authHeader);
        if (userId == null) return null;
        return userRepository.findById(userId).orElse(null);
    }

    private boolean userHasAccessToChannel(UserModel user, ChannelModel channel) {
        if (user.isAdmin()) return true;
        if (channel.getName() != null && channel.getName().toLowerCase().contains("staff-lounge")) return false;

        String access = channel.getAccessLevel() != null ? channel.getAccessLevel().toLowerCase() : "";

        switch (access) {
            case "open":
                return true;
            case "course": {
                Long channelCourseId = channel.getCourse() != null ? channel.getCourse().getId() : null;
                return channelCourseId != null && user.getCourses().stream().anyMatch(c -> Objects.equals(c.getId(), channelCourseId));
            }
            case "levelled":
                int userLevel = userService.getUserLevel(user.getId());
                Integer minLevel = channel.getMinLevel();
                return minLevel == null || userLevel >= minLevel;
            default:
                return false;
        }
    }

    private boolean isChannelVisibleToUser(UserModel user, ChannelModel channel) {
        if (channel.getName() == null || channel.getName().trim().isEmpty()) return false;
        if (channel.isHidden()) return false;
        return userHasAccessToChannel(user, channel);
    }
}
