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

// Singleton row (id is always 1) holding the booking deposit percentage —
// admin-configurable, read whenever a client books a photographer. See
// BookingMoneyService for how the row gets created and what the default is.
@Entity
@Table(name = "booking_money_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingMoneySettings {

    @Id
    private Long id;

    @Column(name = "deposit_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal depositPercent;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
