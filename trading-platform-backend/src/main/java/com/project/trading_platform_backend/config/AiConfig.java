package com.project.trading_platform_backend.config;

import org.springframework.ai.openai.OpenAiChatClient;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class AiConfig {

    @Bean
    public OpenAiChatClient chatClient(@Value("${spring.ai.openai.api-key}") String apiKey) {
        OpenAiApi openAiApi = new OpenAiApi(apiKey);
        return new OpenAiChatClient(openAiApi);
    }
}
