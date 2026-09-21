package com.shuttershot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

// One point on a monthly time series — reused for both count-based charts
// (signups) and amount-based charts (badge revenue) so the frontend's
// generic {label, value} bar chart can render either without a second type.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyValue {

    private String label;
    private BigDecimal value;
}
