package com.shuttershot.service;

import com.shuttershot.dto.BookingResponse;
import com.shuttershot.dto.CreateBookingRequest;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.Availability;
import com.shuttershot.model.AvailabilityStatus;
import com.shuttershot.model.Booking;
import com.shuttershot.model.BookingStatus;
import com.shuttershot.model.Package;
import com.shuttershot.model.PhotographerProfile;
import com.shuttershot.repository.AvailabilityRepository;
import com.shuttershot.repository.BookingRepository;
import com.shuttershot.repository.PackageRepository;
import com.shuttershot.repository.PhotographerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PackageRepository packageRepository;
    private final PhotographerProfileRepository photographerProfileRepository;
    private final AvailabilityRepository availabilityRepository;
    private final OtpService otpService;

    @Transactional
    public BookingResponse create(CreateBookingRequest request) {
        PhotographerProfile photographer = photographerProfileRepository.findById(request.getPhotographerId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Photographer not found with id: " + request.getPhotographerId()));

        Package pkg = packageRepository.findById(request.getPackageId())
                .orElseThrow(() -> new ResourceNotFoundException("Package not found with id: " + request.getPackageId()));

        if (!pkg.getPhotographer().getId().equals(photographer.getId())) {
            throw new InvalidRequestException("Selected package does not belong to the selected photographer");
        }

        if (request.getBookingDate().isBefore(LocalDate.now())) {
            throw new InvalidRequestException("Booking date cannot be in the past");
        }

        availabilityRepository.findByPhotographerIdAndDate(photographer.getId(), request.getBookingDate())
                .filter(availability -> availability.getStatus() != AvailabilityStatus.FREE)
                .ifPresent(availability -> {
                    throw new InvalidRequestException("Photographer is not available on the selected date");
                });

        Booking booking = Booking.builder()
                .photographer(photographer)
                .servicePackage(pkg)
                .clientName(request.getClientName())
                .clientPhone(request.getClientPhone())
                .clientEmail(request.getClientEmail())
                .bookingDate(request.getBookingDate())
                .timeSlot(request.getTimeSlot())
                .status(BookingStatus.PENDING)
                .otpVerified(false)
                .build();
        booking = bookingRepository.save(booking);

        markDate(photographer, request.getBookingDate(), AvailabilityStatus.BOOKED);
        otpService.sendOtp(request.getClientPhone());

        return toResponse(booking);
    }

    @Transactional
    public BookingResponse confirmOtp(Long bookingId, String otpCode) {
        Booking booking = findById(bookingId);

        if (!otpService.verifyOtp(booking.getClientPhone(), otpCode)) {
            throw new InvalidRequestException("Invalid or expired OTP code");
        }

        booking.setOtpVerified(true);
        return toResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> listByPhotographer(Long photographerId, Long authenticatedUserId) {
        PhotographerProfile owner = findOwnProfile(authenticatedUserId);
        if (!owner.getId().equals(photographerId)) {
            throw new AccessDeniedException("You can only view your own bookings");
        }

        return bookingRepository.findByPhotographerId(photographerId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public BookingResponse updateStatus(Long bookingId, BookingStatus newStatus, Long authenticatedUserId) {
        Booking booking = findById(bookingId);
        PhotographerProfile owner = findOwnProfile(authenticatedUserId);

        if (!booking.getPhotographer().getId().equals(owner.getId())) {
            throw new AccessDeniedException("You can only manage your own bookings");
        }

        validateTransition(booking.getStatus(), newStatus);

        if (newStatus == BookingStatus.CONFIRMED && !booking.isOtpVerified()) {
            throw new InvalidRequestException("Cannot confirm a booking whose contact has not been OTP-verified");
        }

        booking.setStatus(newStatus);

        if (newStatus == BookingStatus.CANCELLED) {
            markDate(booking.getPhotographer(), booking.getBookingDate(), AvailabilityStatus.FREE);
        }

        return toResponse(booking);
    }

    private void validateTransition(BookingStatus current, BookingStatus next) {
        boolean valid = switch (current) {
            case PENDING -> next == BookingStatus.CONFIRMED || next == BookingStatus.CANCELLED;
            case CONFIRMED -> next == BookingStatus.COMPLETED || next == BookingStatus.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
        if (!valid) {
            throw new InvalidRequestException("Cannot change booking status from " + current + " to " + next);
        }
    }

    private void markDate(PhotographerProfile photographer, LocalDate date, AvailabilityStatus status) {
        Availability availability = availabilityRepository.findByPhotographerIdAndDate(photographer.getId(), date)
                .orElseGet(() -> Availability.builder().photographer(photographer).date(date).build());
        availability.setStatus(status);
        availabilityRepository.save(availability);
    }

    private Booking findById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    private PhotographerProfile findOwnProfile(Long authenticatedUserId) {
        return photographerProfileRepository.findByUserId(authenticatedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Photographer profile not found for current user"));
    }

    private BookingResponse toResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .photographerId(booking.getPhotographer().getId())
                .packageId(booking.getServicePackage().getId())
                .clientName(booking.getClientName())
                .clientPhone(booking.getClientPhone())
                .clientEmail(booking.getClientEmail())
                .bookingDate(booking.getBookingDate())
                .timeSlot(booking.getTimeSlot())
                .status(booking.getStatus())
                .otpVerified(booking.isOtpVerified())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
