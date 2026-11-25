package com.smartstock.backend.dto;

import com.smartstock.backend.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record OrderStatusRequest(

        @NotNull(message = "Order status is required")
        OrderStatus status

) {
}