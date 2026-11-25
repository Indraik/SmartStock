package com.smartstock.backend.controller;

import com.smartstock.backend.dto.ProductRequest;
import com.smartstock.backend.dto.ProductUpdateRequest;
import com.smartstock.backend.dto.ProductResponse;
import com.smartstock.backend.dto.StatusRequest;

import com.smartstock.backend.service.ProductService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(
            ProductService productService) {

        this.productService = productService;
    }

    // 1. CREATE PRODUCT

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @RequestBody ProductRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(productService.createProduct(request));
    }

    // 2. GET ALL PRODUCTS

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<List<?>> getProducts(
            Authentication authentication) {

        if (isCustomer(authentication)) {

            return ResponseEntity.ok(
                    productService.getCatalog());
        }

        return ResponseEntity.ok(
                productService.getProducts());
    }

    // 3. GET PRODUCT BY ID

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<?> getProductById(
            @PathVariable Long id,
            Authentication authentication) {

        if (isCustomer(authentication)) {

            return ResponseEntity.ok(
                    productService.getCatalogProduct(id));
        }

        return ResponseEntity.ok(
                productService.getProductById(id));
    }

    // 4. UPDATE PRODUCT

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateRequest request) {

        return ResponseEntity.ok(
                productService.updateProduct(id, request)
        );
    }

    // 5. UPDATE PRODUCT STATUS

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusRequest request) {

        return ResponseEntity.ok(
                productService.updateStatus(
                        id,
                        request.getActive()
                )
        );
    }

    // 6. SOFT DELETE PRODUCT

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long id) {

        productService.deleteProduct(id);

        return ResponseEntity.noContent().build();
    }

    // CHECK CUSTOMER ROLE

    private boolean isCustomer(
            Authentication authentication) {

        return authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority()
                                .equals("ROLE_CUSTOMER"));
    }
}