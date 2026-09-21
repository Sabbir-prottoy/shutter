package com.shuttershot.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// Singleton row (id is always 1) holding the current blue-badge price —
// admin-configurable, read by every photographer's badge page. See
// BlueBadgeService.getOrCreateSettings for how the row gets created.
@Entity
@Table(name = "blue_badge_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlueBadgeSettings {

    @Id
    private Long id;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
