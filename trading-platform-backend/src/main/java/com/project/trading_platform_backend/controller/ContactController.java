package com.project.trading_platform_backend.controller;

import com.project.trading_platform_backend.model.ContactMessageModel;
import com.project.trading_platform_backend.repository.ContactMessageRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/contact")
@CrossOrigin(origins = "http://localhost:3000")
public class ContactController {

    @Autowired
    private ContactMessageRepository messageRepo;

    @Autowired
    private JavaMailSender mailSender;

    @PostMapping
    public ResponseEntity<String> submitMessage(@RequestBody ContactMessageModel message) {
        message.setTimestamp(LocalDateTime.now());
        messageRepo.save(message);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo("shubzfx@gmail.com");
            helper.setSubject("📩 New Contact Us Message");

            String htmlContent = """
                <div style='font-family: Arial, sans-serif; color: #333;'>
                    <img src='http://localhost:3000/infinity-logo.png' alt='Infinity AI Logo' width='150' style='margin-bottom: 20px;' />
                    <h2>New Contact Us Message</h2>
                    <p><strong>Name:</strong> %s</p>
                    <p><strong>Email:</strong> %s</p>
                    <p><strong>Message:</strong><br/>%s</p>
                    <hr/>
                    <small>This message was sent via Infinity AI</small>
                </div>
            """.formatted(
                    message.getName(),
                    message.getEmail(),
                    message.getMessage().replace("\n", "<br/>")
            );

            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);

        } catch (Exception e) {
            e.printStackTrace();
        }

        return ResponseEntity.ok("Message submitted and email sent!");
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<ContactMessageModel> getAllMessages() {
        return messageRepo.findAll();
    }
}
