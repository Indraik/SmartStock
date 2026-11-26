package com.smartstock.backend.integration;

import com.smartstock.backend.dto.CreateOrderRequest;
import com.smartstock.backend.dto.OrderItemRequest;
import com.smartstock.backend.dto.OrderResponse;

import com.smartstock.backend.entity.Category;
import com.smartstock.backend.entity.Supplier;
import com.smartstock.backend.entity.Product;
import com.smartstock.backend.entity.User;
import com.smartstock.backend.entity.Role;

import com.smartstock.backend.enums.RoleName;
import com.smartstock.backend.enums.OrderStatus;

import com.smartstock.backend.exception.InsufficientStockException;
import com.smartstock.backend.exception.InvalidOrderStatusException;

import com.smartstock.backend.repository.*;
import com.smartstock.backend.service.OrderService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class OrderIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    private User customerA;
    private User customerB;

    private Category category;
    private Supplier supplier;

    @BeforeEach
    void setUp() {

        Role customerRole = roleRepository
                .findByName(RoleName.CUSTOMER)
                .orElseThrow();

        customerA = createCustomer(customerRole);
        customerB = createCustomer(customerRole);

        category = new Category();

        category.setName("Test-" + UUID.randomUUID());
        category.setActive(true);

        category = categoryRepository.save(category);

        supplier = new Supplier();

        supplier.setCompanyName("Test Supplier");
        supplier.setActive(true);

        supplier = supplierRepository.save(supplier);
    }

    // TEST 1: PREVENT OVERSELLING

    @Test
    void shouldPreventConcurrentOverselling()
            throws Exception {

        Product product = createProduct(1);

        long initialOrderCount =
                orderRepository.count();

        CreateOrderRequest request =
                createRequest(product.getId(), 1);

        ExecutorService executor =
                Executors.newFixedThreadPool(2);

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        try {

            Future<Boolean> resultA =
                    executor.submit(() -> {

                        ready.countDown();
                        start.await();

                        return attemptOrder(
                                request,
                                customerA.getEmail()
                        );
                    });

            Future<Boolean> resultB =
                    executor.submit(() -> {

                        ready.countDown();
                        start.await();

                        return attemptOrder(
                                request,
                                customerB.getEmail()
                        );
                    });

            assertTrue(
                    ready.await(10, TimeUnit.SECONDS)
            );

            start.countDown();

            int successfulOrders = 0;

            if (resultA.get(30, TimeUnit.SECONDS)) {
                successfulOrders++;
            }

            if (resultB.get(30, TimeUnit.SECONDS)) {
                successfulOrders++;
            }

            Product updatedProduct =
                    productRepository.findById(
                            product.getId()
                    ).orElseThrow();

            assertEquals(1, successfulOrders);

            assertEquals(
                    0,
                    updatedProduct.getStockQuantity()
            );

            assertEquals(
                    initialOrderCount + 1,
                    orderRepository.count()
            );

        } finally {

            start.countDown();
            executor.shutdownNow();
        }
    }

    // TEST 2: TRANSACTION ROLLBACK

    @Test
    void shouldRollbackFailedOrder() {

        Product productA = createProduct(10);
        Product productB = createProduct(2);

        long initialOrderCount =
                orderRepository.count();

        CreateOrderRequest request =
                new CreateOrderRequest(
                        null,
                        List.of(
                                new OrderItemRequest(
                                        productA.getId(), 5),

                                new OrderItemRequest(
                                        productB.getId(), 100)
                        )
                );

        assertThrows(
                InsufficientStockException.class,
                () -> orderService.createOrder(
                        request,
                        customerA.getEmail()
                )
        );

        Product updatedA =
                productRepository.findById(
                        productA.getId()
                ).orElseThrow();

        Product updatedB =
                productRepository.findById(
                        productB.getId()
                ).orElseThrow();

        assertEquals(10, updatedA.getStockQuantity());

        assertEquals(2, updatedB.getStockQuantity());

        assertEquals(
                initialOrderCount,
                orderRepository.count()
        );
    }

    // TEST 3: PREVENT DOUBLE CANCELLATION

    @Test
    void shouldRestoreStockOnlyOnce()
            throws Exception {

        Product product = createProduct(10);

        OrderResponse order =
                orderService.createOrder(
                        createRequest(product.getId(), 3),
                        customerA.getEmail()
                );

        assertEquals(
                7,
                productRepository.findById(
                        product.getId()
                ).orElseThrow().getStockQuantity()
        );

        ExecutorService executor =
                Executors.newFixedThreadPool(2);

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        try {

            Future<Boolean> resultA =
                    executor.submit(() -> {

                        ready.countDown();
                        start.await();

                        return attemptCancellation(
                                order.id(),
                                customerA.getEmail()
                        );
                    });

            Future<Boolean> resultB =
                    executor.submit(() -> {

                        ready.countDown();
                        start.await();

                        return attemptCancellation(
                                order.id(),
                                customerA.getEmail()
                        );
                    });

            assertTrue(
                    ready.await(10, TimeUnit.SECONDS)
            );

            start.countDown();

            int successfulCancellations = 0;

            if (resultA.get(30, TimeUnit.SECONDS)) {
                successfulCancellations++;
            }

            if (resultB.get(30, TimeUnit.SECONDS)) {
                successfulCancellations++;
            }

            assertEquals(
                    1,
                    successfulCancellations
            );

            assertEquals(
                    10,
                    productRepository.findById(
                            product.getId()
                    ).orElseThrow().getStockQuantity()
            );

            assertEquals(
                    OrderStatus.CANCELLED,
                    orderRepository.findById(
                            order.id()
                    ).orElseThrow().getStatus()
            );

        } finally {

            start.countDown();
            executor.shutdownNow();
        }
    }

    // HELPER: CREATE CUSTOMER

    private User createCustomer(Role role) {

        User user = new User();

        user.setName("Integration Test Customer");

        user.setEmail(
                UUID.randomUUID() + "@example.com"
        );

        user.setPasswordHash("test-only-placeholder");

        user.setRole(role);
        user.setEnabled(true);

        return userRepository.save(user);
    }

    // HELPER: CREATE PRODUCT

    private Product createProduct(int stock) {

        Product product = new Product();

        product.setName("Integration Test Product");

        product.setSku(
                "TEST-" + UUID.randomUUID()
        );

        product.setPrice(new BigDecimal("100.00"));

        product.setStockQuantity(stock);
        product.setLowStockThreshold(5);

        product.setCategory(category);
        product.setSupplier(supplier);

        product.setActive(true);

        return productRepository.save(product);
    }

    // HELPER: CREATE REQUEST

    private CreateOrderRequest createRequest(
            Long productId,
            int quantity) {

        return new CreateOrderRequest(
                null,
                List.of(
                        new OrderItemRequest(
                                productId,
                                quantity
                        )
                )
        );
    }

    // HELPER: ATTEMPT ORDER

    private boolean attemptOrder(
            CreateOrderRequest request,
            String email) {

        try {

            orderService.createOrder(request, email);

            return true;

        } catch (InsufficientStockException ex) {

            return false;
        }
    }

    // HELPER: ATTEMPT CANCELLATION

    private boolean attemptCancellation(
            Long orderId,
            String email) {

        try {

            orderService.cancelOrder(orderId, email);

            return true;

        } catch (InvalidOrderStatusException ex) {

            return false;
        }
    }
}