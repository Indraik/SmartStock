package com.smartstock.backend.service;

import com.smartstock.backend.dto.ProductRequest;
import com.smartstock.backend.dto.ProductUpdateRequest;
import com.smartstock.backend.dto.ProductResponse;
import com.smartstock.backend.dto.ProductCatalogResponse;

import com.smartstock.backend.entity.Product;
import com.smartstock.backend.entity.Category;
import com.smartstock.backend.entity.Supplier;

import com.smartstock.backend.exception.DuplicateResourceException;
import com.smartstock.backend.exception.ResourceNotFoundException;

import com.smartstock.backend.repository.ProductRepository;
import com.smartstock.backend.repository.CategoryRepository;
import com.smartstock.backend.repository.SupplierRepository;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartstock.backend.dto.PageResponse;
import com.smartstock.backend.specification.ProductSpecification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

import java.util.List;
import java.util.Locale;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            SupplierRepository supplierRepository) {

        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
    }

    // 1. CREATE PRODUCT

    @Transactional
    public ProductResponse createProduct(
            ProductRequest request) {

        String sku = request.sku()
                .trim()
                .toUpperCase(Locale.ROOT);

        if (productRepository.existsBySku(sku)) {

            throw new DuplicateResourceException(
                    "Product with SKU already exists: " + sku);
        }

        Category category =
                findActiveCategory(request.categoryId());

        Supplier supplier =
                findActiveSupplier(request.supplierId());

        Product product = new Product();

        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setSku(sku);
        product.setPrice(request.price());
        product.setStockQuantity(request.stockQuantity());

        product.setLowStockThreshold(
                request.lowStockThreshold() == null
                        ? 5
                        : request.lowStockThreshold()
        );

        product.setCategory(category);
        product.setSupplier(supplier);
        product.setActive(true);

        Product savedProduct =
                productRepository.save(product);

        return mapToResponse(savedProduct);
    }

    @Transactional(readOnly = true)
    public PageResponse<?> searchProducts(
            String search,
            Long categoryId,
            Long supplierId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean available,
            Boolean active,
            boolean isCustomer,
            Pageable pageable) {

        // Validate category and supplier IDs

        if (categoryId != null && categoryId <= 0) {

            throw new IllegalArgumentException(
                    "Category ID must be positive");
        }

        if (supplierId != null && supplierId <= 0) {

            throw new IllegalArgumentException(
                    "Supplier ID must be positive");
        }

        // Validate minimum price

        if (minPrice != null
                && minPrice.compareTo(BigDecimal.ZERO) < 0) {

            throw new IllegalArgumentException(
                    "Minimum price cannot be negative");
        }

        // Validate maximum price

        if (maxPrice != null
                && maxPrice.compareTo(BigDecimal.ZERO) < 0) {

            throw new IllegalArgumentException(
                    "Maximum price cannot be negative");
        }

        // Validate price range

        if (minPrice != null
                && maxPrice != null
                && minPrice.compareTo(maxPrice) > 0) {

            throw new IllegalArgumentException(
                    "Minimum price cannot exceed maximum price");
        }

        // Validate search length

        if (search != null && search.length() > 150) {

            throw new IllegalArgumentException(
                    "Search cannot exceed 150 characters");
        }

        // Customer restrictions

        if (isCustomer) {

            if (supplierId != null || active != null) {

                throw new IllegalArgumentException(
                        "Supplier and active status filters "
                                + "are unavailable to customers");
            }

            active = true;
        }

        // Build specification

        Specification<Product> specification =
                ProductSpecification.filterProducts(
                        search,
                        categoryId,
                        supplierId,
                        minPrice,
                        maxPrice,
                        available,
                        active
                );

        // Execute paginated query

        Page<Product> productPage =
                productRepository.findAll(
                        specification,
                        pageable
                );

        // Return role-specific response

        if (isCustomer) {

            return PageResponse.from(
                    productPage.map(this::mapToCatalogResponse)
            );
        }

        return PageResponse.from(
                productPage.map(this::mapToResponse)
        );
    }
    // 4. GET PRODUCT BY ID - ADMIN AND STAFF

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {

        return mapToResponse(findProduct(id));
    }

    // 5. GET ACTIVE PRODUCT - CUSTOMER

    @Transactional(readOnly = true)
    public ProductCatalogResponse getCatalogProduct(Long id) {

        Product product = productRepository
                .findByIdAndActiveTrue(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with id: " + id));

        return mapToCatalogResponse(product);
    }

    // 6. UPDATE PRODUCT

    @Transactional
    public ProductResponse updateProduct(
            Long id,
            ProductUpdateRequest request) {

        Product product = findProduct(id);

        Category category =
                findActiveCategory(request.categoryId());

        Supplier supplier =
                findActiveSupplier(request.supplierId());

        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setCategory(category);
        product.setSupplier(supplier);

        productRepository.flush();

        return mapToResponse(product);
    }

    // 7. UPDATE PRODUCT STATUS

    @Transactional
    public ProductResponse updateStatus(
            Long id,
            boolean active) {

        Product product = findProduct(id);

        if (active) {

            findActiveCategory(product.getCategory().getId());

            findActiveSupplier(product.getSupplier().getId());
        }

        product.setActive(active);

        productRepository.flush();

        return mapToResponse(product);
    }

    // 8. SOFT DELETE PRODUCT

    @Transactional
    public void deleteProduct(Long id) {

        Product product = findProduct(id);

        product.setActive(false);
    }

    // FIND PRODUCT

    private Product findProduct(Long id) {

        return productRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with id: " + id));
    }

    // FIND AND VALIDATE CATEGORY

    private Category findActiveCategory(Long id) {

        Category category = categoryRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Category not found with id: " + id));

        if (!category.isActive()) {

            throw new IllegalArgumentException(
                    "Selected category is inactive");
        }

        return category;
    }

    // FIND AND VALIDATE SUPPLIER

    private Supplier findActiveSupplier(Long id) {

        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Supplier not found with id: " + id));

        if (!supplier.isActive()) {

            throw new IllegalArgumentException(
                    "Selected supplier is inactive");
        }

        return supplier;
    }

    // MAP INTERNAL PRODUCT RESPONSE

    private ProductResponse mapToResponse(Product product) {

        boolean lowStock =
                product.getStockQuantity()
                        <= product.getLowStockThreshold();

        return new ProductResponse(

                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getSku(),
                product.getPrice(),
                product.getStockQuantity(),
                product.getLowStockThreshold(),
                lowStock,
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getSupplier().getId(),
                product.getSupplier().getCompanyName(),
                product.isActive(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }

    // MAP CUSTOMER CATALOG RESPONSE

    private ProductCatalogResponse mapToCatalogResponse(
            Product product) {

        return new ProductCatalogResponse(

                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getSku(),
                product.getPrice(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getStockQuantity() > 0
        );
    }
}