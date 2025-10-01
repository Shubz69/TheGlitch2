package com.project.trading_platform_backend.service;

import com.project.trading_platform_backend.dto.MessageResponseDTO;
import com.project.trading_platform_backend.model.*;
import com.project.trading_platform_backend.repository.*;
import com.project.trading_platform_backend.security.AesEncryptionService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final LevelRepository levelRepository;
    private final UserChannelAccessRepository userChannelAccessRepository;
    private final AesEncryptionService aesEncryptionService;

    private static final List<String> PUBLIC_CHANNELS = Arrays.asList(
            "welcome", "announcements", "general-chat", "rookie-hub"
    );

    private static final List<String> LEVEL_REQUIRED_CHANNELS = Arrays.asList(
            "trading-arena", "strategy-sessions", "elite-lounge"
    );

    public MessageService(
            MessageRepository messageRepository,
            LevelRepository levelRepository,
            UserChannelAccessRepository userChannelAccessRepository,
            AesEncryptionService aesEncryptionService
    ) {
        this.messageRepository = messageRepository;
        this.levelRepository = levelRepository;
        this.userChannelAccessRepository = userChannelAccessRepository;
        this.aesEncryptionService = aesEncryptionService;
    }

    public List<MessageResponseDTO> getMessages(ChannelModel channel) {
        List<MessageModel> messages = messageRepository.findByChannelWithSender(channel);
        return messages.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public MessageResponseDTO sendMessage(UserModel sender, ChannelModel channel, String content) {
        if (sender.isMuted()) {
            throw new RuntimeException("User is muted.");
        }

        // Admins can always post
        if (!"ADMIN".equals(sender.getRole())) {
            String channelName = channel.getName();

            // Public channel access
            if (PUBLIC_CHANNELS.contains(channelName)) {
                // allowed
            }
            // Level-based channels
            else if (LEVEL_REQUIRED_CHANNELS.contains(channelName)) {
                LevelModel level = levelRepository.findById(sender.getId())
                        .orElse(new LevelModel(sender.getId(), 1, 0));
                if (level.getLevel() < 1) {
                    throw new RuntimeException("Insufficient level for this channel.");
                }
            }
            // Course-linked channels
            else {
                boolean hasAccess = userChannelAccessRepository.existsByUserAndChannel(sender, channel);
                if (!hasAccess) {
                    throw new RuntimeException("You do not have access to this channel.");
                }
            }
        }

        // Encrypt the message content before storing
        String encryptedContent = aesEncryptionService.encrypt(content);
        
        MessageModel message = new MessageModel();
        message.setSender(sender);
        message.setChannel(channel);
        message.setContent(encryptedContent);
        message.setTimestamp(LocalDateTime.now());
        message.setEncrypted(true);
        
        incrementXP(sender.getId());
        MessageModel saved = messageRepository.save(message);
        
        // Decrypt for the response
        MessageResponseDTO dto = toDTO(saved);
        dto.setContent(content); // Use original content for response
        
        return dto;
    }

    private void incrementXP(Long userId) {
        LevelModel level = levelRepository.findById(userId)
                .orElseGet(() -> new LevelModel(userId, 1, 0));

        level.setXp(level.getXp() + 1);
        if (level.getXp() >= level.getLevel() * 100 && level.getLevel() < 100) {
            level.setXp(0);
            level.setLevel(level.getLevel() + 1);
        }

        levelRepository.save(level);
    }

    public boolean editMessage(Long messageId, String newContent, UserModel requester) {
        return messageRepository.findById(messageId).map(msg -> {
            if (!msg.getSender().getId().equals(requester.getId()) && !"ADMIN".equals(requester.getRole())) {
                return false;
            }
            msg.setContent(newContent);
            messageRepository.save(msg);
            return true;
        }).orElse(false);
    }

    public boolean deleteMessage(Long messageId, UserModel requester) {
        return messageRepository.findById(messageId).map(msg -> {
            if (!msg.getSender().getId().equals(requester.getId()) && !"ADMIN".equals(requester.getRole())) {
                return false;
            }
            messageRepository.deleteById(messageId);
            return true;
        }).orElse(false);
    }

    private MessageResponseDTO toDTO(MessageModel message) {
        String content = message.getContent();
        
        // Decrypt if the message is encrypted
        if (message.isEncrypted()) {
            content = aesEncryptionService.decrypt(content);
        }
        
        LevelModel level = levelRepository.findById(message.getSender().getId())
                .orElse(new LevelModel(message.getSender().getId(), 1, 0));

        MessageResponseDTO dto = new MessageResponseDTO(
                message.getId(),
                content,
                message.getSender().getUsername(),
                message.getSender().getAvatar(),
                level.getLevel(),
                message.getTimestamp(),
                message.getChannel().getId()
        );
        dto.setSenderId(message.getSender().getId());
        dto.setSenderName(message.getSender().getUsername());
        dto.setSenderAvatar(message.getSender().getAvatar());
        dto.setRole(message.getSender().getRole());
        return dto;
    }
}
