package com.project.trading_platform_backend.service;

import com.project.trading_platform_backend.model.ChannelModel;
import com.project.trading_platform_backend.repository.ChannelRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ChannelService {

    private final ChannelRepository channelRepository;

    public ChannelService(ChannelRepository channelRepository) {
        this.channelRepository = channelRepository;
    }

    public List<ChannelModel> getAllChannels() {
        return channelRepository.findAll();
    }

    public Optional<ChannelModel> getByName(String name) {
        return channelRepository.findByName(name);
    }

    public ChannelModel createChannel(ChannelModel channel) {
        return channelRepository.save(channel);
    }

    public boolean deleteChannel(Long id) {
        if (channelRepository.existsById(id)) {
            channelRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
