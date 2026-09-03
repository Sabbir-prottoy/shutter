package com.shuttershot.controller;

import com.shuttershot.dto.BookingResponse;
import com.shuttershot.dto.ConfirmOtpRequest;
import com.shuttershot.dto.CreateBookingRequest;
import com.shuttershot.dto.UpdateBookingStatusRequest;
import com.shuttershot.service.BookingService;
import com.shuttershot.service.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> create(@Valid @RequestBody CreateBookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.create(request));
    }

    @PostMapping("/{id}/confirm-otp")
    public ResponseEntity<BookingResponse> confirmOtp(
            @PathVariable Long id,
            @Valid @RequestBody ConfirmOtpRequest request) {
        return ResponseEntity.ok(bookingService.confirmOtp(id, request.getOtpCode()));
    }

    @GetMapping
    public ResponseEntity<List<BookingResponse>> list(
            @RequestParam Long photographerId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(bookingService.listByPhotographer(photographerId, principal.getId()));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<BookingResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBookingStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(bookingService.updateStatus(id, request.getStatus(), principal.getId()));
    }
}
