package com.project.trading_platform_backend.controller;

import com.project.trading_platform_backend.dto.LoginRequest;
import com.project.trading_platform_backend.dto.RegisterRequest;
import com.project.trading_platform_backend.model.UserModel;
import com.project.trading_platform_backend.repository.UserRepository;
import com.project.trading_platform_backend.response.AuthResponse;
import com.project.trading_platform_backend.security.JwtUtil;
import com.project.trading_platform_backend.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public AuthController(AuthService authService, UserRepository userRepository, JwtUtil jwtUtil) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", e.getMessage())
            );
        } catch (Exception e) {
            return ResponseEntity.status(500).body(
                    Map.of("message", "Server error during registration.")
            );
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        logger.info("Login attempt for email: {}", request.getEmail());
        try {
            // Added debug log to verify request data
            logger.debug("Login request received - Email: {}, Password length: {}", 
                request.getEmail(), 
                request.getPassword() != null ? request.getPassword().length() : 0);
            
            AuthResponse response = authService.login(request);
            logger.info("Login response status: {}", response.getStatus());
            
            // Add the token to the response header
            HttpHeaders headers = new HttpHeaders();
            headers.add("Authorization", "Bearer " + response.getToken());
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Login failed: {}", e.getMessage());
            return ResponseEntity.status(401).body(
                    Map.of("message", e.getMessage())
            );
        } catch (Exception e) {
            // Detailed error logging for debugging
            logger.error("Server error during login for user: {}", request.getEmail(), e);
            return ResponseEntity.status(500).body(
                    Map.of(
                        "message", "Server error during login.", 
                        "error", e.getMessage(),
                        "type", e.getClass().getSimpleName()
                    )
            );
        }
    }

    @PostMapping("/verify-mfa")
    public ResponseEntity<?> verifyMfa(@RequestBody Map<String, String> payload) {
        Long userId = Long.parseLong(payload.get("userId"));
        String inputCode = payload.get("code");

        UserModel user = userRepository.findById(userId).orElse(null);
        if (user == null || !inputCode.equals(user.getMfaCode())) {
            return ResponseEntity.status(403).body(Map.of("message", "Invalid MFA code."));
        }

        user.setMfaVerified(true);
        user.setMfaCode(null);
        userRepository.save(user);

        String jwt = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());

        return ResponseEntity.ok(new AuthResponse(
                jwt,
                user.getRole(),
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getName(),
                user.getAvatar(),
                user.getPhone(),
                user.getAddress(),
                "MFA_VERIFIED",
                null
        ));
    }

    @PostMapping("/resend-mfa")
    public ResponseEntity<?> resendMfa(@RequestBody Map<String, String> payload) {
        try {
            Long userId = Long.parseLong(payload.get("userId"));
            authService.resendMfaCode(userId);
            return ResponseEntity.ok(Map.of("message", "Code resent successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to resend MFA code"));
        }
    }

    @GetMapping("/verify-token")
    public ResponseEntity<?> verifyToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("valid", false, "message", "No token provided"));
            }
            
            String token = authHeader.substring(7);
            boolean isValid = jwtUtil.validateToken(token);
            
            if (isValid) {
                return ResponseEntity.ok(Map.of("valid", true));
            } else {
                return ResponseEntity.status(401).body(Map.of("valid", false, "message", "Invalid token"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("valid", false, "message", "Token validation error"));
        }
    }

}
