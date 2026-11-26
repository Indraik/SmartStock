package com.smartstock.backend.controller;

import com.smartstock.backend.dto.PageResponse;
import com.smartstock.backend.dto.UserResponse;
import com.smartstock.backend.dto.UserStatusRequest;
import com.smartstock.backend.dto.UserRoleRequest;

import com.smartstock.backend.service.UserService;

import jakarta.validation.Valid;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {

        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<UserResponse>> getUsers(

            @RequestParam(defaultValue = "0") int page,

            @RequestParam(defaultValue = "10") int size) {

        if (page < 0 || size < 1 || size > 100) {

            throw new IllegalArgumentException(
                    "Invalid pagination parameters");
        }

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("id").ascending()
        );

        return ResponseEntity.ok(
                userService.getUsers(pageable)
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                userService.getUserById(id)
        );
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> getCurrentUser(
            Authentication authentication) {

        return ResponseEntity.ok(
                userService.getCurrentUser(
                        authentication.getName())
        );
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateStatus(

            @PathVariable Long id,

            @Valid @RequestBody UserStatusRequest request,

            Authentication authentication) {

        return ResponseEntity.ok(
                userService.updateStatus(
                        id,
                        request.enabled(),
                        authentication.getName()
                )
        );
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateRole(

            @PathVariable Long id,

            @Valid @RequestBody UserRoleRequest request,

            Authentication authentication) {

        return ResponseEntity.ok(
                userService.updateRole(
                        id,
                        request.role(),
                        authentication.getName()
                )
        );
    }
}