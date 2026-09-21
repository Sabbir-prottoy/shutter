package com.shuttershot.service;

import com.shuttershot.dto.AdminOverviewResponse;
import com.shuttershot.dto.MonthlyValue;
import com.shuttershot.dto.TopEarnerResponse;
import com.shuttershot.model.Booking;
import com.shuttershot.model.BlueBadge;
import com.shuttershot.model.BookingStatus;
import com.shuttershot.model.Role;
import com.shuttershot.model.User;
import com.shuttershot.repository.BlueBadgeRepository;
import com.shuttershot.repository.BookingRepository;
import com.shuttershot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

// Read-only reporting for the admin panel's "Overview" page — open to any
// ADMIN or MODERATOR (unlike blue-badge pricing or staff management, which
// are main-admin-only), since it's just numbers, not a sensitive action.
@Service
@RequiredArgsConstructor
public class AdminOverviewService {

    private static final Set<BookingStatus> EARNED_STATUSES = EnumSet.of(BookingStatus.CONFIRMED, BookingStatus.COMPLETED);
    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("MMM yyyy");

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final BlueBadgeRepository blueBadgeRepository;

    @Transactional(readOnly = true)
    public AdminOverviewResponse getOverview() {
        List<User> photographers = userRepository.findByRole(Role.PHOTOGRAPHER);
        List<User> customers = userRepository.findByRole(Role.CUSTOMER);
        List<Booking> allBookings = bookingRepository.findAll();
        List<BlueBadge> allBadges = blueBadgeRepository.findAll();
        long activeBadgeCount = allBadges.stream().filter(BlueBadge::isActive).count();

        List<Booking> earnedBookings = allBookings.stream()
                .filter(b -> EARNED_STATUSES.contains(b.getStatus()))
                .toList();

        BigDecimal totalBookingValue = earnedBookings.stream()
                .map(b -> b.getServicePackage().getPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Revenue ever collected, including from badges later revoked —
        // revoking doesn't refund, so it stays counted.
        BigDecimal totalBadgeRevenue = allBadges.stream()
                .map(BlueBadge::getAmountPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<YearMonth> months = last12Months();

        return AdminOverviewResponse.builder()
                .totalPhotographers(photographers.size())
                .totalCustomers(customers.size())
                .activeBlueBadges(activeBadgeCount)
                .totalBadgeRevenue(totalBadgeRevenue)
                .totalBookingValue(totalBookingValue)
                .totalBookings(allBookings.size())
                .photographerSignups(monthlyCounts(photographers.stream().map(User::getCreatedAt).toList(), months))
                .customerSignups(monthlyCounts(customers.stream().map(User::getCreatedAt).toList(), months))
                .badgeRevenueByMonth(monthlyBadgeRevenue(allBadges, months))
                .topEarners(topEarners(earnedBookings))
                .bookingStatusBreakdown(bookingStatusBreakdown(allBookings))
                .build();
    }

    private List<YearMonth> last12Months() {
        YearMonth current = YearMonth.now();
        return IntStream.rangeClosed(0, 11)
                .mapToObj(i -> current.minusMonths(11 - i))
                .toList();
    }

    private List<MonthlyValue> monthlyCounts(List<LocalDateTime> timestamps, List<YearMonth> months) {
        Map<YearMonth, Long> counts = timestamps.stream()
                .collect(Collectors.groupingBy(YearMonth::from, Collectors.counting()));
        return months.stream()
                .map(m -> MonthlyValue.builder()
                        .label(m.format(MONTH_LABEL))
                        .value(BigDecimal.valueOf(counts.getOrDefault(m, 0L)))
                        .build())
                .toList();
    }

    private List<MonthlyValue> monthlyBadgeRevenue(List<BlueBadge> badges, List<YearMonth> months) {
        Map<YearMonth, BigDecimal> sums = badges.stream()
                .collect(Collectors.groupingBy(
                        b -> YearMonth.from(b.getPurchasedAt()),
                        Collectors.reducing(BigDecimal.ZERO, BlueBadge::getAmountPaid, BigDecimal::add)));
        return months.stream()
                .map(m -> MonthlyValue.builder()
                        .label(m.format(MONTH_LABEL))
                        .value(sums.getOrDefault(m, BigDecimal.ZERO))
                        .build())
                .toList();
    }

    private List<TopEarnerResponse> topEarners(List<Booking> earnedBookings) {
        record Totals(BigDecimal earned, long count) {
        }

        Map<String, Totals> byPhotographer = new LinkedHashMap<>();
        for (Booking booking : earnedBookings) {
            String name = booking.getPhotographer().getUser().getName();
            BigDecimal price = booking.getServicePackage().getPrice();
            byPhotographer.merge(name, new Totals(price, 1),
                    (a, b) -> new Totals(a.earned().add(b.earned()), a.count() + b.count()));
        }

        return byPhotographer.entrySet().stream()
                .sorted(Comparator.comparing((Map.Entry<String, Totals> e) -> e.getValue().earned()).reversed())
                .limit(5)
                .map(e -> TopEarnerResponse.builder()
                        .name(e.getKey())
                        .totalEarned(e.getValue().earned())
                        .confirmedBookings(e.getValue().count())
                        .build())
                .toList();
    }

    private Map<String, Long> bookingStatusBreakdown(List<Booking> allBookings) {
        Map<String, Long> breakdown = new LinkedHashMap<>();
        for (BookingStatus status : BookingStatus.values()) {
            long count = allBookings.stream().filter(b -> b.getStatus() == status).count();
            breakdown.put(status.name(), count);
        }
        return breakdown;
    }
}
