package com.shuttershot.controller;

import com.shuttershot.dto.AdminOverviewResponse;
import com.shuttershot.service.AdminOverviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/overview")
@RequiredArgsConstructor
public class AdminOverviewController {

    private final AdminOverviewService adminOverviewService;

    @GetMapping
    public ResponseEntity<AdminOverviewResponse> getOverview() {
        return ResponseEntity.ok(adminOverviewService.getOverview());
    }
}
