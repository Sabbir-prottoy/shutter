package com.shuttershot.controller;

import com.shuttershot.dto.AiChatConversationResponse;
import com.shuttershot.dto.AiChatMessageResponse;
import com.shuttershot.dto.AiChatSendRequest;
import com.shuttershot.dto.AiChatSendResponse;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.service.AiChatService;
import com.shuttershot.service.GroqTranscriptionService;
import com.shuttershot.service.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai-chat")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;
    private final GroqTranscriptionService groqTranscriptionService;

    /**
     * Open to guests as well as members — anyone can chat. The difference is
     * that a signed-in caller's thread is stored and shows up in their sidebar,
     * while a guest's is not, so the principal is optional here.
     */
    @PostMapping("/messages")
    public ResponseEntity<AiChatSendResponse> send(
            @Valid @RequestBody AiChatSendRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(aiChatService.send(request, principal == null ? null : principal.getId()));
    }

    /**
     * Transcribes a recording from the spoken chat. Open to guests, like
     * sending a message is — only the stored history needs an account.
     */
    @PostMapping("/transcribe")
    public ResponseEntity<Map<String, String>> transcribe(@RequestParam("audio") MultipartFile audio) {
        try {
            String filename = audio.getOriginalFilename();
            String text = groqTranscriptionService.transcribe(
                    audio.getBytes(), filename == null || filename.isBlank() ? "speech.webm" : filename);
            return ResponseEntity.ok(Map.of("text", text));
        } catch (IOException ex) {
            throw new InvalidRequestException("We couldn't read that recording. Please try again.");
        }
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<AiChatConversationResponse>> conversations(
            @RequestParam(required = false) String mode,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(aiChatService.listConversations(principal.getId(), mode));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<List<AiChatMessageResponse>> messages(
            @PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(aiChatService.listMessages(id, principal.getId()));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        aiChatService.deleteConversation(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
