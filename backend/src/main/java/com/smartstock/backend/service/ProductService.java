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

    // 2. GET ALL PRODUCTS - ADMIN AND STAFF

    @Transactional(readOnly = true)
    public List<ProductResponse> getProducts() {

        return productRepository
                .findAll(Sort.by("name").ascending())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // 3. GET CUSTOMER CATALOG

    @Transactional(readOnly = true)
    public List<ProductCatalogResponse> getCatalog() {

        return productRepository
                .findAllByActiveTrueOrderByNameAsc()
                .stream()
                .map(this::mapToCatalogResponse)
                .toList();
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