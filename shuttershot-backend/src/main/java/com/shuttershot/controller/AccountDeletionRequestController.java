package com.shuttershot.controller;

import com.shuttershot.dto.AccountDeletionRequestResponse;
import com.shuttershot.dto.CreateAccountDeletionRequestRequest;
import com.shuttershot.service.AccountDeletionRequestService;
import com.shuttershot.service.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Self-service: a CUSTOMER or PHOTOGRAPHER asking for their own account to be
// deleted. Keyed entirely off the authenticated principal, so one endpoint
// serves both roles — see AccountDeletionRequestService for the role check
// and AdminController for the admin-side approve/reject endpoints.
@RestController
@RequestMapping("/api/account/deletion-request")
@RequiredArgsConstructor
public class AccountDeletionRequestController {

    private final AccountDeletionRequestService accountDeletionRequestService;

    @GetMapping
    public ResponseEntity<AccountDeletionRequestResponse> getMine(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(accountDeletionRequestService.getMine(principal.getId()));
    }

    @PostMapping
    public ResponseEntity<AccountDeletionRequestResponse> submit(
            @Valid @RequestBody CreateAccountDeletionRequestRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(accountDeletionRequestService.submit(principal.getId(), request.getReason()));
    }

    @DeleteMapping
    public ResponseEntity<Void> cancel(@AuthenticationPrincipal UserPrincipal principal) {
        accountDeletionRequestService.cancel(principal.getId());
        return ResponseEntity.noContent().build();
    }
}
