package com.smartstock.backend.service;

import com.smartstock.backend.dto.CreateOrderRequest;
import com.smartstock.backend.dto.OrderItemRequest;
import com.smartstock.backend.dto.OrderItemResponse;
import com.smartstock.backend.dto.OrderResponse;

import com.smartstock.backend.entity.Order;
import com.smartstock.backend.entity.OrderItem;
import com.smartstock.backend.entity.Product;
import com.smartstock.backend.entity.User;

import com.smartstock.backend.enums.OrderStatus;
import com.smartstock.backend.enums.RoleName;

import com.smartstock.backend.exception.InsufficientStockException;
import com.smartstock.backend.exception.ResourceNotFoundException;

import com.smartstock.backend.repository.OrderRepository;
import com.smartstock.backend.repository.ProductRepository;
import com.smartstock.backend.repository.UserRepository;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public OrderService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            UserRepository userRepository) {

        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    // 1. CREATE ORDER

    @Transactional
    public OrderResponse createOrder(
            CreateOrderRequest request,
            String email) {

        // Identify authenticated user

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"));

        // Identify customer

        User customer = resolveCustomer(
                currentUser,
                request.customerId()
        );

        // Combine duplicate products and sort by ID

        Map<Long, Integer> requestedProducts =
                new TreeMap<>();

        for (OrderItemRequest item : request.items()) {

            requestedProducts.merge(
                    item.productId(),
                    item.quantity(),
                    Integer::sum
            );
        }

        // Create order

        Order order = new Order();

        order.setCustomer(customer);
        order.setStatus(OrderStatus.PENDING);

        BigDecimal totalAmount = BigDecimal.ZERO;

        // Process each requested product

        for (Map.Entry<Long, Integer> entry :
                requestedProducts.entrySet()) {

            Long productId = entry.getKey();
            Integer quantity = entry.getValue();

            if (quantity > 1000000) {

                throw new IllegalArgumentException(
                        "Maximum quantity per product is 1000000");
            }

            // Lock product row

            Product product = productRepository
                    .findByIdForUpdate(productId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Product not found with id: "
                                            + productId));

            // Validate product status

            if (!product.isActive()) {

                throw new IllegalArgumentException(
                        "Product is inactive: "
                                + product.getName());
            }

            // Validate stock

            if (product.getStockQuantity() < quantity) {

                throw new InsufficientStockException(
                        "Insufficient stock for "
                                + product.getName()
                                + ". Available: "
                                + product.getStockQuantity()
                                + ", Requested: "
                                + quantity);
            }

            // Create order item using database price

            OrderItem orderItem = new OrderItem(

                    product,
                    quantity,
                    product.getPrice()
            );

            // Add item to order

            order.addItem(orderItem);

            // Calculate total

            totalAmount = totalAmount.add(
                    orderItem.getSubtotal()
            );

            // Deduct stock

            product.setStockQuantity(
                    product.getStockQuantity() - quantity
            );
        }

        // Set final order total

        order.setTotalAmount(totalAmount);

        // Save order and associated order items

        Order savedOrder =
                orderRepository.saveAndFlush(order);

        return mapToResponse(savedOrder);
    }

    // 2. RESOLVE CUSTOMER

    private User resolveCustomer(
            User currentUser,
            Long customerId) {

        if (!currentUser.isEnabled()) {

            throw new AccessDeniedException(
                    "Account is disabled");
        }

        RoleName role = currentUser.getRole().getName();

        // Customers can place orders only for themselves

        if (role == RoleName.CUSTOMER) {

            if (customerId != null
                    && !customerId.equals(currentUser.getId())) {

                throw new AccessDeniedException(
                        "Cannot place orders for another customer");
            }

            return currentUser;
        }

        // ADMIN and STAFF place orders for customers

        if (role != RoleName.ADMIN
                && role != RoleName.STAFF) {

            throw new AccessDeniedException(
                    "Order creation is not permitted");
        }

        if (customerId == null) {

            throw new IllegalArgumentException(
                    "Customer ID is required");
        }

        User customer = userRepository.findById(customerId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Customer not found with id: "
                                        + customerId));

        if (customer.getRole().getName()
                != RoleName.CUSTOMER) {

            throw new IllegalArgumentException(
                    "Selected user is not a customer");
        }

        if (!customer.isEnabled()) {

            throw new IllegalArgumentException(
                    "Customer account is disabled");
        }

        return customer;
    }

    // 3. MAP ORDER ITEM

    private OrderItemResponse mapToItemResponse(
            OrderItem item) {

        return new OrderItemResponse(

                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getProduct().getSku(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getSubtotal()
        );
    }

    // 4. MAP ORDER RESPONSE

    private OrderResponse mapToResponse(Order order) {

        List<OrderItemResponse> items =
                order.getItems()
                        .stream()
                        .map(this::mapToItemResponse)
                        .toList();

        return new OrderResponse(

                order.getId(),
                order.getCustomer().getId(),
                order.getCustomer().getName(),
                order.getStatus(),
                items,
                order.getTotalAmount(),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}