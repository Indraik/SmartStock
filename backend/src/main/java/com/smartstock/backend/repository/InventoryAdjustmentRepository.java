package com.smartstock.backend.repository;

import com.smartstock.backend.entity.InventoryAdjustment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryAdjustmentRepository
        extends JpaRepository<InventoryAdjustment, Long> {

    @EntityGraph(attributePaths = {
            "product",
            "changedBy"
    })
    Page<InventoryAdjustment>
    findByProductIdOrderByCreatedAtDescIdDesc(
            Long productId,
            Pageable pageable
    );
}