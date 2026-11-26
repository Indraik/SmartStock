package com.smartstock.backend.service;

import com.smartstock.backend.dto.CategoryCountResponse;
import com.smartstock.backend.dto.DashboardResponse;

import com.smartstock.backend.enums.OrderStatus;

import com.smartstock.backend.repository.ProductRepository;
import com.smartstock.backend.repository.OrderRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class DashboardService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public DashboardService(
            ProductRepository productRepository,
            OrderRepository orderRepository) {

        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getSummary() {

        BigDecimal totalOrderValue =
                orderRepository.sumTotalAmountExcludingStatus(
                        OrderStatus.CANCELLED
                );

        if (totalOrderValue == null) {
            totalOrderValue = BigDecimal.ZERO;
        }

        List<CategoryCountResponse> categoryCounts =
                productRepository.countProductsByCategory()
                        .stream()
                        .map(row -> new CategoryCountResponse(
                                (String) row[0],
                                (Long) row[1]
                        ))
                        .toList();

        return new DashboardResponse(

                productRepository.count(),

                productRepository.countByActiveTrue(),

                productRepository.countLowStockProducts(),

                orderRepository.count(),

                orderRepository.countByStatus(
                        OrderStatus.PENDING),

                orderRepository.countByStatus(
                        OrderStatus.CONFIRMED),

                orderRepository.countByStatus(
                        OrderStatus.PROCESSING),

                orderRepository.countByStatus(
                        OrderStatus.SHIPPED),

                orderRepository.countByStatus(
                        OrderStatus.DELIVERED),

                orderRepository.countByStatus(
                        OrderStatus.CANCELLED),

                totalOrderValue,

                categoryCounts
        );
    }
}