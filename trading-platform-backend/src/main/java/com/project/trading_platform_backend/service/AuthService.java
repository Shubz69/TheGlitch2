package com.project.trading_platform_backend.service;

import com.project.trading_platform_backend.dto.LoginRequest;
import com.project.trading_platform_backend.dto.RegisterRequest;
import com.project.trading_platform_backend.model.UserModel;
import com.project.trading_platform_backend.repository.UserRepository;
import com.project.trading_platform_backend.response.AuthResponse;
import com.project.trading_platform_backend.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;


    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is already in use");
        }

        if (request.getEmail() == null || request.getPassword() == null || request.getUsername() == null || request.getName() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required fields");
        }

        String avatar = request.getAvatar() != null ? request.getAvatar() : "avatar_default.png";

        UserModel newUser = new UserModel();
        newUser.setEmail(request.getEmail());
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        newUser.setUsername(request.getUsername());
        newUser.setName(request.getName());
        newUser.setAvatar(avatar);
        newUser.setRole("PREMIUM");
        newUser.setAddress("");
        newUser.setPhone("");
        newUser.setLastSeen(LocalDateTime.now());
        
        // Generate MFA code for new registration
        String mfaCode = String.format("%06d", new Random().nextInt(1_000_000));
        newUser.setMfaCode(mfaCode);
        newUser.setMfaVerified(false);

        try {
            userRepository.save(newUser);
            logger.info("User registered successfully: {}", newUser.getEmail());
            
            // Send MFA code to new user's email
            try {
                emailService.sendMfaCodeEmail(newUser.getEmail(), mfaCode);
                logger.info("✅ Sent MFA code {} to new user {}", mfaCode, newUser.getEmail());
            } catch (Exception e) {
                logger.error("❌ Failed to send MFA code to new user {}: {}", newUser.getEmail(), e.getMessage());
            }
            
        } catch (Exception e) {
            logger.error("Error saving user to database", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error saving user");
        }

        try {
            String token = jwtUtil.generateToken(newUser.getId(), newUser.getEmail(), newUser.getRole());
            return new AuthResponse(
                    token,
                    newUser.getRole(),
                    newUser.getId(),
                    newUser.getUsername(),
                    newUser.getEmail(),
                    newUser.getName(),
                    newUser.getAvatar(),
                    newUser.getPhone(),
                    newUser.getAddress(),
                    "MFA_REQUIRED", // Changed from REGISTERED to MFA_REQUIRED
                    null           // Don't return the MFA code for security
            );

        } catch (Exception e) {
            logger.error("Error generating JWT token", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error generating token");
        }
    }

    public AuthResponse login(LoginRequest request) {
        // Validate request
        if (request == null) {
            throw new IllegalArgumentException("Login request cannot be null");
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be empty");
        }

        // Find user
        UserModel user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email"));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Incorrect password");
        }

        // Update last seen
        user.setLastSeen(LocalDateTime.now());

        // Generate MFA code
        String mfaCode = String.format("%06d", new Random().nextInt(1_000_000));
        user.setMfaCode(mfaCode);
        user.setMfaVerified(false);
        userRepository.save(user);

        // Try to send the email but don't fail if it doesn't work
        try {
            emailService.sendMfaCodeEmail(user.getEmail(), mfaCode);
            logger.info("✅ Sent MFA code {} to {}", mfaCode, user.getEmail());
        } catch (Exception e) {
            // Just log the error, don't throw an exception
            logger.error("❌ Failed to send MFA code to {}: {}", user.getEmail(), e.getMessage());
        }

        // Generate token for authentication after MFA
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
        
        logger.info("⚠️ Login requires MFA for user: {}, returning status MFA_REQUIRED", user.getEmail());
        
        return new AuthResponse(
                token,
                user.getRole(),
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getName(),
                user.getAvatar(),
                user.getPhone(),
                user.getAddress(),
                "MFA_REQUIRED", // Using MFA_REQUIRED to trigger the verification page
                null  // Don't send mfaCode back to frontend
        );
    }



    public void resendMfaCode(Long userId) {
        UserModel user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String newCode = String.format("%06d", new Random().nextInt(999999));
        user.setMfaCode(newCode);
        user.setMfaVerified(false);
        userRepository.save(user);

        emailService.sendMfaCodeEmail(user.getEmail(), newCode);
    }

}
