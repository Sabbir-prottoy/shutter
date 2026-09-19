package com.shuttershot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackageResponse {

    private Long id;
    private Long photographerId;
    private String title;
    private String description;
    private BigDecimal price;
    private Integer durationHours;
    private Integer deliveryDays;
}
