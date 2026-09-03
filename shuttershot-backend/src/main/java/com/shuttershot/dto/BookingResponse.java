package com.shuttershot.dto;

import com.shuttershot.model.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    private Long packageId;
    private String clientName;
    private String clientPhone;
    private String clientEmail;
    private LocalDate bookingDate;
    private String timeSlot;
    private BookingStatus status;
    private boolean otpVerified;
    private LocalDateTime createdAt;
}
