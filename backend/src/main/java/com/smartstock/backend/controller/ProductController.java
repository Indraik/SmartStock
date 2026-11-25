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

import com.smartstock.backend.dto.PageResponse;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.Set;

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
    public ResponseEntity<PageResponse<?>> getProducts(

            @RequestParam(required = false)
            String search,

            @RequestParam(required = false)
            Long categoryId,

            @RequestParam(required = false)
            Long supplierId,

            @RequestParam(required = false)
            BigDecimal minPrice,

            @RequestParam(required = false)
            BigDecimal maxPrice,

            @RequestParam(required = false)
            Boolean available,

            @RequestParam(required = false)
            Boolean active,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size,

            @RequestParam(defaultValue = "name,asc")
            String sort,

            Authentication authentication) {

        // 1. Validate pagination

        if (page < 0) {

            throw new IllegalArgumentException(
                    "Page number cannot be negative");
        }

        if (size < 1 || size > 100) {

            throw new IllegalArgumentException(
                    "Page size must be between 1 and 100");
        }

        // 2. Check user role

        boolean customer = isCustomer(authentication);

        // 3. Parse sorting parameter

        String[] sortParts = sort.split(",", -1);

        if (sortParts.length != 2) {

            throw new IllegalArgumentException(
                    "Sort format must be field,asc or field,desc");
        }

        String sortField = sortParts[0].trim();
        String sortDirection = sortParts[1].trim();

        // 4. Validate sorting field

        Set<String> allowedFields = customer
                ? CUSTOMER_SORT_FIELDS
                : ALLOWED_SORT_FIELDS;

        if (!allowedFields.contains(sortField)) {

            throw new IllegalArgumentException(
                    "Invalid sorting field: " + sortField);
        }

        // 5. Validate sorting direction

        Sort.Direction direction;

        if (sortDirection.equalsIgnoreCase("asc")) {

            direction = Sort.Direction.ASC;

        } else if (sortDirection.equalsIgnoreCase("desc")) {

            direction = Sort.Direction.DESC;

        } else {

            throw new IllegalArgumentException(
                    "Sort direction must be asc or desc");
        }

        // 6. Create sorting

        Sort sorting = Sort.by(direction, sortField);

        if (!sortField.equals("id")) {

            sorting = sorting.and(Sort.by("id").ascending());
        }

        // 7. Create pagination object

        Pageable pageable = PageRequest.of(
                page,
                size,
                sorting
        );

        // 8. Execute search

        return ResponseEntity.ok(
                productService.searchProducts(
                        search,
                        categoryId,
                        supplierId,
                        minPrice,
                        maxPrice,
                        available,
                        active,
                        customer,
                        pageable
                )
        );
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

    private static final Set<String> ALLOWED_SORT_FIELDS =
            Set.of(
                    "id",
                    "name",
                    "price",
                    "sku",
                    "stockQuantity",
                    "createdAt",
                    "updatedAt"
            );

    private static final Set<String> CUSTOMER_SORT_FIELDS =
            Set.of(
                    "id",
                    "name",
                    "price",
                    "sku"
            );
}