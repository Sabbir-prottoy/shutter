package com.shuttershot.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePackageRequest {

    private String title;

    private String description;

    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than zero")
    private BigDecimal price;

    @Min(value = 1, message = "Duration must be at least 1 hour")
    private Integer durationHours;

    @Min(value = 0, message = "Delivery days cannot be negative")
    private Integer deliveryDays;
}
