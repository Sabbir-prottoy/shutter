package com.shuttershot.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

// One item for sale in the Accessories Marketplace. Prices are whole Bangladeshi
// taka (BDT); there are no fractional amounts anywhere in the shop.
@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProductCategory category;

    @Column(nullable = false)
    private Integer price;

    // Shown struck through beside the price when higher than it (a discount).
    @Column(name = "old_price")
    private Integer oldPrice;

    @Column(nullable = false)
    private Integer stock;

    // Software and subscriptions: delivered by email, so they add no delivery fee.
    @Column(nullable = false)
    @Builder.Default
    private boolean digital = false;

    // Picks the illustration drawn on the product tile when there is no photo.
    @Column(name = "icon_key", nullable = false, length = 30)
    private String iconKey;

    @Column(name = "image_url")
    private String imageUrl;

    // Who took the sample photo and under which licence, plus the page it came from.
    // Shown on the marketplace's "Photo credits" list; empty for photos an admin uploaded.
    @Column(name = "image_credit", length = 400)
    private String imageCredit;

    @Column(name = "image_source", length = 400)
    private String imageSource;

    // Set once the starting sample photo has been attached, so removing it later
    // is not undone by the next restart. Null on rows that predate this column.
    @Column(name = "sample_image_applied")
    private Boolean sampleImageApplied;

    // Hidden products stay in the admin panel but disappear from the shop.
    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
