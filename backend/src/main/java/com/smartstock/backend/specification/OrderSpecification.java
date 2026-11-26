package com.smartstock.backend.specification;

import com.smartstock.backend.entity.Order;
import com.smartstock.backend.enums.OrderStatus;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class OrderSpecification {

    public static Specification<Order> filterOrders(
            Long customerId,
            OrderStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            BigDecimal minTotal,
            BigDecimal maxTotal) {

        return (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            if (customerId != null) {
                predicates.add(cb.equal(
                        root.get("customer").get("id"),
                        customerId));
            }

            if (status != null) {
                predicates.add(cb.equal(
                        root.get("status"), status));
            }

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        root.<LocalDateTime>get("createdAt"),
                        fromDate));
            }

            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(
                        root.<LocalDateTime>get("createdAt"),
                        toDate));
            }

            if (minTotal != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        root.<BigDecimal>get("totalAmount"),
                        minTotal));
            }

            if (maxTotal != null) {
                predicates.add(cb.lessThanOrEqualTo(
                        root.<BigDecimal>get("totalAmount"),
                        maxTotal));
            }

            return cb.and(
                    predicates.toArray(new Predicate[0])
            );
        };
    }
}