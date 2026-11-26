package com.smartstock.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResponse(

        long totalProducts,

        long activeProducts,

        long lowStockProducts,

        long totalOrders,

        long pendingOrders,

        long confirmedOrders,

        long processingOrders,

        long shippedOrders,

        long deliveredOrders,

        long cancelledOrders,

        BigDecimal totalOrderValue,

        List<CategoryCountResponse> productsByCategory

) {
}