package com.smartstock.backend.config;

import com.smartstock.backend.security.CustomUserDetailsService;
import com.smartstock.backend.security.JwtAuthenticationFilter;
import com.smartstock.backend.security.JwtService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

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

                .cors(Customizer.withDefaults())

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

                        .requestMatchers(
                                "/api/categories",
                                "/api/categories/**"
                        ).authenticated()

                        .requestMatchers(
                                "/api/suppliers",
                                "/api/suppliers/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                "/api/products",
                                "/api/products/**"
                        ).authenticated()

                        .requestMatchers(
                                "/api/inventory",
                                "/api/inventory/**"
                        ).hasAnyRole("ADMIN", "STAFF")

                        .requestMatchers(
                                "/api/orders",
                                "/api/orders/**"
                        ).authenticated()

                        .requestMatchers(
                                "/api/dashboard",
                                "/api/dashboard/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/users/me"
                        ).authenticated()

                        .requestMatchers(
                                "/api/users",
                                "/api/users/**"
                        ).hasRole("ADMIN")

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

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();

        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        );
        configuration.setAllowedHeaders(
                List.of("Authorization", "Content-Type")
        );
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);

        return source;
    }
}