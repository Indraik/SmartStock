package com.smartstock.backend.service;

import com.smartstock.backend.dto.ProductRequest;
import com.smartstock.backend.exception.DuplicateResourceException;
import com.smartstock.backend.exception.ResourceNotFoundException;
import com.smartstock.backend.repository.CategoryRepository;
import com.smartstock.backend.repository.ProductRepository;
import com.smartstock.backend.repository.SupplierRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @InjectMocks
    private ProductService productService;

    @Test
    void shouldRejectDuplicateSku() {

        ProductRequest request = new ProductRequest(
                "Wireless Mouse",
                "Test product",
                "mou-log-001",
                new BigDecimal("799.00"),
                50,
                5,
                1L,
                1L
        );

        when(productRepository.existsBySku("MOU-LOG-001"))
                .thenReturn(true);

        assertThrows(
                DuplicateResourceException.class,
                () -> productService.createProduct(request)
        );

        verify(productRepository, never()).save(any());
    }

    @Test
    void shouldRejectNonexistentProduct() {

        when(productRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> productService.getProductById(999L)
        );
    }
}