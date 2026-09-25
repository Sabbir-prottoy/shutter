package com.shuttershot.dto;

import com.shuttershot.model.ProductCategory;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(max = 150, message = "Product name must be at most 150 characters")
    private String name;

    @Size(max = 500, message = "Description must be at most 500 characters")
    private String description;

    @NotNull(message = "Choose a category")
    private ProductCategory category;

    @NotNull(message = "Price is required")
    @Min(value = 1, message = "Price must be at least 1 BDT")
    @Max(value = 10_000_000, message = "Price is too high")
    private Integer price;

    @Min(value = 1, message = "Old price must be at least 1 BDT")
    @Max(value = 10_000_000, message = "Old price is too high")
    private Integer oldPrice;

    @NotNull(message = "Stock is required")
    @Min(value = 0, message = "Stock cannot be negative")
    @Max(value = 100_000, message = "Stock is too high")
    private Integer stock;

    private boolean digital;

    @NotBlank(message = "Choose an icon")
    @Size(max = 30)
    private String iconKey;

    private boolean active = true;
}
