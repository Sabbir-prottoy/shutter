package com.shuttershot.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * One saved chat thread in the AI chat page's sidebar. Always belongs to a
 * signed-in user — guests can still chat, their turns just aren't stored.
 */
@Entity
@Table(name = "ai_chat_conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Taken from the opening question so the sidebar reads like the thread,
    // rather than making the user name every conversation.
    @Column(nullable = false, length = 120)
    private String title;

    // "text" or "voice". The typed chat and the spoken one keep separate
    // histories, so a voice thread doesn't surface in the text page's sidebar
    // where it couldn't be continued the same way.
    @Column(nullable = false, length = 10)
    @Builder.Default
    private String mode = "text";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Drives the sidebar ordering, so the thread you just replied in floats up.
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
