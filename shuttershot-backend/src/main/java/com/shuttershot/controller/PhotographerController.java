package com.shuttershot.controller;

import com.shuttershot.dto.PackageResponse;
import com.shuttershot.dto.PhotographerProfileResponse;
import com.shuttershot.dto.PhotographerSummaryResponse;
import com.shuttershot.dto.PortfolioImageResponse;
import com.shuttershot.dto.UpdatePhotographerProfileRequest;
import com.shuttershot.service.PackageService;
import com.shuttershot.service.PhotographerService;
import com.shuttershot.service.PortfolioService;
import com.shuttershot.service.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/photographers")
@RequiredArgsConstructor
public class PhotographerController {

    private final PhotographerService photographerService;
    private final PortfolioService portfolioService;
    private final PackageService packageService;

    @GetMapping
    public ResponseEntity<List<PhotographerSummaryResponse>> search(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(photographerService.search(location, category));
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

    @PutMapping("/{id}")
    public ResponseEntity<PhotographerProfileResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePhotographerProfileRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(photographerService.update(id, request, principal.getId()));
    }
}
