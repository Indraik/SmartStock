package com.smartstock.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/authenticated")
    public Map<String, Object> authenticated(
            Authentication authentication) {

        return Map.of(
                "message", "Authentication successful",
                "email", authentication.getName(),
                "authorities", authentication.getAuthorities()
        );
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public String admin() {

        return "Welcome ADMIN";
    }

    @GetMapping("/staff")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public String staff() {

        return "Welcome STAFF or ADMIN";
    }

    @GetMapping("/customer")
    @PreAuthorize("hasRole('CUSTOMER')")
    public String customer() {

        return "Welcome CUSTOMER";
    }
}