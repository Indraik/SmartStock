package com.smartstock.backend.entity;

import com.smartstock.backend.enums.AdjustmentType;
import jakarta.persistence.*;
import org.hibernate.annotations.Check;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_adjustments")
@Check(constraints = """
        previous_quantity >= 0
        AND new_quantity >= 0
        AND adjustment_quantity = new_quantity - previous_quantity
        """)
public class InventoryAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(name = "adjustment_type",
            nullable = false, length = 20)
    private AdjustmentType adjustmentType;

    @Column(name = "previous_quantity", nullable = false)
    private Integer previousQuantity;

    @Column(name = "new_quantity", nullable = false)
    private Integer newQuantity;

    @Column(name = "adjustment_quantity", nullable = false)
    private Integer adjustmentQuantity;

    @Column(nullable = false, length = 500)
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "changed_by", nullable = false)
    private User changedBy;

    @Column(name = "created_at",
            nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public InventoryAdjustment() {
    }

    public InventoryAdjustment(
            Product product,
            AdjustmentType adjustmentType,
            Integer previousQuantity,
            Integer newQuantity,
            String reason,
            User changedBy) {

        this.product = product;
        this.adjustmentType = adjustmentType;
        this.previousQuantity = previousQuantity;
        this.newQuantity = newQuantity;

        this.adjustmentQuantity =
                newQuantity - previousQuantity;

        this.reason = reason;
        this.changedBy = changedBy;
    }

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Product getProduct() {
        return product;
    }

    public AdjustmentType getAdjustmentType() {
        return adjustmentType;
    }

    public Integer getPreviousQuantity() {
        return previousQuantity;
    }

    public Integer getNewQuantity() {
        return newQuantity;
    }

    public Integer getAdjustmentQuantity() {
        return adjustmentQuantity;
    }

    public String getReason() {
        return reason;
    }

    public User getChangedBy() {
        return changedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}