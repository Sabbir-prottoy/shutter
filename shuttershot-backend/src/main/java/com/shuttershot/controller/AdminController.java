package com.shuttershot.controller;

import com.shuttershot.dto.AccountHistoryResponse;
import com.shuttershot.dto.AdminUserResponse;
import com.shuttershot.dto.BlueBadgeHolderResponse;
import com.shuttershot.dto.ConfirmPasswordRequest;
import com.shuttershot.dto.CreateStaffAccountRequest;
import com.shuttershot.dto.PortfolioImageResponse;
import com.shuttershot.dto.ReviewResponse;
import com.shuttershot.dto.StaffAccountResponse;
import com.shuttershot.dto.UpdateBlueBadgeSettingsRequest;
import com.shuttershot.model.Role;
import com.shuttershot.model.VerificationStatus;
import com.shuttershot.service.AdminUserService;
import com.shuttershot.service.BlueBadgeService;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ReviewService reviewService;
    private final PortfolioService portfolioService;
    private final AdminUserService adminUserService;
    private final BlueBadgeService blueBadgeService;

    @GetMapping("/reviews")
    public ResponseEntity<List<ReviewResponse>> publishedReviews() {
        return ResponseEntity.ok(reviewService.listPublished());
    }

    @PutMapping("/reviews/{id}/remove")
    public ResponseEntity<ReviewResponse> removeReview(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.remove(id));
    }

    @GetMapping("/photos")
    public ResponseEntity<List<PortfolioImageResponse>> photos(
            @RequestParam(required = false) VerificationStatus status) {
        return ResponseEntity.ok(portfolioService.listForModeration(status));
    }

    @PutMapping("/photos/{id}/approve")
    public ResponseEntity<PortfolioImageResponse> approvePhoto(@PathVariable Long id) {
        return ResponseEntity.ok(portfolioService.approveByAdmin(id));
    }

    @PutMapping("/photos/{id}/reject")
    public ResponseEntity<PortfolioImageResponse> rejectPhoto(@PathVariable Long id) {
        return ResponseEntity.ok(portfolioService.rejectByAdmin(id));
    }

    @PostMapping("/photos/{id}/ai-check")
    public ResponseEntity<PortfolioImageResponse> checkPhotoForAi(@PathVariable Long id) {
        return ResponseEntity.ok(portfolioService.checkForAi(id));
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> listUsers(@RequestParam(required = false) Role role) {
        return ResponseEntity.ok(adminUserService.listUsers(role));
    }

    @PutMapping("/users/{id}/verify")
    public ResponseEntity<AdminUserResponse> verifyUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.verify(id));
    }

    // Permanently removes the account and everything it owns, and blocks
    // this email from ever registering again — see AdminUserService.ban.
    @PutMapping("/users/{id}/ban")
    public ResponseEntity<Void> banUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        adminUserService.ban(id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    // Same permanent deletion, but leaves the email free to register a new
    // account afterward — see AdminUserService.justDelete.
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> justDeleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        adminUserService.justDelete(id, principal.getId());
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

    // Photographers Profile History — main-admin-only, per AdminUserService.
    @GetMapping("/photographer-history")
    public ResponseEntity<List<AccountHistoryResponse>> listPhotographerHistory(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(adminUserService.listPhotographerHistory(principal.getId()));
    }

    @DeleteMapping("/photographer-history/{id}")
    public ResponseEntity<Void> removePhotographerHistory(
            @PathVariable Long id,
            @Valid @RequestBody ConfirmPasswordRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        adminUserService.removePhotographerHistory(id, principal.getId(), request.getPassword());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/photographer-history")
    public ResponseEntity<Void> removeAllPhotographerHistory(
            @Valid @RequestBody ConfirmPasswordRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        adminUserService.removeAllPhotographerHistory(principal.getId(), request.getPassword());
        return ResponseEntity.noContent().build();
    }

    // User Profile History — same shape, but for CUSTOMER accounts.
    @GetMapping("/user-history")
    public ResponseEntity<List<AccountHistoryResponse>> listUserHistory(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(adminUserService.listUserHistory(principal.getId()));
    }

    @DeleteMapping("/user-history/{id}")
    public ResponseEntity<Void> removeUserHistory(
            @PathVariable Long id,
            @Valid @RequestBody ConfirmPasswordRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        adminUserService.removeUserHistory(id, principal.getId(), request.getPassword());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/user-history")
    public ResponseEntity<Void> removeAllUserHistory(
            @Valid @RequestBody ConfirmPasswordRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        adminUserService.removeAllUserHistory(principal.getId(), request.getPassword());
        return ResponseEntity.noContent().build();
    }

    // Blue badge management — main-admin-only, per BlueBadgeService.
    @GetMapping("/blue-badge/settings")
    public ResponseEntity<Map<String, BigDecimal>> getBlueBadgeSettings(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Map.of("price", blueBadgeService.getCurrentPriceForAdmin(principal.getId())));
    }

    @PutMapping("/blue-badge/settings")
    public ResponseEntity<Map<String, BigDecimal>> updateBlueBadgePrice(
            @Valid @RequestBody UpdateBlueBadgeSettingsRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        BigDecimal price = blueBadgeService.updatePrice(request.getPrice(), principal.getId());
        return ResponseEntity.ok(Map.of("price", price));
    }

    @GetMapping("/blue-badge/holders")
    public ResponseEntity<List<BlueBadgeHolderResponse>> listBlueBadgeHolders(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(blueBadgeService.listHolders(principal.getId()));
    }

    @PutMapping("/blue-badge/holders/{userId}/revoke")
    public ResponseEntity<Void> revokeBlueBadge(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal principal) {
        blueBadgeService.revoke(userId, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
