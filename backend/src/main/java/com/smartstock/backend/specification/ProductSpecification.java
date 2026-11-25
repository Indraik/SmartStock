package com.smartstock.backend.specification;

import com.smartstock.backend.entity.Product;

import jakarta.persistence.criteria.Predicate;

import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class ProductSpecification {

    public static Specification<Product> filterProducts(
            String search,
            Long categoryId,
            Long supplierId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean available,
            Boolean active) {

        return (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            // 1. Search by product name or SKU

            if (search != null && !search.isBlank()) {

                String escapedSearch = search.trim()
                        .toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\")
                        .replace("%", "\\%")
                        .replace("_", "\\_");

                String keyword = "%" + escapedSearch + "%";

                Predicate namePredicate = cb.like(
                        cb.lower(root.get("name")),
                        keyword,
                        '\\'
                );

                Predicate skuPredicate = cb.like(
                        cb.lower(root.get("sku")),
                        keyword,
                        '\\'
                );

                predicates.add(
                        cb.or(namePredicate, skuPredicate)
                );
            }

            // 2. Category filter

            if (categoryId != null) {

                predicates.add(
                        cb.equal(
                                root.get("category").get("id"),
                                categoryId
                        )
                );
            }

            // 3. Supplier filter

            if (supplierId != null) {

                predicates.add(
                        cb.equal(
                                root.get("supplier").get("id"),
                                supplierId
                        )
                );
            }

            // 4. Minimum price filter

            if (minPrice != null) {

                predicates.add(
                        cb.greaterThanOrEqualTo(
                                root.<BigDecimal>get("price"),
                                minPrice
                        )
                );
            }

            // 5. Maximum price filter

            if (maxPrice != null) {

                predicates.add(
                        cb.lessThanOrEqualTo(
                                root.<BigDecimal>get("price"),
                                maxPrice
                        )
                );
            }

            // 6. Availability filter

            if (available != null) {

                if (available) {

                    predicates.add(
                            cb.greaterThan(
                                    root.<Integer>get("stockQuantity"),
                                    0
                            )
                    );

                } else {

                    predicates.add(
                            cb.equal(
                                    root.get("stockQuantity"),
                                    0
                            )
                    );
                }
            }

            // 7. Active status filter

            if (active != null) {

                predicates.add(
                        cb.equal(root.get("active"), active)
                );
            }

            // Combine all conditions using AND

            return cb.and(
                    predicates.toArray(new Predicate[0])
            );
        };
    }
}