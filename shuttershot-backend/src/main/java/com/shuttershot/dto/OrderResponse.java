package com.shuttershot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {

    private Long id;
    private String orderNumber;
    private String status;
    private String customerName;
    private String phone;
    private String email;
    private String district;
    private String address;
    private String note;
    private String paymentMethod;
    // UNPAID (cash on delivery), PENDING, PAID, FAILED or CANCELLED (online).
    private String paymentStatus;
    private LocalDateTime paidAt;
    // Where to send the browser to pay; only set on the response to placing an online order.
    private String gatewayUrl;
    private Integer subtotal;
    private Integer deliveryFee;
    private Integer total;
    private LocalDateTime createdAt;
    private List<Item> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Item {

        private Long productId;
        private String productName;
        private Integer unitPrice;
        private Integer quantity;
        private Integer lineTotal;
        private boolean digital;
    }
}
