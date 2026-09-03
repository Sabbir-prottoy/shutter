package com.shuttershot.controller;

import com.shuttershot.dto.AvailabilityResponse;
import com.shuttershot.dto.UpdateAvailabilityRequest;
import com.shuttershot.service.AvailabilityService;
import com.shuttershot.service.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    @PutMapping("/{date}")
    public ResponseEntity<AvailabilityResponse> update(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody UpdateAvailabilityRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(availabilityService.setAvailability(date, request, principal.getId()));
    }
}
