package com.shuttershot.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One prior turn, resent by guests whose chats aren't stored server-side. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AiChatTurn {

    private String role;
    private String content;
}
