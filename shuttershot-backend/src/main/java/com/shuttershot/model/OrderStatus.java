package com.shuttershot.model;

public enum OrderStatus {
    PLACED,
    CONFIRMED,
    SHIPPED,
    DELIVERED,
    CANCELLED;

    // Delivered and cancelled orders are finished; they cannot be reopened.
    public boolean isFinal() {
        return this == DELIVERED || this == CANCELLED;
    }
}
