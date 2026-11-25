package com.smartstock.backend.controller;

import com.smartstock.backend.dto.SupplierRequest;
import com.smartstock.backend.dto.SupplierResponse;
import com.smartstock.backend.dto.StatusRequest;
import com.smartstock.backend.service.SupplierService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@PreAuthorize("hasRole('ADMIN')")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(
            SupplierService supplierService) {

        this.supplierService = supplierService;
    }

    // CREATE SUPPLIER

    @PostMapping
    public ResponseEntity<SupplierResponse> createSupplier(
            @Valid @RequestBody SupplierRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(supplierService.createSupplier(request));
    }

    // GET ALL SUPPLIERS

    @GetMapping
    public ResponseEntity<List<SupplierResponse>> getSuppliers() {

        return ResponseEntity.ok(
                supplierService.getSuppliers()
        );
    }

    // UPDATE SUPPLIER

    @PutMapping("/{id}")
    public ResponseEntity<SupplierResponse> updateSupplier(
            @PathVariable Long id,
            @Valid @RequestBody SupplierRequest request) {

        return ResponseEntity.ok(
                supplierService.updateSupplier(id, request)
        );
    }

    // UPDATE STATUS

    @PatchMapping("/{id}/status")
    public ResponseEntity<SupplierResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusRequest request) {

        return ResponseEntity.ok(
                supplierService.updateStatus(
                        id,
                        request.getActive()
                )
        );
    }
}