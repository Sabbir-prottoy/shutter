package com.shuttershot.repository;

import com.shuttershot.model.AiChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiChatMessageRepository extends JpaRepository<AiChatMessage, Long> {

    List<AiChatMessage> findByConversationIdOrderByIdAsc(Long conversationId);

    void deleteByConversationId(Long conversationId);
}
