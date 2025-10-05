package com.project.trading_platform_backend.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Utility class for AES encryption and decryption
 */
@Component
public class AesEncryptionUtil {

    @Value("${aes.encryption.key:v8y/B?E(H+KbPeShVmYq3t6w9z$C&F)J}")
    private String secretKey;
    
    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final int IV_SIZE = 16;
    
    /**
     * Encrypt a string using AES encryption
     * @param plainText The text to encrypt
     * @return Base64 encoded encrypted string
     */
    public String encrypt(String plainText) {
        try {
            if (plainText == null) {
                throw new RuntimeException("Error encrypting: Input text cannot be null");
            }
            
            SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "AES");
            
            // Generate random IV
            byte[] iv = new byte[IV_SIZE];
            new SecureRandom().nextBytes(iv);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            
            // Initialize cipher for encryption
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);
            
            // Encrypt the data
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            
            // Concatenate IV and encrypted data
            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);
            
            // Return as Base64 string
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting: " + e.getMessage(), e);
        }
    }
    
    /**
     * Decrypt an AES encrypted string
     * @param encryptedText Base64 encoded encrypted string
     * @return Decrypted plain text
     */
    public String decrypt(String encryptedText) {
        try {
            // Decode from Base64
            byte[] combined = Base64.getDecoder().decode(encryptedText);
            
            // Extract IV and encrypted data
            byte[] iv = new byte[IV_SIZE];
            byte[] encrypted = new byte[combined.length - IV_SIZE];
            System.arraycopy(combined, 0, iv, 0, IV_SIZE);
            System.arraycopy(combined, IV_SIZE, encrypted, 0, encrypted.length);
            
            SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "AES");
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            
            // Initialize cipher for decryption
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);
            
            // Decrypt and return as string
            byte[] decrypted = cipher.doFinal(encrypted);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Error decrypting: " + e.getMessage(), e);
        }
    }
    
    /**
     * Generate a random AES key
     * @return Base64 encoded AES key
     */
    public static String generateKey() {
        byte[] key = new byte[32]; // 256-bit key
        new SecureRandom().nextBytes(key);
        return Base64.getEncoder().encodeToString(key);
    }
} 