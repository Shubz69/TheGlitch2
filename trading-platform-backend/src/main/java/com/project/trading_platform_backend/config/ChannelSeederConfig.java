package com.project.trading_platform_backend.config;

import com.project.trading_platform_backend.model.ChannelModel;
import com.project.trading_platform_backend.model.CourseModel;
import com.project.trading_platform_backend.repository.ChannelRepository;
import com.project.trading_platform_backend.repository.CourseRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Optional;

@Configuration
public class ChannelSeederConfig {

    @Bean
    public CommandLineRunner seedChannels(ChannelRepository channelRepo, CourseRepository courseRepo) {
        return args -> {
            if (channelRepo.count() > 0) return;

            channelRepo.save(create("📌 welcome", "readonly", true, null, 0));
            channelRepo.save(create("📢 announcements", "admin-only", true, null, 0));
            channelRepo.save(create("📜 rules", "readonly", true, null, 0));
            channelRepo.save(create("💬 general-chat", "open", true, null, 0));
            channelRepo.save(create("🟢 rookie-hub", "level", true, null, 1));
            channelRepo.save(create("🔵 member-lounge", "level", true, null, 10));
            channelRepo.save(create("🟣 pro-discussion", "level", true, null, 25));
            channelRepo.save(create("🔥 elite-insights", "level", true, null, 50));
            channelRepo.save(create("👑 legend-chat", "level", true, null, 75));
            channelRepo.save(create("📊 strategy-sharing", "open", true, null, 0));
            channelRepo.save(create("💡 trade-ideas", "open", true, null, 0));
            channelRepo.save(create("🧠 ai-insights", "open", true, null, 0));
            channelRepo.save(create("🛠 feedback-bugs", "open", true, null, 0));
            channelRepo.save(create("📚 course-help", "open", true, null, 0));
            channelRepo.save(create("👑 staff-lounge", "admin-only", true, null, 0));

            // Link to real course IDs (must match DB records)
            seedCourseChannel(channelRepo, courseRepo, "📘 intro-to-trading", "intro-to-trading", "course", 0);
            seedCourseChannel(channelRepo, courseRepo, "📙 technical-analysis", "technical-analysis", "course", 0);
            seedCourseChannel(channelRepo, courseRepo, "📕 fundamental-analysis", "fundamental-analysis", "course", 0);
            seedCourseChannel(channelRepo, courseRepo, "📗 crypto-trading", "crypto-trading", "course", 0);
            seedCourseChannel(channelRepo, courseRepo, "📒 day-trading", "day-trading", "course", 0);
            seedCourseChannel(channelRepo, courseRepo, "📓 swing-trading", "swing-trading", "course", 0);
            seedCourseChannel(channelRepo, courseRepo, "📔 trading-psychology", "trading-psychology", "course", 0);
            seedCourseChannel(channelRepo, courseRepo, "📚 risk-management", "risk-management", "course", 0);
            seedCourseChannel(channelRepo, courseRepo, "📑 trading-plan", "trading-plan", "course", 0);
        };
    }

    private ChannelModel create(String name, String accessLevel, boolean hidden, CourseModel course, int minLevel) {
        ChannelModel ch = new ChannelModel();
        ch.setName(name);
        ch.setAccessLevel(accessLevel);
        ch.setHidden(hidden);
        ch.setCourse(course);
        ch.setMinLevel(minLevel);
        return ch;
    }

    private void seedCourseChannel(ChannelRepository channelRepo, CourseRepository courseRepo, String name, String courseId, String accessLevel, int minLevel) {
        Optional<CourseModel> courseOpt = courseRepo.findByCourseId(courseId);
        if (courseOpt.isPresent()) {
            CourseModel course = courseOpt.get();
            ChannelModel channel = create(name, accessLevel, false, course, minLevel);
            channelRepo.save(channel);
        } else {
            System.err.println("Course not found for channel: " + name + " (Course ID: " + courseId + ")");
        }
    }
}
