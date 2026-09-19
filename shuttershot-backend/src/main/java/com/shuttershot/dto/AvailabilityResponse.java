package com.shuttershot.dto;

import com.shuttershot.model.AvailabilityStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailabilityResponse {

    private Long photographerId;
    private LocalDate date;
    private AvailabilityStatus status;
}
