package com.smartstock.backend.dto;

import jakarta.validation.constraints.*;

public record OrderItemRequest(

        @NotNull(message = "Product ID is required")
        @Positive
        Long productId,

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be positive")
        @Max(1000000)
        Integer quantity

) {
}