package com.smartstock.backend.service;

import com.smartstock.backend.dto.RegisterRequest;
import com.smartstock.backend.dto.RegisterResponse;
import com.smartstock.backend.entity.Role;
import com.smartstock.backend.entity.User;
import com.smartstock.backend.enums.RoleName;
import com.smartstock.backend.exception.DuplicateResourceException;
import com.smartstock.backend.repository.RoleRepository;
import com.smartstock.backend.repository.UserRepository;
import com.smartstock.backend.dto.LoginRequest;
import com.smartstock.backend.dto.LoginResponse;
import com.smartstock.backend.exception.InvalidCredentialsException;
import com.smartstock.backend.security.JwtService;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final String dummyPasswordHash;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;

        this.dummyPasswordHash =
                passwordEncoder.encode(java.util.UUID.randomUUID().toString());
    }

    public RegisterResponse register(RegisterRequest request) {

        // 1. Normalize email
        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        // 2. Check duplicate email
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException(
                    "Email already registered");
        }

        // 3. Validate BCrypt password byte limit
        if (request.getPassword()
                .getBytes(StandardCharsets.UTF_8).length > 72) {

            throw new IllegalArgumentException(
                    "Password must not exceed 72 bytes");
        }

        // 4. Retrieve CUSTOMER role
        Role role = roleRepository.findByName(RoleName.CUSTOMER)
                .orElseThrow(() -> new IllegalStateException(
                        "CUSTOMER role not found"));

        // 5. Create User object
        User user = new User();

        user.setName(request.getName().trim());
        user.setEmail(email);

        // 6. Hash password
        user.setPasswordHash(
                passwordEncoder.encode(request.getPassword())
        );

        // 7. Assign role and account status
        user.setRole(role);
        user.setEnabled(true);

        // 8. Save user
        User savedUser;

        try {
            savedUser = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {

            if (userRepository.existsByEmail(email)) {
                throw new DuplicateResourceException(
                        "Email already registered");
            }

            throw ex;
        }

        // 9. Return response DTO
        return new RegisterResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                RoleName.CUSTOMER.name(),
                "Registration successful"
        );
    }
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {

        // 1. Normalize email
        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        // 2. Validate BCrypt byte limit
        if (request.getPassword()
                .getBytes(StandardCharsets.UTF_8).length > 72) {

            throw new InvalidCredentialsException(
                    "Invalid email or password");
        }

        // 3. Find user
        User user = userRepository.findByEmail(email)
                .orElse(null);

        // 4. Verify password
        String hash = user == null
                ? dummyPasswordHash
                : user.getPasswordHash();

        boolean passwordMatches = passwordEncoder.matches(
                request.getPassword(),
                hash
        );

        // 5. Validate credentials and account status
        if (user == null || !passwordMatches || !user.isEnabled()) {

            throw new InvalidCredentialsException(
                    "Invalid email or password");
        }

        // 6. Generate JWT
        String token = jwtService.generateToken(user);

        // 7. Return login response
        return new LoginResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().getName().name()
        );
    }
}