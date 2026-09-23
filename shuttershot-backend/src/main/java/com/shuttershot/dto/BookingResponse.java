package com.shuttershot.dto;

import com.shuttershot.model.BookingStatus;
import com.shuttershot.model.BookingVerificationMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {

    private Long id;
    private Long photographerId;
    private String photographerName;
    private Long packageId;
    private String packageTitle;
    private BigDecimal packagePrice;
    private Long customerId;
    private String clientName;
    private String clientPhone;
    private String clientEmail;
    private LocalDate bookingDate;
    private String timeSlot;
    private BookingStatus status;
    private boolean otpVerified;
    private BookingVerificationMethod verificationMethod;
    private BigDecimal depositAmount;
    private boolean depositPaid;
    // True once a rating has been submitted for this booking (whatever its
    // moderation status) — lets the client hide the "rate this session" form
    // rather than let someone hit the one-review-per-booking error.
    private boolean reviewed;
    private LocalDateTime createdAt;
}
