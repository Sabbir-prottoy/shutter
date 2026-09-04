package com.shuttershot.service;

import com.shuttershot.dto.AvailabilityResponse;
import com.shuttershot.dto.UpdateAvailabilityRequest;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.Availability;
import com.shuttershot.model.AvailabilityStatus;
import com.shuttershot.model.PhotographerProfile;
import com.shuttershot.repository.AvailabilityRepository;
import com.shuttershot.repository.PhotographerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private static final int DEFAULT_RANGE_DAYS = 30;

    private final AvailabilityRepository availabilityRepository;
    private final PhotographerProfileRepository photographerProfileRepository;

    @Transactional(readOnly = true)
    public List<AvailabilityResponse> getAvailability(Long photographerId, LocalDate from, LocalDate to) {
        LocalDate rangeStart = from != null ? from : LocalDate.now();
        LocalDate rangeEnd = to != null ? to : rangeStart.plusDays(DEFAULT_RANGE_DAYS);

        if (rangeEnd.isBefore(rangeStart)) {
            throw new InvalidRequestException("`to` date cannot be before `from` date");
        }

        return availabilityRepository.findByPhotographerIdAndDateBetween(photographerId, rangeStart, rangeEnd).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AvailabilityResponse setAvailability(LocalDate date, UpdateAvailabilityRequest request, Long authenticatedUserId) {
        if (request.getStatus() != AvailabilityStatus.FREE && request.getStatus() != AvailabilityStatus.BLOCKED) {
            throw new InvalidRequestException(
                    "Status must be FREE or BLOCKED; BOOKED is set automatically when a booking is made");
        }
        if (date.isBefore(LocalDate.now())) {
            throw new InvalidRequestException("Cannot set availability for a past date");
        }

        PhotographerProfile photographer = photographerProfileRepository.findByUserId(authenticatedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Photographer profile not found for current user"));

        Availability availability = availabilityRepository.findByPhotographerIdAndDate(photographer.getId(), date)
                .orElseGet(() -> Availability.builder()
                        .photographer(photographer)
                        .date(date)
                        .build());

        if (availability.getStatus() == AvailabilityStatus.BOOKED) {
            throw new InvalidRequestException("Cannot change a date that is already booked");
        }

        availability.setStatus(request.getStatus());
        return toResponse(availabilityRepository.save(availability));
    }

    private AvailabilityResponse toResponse(Availability availability) {
        return AvailabilityResponse.builder()
                .photographerId(availability.getPhotographer().getId())
                .date(availability.getDate())
                .status(availability.getStatus())
                .build();
    }
}
