package com.project.trading_platform_backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;

@Service
public class RagChatbotService {

    @Value("${spring.ai.openai.api-key}")
    private String openaiApiKey;

    private final String knowledgeFilePath = "src/main/resources/InfinityAiKnowledge.txt";

    public String getAnswer(String question) {
        try {
            String knowledge = Files.readString(Paths.get(knowledgeFilePath));
            String prompt = "Website Info:\n" + knowledge + "\n\nUser Question: " + question +
                    "\n\nAnswer based on the website. If you cannot answer from this information, reply with: '⚠️ Please contact support for help.'";

            Map<String, Object> message = Map.of(
                    "model", "gpt-3.5-turbo",
                    "messages", List.of(
                            Map.of("role", "system", "content", "You are an assistant for the Infinity AI trading website."),
                            Map.of("role", "user", "content", prompt)
                    )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openaiApiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(message, headers);

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://api.openai.com/v1/chat/completions", request, String.class
            );

            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, Object> result = objectMapper.readValue(response.getBody(), Map.class);
            List<Map<String, Object>> choices = (List<Map<String, Object>>) result.get("choices");
            Map<String, Object> messageMap = (Map<String, Object>) choices.get(0).get("message");

            return (String) messageMap.get("content");

        } catch (IOException e) {
            return "⚠️ Failed to load knowledge base.";
        } catch (Exception e) {
            return "⚠️ Sorry, I couldn’t process that. Please contact support.";
        }
    }
}
