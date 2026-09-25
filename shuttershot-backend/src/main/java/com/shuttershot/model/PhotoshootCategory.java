package com.shuttershot.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

// A card in the Suggestions page's "Photoshoot category overview", managed from
// the admin "Photoshoot category manage" panel. The four categories photographer
// search is built on (wedding, portrait, event, landscape) live here too, marked
// by a searchValue: their text can be edited, but they cannot be removed.
@Entity
@Table(name = "photoshoot_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhotoshootCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(length = 160)
    private String summary;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String details;

    // One "good for" item per line.
    @Column(name = "good_for", columnDefinition = "TEXT")
    private String goodFor;

    @Column(name = "look_for", length = 400)
    private String lookFor;

    // The ?category= value photographer search uses. Set only on the four
    // built-in categories; null on categories an admin added.
    @Column(name = "search_value", length = 30, unique = true)
    private String searchValue;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
