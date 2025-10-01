package com.project.trading_platform_backend.util;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Utility class for masking IP addresses for privacy
 */
@Component
public class IpMaskingUtil {

    // Pattern for IPv4 address
    private static final Pattern IPV4_PATTERN = 
        Pattern.compile("^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$");
    
    // Pattern for IPv6 address (simplified)
    private static final Pattern IPV6_PATTERN = 
        Pattern.compile("^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$");

    /**
     * Masks an IP address for privacy
     * - IPv4: Masks the last octet with 'xxx' (e.g., 192.168.1.123 -> 192.168.1.xxx)
     * - IPv6: Masks the last two segments with 'xxxx' (e.g., 2001:db8::ff00:42:8329 -> 2001:db8::ff00:xxxx:xxxx)
     *
     * @param ip The IP address to mask
     * @return The masked IP address
     */
    public String maskIp(String ip) {
        if (ip == null || ip.isEmpty()) {
            return "unknown";
        }
        
        if (IPV4_PATTERN.matcher(ip).matches()) {
            return maskIpv4(ip);
        } else if (IPV6_PATTERN.matcher(ip).matches()) {
            return maskIpv6(ip);
        }
        
        return "invalid_format";
    }
    
    /**
     * Masks an IPv4 address by replacing the last octet with 'xxx'
     */
    private String maskIpv4(String ip) {
        int lastDotIndex = ip.lastIndexOf('.');
        if (lastDotIndex != -1) {
            return ip.substring(0, lastDotIndex + 1) + "xxx";
        }
        return ip;
    }
    
    /**
     * Masks an IPv6 address by replacing the last two segments with 'xxxx'
     */
    private String maskIpv6(String ip) {
        // For the simplified ::1 format
        if (ip.equals("::1")) {
            return "::xxxx";
        }
        
        // For normal IPv6 addresses
        String[] parts = ip.split(":");
        StringBuilder masked = new StringBuilder();
        
        // If there are at least two segments, replace the last two with 'xxxx'
        for (int i = 0; i < parts.length; i++) {
            if (i == parts.length - 1 || i == parts.length - 2) {
                masked.append("xxxx");
            } else {
                masked.append(parts[i]);
            }
            
            if (i < parts.length - 1) {
                masked.append(":");
            }
        }
        
        return masked.toString();
    }
} 