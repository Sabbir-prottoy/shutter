package com.shuttershot.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One turn of prior conversation, as sent back by the frontend on each
 * request (this API is stateless — no server-side chat session). role is
 * "user" or "model", matching Gemini's own content-role vocabulary directly
 * so no translation is needed when building the request.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    private String role;
    private String text;
}
