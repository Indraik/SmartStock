package com.smartstock.backend.service;

import com.smartstock.backend.dto.InventoryAdjustmentRequest;
import com.smartstock.backend.dto.InventoryAdjustmentResponse;
import com.smartstock.backend.dto.InventoryResponse;
import com.smartstock.backend.dto.PageResponse;

import com.smartstock.backend.entity.InventoryAdjustment;
import com.smartstock.backend.entity.Product;
import com.smartstock.backend.entity.User;

import com.smartstock.backend.enums.AdjustmentType;

import com.smartstock.backend.exception.InsufficientStockException;
import com.smartstock.backend.exception.ResourceNotFoundException;

import com.smartstock.backend.repository.InventoryAdjustmentRepository;
import com.smartstock.backend.repository.ProductRepository;
import com.smartstock.backend.repository.UserRepository;

import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class InventoryService {

    private final ProductRepository productRepository;
    private final InventoryAdjustmentRepository adjustmentRepository;
    private final UserRepository userRepository;

    public InventoryService(
            ProductRepository productRepository,
            InventoryAdjustmentRepository adjustmentRepository,
            UserRepository userRepository) {

        this.productRepository = productRepository;
        this.adjustmentRepository = adjustmentRepository;
        this.userRepository = userRepository;
    }

    // 1. UPDATE INVENTORY

    @Transactional
    @PreAuthorize("""
            hasRole('ADMIN') or
            (hasRole('STAFF') and
             #request.adjustmentType().name() != 'ADJUST')
            """)
    public InventoryAdjustmentResponse adjustStock(
            Long productId,
            InventoryAdjustmentRequest request,
            String email) {

        // Retrieve the authenticated user

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"));

        // Lock the product row

        Product product = productRepository
                .findByIdForUpdate(productId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with id: "
                                        + productId));

        // Validate product status

        if (!product.isActive()) {

            throw new IllegalArgumentException(
                    "Cannot adjust stock of an inactive product");
        }

        int previousQuantity = product.getStockQuantity();

        int quantity = request.quantity();

        AdjustmentType type = request.adjustmentType();

        // Validate ADD and REMOVE operations

        if (type != AdjustmentType.ADJUST && quantity <= 0) {

            throw new IllegalArgumentException(
                    "Quantity must be greater than zero");
        }

        // Calculate the new stock quantity

        long calculatedQuantity = switch (type) {

            case ADD -> (long) previousQuantity + quantity;

            case REMOVE -> (long) previousQuantity - quantity;

            case ADJUST -> quantity;
        };

        // Prevent negative inventory

        if (calculatedQuantity < 0) {

            throw new InsufficientStockException(
                    "Insufficient stock. Available quantity: "
                            + previousQuantity);
        }

        // Prevent integer overflow

        if (calculatedQuantity > Integer.MAX_VALUE) {

            throw new IllegalArgumentException(
                    "Stock quantity exceeds the supported limit");
        }

        int newQuantity = (int) calculatedQuantity;

        // Update the product

        product.setStockQuantity(newQuantity);

        // Create inventory adjustment record

        InventoryAdjustment adjustment =
                new InventoryAdjustment(

                        product,
                        type,
                        previousQuantity,
                        newQuantity,
                        request.reason().trim(),
                        user
                );

        InventoryAdjustment savedAdjustment =
                adjustmentRepository.save(adjustment);

        return mapToAdjustmentResponse(savedAdjustment);
    }

    // 2. GET INVENTORY

    @Transactional(readOnly = true)
    public PageResponse<InventoryResponse> getInventory(
            Pageable pageable) {

        return PageResponse.from(

                productRepository.findAll(pageable)
                        .map(this::mapToInventoryResponse)
        );
    }

    // 3. GET LOW-STOCK PRODUCTS

    @Transactional(readOnly = true)
    public PageResponse<InventoryResponse> getLowStockProducts(
            Pageable pageable) {

        return PageResponse.from(

                productRepository.findLowStockProducts(pageable)
                        .map(this::mapToInventoryResponse)
        );
    }

    // 4. GET PRODUCT ADJUSTMENT HISTORY

    @Transactional(readOnly = true)
    public PageResponse<InventoryAdjustmentResponse>
    getAdjustmentHistory(
            Long productId,
            Pageable pageable) {

        if (!productRepository.existsById(productId)) {

            throw new ResourceNotFoundException(
                    "Product not found with id: " + productId);
        }

        return PageResponse.from(

                adjustmentRepository
                        .findByProductIdOrderByCreatedAtDescIdDesc(
                                productId,
                                pageable
                        )
                        .map(this::mapToAdjustmentResponse)
        );
    }

    // 5. MAP INVENTORY RESPONSE

    private InventoryResponse mapToInventoryResponse(
            Product product) {

        String stockStatus;

        if (product.getStockQuantity() == 0) {

            stockStatus = "OUT_OF_STOCK";

        } else if (product.getStockQuantity()
                <= product.getLowStockThreshold()) {

            stockStatus = "LOW_STOCK";

        } else {

            stockStatus = "IN_STOCK";
        }

        return new InventoryResponse(

                product.getId(),
                product.getName(),
                product.getSku(),
                product.getStockQuantity(),
                product.getLowStockThreshold(),
                stockStatus,
                product.isActive()
        );
    }

    // 6. MAP ADJUSTMENT RESPONSE

    private InventoryAdjustmentResponse mapToAdjustmentResponse(
            InventoryAdjustment adjustment) {

        return new InventoryAdjustmentResponse(

                adjustment.getId(),
                adjustment.getProduct().getId(),
                adjustment.getProduct().getName(),
                adjustment.getAdjustmentType(),
                adjustment.getPreviousQuantity(),
                adjustment.getNewQuantity(),
                adjustment.getAdjustmentQuantity(),
                adjustment.getReason(),
                adjustment.getChangedBy().getEmail(),
                adjustment.getCreatedAt()
        );
    }
}