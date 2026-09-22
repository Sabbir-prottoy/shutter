package com.shuttershot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatSendResponse {

    private String reply;

    // Null for guests — nothing was stored, so there is no thread to return to.
    private Long conversationId;
    private String title;
}
