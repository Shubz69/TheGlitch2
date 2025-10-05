package com.project.trading_platform_backend.config;

import ch.qos.logback.classic.PatternLayout;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.Appender;
import ch.qos.logback.core.pattern.Converter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
public class LoggingConfig {

    /**
     * A filter to mask IP addresses in logs
     */
    @Bean
    public GdprLoggingFilter gdprLoggingFilter() {
        return new GdprLoggingFilter();
    }

    /**
     * Custom filter for GDPR-compliant logging
     */
    public static class GdprLoggingFilter extends OncePerRequestFilter {

        private static final Pattern IP_ADDRESS_PATTERN = Pattern.compile("(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})");
        private static final Pattern EMAIL_PATTERN = Pattern.compile("([a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7})");

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                        FilterChain filterChain) throws ServletException, IOException {
            // Capture original client IP
            String clientIp = request.getRemoteAddr();
            
            // Mask the IP address
            String maskedIp = maskIpAddress(clientIp);
            
            // Set the masked IP in MDC
            MDC.put("clientIp", maskedIp);
            
            ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(request);
            ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);
            
            try {
                filterChain.doFilter(requestWrapper, responseWrapper);
            } finally {
                // Clean up the MDC
                MDC.remove("clientIp");
                // Ensure the response is committed
                responseWrapper.copyBodyToResponse();
            }
        }
        
        /**
         * Masks IP address to comply with GDPR
         * Example: 192.168.1.1 becomes 192.168.1.xxx
         */
        private String maskIpAddress(String ipAddress) {
            if (ipAddress == null) {
                return "unknown";
            }
            
            Matcher matcher = IP_ADDRESS_PATTERN.matcher(ipAddress);
            if (matcher.find()) {
                String ip = matcher.group(1);
                String[] segments = ip.split("\\.");
                
                if (segments.length == 4) {
                    return segments[0] + "." + segments[1] + "." + segments[2] + ".xxx";
                }
            }
            
            return "xxx.xxx.xxx.xxx";
        }
    }
    
    /**
     * Pattern layout that masks sensitive data
     */
    public static class GdprPatternLayout extends PatternLayout {
        private static final Pattern EMAIL_PATTERN = Pattern.compile("([a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7})");
        private static final Pattern CC_PATTERN = Pattern.compile("\\b(?:\\d[ -]*?){13,16}\\b");
        
        @Override
        public String doLayout(ILoggingEvent event) {
            String message = super.doLayout(event);
            
            // Mask email addresses
            message = EMAIL_PATTERN.matcher(message).replaceAll("xxx@xxx.xxx");
            
            // Mask credit card numbers
            message = CC_PATTERN.matcher(message).replaceAll("xxxx-xxxx-xxxx-xxxx");
            
            return message;
        }
    }
} 