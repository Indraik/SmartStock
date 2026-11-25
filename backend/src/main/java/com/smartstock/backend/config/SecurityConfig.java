package com.smartstock.backend.config;

import com.smartstock.backend.security.CustomUserDetailsService;
import com.smartstock.backend.security.JwtAuthenticationFilter;
import com.smartstock.backend.security.JwtService;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtService jwtService,
            CustomUserDetailsService userDetailsService)
            throws Exception {

        JwtAuthenticationFilter jwtFilter =
                new JwtAuthenticationFilter(
                        jwtService,
                        userDetailsService
                );

        http

                .csrf(AbstractHttpConfigurer::disable)

                .sessionManagement(session -> session
                        .sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/auth/register",
                                "/api/auth/login"
                        ).permitAll()

                        .requestMatchers("/api/test/**")
                        .authenticated()

                        .anyRequest().denyAll()
                )

                .exceptionHandling(ex -> ex

                        .authenticationEntryPoint(
                                (request, response, exception) -> {

                                    response.setStatus(401);
                                    response.setContentType(
                                            "application/json");

                                    response.getWriter().write(
                                            "{\"status\":401,\"message\":\"Authentication required\"}"
                                    );
                                }
                        )

                        .accessDeniedHandler(
                                (request, response, exception) -> {

                                    response.setStatus(403);
                                    response.setContentType(
                                            "application/json");

                                    response.getWriter().write(
                                            "{\"status\":403,\"message\":\"Access denied\"}"
                                    );
                                }
                        )
                )

                .httpBasic(AbstractHttpConfigurer::disable)

                .formLogin(AbstractHttpConfigurer::disable)

                .addFilterBefore(
                        jwtFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}