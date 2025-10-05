package com.project.trading_platform_backend.service;

import com.project.trading_platform_backend.model.UserModel;
import com.project.trading_platform_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class PresenceService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private UserRepository userRepository;

    private final Set<Long> onlineUserIds = ConcurrentHashMap.newKeySet();

    public Set<Long> getOnlineUsers() {
        return onlineUserIds;
    }

    public boolean isUserOnline(Long userId) {
        return onlineUserIds.contains(userId);
    }

    public void markUserOnline(Long userId) {
        if (onlineUserIds.add(userId)) {
            broadcastOnlineStatus();  // Only broadcast if added
        }
    }

    public void markUserOffline(Long userId) {
        if (onlineUserIds.remove(userId)) {
            broadcastOnlineStatus();  // Only broadcast if removed
        }
    }

    public void broadcastOnlineStatus() {
        try {
            messagingTemplate.convertAndSend("/topic/online-users", onlineUserIds);
        } catch (Exception e) {
            System.err.println("🛑 Failed to broadcast online user list: " + e.getMessage());
        }
    }

    public void setUserOnlineStatus(String email, boolean online) {
        // This method is kept for backward compatibility
    }
    
    /**
     * Get online users with their basic information
     */
    public List<UserModel> getOnlineUsersWithDetails() {
        return onlineUserIds.stream()
                .map(userRepository::findById)
                .filter(java.util.Optional::isPresent)
                .map(java.util.Optional::get)
                .collect(Collectors.toList());
    }
    
    /**
     * Get online users count
     */
    public int getOnlineUsersCount() {
        return onlineUserIds.size();
    }
    
    /**
     * Get offline users count
     */
    public int getOfflineUsersCount() {
        return (int) userRepository.count() - onlineUserIds.size();
    }
}
