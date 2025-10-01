package com.project.trading_platform_backend.repository;

import com.project.trading_platform_backend.model.MessageModel;
import com.project.trading_platform_backend.model.ChannelModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<MessageModel, Long> {
    List<MessageModel> findByChannel(ChannelModel channel);

    List<MessageModel> findByChannelOrderByTimestampAsc(ChannelModel channel);

    @Query("SELECT m FROM MessageModel m JOIN FETCH m.sender WHERE m.channel = :channel ORDER BY m.timestamp")
    List<MessageModel> findByChannelWithSender(@Param("channel") ChannelModel channel);
}
