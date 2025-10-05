package com.project.trading_platform_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuration for WebSocket
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthenticationInterceptor authInterceptor;

    public WebSocketConfig(WebSocketAuthenticationInterceptor authInterceptor) {
        this.authInterceptor = authInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // allows fallback for clients that don't support native WebSockets
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Application destination prefixes for client-to-server messages
        registry.setApplicationDestinationPrefixes("/app");
        
        // Enable user-specific destinations for private messages
        // This allows messages to be sent to specific users with /user/{username}/queue/...
        registry.setUserDestinationPrefix("/user");
        
        // Enable simple broker for server-to-client messages
        // - /topic/... for public channels (multi-subscriber)
        // - /queue/... for private messages to specific users
        // - /user/queue/... for user-specific private messages
        registry.enableSimpleBroker("/topic", "/queue", "/user"); 
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Register the authentication interceptor
        registration.interceptors(authInterceptor);
    }
}
