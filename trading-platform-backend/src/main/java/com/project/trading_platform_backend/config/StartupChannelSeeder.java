package com.project.trading_platform_backend.config;

import com.project.trading_platform_backend.model.ChannelModel;
import com.project.trading_platform_backend.repository.ChannelRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
public class StartupChannelSeeder {

    @Bean
    CommandLineRunner initChannels(ChannelRepository channelRepository) {
        return args -> {
            List<String> defaultChannels = Arrays.asList(
                    "general", "rules", "trading", "support", "memes", "crypto", "stock-tips"
            );

            for (String name : defaultChannels) {
                if (channelRepository.findByName(name).isEmpty()) {
                    ChannelModel channel = new ChannelModel();
                    channel.setName(name);
                    channel.setSystemChannel(name.equals("rules"));
                    channel.setAccessLevel("ALL"); // Default all public for now
                    channelRepository.save(channel);
                }
            }

            System.out.println("Default community channels seeded.");
        };
    }
}
