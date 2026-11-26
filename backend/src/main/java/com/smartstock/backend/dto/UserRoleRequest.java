package com.smartstock.backend.dto;

import com.smartstock.backend.enums.RoleName;
import jakarta.validation.constraints.NotNull;

public record UserRoleRequest(

        @NotNull(message = "Role is required")
        RoleName role

) {
}