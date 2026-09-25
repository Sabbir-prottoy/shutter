package com.shuttershot.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryRulesResponse {

    private int insideDhaka;
    private int outsideDhaka;
    // Orders with a subtotal at or above this ship free.
    private int freeDeliveryFrom;
    // Whether the SSLCommerz online payment option can be offered at checkout.
    private boolean onlinePayment;
}
