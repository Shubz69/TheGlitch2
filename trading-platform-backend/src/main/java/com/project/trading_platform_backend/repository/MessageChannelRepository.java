package com.project.trading_platform_backend.repository;

import com.project.trading_platform_backend.model.MessageChannel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for message channel operations
 */
@Repository
public interface MessageChannelRepository extends JpaRepository<MessageChannel, Long> {
    
    /**
     * Find a channel by its name
     * @param name the name of the channel
     * @return the channel if found
     */
    Optional<MessageChannel> findByName(String name);
    
    /**
     * Find all channels that are not private
     * @return list of public channels
     */
    List<MessageChannel> findByIsPrivateFalse();
    
    /**
     * Find all channels that are private
     * @return list of private channels
     */
    List<MessageChannel> findByIsPrivateTrue();
} 