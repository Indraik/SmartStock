package com.smartstock.backend.dto;

import jakarta.validation.constraints.NotNull;

public class StatusRequest {

    @NotNull(message = "Active status is required")
    private Boolean active;

    public StatusRequest() {
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}