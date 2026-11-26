package com.smartstock.backend.dto;

import com.smartstock.backend.enums.RoleName;

import java.time.LocalDateTime;

public record UserResponse(

        Long id,

        String name,

        String email,

        RoleName role,

        boolean enabled,

        LocalDateTime createdAt,

        LocalDateTime updatedAt

) {
}