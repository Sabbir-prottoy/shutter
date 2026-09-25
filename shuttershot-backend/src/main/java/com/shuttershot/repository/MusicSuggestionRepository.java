package com.shuttershot.repository;

import com.shuttershot.model.MusicCategory;
import com.shuttershot.model.MusicSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MusicSuggestionRepository extends JpaRepository<MusicSuggestion, Long> {

    // Insertion order within a category, so a newly added song lands at the end.
    List<MusicSuggestion> findAllByOrderByCategoryAscIdAsc();

    boolean existsByCategoryAndVideoId(MusicCategory category, String videoId);
}
