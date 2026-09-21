package com.shuttershot.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// One row per SSLCommerz checkout session we've initiated for a blue badge
// purchase. Created PENDING when the photographer starts checkout; flipped to
// VALID only after SSLCommerz's validation API confirms the payment server-side
// (never trust the success_url redirect alone — it's just a browser hop, not
// proof of payment). FAILED/CANCELLED are terminal, non-retryable states for
// that specific tran_id; a retry creates a new row with a new tran_id.
@Entity
@Table(name = "blue_badge_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlueBadgeTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tran_id", nullable = false, unique = true)
    private String tranId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "photographer_id", nullable = false)
    private PhotographerProfile photographer;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    @Builder.Default
    private String currency = "BDT";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @ColumnDefault("'PENDING'")
    @Builder.Default
    private BlueBadgeTransactionStatus status = BlueBadgeTransactionStatus.PENDING;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;
}
