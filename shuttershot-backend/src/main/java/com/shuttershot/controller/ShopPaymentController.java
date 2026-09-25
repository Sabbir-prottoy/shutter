package com.shuttershot.controller;

import com.shuttershot.model.PaymentStatus;
import com.shuttershot.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

// SSLCommerz sends the customer's browser back to these three URLs with a form POST
// after the payment page. They are unauthenticated by nature, so each one answers with
// a redirect to the storefront and OrderService trusts nothing but the gateway's own
// validation call.
@RestController
@RequestMapping("/api/shop/payment")
@RequiredArgsConstructor
public class ShopPaymentController {

    private final OrderService orderService;

    @PostMapping("/success")
    public ResponseEntity<Void> success(@RequestParam(value = "tran_id", required = false) String tranId,
                                        @RequestParam(value = "val_id", required = false) String valId) {
        return redirectTo(tranId == null || tranId.isBlank()
                ? new OrderService.PaymentOutcome("failed", null)
                : orderService.confirmOnlinePayment(tranId, valId));
    }

    @PostMapping("/fail")
    public ResponseEntity<Void> fail(@RequestParam(value = "tran_id", required = false) String tranId) {
        return abandon(tranId, PaymentStatus.FAILED);
    }

    @PostMapping("/cancel")
    public ResponseEntity<Void> cancel(@RequestParam(value = "tran_id", required = false) String tranId) {
        return abandon(tranId, PaymentStatus.CANCELLED);
    }

    private ResponseEntity<Void> abandon(String tranId, PaymentStatus reason) {
        String result = reason == PaymentStatus.CANCELLED ? "cancelled" : "failed";
        return redirectTo(tranId == null || tranId.isBlank()
                ? new OrderService.PaymentOutcome(result, null)
                : orderService.abandonOnlinePayment(tranId, reason));
    }

    private ResponseEntity<Void> redirectTo(OrderService.PaymentOutcome outcome) {
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, URI.create(orderService.paymentReturnUrl(outcome)).toString())
                .build();
    }
}
