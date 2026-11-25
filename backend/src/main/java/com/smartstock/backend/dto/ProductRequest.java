package com.smartstock.backend.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ProductRequest(

        @NotBlank(message = "Product name is required")
        @Size(max = 150)
        String name,

        @Size(max = 1000)
        String description,

        @NotBlank(message = "SKU is required")
        @Size(max = 50)
        @Pattern(
                regexp = "^[A-Za-z0-9_-]+$",
                message = "SKU contains invalid characters"
        )
        String sku,

        @NotNull(message = "Price is required")
        @DecimalMin(
                value = "0.01",
                message = "Price must be greater than zero"
        )
        @Digits(integer = 10, fraction = 2)
        BigDecimal price,

        @NotNull(message = "Stock quantity is required")
        @PositiveOrZero(
                message = "Stock cannot be negative"
        )
        Integer stockQuantity,

        @PositiveOrZero(
                message = "Threshold cannot be negative"
        )
        Integer lowStockThreshold,

        @NotNull(message = "Category is required")
        @Positive
        Long categoryId,

        @NotNull(message = "Supplier is required")
        @Positive
        Long supplierId

) {
}