package com.smartstock.backend.dto;

import java.math.BigDecimal;

public record ProductCatalogResponse(

        Long id,

        String name,

        String description,

        String sku,

        BigDecimal price,

        Long categoryId,

        String categoryName,

        boolean available

) {
}