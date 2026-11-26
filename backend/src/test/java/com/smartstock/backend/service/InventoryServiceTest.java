package com.smartstock.backend.service;

import com.smartstock.backend.dto.InventoryAdjustmentRequest;
import com.smartstock.backend.dto.InventoryAdjustmentResponse;

import com.smartstock.backend.entity.Product;
import com.smartstock.backend.entity.User;

import com.smartstock.backend.enums.AdjustmentType;
import com.smartstock.backend.exception.InsufficientStockException;

import com.smartstock.backend.repository.InventoryAdjustmentRepository;
import com.smartstock.backend.repository.ProductRepository;
import com.smartstock.backend.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryAdjustmentRepository adjustmentRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private Product product;

    private User user;

    @BeforeEach
    void setUp() {

        product = new Product();
        product.setName("Wireless Mouse");
        product.setStockQuantity(50);
        product.setActive(true);

        user = new User();
        user.setEmail("admin@smartstock.com");

        when(userRepository.findByEmail(
                "admin@smartstock.com"))
                .thenReturn(Optional.of(user));

        when(productRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(product));
    }

    @Test
    void shouldAddStockSuccessfully() {

        InventoryAdjustmentRequest request =
                new InventoryAdjustmentRequest(
                        AdjustmentType.ADD,
                        20,
                        "New stock received"
                );

        when(adjustmentRepository.save(any()))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        InventoryAdjustmentResponse response =
                inventoryService.adjustStock(
                        1L,
                        request,
                        "admin@smartstock.com"
                );

        assertEquals(70, product.getStockQuantity());
        assertEquals(50, response.previousQuantity());
        assertEquals(70, response.newQuantity());
        assertEquals(20, response.adjustmentQuantity());

        verify(adjustmentRepository).save(any());
    }

    @Test
    void shouldRemoveStockSuccessfully() {

        InventoryAdjustmentRequest request =
                new InventoryAdjustmentRequest(
                        AdjustmentType.REMOVE,
                        10,
                        "Damaged products"
                );

        when(adjustmentRepository.save(any()))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        inventoryService.adjustStock(
                1L,
                request,
                "admin@smartstock.com"
        );

        assertEquals(40, product.getStockQuantity());

        verify(adjustmentRepository).save(any());
    }

    @Test
    void shouldRejectInsufficientStock() {

        InventoryAdjustmentRequest request =
                new InventoryAdjustmentRequest(
                        AdjustmentType.REMOVE,
                        100,
                        "Insufficient stock test"
                );

        assertThrows(
                InsufficientStockException.class,
                () -> inventoryService.adjustStock(
                        1L,
                        request,
                        "admin@smartstock.com"
                )
        );

        assertEquals(50, product.getStockQuantity());

        verify(adjustmentRepository, never())
                .save(any());
    }
}