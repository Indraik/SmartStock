package com.smartstock.backend.dto;

import com.smartstock.backend.enums.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(

        Long id,

        Long customerId,

        String customerName,

        OrderStatus status,

        List<OrderItemResponse> items,

        BigDecimal totalAmount,

        LocalDateTime createdAt,

        LocalDateTime updatedAt

) {
}