package com.smartstock.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            CustomUserDetailsService userDetailsService) {

        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {

        String path = request.getServletPath();

        return path.equals("/api/auth/register")
                || path.equals("/api/auth/login");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // 1. Check Authorization header
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        // 2. Extract JWT
        String token = authHeader.substring(7);

        try {

            // 3. Validate JWT and extract email
            Claims claims = jwtService.extractAllClaims(token);
            String email = claims.getSubject();

            if (email == null || email.isBlank()
                    || claims.getExpiration() == null) {

                unauthorized(response);
                return;
            }

            // 4. Check existing authentication
            if (SecurityContextHolder.getContext()
                    .getAuthentication() == null) {

                // 5. Retrieve current user details
                UserDetails userDetails =
                        userDetailsService.loadUserByUsername(email);

                // 6. Check account status
                if (!userDetails.isEnabled()) {

                    unauthorized(response);
                    return;
                }

                // 7. Create authentication object
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request)
                );

                // 8. Store authentication
                SecurityContextHolder.getContext()
                        .setAuthentication(authentication);
            }

        } catch (JwtException |
                 IllegalArgumentException |
                 UsernameNotFoundException ex) {

            unauthorized(response);
            return;
        }

        // 9. Continue processing request
        filterChain.doFilter(request, response);
    }

    private void unauthorized(HttpServletResponse response)
            throws IOException {

        SecurityContextHolder.clearContext();

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");

        response.getWriter().write(
                "{\"status\":401,\"message\":\"Invalid or expired token\"}"
        );
    }
}