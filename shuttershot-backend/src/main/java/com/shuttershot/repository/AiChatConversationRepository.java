package com.shuttershot.repository;

import com.shuttershot.model.AiChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AiChatConversationRepository extends JpaRepository<AiChatConversation, Long> {

    // Most recently used thread first, matching the sidebar's order. Scoped by
    // mode so the typed and spoken pages list only their own threads.
    List<AiChatConversation> findByUserIdAndModeOrderByUpdatedAtDesc(Long userId, String mode);

    // Scoped by user as well as id so one account can never open another's thread.
    Optional<AiChatConversation> findByIdAndUserId(Long id, Long userId);
}
