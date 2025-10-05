package com.project.trading_platform_backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.trading_platform_backend.util.AesEncryptionUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for securing WebSocket communications with encryption/decryption
 */
@Service
public class WebSocketSecurityService {

    private final AesEncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper;
    
    // Enable encryption by default
    @Value("${websocket.encryption.enabled:true}")
    private boolean enableEncryption;
    
    public WebSocketSecurityService(AesEncryptionUtil encryptionUtil, ObjectMapper objectMapper) {
        this.encryptionUtil = encryptionUtil;
        this.objectMapper = objectMapper;
    }
    
    /**
     * Encrypts a message if encryption is enabled
     * @param message Plain text message
     * @return Encrypted message or original if encryption disabled
     */
    public String encryptMessage(String message) {
        if (!enableEncryption) {
            return message;
        }
        
        try {
            return encryptionUtil.encrypt(message);
        } catch (Exception e) {
            return handleException(e);
        }
    }
    
    /**
     * Decrypts a message if encryption is enabled
     * @param encryptedMessage Encrypted message
     * @return Decrypted message or original if encryption disabled
     */
    public String decryptMessage(String encryptedMessage) {
        if (!enableEncryption) {
            return encryptedMessage;
        }
        
        try {
            return encryptionUtil.decrypt(encryptedMessage);
        } catch (Exception e) {
            return handleException(e);
        }
    }
    
    /**
     * Process an incoming encrypted message, decrypting and converting to the given type
     * @param encryptedMessage Encrypted message
     * @param valueType Class to convert JSON to
     * @return Object of the given type
     */
    public <T> T processIncomingMessage(String encryptedMessage, Class<T> valueType) throws Exception {
        String decryptedMessage = decryptMessage(encryptedMessage);
        return objectMapper.readValue(decryptedMessage, valueType);
    }
    
    /**
     * Process an outgoing message, converting to JSON and encrypting
     * @param message Object to convert to JSON and encrypt
     * @return Encrypted JSON string
     */
    public String processOutgoingMessage(Object message) throws Exception {
        // If encryption is disabled, just convert to JSON and return
        if (!enableEncryption) {
            return objectMapper.writeValueAsString(message);
        }
        
        String jsonMessage = objectMapper.writeValueAsString(message);
        return encryptMessage(jsonMessage);
    }
    
    /**
     * Handle exceptions by returning an error message
     * @param exception The exception that occurred
     * @return JSON error message
     */
    public String handleException(Exception exception) {
        try {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Messaging error: " + exception.getMessage());
            return objectMapper.writeValueAsString(errorResponse);
        } catch (JsonProcessingException e) {
            return "{\"error\":\"Error processing message\"}";
        }
    }
    
    /**
     * Check if encryption is enabled
     * @return true if encryption is enabled
     */
    public boolean isEncryptionEnabled() {
        return enableEncryption;
    }
} 