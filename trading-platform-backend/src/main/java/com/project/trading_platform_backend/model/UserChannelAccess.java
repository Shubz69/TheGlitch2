package com.project.trading_platform_backend.model;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "user_channel_access")
@IdClass(UserChannelAccess.UserChannelId.class)
public class UserChannelAccess {

    // Composite primary key class
    public static class UserChannelId implements Serializable {
        private Long user;
        private Long channel;
        
        public UserChannelId() {}
        
        public UserChannelId(Long userId, Long channelId) {
            this.user = userId;
            this.channel = channelId;
        }
        
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            UserChannelId that = (UserChannelId) o;
            return Objects.equals(user, that.user) && 
                   Objects.equals(channel, that.channel);
        }
        
        @Override
        public int hashCode() {
            return Objects.hash(user, channel);
        }
    }

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserModel user;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private ChannelModel channel;

    // Constructors
    public UserChannelAccess() {}

    public UserChannelAccess(UserModel user, ChannelModel channel) {
        this.user = user;
        this.channel = channel;
    }

    // Getters and Setters
    public UserModel getUser() {
        return user;
    }

    public void setUser(UserModel user) {
        this.user = user;
    }

    public ChannelModel getChannel() {
        return channel;
    }

    public void setChannel(ChannelModel channel) {
        this.channel = channel;
    }
}
