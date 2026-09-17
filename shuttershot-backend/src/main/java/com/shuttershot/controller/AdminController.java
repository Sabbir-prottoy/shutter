package com.shuttershot.controller;

import com.shuttershot.dto.AdminUserResponse;
import com.shuttershot.dto.CreateStaffAccountRequest;
import com.shuttershot.dto.PortfolioImageResponse;
import com.shuttershot.dto.ReviewResponse;
import com.shuttershot.dto.StaffAccountResponse;
import com.shuttershot.model.Role;
import com.shuttershot.service.AdminUserService;
import com.shuttershot.service.PortfolioService;
import com.shuttershot.service.ReviewService;
import com.shuttershot.service.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
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

    @GetMapping("/photos/pending")
    public ResponseEntity<List<PortfolioImageResponse>> pendingPhotos() {
        return ResponseEntity.ok(portfolioService.listPending());
    }

    @PutMapping("/photos/{id}/approve")
    public ResponseEntity<PortfolioImageResponse> approvePhoto(@PathVariable Long id) {
        return ResponseEntity.ok(portfolioService.approveByAdmin(id));
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

    // Permanently removes the account and everything it owns — see
    // AdminUserService.remove for what that cascade covers.
    @PutMapping("/users/{id}/ban")
    public ResponseEntity<Void> banUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        adminUserService.remove(id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    // Staff management (admin and moderator accounts) — reachable by any
    // ADMIN at the security-filter level, but AdminUserService enforces that
    // only the main admin can actually list, add, or remove staff.
    @GetMapping("/staff")
    public ResponseEntity<List<StaffAccountResponse>> listStaff(
            @RequestParam Role role,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(adminUserService.listStaff(role, principal.getId()));
    }

    @PostMapping("/staff")
    public ResponseEntity<StaffAccountResponse> createStaff(
            @Valid @RequestBody CreateStaffAccountRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminUserService.createStaff(request, principal.getId()));
    }

    // The main admin account is protected inside removeStaff — no path here
    // can delete it.
    @DeleteMapping("/staff/{id}")
    public ResponseEntity<Void> removeStaff(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        adminUserService.removeStaff(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
