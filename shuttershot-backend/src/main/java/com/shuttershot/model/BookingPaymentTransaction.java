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

// One row per SSLCommerz checkout session opened for a booking's 10% deposit.
// Mirrors BlueBadgeTransaction's lifecycle: created PENDING when checkout starts,
// flipped to VALID only after SSLCommerz's validation API confirms the payment
// server-side. See BookingService for how a VALID transaction marks the booking
// deposit as paid.
@Entity
@Table(name = "booking_payment_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingPaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tran_id", nullable = false, unique = true)
    private String tranId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    @Builder.Default
    private String currency = "BDT";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @ColumnDefault("'PENDING'")
    @Builder.Default
    private BookingPaymentStatus status = BookingPaymentStatus.PENDING;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;
}
