package com.shuttershot.repository;

import com.shuttershot.model.BookingMoneySettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingMoneySettingsRepository extends JpaRepository<BookingMoneySettings, Long> {
}
