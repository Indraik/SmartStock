package com.smartstock.backend.dto;

import java.math.BigDecimal;

public record OrderItemResponse(

        Long id,

        Long productId,

        String productName,

        String sku,

        Integer quantity,

        BigDecimal unitPrice,

        BigDecimal subtotal

) {
}