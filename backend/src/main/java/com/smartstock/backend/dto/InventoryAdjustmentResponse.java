package com.smartstock.backend.dto;

import com.smartstock.backend.enums.AdjustmentType;
import java.time.LocalDateTime;

public record InventoryAdjustmentResponse(

        Long id,

        Long productId,

        String productName,

        AdjustmentType adjustmentType,

        Integer previousQuantity,

        Integer newQuantity,

        Integer adjustmentQuantity,

        String reason,

        String changedBy,

        LocalDateTime createdAt

) {
}