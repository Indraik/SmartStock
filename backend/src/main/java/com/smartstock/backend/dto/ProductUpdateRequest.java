package com.smartstock.backend.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ProductUpdateRequest(

        @NotBlank(message = "Product name is required")
        @Size(max = 150)
        String name,

        @Size(max = 1000)
        String description,

        @NotNull(message = "Price is required")
        @DecimalMin(
                value = "0.01",
                message = "Price must be greater than zero"
        )
        @Digits(integer = 10, fraction = 2)
        BigDecimal price,

        @NotNull(message = "Category is required")
        @Positive
        Long categoryId,

        @NotNull(message = "Supplier is required")
        @Positive
        Long supplierId

) {
}