package com.shuttershot.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {

    @NotBlank(message = "Message is required")
    private String message;

    private List<ChatMessage> history;
}
