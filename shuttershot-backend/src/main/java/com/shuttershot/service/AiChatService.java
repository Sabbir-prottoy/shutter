package com.shuttershot.service;

import com.shuttershot.dto.AiChatConversationResponse;
import com.shuttershot.dto.AiChatMessageResponse;
import com.shuttershot.dto.AiChatSendRequest;
import com.shuttershot.dto.AiChatSendResponse;
import com.shuttershot.dto.AiChatTurn;
import com.shuttershot.dto.PhotographerSummaryResponse;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.AiChatConversation;
import com.shuttershot.model.AiChatMessage;
import com.shuttershot.model.User;
import com.shuttershot.repository.AiChatConversationRepository;
import com.shuttershot.repository.AiChatMessageRepository;
import com.shuttershot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Drives the full-page AI chat. Signed-in users get their threads stored and
 * listed in the sidebar; guests can still chat, but nothing is kept, so their
 * running conversation comes back with each request instead.
 */
@Service
@RequiredArgsConstructor
public class AiChatService {

    // Groq's free tier allows 8,000 tokens per minute across the prompt and the
    // reply combined, so the prompt has to stay small or the chat spends most of
    // its time rate-limited. These three limits are what keep a request near
    // ~2k tokens instead of the ~5k an exhaustive listing costs.
    private static final int HISTORY_TURNS = 8;
    private static final int MAX_LISTED_PHOTOGRAPHERS = 40;
    private static final int TITLE_MAX = 60;

    private final AiChatConversationRepository conversationRepository;
    private final AiChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final GroqChatService groqChatService;
    private final PhotographerService photographerService;

    @Transactional
    public AiChatSendResponse send(AiChatSendRequest request, Long userId) {
        String question = request.getMessage().trim();

        if (userId == null) {
            return sendAsGuest(request, question);
        }
        return sendAsMember(request, question, userId, normaliseMode(request.getMode()));
    }

    private AiChatSendResponse sendAsGuest(AiChatSendRequest request, String question) {
        List<Map<String, String>> history = new ArrayList<>();
        if (request.getHistory() != null) {
            List<AiChatTurn> turns = request.getHistory();
            for (AiChatTurn turn : turns.subList(Math.max(0, turns.size() - HISTORY_TURNS), turns.size())) {
                history.add(Map.of("role", normaliseRole(turn.getRole()), "content", turn.getContent()));
            }
        }

        String reply = groqChatService.ask(buildContext(), history, question);
        return AiChatSendResponse.builder().reply(reply).build();
    }

    private AiChatSendResponse sendAsMember(
            AiChatSendRequest request, String question, Long userId, String mode) {
        AiChatConversation conversation = request.getConversationId() == null
                ? startConversation(userId, question, mode)
                : conversationRepository.findByIdAndUserId(request.getConversationId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        List<Map<String, String>> history = new ArrayList<>();
        List<AiChatMessage> stored = messageRepository.findByConversationIdOrderByIdAsc(conversation.getId());
        for (AiChatMessage message : stored.subList(Math.max(0, stored.size() - HISTORY_TURNS), stored.size())) {
            history.add(Map.of("role", message.getRole(), "content", message.getContent()));
        }

        String reply = groqChatService.ask(buildContext(), history, question);

        messageRepository.save(AiChatMessage.builder()
                .conversation(conversation).role("user").content(question).build());
        messageRepository.save(AiChatMessage.builder()
                .conversation(conversation).role("assistant").content(reply).build());

        // Touch the thread so it sorts to the top of the sidebar. @UpdateTimestamp
        // only fires when the row itself changes, and adding messages doesn't.
        conversation.setUpdatedAt(LocalDateTime.now());

        return AiChatSendResponse.builder()
                .reply(reply)
                .conversationId(conversation.getId())
                .title(conversation.getTitle())
                .build();
    }

    private AiChatConversation startConversation(Long userId, String firstQuestion, String mode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return conversationRepository.save(AiChatConversation.builder()
                .user(user)
                .title(titleFrom(firstQuestion))
                .mode(mode)
                .build());
    }

    private String normaliseMode(String mode) {
        return "voice".equalsIgnoreCase(mode) ? "voice" : "text";
    }

    /** Names the thread after its opening question, so the sidebar reads like the chat. */
    private String titleFrom(String question) {
        String cleaned = question.replaceAll("\\s+", " ").trim();
        if (cleaned.isEmpty()) {
            return "New chat";
        }
        return cleaned.length() <= TITLE_MAX ? cleaned : cleaned.substring(0, TITLE_MAX - 1).trim() + "…";
    }

    private String normaliseRole(String role) {
        return "assistant".equalsIgnoreCase(role) ? "assistant" : "user";
    }

    /**
     * A deliberately lean grounding prompt: one line per photographer and no
     * per-date availability.
     *
     * <p>The floating widget's context lists every package and every booked
     * date, which runs to roughly 5,000 tokens here — most of one minute's
     * entire allowance on a single message, leaving the chat rate-limited after
     * one exchange. It also costs two extra queries per photographer per
     * message. Exact packages and dates live on the profile page, so this
     * points there instead of inlining them.
     */
    private String buildContext() {
        List<PhotographerSummaryResponse> photographers = photographerService.search(null, null, null);

        StringBuilder sb = new StringBuilder();
        sb.append("You are the ShutterShot assistant. ShutterShot is a Bangladesh marketplace for ")
                .append("booking verified local photographers. Prices are in BDT (Bangladeshi taka).\n")
                .append("Answer using ONLY the photographers listed below — never invent a name, ")
                .append("a price or a date. For exact package prices and open dates, tell the person ")
                .append("to open that photographer's profile page, where they can also book. ")
                .append("Keep answers short and friendly, and use a bullet list when naming several ")
                .append("photographers.\n\n");

        if (photographers.isEmpty()) {
            sb.append("There are no photographers listed on the site yet.\n");
            return sb.toString();
        }

        sb.append("Photographers (").append(photographers.size()).append(" total):\n");
        for (PhotographerSummaryResponse photographer : photographers.stream()
                .limit(MAX_LISTED_PHOTOGRAPHERS).toList()) {
            sb.append("- ").append(photographer.getName())
                    .append(" (id ").append(photographer.getId()).append("), ")
                    .append(blankToPlaceholder(photographer.getBaseLocation(), "location not listed"))
                    .append(", ")
                    .append(photographer.getSpecialties() == null || photographer.getSpecialties().isEmpty()
                            ? "no specialties listed" : String.join("/", photographer.getSpecialties()))
                    .append(", rated ").append(photographer.getRatingAvg())
                    .append(photographer.isVerified() ? ", verified" : "")
                    .append("\n");
        }

        if (photographers.size() > MAX_LISTED_PHOTOGRAPHERS) {
            sb.append("…and ").append(photographers.size() - MAX_LISTED_PHOTOGRAPHERS)
                    .append(" more. If none of the above fit, suggest the Find a photographer ")
                    .append("page to filter by district and style.\n");
        }

        return sb.toString();
    }

    private String blankToPlaceholder(String value, String placeholder) {
        return (value == null || value.isBlank()) ? placeholder : value;
    }

    @Transactional(readOnly = true)
    public List<AiChatConversationResponse> listConversations(Long userId, String mode) {
        return conversationRepository
                .findByUserIdAndModeOrderByUpdatedAtDesc(userId, normaliseMode(mode)).stream()
                .map(conversation -> AiChatConversationResponse.builder()
                        .id(conversation.getId())
                        .title(conversation.getTitle())
                        .createdAt(conversation.getCreatedAt())
                        .updatedAt(conversation.getUpdatedAt())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AiChatMessageResponse> listMessages(Long conversationId, Long userId) {
        AiChatConversation conversation = conversationRepository.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        return messageRepository.findByConversationIdOrderByIdAsc(conversation.getId()).stream()
                .map(message -> AiChatMessageResponse.builder()
                        .id(message.getId())
                        .role(message.getRole())
                        .content(message.getContent())
                        .createdAt(message.getCreatedAt())
                        .build())
                .toList();
    }

    @Transactional
    public void deleteConversation(Long conversationId, Long userId) {
        AiChatConversation conversation = conversationRepository.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        messageRepository.deleteByConversationId(conversation.getId());
        conversationRepository.delete(conversation);
    }
}
