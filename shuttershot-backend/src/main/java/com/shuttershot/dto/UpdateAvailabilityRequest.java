package com.shuttershot.dto;

import com.shuttershot.model.AvailabilityStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAvailabilityRequest {

    @NotNull(message = "Status is required")
    private AvailabilityStatus status;
}
