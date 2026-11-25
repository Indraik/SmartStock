package com.smartstock.backend.dto;

public record InventoryResponse(

        Long productId,

        String productName,

        String sku,

        Integer stockQuantity,

        Integer lowStockThreshold,

        String stockStatus,

        boolean active

) {
}