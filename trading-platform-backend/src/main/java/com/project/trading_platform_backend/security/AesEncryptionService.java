package com.project.trading_platform_backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Service for handling AES encryption and decryption operations
 * Renamed from AesEncryptionUtil to avoid bean name conflict with util.AesEncryptionUtil
 */
@Component("securityAesEncryption")
public class AesEncryptionService {

    @Value("${aes.encryption.key:YourAESEncryptionKey}")
    private String encryptionKey;

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final int KEY_SIZE = 256;

    /**
     * Encrypts the provided plaintext using AES encryption
     * 
     * @param plainText Text to encrypt
     * @return Base64 encoded encrypted string
     */
    public String encrypt(String plainText) {
        try {
            byte[] iv = generateIV();
            SecretKey key = getKeyFromPassword();
            
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key, new IvParameterSpec(iv));
            
            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            
            // Prepend IV to the ciphertext for decryption
            byte[] encryptedData = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, encryptedData, 0, iv.length);
            System.arraycopy(cipherText, 0, encryptedData, iv.length, cipherText.length);
            
            return Base64.getEncoder().encodeToString(encryptedData);
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting data", e);
        }
    }

    /**
     * Decrypts the provided encrypted text
     * 
     * @param encryptedText Base64 encoded encrypted string with IV prepended
     * @return Decrypted plaintext
     */
    public String decrypt(String encryptedText) {
        try {
            byte[] encryptedData = Base64.getDecoder().decode(encryptedText);
            
            // Extract IV from the first 16 bytes
            byte[] iv = new byte[16];
            byte[] cipherText = new byte[encryptedData.length - 16];
            
            System.arraycopy(encryptedData, 0, iv, 0, 16);
            System.arraycopy(encryptedData, 16, cipherText, 0, encryptedData.length - 16);
            
            SecretKey key = getKeyFromPassword();
            
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key, new IvParameterSpec(iv));
            
            byte[] plainText = cipher.doFinal(cipherText);
            return new String(plainText, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Error decrypting data", e);
        }
    }

    private SecretKey getKeyFromPassword() {
        byte[] keyBytes = encryptionKey.getBytes(StandardCharsets.UTF_8);
        // Use only the first 32 bytes (256 bits) of the key
        byte[] validKeyBytes = new byte[32];
        System.arraycopy(keyBytes, 0, validKeyBytes, 0, Math.min(keyBytes.length, 32));
        return new SecretKeySpec(validKeyBytes, "AES");
    }

    private byte[] generateIV() {
        byte[] iv = new byte[16];
        new SecureRandom().nextBytes(iv);
        return iv;
    }

    /**
     * Generates a new random encryption key
     * 
     * @return Base64 encoded encryption key
     */
    public static String generateKey() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
            keyGenerator.init(KEY_SIZE);
            SecretKey key = keyGenerator.generateKey();
            return Base64.getEncoder().encodeToString(key.getEncoded());
        } catch (Exception e) {
            throw new RuntimeException("Error generating key", e);
        }
    }
} 