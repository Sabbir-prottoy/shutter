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
public class BlueBadgeHolderResponse {

    // The photographer's User id — matches what AdminUserService.remove/ban
    // and the rest of the admin panel address photographers by.
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String location;
    private BigDecimal amountPaid;
    private LocalDateTime purchasedAt;
}
