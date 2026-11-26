package com.smartstock.backend.repository;

import com.smartstock.backend.entity.Order;
import com.smartstock.backend.enums.OrderStatus;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.domain.Specification;

import java.util.Optional;

public interface OrderRepository
        extends JpaRepository<Order, Long>,
        JpaSpecificationExecutor<Order> {

    Page<Order> findByCustomerId(
            Long customerId,
            Pageable pageable
    );

    Optional<Order> findByIdAndCustomerId(
            Long id,
            Long customerId
    );

    long countByStatus(OrderStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdForUpdate(
            @Param("id") Long id
    );

    @Override
    @EntityGraph(attributePaths = {"customer"})
    Page<Order> findAll(
            Specification<Order> specification,
            Pageable pageable
    );
}