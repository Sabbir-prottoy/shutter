package com.shuttershot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {

    private Long id;
    private String name;
    private String description;
    private String category;
    private Integer price;
    private Integer oldPrice;
    // Whole percent off when oldPrice is above price; otherwise 0.
    private Integer discountPercent;
    private Integer stock;
    private boolean inStock;
    private boolean digital;
    private String iconKey;
    private String imageUrl;
    private String imageCredit;
    private String imageSource;
    // Only meaningful to admins; the public shop never returns inactive products.
    private boolean active;
}
