package com.shuttershot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminOverviewResponse {

    // Stat tiles
    private long totalPhotographers;
    private long totalCustomers;
    private long activeBlueBadges;
    private BigDecimal totalBadgeRevenue;
    private BigDecimal totalBookingValue;
    private long totalBookings;

    // Charts
    private List<MonthlyValue> photographerSignups;
    private List<MonthlyValue> customerSignups;
    private List<MonthlyValue> badgeRevenueByMonth;
    private List<TopEarnerResponse> topEarners;
    private Map<String, Long> bookingStatusBreakdown;
}
