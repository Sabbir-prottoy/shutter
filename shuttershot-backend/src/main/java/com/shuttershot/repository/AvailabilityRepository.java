package com.shuttershot.repository;

import com.shuttershot.model.Availability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AvailabilityRepository extends JpaRepository<Availability, Long> {

    Optional<Availability> findByPhotographerIdAndDate(Long photographerId, LocalDate date);

    List<Availability> findByPhotographerIdAndDateBetween(Long photographerId, LocalDate from, LocalDate to);
}
