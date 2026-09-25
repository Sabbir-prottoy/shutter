package com.shuttershot.model;

// Where an order's payment stands. UNPAID is a cash-on-delivery order (the courier
// collects it); PENDING is an online order still waiting on the payment gateway.
public enum PaymentStatus {
    UNPAID,
    PENDING,
    PAID,
    FAILED,
    CANCELLED
}
