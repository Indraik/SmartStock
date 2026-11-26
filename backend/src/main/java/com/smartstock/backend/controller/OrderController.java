package com.smartstock.backend.controller;

import com.smartstock.backend.dto.CreateOrderRequest;
import com.smartstock.backend.dto.OrderResponse;

import com.smartstock.backend.service.OrderService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.smartstock.backend.dto.OrderStatusRequest;
import com.smartstock.backend.dto.PageResponse;
import com.smartstock.backend.enums.OrderStatus;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {

        this.orderService = orderService;
    }

    @PostMapping
    @PreAuthorize(
            "hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<OrderResponse> createOrder(

            @Valid @RequestBody CreateOrderRequest request,

            Authentication authentication) {

        OrderResponse response =
                orderService.createOrder(
                        request,
                        authentication.getName()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<PageResponse<OrderResponse>> getOrders(

            @RequestParam(required = false)
            Long customerId,

            @RequestParam(required = false)
            OrderStatus status,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime fromDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime toDate,

            @RequestParam(required = false)
            BigDecimal minTotal,

            @RequestParam(required = false)
            BigDecimal maxTotal,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size,

            Authentication authentication) {

        if (page < 0 || size < 1 || size > 100) {

            throw new IllegalArgumentException(
                    "Invalid pagination parameters");
        }

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(
                        Sort.Direction.DESC,
                        "createdAt",
                        "id"
                )
        );

        return ResponseEntity.ok(
                orderService.getOrders(
                        authentication.getName(),
                        customerId,
                        status,
                        fromDate,
                        toDate,
                        minTotal,
                        maxTotal,
                        pageable
                )
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<OrderResponse> getOrderById(
            @PathVariable Long id,
            Authentication authentication) {

        return ResponseEntity.ok(
                orderService.getOrderById(
                        id,
                        authentication.getName()
                )
        );
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(
                orderService.updateOrderStatus(
                        id,
                        request.status(),
                        authentication.getName()
                )
        );
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')")
    public ResponseEntity<OrderResponse> cancelOrder(
            @PathVariable Long id,
            Authentication authentication) {

        return ResponseEntity.ok(
                orderService.cancelOrder(
                        id,
                        authentication.getName()
                )
        );
    }
}