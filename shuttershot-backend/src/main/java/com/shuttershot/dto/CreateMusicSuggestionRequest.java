package com.shuttershot.dto;

import com.shuttershot.model.MusicCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateMusicSuggestionRequest {

    @NotNull(message = "Choose where this song belongs")
    private MusicCategory category;

    @NotBlank(message = "Song name is required")
    @Size(max = 150, message = "Song name must be at most 150 characters")
    private String title;

    @Size(max = 150, message = "Artist must be at most 150 characters")
    private String credit;

    @NotBlank(message = "YouTube link is required")
    @Size(max = 300, message = "YouTube link is too long")
    private String youtubeUrl;
}
