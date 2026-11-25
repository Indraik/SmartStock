package com.smartstock.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductResponse(

        Long id,

        String name,

        String description,

        String sku,

        BigDecimal price,

        Integer stockQuantity,

        Integer lowStockThreshold,

        boolean lowStock,

        Long categoryId,

        String categoryName,

        Long supplierId,

        String supplierName,

        boolean active,

        LocalDateTime createdAt,

        LocalDateTime updatedAt

) {
}