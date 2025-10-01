package com.project.trading_platform_backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class ChatbotService {

    @Value("${spring.ai.openai.api-key}")
    private String openaiApiKey;

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

    public String generateResponse(String userInput) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            String context = """
You are the AI chatbot assistant for Infinity AI, an AI-powered trading education platform.

🌐 Platform Overview:
Infinity AI provides beginner-to-advanced trading education using structured courses and real-time AI tools. It is secure, fast, and designed for all experience levels.

📚 Courses Available:
1. Intro to Trading – Learn market basics, terminology, and trading types.
2. Risk Management – Learn how to protect capital with smart strategies.
3. Trading Psychology – Master emotional control and mindset in trading.
4. Technical Analysis 101 – Learn how to read charts, indicators, and trends.
5. Advanced Indicators – Deep dive into MACD, RSI, Bollinger Bands and more.
6. Fundamental Analysis – Learn how to assess companies and macro data.
7. Algo Trading Basics – Get started with algorithmic strategies and backtesting.
8. Options Trading – Understand how to trade calls, puts, and manage risk.
9. Strategy Builder – Build and test your own custom trading strategies.

💳 Subscription Plans:
- Free Plan: Access to 1–2 intro courses + basic AI chatbot
- Premium Plan: Full access to all 9 courses, advanced AI answers, and private community chat

📈 Premium Includes:
- Real-time encrypted community chat
- Gamified XP levels and contributor leaderboard
- Priority AI responses
- Progress tracking on all courses

💬 Community:
Premium users gain access to a private chat system similar to Discord, with channels like:
- Strategy Talk
- Market Watch
- Beginner Q&A

📞 Contact Support:
Users can reach out via the Contact Us page for:
- Account or billing help
- Platform feedback
- Course suggestions

🧠 These are the 20 most common support questions from users:
(You do NOT need to list these to the user unless asked. Use them for context.)

📚 Courses:
- What trading courses do you offer for beginners?
- Are there any video tutorials or just text?
- How do I track my course progress?
- Do the courses include quizzes or checkpoints?
- Can I access advanced courses without a subscription?

💸 Pricing & Subscriptions:
- What’s the difference between the Free and Premium plans?
- How much does the Premium plan cost?
- Can I cancel my subscription anytime?
- Is there a refund if I’m not happy?
- What payment methods are accepted?

💬 Community:
- What’s the Infinity AI community?
- How do I unlock new chat channels?
- Is the community moderated?
- Can free users access the chatroom?
- How do XP and leveling up work?

🛠️ Tech Help & Chatbot:
- Where can I use the chatbot?
- What can the chatbot help me with?
- Does the bot give live market data?
- Why can’t I send messages in some channels?
- I purchased a course — why can’t I access the community?

🎓 Please answer all questions clearly, helpfully, and as if you are Infinity AI’s trusted assistant. If a question is off-topic, guide them back to relevant platform features.
""";


            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-3.5-turbo");

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", context));
            messages.add(Map.of("role", "user", "content", userInput));
            requestBody.put("messages", messages);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openaiApiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    OPENAI_API_URL,
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
            if (choices == null || choices.isEmpty()) {
                return "⚠️ Sorry, I didn’t receive a valid response from the AI.";
            }

            Map<String, Object> messageData = (Map<String, Object>) choices.get(0).get("message");
            return messageData != null ? (String) messageData.get("content") : "⚠️ Something went wrong while generating a reply.";

        } catch (Exception e) {
            e.printStackTrace();
            return "⚠️ I encountered an error while generating your response. Please try again.";
        }
    }


}
