package com.smartstock.backend.dto;

import com.smartstock.backend.enums.AdjustmentType;
import jakarta.validation.constraints.*;

public record InventoryAdjustmentRequest(

        @NotNull(message = "Adjustment type is required")
        AdjustmentType adjustmentType,

        @NotNull(message = "Quantity is required")
        @PositiveOrZero(message = "Quantity cannot be negative")
        Integer quantity,

        @NotBlank(message = "Reason is required")
        @Size(max = 500)
        String reason

) {
}