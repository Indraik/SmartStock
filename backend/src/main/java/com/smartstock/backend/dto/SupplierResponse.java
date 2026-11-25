package com.smartstock.backend.dto;

import java.time.LocalDateTime;

public class SupplierResponse {

    private final Long id;
    private final String companyName;
    private final String contactName;
    private final String email;
    private final String phone;
    private final String address;
    private final boolean active;
    private final LocalDateTime createdAt;

    public SupplierResponse(
            Long id,
            String companyName,
            String contactName,
            String email,
            String phone,
            String address,
            boolean active,
            LocalDateTime createdAt) {

        this.id = id;
        this.companyName = companyName;
        this.contactName = contactName;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.active = active;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getCompanyName() {
        return companyName;
    }

    public String getContactName() {
        return contactName;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getAddress() {
        return address;
    }

    public boolean isActive() {
        return active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}