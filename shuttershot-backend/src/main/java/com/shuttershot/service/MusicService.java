package com.shuttershot.service;

import com.shuttershot.dto.CreateMusicSuggestionRequest;
import com.shuttershot.dto.MusicSuggestionResponse;
import com.shuttershot.exception.DuplicateResourceException;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.MusicSuggestion;
import com.shuttershot.repository.MusicSuggestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MusicService {

    private final MusicSuggestionRepository musicSuggestionRepository;

    // Grouped by lowercase category name (bangla / english / hindi / event) so
    // the frontend can index straight into it.
    @Transactional(readOnly = true)
    public Map<String, List<MusicSuggestionResponse>> listGrouped() {
        return musicSuggestionRepository.findAllByOrderByCategoryAscIdAsc().stream()
                .map(this::toResponse)
                .collect(Collectors.groupingBy(
                        MusicSuggestionResponse::getCategory, LinkedHashMap::new, Collectors.toList()));
    }

    @Transactional
    public MusicSuggestionResponse create(CreateMusicSuggestionRequest request) {
        String videoId = YouTubeLinks.extractVideoId(request.getYoutubeUrl())
                .orElseThrow(() -> new InvalidRequestException(
                        "That is not a YouTube video link. Paste the link of a single video, "
                                + "for example https://www.youtube.com/watch?v=..."));

        if (musicSuggestionRepository.existsByCategoryAndVideoId(request.getCategory(), videoId)) {
            throw new DuplicateResourceException("That video is already in this list");
        }

        String credit = request.getCredit() == null || request.getCredit().isBlank()
                ? null
                : request.getCredit().trim();

        MusicSuggestion saved = musicSuggestionRepository.save(MusicSuggestion.builder()
                .category(request.getCategory())
                .title(request.getTitle().trim())
                .credit(credit)
                .videoId(videoId)
                .build());
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        MusicSuggestion suggestion = musicSuggestionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Song not found with id: " + id));
        musicSuggestionRepository.delete(suggestion);
    }

    private MusicSuggestionResponse toResponse(MusicSuggestion suggestion) {
        return MusicSuggestionResponse.builder()
                .id(suggestion.getId())
                .category(suggestion.getCategory().name().toLowerCase())
                .title(suggestion.getTitle())
                .credit(suggestion.getCredit())
                .videoId(suggestion.getVideoId())
                .youtubeUrl(YouTubeLinks.watchUrl(suggestion.getVideoId()))
                .build();
    }
}
