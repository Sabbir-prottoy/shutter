package com.shuttershot.controller;

import com.shuttershot.dto.AdminUserResponse;
import com.shuttershot.dto.PortfolioImageResponse;
import com.shuttershot.dto.ReviewResponse;
import com.shuttershot.model.Role;
import com.shuttershot.service.AdminUserService;
import com.shuttershot.service.PortfolioService;
import com.shuttershot.service.ReviewService;
import com.shuttershot.service.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ReviewService reviewService;
    private final PortfolioService portfolioService;
    private final AdminUserService adminUserService;

    @GetMapping("/reviews/pending")
    public ResponseEntity<List<ReviewResponse>> pendingReviews() {
        return ResponseEntity.ok(reviewService.listPending());
    }

    @PutMapping("/reviews/{id}/approve")
    public ResponseEntity<ReviewResponse> approveReview(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.approve(id));
    }

    @PutMapping("/reviews/{id}/reject")
    public ResponseEntity<ReviewResponse> rejectReview(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.reject(id));
    }

    @GetMapping("/photos/flagged")
    public ResponseEntity<List<PortfolioImageResponse>> flaggedPhotos() {
        return ResponseEntity.ok(portfolioService.listFlagged());
    }

    @PutMapping("/photos/{id}/verify")
    public ResponseEntity<PortfolioImageResponse> verifyPhoto(@PathVariable Long id) {
        return ResponseEntity.ok(portfolioService.verifyByAdmin(id));
    }

    @PutMapping("/photos/{id}/reject")
    public ResponseEntity<Void> rejectPhoto(@PathVariable Long id) {
        portfolioService.rejectByAdmin(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> listUsers(@RequestParam(required = false) Role role) {
        return ResponseEntity.ok(adminUserService.listUsers(role));
    }

    @PutMapping("/users/{id}/verify")
    public ResponseEntity<AdminUserResponse> verifyUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.verify(id));
    }

    @PutMapping("/users/{id}/ban")
    public ResponseEntity<AdminUserResponse> banUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(adminUserService.ban(id, principal.getId()));
    }

    @PutMapping("/users/{id}/unban")
    public ResponseEntity<AdminUserResponse> unbanUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.unban(id));
    }
}
