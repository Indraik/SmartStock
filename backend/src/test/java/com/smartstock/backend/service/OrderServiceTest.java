package com.smartstock.backend.service;

import com.smartstock.backend.dto.CreateOrderRequest;
import com.smartstock.backend.dto.OrderItemRequest;
import com.smartstock.backend.dto.OrderResponse;

import com.smartstock.backend.entity.Product;
import com.smartstock.backend.entity.Role;
import com.smartstock.backend.entity.User;

import com.smartstock.backend.enums.RoleName;
import com.smartstock.backend.enums.OrderStatus;

import com.smartstock.backend.exception.InsufficientStockException;

import com.smartstock.backend.repository.OrderRepository;
import com.smartstock.backend.repository.ProductRepository;
import com.smartstock.backend.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderService orderService;

    private Product product;

    @BeforeEach
    void setUp() {

        Role role = new Role();
        role.setName(RoleName.CUSTOMER);

        User customer = new User();
        customer.setName("Test Customer");
        customer.setEmail("customer@example.com");
        customer.setEnabled(true);
        customer.setRole(role);

        product = new Product();
        product.setName("Wireless Mouse");
        product.setSku("MOU-LOG-001");
        product.setPrice(new BigDecimal("899.00"));
        product.setStockQuantity(10);
        product.setActive(true);

        when(userRepository.findByEmail(
                "customer@example.com"))
                .thenReturn(Optional.of(customer));

        when(productRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(product));
    }

    @Test
    void shouldCreateOrderSuccessfully() {

        CreateOrderRequest request =
                new CreateOrderRequest(
                        null,
                        List.of(
                                new OrderItemRequest(1L, 2)
                        )
                );

        when(orderRepository.saveAndFlush(any()))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        OrderResponse response =
                orderService.createOrder(
                        request,
                        "customer@example.com"
                );

        assertEquals(
                new BigDecimal("1798.00"),
                response.totalAmount()
        );

        assertEquals(8, product.getStockQuantity());

        assertEquals(
                OrderStatus.PENDING,
                response.status()
        );

        assertEquals(1, response.items().size());

        verify(orderRepository).saveAndFlush(any());
    }

    @Test
    void shouldRejectOrderWhenStockIsInsufficient() {

        CreateOrderRequest request =
                new CreateOrderRequest(
                        null,
                        List.of(
                                new OrderItemRequest(1L, 100)
                        )
                );

        assertThrows(
                InsufficientStockException.class,
                () -> orderService.createOrder(
                        request,
                        "customer@example.com"
                )
        );

        assertEquals(10, product.getStockQuantity());

        verify(orderRepository, never())
                .saveAndFlush(any());
    }

    @Test
    void shouldCombineDuplicateProductQuantities() {

        CreateOrderRequest request =
                new CreateOrderRequest(
                        null,
                        List.of(
                                new OrderItemRequest(1L, 2),
                                new OrderItemRequest(1L, 3)
                        )
                );

        when(orderRepository.saveAndFlush(any()))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        OrderResponse response =
                orderService.createOrder(
                        request,
                        "customer@example.com"
                );

        assertEquals(1, response.items().size());

        assertEquals(5, response.items().get(0).quantity());

        assertEquals(
                new BigDecimal("4495.00"),
                response.totalAmount()
        );

        assertEquals(5, product.getStockQuantity());
    }
}