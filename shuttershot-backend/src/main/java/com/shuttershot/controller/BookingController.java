package com.shuttershot.controller;

import com.shuttershot.dto.BookingDepositInitResponse;
import com.shuttershot.dto.BookingResponse;
import com.shuttershot.dto.BookingVerificationSetupResponse;
import com.shuttershot.dto.ConfirmOtpRequest;
import com.shuttershot.dto.CreateBookingRequest;
import com.shuttershot.dto.QrCodeResponse;
import com.shuttershot.dto.SetVerificationMethodRequest;
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

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> create(
            @Valid @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long customerUserId = principal != null ? principal.getId() : null;
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.create(request, customerUserId));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<BookingResponse>> listMine(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(bookingService.listByCustomer(principal.getId()));
    }

    @PostMapping("/{id}/confirm-otp")
    public ResponseEntity<BookingResponse> confirmOtp(
            @PathVariable Long id,
            @Valid @RequestBody ConfirmOtpRequest request) {
        return ResponseEntity.ok(bookingService.confirmOtp(id, request.getOtpCode()));
    }

    // Sets (or switches) which of the four methods verifies this booking's
    // contact — see BookingService.setupVerification for why re-calling this
    // for the same booking is how the "go back and pick a different method"
    // flow works.
    @PostMapping("/{id}/verification-method")
    public ResponseEntity<BookingVerificationSetupResponse> setVerificationMethod(
            @PathVariable Long id,
            @Valid @RequestBody SetVerificationMethodRequest request) {
        return ResponseEntity.ok(bookingService.setupVerification(id, request.getMethod()));
    }

    // Public — whoever scans the QR the photographer shows them lands here.
    @PostMapping("/verify-qr/{token}")
    public ResponseEntity<BookingResponse> verifyByQr(@PathVariable String token) {
        return ResponseEntity.ok(bookingService.verifyByQrToken(token));
    }

    // Photographer-facing — the QR image to show the customer in person.
    @GetMapping("/{id}/qr-code")
    public ResponseEntity<QrCodeResponse> getQrCode(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(bookingService.getQrCodeForBooking(id, principal.getId()));
    }

    // Unauthenticated by design, same trust level as confirm-otp above — the
    // booking id is already treated as a capability handed to whoever made the
    // booking, guest or not, so the browser can look its own booking back up
    // after returning from the SSLCommerz redirect below (which reloads the page).
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getById(id));
    }

    @PostMapping("/{id}/deposit/initiate")
    public ResponseEntity<BookingDepositInitResponse> initiateDeposit(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.initiateDeposit(id));
    }

    // The three endpoints below are called directly by the customer's browser
    // (SSLCommerz auto-submits a POST form to whichever one applies once
    // checkout ends), not by our own frontend — so they're unauthenticated
    // (see SecurityConfig) and respond with a redirect back into the app.
    @PostMapping("/payment/success")
    public ResponseEntity<Void> depositSuccess(@RequestParam("tran_id") String tranId,
                                                @RequestParam("val_id") String valId) {
        return redirectTo(bookingService.handleDepositSuccess(tranId, valId));
    }

    @PostMapping("/payment/fail")
    public ResponseEntity<Void> depositFail(@RequestParam("tran_id") String tranId) {
        return redirectTo(bookingService.handleDepositFail(tranId));
    }

    @PostMapping("/payment/cancel")
    public ResponseEntity<Void> depositCancel(@RequestParam("tran_id") String tranId) {
        return redirectTo(bookingService.handleDepositCancel(tranId));
    }

    private ResponseEntity<Void> redirectTo(String location) {
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(location)).build();
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
