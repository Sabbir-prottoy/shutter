package com.shuttershot.dto;

import com.shuttershot.model.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PlaceOrderRequest {

    @NotBlank(message = "Your name is required")
    @Size(max = 100, message = "Name must be at most 100 characters")
    private String customerName;

    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone number is too long")
    private String phone;

    @Email(message = "Enter a valid email address")
    @Size(max = 120, message = "Email must be at most 120 characters")
    private String email;

    // District and address are needed only when something has to be delivered
    // (checked in OrderService: digital-only orders skip them).
    @Size(max = 60)
    private String district;

    @Size(max = 300, message = "Address must be at most 300 characters")
    private String address;

    @Size(max = 300, message = "Note must be at most 300 characters")
    private String note;

    // Left out by older clients, which means cash on delivery.
    private PaymentMethod paymentMethod;

    @NotEmpty(message = "Your cart is empty")
    @Size(max = 30, message = "An order can have at most 30 different items")
    @Valid
    private List<Item> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {

        @NotNull(message = "Product is required")
        private Long productId;

        @Min(value = 1, message = "Quantity must be at least 1")
        @Max(value = 20, message = "You can order at most 20 of one item")
        private int quantity;
    }
}
