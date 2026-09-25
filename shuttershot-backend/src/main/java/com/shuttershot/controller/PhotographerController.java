package com.shuttershot.controller;

import com.shuttershot.dto.AvailabilityResponse;
import com.shuttershot.dto.OwnPhotographerProfileResponse;
import com.shuttershot.dto.PagedResponse;
import com.shuttershot.dto.PackageResponse;
import com.shuttershot.dto.PhotographerProfileResponse;
import com.shuttershot.dto.PhotographerSummaryResponse;
import com.shuttershot.dto.PortfolioImageResponse;
import com.shuttershot.dto.UpdatePhotographerProfileRequest;
import com.shuttershot.service.AvailabilityService;
import com.shuttershot.service.PackageService;
import com.shuttershot.service.PhotographerService;
import com.shuttershot.service.PortfolioService;
import com.shuttershot.service.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
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
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/photographers")
@RequiredArgsConstructor
public class PhotographerController {

    private final PhotographerService photographerService;
    private final PortfolioService portfolioService;
    private final PackageService packageService;
    private final AvailabilityService availabilityService;

    @GetMapping
    public ResponseEntity<List<PhotographerSummaryResponse>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(photographerService.search(q, district, category));
    }

    // Paged variant of the search above, for pages that show results a portion
    // at a time. A literal path, so "search" is never read as a photographer id.
    @GetMapping("/search")
    public ResponseEntity<PagedResponse<PhotographerSummaryResponse>> searchPage(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(photographerService.searchPage(q, district, category, page, size));
    }

    @GetMapping("/me")
    public ResponseEntity<OwnPhotographerProfileResponse> getOwnProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(photographerService.getOwnProfile(principal.getId()));
    }

    @PostMapping(value = "/me/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OwnPhotographerProfileResponse> uploadProfilePhoto(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(photographerService.updateProfilePhoto(file, principal.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PhotographerProfileResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(photographerService.getById(id));
    }

    @GetMapping("/{id}/portfolio")
    public ResponseEntity<List<PortfolioImageResponse>> getPortfolio(@PathVariable Long id) {
        return ResponseEntity.ok(portfolioService.listByPhotographer(id));
    }

    @GetMapping("/{id}/packages")
    public ResponseEntity<List<PackageResponse>> getPackages(@PathVariable Long id) {
        return ResponseEntity.ok(packageService.listByPhotographer(id));
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<List<AvailabilityResponse>> getAvailability(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(availabilityService.getAvailability(id, from, to));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OwnPhotographerProfileResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePhotographerProfileRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(photographerService.update(id, request, principal.getId()));
    }
}
