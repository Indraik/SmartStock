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
}