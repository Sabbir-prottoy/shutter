package com.shuttershot.controller;

import com.shuttershot.dto.ChatRequest;
import com.shuttershot.dto.ChatResponse;
import com.shuttershot.service.ChatbotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/ask")
    public ResponseEntity<ChatResponse> ask(@Valid @RequestBody ChatRequest request) {
        String reply = chatbotService.ask(request.getMessage(), request.getHistory());
        return ResponseEntity.ok(ChatResponse.builder().reply(reply).build());
    }
}
