package com.shuttershot.controller;

import com.shuttershot.dto.AccountResponse;
import com.shuttershot.dto.UpdateAccountRequest;
import com.shuttershot.service.AccountService;
import com.shuttershot.service.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping("/me")
    public ResponseEntity<AccountResponse> getOwnAccount(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(accountService.getOwnAccount(principal.getId()));
    }

    @PutMapping("/me")
    public ResponseEntity<AccountResponse> update(
            @Valid @RequestBody UpdateAccountRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(accountService.update(principal.getId(), request));
    }

    @PostMapping(value = "/me/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AccountResponse> uploadPhoto(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(accountService.updatePhoto(principal.getId(), file));
    }
}
