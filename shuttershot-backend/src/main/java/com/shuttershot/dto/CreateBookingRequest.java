package com.shuttershot.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateBookingRequest {

    @NotNull(message = "Photographer is required")
    private Long photographerId;

    @NotNull(message = "Package is required")
    private Long packageId;

    @NotBlank(message = "Client name is required")
    private String clientName;

    @NotBlank(message = "Client phone is required")
    private String clientPhone;

    @NotBlank(message = "Client email is required")
    @Email(message = "Client email must be a valid address")
    private String clientEmail;

    @NotNull(message = "Booking date is required")
    private LocalDate bookingDate;

    @NotBlank(message = "Time slot is required")
    private String timeSlot;
}
