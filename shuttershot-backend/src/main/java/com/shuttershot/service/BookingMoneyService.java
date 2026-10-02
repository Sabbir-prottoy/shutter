package com.shuttershot.service;

import com.shuttershot.model.BookingMoneySettings;
import com.shuttershot.repository.BookingMoneySettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

// The deposit percentage a client pays when booking a photographer. Changing
// it only affects bookings made afterwards — every booking stores the amount
// (and percentage) it was quoted at creation time.
@Service
@RequiredArgsConstructor
public class BookingMoneyService {

    private static final Long SETTINGS_ID = 1L;

    // What the rate was before it became configurable, so nothing changes
    // until an admin sets a different one.
    private static final BigDecimal DEFAULT_PERCENT = new BigDecimal("10.00");

    private final BookingMoneySettingsRepository bookingMoneySettingsRepository;
    private final MainAdminGuard mainAdminGuard;

    // Never writes: until an admin first saves a value there is simply no row,
    // and the default applies. Safe to call from inside any transaction.
    @Transactional(readOnly = true)
    public BigDecimal getCurrentPercent() {
        return bookingMoneySettingsRepository.findById(SETTINGS_ID)
                .map(BookingMoneySettings::getDepositPercent)
                .orElse(DEFAULT_PERCENT);
    }

    @Transactional(readOnly = true)
    public BigDecimal getPercentForAdmin(Long actingAdminId) {
        mainAdminGuard.require(actingAdminId, "view the booking money percentage");
        return getCurrentPercent();
    }

    @Transactional
    public BigDecimal updatePercent(BigDecimal newPercent, Long actingAdminId) {
        mainAdminGuard.require(actingAdminId, "change the booking money percentage");

        BookingMoneySettings settings = bookingMoneySettingsRepository.findById(SETTINGS_ID)
                .orElseGet(() -> BookingMoneySettings.builder().id(SETTINGS_ID).build());
        settings.setDepositPercent(newPercent.setScale(2, RoundingMode.HALF_UP));
        settings.setUpdatedAt(LocalDateTime.now());
        return bookingMoneySettingsRepository.save(settings).getDepositPercent();
    }
}
