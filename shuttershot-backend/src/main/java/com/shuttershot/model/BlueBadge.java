package com.shuttershot.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// One row per photographer who has ever purchased the blue (verified) badge.
// Revoking or letting it lapse sets active=false rather than deleting the
// row, so purchase history (amount paid, when) survives — and repurchasing
// reuses the same row. PhotographerProfile.hasBlueBadge mirrors `active` for
// fast reads; this table is the source of truth.
@Entity
@Table(name = "blue_badges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlueBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "photographer_id", nullable = false, unique = true)
    private PhotographerProfile photographer;

    @Column(name = "amount_paid", nullable = false, precision = 10, scale = 2)
    private BigDecimal amountPaid;

    @Column(name = "purchased_at", nullable = false)
    private LocalDateTime purchasedAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
