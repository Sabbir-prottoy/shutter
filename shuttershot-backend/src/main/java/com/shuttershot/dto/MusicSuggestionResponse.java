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
public class MusicSuggestionResponse {

    private Long id;
    private String category;
    private String title;
    private String credit;
    private String videoId;
    private String youtubeUrl;
}
