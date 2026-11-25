package com.smartstock.backend.controller;

import com.smartstock.backend.dto.InventoryAdjustmentRequest;
import com.smartstock.backend.dto.InventoryAdjustmentResponse;
import com.smartstock.backend.dto.InventoryResponse;
import com.smartstock.backend.dto.PageResponse;

import com.smartstock.backend.service.InventoryService;

import jakarta.validation.Valid;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(
            InventoryService inventoryService) {

        this.inventoryService = inventoryService;
    }

    // 1. GET INVENTORY

    @GetMapping
    public ResponseEntity<PageResponse<InventoryResponse>>
    getInventory(

            @RequestParam(defaultValue = "0") int page,

            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = createPageable(
                page, size, Sort.by("name", "id"));

        return ResponseEntity.ok(
                inventoryService.getInventory(pageable)
        );
    }

    // 2. UPDATE STOCK

    @PatchMapping("/{productId}")
    public ResponseEntity<InventoryAdjustmentResponse>
    adjustStock(

            @PathVariable Long productId,

            @Valid @RequestBody
            InventoryAdjustmentRequest request,

            Authentication authentication) {

        return ResponseEntity.ok(

                inventoryService.adjustStock(
                        productId,
                        request,
                        authentication.getName()
                )
        );
    }

    // 3. GET LOW-STOCK PRODUCTS

    @GetMapping("/low-stock")
    public ResponseEntity<PageResponse<InventoryResponse>>
    getLowStockProducts(

            @RequestParam(defaultValue = "0") int page,

            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = createPageable(
                page, size, Sort.by("stockQuantity", "id"));

        return ResponseEntity.ok(
                inventoryService.getLowStockProducts(pageable)
        );
    }

    // 4. GET ADJUSTMENT HISTORY

    @GetMapping("/{productId}/history")
    public ResponseEntity<PageResponse<InventoryAdjustmentResponse>>
    getAdjustmentHistory(

            @PathVariable Long productId,

            @RequestParam(defaultValue = "0") int page,

            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = createPageable(
                page, size, Sort.unsorted());

        return ResponseEntity.ok(

                inventoryService.getAdjustmentHistory(
                        productId,
                        pageable
                )
        );
    }

    // VALIDATE PAGINATION

    private Pageable createPageable(
            int page, int size, Sort sort) {

        if (page < 0) {

            throw new IllegalArgumentException(
                    "Page number cannot be negative");
        }

        if (size < 1 || size > 100) {

            throw new IllegalArgumentException(
                    "Page size must be between 1 and 100");
        }

        return PageRequest.of(page, size, sort);
    }
}