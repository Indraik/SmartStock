package com.smartstock.backend.repository;

import com.smartstock.backend.entity.Product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository
        extends JpaRepository<Product, Long>,
        JpaSpecificationExecutor<Product> {

    boolean existsBySku(String sku);

    Optional<Product> findBySku(String sku);

    Optional<Product> findByIdAndActiveTrue(Long id);

    @Override
    @EntityGraph(attributePaths = {
            "category",
            "supplier"
    })
    Page<Product> findAll(
            Specification<Product> specification,
            Pageable pageable
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(
            @Param("id") Long id
    );

    @EntityGraph(attributePaths = {"category", "supplier"})
    @Query("""
        SELECT p FROM Product p
        WHERE p.active = true
        AND p.stockQuantity <= p.lowStockThreshold
        """)
    Page<Product> findLowStockProducts(Pageable pageable);
}