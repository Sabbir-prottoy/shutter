package com.shuttershot.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

// One song (wedding) or background track (event) listed under "Music
// suggestions" on the public Suggestions page, managed from the admin
// "Manage Music" panel. Only the YouTube video id is stored; the page links out
// to YouTube and never plays anything itself.
@Entity
@Table(name = "music_suggestions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MusicSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MusicCategory category;

    @Column(nullable = false, length = 150)
    private String title;

    // Artist, film, or music library - shown beneath the title.
    @Column(length = 150)
    private String credit;

    @Column(name = "video_id", nullable = false, length = 20)
    private String videoId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
