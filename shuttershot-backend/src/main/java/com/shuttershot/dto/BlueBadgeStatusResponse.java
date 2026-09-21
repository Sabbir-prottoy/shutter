package com.shuttershot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlueBadgeStatusResponse {

    private BigDecimal currentPrice;
    private boolean hasBadge;
    private BigDecimal amountPaid;
    private LocalDateTime purchasedAt;
}
