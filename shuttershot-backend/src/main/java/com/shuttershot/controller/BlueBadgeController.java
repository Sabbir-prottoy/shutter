package com.shuttershot.controller;

import com.shuttershot.dto.BlueBadgePurchaseInitResponse;
import com.shuttershot.dto.BlueBadgeStatusResponse;
import com.shuttershot.service.BlueBadgeService;
import com.shuttershot.service.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/blue-badge")
@RequiredArgsConstructor
public class BlueBadgeController {

    private final BlueBadgeService blueBadgeService;

    @GetMapping("/status")
    public ResponseEntity<BlueBadgeStatusResponse> getStatus(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(blueBadgeService.getStatus(principal.getId()));
    }

    // Opens an SSLCommerz checkout session and hands back the GatewayPageURL
    // for the frontend to redirect the browser to. The badge itself is only
    // granted once SSLCommerz calls back to /payment/success and that payment
    // is re-validated server-side — see BlueBadgeService.
    @PostMapping("/purchase")
    public ResponseEntity<BlueBadgePurchaseInitResponse> purchase(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(blueBadgeService.initiatePurchase(principal.getId()));
    }

    // The three endpoints below are called directly by the customer's browser
    // (SSLCommerz auto-submits a POST form to whichever one applies once
    // checkout ends), not by our own frontend — so they're unauthenticated
    // (see SecurityConfig) and respond with a redirect back into the app.
    @PostMapping("/payment/success")
    public ResponseEntity<Void> paymentSuccess(@RequestParam("tran_id") String tranId,
                                                @RequestParam("val_id") String valId) {
        boolean valid = blueBadgeService.confirmPayment(tranId, valId);
        return redirectTo(blueBadgeService.frontendReturnUrl(valid ? "success" : "failed"));
    }

    @PostMapping("/payment/fail")
    public ResponseEntity<Void> paymentFail(@RequestParam("tran_id") String tranId) {
        blueBadgeService.markFailed(tranId);
        return redirectTo(blueBadgeService.frontendReturnUrl("failed"));
    }

    @PostMapping("/payment/cancel")
    public ResponseEntity<Void> paymentCancel(@RequestParam("tran_id") String tranId) {
        blueBadgeService.markCancelled(tranId);
        return redirectTo(blueBadgeService.frontendReturnUrl("cancelled"));
    }

    private ResponseEntity<Void> redirectTo(String location) {
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(location)).build();
    }
}
