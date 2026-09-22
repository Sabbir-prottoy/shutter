package com.shuttershot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AiChatSendRequest {

    @NotBlank(message = "Message cannot be empty")
    @Size(max = 4000, message = "Message is too long")
    private String message;

    // Signed-in users only: which stored thread to continue. Null starts a new one.
    private Long conversationId;

    // "text" or "voice" — keeps the two pages' histories apart. Defaults to
    // text when absent.
    private String mode;

    // Guests only: the running conversation, since nothing is stored for them.
    // Ignored when the caller is signed in, whose history comes from the database.
    private List<AiChatTurn> history;
}
