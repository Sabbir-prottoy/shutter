package com.shuttershot.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBookingMoneySettingsRequest {

    // At least 1%: a deposit of nothing would leave the payment gateway with
    // an amount of zero to charge. At most 100%: the whole package price up front.
    @NotNull(message = "Percentage is required")
    @DecimalMin(value = "1", message = "Percentage must be at least 1")
    @DecimalMax(value = "100", message = "Percentage cannot be more than 100")
    @Digits(integer = 3, fraction = 2, message = "Percentage can have at most 2 decimal places")
    private BigDecimal percent;
}
