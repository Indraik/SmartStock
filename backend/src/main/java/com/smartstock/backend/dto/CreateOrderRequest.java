package com.smartstock.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

public record CreateOrderRequest(

        @Positive
        Long customerId,

        @NotEmpty(message = "Order must contain at least one item")
        @Size(max = 100, message = "Maximum 100 items per order")
        List<@NotNull @Valid OrderItemRequest> items

) {
}