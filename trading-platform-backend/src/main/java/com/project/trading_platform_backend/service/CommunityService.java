package com.project.trading_platform_backend.service;

import com.project.trading_platform_backend.model.ChannelModel;
import com.project.trading_platform_backend.model.LevelModel;
import com.project.trading_platform_backend.model.MessageModel;
import com.project.trading_platform_backend.model.UserModel;
import com.project.trading_platform_backend.repository.ChannelRepository;
import com.project.trading_platform_backend.repository.LevelRepository;
import com.project.trading_platform_backend.repository.MessageRepository;
import com.project.trading_platform_backend.repository.UserRepository;
import com.project.trading_platform_backend.repository.UserCourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CommunityService {

    private final UserRepository userRepository;
    private final ChannelRepository channelRepository;
    private final MessageRepository messageRepository;
    private final LevelRepository levelRepository;
    private final UserCourseRepository userCourseRepository;

    @Autowired
    public CommunityService(
            UserRepository userRepository,
            ChannelRepository channelRepository,
            MessageRepository messageRepository,
            LevelRepository levelRepository,
            UserCourseRepository userCourseRepository) {
        this.userRepository = userRepository;
        this.channelRepository = channelRepository;
        this.messageRepository = messageRepository;
        this.levelRepository = levelRepository;
        this.userCourseRepository = userCourseRepository;
    }

    /**
     * Check if a user has access to a channel
     * @param userId User ID
     * @param channelId Channel ID
     * @return true if the user has access, false otherwise
     */
    public boolean userHasChannelAccess(Long userId, Long channelId) {
        // First check if user exists
        UserModel user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return false;
        }
        
        // Check if channel exists
        ChannelModel channel = channelRepository.findById(channelId).orElse(null);
        if (channel == null) {
            return false;
        }
        
        // Admin users have access to all channels
        if (user.getRole().equalsIgnoreCase("ADMIN")) {
            return true;
        }
        
        // Check channel access type
        String accessLevel = channel.getAccessLevel();
        if (accessLevel == null) {
            return false;
        }
        
        if (accessLevel.equalsIgnoreCase("open") || accessLevel.equalsIgnoreCase("readonly")) {
            // Open channels are accessible to all authenticated users
            return true;
        }
        
        if (accessLevel.equalsIgnoreCase("admin-only")) {
            // Admin-only channels are only for admins (already checked above)
            return false;
        }
        
        if (accessLevel.equalsIgnoreCase("level")) {
            // Level-based channels require minimum level
            Integer minLevel = channel.getMinLevel();
            if (minLevel == null) {
                minLevel = 0;
            }
            
            // Get user level
            LevelModel userLevel = levelRepository.findById(userId).orElse(null);
            if (userLevel == null || userLevel.getLevel() < minLevel) {
                return false;
            }
            return true;
        }
        
        if (accessLevel.equalsIgnoreCase("course")) {
            // Course channels require the user to own the specific course
            Long courseId = channel.getCourseId();
            if (courseId == null) {
                return false;
            }
            
            // Check if user has purchased this course
            boolean hasPurchased = userCourseRepository
                .findByUserIdAndCourseId(userId, courseId)
                .isPresent();
            
            return hasPurchased;
        }
        
        // Default to false for unknown access levels
        return false;
    }

    /**
     * Get all messages for a channel
     * @param channelId Channel ID
     * @return List of messages
     */
    public List<MessageModel> getChannelMessages(Long channelId) {
        ChannelModel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new RuntimeException("Channel not found"));
        
        return messageRepository.findByChannelWithSender(channel);
    }

    /**
     * Add a message to a channel
     * @param channelId Channel ID
     * @param userId User ID
     * @param content Message content
     * @return Created message
     */
    public MessageModel addMessage(Long channelId, Long userId, String content) {
        // Validate input
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be empty");
        }
        
        UserModel user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        ChannelModel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new RuntimeException("Channel not found"));
        
        // Check if channel is read-only
        if ("readonly".equalsIgnoreCase(channel.getAccessLevel()) && 
            !"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("This channel is read-only");
        }
        
        // Check if user is muted
        if (user.getMuted() != null && user.getMuted()) {
            throw new RuntimeException("You are muted and cannot send messages");
        }
        
        // Create and save message
        MessageModel message = new MessageModel();
        message.setSender(user);
        message.setChannel(channel);
        message.setContent(content);
        message.setTimestamp(LocalDateTime.now());
        message.setEncrypted(false); // Set to true if you want to encrypt
        
        return messageRepository.save(message);
    }

    /**
     * Get all channels
     * @return List of all channels
     */
    public List<ChannelModel> getAllChannels() {
        return channelRepository.findAll();
    }

    /**
     * Get a channel by ID
     * @param channelId Channel ID
     * @return Channel if found
     */
    public Optional<ChannelModel> getChannelById(Long channelId) {
        return channelRepository.findById(channelId);
    }
} 