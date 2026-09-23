package com.shuttershot.controller;

import com.shuttershot.dto.CreateReviewRequest;
import com.shuttershot.dto.ReviewResponse;
import com.shuttershot.service.ReviewService;
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

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewResponse> create(@Valid @RequestBody CreateReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<ReviewResponse>> list(@RequestParam Long photographerId) {
        return ResponseEntity.ok(reviewService.listApprovedByPhotographer(photographerId));
    }

    // Photographer-side moderation: a photographer approving/rejecting ratings
    // left about their own profile. Distinct from the admin-only endpoints
    // under /api/admin/reviews/**, which remain available as a separate
    // oversight path — not required for a rating to go live.
    @GetMapping("/pending")
    public ResponseEntity<List<ReviewResponse>> pendingForMe(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(reviewService.listPendingForPhotographer(principal.getId()));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ReviewResponse> approveMine(
            @PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(reviewService.approveAsPhotographer(id, principal.getId()));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ReviewResponse> rejectMine(
            @PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(reviewService.rejectAsPhotographer(id, principal.getId()));
    }
}
