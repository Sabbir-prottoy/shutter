package com.shuttershot.controller;

import com.shuttershot.dto.DeliveryRulesResponse;
import com.shuttershot.dto.OrderResponse;
import com.shuttershot.dto.PagedResponse;
import com.shuttershot.dto.PlaceOrderRequest;
import com.shuttershot.dto.UpdateOrderStatusRequest;
import com.shuttershot.model.OrderStatus;
import com.shuttershot.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// Placing an order and reading the delivery rules are public (guest checkout);
// listing and updating orders is under /api/admin/**.
@RestController
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/api/orders/delivery-rules")
    public ResponseEntity<DeliveryRulesResponse> deliveryRules() {
        return ResponseEntity.ok(orderService.deliveryRules());
    }

    @PostMapping("/api/orders")
    public ResponseEntity<OrderResponse> place(@Valid @RequestBody PlaceOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.place(request));
    }

    @GetMapping("/api/admin/orders")
    public ResponseEntity<PagedResponse<OrderResponse>> listForAdmin(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(orderService.listForAdmin(status, page, size));
    }

    @PutMapping("/api/admin/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable Long id, @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(orderService.updateStatus(id, request.getStatus()));
    }
}
