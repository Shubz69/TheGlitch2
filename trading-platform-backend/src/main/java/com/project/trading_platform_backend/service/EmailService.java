package com.project.trading_platform_backend.service;

import com.project.trading_platform_backend.model.ContactMessageModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    public void sendMfaCodeEmail(String toEmail, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("shubzfx@gmail.com"); // Must match the verified Elastic Email sender
            message.setTo(toEmail);
            message.setSubject("Your MFA Code");
            message.setText("Your Infinity AI MFA Code is: " + code);
            
            try {
                mailSender.send(message);
                logger.info("Successfully sent MFA email to {}", toEmail);
            } catch (Exception e) {
                // Log the error but don't throw - allow authentication to continue
                logger.error("Failed to send MFA email: {}", e.getMessage());
                logger.debug("Email sending error details", e);
            }
        } catch (Exception e) {
            // Log the error but don't throw - allow authentication to continue
            logger.error("Error preparing MFA email: {}", e.getMessage());
        }
    }
}

